// Reads shell text for the agent command hooks. Moved from block-git-mutation.ts.

export function tokenizeSegment(segment: string): string[] {
	return segment.match(/(?:[^\s"'\\]+|'[^']*'|"([^"\\]|\\.)*")+/g) ?? [];
}

export function trimQuotes(token: string): string {
	if (
		(token.startsWith("'") && token.endsWith("'")) ||
		(token.startsWith('"') && token.endsWith('"'))
	) {
		return token.slice(1, -1);
	}
	return token;
}

// Split a command into shell segments on ; newline | || && — but ONLY when the
// delimiter is OUTSIDE quotes. Splitting on a bare `|` inside a quoted string
// (e.g. a grep alternation "a\|git state\|b") previously shredded the quote into
// fake `git <word>` tokens and false-positived.
export type Delimiter = ';' | '|' | '||' | '&&' | 'end';

export function splitSegments(command: string): string[] {
	return splitWithDelimiters(command).map(({ segment }) => segment);
}

// splitSegments, with the delimiter that follows each segment.
export function splitWithDelimiters(command: string): { segment: string; delimiter: Delimiter }[] {
	const segments: { segment: string; delimiter: Delimiter }[] = [];
	let current = '';
	let quote: '"' | "'" | null = null;
	for (let i = 0; i < command.length; i += 1) {
		const ch = command[i];
		if (quote) {
			current += ch;
			if (ch === quote && command[i - 1] !== '\\') quote = null;
			continue;
		}
		if (ch === '"' || ch === "'") {
			quote = ch;
			current += ch;
			continue;
		}
		if (ch === ';' || ch === '\n') {
			segments.push({ segment: current, delimiter: ';' });
			current = '';
			continue;
		}
		if (ch === '|') {
			const or = command[i + 1] === '|';
			segments.push({ segment: current, delimiter: or ? '||' : '|' });
			current = '';
			if (or) i += 1;
			continue;
		}
		if (ch === '&' && command[i + 1] === '&') {
			segments.push({ segment: current, delimiter: '&&' });
			current = '';
			i += 1;
			continue;
		}
		current += ch;
	}
	segments.push({ segment: current, delimiter: 'end' });
	return segments;
}

// A shell redirection token (`2>&1`, `<<'EOF'`, `>`, `<<<`) and whether the next
// token is its target.
export function redirection(token: string): { target: boolean } | null {
	if (!/^(?:\d*|&)[<>]/.test(token)) return null;
	return { target: /^(?:\d*|&)(?:<<-?|<<<|<|>>|>|>&|<&)$/.test(token) };
}

// Tokens that may legitimately precede the actual command in a segment.
const COMMAND_PREFIXES = new Set([
	'command',
	'exec',
	'sudo',
	'env',
	'time',
	'nice',
	'nohup',
	'builtin',
	'xargs',
	'do',
	'then',
	'else',
	'elif',
	'if',
	'while',
	'until',
]);

// A heredoc body is data: zsh expands neither `=word` nor an assignment in it.
// The operator's own line stays, so the rest of that line is still checked.
export const HEREDOC_BODY = /(<<-?\s*(['"]?)([A-Za-z_][A-Za-z0-9_]*)\2[^\n]*)\n[\s\S]*?\n[ \t]*\3[ \t]*(?=\n|$)/g;

// A heredoc feeds commands only to a shell. To anything else (`cat > file`,
// `git commit -F -`, `node`) its body is data, so its lines are not git
// commands; a node or python body is still read for process calls.
export const SHELLS = new Set(['bash', 'sh', 'zsh', 'dash', 'ksh', 'fish', 'ssh']);

// The options of a command prefix that take a value, from macOS `man env`,
// `man sudo`, `man nice`, `man time`, `man xargs` and zsh's `exec -a`. The value
// is a word of its own, so it is not the segment's command.
const ENV_VALUE_OPTIONS = new Set(['-C', '-P', '-S', '-u']);
const PREFIX_VALUE_OPTIONS = new Map<string, ReadonlySet<string>>([
	['env', ENV_VALUE_OPTIONS],
	[
		'sudo',
		new Set([
			'-C', '-D', '-g', '-h', '-p', '-R', '-T', '-U', '-u',
			'--close-from', '--chdir', '--group', '--host', '--prompt', '--chroot',
			'--command-timeout', '--other-user', '--user',
		]),
	],
	['nice', new Set(['-n'])],
	['time', new Set(['-o'])],
	['xargs', new Set(['-E', '-I', '-J', '-L', '-n', '-P', '-R', '-S', '-s'])],
	['exec', new Set(['-a'])],
]);

interface OptionValue {
	option: string;
	// The value inside the word (`-C/tmp`, `--user=root`); undefined when it is the next word.
	value: string | undefined;
}

function optionValue(options: ReadonlySet<string>, word: string): OptionValue | null {
	if (options.has(word)) return { option: word, value: undefined };
	if (word.startsWith('--')) {
		const equals = word.indexOf('=');
		const option = word.slice(0, equals);
		return equals > 0 && options.has(option) ? { option, value: word.slice(equals + 1) } : null;
	}
	if (!word.startsWith('-')) return null;
	const letters = word.slice(1);
	const at = [...letters].findIndex((letter) => options.has(`-${letter}`));
	if (at === -1) return null;
	return {
		option: `-${letters[at]}`,
		value: at === letters.length - 1 ? undefined : letters.slice(at + 1),
	};
}

const commandName = (word: string) => word.split('/').pop() ?? word;

// `env -S '<string>'` splits its string into words that env reads as its own
// arguments, so `env -S 'git reset --hard'` runs git: the string's words take
// its place, and env's options among them are read in turn.
export function splitEnvStrings(words: string[]): string[] {
	const split = [...words];
	for (let i = 0; i < split.length; i += 1) {
		if (commandName(split[i]) !== 'env') continue;
		let j = i + 1;
		while (j < split.length && split[j].startsWith('-') && split[j] !== '--') {
			const found = optionValue(ENV_VALUE_OPTIONS, split[j]);
			if (found?.option !== '-S') {
				j += found && found.value === undefined ? 2 : 1;
				continue;
			}
			const string = found.value ?? split[j + 1] ?? '';
			split.splice(j, found.value === undefined ? 2 : 1, ...tokenizeSegment(string).map(trimQuotes));
		}
	}
	return split;
}

// Where a segment's command word is: past assignments (FOO=bar), command
// prefixes (sudo, /usr/bin/env, xargs…) with their options and option values,
// shell keywords (do, then…) and grouping. -1 when the segment has none.
export function commandIndex(words: string[]): number {
	let options: ReadonlySet<string> = new Set();
	for (let i = 0; i < words.length; i += 1) {
		const word = words[i];
		if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(word)) continue;
		const name = commandName(word);
		if (COMMAND_PREFIXES.has(name)) {
			options = PREFIX_VALUE_OPTIONS.get(name) ?? new Set();
			continue;
		}
		if (word.startsWith('-')) {
			const found = optionValue(options, word);
			if (found && found.value === undefined) i += 1;
			continue;
		}
		if (word === '{' || word === '(' || word === '!') continue;
		return i;
	}
	return -1;
}

export function withoutDataHeredocs(command: string): string {
	return command.replace(
		HEREDOC_BODY,
		(whole: string, operatorLine: string, _quote: string, _delimiter: string, offset: number) => {
			const before = command.slice(command.lastIndexOf('\n', offset) + 1, offset);
			const words = splitEnvStrings(tokenizeSegment(splitSegments(before).at(-1) ?? '').map(trimQuotes));
			const word = words[commandIndex(words)];
			return SHELLS.has(commandName(word ?? '')) ? whole : operatorLine;
		},
	);
}

// Where a character of a zsh command stands: plain shell words, inside "…"
// (where `$` still expands), inside (( )) or $(( )), or inside [[ ]].
export type ZshContext = 'unquoted' | 'double' | 'arithmetic' | 'test';

export interface ZshFrame {
	kind: 'top' | 'substitution' | 'double' | 'arithmetic' | 'test';
	parens: number;
}

// Calls `visit` for each character zsh reads, with its context. Quoting nests:
// inside "…" a $( ) starts plain shell words again, with quotes of its own, as
// in "$(tr -d '"')". Single-quoted text, $'…', a character after a backslash
// and a comment are not visited.
export function zshWalk(
	text: string,
	visit: (i: number, context: ZshContext) => void,
	substitutionEdge: (i: number) => void = () => {},
): void {
	const stack: ZshFrame[] = [{ kind: 'top', parens: 0 }];
	const push = (kind: ZshFrame['kind']) => stack.push({ kind, parens: 0 });
	for (let i = 0; i < text.length; i += 1) {
		const frame = stack[stack.length - 1];
		const ch = text[i];
		if (ch === '\\') {
			i += 1;
			continue;
		}
		if (frame.kind === 'double') {
			if (ch === '"') stack.pop();
			else if (text.startsWith('$((', i)) {
				push('arithmetic');
				i += 2;
			} else if (text.startsWith('$(', i)) {
				push('substitution');
				substitutionEdge(i + 1);
				i += 1;
			} else visit(i, 'double');
			continue;
		}
		const wordStart = i === 0 || /[\s;|&(]/.test(text[i - 1]);
		if (ch === "'" || text.startsWith("$'", i)) {
			const open = ch === "'" ? i : i + 1;
			let close = open + 1;
			while (close < text.length && text[close] !== "'") close += ch === '$' && text[close] === '\\' ? 2 : 1;
			i = close;
			continue;
		}
		if (ch === '"') {
			push('double');
			continue;
		}
		if (wordStart && ch === '#' && (frame.kind === 'top' || frame.kind === 'substitution')) {
			const end = text.indexOf('\n', i);
			i = end === -1 ? text.length : end - 1;
			continue;
		}
		if (text.startsWith('$((', i)) {
			push('arithmetic');
			i += 2;
			continue;
		}
		if (text.startsWith('$(', i)) {
			push('substitution');
			substitutionEdge(i + 1);
			i += 1;
			continue;
		}
		if (frame.kind === 'arithmetic' || frame.kind === 'substitution') {
			if (ch === '(') frame.parens += 1;
			if (ch === ')') {
				if (frame.parens > 0) frame.parens -= 1;
				else if (frame.kind === 'substitution') {
					stack.pop();
					substitutionEdge(i);
					continue;
				} else if (text.startsWith('))', i)) {
					stack.pop();
					i += 1;
					continue;
				}
			}
		}
		if (frame.kind !== 'arithmetic' && wordStart && text.startsWith('((', i)) {
			push('arithmetic');
			i += 1;
			continue;
		}
		if (frame.kind !== 'arithmetic' && wordStart && /^\[\[\s/.test(text.slice(i, i + 3))) {
			push('test');
			i += 1;
			continue;
		}
		if (frame.kind === 'test' && text.startsWith(']]', i)) {
			stack.pop();
			i += 1;
			continue;
		}
		visit(i, frame.kind === 'arithmetic' || frame.kind === 'test' ? frame.kind : 'unquoted');
	}
}
