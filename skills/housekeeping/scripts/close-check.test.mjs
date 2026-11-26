// Black-box tests of close-check.mjs: each test runs the script as a child process, as the skill runs it.
//
// Seams. git is real: each test makes a throwaway repo with a bare remote, and the transcript holds the real output
// of its `git commit` and `git push`. gh and agent-backlog are the outer seams: the script reaches them only as
// executables on PATH, and a real gh would read GitHub's live runs and a real agent-backlog the user's own backlog.
// So each test puts a stand-in executable on PATH that answers only the exact call the contract names and fails on
// any other. The child gets the runner's env with every input the script and git read replaced: PATH (the
// stand-ins, git, node), HOME (an empty folder, so no user git config or hook runs), no GIT_* variable and no
// CLAUDE_CODE_SESSION_ID. The rest passes through, so the script runs with the Node flags of the test process (a
// mutation prover's load hook among them). The test process's own env is not changed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync, chmodSync, realpathSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const script = join(here, 'close-check.mjs');
// Outside every git repo: "Created outside repos" lists a path only when no repo holds it, so a sandbox inside the
// checkout would hide the very files that section exists for. realpath: macOS links /var to /private/var.
// Each sandbox is its own temp folder, so a run leaves no shared parent folder behind.
const tempRoot = realpathSync(tmpdir());

function sandbox() {
  const root = mkdtempSync(join(tempRoot, 'housekeeping-close-check-'));
  const bin = join(root, 'bin');
  const home = join(root, 'home');
  mkdirSync(bin);
  mkdirSync(home);
  symlinkSync('/usr/bin/git', join(bin, 'git'));
  const inherited = Object.entries(process.env).filter(([name]) => !name.startsWith('GIT_') && name !== 'CLAUDE_CODE_SESSION_ID');
  const env = { ...Object.fromEntries(inherited), PATH: bin, HOME: home, GIT_CONFIG_NOSYSTEM: '1' };
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
  // A session commit of several files, each { path: content }: returns the real result text and the full sha.
  const commitFiles = (files) => {
    for (const [path, content] of Object.entries(files)) {
      mkdirSync(dirname(join(work, path)), { recursive: true });
      writeFileSync(join(work, path), content);
    }
    run(work, 'add', '-A');
    const result = run(work, 'commit', '-m', 'session change');
    return { result, sha: run(work, 'rev-parse', 'HEAD').trim() };
  };
  // A transcript of events, each one second after the last; subagent events go to <id>/subagents/agent-1.jsonl.
  //   { bash, result }             a Bash call
  //   { tool, input, detail }      another tool call; detail is the result's toolUseResult
  //   { prompt, origin }           a user prompt (origin kind, default 'human')
  //   { meta }                     a meta user entry (a loaded skill's text)
  //   { say }                      the agent's text
  //   { at }                       a seconds offset for the next event (to interleave main and subagent events)
  const session = (events, subagentEvents = []) => {
    const file = join(root, 'session.jsonl');
    const lines = (list, tag) => {
      let second = 0;
      return list.flatMap((event, i) => {
        if ('at' in event) { second = event.at; return []; }
        const timestamp = new Date(Date.UTC(2026, 10, 26, 10, 0, second++)).toISOString();
        const id = `${tag}${i}`;
        const base = { cwd: work, timestamp };
        if ('bash' in event || 'tool' in event) {
          const [name, input] = 'bash' in event ? ['Bash', { command: event.bash }] : [event.tool, event.input];
          return [
            { ...base, type: 'assistant', message: { content: [{ type: 'tool_use', id, name, input }] } },
            { ...base, type: 'user', toolUseResult: event.detail, message: { content: [{ type: 'tool_result', tool_use_id: id, content: [{ type: 'text', text: event.result ?? 'ok' }] }] } },
          ];
        }
        if ('prompt' in event) return [{ ...base, type: 'user', origin: { kind: event.origin ?? 'human' }, message: { role: 'user', content: event.prompt } }];
        if ('meta' in event) return [{ ...base, type: 'user', isMeta: true, message: { role: 'user', content: [{ type: 'text', text: event.meta }] } }];
        return [{ ...base, type: 'assistant', message: { content: [{ type: 'text', text: event.say }] } }];
      }).map((e) => JSON.stringify(e)).join('\n');
    };
    writeFileSync(file, lines(events, 'm'));
    if (subagentEvents.length) {
      mkdirSync(join(root, 'session', 'subagents'), { recursive: true });
      writeFileSync(join(root, 'session', 'subagents', 'agent-1.jsonl'), lines(subagentEvents, 's'));
    }
    return file;
  };
  const check = (transcriptFile) => spawnSync(process.execPath, [script, '--transcript', transcriptFile], { env, encoding: 'utf8' });
  return { root, home, work, commit, commitFiles, push, session, standIn, transcript, check, run, [Symbol.dispose]: () => rmSync(root, { recursive: true, force: true }) };
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

// #5823: gh run list --commit <short sha> matches no run (deepagents 77101148, 2026-11-26), so a head that
// rev-parse cannot resolve would read as "no runs" while its CI stays unread.
test('a pushed head that rev-parse cannot resolve is open, and gh is not asked with the short sha', () => {
  using s = sandbox();
  s.standIn('gh', { [ghKey('deadbee')]: '[]' });

  const r = s.check(s.transcript([['git push origin main', 'To remote.git\n   1234567..deadbee  main -> main\n']]));

  assert.match(r.stdout, /  OPEN cannot resolve deadbee to a commit in .+: CI not read\n/);
  assert.doesNotMatch(r.stdout, /no runs/);
  assert.equal(lastLine(r.stdout), 'Open: 1');
  assert.equal(r.status, 1, r.stderr);
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

test("a push range line in the output of a command that is not git push lists no push", () => {
  using s = sandbox();
  const c = s.commit('a.txt');
  const pushed = s.push();

  const r = s.check(s.transcript([
    [`git commit -m x`, c.result],
    [`cd ${s.work}; grep -h 'git push' other-session.jsonl; node -e 'git push'\ncat > notes.md <<'EOF'\ngit push origin main\nEOF`, pushed],
  ]));

  assert.match(r.stdout, /Pushes\n  none\n/);
  assert.equal(lastLine(r.stdout), 'Nothing open.');
  assert.equal(r.status, 0, r.stderr);
});

test("a subagent's git push is listed with its CI", () => {
  using s = sandbox();
  const c = s.commit('a.txt');
  const pushed = s.push();
  s.standIn('gh', { [ghKey(c.sha)]: JSON.stringify([{ name: 'CI', status: 'completed', conclusion: 'success', url: 'https://ci/1' }]) });

  const r = s.check(s.transcript([['ls', 'README.md']], [[`git -C ${s.work} push origin main 2>&1 | tail -3`, pushed]]));

  assert.match(r.stdout, new RegExp(`Pushes\\n  ${s.work} main ${c.sha.slice(0, 12)}\\n    CI: completed success`));
  assert.equal(lastLine(r.stdout), 'Nothing open.');
});

test('a push from a repo path that no longer exists is open as repo path not found, not gh not found', () => {
  using s = sandbox();
  const c = s.commit('a.txt');
  const pushed = s.push();
  const gone = join(s.root, 'gone');

  const r = s.check(s.transcript([[`cd ${gone} && git push origin main`, pushed]]));

  assert.match(r.stdout, new RegExp(`${gone} main ${c.sha.slice(0, 7)}\\S*\\n    OPEN repo path not found: ${gone}\\n`));
  assert.doesNotMatch(r.stdout, /gh not found/);
  assert.equal(lastLine(r.stdout), 'Open: 1');
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

const backlogCard = (id) => `┌  agent-backlog\n│\n◇  #${id} · defect · internal ─────╮\n│  item ${id}  │\n`;
const readyItem = (id, readiness = 'ready') => ({ id, title: `item ${id}`, repositoryName: 'work', readiness });

test("the session's ready items with a condition are open; other ready items and its blocked items are not", () => {
  using s = sandbox();
  s.standIn('agent-backlog', { 'ready --all-repos --json': JSON.stringify([readyItem(41), readyItem(43, 'blocked'), readyItem(99)]) });

  const r = s.check(s.transcript([
    ['agent-backlog add "item 41" --kind defect --work-type internal --until "a third consumer"', backlogCard(41)],
    ['agent-backlog wait 43 --after 41', ''],
  ]));

  assert.match(r.stdout, /OPEN #41 item 41 \(work\)/);
  assert.doesNotMatch(r.stdout, /#43|#99/);
  assert.equal(lastLine(r.stdout), 'Open: 1');
  assert.equal(r.status, 1);
});

test('a ready item the session filed with no condition is a CHECK line to mark, not open', () => {
  using s = sandbox();
  s.standIn('agent-backlog', { 'ready --all-repos --json': JSON.stringify([readyItem(41)]) });

  const r = s.check(s.transcript([['cd /tmp && agent-backlog add "item 41" --kind defect --work-type internal 2>&1 | tail -5', backlogCard(41)]]));

  assert.match(r.stdout, /Filed \(yours: do it now, or say why it waits\)\n  CHECK #41 item 41 \(work\)\n/);
  assert.doesNotMatch(r.stdout, /OPEN/);
  assert.equal(lastLine(r.stdout), 'Nothing open. To mark: 1');
  assert.equal(r.status, 0);
});

// #5834: an add whose JSON result a pipeline stage reshaped, as jq -r '"#\(.id) \(.title)"' or jq -r .id does.
test('an add whose result a pipeline reshaped to a "#<id> <title>" line files its item', () => {
  using s = sandbox();
  s.standIn('agent-backlog', { 'ready --all-repos --json': JSON.stringify([readyItem(41)]) });

  const r = s.check(s.transcript([['agent-backlog add "item 41" --kind defect --work-type internal --json | jq -r \'"#\\(.id) \\(.title)"\'', '#41 item 41\n']]));

  assert.match(r.stdout, /Filed \(yours: do it now, or say why it waits\)\n  CHECK #41 item 41 \(work\)\n/);
});

test('an add whose result a pipeline reshaped to a bare id line files its item', () => {
  using s = sandbox();
  s.standIn('agent-backlog', { 'ready --all-repos --json': JSON.stringify([readyItem(41)]) });

  const r = s.check(s.transcript([['agent-backlog add "item 41" --kind defect --work-type internal --json | jq -r .id', '41\n']]));

  assert.match(r.stdout, /Filed \(yours: do it now, or say why it waits\)\n  CHECK #41 item 41 \(work\)\n/);
});

test('an item filed with no condition and then given one with wait is open once ready', () => {
  using s = sandbox();
  s.standIn('agent-backlog', { 'ready --all-repos --json': JSON.stringify([readyItem(41)]) });

  const r = s.check(s.transcript([
    ['agent-backlog add "item 41" --kind defect --work-type internal', backlogCard(41)],
    ['agent-backlog wait 41 --after 40', backlogCard(41)],
  ]));

  assert.match(r.stdout, /OPEN #41 item 41 \(work\)/);
  assert.equal(lastLine(r.stdout), 'Open: 1');
});

test('an add guarded by a dedup list in the same call files its item', () => {
  using s = sandbox();
  s.standIn('agent-backlog', { 'ready --all-repos --json': JSON.stringify([readyItem(41)]) });
  const listRow = '│  #3621  Turn 66 memory rules into claude-hook checks (agent-plugin)\n';

  const r = s.check(s.transcript([[
    "agent-backlog list --all-repos --search \"item\" 2>&1 | grep -E '^│  #' | head -3; cd /tmp && agent-backlog add \"item 41\" --kind defect --work-type internal",
    `${listRow}${backlogCard(41)}`,
  ]]));

  assert.match(r.stdout, /Filed \(yours: do it now, or say why it waits\)\n  CHECK #41 item 41 \(work\)\n/);
  assert.doesNotMatch(r.stdout, /#3621/);
});

// Item headers in a call's output add no item unless the call itself filed or changed the item.
function assertNoItemFrom(command) {
  using s = sandbox();
  s.standIn('agent-backlog', {});

  const r = s.check(s.transcript([[command, `${backlogCard(41)}${backlogCard(42)}`]]));

  assert.match(r.stdout, /Ready items\n  none\nFiled \(yours: do it now, or say why it waits\)\n  none\n/);
  assert.equal(lastLine(r.stdout), 'Nothing open.');
  assert.equal(r.status, 0, r.stderr);
}

test('item headers in agent-backlog list output add no item', () => assertNoItemFrom('agent-backlog list --all-repos --search memory'));
test('item headers in agent-backlog show output add no item', () => assertNoItemFrom('agent-backlog show 41'));
test('a show beside an add counts no id from the result', () => assertNoItemFrom('agent-backlog show 42; agent-backlog add "item 41" --kind defect --work-type internal'));
test('add --help beside a list adds no item', () => assertNoItemFrom('agent-backlog add --help 2>&1 | head; agent-backlog list --all-repos'));
test("item headers in a non-backlog command's output add no item", () => assertNoItemFrom("grep -h 'agent-backlog add' other-session.jsonl"));

test('a transcript that does not exist is a read error, exit 2', () => {
  using s = sandbox();

  const r = s.check(join(s.root, 'missing.jsonl'));

  assert.match(r.stderr, /transcript not found/);
  assert.equal(r.status, 2);
});

// The lines under one heading of the output, up to the next heading.
const section = (out, heading) => out.split('\n').slice(out.split('\n').indexOf(heading) + 1).join('\n').split(/\n(?=\S)/)[0];

test('the docs of a package the session committed to, that its commits did not change, are listed to mark', () => {
  using s = sandbox();
  s.commitFiles({
    'AGENTS.md': 'rules', 'packages/p/package.json': '{"name":"p"}', 'packages/p/README.md': 'p', 'packages/p/CONTEXT.md': 'words',
    'packages/p/docs/adr/0001-a.md': 'adr', 'packages/p/docs/adr/0002-b.md': 'adr', 'packages/p/docs/adr/README.txt': 'not an adr',
    'packages/q/package.json': '{"name":"q"}', 'packages/q/README.md': 'q',
  });
  s.push();
  const c = s.commitFiles({ 'packages/p/src/a.ts': 'export const a = 1;', 'packages/p/CONTEXT.md': 'new words' });
  const pushed = s.push();
  s.standIn('gh', { [ghKey(c.sha)]: JSON.stringify([{ name: 'CI', status: 'completed', conclusion: 'success', url: 'https://ci/1' }]) });

  const r = s.check(s.session([{ bash: 'git commit -m x', result: c.result }, { bash: 'git push origin main', result: pushed }]));

  assert.equal(section(r.stdout, 'Docs of changed packages'), [
    `  ${s.work}`,
    '    CHECK packages/p/README.md',
    '    CHECK packages/p/docs/adr (2 decisions): a decision this change overturns gets a status paragraph',
    '    CHECK AGENTS.md',
  ].join('\n'));
  assert.equal(lastLine(r.stdout), 'Nothing open. To mark: 3');
  assert.equal(r.status, 0, r.stderr);
});

test("a package's ADR folder stays one line when the session changed some of its ADRs, and says how many", () => {
  using s = sandbox();
  s.commitFiles({
    'packages/p/package.json': '{"name":"p"}', 'packages/p/docs/adr/0001-a.md': 'adr', 'packages/p/docs/adr/0002-b.md': 'adr',
    'packages/p/docs/adr/0003-c.md': 'adr',
  });
  s.push();
  const first = s.commitFiles({ 'packages/p/src/a.ts': 'export const a = 1;', 'packages/p/docs/adr/0001-a.md': 'Superseded.\n\nadr' });
  const second = s.commitFiles({ 'packages/p/docs/adr/0004-d.md': 'new decision' });

  const r = s.check(s.session([{ bash: 'git commit -m x', result: first.result }, { bash: 'git commit -m y', result: second.result }]));

  assert.equal(section(r.stdout, 'Docs of changed packages'),
    `  ${s.work}\n    CHECK packages/p/docs/adr (4 decisions, 2 changed by this session): a decision this change overturns gets a status paragraph`);
});

test('a package edited after its last test run is open, exit 1', () => {
  using s = sandbox();
  s.commitFiles({ 'packages/p/package.json': '{"name":"@x/p"}', 'packages/p/src/a.ts': '1' });
  const file = join(s.work, 'packages/p/src/a.ts');

  const r = s.check(s.session([
    { tool: 'Edit', input: { file_path: file, old_string: '1', new_string: '2' } },
    { bash: `cd ${s.work} && npx nx run @x/p:test`, result: 'pass' },
    { tool: 'Edit', input: { file_path: file, old_string: '2', new_string: '3' } },
  ]));

  assert.equal(section(r.stdout, 'Tests of touched packages'), `  OPEN ${join(s.work, 'packages/p')}: no test ran after the last edit (src/a.ts)`);
  assert.equal(r.status, 1);
});

test("a test run for the package after its last edit, in a subagent's transcript, closes it", () => {
  using s = sandbox();
  s.commitFiles({ 'packages/p/package.json': '{"name":"@x/p"}', 'packages/p/src/a.ts': '1' });

  const r = s.check(s.session(
    [{ tool: 'Write', input: { file_path: join(s.work, 'packages/p/src/a.ts'), content: '2' } }],
    [{ at: 5 }, { bash: `cd ${join(s.work, 'packages/p')} && node --test src/`, result: 'pass' }],
  ));

  assert.equal(section(r.stdout, 'Tests of touched packages'), `  ${join(s.work, 'packages/p')}: a test ran after the last edit`);
  assert.equal(lastLine(r.stdout), 'Nothing open.');
});

// A test run from the repo root after the package's last edit, that reaches the package by its name or by nx's whole repo.
function assertRunClosesEdit(command) {
  using s = sandbox();
  s.commitFiles({ 'packages/p/package.json': '{"name":"@x/p"}', 'packages/p/src/a.ts': '1' });

  const r = s.check(s.session([
    { tool: 'Edit', input: { file_path: join(s.work, 'packages/p/src/a.ts'), old_string: '1', new_string: '2' } },
    { bash: `cd ${s.work} && ${command}`, result: 'pass' },
  ]));

  assert.equal(section(r.stdout, 'Tests of touched packages'), `  ${join(s.work, 'packages/p')}: a test ran after the last edit`);
}

test('a test run that names the package as an nx project closes its edit', () => assertRunClosesEdit('npx nx run @x/p:test --skip-nx-cache'));
test('nx affected with the test target closes the edit of every package in its repo', () => assertRunClosesEdit('npx nx affected -t lint test --base=HEAD~1'));

test('what the session created outside its repos and outside ~/.claude is listed to mark, one line per folder two levels down', () => {
  using s = sandbox();
  const round = join(s.home, '.claude', 'scratch', 'round');
  for (const dir of ['clone/sub', 'runs/a/out', 'runs/b/out']) mkdirSync(join(round, dir), { recursive: true });
  writeFileSync(join(round, 'brief.md'), 'brief');
  writeFileSync(join(round, 'clone', 'sub', 'x.txt'), 'x');
  mkdirSync(join(s.home, '.claude', 'plans'), { recursive: true });
  writeFileSync(join(s.home, '.claude', 'plans', 'p.md'), 'plan');
  writeFileSync(join(s.work, 'in-repo.txt'), 'r');

  const r = s.check(s.session([
    { tool: 'Write', input: { file_path: join(round, 'brief.md'), content: 'brief' } },
    { bash: `mkdir -p ${join(round, 'clone')} ${join(round, 'gone')}`, result: '' },
    { tool: 'Write', input: { file_path: join(round, 'clone', 'sub', 'x.txt'), content: 'x' } },
    { bash: `cd ${round} && mkdir -p runs/a/out runs/b/out`, result: '' },
    { tool: 'Write', input: { file_path: join(s.work, 'in-repo.txt'), content: 'r' } },
    { tool: 'Write', input: { file_path: join(s.home, '.claude', 'plans', 'p.md'), content: 'plan' } },
  ]));

  assert.equal(section(r.stdout, 'Created outside repos'), `  CHECK ${round}/: brief.md, clone\n  CHECK ${join(round, 'runs')}/: a/out, b/out`);
  assert.equal(lastLine(r.stdout), 'Nothing open. To mark: 2');
});

test("a plan the session edited lists its steps and ticked boxes to mark and its empty boxes as open", () => {
  using s = sandbox();
  const plan = join(s.home, '.claude', 'plans', 'round.md');
  mkdirSync(dirname(plan), { recursive: true });
  writeFileSync(plan, '# Round\n\n## Steps\n\n1. **Build** the list.\n   - [ ] not a step box\n2. Ship it.\n\n## Verification\n\n- [x] tests pass\n- [ ] pushed\n');

  const r = s.check(s.session([{ tool: 'Edit', input: { file_path: plan, old_string: 'a', new_string: 'b' } }]));

  assert.equal(section(r.stdout, 'Plans'), [
    `  ${plan}`, '    CHECK 1. Build the list.', '    OPEN [ ] not a step box', '    CHECK 2. Ship it.', '    CHECK [x] tests pass', '    OPEN [ ] pushed',
  ].join('\n'));
  assert.equal(lastLine(r.stdout), 'Open: 2 To mark: 3');
  assert.equal(r.status, 1);
});

test("each prompt the user typed is listed to mark; slash commands, notifications and skill text are not", () => {
  using s = sandbox();
  const long = `fix the README ${'and more '.repeat(30)}`;

  const r = s.check(s.session([
    { prompt: long },
    { prompt: '<command-name>/reload-plugins</command-name>' },
    { prompt: '<task-notification>done</task-notification>', origin: 'task-notification' },
    { meta: 'Base directory for this skill: /skills/x' },
    { prompt: 'Are you sure?' },
  ]));

  assert.equal(section(r.stdout, 'Requests'), `  CHECK ${long.replace(/\s+/g, ' ').slice(0, 159)}…\n  CHECK Are you sure?`);
});

test('each skill the user ran or the agent loaded is listed once to mark, but housekeeping and built-in commands', () => {
  using s = sandbox();

  const r = s.check(s.session([
    { prompt: '<command-message>wait-what</command-message>\n<command-name>/wait-what</command-name>' },
    { meta: 'Base directory for this skill: /skills/wait-what\n\nRe-pitch.' },
    { prompt: '<command-name>/reload-plugins</command-name>' },
    { tool: 'Skill', input: { skill: 'coding:write-test' } },
    { tool: 'Skill', input: { skill: 'coding:write-test' } },
    { tool: 'Skill', input: { skill: 'housekeeping' } },
  ]));

  assert.equal(section(r.stdout, 'Skills'), '  CHECK /wait-what (you ran it)\n  CHECK coding:write-test (loaded)');
});

test("a promise in the agent's closing text of a turn is listed to mark, after later turns too; narration before a tool call is not", () => {
  using s = sandbox();

  const r = s.check(s.session([
    { prompt: 'go' },
    { say: "Next I'll read the plan." },
    { bash: 'ls', result: 'plan.md' },
    { say: "Done. I'll tell meddit-95 when the deploy is green. The tests pass." },
    { prompt: 'next' },
    { bash: 'ls', result: 'plan.md' },
    { say: 'Done.' },
  ]));

  assert.equal(section(r.stdout, 'Promises'), "  CHECK I'll tell meddit-95 when the deploy is green.");
});

test("each answer the user gave to the agent's question is listed to mark", () => {
  using s = sandbox();

  const r = s.check(s.session([{
    tool: 'AskUserQuestion',
    input: { questions: [{ question: 'Build it now?', header: 'Build', options: [{ label: 'Build it now' }, { label: 'Later' }] }] },
    detail: { answers: { 'Build it now?': 'Build it now' } },
  }]));

  assert.equal(section(r.stdout, 'Promises'), '  CHECK answer: Build it now? → Build it now');
});
