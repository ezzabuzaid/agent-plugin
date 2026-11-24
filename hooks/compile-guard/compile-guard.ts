#!/usr/bin/env node
// Stop and SubagentStop hook. In a shared checkout, other sessions build from
// the files on disk, so an agent may not stop while a TypeScript file that it
// wrote, and that is still uncommitted, does not compile.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { stdin } from 'node:process';

interface HookInput {
	hook_event_name?: string;
	cwd?: string;
	transcript_path?: string;
	agent_transcript_path?: string;
}

interface CompileError {
	file: string;
	line: string;
	column: string;
	code: string;
	message: string;
}

// The marker is the repo's own: `"env": { "SHARED_CHECKOUT": "1" }` in its
// committed .claude/settings.json, so no shared file lists repos.
const MARKER = 'SHARED_CHECKOUT';
const WRITE_TOOLS = new Set(['Edit', 'Write', 'MultiEdit', 'NotebookEdit']);
const TYPESCRIPT_FILE = /\.[cm]?tsx?$/;
const DIAGNOSTIC = /^(.+?)\((\d+),(\d+)\): error (TS\d+): (.*)$/;
const SHOWN_ERRORS = 20;

async function readInput(): Promise<HookInput> {
	let raw = '';
	for await (const chunk of stdin) raw += chunk;
	return raw.trim() ? (JSON.parse(raw) as HookInput) : {};
}

// A subagent's own transcript holds only its own tool calls; the session's
// transcript holds the session's, without its subagents'.
function transcriptOf(input: HookInput): string | undefined {
	const path = input.hook_event_name === 'SubagentStop' ? input.agent_transcript_path : input.transcript_path;
	return path ? path : undefined;
}

function writtenFiles(transcript: string, cwd: string): Set<string> {
	const files = new Set<string>();
	for (const line of readFileSync(transcript, 'utf8').split('\n')) {
		if (!line.includes('"tool_use"')) continue;
		let entry: { type?: string; message?: { content?: unknown } };
		try {
			entry = JSON.parse(line);
		} catch {
			continue;
		}
		if (entry.type !== 'assistant' || !Array.isArray(entry.message?.content)) continue;
		for (const block of entry.message.content as { type?: string; name?: string; input?: Record<string, unknown> }[]) {
			if (block?.type !== 'tool_use' || !WRITE_TOOLS.has(block.name ?? '')) continue;
			const path = block.input?.['file_path'] ?? block.input?.['notebook_path'];
			if (typeof path !== 'string' || !TYPESCRIPT_FILE.test(path)) continue;
			// A file that is gone cannot fail to compile; git names the rest by their real path.
			const file = resolve(cwd, path);
			if (existsSync(file)) files.add(realpathSync(file));
		}
	}
	return files;
}

function git(cwd: string, args: string[]) {
	return spawnSync('git', ['-C', cwd, ...args], { encoding: 'utf8' });
}

function repoRoot(file: string): string | undefined {
	const result = git(dirname(file), ['rev-parse', '--show-toplevel']);
	return result.status === 0 ? resolve(result.stdout.trim()) : undefined;
}

function isSharedCheckout(root: string): boolean {
	try {
		const settings = JSON.parse(readFileSync(join(root, '.claude', 'settings.json'), 'utf8'));
		const value = settings?.env?.[MARKER];
		return typeof value === 'string' && value !== '' && value !== '0' && value !== 'false';
	} catch {
		return false;
	}
}

// Committed files compiled at their commit; only an uncommitted file can be a
// draft that this agent left behind.
function uncommitted(root: string, files: string[]): Set<string> {
	const result = git(root, ['status', '--porcelain=v1', '-z', '--untracked-files=all', '--', ...files.map((file) => relative(root, file))]);
	const dirty = new Set<string>();
	if (result.status !== 0) return dirty;
	const fields = result.stdout.split('\0');
	for (let i = 0; i < fields.length; i++) {
		const field = fields[i];
		if (field.length < 4) continue;
		dirty.add(resolve(root, field.slice(3)));
		// A rename or copy names its source in the next field.
		if (field[0] === 'R' || field[0] === 'C') i++;
	}
	return dirty;
}

function nearest(from: string, root: string, name: string): string | undefined {
	for (let dir = from; ; dir = dirname(dir)) {
		if (existsSync(join(dir, name))) return join(dir, name);
		if (dir === root || dirname(dir) === dir) return undefined;
	}
}

// A solution-style tsconfig.json (files: [], references) checks nothing itself;
// its references inside the package are the programs, such as lib and spec.
function programs(tsconfig: string): string[] {
	const pkg = dirname(tsconfig);
	let config: { files?: unknown; include?: unknown; references?: { path?: string }[] };
	try {
		config = JSON.parse(readFileSync(tsconfig, 'utf8'));
	} catch {
		return [tsconfig];
	}
	const empty = (value: unknown) => value === undefined || (Array.isArray(value) && value.length === 0);
	const solution = Array.isArray(config.files) && config.files.length === 0 && empty(config.include);
	if (!solution || !Array.isArray(config.references)) return [tsconfig];
	return config.references
		.map((reference) => (typeof reference?.path === 'string' ? resolve(pkg, reference.path) : ''))
		.map((path) => (path.endsWith('.json') ? path : join(path, 'tsconfig.json')))
		.filter((path) => path.startsWith(pkg + sep) && existsSync(path));
}

function compileErrors(tsc: string, program: string): CompileError[] {
	const cwd = dirname(program);
	const result = spawnSync(tsc, ['--noEmit', '--composite', 'false', '--incremental', 'false', '--pretty', 'false', '-p', program], {
		cwd,
		encoding: 'utf8',
		timeout: 50_000,
	});
	const errors: CompileError[] = [];
	for (const line of (result.stdout ?? '').split('\n')) {
		const match = DIAGNOSTIC.exec(line);
		if (!match) continue;
		const [, file, lineNumber, column, code, message] = match;
		errors.push({ file: isAbsolute(file) ? file : resolve(cwd, file), line: lineNumber, column, code, message });
	}
	return errors;
}

function refusal(root: string, files: string[], errors: CompileError[]): string {
	const shown = errors
		.slice(0, SHOWN_ERRORS)
		.map((error) => `- ${relative(root, error.file)}:${error.line}:${error.column} ${error.code} ${error.message}`);
	if (errors.length > SHOWN_ERRORS) shown.push(`- and ${errors.length - SHOWN_ERRORS} more`);
	const yours = files.map((file) => relative(root, file)).join(' ');
	return [
		`Files you wrote in ${root} do not compile. This repo is a shared checkout (its .claude/settings.json sets ${MARKER}): other sessions build from these files, so your draft breaks their runs.`,
		...shown,
		'Before you stop, make these files compile. If the work cannot compile yet, move it out of the repo: save it as a patch file outside the repo (for example `git diff -- <file>` for a tracked file, a copy for a new file), take it back out of the checkout, and apply it when it compiles; then commit it at once.',
		`Your uncommitted TypeScript files here: ${yours}`,
	].join('\n');
}

function check(input: HookInput): string | undefined {
	const transcript = transcriptOf(input);
	if (!transcript || !existsSync(transcript)) return undefined;
	const byRoot = new Map<string, string[]>();
	for (const file of writtenFiles(transcript, input.cwd ?? process.cwd())) {
		const root = repoRoot(file);
		if (root) byRoot.set(root, [...(byRoot.get(root) ?? []), file]);
	}
	const reasons: string[] = [];
	for (const [root, files] of byRoot) {
		if (!isSharedCheckout(root)) continue;
		const own = uncommitted(root, files);
		if (own.size === 0) continue;
		const runs = new Map<string, string>();
		for (const file of own) {
			const tsconfig = nearest(dirname(file), root, 'tsconfig.json');
			const tsc = tsconfig && nearest(dirname(tsconfig), root, join('node_modules', '.bin', 'tsc'));
			if (!tsconfig || !tsc) continue;
			for (const program of programs(tsconfig)) runs.set(program, tsc);
		}
		const errors = new Map<string, CompileError>();
		for (const [program, tsc] of runs) {
			for (const error of compileErrors(tsc, program)) {
				if (own.has(error.file)) errors.set(`${error.file}:${error.line}:${error.column}:${error.code}`, error);
			}
		}
		if (errors.size > 0) reasons.push(refusal(root, [...own], [...errors.values()]));
	}
	return reasons.length > 0 ? reasons.join('\n\n') : undefined;
}

try {
	const reason = check(await readInput());
	if (reason) process.stdout.write(JSON.stringify({ decision: 'block', reason }));
} catch (error) {
	// Fail open: a broken guard must not trap an agent in its stop.
	process.stderr.write(`compile-guard: ${error instanceof Error ? error.stack : String(error)}\n`);
}
