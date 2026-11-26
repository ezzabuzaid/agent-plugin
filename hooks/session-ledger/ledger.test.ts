import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { TemporaryFiles } from '@zukhruf/fs';

const LEDGER = new URL('./ledger.ts', import.meta.url).pathname;
// The README's registration, written with git config as Ezz writes it with --global.
// git runs a config hook through the shell with its arguments appended as "$@",
// so the shell test spares a node start when there is nothing to record.
const REGISTRATION = {
	'hook.session-ledger-commit.event': 'post-commit',
	'hook.session-ledger-commit.command': `[ -z "$CLAUDE_CODE_SESSION_ID" ] || exec node '${LEDGER}' post-commit`,
	'hook.session-ledger-ref.event': 'reference-transaction',
	'hook.session-ledger-ref.command': `[ -z "$CLAUDE_CODE_SESSION_ID" ] || [ "$1" != committed ] || exec node '${LEDGER}' reference-transaction`,
};
const SESSION = '0b6c3f1e-5d2a-4c8e-9f7a-1e2d3c4b5a69';

// A machine as git sees it: a HOME of its own and a user-level config that
// registers the ledger as git 2.54 config hooks, the way Ezz registers it.
// Every git call gets this env object, so no real config, git variable or session id leaks in.
function machine(root: string, session: string | undefined) {
	const home = join(root, 'home');
	mkdirSync(home);
	const config = join(root, 'gitconfig');
	writeFileSync(config, '[user]\n\tname = t\n\temail = t@example.invalid\n[init]\n\tdefaultBranch = main\n');
	for (const [key, value] of Object.entries(REGISTRATION)) {
		assert.equal(spawnSync('git', ['config', '--file', config, key, value]).status, 0);
	}
	// The runner's env minus every git variable and the runner's own session id.
	const env = {
		...Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('GIT_') && key !== 'CLAUDE_CODE_SESSION_ID')),
		HOME: home,
		GIT_CONFIG_GLOBAL: config,
		GIT_CONFIG_NOSYSTEM: '1',
		...(session === undefined ? {} : { CLAUDE_CODE_SESSION_ID: session }),
	};
	const run = (cwd: string, ...args: string[]) => spawnSync('git', args, { cwd, env, encoding: 'utf8' });
	const git = (cwd: string, ...args: string[]) => {
		const result = run(cwd, ...args);
		assert.equal(result.status, 0, `git ${args.join(' ')}: ${result.stderr}`);
		return result.stdout.trim();
	};
	const ledgerDir = join(home, '.claude', 'ledger');
	const ledger = () => readFileSync(join(ledgerDir, `${session}.jsonl`), 'utf8').trimEnd().split('\n').map((line) => JSON.parse(line));
	return { home, run, git, ledgerDir, ledger };
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

test('a fetch writes a ref line by fetch with the fetched sha, and none for the origin/HEAD symref', () => {
	using dir = new TemporaryFiles().directorySync('session-ledger-');
	const m = machine(dir.path, SESSION);
	const { work, remote } = workWithRemote(dir.path, m.git);
	m.git(work, 'push', '-q', 'origin', 'main');
	const peer = join(dir.path, 'peer');
	m.git(dir.path, 'clone', '-q', remote, peer);
	const pushed = commit(m.git, peer, 'b', 'peer');
	m.git(peer, 'push', '-q');
	const before = m.ledger().length;

	m.git(work, 'fetch', '-q', 'origin');

	const added = m.ledger().slice(before);
	assert.deepEqual(
		added.map(({ kind, repo, ref, new: value, by }) => ({ kind, repo, ref, new: value, by })),
		[{ kind: 'ref', repo: m.git(work, 'rev-parse', '--show-toplevel'), ref: 'refs/remotes/origin/main', new: pushed, by: 'fetch' }],
	);
});

test('with no CLAUDE_CODE_SESSION_ID a commit and a push write nothing and create no ledger folder', () => {
	using dir = new TemporaryFiles().directorySync('session-ledger-');
	const m = machine(dir.path, undefined);
	const { work } = workWithRemote(dir.path, m.git);

	m.git(work, 'push', '-q', 'origin', 'main');

	assert.equal(existsSync(m.ledgerDir), false);
});

test('a repo under ~/Desktop/mo writes nothing on commit or push', () => {
	using dir = new TemporaryFiles().directorySync('session-ledger-');
	const m = machine(dir.path, SESSION);
	const work = join(m.home, 'Desktop', 'mo', 'client');

	workWithRemote(dir.path, m.git, work);
	m.git(work, 'push', '-q', 'origin', 'main');

	assert.equal(existsSync(m.ledgerDir), false);
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
