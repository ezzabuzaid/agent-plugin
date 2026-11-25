// Black-box tests of close-check.mjs: each test runs the script as a child process, as the skill runs it.
//
// Seams. git is real: each test makes a throwaway repo with a bare remote, and the transcript holds the real output
// of its `git commit` and `git push`. gh and agent-backlog are the outer seams: the script reaches them only as
// executables on PATH, and a real gh would read GitHub's live runs and a real agent-backlog the user's own backlog.
// So each test puts a stand-in executable on PATH that answers only the exact call the contract names and fails on
// any other. The child gets PATH (the stand-ins, git, node) and HOME (an empty folder, so no user git config or
// hook runs) as its input; the test process's own env is not changed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync, chmodSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const script = join(here, 'close-check.mjs');
const scratchRoot = join(here, '..', '..', 'scripts-scratch');

function sandbox() {
  mkdirSync(scratchRoot, { recursive: true });
  const root = mkdtempSync(join(scratchRoot, 'close-'));
  const bin = join(root, 'bin');
  const home = join(root, 'home');
  mkdirSync(bin);
  mkdirSync(home);
  symlinkSync('/usr/bin/git', join(bin, 'git'));
  const env = { PATH: bin, HOME: home, GIT_CONFIG_NOSYSTEM: '1' };
  const run = (cwd, ...args) => execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...args], { cwd, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  const runBoth = (cwd, ...args) => {
    const r = spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...args], { cwd, env, encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
    return r.stdout + r.stderr;
  };
  execFileSync('git', ['init', '-q', '--bare', '-b', 'main', join(root, 'remote.git')], { env });
  const work = join(root, 'work');
  execFileSync('git', ['clone', '-q', join(root, 'remote.git'), work], { env, stdio: 'ignore' });
  writeFileSync(join(work, 'README.md'), 'start\n');
  run(work, 'add', 'README.md');
  run(work, 'commit', '-q', '-m', 'start');
  run(work, 'push', '-q', 'origin', 'HEAD:main');
  // A session commit: returns the real result text and the full sha.
  const commit = (file) => {
    writeFileSync(join(work, file), file);
    run(work, 'add', file);
    const result = run(work, 'commit', '-m', `add ${file}`);
    return { result, sha: run(work, 'rev-parse', 'HEAD').trim() };
  };
  const push = () => runBoth(work, 'push', 'origin', 'main');
  // A stand-in on PATH: prints `answers[args.join(' ')]` and exits 0, or fails on a call nobody expected.
  const standIn = (name, answers) => {
    const file = join(bin, name);
    writeFileSync(file, `#!${process.execPath}\nconst answers = ${JSON.stringify(answers)};\nconst key = process.argv.slice(2).join(' ');\nif (!(key in answers)) { console.error('unexpected call: ${name} ' + key); process.exit(1); }\nprocess.stdout.write(answers[key]);\n`);
    chmodSync(file, 0o755);
  };
  // A transcript of Bash calls, each [command, result]; subagent calls go to <id>/subagents/agent-1.jsonl.
  const transcript = (calls, subagentCalls = []) => {
    const file = join(root, 'session.jsonl');
    const lines = (list) => list.flatMap(([command, result], i) => [
      { type: 'assistant', cwd: work, message: { content: [{ type: 'tool_use', id: `t${i}`, name: 'Bash', input: { command } }] } },
      { type: 'user', cwd: work, message: { content: [{ type: 'tool_result', tool_use_id: `t${i}`, content: [{ type: 'text', text: result }] }] } },
    ].map((e) => JSON.stringify(e)).join('\n')).join('\n');
    writeFileSync(file, lines(calls));
    if (subagentCalls.length) {
      mkdirSync(join(root, 'session', 'subagents'), { recursive: true });
      writeFileSync(join(root, 'session', 'subagents', 'agent-1.jsonl'), lines(subagentCalls));
    }
    return file;
  };
  const check = (transcriptFile) => spawnSync(process.execPath, [script, '--transcript', transcriptFile], { env, encoding: 'utf8' });
  return { root, work, commit, push, standIn, transcript, check, run, [Symbol.dispose]: () => rmSync(root, { recursive: true, force: true }) };
}

const ghKey = (sha) => `run list --commit ${sha} --json name,status,conclusion,url`;
const lastLine = (out) => out.trimEnd().split('\n').at(-1);

test('a pushed commit whose CI run is in progress is open, exit 1', () => {
  using s = sandbox();
  const c = s.commit('a.txt');
  const pushed = s.push();
  s.standIn('gh', { [ghKey(c.sha)]: JSON.stringify([{ name: 'CI', status: 'in_progress', conclusion: '', url: 'https://ci/1' }]) });

  const r = s.check(s.transcript([['git commit -m "add a.txt"', c.result], ['git push origin main', pushed]]));

  assert.match(r.stdout, /  OPEN CI: in_progress https:\/\/ci\/1/);
  assert.equal(lastLine(r.stdout), 'Open: 1');
  assert.equal(r.status, 1, r.stderr);
});

test('all runs green and nothing unpushed prints Nothing open., exit 0', () => {
  using s = sandbox();
  const c = s.commit('a.txt');
  const pushed = s.push();
  s.standIn('gh', { [ghKey(c.sha)]: JSON.stringify([
    { name: 'CI', status: 'completed', conclusion: 'success', url: 'https://ci/1' },
    { name: 'Release', status: 'completed', conclusion: 'success', url: 'https://ci/2' },
  ]) });

  const r = s.check(s.transcript([[`git -C ${s.work} commit -m x`, c.result], [`cd ${s.work} && git push origin main`, pushed]]));

  assert.match(r.stdout, /Release: completed success/);
  assert.doesNotMatch(r.stdout, /OPEN/);
  assert.equal(lastLine(r.stdout), 'Nothing open.');
  assert.equal(r.status, 0, r.stderr);
});

test('a missing gh is an open item, not silence', () => {
  using s = sandbox();
  const c = s.commit('a.txt');
  const pushed = s.push();

  const r = s.check(s.transcript([['git commit -m x', c.result], ['git push', pushed]]));

  assert.match(r.stdout, new RegExp(`OPEN could not read CI for ${c.sha.slice(0, 12)}: gh not found`));
  assert.equal(lastLine(r.stdout), 'Open: 1');
  assert.equal(r.status, 1);
});

test("the session's unpushed commit is open and a peer's unpushed commit is not listed", () => {
  using s = sandbox();
  const mine = s.commit('mine.txt');
  const peer = s.commit('peer.txt');

  const r = s.check(s.transcript([['git commit -m x', mine.result]]));

  assert.match(r.stdout, new RegExp(`OPEN ${s.work} main ${mine.sha.slice(0, 12)} add mine.txt`));
  assert.doesNotMatch(r.stdout, new RegExp(peer.sha.slice(0, 7)));
  assert.equal(lastLine(r.stdout), 'Open: 1');
  assert.equal(r.status, 1);
});

test("a subagent's unpushed commit counts as the session's", () => {
  using s = sandbox();
  const c = s.commit('sub.txt');

  const r = s.check(s.transcript([['ls', 'README.md']], [['git commit -m x', c.result]]));

  assert.match(r.stdout, new RegExp(`OPEN ${s.work} main ${c.sha.slice(0, 12)} add sub.txt`));
  assert.equal(r.status, 1);
});

test("the session's ready backlog items are open; other ready items and its blocked items are not", () => {
  using s = sandbox();
  const item = (id, readiness) => ({ id, title: `item ${id}`, repositoryName: 'work', readiness });
  s.standIn('agent-backlog', { 'ready --all-repos --json': JSON.stringify([item(41, 'ready'), item(42, 'ready'), item(43, 'blocked'), item(99, 'ready')]) });

  const r = s.check(s.transcript([
    ['agent-backlog add "item 41" --kind defect --work-type internal', '┌  agent-backlog\n│\n◇  #41 · defect · internal ─────╮\n│  item 41  │\n'],
    ['agent-backlog update 42 --description "more"', ''],
    ['agent-backlog wait 43 --after 41', ''],
  ]));

  assert.match(r.stdout, /OPEN #41 item 41 \(work\)/);
  assert.match(r.stdout, /OPEN #42 item 42 \(work\)/);
  assert.doesNotMatch(r.stdout, /#43|#99/);
  assert.equal(lastLine(r.stdout), 'Open: 2');
  assert.equal(r.status, 1);
});

test('a transcript that does not exist is a read error, exit 2', () => {
  using s = sandbox();

  const r = s.check(join(s.root, 'missing.jsonl'));

  assert.match(r.stderr, /transcript not found/);
  assert.equal(r.status, 2);
});
