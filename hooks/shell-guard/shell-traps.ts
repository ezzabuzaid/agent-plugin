// Shell traps that a machine can see in a Bash or Monitor command. Each check
// was measured against 45 days of real commands: under about 1 hit in 10 on good
// code. Word splitting, unmatched globs and `=word` have no check here: the agent shell
// removes them with SH_WORD_SPLIT, NO_NOMATCH and NO_EQUALS (agent-shell.zsh, beside this file).
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import {
	HEREDOC_BODY,
	redirection,
	splitSegments,
	splitWithDelimiters,
	tokenizeSegment,
	trimQuotes,
	withoutDataHeredocs,
	zshWalk,
	type Delimiter,
	type ZshContext,
} from './shell-lex.ts';

export interface ShellCommand {
	command: string;
	tool: 'Bash' | 'Monitor';
	// The folder the session runs the command in, from the hook input.
	cwd: string;
}

// ---- zsh reads the text differently from bash ------------------------------

// zsh (the Bash tool's shell) reads `$p:l…` as `$p` with the `:l` (lowercase)
// modifier, `:t` as tail, `:h` as head, and so on: `nx run $p:lint` runs
// `nx run <p>int`, and a loop over projects prints nothing, which looks like a
// clean run. Braces end the name (`${p}:lint`). Single quotes, `\$` and a heredoc
// with a quoted delimiter do not expand. Only these letters are modifiers of a
// parameter in zsh 5.9; after any other letter (`$p:build`, `$c:packages`) the
// colon and the word stay as written. `g`, `f` and `w` act only before a
// modifier (`$p:generate` is `:ge`), and `F` only before a delimiter.
const ZSH_MODIFIER = /^(?:[fgw]?[aAcehlPqQrstu]|F[^A-Za-z0-9\s])/;

function modifiedVariable(command: string): string | null {
	const text = command.replace(
		/<<-?\s*(['"])([A-Za-z_][A-Za-z0-9_]*)\1[^\n]*\n[\s\S]*?\n[ \t]*\2[ \t]*(?=\n|$)/g,
		'',
	);
	let found: { name: string; suffix: string; modifier: string } | null = null;
	zshWalk(text, (i) => {
		if (found || text[i] !== '$') return;
		const match = text.slice(i).match(/^\$([A-Za-z_][A-Za-z0-9_]*|[0-9]):([A-Za-z]\S*)/);
		const modifier = match?.[2].match(ZSH_MODIFIER)?.[0];
		if (match && modifier)
			found = {
				name: match[1],
				suffix: match[2].match(/^[A-Za-z][\w.-]*/)?.[0] ?? match[2],
				modifier,
			};
	});
	if (!found) return null;
	const { name, suffix, modifier } = found as { name: string; suffix: string; modifier: string };
	return `Blocked: zsh reads \`$${name}:${suffix}\` as \`$${name}\` with the \`:${modifier}\` modifier, so the value changes before the command runs. Write \`\${${name}}:${suffix}\`.`;
}

// zsh keeps `status` for the last exit code and makes it read-only, and ties
// `path` to PATH: assigning either fails, or makes later commands "not found".
// Only shell assignments count: a word before the command, a name given to
// local/typeset/declare/export/readonly/integer/float, a `for`/`select` loop
// variable, and a name that `read` fills. An argument (`echo status=x`), quoted
// text and a heredoc body are not assignments.
const ZSH_RESERVED = new Set(['status', 'path']);
const DECLARATIONS = new Set(['local', 'typeset', 'declare', 'export', 'readonly', 'integer', 'float']);

function reservedAssignmentName(command: string): string | null {
	const reserved = (name: string | undefined) => (name && ZSH_RESERVED.has(name) ? name : null);
	for (const segment of splitSegments(command.replace(HEREDOC_BODY, '$1'))) {
		const raw = tokenizeSegment(segment);
		let i = 0;
		while (
			i < raw.length &&
			(/^(?:if|then|else|elif|do|while|until|time|!|\{|\()$/.test(raw[i]) || /^[A-Za-z_]\w*\(\)$/.test(raw[i]))
		)
			i += 1;
		for (; i < raw.length; i += 1) {
			const name = raw[i].match(/^([A-Za-z_]\w*)(?:\[[^\]]*\])?\+?=/)?.[1];
			if (!name) break;
			if (reserved(name)) return name;
		}
		const [word, ...rest] = raw.slice(i);
		if (word === undefined) continue;
		if (DECLARATIONS.has(word)) {
			for (const token of rest) {
				const hit = reserved(token.match(/^([A-Za-z_]\w*)(?:=|$)/)?.[1]);
				if (hit) return hit;
			}
			continue;
		}
		if (word === 'for' || word === 'select') {
			const hit = reserved(rest[0]);
			if (hit) return hit;
			continue;
		}
		if (word !== 'read') continue;
		for (let j = 0; j < rest.length; j += 1) {
			const token = rest[j];
			if (redirection(token)) break;
			if (token === '-d' || token === '-u') {
				j += 1;
				continue;
			}
			if (token.startsWith('-')) continue;
			const hit = reserved(token.split('?')[0]);
			if (hit) return hit;
		}
	}
	return null;
}

function reservedAssignment(command: string): string | null {
	const name = reservedAssignmentName(command);
	if (!name) return null;
	return name === 'status'
		? 'Blocked: zsh keeps `status` for the last exit code and makes it read-only, so this assignment fails. Use another name, such as `run_state`.'
		: 'Blocked: zsh ties `path` to PATH, so this assignment replaces PATH and the commands after it are not found. Use another name, such as `file_path`.';
}

// Takes each heredoc body out of the text, with the operator found by the walker,
// so an apostrophe in a body cannot flip the quote state and a "<<EOF" inside
// quotes is not an operator. HEREDOC_BODY misses `<<\EOF` and `<<'A-B'`.
const HEREDOC_OPERATOR = /^<<-?[ \t]*(?:'([^'\n]+)'|"([^"\n]+)"|\\([^\s;|&()<>]+)|([^\s;|&()<>'"\\]+))/;

function parseHeredocs(command: string): { text: string; bodies: { quoted: boolean; body: string }[] } {
	let text = command;
	const bodies: { quoted: boolean; body: string }[] = [];
	if (!text.includes('<<')) return { text, bodies };
	let from = 0;
	for (;;) {
		let operatorAt = -1;
		zshWalk(text, (i, context) => {
			if (operatorAt !== -1 || i < from || context !== 'unquoted' || text[i] !== '<') return;
			if (text[i + 1] !== '<' || text[i + 2] === '<' || text[i - 1] === '<') return;
			if (HEREDOC_OPERATOR.test(text.slice(i, i + 200))) operatorAt = i;
		});
		if (operatorAt === -1) return { text, bodies };
		const match = text.slice(operatorAt, operatorAt + 200).match(HEREDOC_OPERATOR)!;
		const delimiter = match[1] ?? match[2] ?? match[3] ?? match[4];
		const stripsTabs = match[0].startsWith('<<-');
		const lineEnd = text.indexOf('\n', operatorAt);
		from = operatorAt + match[0].length;
		if (lineEnd === -1) continue;
		let cursor = lineEnd + 1;
		let close = -1;
		let closeEnd = text.length;
		while (cursor <= text.length) {
			let end = text.indexOf('\n', cursor);
			if (end === -1) end = text.length;
			const line = text.slice(cursor, end);
			if ((stripsTabs ? line.replace(/^\t+/, '') : line) === delimiter) {
				close = cursor;
				closeEnd = end;
				break;
			}
			if (end === text.length) break;
			cursor = end + 1;
		}
		bodies.push({ quoted: match[4] === undefined, body: text.slice(lineEnd + 1, close === -1 ? text.length : close) });
		text = text.slice(0, lineEnd) + text.slice(closeEnd);
	}
}

// One entry per character: its context, or undefined when the shell does not read
// it there (quoted text, a backslash pair, a comment). `edges` holds where a $( )
// opens and closes.
interface Contexts {
	at: (ZshContext | undefined)[];
	edges: Set<number>;
}

function contexts(text: string): Contexts {
	const at = new Array<ZshContext | undefined>(text.length);
	const edges = new Set<number>();
	zshWalk(
		text,
		(i, context) => {
			at[i] = context;
		},
		(i) => edges.add(i),
	);
	return { at, edges };
}

// Unquoted backticks are the same command substitution that $( ) is, so only the
// double-quoted form and the unquoted heredoc run text by accident. 2026-10-26: a
// backlog description ran a production `docker logs` that had just been denied.
function backtick(command: string): string | null {
	const { text, bodies } = parseHeredocs(command);
	for (const { quoted, body } of bodies) {
		if (!quoted && /(^|[^\\])(\\\\)*`/.test(body))
			return "Blocked: in an unquoted heredoc (<<EOF) zsh runs each `...` as a command before cat or the program reads the text. Quote the delimiter: <<'EOF'. If you do need a value in the text, use $( ) and escape every backtick as \\`.";
	}
	if (!text.includes('`')) return null;
	let hit = false;
	zshWalk(text, (i, context) => {
		if (context === 'double' && text[i] === '`') hit = true;
	});
	return hit
		? 'Blocked: inside double quotes zsh runs each `...` as a command, and the text then holds its output. For text with code spans, use single quotes, or D=$(cat <<\'EOF\' on one line, the text, then EOF and ) on their own lines. If you meant to run it, use "$( )".'
		: null;
}

function pipestatus(command: string): string | null {
	if (!command.includes('PIPESTATUS')) return null;
	const { text, bodies } = parseHeredocs(command);
	const reason =
		'Blocked: PIPESTATUS is bash; in zsh it is always empty, so the check reads as success. Write $pipestatus[1] (1-based), or set -o pipefail. In a bash script, use a quoted heredoc so that zsh does not expand it first.';
	if (bodies.some(({ quoted, body }) => !quoted && /(^|[^\\])\$(\{#?)?PIPESTATUS\b/.test(body))) return reason;
	const { at } = contexts(text);
	for (const match of text.matchAll(/\$(?:\{#?)?PIPESTATUS\b/g)) {
		if (at[match.index] !== undefined) return reason;
	}
	return null;
}

function segmentStart(text: string, { at, edges }: Contexts, i: number): number {
	let j = i;
	while (j > 0) {
		if (at[j - 1] === 'unquoted' && /[;|&\n(]/.test(text[j - 1])) break;
		if (edges.has(j - 1) && text[j - 1] === '(') break;
		j -= 1;
	}
	return j;
}

function segmentEnd(text: string, { at, edges }: Contexts, i: number): number {
	let j = i;
	while (j < text.length) {
		if (at[j] === 'unquoted' && /[;|&\n)]/.test(text[j])) break;
		if (edges.has(j) && text[j] === ')') break;
		j += 1;
	}
	return j;
}

// sed here is BSD. A wrapper may run it locally; `ssh host sed` runs it elsewhere.
const SED_WRAPPERS = new Set(['sudo', 'env', 'command', 'time', 'nice', 'exec', 'xargs', 'find', 'fd', 'gtimeout', 'timeout', 'caffeinate', 'nohup']);
const SHELL_KEYWORDS = /^(?:if|then|else|elif|do|while|until|!|\{|\(|time)$/;
const sedWords = (segment: string) => segment.match(/(?:[^\s"'\\]+|'[^']*'|"([^"\\]|\\.)*"|\\.)+/g) ?? [];

function sedInPlace(command: string): string | null {
	if (!/\bsed\b/.test(command) || !/-[A-Za-z]*i|--in-place/.test(command)) return null;
	const { text } = parseHeredocs(command);
	const ctx = contexts(text);
	const reason =
		"Blocked: sed here is BSD, and -i takes the next word as the backup suffix, so the script is lost. Write `sed -i '' 's/a/b/' file` (or `-i.bak`). A remote Linux host still takes GNU form inside the quoted ssh command.";
	for (const match of text.matchAll(/(?:^|[^\w./-])((?:\/usr\/bin\/)?sed)(?=\s)/g)) {
		const i = match.index + match[0].length - match[1].length;
		if (ctx.at[i] !== 'unquoted') continue;
		const before = sedWords(text.slice(segmentStart(text, ctx, i), i)).filter(
			(word) => !SHELL_KEYWORDS.test(word) && !/^[A-Za-z_]\w*=/.test(word),
		);
		if (before.length > 0 && !SED_WRAPPERS.has(before[0].split('/').at(-1)!)) continue;
		if (before[0] === 'find' && !before.some((word) => word === '-exec' || word === '-execdir' || word === '-ok')) continue;
		const words = sedWords(text.slice(i + match[1].length, segmentEnd(text, ctx, i)));
		for (let k = 0; k < words.length; k += 1) {
			const word = words[k];
			if (word === '-e' || word === '-f') {
				k += 1;
				continue;
			}
			if (word.startsWith('--in-place')) return reason;
			if (!word.startsWith('-')) break;
			if (/^-[A-Za-z]*i(?:''|"")$/.test(word)) return reason; // -i'' is -i: zsh drops the empty quotes
			if (!/^-[A-Za-z]*i$/.test(word)) continue;
			const next = words[k + 1];
			if (next === undefined || next === "''" || next === '""') return null;
			if (next.startsWith('-')) return reason; // -i -e makes a backup named file-e
			const bare = !/^['"]/.test(next);
			if (bare && !/[/;\s]/.test(next) && !/^\d/.test(next) && !/^\$\w*[a-z]$/.test(next) && !next.startsWith('$')) return null; // a suffix: -i .bak
			if (/^["']?\$\{?\w+\}?["']?$/.test(next) && words[k + 2] && /^['"].*[/]/.test(words[k + 2])) return null; // a variable suffix, then the script
			return reason;
		}
	}
	return null;
}

// The wrapper sets NO_BARE_GLOB_QUAL and NO_EXTENDED_GLOB, so a qualifier is plain
// pattern text: the word matches nothing and reaches the command, or a loop, as is.
const QUALIFIER = /^[-./@=p%*rwxAIERWXsStfugUGoOnLlmacdNDFMTY^:\[\],+0-9]+$/;

function optionSetBefore(text: string, { at }: Contexts, i: number, option: string): boolean {
	for (const match of text.slice(0, i).matchAll(/(?:^|[\s;|&(])(setopt|unsetopt|emulate)\b([^;|&\n]*)/g)) {
		if (at[match.index + match[0].indexOf(match[1])] !== 'unquoted') continue;
		if (match[1] === 'emulate') return true;
		const words = match[2].toLowerCase().replaceAll('_', '').split(/\s+/).filter(Boolean);
		// `unsetopt noX` turns X on, as `setopt X` does.
		if (words.includes(match[1] === 'setopt' ? option : `no${option}`)) return true;
	}
	return false;
}

function bareQualifier(command: string): string | null {
	if (!command.includes('(')) return null;
	const { text } = parseHeredocs(command);
	const ctx = contexts(text);
	const isBreak = (j: number) => ctx.at[j] === 'unquoted' && /[\s;|&()<>]/.test(text[j]);
	const remedy = 'the word matches nothing, and a loop runs once on the literal pattern. Use find <dir> -maxdepth 1, or ls -A <dir> | while read -r n.';
	for (let i = 1; i < text.length; i += 1) {
		if (text[i] !== '(' || ctx.at[i] !== 'unquoted') continue;
		if (isBreak(i - 1) || ctx.at[i - 1] === undefined) continue;
		let start = i;
		while (start > 0 && !isBreak(start - 1) && !(ctx.edges.has(start - 1) && text[start - 1] === '(')) start -= 1;
		const prefix = text.slice(start, i);
		let globbed = false;
		for (let j = start; j < i; j += 1) if (ctx.at[j] === 'unquoted' && /[*?\]]/.test(text[j])) globbed = true;
		if (!globbed || /^[A-Za-z_][\w]*(\[.*\])?\+?=/.test(prefix)) continue;
		const close = text.indexOf(')', i);
		if (close === -1) continue;
		if (close + 1 < text.length && !/[\s;|&)<>]/.test(text[close + 1])) continue;
		const qualifier = text.slice(i + 1, close);
		if (qualifier.startsWith('#q')) {
			if (optionSetBefore(text, ctx, i, 'extendedglob')) continue;
			return `Blocked: \`${prefix}(${qualifier})\` needs extendedglob, which is off here, so ${remedy}`;
		}
		if (!QUALIFIER.test(qualifier) || optionSetBefore(text, ctx, i, 'bareglobqual')) continue;
		return `Blocked: the Bash tool's zsh runs with NO_BARE_GLOB_QUAL, so \`(${qualifier})\` in \`${prefix}(${qualifier})\` is not a glob qualifier: ${remedy}`;
	}
	return null;
}

// ---- finding commands in the text ------------------------------------------

const unquote = (word: string) => word.replace(/^(['"])(.*)\1$/s, '$2');
const shellWords = (simple: string) => simple.match(/(?:[^\s"'\\]+|\\.|'[^']*'|"(?:[^"\\]|\\.)*")+/g) ?? [];
// Shell keywords after which a command starts.
const KEYWORDS = new Set(['do', 'then', 'else', 'elif', 'if', 'while', 'until', '!', '{']);

function openPositions(text: string, ...kinds: ZshContext[]): Set<number> {
	const open = new Set<number>();
	zshWalk(text, (i, context) => {
		if (kinds.includes(context)) open.add(i);
	});
	return open;
}

// A word that runs the command after its own options, as its synopsis gives them:
// `flags` take no value, `values` take the rest of the cluster or the next word, `long`
// are whole words that take no value, `longValues` take `=value` or the next word, and
// `operands` reads what stands between the options and the command. `path` is true for a
// program, which a path such as /usr/bin/time also names.
interface Wrapper {
	flags: string;
	values: string;
	long: string[];
	longValues: string[];
	operands: (words: string[], i: number) => number | null;
	path: boolean;
}

const noOperands = (_words: string[], i: number) => i;
const assignments = (pattern: RegExp) => (words: string[], i: number) => {
	let j = i;
	while (j < words.length && pattern.test(unquote(words[j]))) j += 1;
	return j;
};
const DURATION = /^(?:\d+(?:\.\d+)?[smhd]?|\$\{?[A-Za-z_]\w*\}?)$/;
const duration = (words: string[], i: number) => (i < words.length && DURATION.test(unquote(words[i])) ? i + 1 : null);
const plain = (path: boolean): Wrapper => ({ flags: '', values: '', long: [], longValues: [], operands: noOperands, path });
// zsh's precommand modifiers and its `time` keyword run a builtin such as cd in this shell.
const PRECOMMANDS: [string, Wrapper][] = [
	['command', { flags: 'p', values: '', long: [], longValues: [], operands: noOperands, path: false }],
	['builtin', plain(false)],
	['noglob', plain(false)],
	['nocorrect', plain(false)],
];
const SHELL_PRECOMMANDS = new Map<string, Wrapper>([...PRECOMMANDS, ['time', plain(false)]]);
// GNU and BSD timeout. Options that change the folder or the search path (env -C, env -P,
// sudo -D) are left out, so the command after them is not read. xargs is left out too:
// stdin adds operands to its command, so the text does not hold the call.
const timeout: Wrapper = { flags: 'fpv', values: 'ks', long: ['--foreground', '--preserve-status', '--verbose'], longValues: ['--kill-after', '--signal'], operands: duration, path: true };
const WRAPPERS = new Map<string, Wrapper>([
	...PRECOMMANDS,
	['exec', { flags: 'cl', values: 'a', long: [], longValues: [], operands: noOperands, path: false }],
	// The zsh keyword, and /usr/bin/time with its options.
	['time', { flags: 'alhp', values: 'o', long: [], longValues: [], operands: noOperands, path: true }],
	['timeout', timeout],
	['gtimeout', timeout],
	['nice', { flags: '', values: 'n', long: [], longValues: [], operands: noOperands, path: true }],
	['env', { flags: 'iv', values: 'u', long: ['-', '--ignore-environment'], longValues: ['--unset'], operands: assignments(/^[^=]+=/), path: true }],
	['caffeinate', { flags: 'dimsu', values: 'tw', long: [], longValues: [], operands: noOperands, path: true }],
	['nohup', plain(true)],
	['sudo', { flags: 'AbEHiknPSs', values: 'CghpRTUu', long: [], longValues: [], operands: assignments(/^[A-Za-z_]\w*=/), path: true }],
]);

// The index after the wrapper at `i` and its options, or null when `words[i]` is no
// wrapper or its words do not fit the synopsis.
function afterWrapper(words: string[], i: number, wrappers: ReadonlyMap<string, Wrapper>): number | null {
	const name = words[i].split('/').at(-1)!;
	const wrapper = wrappers.get(name);
	if (wrapper === undefined || (name !== words[i] && !wrapper.path)) return null;
	let j = i + 1;
	for (; j < words.length; j += 1) {
		const word = unquote(words[j]);
		if (word === '--') {
			j += 1;
			break;
		}
		if (wrapper.long.includes(word)) continue;
		if (word.startsWith('--')) {
			if (!wrapper.longValues.includes(word.split('=')[0])) return null;
			if (!word.includes('=')) j += 1;
			continue;
		}
		if (!/^-./.test(word)) break;
		for (let k = 1; k < word.length; k += 1) {
			if (wrapper.values.includes(word[k])) {
				if (k === word.length - 1) j += 1;
				break;
			}
			if (!wrapper.flags.includes(word[k])) return null;
		}
	}
	return wrapper.operands(words, j);
}

// Whether `words` from `from` on are wrappers, each with its options, and nothing else.
function onlyWrappers(words: string[], from: number, wrappers: ReadonlyMap<string, Wrapper>): boolean {
	let i: number | null = from;
	while (i !== null && i < words.length) i = afterWrapper(words, i, wrappers);
	return i === words.length;
}

// A chain of wrappers is a few words long, so a command is looked for this far back.
const WRAPPER_WORDS = 16;

// Where a command named `name` starts: read by the shell, first word of a command or the
// command that a chain of `wrappers` runs, after the start, a keyword or an assignment.
function commandStarts(text: string, name: string, wrappers: ReadonlyMap<string, Wrapper>): number[] {
	const { at, edges } = contexts(text);
	const open = (i: number) => at[i] === 'unquoted' || at[i] === 'test';
	const starts = (i: number) => (open(i) && /[;&|(\n`]/.test(text[i])) || (edges.has(i) && text[i] === '(');
	const positions: number[] = [];
	for (const match of text.matchAll(new RegExp(`(?<![\\w./=-])${name}(?![\\w./-])`, 'g'))) {
		if (!open(match.index)) continue;
		let start = match.index;
		while (start > 0 && !starts(start - 1)) start -= 1;
		const words = shellWords(text.slice(start, match.index));
		for (let k = Math.max(0, words.length - WRAPPER_WORDS); k <= words.length; k += 1) {
			const after = k === 0 || KEYWORDS.has(words[k - 1]) || /^[A-Za-z_]\w*=/.test(words[k - 1]);
			if (after && onlyWrappers(words, k, wrappers)) {
				positions.push(match.index);
				break;
			}
		}
	}
	return positions;
}

// A program such as npm or ln runs after any wrapper.
const commandPositions = (text: string, name: string) => commandStarts(text, name, WRAPPERS);
// A builtin such as cd changes this shell only when no program wraps it.
const builtinPositions = (text: string, name: string) => commandStarts(text, name, SHELL_PRECOMMANDS);

// The simple command that starts at `at`: up to an unquoted ; & | newline or the ) that closes it.
function simpleCommand(text: string, at: number): string {
	const open = openPositions(text, 'unquoted');
	let depth = 0;
	for (let i = at; i < text.length; i += 1) {
		const ch = text[i];
		if (text.startsWith('$(', i)) {
			depth += 1;
			i += 1;
			continue;
		}
		if (ch === '(') {
			if (open.has(i)) depth += 1;
			continue;
		}
		if (ch === ')') {
			if (depth === 0 && open.has(i)) return text.slice(at, i);
			if (depth > 0) depth -= 1;
			continue;
		}
		if (depth > 0 || !open.has(i)) continue;
		if (';|\n`'.includes(ch)) return text.slice(at, i);
		if (ch === '&' && text[i - 1] !== '>' && text[i + 1] !== '>') return text.slice(at, i);
	}
	return text.slice(at);
}

// ---- process control --------------------------------------------------------

// pgrep skips itself and its ancestors, so a lone watcher ends. It still matches
// every other shell that holds the text: a retry, a peer session, a forked sibling.
// Two such watchers keep each other alive for ever (28 hours on 2026-11-07/08, 9.5
// hours on 2026-11-06/07, both from foreground calls that the harness moved to the
// background). So the tool and the background flag do not matter here.
type LoopSpan = { keyword: string; start: number; end: number };

function loopSpans(text: string): LoopSpan[] {
	const open = openPositions(text, 'unquoted', 'test');
	const spans: LoopSpan[] = [];
	const stack: { keyword: string; at: number }[] = [];
	for (const match of text.matchAll(/(?<![\w./=-])(while|until|for|repeat|done)(?![\w./=-])/g)) {
		if (!open.has(match.index)) continue;
		const before = text.slice(0, match.index).replace(/[ \t]+$/, '');
		if (before !== '' && !/[;&|(\n`{]$/.test(before) && !/(?:^|\s)(do|then|else|!)$/.test(before)) continue;
		if (match[1] === 'done') {
			const opened = stack.pop();
			if (opened) spans.push({ keyword: opened.keyword, start: opened.at, end: match.index });
		} else stack.push({ keyword: match[1], at: match.index });
	}
	for (const { keyword, at } of stack) spans.push({ keyword, start: at, end: text.length });
	return spans;
}

const waitLoops = (text: string) => loopSpans(text).filter(({ keyword }) => keyword === 'while' || keyword === 'until');

const PGREP_VALUE_FLAGS = new Set(['-d', '-F', '-G', '-g', '-J', '-M', '-N', '-P', '-t', '-U', '-u', '-L']);

function pgrepCall(simple: string): { flags: string; pattern: string | undefined } {
	const words = shellWords(simple).slice(1);
	let flags = '';
	let pattern: string | undefined;
	for (let i = 0; i < words.length; i += 1) {
		const word = words[i];
		if (/^\d?>|^</.test(word)) {
			if (/^\d?>&?$|^<$/.test(word)) i += 1;
			continue;
		}
		if (word.startsWith('-') && word.length > 1 && pattern === undefined) {
			flags += word.slice(1);
			if (PGREP_VALUE_FLAGS.has(word)) i += 1;
			continue;
		}
		pattern ??= word;
	}
	return { flags, pattern };
}

function pgrepWatcher(command: string): string | null {
	const text = withoutDataHeredocs(command);
	if (!text.includes('pgrep')) return null;
	const spans = waitLoops(text);
	if (spans.length === 0) return null;
	for (const at of commandPositions(text, 'pgrep')) {
		const { flags, pattern } = pgrepCall(simpleCommand(text, at));
		if (!flags.includes('f') || pattern === undefined) continue;
		if (!spans.some(({ start, end }) => at > start && at < end)) continue;
		let source = unquote(pattern);
		const variable = source.match(/^\$\{?([A-Za-z_]\w*)\}?$/);
		if (variable) {
			const assigned = text.match(new RegExp(`(?:^|[\\s;&])${variable[1]}=(?:"([^"]*)"|'([^']*)'|(\\S+))`));
			if (!assigned) continue;
			source = assigned[1] ?? assigned[2] ?? assigned[3];
		}
		let matcher: RegExp;
		try {
			matcher = new RegExp(source);
		} catch {
			continue;
		}
		if (matcher.test(command))
			return "Blocked: this loop waits on a `pgrep -f` pattern that matches its own text, so a second such shell keeps it alive for ever. Wait on the PID (`while kill -0 <pid> 2>/dev/null; do sleep 5; done`), or with no PID bracket one letter: `pgrep -f '[n]x run a:test'`.";
	}
	return null;
}

const KILL_BY_PATTERN =
	"Blocked: this kill picks targets by a pattern, so it can hit other sessions' runs and any shell holding that text. List them with `pgrep -fl <pattern>`, then run `kill <pids you started>` in its own call (for children of your own PID use `pgrep -P <pid>`).";

// kill -0 and kill -s 0 are probes.
function killProbe(words: string[]): boolean {
	const [first, second] = words.slice(1).map(unquote);
	return first === '-0' || (first === '-s' && second === '0');
}

// A pgrep or ps|grep source selects by name. `pgrep -P` selects children, `pgrep -x`
// one exact name, `ps -p` the PIDs given, and a `$`-anchored pattern one executable
// with no arguments, which no shell text matches.
function selectsByPattern(source: string): boolean {
	for (const match of source.matchAll(/(?<![\w./-])pgrep\s+([^|;&)]*)/g)) {
		if (/\$['"]?\s*$/.test(match[1])) continue;
		if (/(^|\s)-[a-zA-Z]*f/.test(match[1]) || !/(^|\s)-[a-zA-Z]*[Px]/.test(match[1])) return true;
	}
	const ps = source.match(/(?<![\w./-])ps\b([^|;&)]*)\|[^;&)]*\bgrep\b/);
	return ps !== null && !/(^|\s)-p\b/.test(ps[1]);
}

// The text of the substitution that opens at `open` ("$(" or a backtick), balanced.
function substitutionAt(text: string, open: number): string {
	if (text[open] === '`') {
		const end = text.indexOf('`', open + 1);
		return text.slice(open + 1, end < 0 ? text.length : end);
	}
	let depth = 1;
	let quote: string | null = null;
	for (let i = open + 2; i < text.length; i += 1) {
		const ch = text[i];
		if (quote) {
			if (ch === quote && text[i - 1] !== '\\') quote = null;
			continue;
		}
		if (ch === '"' || ch === "'") quote = ch;
		else if (ch === '(') depth += 1;
		else if (ch === ')') {
			depth -= 1;
			if (depth === 0) return text.slice(open + 2, i);
		}
	}
	return text.slice(open + 2);
}

// The settings deny `pkill` and `killall`, but a rule cannot see where kill's PIDs
// come from. A literal PID list, and `kill $(lsof -ti:port)`, have one owner.
function killByPattern(command: string): string | null {
	const text = withoutDataHeredocs(command);
	if (!text.includes('kill')) return null;
	for (const at of commandPositions(text, 'kill')) {
		const words = shellWords(simpleCommand(text, at));
		if (killProbe(words)) continue;
		const args = words.slice(1).join(' ');
		if (/\$\(|`/.test(args) && selectsByPattern(args)) return KILL_BY_PATTERN;
		for (const variable of args.matchAll(/\$\{?([A-Za-z_]\w*)\}?/g)) {
			const name = variable[1];
			const assigned = new RegExp(`(?:^|[\\s;&(])${name}=("?)(\\$\\(|\`)`).exec(text);
			if (assigned && selectsByPattern(substitutionAt(text, assigned.index + assigned[0].length - assigned[2].length))) return KILL_BY_PATTERN;
			const loop = text.match(new RegExp(`(?:^|[\\s;&(])for\\s+${name}\\s+in\\s+([^;\\n]*)`));
			if (loop && selectsByPattern(loop[1])) return KILL_BY_PATTERN;
			const piped = text.match(new RegExp(`([^\\n;]*)\\|\\s*while\\s+read\\s+(?:-r\\s+)?${name}\\b`));
			if (piped && selectsByPattern(piped[1])) return KILL_BY_PATTERN;
		}
	}
	for (const at of commandPositions(text, 'xargs')) {
		const words = shellWords(simpleCommand(text, at));
		const killIndex = words.findIndex((word) => unquote(word) === 'kill');
		if (killIndex < 0 || killProbe(words.slice(killIndex))) continue;
		const before = text.slice(Math.max(text.lastIndexOf('\n', at), 0), at);
		if (selectsByPattern(before.slice(Math.max(before.lastIndexOf(';'), before.lastIndexOf('&&')) + 1))) return KILL_BY_PATTERN;
	}
	return null;
}

// ---- waiting on a release ----------------------------------------------------

// Ezz asked four times (memory no-waiting-on-releases) that an agent never wait on a
// zukhruf release, and agents kept polling npm for one: `until v=$(npm view @zukhruf/x
// version) && [ "$v" != 0.8.43 ]; do sleep 60; done`, `watch -n 60 npm view …`. A while
// or until loop, `watch`, or a for loop that sleeps between its reads is that wait. A
// for loop with no sleep reads each package once.
const REGISTRY_READS = new Set(['view', 'info', 'show', 'v']);

function zukhrufPackage(word: string, text: string): boolean {
	if (word.startsWith('@zukhruf/')) return true;
	const variable = word.match(/^\$\{?([A-Za-z_]\w*)\}?/);
	return variable !== null && new RegExp(`(?:^|[\\s;&(])${variable[1]}=["']?@zukhruf/`).test(text);
}

// `words` starts at npm.
function readsZukhrufRelease(words: string[], text: string): boolean {
	const [subcommand, ...rest] = words.slice(1).map(unquote).filter((word) => !word.startsWith('-'));
	return REGISTRY_READS.has(subcommand ?? '') && rest.some((word) => zukhrufPackage(word, text));
}

// No consumer runs an unreleased package (Ezz, 2026-11-22), so the refusal gives no way to
// try the change in a consumer before npm has it.
const RELEASE_WAIT =
	'Blocked: this polls npm for a zukhruf release, and Ezz has said never to wait on one. Do not wait: the push already releases the package. File the consumer\'s pin as an agent-backlog item with `--published "@zukhruf/<pkg>@>=<next>"`, which wakes the work when npm has it, and go on with other work. See memory no-waiting-on-releases.';

function zukhrufReleaseWait(command: string): string | null {
	const text = withoutDataHeredocs(command);
	if (!text.includes('npm') || !text.includes('@zukhruf/')) return null;
	for (const at of commandPositions(text, 'watch')) {
		// `watch` takes its command as words or as one quoted string.
		const words = shellWords(simpleCommand(text, at)).flatMap((word) => unquote(word).split(/\s+/));
		const npm = words.indexOf('npm');
		if (npm !== -1 && readsZukhrufRelease(words.slice(npm), text)) return RELEASE_WAIT;
	}
	const sleeps = commandPositions(text, 'sleep');
	const waits = loopSpans(text).filter(
		({ keyword, start, end }) => keyword === 'while' || keyword === 'until' || (keyword === 'for' && sleeps.some((at) => at > start && at < end)),
	);
	if (waits.length === 0) return null;
	for (const at of commandPositions(text, 'npm')) {
		if (!waits.some(({ start, end }) => at > start && at < end)) continue;
		if (readsZukhrufRelease(shellWords(simpleCommand(text, at)), text)) return RELEASE_WAIT;
	}
	return null;
}

// ---- commands that hide a failure --------------------------------------------

// A pipe in last position stays allowed: about 334 uses a day, and the failure text
// usually reaches the agent. So does a background run that does not keep its own exit
// code: a blind judge called 29 of 30 such hits good, because whether a failure stays
// visible depends on what the output prints, which the command text cannot show. These
// checks cover what a later step then believes.
type Part = { segment: string; delimiter: Delimiter };

function pipelineParts(command: string): Part[] {
	const text = command
		.replace(HEREDOC_BODY, '$1')
		.replace(/\\\n/g, ' ')
		.replace(/^[ \t]*#.*$/gm, '');
	return splitWithDelimiters(text).filter(({ segment, delimiter }) => !(segment.trim() === '' && delimiter === ';'));
}

const COMMAND_WRAPPERS = new Set(['command', 'exec', 'env', 'time', 'nice', 'nohup', 'builtin', 'do', 'then', 'else', 'elif', 'if', 'while', 'until', '{', '(', '!', 'caffeinate', 'timeout', 'gtimeout', 'npx', 'pnpm', 'yarn', 'bunx']);

// The words of a segment after its wrappers and environment prefixes.
function commandWords(segment: string): string[] {
	const words = tokenizeSegment(segment.trim().replace(/^[({\s]+/, '').replace(/^\w+=\$\(/, '')).map(trimQuotes);
	let i = 0;
	for (; i < words.length; i += 1) {
		const word = words[i];
		if (/^[A-Za-z_]\w*=/.test(word) || COMMAND_WRAPPERS.has(word) || word.startsWith('-')) continue;
		if (/^\d+[smh]?$/.test(word) && words.slice(0, i).some((earlier) => /timeout$/.test(earlier))) continue;
		if (word === 'KILL' || word === 'TERM') continue;
		break;
	}
	return words.slice(i).map((word) => word.split('/').pop()!);
}

function testOrBuild(words: string[]): string | null {
	const [first, second] = words;
	if (first === 'nx') {
		if (['run', 'run-many', 'affected', 'test', 'build', 'lint', 'typecheck', 'e2e'].includes(second)) return 'nx';
		return second && /^[@\w./-]+:[\w:-]+$/.test(second) ? 'nx' : null;
	}
	if (first === 'node' && words.includes('--test')) return 'node --test';
	if (first === 'cargo' && ['test', 'build', 'check', 'clippy', 'nextest', 'run'].includes(second)) return 'cargo';
	if (first === 'gh' && second === 'run' && words[2] === 'watch' && words.includes('--exit-status')) return 'gh run watch';
	return null;
}

function verification(words: string[]): boolean {
	if (testOrBuild(words)) return true;
	const [first, second] = words;
	if (first === 'tsc' || first === 'eslint') return true;
	if (first === 'prettier') return words.includes('--check');
	return first === 'npm' && (second === 'test' || (second === 'run' && /^(test|build|lint|typecheck)/.test(words[2] ?? '')));
}

function gitSubcommand(words: string[]): string | null {
	if (words[0] !== 'git') return null;
	let i = 1;
	while (i < words.length && (words[i].startsWith('-') || words[i - 1] === '-C' || words[i - 1] === '-c')) i += 1;
	return words[i] ?? null;
}

function mutation(words: string[]): string | null {
	const [first, second, third] = words;
	if (first === 'git') {
		const subcommand = gitSubcommand(words);
		return subcommand && ['push', 'commit', 'pull', 'merge', 'rebase'].includes(subcommand) ? `git ${subcommand}` : null;
	}
	if (first === 'gh' && ((second === 'pr' && ['merge', 'create', 'close', 'edit'].includes(third)) || (second === 'release' && third === 'create') || (second === 'workflow' && third === 'run'))) return `gh ${second} ${third}`;
	if (first === 'npm' && second === 'publish') return 'npm publish';
	if (first === 'pulumi' && ['up', 'destroy', 'refresh'].includes(second)) return `pulumi ${second}`;
	if (first === 'gcloud' && words.some((word) => ['deploy', 'create', 'delete', 'update'].includes(word))) return 'gcloud';
	if (first === 'docker' && ['push', 'build', 'compose'].includes(second)) return `docker ${second}`;
	if (first === 'kubectl' && ['apply', 'delete'].includes(second)) return `kubectl ${second}`;
	if (first === 'terraform' && ['apply', 'destroy'].includes(second)) return `terraform ${second}`;
	return null;
}

const textUpTo = (parts: Part[], at: number) => parts.slice(0, at + 1).map(({ segment }) => segment).join(' ; ');
const pipefailEarlier = (text: string) => /(^|[\s;(&|])(set\s+(-\w+\s+)*-?\w*o?\s*pipefail|setopt\s+(\w+\s+)*pipe_?fail|set\s+-\w*o\s+pipefail)/i.test(text);
const readsPipestatus = (text: string) => /pipestatus/i.test(text);

function pipelineEnd(parts: Part[], at: number): number {
	let end = at;
	while (parts[end].delimiter === '|') end += 1;
	return end;
}

const startsPipeline = (parts: Part[], at: number) => parts[at].delimiter === '|' && (at === 0 || parts[at - 1].delimiter !== '|');

function echoStep(segment: string): boolean {
	const word = tokenizeSegment(segment.trim()).map(trimQuotes)[0];
	return word === 'echo' || word === 'printf' || word === ':' || word === 'true';
}

// The first piped test or build, and what follows its pipeline.
function pipedRun(parts: Part[]): { at: number; end: number; runner: string; filter: string[] } | null {
	for (let at = 0; at < parts.length; at += 1) {
		if (!startsPipeline(parts, at)) continue;
		const words = commandWords(parts[at].segment);
		const runner = testOrBuild(words);
		if (!runner || words.includes('--help')) continue;
		if (pipefailEarlier(textUpTo(parts, at))) return null;
		const end = pipelineEnd(parts, at);
		if (readsPipestatus(parts.slice(end + 1).map(({ segment }) => segment).join(' ; '))) return null;
		return { at, end, runner, filter: tokenizeSegment(parts[end].segment).map(trimQuotes) };
	}
	return null;
}

function pipedWatch(command: string): string | null {
	if (!command.includes('|') || !command.includes('--exit-status')) return null;
	if (/\bgh\s+run\s+view\b/.test(command)) return null; // the conclusion is read afterwards
	return pipedRun(pipelineParts(command))?.runner === 'gh run watch'
		? 'Blocked: `--exit-status` exists only for its exit code, and a pipe replaces it. Drop the pipe, or use `gh run view <id> --json status,conclusion`.'
		: null;
}

function gatedOnPipedRun(command: string): string | null {
	if (!command.includes('|') || !/\b(nx|node|cargo|gh)\b/.test(command)) return null;
	const parts = pipelineParts(command);
	const run = pipedRun(parts);
	if (!run || parts[run.end].delimiter !== '&&') return null;
	if (/^(grep|rg|egrep)$/.test(run.filter[0] ?? '')) {
		if (run.filter.some((word) => /^-[a-zA-Z]*q/.test(word) || word === '--quiet')) return null; // grep -q is the test
		const pattern = run.filter.slice(1).filter((word) => !word.startsWith('-')).join(' ');
		if (pattern && !/err|fail|✖|warn/i.test(pattern)) return null; // a match means success: grep is a real gate
	}
	return 'Blocked: a pipe after a test or build hides its exit status, so the `&&` step runs after a failure. Write `cmd > <scratch>/x.log 2>&1 && next`, or put `set -o pipefail;` first and drop any `| head`, which then fails with 141.';
}

const LATER_MUTATION = /^(git\s+(-\S+\s+)*(commit|push|merge|rebase|cherry-pick)\b|agent-backlog\s+(done|close|complete)\b|npm\s+publish\b|gh\s+(pr\s+(merge|create)|release\s+create)\b|pulumi\s+(up|destroy)\b|nx\s+release\b)/;
const SUCCESS_ECHO = /^(echo|printf|print)\b.*\b(pushed|committed|merged|deployed|released|published|done|ok|success\w*|landed)\b/i;

// A piped `git commit` before `&&` is the git guard's own `piped-commit` reason.
function gatedOnPipedMutation(command: string): string | null {
	if (!command.includes('|')) return null;
	const parts = pipelineParts(command);
	for (let at = 0; at < parts.length; at += 1) {
		if (!startsPipeline(parts, at)) continue;
		const words = commandWords(parts[at].segment);
		const changed = mutation(words);
		if (!changed || changed === 'git commit') continue;
		if (words.includes('--dry-run') || (words.includes('-n') && changed.startsWith('git '))) continue;
		if (pipefailEarlier(textUpTo(parts, at))) continue;
		let i = pipelineEnd(parts, at);
		if (readsPipestatus(parts.slice(i + 1).map(({ segment }) => segment).join(' ; '))) continue;
		while (parts[i].delimiter === '&&') {
			i += 1;
			const step = parts[i].segment.trim();
			if (LATER_MUTATION.test(step) || SUCCESS_ECHO.test(step))
				return `Blocked: the pipe hides the exit status of \`${changed}\`, so the next step runs after a failure. Drop the pipe, or put \`set -o pipefail;\` first.`;
			if (parts[i].delimiter === '|') i = pipelineEnd(parts, i);
		}
	}
	return null;
}

const NEXT_MUTATION = /^(git\s+(-\S+\s+)*(commit|push|merge)\b|agent-backlog\s+(done|close|complete)\b|npm\s+publish\b|gh\s+(pr\s+merge|release\s+create)\b)/;

function mutationThenSemicolon(command: string): string | null {
	if (!/\bgit\b/.test(command)) return null;
	const parts = pipelineParts(command);
	for (let at = 0; at < parts.length; at += 1) {
		const words = commandWords(parts[at].segment);
		if (!['commit', 'push', 'merge', 'pull'].includes(gitSubcommand(words) ?? '')) continue;
		if (words.includes('--dry-run') || words.includes('--help')) continue;
		const end = pipelineEnd(parts, at);
		if (parts[end].delimiter === ';' && NEXT_MUTATION.test((parts[end + 1]?.segment ?? '').trim()))
			return 'Blocked: a commit can be refused, and `;` runs the next step anyway. Chain with `&&`, or use one Bash call per commit and read each result.';
	}
	return null;
}

const STARTS_BACKGROUND = /(^|[^&>])&\s*$/;

function commitAfterVerification(command: string): string | null {
	if (!/git\b.*\bcommit\b/s.test(command)) return null;
	const parts = pipelineParts(command);
	for (let at = 1; at < parts.length; at += 1) {
		const words = commandWords(parts[at].segment);
		if (gitSubcommand(words) !== 'commit' || words.includes('--dry-run')) continue;
		let i = at - 1;
		while (i >= 0 && parts[i].delimiter === ';' && echoStep(parts[i].segment)) i -= 1;
		if (i < 0 || parts[i].delimiter !== ';') continue;
		let head = i;
		while (head > 0 && parts[head - 1].delimiter === '|') head -= 1;
		if (!verification(commandWords(parts[head].segment))) continue;
		// A verification sent to the background on purpose runs beside the commit.
		const beside = parts.slice(i, at).some(({ segment }) => STARTS_BACKGROUND.test(segment));
		if (!beside) return 'Blocked: a verification followed by `;` does not stop the commit. Write `verify && git commit …`.';
	}
	return null;
}

function exitAfterPipe(command: string): string | null {
	if (!command.includes('|') || !command.includes('$?')) return null;
	const parts = pipelineParts(command);
	for (let at = 0; at < parts.length; at += 1) {
		if (!startsPipeline(parts, at)) continue;
		const words = commandWords(parts[at].segment);
		if (!testOrBuild(words) && !mutation(words) && !verification(words)) continue;
		const end = pipelineEnd(parts, at);
		if (parts[end].delimiter !== ';' || pipefailEarlier(textUpTo(parts, at))) continue;
		// `$?` inside its own $( ) reads that inner run.
		if ((parts[end + 1]?.segment ?? '').replace(/\$\([^)]*\)/g, '').includes('$?'))
			return 'Blocked: `$?` here is the status of the last filter, not of the run. Write `${pipestatus[1]}`, or redirect to a file.';
	}
	return null;
}

// ---- links into node_modules ---------------------------------------------------

// How an agent consumes a change to another checkout's package (Ezz, 2026-11-22).
const RELEASE_ROUTE =
	'push the package (a push to its main releases it), then `npm install` the published version (`npm view <pkg> version` shows when npm has it)';

// Ezz, 2026-11-02: "Always npm install". npm does not record a link made by hand in
// node_modules, and the next install replaces or removes it. Of 892 past commands that
// run `ln` (24,694 transcripts, to 2026-11-16), this check refuses 33, each a link into
// the node_modules of a checkout. A node_modules in a scratch folder stays open.
const SCRATCH_ROOTS = [process.env.TMPDIR, '/tmp', '/private/tmp', '/var/folders', '/private/var/folders', join(homedir(), '.claude/scratch')]
	.filter((root): root is string => Boolean(root))
	.map((root) => resolve(root));

const inScratch = (folder: string) =>
	`${folder}/`.includes('/scratchpad/') || SCRATCH_ROOTS.some((root) => folder === root || folder.startsWith(`${root}/`));

// The subshell or $( ) around each position, as the index where it opens (-1 for none),
// and the one around each of those. A `cd` or an assignment reaches only the commands
// inside its own subshell.
interface Groups {
	at: number[];
	around: Map<number, number>;
}

function groups(text: string): Groups {
	const at = new Array<number>(text.length).fill(-1);
	const around = new Map<number, number>();
	const stack: { open: number; subshell: boolean }[] = [];
	const innermost = () => stack.findLast(({ subshell }) => subshell)?.open ?? -1;
	const open = (i: number, subshell: boolean) => {
		if (subshell) around.set(i, innermost());
		stack.push({ open: i, subshell });
	};
	zshWalk(
		text,
		(i, context) => {
			at[i] = innermost();
			if (context !== 'unquoted') return;
			if (text[i] === '(') open(i, i === 0 || /[\s;|&(]/.test(text[i - 1]));
			else if (text[i] === ')') stack.pop();
		},
		(i) => (text[i] === '(' ? open(i, true) : stack.pop()),
	);
	return { at, around };
}

function reaches({ at, around }: Groups, from: number, to: number): boolean {
	for (let group = at[to]; group !== -1; group = around.get(group) ?? -1) if (group === at[from]) return true;
	return at[from] === -1;
}

interface Script {
	text: string;
	cwd: string;
	groups: Groups;
	open: Set<number>;
}

// The words of the simple command at `at`, or null when a backtick ends it: the words
// then hold the output of a command.
function wordsAt(text: string, at: number): string[] | null {
	const simple = simpleCommand(text, at);
	return text[at + simple.length] === '`' ? null : shellWords(simple);
}

// The last `name=value` before `at` that reaches it, as its value (null when a backtick
// makes it) and position.
function assignmentBefore({ text, groups: scopes, open }: Script, name: string, at: number): { value: string | null; at: number } | null {
	let found: { value: string | null; at: number } | null = null;
	for (const match of text.matchAll(new RegExp(`(?<=^|[\\s;&|(])${name}=`, 'g'))) {
		if (match.index >= at) break;
		if (!open.has(match.index) || !reaches(scopes, match.index, at)) continue;
		const from = match.index + match[0].length;
		const words = /^[\s;&|)]?$/.test(text.charAt(from)) ? [''] : wordsAt(text, from);
		found = { value: words && (words[0] ?? ''), at: match.index };
	}
	return found;
}

function variable(script: Script, name: string, at: number, pwd: string | null): string | null {
	const assigned = assignmentBefore(script, name, at);
	if (assigned) return assigned.value === null || assigned.value.startsWith('(') ? null : expand(script, assigned.value, assigned.at, folderAt(script, assigned.at));
	if (name === 'HOME') return homedir();
	return name === 'PWD' ? pwd : null;
}

// The word after zsh expands it at `at`, or null when the text does not hold its value:
// the output of a command, a variable it does not assign, another user's home.
function expand(script: Script, word: string, at: number, pwd: string | null): string | null {
	let out = '';
	let i = 0;
	if (word === '~' || word.startsWith('~/')) {
		out = homedir();
		i = 1;
	} else if (word.startsWith('~')) return null;
	let quoted = false;
	while (i < word.length) {
		const ch = word[i];
		if (ch === "'" && !quoted) {
			const end = word.indexOf("'", i + 1);
			if (end === -1) return null;
			out += word.slice(i + 1, end);
			i = end + 1;
		} else if (ch === '"') {
			quoted = !quoted;
			i += 1;
		} else if (ch === '\\') {
			out += word.charAt(i + 1);
			i += 2;
		} else if (ch === '$') {
			const name = word.slice(i).match(/^\$(?:([A-Za-z_]\w*)|\{([A-Za-z_]\w*)\})/);
			const value = name && variable(script, name[1] ?? name[2], at, pwd);
			if (!name || value === null) return null;
			out += value;
			i += name[0].length;
		} else {
			out += ch;
			i += 1;
		}
	}
	return out;
}

// The folder a command at `at` runs in: the cwd, then each `cd` before it that reaches it.
// Null when a `cd` goes where the text cannot tell.
function folderAt(script: Script, at: number): string | null {
	let folder = script.cwd;
	for (const cd of builtinPositions(script.text, 'cd')) {
		if (cd >= at || !reaches(script.groups, cd, at)) continue;
		const words = wordsAt(script.text, cd);
		if (!words) return null;
		const target = words.slice(1).find((word) => word !== '--' && !/^-[qsLP]+$/.test(word));
		if (target === '-') return null;
		const path = target === undefined ? homedir() : expand(script, target, cd, folder);
		if (path === null) return null;
		folder = resolve(folder, path);
	}
	return folder;
}

// Where `ln -s` puts its link: the last operand, or the folder of -t. GNU ln takes -t and
// long options; BSD ln, the one on macOS, takes neither. With more than two operands, the
// last one is the folder that holds the links.
function linkDestination(words: string[]): { word: string; folder: boolean } | null {
	let symbolic = false;
	let folder: string | undefined;
	const operands: string[] = [];
	for (let i = 0; i < words.length; i += 1) {
		const word = words[i];
		const redirect = redirection(word);
		if (redirect) {
			if (redirect.target) i += 1;
		} else if (word === '--') operands.push(...words.slice(i + 1).filter((rest) => !redirection(rest)));
		else if (word.startsWith('--')) {
			if (word === '--symbolic') symbolic = true;
			else if (word.startsWith('--target-directory=')) folder = word.slice('--target-directory='.length);
			else if (word === '--target-directory') folder = words[(i += 1)];
			else if (word === '--suffix') i += 1;
		} else if (word.startsWith('-') && word.length > 1) {
			for (let k = 1; k < word.length; k += 1) {
				if (word[k] === 's') symbolic = true;
				if (word[k] !== 't' && word[k] !== 'S') continue;
				const value = word.slice(k + 1) || words[(i += 1)];
				if (word[k] === 't') folder = value;
				break;
			}
		} else operands.push(word);
		if (word === '--') break;
	}
	if (!symbolic) return null;
	if (folder !== undefined) return operands.length > 0 ? { word: folder, folder: true } : null;
	return operands.length > 1 ? { word: operands.at(-1)!, folder: operands.length > 2 } : null;
}

function nodeModulesSymlink(command: string, cwd: string): string | null {
	const text = withoutDataHeredocs(command);
	if (!/(?:^|[^\w./-])ln\s/.test(text)) return null;
	const script: Script = { text, cwd, groups: groups(text), open: openPositions(text, 'unquoted') };
	for (const at of commandPositions(text, 'ln')) {
		const words = wordsAt(text, at);
		const destination = words && linkDestination(words.slice(1));
		if (!destination) continue;
		const pwd = folderAt(script, at);
		if (pwd === null) continue;
		const path = expand(script, destination.word, at, pwd);
		if (path === null) continue;
		const resolved = resolve(pwd, path);
		const holder = destination.folder || path.endsWith('/') ? resolved : dirname(resolved);
		const segments = holder.split('/');
		const nodeModules = segments.indexOf('node_modules');
		if (nodeModules === -1 || inScratch(segments.slice(0, nodeModules).join('/') || '/')) continue;
		return `Blocked: this \`ln -s\` makes a link by hand in ${holder}; npm never records it and the next \`npm install\` deletes it. Run \`npm install\` at the repo root for this repo's own workspaces, and \`npm rebuild <pkg>\` for a \`.bin\` link. For another checkout's package, ${RELEASE_ROUTE}. Links in a scratch folder are allowed.`;
	}
	return null;
}

// ---- unreleased packages from another checkout -----------------------------------

// Ezz, 2026-11-22: agents stop consuming an unreleased package through `npm link` or a
// path to another checkout. A bare `npm link` stays open: it registers the current
// package's CLI globally.
const UNRELEASED = `Blocked: this consumes an unreleased package from another checkout (\`npm link <pkg>\`, or \`npm install\` of a path outside this repo). Instead, ${RELEASE_ROUTE}.`;

const NPM_LINK = new Set(['link', 'ln']);
// install and install-test with their aliases, from npm's lib/utils/cmd-list.js.
const NPM_INSTALL = new Set(['install', 'i', 'add', 'in', 'ins', 'inst', 'insta', 'instal', 'isnt', 'isnta', 'isntal', 'isntall', 'install-test', 'it']);
// npm options that an install or a link takes with the next word as their value (no
// Boolean type in npm's config definitions), so that word is not read as a package.
const NPM_VALUE_OPTIONS = new Set(['-w', '--workspace', '-C', '--prefix', '-L', '--location', '--tag', '--registry', '--omit', '--include', '--install-strategy', '--loglevel', '--cache', '--userconfig', '--globalconfig', '--save-prefix', '--before', '--min-release-age', '--allow-scripts', '--cpu', '--os', '--libc', '--lockfile-version', '--script-shell', '--otp']);

interface NpmCall {
	subcommand: string | undefined;
	operands: string[];
	prefix: string | undefined;
	global: boolean;
}

// `words` starts at npm.
function npmCall(words: string[]): NpmCall {
	const operands: string[] = [];
	let prefix: string | undefined;
	let global = false;
	for (let i = 1; i < words.length; i += 1) {
		const word = words[i];
		const redirect = redirection(word);
		if (redirect) {
			if (redirect.target) i += 1;
		} else if (NPM_VALUE_OPTIONS.has(word)) {
			const value = words[(i += 1)];
			if (word === '-C' || word === '--prefix') prefix = value;
			if ((word === '-L' || word === '--location') && value === 'global') global = true;
		} else if (word.startsWith('--prefix=')) prefix = word.slice('--prefix='.length);
		else if (word === '-g' || word === '--global' || word === '--location=global') global = true;
		else if (!word.startsWith('-')) operands.push(word);
	}
	const [subcommand, ...rest] = operands;
	return { subcommand, operands: rest, prefix, global };
}

// The folder that holds .git at or above `folder`: the checkout's root, or null outside one.
function checkoutRoot(folder: string): string | null {
	for (let dir = folder; ; dir = dirname(dir)) {
		if (existsSync(join(dir, '.git'))) return dir;
		if (dirname(dir) === dir) return null;
	}
}

// The folder a path operand of npm install names, or null when the operand names a
// package or the text does not hold its value. npm reads a spec as a path when it starts
// with `file:`, `.`, `/` or `~/`, and resolves it against the folder npm runs in.
function installPath(script: Script, word: string, at: number, pwd: string): string | null {
	const expanded = expand(script, word, at, pwd);
	if (expanded === null) return null;
	const file = expanded.match(/^file:(?:\/\/(?=\/))?(.*)$/s);
	const spec = file ? file[1] : expanded;
	if (!file && !/^(?:[./]|~\/)/.test(spec)) return null;
	return resolve(pwd, spec.startsWith('~/') ? join(homedir(), spec.slice(2)) : spec);
}

function unreleasedPackage(command: string, cwd: string): string | null {
	const text = withoutDataHeredocs(command);
	if (!/(?:^|[^\w./-])npm\s/.test(text)) return null;
	const script: Script = { text, cwd, groups: groups(text), open: openPositions(text, 'unquoted') };
	for (const at of commandPositions(text, 'npm')) {
		const words = wordsAt(text, at);
		if (!words) continue;
		const call = npmCall(words);
		if (call.subcommand === undefined) continue;
		if (NPM_LINK.has(call.subcommand) && call.operands.length > 0) return UNRELEASED;
		if (!NPM_INSTALL.has(call.subcommand) || call.global) continue;
		const pwd = folderAt(script, at);
		if (pwd === null) continue;
		const prefix = call.prefix === undefined ? pwd : expand(script, call.prefix, at, pwd);
		if (prefix === null) continue;
		const root = checkoutRoot(resolve(pwd, prefix));
		if (root === null) continue;
		for (const operand of call.operands) {
			const path = installPath(script, operand, at, pwd);
			if (path !== null && path !== root && !path.startsWith(`${root}/`)) return UNRELEASED;
		}
	}
	return null;
}

// Monitor streams through grep by design, so the pipe checks are for Bash only.
export function shellTrap({ command, tool, cwd }: ShellCommand): string | null {
	const inEveryShell = [modifiedVariable, reservedAssignment, backtick, pipestatus, sedInPlace, bareQualifier, pgrepWatcher, killByPattern, zukhrufReleaseWait, nodeModulesSymlink, unreleasedPackage];
	for (const check of inEveryShell) {
		const reason = check(command, cwd);
		if (reason) return reason;
	}
	if (tool !== 'Bash') return null;
	const inBash = [pipedWatch, gatedOnPipedRun, gatedOnPipedMutation, commitAfterVerification, mutationThenSemicolon, exitAfterPipe];
	for (const check of inBash) {
		const reason = check(command);
		if (reason) return reason;
	}
	return null;
}
