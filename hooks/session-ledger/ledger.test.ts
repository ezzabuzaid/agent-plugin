import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, realpathSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { TemporaryFiles } from '@zukhruf/fs';

const LEDGER = realpathSync(new URL('./ledger.ts', import.meta.url));
const INSTALL = new URL('./install.sh', import.meta.url).pathname;
const SESSION = '0b6c3f1e-5d2a-4c8e-9f7a-1e2d3c4b5a69';

// A machine as git sees it: a HOME of its own, a user-level config in which
// install.sh registers the ledger as it does with Ezz's --global config, a
// TMPDIR of its own (so the fixture repos are not in the system temp folder
// for the hook) given through a symlink, as macOS gives /var/folders for
// /private/var/folders, and a `node` first on PATH that logs each start before it
// runs the real node. Every git call gets this env object, so no real config,
// git variable or session id leaks in.
function machine(root: string, session: string | undefined) {
	const home = join(root, 'home');
	mkdirSync(home);
	const tmp = join(root, 'tmp');
	mkdirSync(tmp);
	symlinkSync(tmp, join(root, 'tmp-link'));
	const bin = join(root, 'bin');
	mkdirSync(bin);
	const starts = join(root, 'node-starts');
	writeFileSync(join(bin, 'node'), `#!/bin/sh\nprintf '%s\\n' "$*" >> '${starts}'\nexec '${process.execPath}' "$@"\n`, { mode: 0o755 });
	const config = join(root, 'gitconfig');
	writeFileSync(config, '[user]\n\tname = t\n\temail = t@example.invalid\n[init]\n\tdefaultBranch = main\n');
	// The runner's env minus every git variable and the runner's own session id.
	const env = {
		...Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('GIT_') && key !== 'CLAUDE_CODE_SESSION_ID')),
		HOME: home,
		TMPDIR: join(root, 'tmp-link'),
		PATH: `${bin}:${process.env.PATH}`,
		GIT_CONFIG_GLOBAL: config,
		GIT_CONFIG_NOSYSTEM: '1',
		...(session === undefined ? {} : { CLAUDE_CODE_SESSION_ID: session }),
	};
	// Run from outside the package, as Ezz runs it from any folder.
	const install = () => spawnSync('sh', [INSTALL], { cwd: root, env, encoding: 'utf8' });
	const installed = install();
	assert.equal(installed.status, 0, installed.stderr);
	const run = (cwd: string, ...args: string[]) => spawnSync('git', args, { cwd, env, encoding: 'utf8' });
	const git = (cwd: string, ...args: string[]) => {
		const result = run(cwd, ...args);
		assert.equal(result.status, 0, `git ${args.join(' ')}: ${result.stderr}`);
		return result.stdout.trim();
	};
	const ledgerDir = join(home, '.claude', 'ledger');
	const ledger = () => readFileSync(join(ledgerDir, `${session}.jsonl`), 'utf8').trimEnd().split('\n').map((line) => JSON.parse(line));
	const nodeStarts = () => (existsSync(starts) ? readFileSync(starts, 'utf8').trimEnd().split('\n') : []);
	return { home, tmp, config, install, run, git, ledgerDir, ledger, nodeStarts };
}

// A work repo with one commit and a local bare remote named origin.
function workWithRemote(root: string, git: (cwd: string, ...args: string[]) => string, work = join(root, 'work')) {
	const remote = join(root, 'remote.git');
	git(root, 'init', '-q', '--bare', remote);
	mkdirSync(work, { recursive: true });
	git(work, 'init', '-q');
	git(work, 'remote', 'add', 'origin', remote);
	commit(git, work, 'a', 'one');
	return { work, remote };
}

function commit(git: (cwd: string, ...args: string[]) => string, cwd: string, file: string, message: string) {
	writeFileSync(join(cwd, file), message);
	git(cwd, 'add', file);
	git(cwd, 'commit', '-q', '-m', message);
	return git(cwd, 'rev-parse', 'HEAD');
}

test('a rejected push writes nothing: the remote kept its own head, so no tracking ref moved', () => {
	using dir = new TemporaryFiles().directorySync('session-ledger-');
	const m = machine(dir.path, SESSION);
	const { work, remote } = workWithRemote(dir.path, m.git);
	m.git(work, 'push', '-q', 'origin', 'main');
	const peer = join(dir.path, 'peer');
	m.git(dir.path, 'clone', '-q', remote, peer);
	commit(m.git, peer, 'b', 'peer');
	m.git(peer, 'push', '-q');
	commit(m.git, work, 'c', 'mine');
	const lines = m.ledger().length;

	const push = m.run(work, 'push', '-q', 'origin', 'main');

	assert.notEqual(push.status, 0, 'the push must be rejected as non-fast-forward');
	assert.equal(m.ledger().length, lines);
});

test('a push writes one ref line for refs/remotes/origin/main with the pushed sha, by push, and nothing for the bare remote', () => {
	using dir = new TemporaryFiles().directorySync('session-ledger-');
	const m = machine(dir.path, SESSION);
	const { work } = workWithRemote(dir.path, m.git);
	const head = m.git(work, 'rev-parse', 'HEAD');

	// The second refspec lands under refs/remotes/ of the bare remote, so its receive-pack has a line to record.
	const push = m.run(work, 'push', 'origin', 'main', 'main:refs/remotes/peer/main');

	assert.equal(push.status, 0, push.stderr);
	assert.doesNotMatch(push.stderr, /^ledger: /m);
	const refs = m.ledger().filter((fact) => fact.kind === 'ref');
	assert.deepEqual(refs, [{ session: SESSION, kind: 'ref', repo: m.git(work, 'rev-parse', '--show-toplevel'), ref: 'refs/remotes/origin/main', new: head, by: 'push', at: refs[0]?.at }]);
	assert.ok(Date.parse(refs[0].at) > Date.now() - 60_000);
});

test('a push in a repo with core.logAllRefUpdates=false writes its ref line by unknown, since only the reflog tells a push from a fetch', () => {
	using dir = new TemporaryFiles().directorySync('session-ledger-');
	const m = machine(dir.path, SESSION);
	const { work } = workWithRemote(dir.path, m.git);
	m.git(work, 'config', 'core.logAllRefUpdates', 'false');
	const head = m.git(work, 'rev-parse', 'HEAD');

	m.git(work, 'push', '-q', 'origin', 'main');

	const refs = m.ledger().filter((fact) => fact.kind === 'ref');
	assert.deepEqual(refs.map(({ ref, new: value, by }) => ({ ref, new: value, by })), [{ ref: 'refs/remotes/origin/main', new: head, by: 'unknown' }]);
});

test('a remote branch deleted by a push writes no ref line', () => {
	using dir = new TemporaryFiles().directorySync('session-ledger-');
	const m = machine(dir.path, SESSION);
	const { work } = workWithRemote(dir.path, m.git);
	m.git(work, 'push', '-q', 'origin', 'main', 'main:topic');
	const before = m.ledger();

	const push = m.run(work, 'push', '-q', 'origin', '--delete', 'topic');

	assert.equal(push.status, 0, push.stderr);
	assert.equal(push.stderr, '');
	assert.deepEqual(m.ledger(), before);
});

test('a fetch writes a ref line by fetch with the fetched sha, and none for the origin/HEAD symref or the tag it fetches in the same transaction', () => {
	using dir = new TemporaryFiles().directorySync('session-ledger-');
	const m = machine(dir.path, SESSION);
	const { work, remote } = workWithRemote(dir.path, m.git);
	m.git(work, 'push', '-q', 'origin', 'main');
	const peer = join(dir.path, 'peer');
	m.git(dir.path, 'clone', '-q', remote, peer);
	const pushed = commit(m.git, peer, 'b', 'peer');
	m.git(peer, 'tag', 'v1');
	m.git(peer, 'push', '-q', 'origin', 'main', 'v1');
	const before = m.ledger().length;

	m.git(work, 'fetch', '-q', 'origin');

	const added = m.ledger().slice(before);
	assert.deepEqual(
		added.map(({ kind, repo, ref, new: value, by }) => ({ kind, repo, ref, new: value, by })),
		[{ kind: 'ref', repo: m.git(work, 'rev-parse', '--show-toplevel'), ref: 'refs/remotes/origin/main', new: pushed, by: 'fetch' }],
	);
});

test('with no CLAUDE_CODE_SESSION_ID a commit and a push write nothing', () => {
	using dir = new TemporaryFiles().directorySync('session-ledger-');
	const m = machine(dir.path, undefined);
	const { work } = workWithRemote(dir.path, m.git);

	m.git(work, 'push', '-q', 'origin', 'main');

	assert.deepEqual(readdirSync(m.ledgerDir), ['installed-at']);
});

test('a repo under ~/Desktop/mo writes nothing on commit or push', () => {
	using dir = new TemporaryFiles().directorySync('session-ledger-');
	const m = machine(dir.path, SESSION);
	const work = join(m.home, 'Desktop', 'mo', 'client');

	workWithRemote(dir.path, m.git, work);
	m.git(work, 'push', '-q', 'origin', 'main');

	assert.deepEqual(readdirSync(m.ledgerDir), ['installed-at']);
});

test('a commit writes one commit line with the real sha, the branch ref and the repo top level', () => {
	using dir = new TemporaryFiles().directorySync('session-ledger-');
	const m = machine(dir.path, SESSION);
	const work = join(dir.path, 'work');
	mkdirSync(work);
	m.git(work, 'init', '-q');

	const sha = commit(m.git, work, 'a', 'one');

	const facts = m.ledger();
	assert.deepEqual(facts, [{ session: SESSION, kind: 'commit', repo: m.git(work, 'rev-parse', '--show-toplevel'), sha, ref: 'refs/heads/main', at: facts[0]?.at }]);
	assert.ok(Date.parse(facts[0].at) > Date.now() - 60_000);
});

test('a repo inside TMPDIR writes nothing on commit or push', () => {
	using dir = new TemporaryFiles().directorySync('session-ledger-');
	const m = machine(dir.path, SESSION);
	const work = join(m.tmp, 'fixture');

	workWithRemote(dir.path, m.git, work);
	m.git(work, 'push', '-q', 'origin', 'main');

	assert.deepEqual(readdirSync(m.ledgerDir), ['installed-at']);
});

test('a repo under /tmp writes nothing on commit or push, also with TMPDIR elsewhere', () => {
	using dir = new TemporaryFiles().directorySync('session-ledger-', { parent: '/tmp' });
	const m = machine(dir.path, SESSION);

	const { work } = workWithRemote(dir.path, m.git);
	m.git(work, 'push', '-q', 'origin', 'main');

	assert.deepEqual(readdirSync(m.ledgerDir), ['installed-at']);
});

test('a commit starts node once, for post-commit, and not for the transaction that moves its branch', () => {
	using dir = new TemporaryFiles().directorySync('session-ledger-');
	const m = machine(dir.path, SESSION);
	const work = join(dir.path, 'work');
	mkdirSync(work);
	m.git(work, 'init', '-q');

	commit(m.git, work, 'a', 'one');

	assert.deepEqual(m.nodeStarts(), [`${LEDGER} post-commit`]);
});

test('install.sh replaces the old registration with its two hooks and writes installed-at with the install time', () => {
	using dir = new TemporaryFiles().directorySync('session-ledger-');
	const m = machine(dir.path, undefined);
	// The registration of agent-plugin 8843eb2, as Ezz installed it on 2026-11-26.
	for (const [key, value] of [
		['hook.session-ledger-commit.command', `[ -z "$CLAUDE_CODE_SESSION_ID" ] || exec node ${LEDGER} post-commit`],
		['hook.session-ledger-ref.command', `[ -z "$CLAUDE_CODE_SESSION_ID" ] || [ "$1" != committed ] || exec node ${LEDGER} reference-transaction`],
	]) {
		assert.equal(spawnSync('git', ['config', '--file', m.config, key, value]).status, 0);
	}
	const hook = join(realpathSync(new URL('.', import.meta.url)), 'hook.sh');

	const result = m.install();

	assert.equal(result.status, 0, result.stderr);
	assert.equal(
		spawnSync('git', ['config', '--file', m.config, '--get-regexp', '^hook\\.session-ledger'], { encoding: 'utf8' }).stdout,
		[
			'hook.session-ledger-commit.event post-commit',
			`hook.session-ledger-commit.command sh '${hook}' post-commit`,
			'hook.session-ledger-ref.event reference-transaction',
			`hook.session-ledger-ref.command sh '${hook}' reference-transaction`,
			'',
		].join('\n'),
	);
	const marker = readFileSync(join(m.ledgerDir, 'installed-at'), 'utf8');
	assert.match(marker, /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ\n$/);
	const at = Date.parse(marker.trimEnd());
	assert.ok(at > Date.now() - 60_000 && at <= Date.now(), marker);
});
