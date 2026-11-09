#!/usr/bin/env node
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { stdin } from 'node:process';
import type { Delimiter } from './shell-lex.ts';

interface HookInput {
	tool_name?: string;
	cwd?: string;
	tool_input?: {
		command?: string;
		cmd?: string;
	};
}

const LOG_PATH = join(homedir(), '.claude', 'hooks', 'block-git-mutation.log');

// The guard cannot read a command without this parser. A failed static import
// exits 1, which lets the command run; only exit 2 blocks a PreToolUse call.
const {
	COMMAND_PREFIXES,
	redirection,
	splitSegments,
	splitWithDelimiters,
	tokenizeSegment,
	trimQuotes,
	withoutDataHeredocs,
	SHELLS,
} = await import('./shell-lex.ts').catch((err: unknown) => {
	logError('shell-lex', err);
	process.stderr.write('Blocked: the git guard hook could not load shell-lex.ts, so it cannot check this command.\n');
	process.exit(2);
});

const READ_ONLY_COMMANDS = new Set([
	'add',
	'apply',
	'blame',
	'cat-file',
	'check-ignore',
	'commit',
	'count-objects',
	'describe',
	'diff',
	'clone',
	'fetch',
	'for-each-ref',
	'grep',
	'hash-object',
	'help',
	'init',
	'log',
	'ls-files',
	'ls-remote',
	'ls-tree',
	'merge-base',
	'mv',
	'name-rev',
	'pull',
	'push',
	'remote',
	'rev-list',
	'rev-parse',
	'rm',
	'shortlog',
	'show',
	'status',
	'update-index',
	'version',
	'whatchanged',
]);

const READ_ONLY_BRANCH_FLAGS = new Set([
	'-a',
	'-r',
	'-v',
	'-vv',
	'--all',
	'--contains',
	'--list',
	'--merged',
	'--no-contains',
	'--no-merged',
	'--points-at',
	'--remotes',
	'--show-current',
	'--verbose',
]);

const VALUE_TAKING_BRANCH_FLAGS = new Set([
	'--contains',
	'--no-contains',
	'--merged',
	'--no-merged',
	'--points-at',
	'--format',
	'--sort',
]);

const READ_ONLY_STASH_SUBCOMMANDS = new Set(['list', 'show']);
const READ_ONLY_REFLOG_SUBCOMMANDS = new Set(['show', 'exists']);

const READ_ONLY_CONFIG_FLAGS = new Set([
	'--get',
	'--get-all',
	'--get-regexp',
	'--get-urlmatch',
	'--get-color',
	'--get-colorbool',
	'--list',
	'-l',
]);
const WRITE_CONFIG_FLAGS = new Set([
	'--add',
	'--unset',
	'--unset-all',
	'--replace-all',
	'--rename-section',
	'--remove-section',
	'--edit',
	'-e',
]);

function logError(stage: string, err: unknown) {
	const message = err instanceof Error ? err.message : String(err);
	try {
		appendFileSync(
			LOG_PATH,
			`${new Date().toISOString()} stage=${stage} error=${message}\n`,
		);
	} catch {
		// Best-effort logging must never break the hook.
	}
}

// True when segment `at` pipes into a filter and a later `&&` depends on that
// pipeline: its exit status is the filter's, so the `&&` runs even when the
// segment failed. `set -o pipefail` (or zsh's `setopt pipefail`) earlier fixes it.
function pipeHidesFailure(
	parts: { segment: string; delimiter: Delimiter }[],
	at: number,
): boolean {
	if (parts[at].delimiter !== '|') return false;
	const pipefail = parts
		.slice(0, at)
		.some(({ segment }) => {
			const tokens = tokenizeSegment(segment).map(trimQuotes);
			return (tokens[0] === 'set' || tokens[0] === 'setopt') && tokens.some((t) => /pipe_?fail/i.test(t));
		});
	if (pipefail) return false;
	let end = at;
	while (parts[end].delimiter === '|') end += 1;
	return parts[end].delimiter === '&&';
}

function skipGitGlobalOptions(tokens: string[], index: number): number {
	let i = index;
	while (i < tokens.length) {
		const token = trimQuotes(tokens[i]);

		if (token === '-C' || token === '-c') {
			i += 2;
			continue;
		}

		if (
			token === '--git-dir' ||
			token === '--work-tree' ||
			token === '--namespace' ||
			token === '--exec-path' ||
			token === '--super-prefix'
		) {
			i += 2;
			continue;
		}

		if (
			token.startsWith('--git-dir=') ||
			token.startsWith('--work-tree=') ||
			token.startsWith('--namespace=') ||
			token.startsWith('--exec-path=') ||
			token.startsWith('--super-prefix=') ||
			token.startsWith('-c')
		) {
			i += 1;
			continue;
		}

		if (token.startsWith('-')) {
			i += 1;
			continue;
		}

		return i;
	}

	return i;
}

function readOnlyBranch(tokens: string[]): boolean {
	if (tokens.length === 0) return true;

	for (let i = 0; i < tokens.length; i += 1) {
		const token = trimQuotes(tokens[i]);
		if (READ_ONLY_BRANCH_FLAGS.has(token)) {
			if (VALUE_TAKING_BRANCH_FLAGS.has(token)) i += 1;
			continue;
		}
		if (token.startsWith('--format=')) continue;
		if (token.startsWith('--sort=')) continue;
		if (token.startsWith('--contains=')) continue;
		if (token.startsWith('--no-contains=')) continue;
		if (token.startsWith('--merged=')) continue;
		if (token.startsWith('--no-merged=')) continue;
		if (token.startsWith('--points-at=')) continue;
		return false;
	}

	return true;
}

// `git branch -u <upstream> [<branch>]`, `--set-upstream-to[=]<upstream>` and
// `--unset-upstream` only change which remote branch a local branch tracks.
// Another flag after it, such as -D or -m, is not an upstream change.
function upstreamBranch(tokens: string[]): boolean {
	const [first, ...rest] = tokens.map(trimQuotes);
	if (first === undefined) return false;
	const upstream =
		first === '-u' ||
		first === '--set-upstream-to' ||
		first === '--unset-upstream' ||
		first.startsWith('--set-upstream-to=');
	return upstream && rest.every((token) => !token.startsWith('-'));
}

// `git <command> --help` and `-h` print the command's help and run nothing.
function helpRequest(tokens: string[]): boolean {
	const first = tokens[0];
	return first !== undefined && ['--help', '-h'].includes(trimQuotes(first));
}

// `git commit --amend` replaces the last commit, so it rewrites history. Git
// accepts unique long-option prefixes, so `--am` and `--amen` amend too. Tokens
// after `--` are pathspecs.
function readOnlyCommit(tokens: string[]): boolean {
	for (const token of tokens.map(trimQuotes)) {
		if (token === '--') return true;
		if (token.length >= 4 && '--amend'.startsWith(token)) return false;
	}
	return true;
}

// `--no-verify` skips the repo's pre-commit/commit-msg/pre-push hooks, the
// checks the user wants on every commit. On commit `-n` means the same; in a
// short-option cluster an option that takes a value (`-m`, `-F`, `-c`, `-C`,
// `-t`) consumes the rest, so `-mn` is the message "n". On push, `-n` is a dry
// run and stays allowed, and `git commit --dry-run` runs no hook, so it has none
// to skip. Git accepts unique long-option prefixes.
function disablesHooks(globalOptions: string[]): boolean {
	return globalOptions.map(trimQuotes).some((token) => /^(?:-c)?core\.hookspath=(?:$|[/~])/i.test(token));
}

function skipsHooks(subcommand: string, tokens: string[]): boolean {
	const args = tokens.map(trimQuotes);
	const options = args.includes('--') ? args.slice(0, args.indexOf('--')) : args;
	if (subcommand === 'commit' && isDryRun(args)) return false;
	for (const token of options) {
		if (token.length >= '--no-v'.length && '--no-verify'.startsWith(token)) return true;
		if (subcommand !== 'commit' || !/^-[A-Za-z]+$/.test(token)) continue;
		for (const letter of token.slice(1)) {
			if ('mFcCt'.includes(letter)) break;
			if (letter === 'n') return true;
		}
	}
	return false;
}

// The user's repos carry no attribution trailer: ~/.claude/settings.json sets
// attribution.commit to "", and once in history a trailer can only be removed by
// rewriting it. The message comes inline (-m), from a heredoc on `-F -` (both
// in the command text), or from a file named by -F/--file. A relative file is
// read from the session's working directory; a `cd` earlier in the same command
// is not followed.
const TRAILER = /\b(?:co-authored-by|claude-session)\s*:/i;

function carriesTrailer(command: string, tokens: string[], cwd: string): boolean {
	if (TRAILER.test(command)) return true;
	const args = tokens.map(trimQuotes);
	for (let i = 0; i < args.length; i += 1) {
		const token = args[i];
		const file =
			token === '-F' || token === '--file'
				? args[i + 1]
				: token.startsWith('--file=')
					? token.slice('--file='.length)
					: token.startsWith('-F') && token.length > 2
						? token.slice(2)
						: undefined;
		if (!file || file === '-') continue;
		try {
			if (TRAILER.test(readFileSync(resolve(cwd, file), 'utf8'))) return true;
		} catch {
			// A file the hook cannot read is git's to report.
		}
	}
	return false;
}

function readOnlyStash(tokens: string[]): boolean {
	const first = tokens[0];
	if (first === undefined) return false;
	return READ_ONLY_STASH_SUBCOMMANDS.has(trimQuotes(first));
}

// The index a git command uses: GIT_INDEX_FILE from its own prefix, else one
// that an earlier `export` in the same Bash command set. It is private unless it
// is the checkout's own .git/index, which every session shares. A variable
// (`GIT_INDEX_FILE=$I`) counts as private: the hook cannot read its value.
function isPrivateIndex(prefix: string[], exported: string | undefined): boolean {
	const assignment = prefix.find((token) => token.startsWith('GIT_INDEX_FILE='));
	const index = (assignment?.slice('GIT_INDEX_FILE='.length) ?? exported)
		?.replace(/^['"]|['"]$/g, '')
		.replace(/\/+$/, '');
	return !!index && !index.endsWith('.git/index');
}

// `GIT_INDEX_FILE=<private> git read-tree <tree>` fills an index that the shared
// checkout does not use: that is how a session commits only its own hunks of a
// file a peer also edits. The shared index and -u, which also rewrites the
// working tree, stay blocked.
function privateIndexReadTree(isPrivate: boolean, args: string[]): boolean {
	return isPrivate && !args.some((token) => /^-[A-Za-z]*u[A-Za-z]*$/.test(token));
}

// The paths a command names: bare words and every word after `--`. Options,
// option values and redirections are not paths.
function namedPaths(args: string[], valueOptions: Set<string>): string[] {
	const paths: string[] = [];
	let afterDashes = false;
	for (let i = 0; i < args.length; i += 1) {
		const token = args[i];
		const redirect = redirection(token);
		if (redirect) {
			if (redirect.target) i += 1;
			continue;
		}
		if (afterDashes) {
			paths.push(token);
			continue;
		}
		if (token === '--') {
			afterDashes = true;
			continue;
		}
		if (valueOptions.has(token)) {
			i += 1;
			continue;
		}
		if (/^-[A-Za-z]+$/.test(token)) {
			const letters = token.slice(1);
			const valueAt = [...letters].findIndex((letter) => valueOptions.has(`-${letter}`));
			if (valueAt === letters.length - 1) i += 1;
			continue;
		}
		if (token.startsWith('-')) continue;
		paths.push(token);
	}
	return paths;
}

// A commit with paths makes git build a temporary index from HEAD plus those
// paths (`--only` is the default with paths), so whatever else is staged stays
// out. A commit with no paths, or with -a/--all or -i/--include, takes what the
// index holds, another session's entries too.
const COMMIT_VALUE_OPTIONS = new Set([
	'-m', '-F', '-c', '-C', '-t',
	'--message', '--file', '--reuse-message', '--reedit-message', '--template',
	'--author', '--date', '--cleanup', '--fixup', '--squash', '--trailer',
]);

function commitScope(args: string[]): { wholeIndex: boolean; paths: string[] } {
	const options = args.includes('--') ? args.slice(0, args.indexOf('--')) : args;
	const pathspecFile = options.some((token) => token.startsWith('--pathspec-from-file'));
	const all = options.some(
		(token) => token === '--all' || (/^-[A-Za-z]+$/.test(token) && /^-[^mFcCt]*a/.test(token)),
	);
	const include = options.some(
		(token) =>
			(token.length >= '--inc'.length && '--include'.startsWith(token)) ||
			(/^-[A-Za-z]+$/.test(token) && /^-[^mFcCt]*i/.test(token)),
	);
	const paths = namedPaths(
		args.filter((token) => !token.startsWith('--pathspec-from-file')),
		COMMIT_VALUE_OPTIONS,
	);
	return { wholeIndex: all || include || (paths.length === 0 && !pathspecFile), paths };
}

function isDryRun(args: string[]): boolean {
	const options = args.includes('--') ? args.slice(0, args.indexOf('--')) : args;
	return options.some((token) => token.length >= '--dr'.length && '--dry-run'.startsWith(token));
}

// A path is committed when a commit names it or a folder that holds it.
function covers(commitPaths: string[], path: string): boolean {
	return commitPaths.some(
		(commitPath) =>
			commitPath === path || commitPath === '.' || path.startsWith(`${commitPath.replace(/\/+$/, '')}/`),
	);
}

// `git diff --cached -R -- <paths> | git apply --cached` sets those entries of
// the shared index back to HEAD after a private-index commit, the resync that
// AGENTS.md prescribes.
function resyncsSharedIndex(command: string): boolean {
	return [...command.matchAll(/git\s+diff\b([^|;&\n]*)\|\s*git\s+apply\s+--cached\b/g)].some(
		(match) => /\s(?:--cached|--staged)\b/.test(match[1]) && /\s-R\b/.test(match[1]),
	);
}

// `git clone <source>` copies a checkout when the source is a local folder that
// holds a working tree (a `.git` folder). A bare repository is not a checkout,
// and a URL, `host:path` or a variable names no local folder.
const CLONE_VALUE_OPTIONS = new Set([
	'-b', '--branch', '-o', '--origin', '-c', '--config', '--depth', '--reference',
	'--reference-if-able', '--separate-git-dir', '-u', '--upload-pack', '-j', '--jobs',
	'--filter', '--template', '--shallow-since', '--shallow-exclude', '--server-option',
	'--bundle-uri',
]);

function clonesCheckout(args: string[], cwd: string): boolean {
	const [source] = namedPaths(args, CLONE_VALUE_OPTIONS);
	if (!source) return false;
	const path = source.replace(/^file:\/\//, '').replace(/^~(?=\/|$)/, homedir());
	return existsSync(join(resolve(cwd, path), '.git'));
}

function readOnlyReflog(tokens: string[]): boolean {
	const first = tokens[0];
	if (first === undefined) return true;
	const token = trimQuotes(first);
	if (token.startsWith('-')) return true;
	return READ_ONLY_REFLOG_SUBCOMMANDS.has(token);
}

// `git config` reads (--get*/--list/-l, or `git config <key>` with no value) are
// inspection; only writes (`git config <key> <value>`, --add/--unset/--edit/...)
// mutate state.
function readOnlyConfig(tokens: string[]): boolean {
	const args = tokens.map(trimQuotes);
	for (const tok of args) {
		if (WRITE_CONFIG_FLAGS.has(tok)) return false;
	}
	for (const tok of args) {
		if (READ_ONLY_CONFIG_FLAGS.has(tok) || tok.startsWith('--get')) return true;
	}
	const positional = args.filter((tok) => !tok.startsWith('-'));
	return positional.length <= 1;
}

// `git config [--local] core.hooksPath <folder>` and
// `git config [--local] --unset core.hooksPath` only tell this repo's git where
// its hooks are, as a prepare script does. Another key, a scope beyond the repo
// (--global, --system, --file) or another flag is not this change.
function hooksPathConfig(tokens: string[]): boolean {
	const args = tokens.map(trimQuotes).filter((token) => token !== '--local');
	const unset = args[0] === '--unset';
	const [key, ...values] = unset ? args.slice(1) : args;
	if (key?.toLowerCase() !== 'core.hookspath') return false;
	if (values.some((token) => token.startsWith('-'))) return false;
	return values.length === (unset ? 0 : 1);
}

// `git` is a git command only when it is in COMMAND position — the first real
// token of the segment, after env assignments (FOO=bar), command prefixes
// (sudo/env/xargs/...), shell keywords (do/then/...), and their flags. If the
// segment's command is something else (type git, which git, echo "use git",
// man git), `git` is just an argument and must NOT be treated as a mutation.
function findGitCommandIndex(tokens: string[]): number {
	for (let i = 0; i < tokens.length; i += 1) {
		const token = trimQuotes(tokens[i]);
		if (token === 'git' || token.endsWith('/git')) return i;
		if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(token)) continue; // env assignment
		if (COMMAND_PREFIXES.has(token)) continue;
		if (token.startsWith('-')) continue; // flag of a prefix command
		if (token === '{' || token === '(' || token === '!') continue;
		return -1; // the segment's command is not git
	}
	return -1;
}

function isShellExecutable(token: string): boolean {
	const executable = token.split('/').pop();
	return (
		executable === 'sh' ||
		executable === 'bash' ||
		executable === 'zsh' ||
		executable === 'fish'
	);
}

function isShellCommandFlag(token: string): boolean {
	return token.startsWith('-') && token.includes('c');
}

// A node or python script hands git to a process call, so the Bash command shows
// only the script's source. These are the flags that run a script given inline.
const SCRIPT_FLAGS: Record<string, Set<string>> = {
	node: new Set(['-e', '--eval', '-p', '--print']),
	bun: new Set(['-e', '--eval', '-p', '--print']),
	deno: new Set(['eval']),
	python: new Set(['-c']),
	python3: new Set(['-c']),
};

// The inline scripts on a segment: `node -e '<script>'`, `python3 -c '<script>'`.
function inlineScripts(segment: string): string[] {
	const raw = tokenizeSegment(segment);
	const scripts: string[] = [];
	for (let i = 0; i < raw.length; i += 1) {
		const flags = SCRIPT_FLAGS[trimQuotes(raw[i]).split('/').pop() ?? ''];
		if (!flags) continue;
		for (let j = i + 1; j < raw.length - 1; j += 1) {
			const flag = trimQuotes(raw[j]);
			if (flags.has(flag)) {
				const script = raw[j + 1];
				scripts.push(
					script.startsWith('"')
						? trimQuotes(script).replace(/\\(["\\$`])/g, '$1')
						: trimQuotes(script),
				);
				break;
			}
			if (!flag.startsWith('-')) break;
		}
	}
	return scripts;
}

// Scripts fed to an interpreter on stdin: `node <<'EOF' … EOF`.
const HEREDOC_SCRIPT =
	/\b(?:node|bun|deno|tsx|python3?)\b[^\n]*?<<-?\s*(['"]?)([A-Za-z_][A-Za-z0-9_]*)\1[^\n]*\n([\s\S]*?)\n[ \t]*\2[ \t]*(?=\n|$)/g;

// A list item the hook cannot read: a variable, an f-string, a call.
const UNREAD = '<expr>';

// The items of an argument list, in order. An unread item keeps its place, so
// `['git', '-C', root, 'show', …]` is `git -C <expr> show …`.
function listItems(text: string): string[] {
	const item =
		/\s*(?:([A-Za-z]{0,2})(['"`])((?:\\.|(?!\2)[^\\])*)\2|(?:[^,(]|\([^)]*\))+)\s*(?:,|$)/g;
	return [...text.matchAll(item)]
		.filter((match) => match[0].trim() !== '')
		.map((match) => (match[2] && !/f/i.test(match[1]) ? match[3] : UNREAD));
}

// Which characters of a script are inside a string literal: '…', "…", `…`, and
// Python's '''…''' and """…""". A one-line quote ends at the line's end, so an
// apostrophe in a comment ("don't") cannot hide the code after it.
function stringMask(script: string): boolean[] {
	const inside = new Array<boolean>(script.length).fill(false);
	let i = 0;
	while (i < script.length) {
		const quote = script[i];
		if (quote !== "'" && quote !== '"' && quote !== '`') {
			i += 1;
			continue;
		}
		const close = quote !== '`' && script.startsWith(quote.repeat(3), i) ? quote.repeat(3) : quote;
		const multiline = close.length === 3 || quote === '`';
		let j = i + close.length;
		while (j < script.length && !script.startsWith(close, j)) {
			if (!multiline && script[j] === '\n') break;
			j += script[j] === '\\' ? 2 : 1;
		}
		const end = Math.min(j + (script.startsWith(close, j) ? close.length : 0), script.length);
		inside.fill(true, i, end);
		i = Math.max(end, i + 1);
	}
	return inside;
}

// The git commands a script runs: the string or argument list it passes to a
// process call (execSync, execFileSync, spawnSync, os.system, subprocess.run…).
// A string that only mentions git (a log line) is not passed to one, and a call
// inside a string literal (a Python script that writes JS source) is text the
// script does not run, so neither is a command.
function scriptGitCommands(script: string): string[] {
	const commands: string[] = [];
	const inside = stringMask(script);
	const call =
		/\b(?:execSync|exec|execFileSync|execFile|spawnSync|spawn|system|run|call|check_call|check_output|getoutput|Popen)\s*\(\s*/g;
	for (const match of script.matchAll(call)) {
		if (inside[match.index]) continue;
		const rest = script.slice(match.index + match[0].length);
		const string = rest.match(/^(['"`])((?:\\.|(?!\1)[^\\])*)\1/);
		if (string) {
			if (string[2] === 'git') {
				const list = rest
					.slice(string[0].length)
					.match(/^\s*,\s*\[([^\]]*)\]/);
				commands.push(['git', ...listItems(list?.[1] ?? '')].join(' '));
			} else if (/^git\s/.test(string[2])) {
				commands.push(string[2]);
			}
			continue;
		}
		const list = rest.match(/^\[([^\]]*)\]/);
		if (list) {
			const items = listItems(list[1]);
			if (items[0] === 'git') commands.push(items.join(' '));
		}
	}
	return commands;
}

// Why a git command is blocked; each reason has its own explanation.
type Reason = 'guard' | 'shared-index' | 'whole-index' | 'local-clone' | 'piped-commit';

interface Blocked {
	subcommand: string;
	reason: Reason;
}

interface GitCall {
	prefix: string[];
	globalOptions: string[];
	subcommand: string;
	args: string[];
}

function gitCall(tokens: string[]): GitCall | null {
	const gitIndex = findGitCommandIndex(tokens);
	if (gitIndex === -1) return null;
	const subcommandIndex = skipGitGlobalOptions(tokens, gitIndex + 1);
	const subcommand = tokens[subcommandIndex];
	if (subcommand === undefined || subcommand === UNREAD) return null;
	return {
		prefix: tokens.slice(0, gitIndex),
		globalOptions: tokens.slice(gitIndex + 1, subcommandIndex),
		subcommand,
		args: tokens.slice(subcommandIndex + 1),
	};
}

const STAGING_COMMANDS = new Set(['add', 'rm', 'mv']);

// `git add -n`, `git rm -n` and `git mv -n` (--dry-run) only list what they
// would stage.
function stagesNothing(args: string[]): boolean {
	const options = args.includes('--') ? args.slice(0, args.indexOf('--')) : args;
	return options.some((token) => token === '--dry-run' || /^-[A-Za-z]*n[A-Za-z]*$/.test(token));
}

function blockedGitCommands(command: string, cwd: string, depth = 0): Blocked[] {
	const blocked: Blocked[] = [];
	const guard = (subcommand: string) => blocked.push({ subcommand, reason: 'guard' });
	const parts = splitWithDelimiters(withoutDataHeredocs(command));
	const segments = parts.map(({ segment }) => ({
		segment,
		tokens: tokenizeSegment(segment).map(trimQuotes),
	}));

	// Each segment's git call, with whether it uses a private index: its own
	// GIT_INDEX_FILE, or one exported by an earlier segment.
	let exported: string | undefined;
	const calls = segments.map(({ tokens }) => {
		if (tokens[0] === 'export' && tokens[1]?.startsWith('GIT_INDEX_FILE='))
			exported = tokens[1].slice('GIT_INDEX_FILE='.length);
		if (tokens[0] === 'unset' && tokens.includes('GIT_INDEX_FILE')) exported = undefined;
		const call = gitCall(tokens);
		return call && { ...call, isPrivate: isPrivateIndex(call.prefix, exported) };
	});

	if (depth <= 2) {
		for (const match of command.matchAll(HEREDOC_SCRIPT)) {
			for (const git of scriptGitCommands(match[3]))
				blocked.push(...blockedGitCommands(git, cwd, depth + 1));
		}
	}

	for (const [at, { segment, tokens }] of segments.entries()) {
		if (depth > 2) continue;

		for (let i = 0; i < tokens.length - 2; i += 1) {
			if (!isShellExecutable(tokens[i])) continue;
			if (!isShellCommandFlag(tokens[i + 1])) continue;
			blocked.push(...blockedGitCommands(tokens[i + 2], cwd, depth + 1));
		}

		for (const script of inlineScripts(segment)) {
			for (const git of scriptGitCommands(script))
				blocked.push(...blockedGitCommands(git, cwd, depth + 1));
		}

		const call = calls[at];
		if (!call) continue;
		const { subcommand, args, isPrivate, globalOptions } = call;
		if (helpRequest(args)) continue;

		if (subcommand === 'branch') {
			if (!readOnlyBranch(args) && !upstreamBranch(args)) guard(subcommand);
			continue;
		}

		if (subcommand === 'commit' || subcommand === 'push') {
			if (
				skipsHooks(subcommand, args) ||
				disablesHooks(globalOptions) ||
				(subcommand === 'commit' &&
					(!readOnlyCommit(args) || carriesTrailer(command, args, cwd)))
			)
				guard(subcommand);
			else if (
				subcommand === 'commit' &&
				!isPrivate &&
				!isDryRun(args) &&
				commitScope(args).wholeIndex
			)
				blocked.push({ subcommand, reason: 'whole-index' });
			else if (subcommand === 'commit' && !isDryRun(args) && pipeHidesFailure(parts, at))
				blocked.push({ subcommand, reason: 'piped-commit' });
			continue;
		}

		// Staging in the shared index is safe only when the same Bash command
		// then commits every path it staged, before another session can commit.
		if (STAGING_COMMANDS.has(subcommand)) {
			if (isPrivate || stagesNothing(args)) continue;
			const staged = namedPaths(
				args.filter((token) => !token.startsWith('--pathspec-from-file')),
				new Set(),
			);
			const committed = calls
				.slice(at + 1)
				.filter((later) => later?.subcommand === 'commit' && !later.isPrivate && !isDryRun(later.args))
				.flatMap((later) => commitScope(later?.args ?? []).paths);
			if (staged.length === 0 || !staged.every((path) => covers(committed, path)))
				blocked.push({ subcommand, reason: 'shared-index' });
			continue;
		}

		if (subcommand === 'apply') {
			const toIndex = args.some((token) => token === '--cached' || token === '--index');
			const resync = resyncsSharedIndex(command) && namedPaths(args, new Set()).length === 0;
			if (toIndex && !isPrivate && !args.includes('--check') && !resync)
				blocked.push({ subcommand, reason: 'shared-index' });
			continue;
		}

		if (subcommand === 'update-index') {
			const refreshOnly = args.every((token) =>
				['-q', '--refresh', '--really-refresh', '--ignore-missing', '--unmerged'].includes(token),
			);
			if (!isPrivate && !refreshOnly) blocked.push({ subcommand, reason: 'shared-index' });
			continue;
		}

		if (subcommand === 'clone') {
			if (clonesCheckout(args, cwd)) blocked.push({ subcommand, reason: 'local-clone' });
			continue;
		}

		if (subcommand === 'stash') {
			if (!readOnlyStash(args)) guard(subcommand);
			continue;
		}

		if (subcommand === 'read-tree') {
			if (!privateIndexReadTree(isPrivate, args)) guard(subcommand);
			continue;
		}

		if (subcommand === 'reflog') {
			if (!readOnlyReflog(args)) guard(subcommand);
			continue;
		}

		if (subcommand === 'config') {
			if (!readOnlyConfig(args) && !hooksPathConfig(args)) guard(subcommand);
			continue;
		}

		if (!READ_ONLY_COMMANDS.has(subcommand)) guard(subcommand);
	}

	return blocked;
}

function deny(reason: string) {
	process.stdout.write(
		JSON.stringify({
			hookSpecificOutput: {
				hookEventName: 'PreToolUse',
				permissionDecision: 'deny',
				permissionDecisionReason: reason,
			},
		}),
	);
}

const REASONS: Record<Reason, string> = {
	guard:
		"User guardrail: agents may inspect git state and may init, commit, fetch, pull, push, and set up remotes and upstream branches, and point core.hooksPath at the repo's hook folder, but must not reset, checkout, switch, restore, merge, rebase, tag, or otherwise rewrite history, refs, or the working tree unless the user changes this hook. Also blocked: --no-verify, and -c core.hooksPath set to a path outside the repo (fix what the repo hook reports, or ask the user) and an attribution trailer in a commit message (Co-Authored-By:, Claude-Session:). The same rules apply to git that a node or python script runs.",
	'shared-index':
		'Every session in a checkout shares .git/index, and a commit without paths takes everything staged there. Stage only in the Bash command that commits those paths: `git add -- <paths> && git commit --only -m <msg> -- <paths>` (delete or move a file with plain rm or mv, then name the old and new paths).',
	'whole-index':
		'A commit without paths, or with -a or -i, takes everything staged in the shared .git/index, including files another session staged. Name the paths: `git commit -m <msg> -- <paths>`.',
	'piped-commit':
		'A pipe after git commit hides its exit status: the pipeline returns the last filter\'s status, so a later `&&` step runs even when the pre-commit hook refuses the commit. Drop the pipe (read the full commit output), or put `set -o pipefail;` first.',
	'local-clone':
		'AGENTS.md forbids a clone, worktree or other copy of a checkout. Read the code in place, or with `git show <rev>:<path>`.',
};

function block(command: string, blocked: Blocked[]) {
	const gitText = `git ${[...new Set(blocked.map(({ subcommand }) => subcommand))].join('`, `git ')}`;
	const reasons = [...new Set(blocked.map(({ reason }) => reason))].map((reason) => REASONS[reason]);
	const reason = `Blocked ${gitText}. ${reasons.join(' ')} Routes that stay open: discard your own edit to a file with \`git show HEAD:<path> > <path>\`; list tags with \`git for-each-ref refs/tags\`; work on the current branch and fix forward (no new branch, no revert); commit only your hunks of a shared file through a private index (\`GIT_INDEX_FILE=<scratch>/index git read-tree HEAD\`, stage and commit with the same variable, then \`git diff --cached -R --binary -- <paths> | git apply --cached\`). For anything else, give the user the exact command to run with \`!\`, and never reach it another way. Command: ${command}`;
	deny(reason);
}

let input: HookInput;
try {
	const chunks: Buffer[] = [];
	for await (const chunk of stdin) chunks.push(chunk as Buffer);
	input = JSON.parse(Buffer.concat(chunks).toString('utf8'));
} catch (err) {
	logError('parse-stdin', err);
	// Exit 2 blocks a PreToolUse call: input the guard cannot read must not run.
	process.stderr.write(
		'Blocked: the git guard hook could not read its input, so it cannot check this command.\n',
	);
	process.exit(2);
}

// The Bash tool and the Monitor tool both run their `command` in zsh.
const toolName = input.tool_name ?? '';
if (toolName !== 'Bash' && toolName !== 'Monitor') process.exit(0);

const command = input.tool_input?.command ?? input.tool_input?.cmd ?? '';

// A shell check that fails to load or run must not switch off the git guard below,
// so it is imported here and not at the top of the file.
try {
	const { shellTrap } = await import('./shell-traps.ts');
	const trap = shellTrap({
		command,
		tool: toolName,
	});
	if (trap) {
		deny(`${trap} Command: ${command}`);
		process.exit(0);
	}
} catch (err) {
	logError('shell-traps', err);
}

if (!command.includes('git')) process.exit(0);

const blocked = blockedGitCommands(command, input.cwd ?? process.cwd());

if (blocked.length > 0) block(command, blocked);
