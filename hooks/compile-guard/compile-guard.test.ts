import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, symlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { TemporaryFiles } from '@zukhruf/fs';

// COMPILE_GUARD_SCRIPT lets the suite run against a scratch copy before the real hook is replaced.
const SCRIPT = process.env.COMPILE_GUARD_SCRIPT ?? new URL('./compile-guard.ts', import.meta.url).pathname;
const TSC = new URL('./node_modules/.bin/tsc', import.meta.url).pathname;

const COMPILES = 'export const answer: number = 42;\n';

function write(root: string, path: string, content: string) {
	mkdirSync(dirname(join(root, path)), { recursive: true });
	writeFileSync(join(root, path), content);
}

function git(root: string, ...args: string[]) {
	const result = spawnSync('git', ['-C', root, '-c', 'user.name=t', '-c', 'user.email=t@t', ...args], { encoding: 'utf8' });
	assert.equal(result.status, 0, result.stderr);
}

// A repo laid out like zukhruf: a solution tsconfig.json per package with a lib
// and a spec program, the repo's own tsc, and every file committed.
function sharedCheckout(root: string, { shared = true } = {}) {
	git(root, 'init', '-q', '-b', 'main');
	write(root, '.claude/settings.json', JSON.stringify(shared ? { env: { SHARED_CHECKOUT: '1' } } : {}));
	mkdirSync(join(root, 'node_modules', '.bin'), { recursive: true });
	symlinkSync(TSC, join(root, 'node_modules', '.bin', 'tsc'));
	write(root, '.gitignore', 'node_modules\n');
	const options = { strict: true, target: 'es2024', module: 'nodenext', types: [], composite: true, rewriteRelativeImportExtensions: true, rootDir: 'src' };
	write(root, 'packages/testing/tsconfig.json', JSON.stringify({ files: [], include: [], references: [{ path: './tsconfig.lib.json' }, { path: './tsconfig.spec.json' }] }));
	write(root, 'packages/testing/tsconfig.lib.json', JSON.stringify({ compilerOptions: options, include: ['src/**/*.ts'], exclude: ['src/**/*.test.ts'] }));
	write(root, 'packages/testing/tsconfig.spec.json', JSON.stringify({ compilerOptions: options, include: ['src/**/*.test.ts'] }));
	write(root, 'packages/testing/src/index.ts', COMPILES);
	git(root, 'add', '-A');
	git(root, 'commit', '-q', '-m', 'init');
}

// The transcript records each Edit and Write as a tool_use of an assistant entry.
function transcript(dir: string, name: string, files: string[]) {
	const path = join(dir, `${name}.jsonl`);
	const lines = files.map((file_path, i) =>
		JSON.stringify({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'tool_use', id: `t${i}`, name: i % 2 ? 'Write' : 'Edit', input: { file_path } }] } }),
	);
	writeFileSync(path, [JSON.stringify({ type: 'user', message: { role: 'user', content: 'go' } }), ...lines].join('\n') + '\n');
	return path;
}

function runHook(input: object): { decision?: string; reason?: string } | null {
	const result = spawnSync('node', [SCRIPT], { input: JSON.stringify(input), encoding: 'utf8' });
	assert.equal(result.status, 0, result.stderr);
	assert.equal(result.stderr, '');
	return result.stdout ? JSON.parse(result.stdout) : null;
}

test('refuses the stop of an agent whose draft does not compile (TS2322, msw.ts:33 on 2026-11-24), and names the patch route', () => {
	using dir = new TemporaryFiles().directorySync('compile-guard-');
	const root = join(dir.path, 'repo');
	mkdirSync(root);
	sharedCheckout(root);
	const msw = join(root, 'packages/testing/src/msw.ts');
	write(root, 'packages/testing/src/msw.ts', "export const port: number = 'eighty';\n");

	const output = runHook({ hook_event_name: 'Stop', cwd: root, transcript_path: transcript(dir.path, 'session', [msw]) });

	assert.equal(output?.decision, 'block');
	assert.match(output?.reason ?? '', /packages\/testing\/src\/msw\.ts:1:14 TS2322 /);
	assert.match(output?.reason ?? '', /sets SHARED_CHECKOUT/);
	assert.match(output?.reason ?? '', /patch file outside the repo/);
});

test("refuses a subagent's stop from its own transcript (TS2304, Cannot find name 'SocketInterceptorConnection')", () => {
	using dir = new TemporaryFiles().directorySync('compile-guard-');
	const root = join(dir.path, 'repo');
	mkdirSync(root);
	sharedCheckout(root);
	const msw = join(root, 'packages/testing/src/msw.ts');
	write(root, 'packages/testing/src/msw.ts', 'export function connect(connection: SocketInterceptorConnection) {\n  return connection;\n}\n');

	const output = runHook({
		hook_event_name: 'SubagentStop',
		cwd: root,
		transcript_path: transcript(dir.path, 'parent', []),
		agent_transcript_path: transcript(dir.path, 'agent', [msw]),
	});

	assert.equal(output?.decision, 'block');
	assert.match(output?.reason ?? '', /msw\.ts:1:37 TS2304 Cannot find name 'SocketInterceptorConnection'\./);
});

test('checks the spec program too, so a new test file that fails tsc is refused (docker-global-setup TS2379 case)', () => {
	using dir = new TemporaryFiles().directorySync('compile-guard-');
	const root = join(dir.path, 'repo');
	mkdirSync(root);
	sharedCheckout(root);
	const spec = join(root, 'packages/testing/src/scripts/docker-global-setup.integration.test.ts');
	write(root, 'packages/testing/src/scripts/docker-global-setup.integration.test.ts', 'const count: number = undefined;\nexport {};\n');

	const output = runHook({ hook_event_name: 'Stop', cwd: root, transcript_path: transcript(dir.path, 'session', [spec]) });

	assert.equal(output?.decision, 'block');
	assert.match(output?.reason ?? '', /docker-global-setup\.integration\.test\.ts:1:7 TS2322 /);
});

test('lets an agent stop when the files it wrote compile', () => {
	using dir = new TemporaryFiles().directorySync('compile-guard-');
	const root = join(dir.path, 'repo');
	mkdirSync(root);
	sharedCheckout(root);
	const index = join(root, 'packages/testing/src/index.ts');
	write(root, 'packages/testing/src/index.ts', "export const answer: number = 42;\nexport const name: string = 'x';\n");
	const spec = join(root, 'packages/testing/src/index.test.ts');
	write(root, 'packages/testing/src/index.test.ts', "import { answer } from './index.ts';\nexport const doubled: number = answer * 2;\n");

	assert.equal(runHook({ hook_event_name: 'Stop', cwd: root, transcript_path: transcript(dir.path, 'session', [index, spec]) }), null);
});

test("does not blame an agent for a peer's broken file that it did not write, in the same package", () => {
	using dir = new TemporaryFiles().directorySync('compile-guard-');
	const root = join(dir.path, 'repo');
	mkdirSync(root);
	sharedCheckout(root);
	write(root, 'packages/testing/src/peer-draft.ts', "export const port: number = 'eighty';\n");
	const index = join(root, 'packages/testing/src/index.ts');
	write(root, 'packages/testing/src/index.ts', 'export const answer: number = 43;\n');

	assert.equal(runHook({ hook_event_name: 'Stop', cwd: root, transcript_path: transcript(dir.path, 'session', [index]) }), null);
});

test('does not check a file that the agent wrote and then committed, because only an uncommitted file is a draft', () => {
	using dir = new TemporaryFiles().directorySync('compile-guard-');
	const root = join(dir.path, 'repo');
	mkdirSync(root);
	sharedCheckout(root);
	const msw = join(root, 'packages/testing/src/msw.ts');
	write(root, 'packages/testing/src/msw.ts', "export const port: number = 'eighty';\n");
	git(root, 'add', '-A');
	git(root, 'commit', '-q', '-m', 'msw');

	assert.equal(runHook({ hook_event_name: 'Stop', cwd: root, transcript_path: transcript(dir.path, 'session', [msw]) }), null);
});

test('leaves a repo alone when its own .claude/settings.json does not mark it a shared checkout', () => {
	using dir = new TemporaryFiles().directorySync('compile-guard-');
	const root = join(dir.path, 'repo');
	mkdirSync(root);
	sharedCheckout(root, { shared: false });
	const msw = join(root, 'packages/testing/src/msw.ts');
	write(root, 'packages/testing/src/msw.ts', "export const port: number = 'eighty';\n");

	assert.equal(runHook({ hook_event_name: 'Stop', cwd: root, transcript_path: transcript(dir.path, 'session', [msw]) }), null);
});

test("reads a subagent's own transcript at SubagentStop, so the session's broken draft is not the subagent's", () => {
	using dir = new TemporaryFiles().directorySync('compile-guard-');
	const root = join(dir.path, 'repo');
	mkdirSync(root);
	sharedCheckout(root);
	const msw = join(root, 'packages/testing/src/msw.ts');
	write(root, 'packages/testing/src/msw.ts', "export const port: number = 'eighty';\n");

	const output = runHook({
		hook_event_name: 'SubagentStop',
		cwd: root,
		transcript_path: transcript(dir.path, 'parent', [msw]),
		agent_transcript_path: transcript(dir.path, 'agent', []),
	});

	assert.equal(output, null);
});
