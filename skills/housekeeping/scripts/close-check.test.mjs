// Black-box tests of close-check.mjs: each test runs the script as a child process, as the skill runs it.
//
// Seams. git is real: each test makes a throwaway repo with a bare remote and really commits and pushes there. The
// session ledger is a record that git's hooks (agent-plugin hooks/session-ledger) write and the script only reads, so
// each test writes the ledger lines of its commits and pushes into ~/.claude/ledger/<id>.jsonl under its HOME, in
// the shape that README gives; the sandbox installs the ledger in its HOME as install.sh does (the two hook keys in
// its git config, ~/.claude/ledger/installed-at a time before the transcript's entries), unless the test is about a
// missing install. The record reviewer's reviews are files the script only reads, so a test writes each review into
// ~/.claude/housekeeping/reviews/<sha>.md in the shape references/record-reviewer.md gives. The run log goes to the
// sandbox HOME's ~/.claude/housekeeping/runs. gh and agent-backlog are the outer seams: the script
// reaches them only as executables on PATH, and a real gh would read GitHub's live runs and a real agent-backlog the
// user's own backlog. So each test puts a stand-in executable on PATH that answers only the exact call the contract
// names and fails on any other; agent-backlog answers `list --session session --all-repos --json` with no item unless
// the test says otherwise. The child gets the runner's env with every input the script and git read replaced: PATH
// (the stand-ins, git, node), HOME and XDG_CONFIG_HOME (an empty folder, so no user git config or hook runs), no GIT_*
// variable and no CLAUDE_CODE_SESSION_ID. The rest passes through, so the script runs with the Node flags of the test
// process (a mutation prover's load hook among them). The test process's own env is not changed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, symlinkSync, rmSync, chmodSync, realpathSync } from 'node:fs';
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

// The two hook keys of the session ledger (its README's Install). close-check reads only that both keys exist, so
// each command is the shell's no-op: the tests' own git commits run no ledger and record nothing. git runs a command
// with a space through sh and appends the hook's arguments ("$@"), which `:` ignores; a bare `true` would be exec'd
// without a shell and not found on the sandbox PATH, and a failing reference-transaction hook aborts the ref update.
const LEDGER_HOOKS = {
  'session-ledger-commit': '[hook "session-ledger-commit"]\n\tevent = post-commit\n\tcommand = : no ledger in tests\n',
  'session-ledger-ref': '[hook "session-ledger-ref"]\n\tevent = reference-transaction\n\tcommand = : no ledger in tests\n',
};
const SESSION_START = '2026-11-26T10:00:00.000Z';

// installedAt: the line of ~/.claude/ledger/installed-at (null: no marker); hooks: the hook keys in HOME's git config.
function sandbox({ installedAt = '2026-11-26T09:00:00Z', hooks = Object.keys(LEDGER_HOOKS) } = {}) {
  const root = mkdtempSync(join(tempRoot, 'housekeeping-close-check-'));
  const bin = join(root, 'bin');
  const home = join(root, 'home');
  mkdirSync(bin);
  mkdirSync(home);
  writeFileSync(join(home, '.gitconfig'), hooks.map((name) => LEDGER_HOOKS[name]).join(''));
  if (installedAt !== null) {
    mkdirSync(join(home, '.claude', 'ledger'), { recursive: true });
    writeFileSync(join(home, '.claude', 'ledger', 'installed-at'), `${installedAt}\n`);
  }
  symlinkSync('/usr/bin/git', join(bin, 'git'));
  const inherited = Object.entries(process.env).filter(([name]) => !name.startsWith('GIT_') && name !== 'CLAUDE_CODE_SESSION_ID');
  const env = { ...Object.fromEntries(inherited), PATH: bin, HOME: home, XDG_CONFIG_HOME: join(home, '.config'), GIT_CONFIG_NOSYSTEM: '1' };
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
  // The ledger file of a session id: one JSON line per fact, as the session-ledger hooks append them.
  const ledger = (facts, id = 'session') => {
    mkdirSync(join(home, '.claude', 'ledger'), { recursive: true });
    const at = '2026-11-26T10:00:00.000Z';
    writeFileSync(join(home, '.claude', 'ledger', `${id}.jsonl`), facts.map((fact) => `${JSON.stringify({ session: id, ...fact, at })}\n`).join(''));
  };
  const committed = (sha, repo = work) => ({ kind: 'commit', repo, sha, ref: 'refs/heads/main' });
  const pushed = (sha, repo = work) => ({ kind: 'ref', repo, ref: 'refs/remotes/origin/main', new: sha, by: 'push' });
  // A stand-in on PATH: prints `answers[args.join(' ')]` and exits 0, or fails on a call nobody expected.
  const standIn = (name, answers) => {
    const file = join(bin, name);
    writeFileSync(file, `#!${process.execPath}\nconst answers = ${JSON.stringify(answers)};\nconst key = process.argv.slice(2).join(' ');\nif (!(key in answers)) { console.error('unexpected call: ${name} ' + key); process.exit(1); }\nprocess.stdout.write(answers[key]);\n`);
    chmodSync(file, 0o755);
  };
  standIn('agent-backlog', { [listKey('session')]: '[]' });
  // A transcript of Bash calls, each [command, result]; subagent calls go to <id>/subagents/agent-1.jsonl.
  const transcript = (calls, subagentCalls = []) => {
    const file = join(root, 'session.jsonl');
    const lines = (list) => list.flatMap(([command, result], i) => [
      { type: 'assistant', cwd: work, timestamp: SESSION_START, message: { content: [{ type: 'tool_use', id: `t${i}`, name: 'Bash', input: { command } }] } },
      { type: 'user', cwd: work, timestamp: SESSION_START, message: { content: [{ type: 'tool_result', tool_use_id: `t${i}`, content: [{ type: 'text', text: result }] }] } },
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
  // The transcript is <name>.jsonl, so <name> is its session id.
  //   { bash, result }             a Bash call
  //   { tool, input, detail }      another tool call; detail is the result's toolUseResult
  //   { prompt, origin }           a user prompt (origin kind, default 'human')
  //   { meta }                     a meta user entry (a loaded skill's text)
  //   { say }                      the agent's text
  //   { derivedFrom }              the entry Claude Code writes after a /clear, naming the old session id
  //   { at }                       a seconds offset for the next event (to interleave main and subagent events)
  const session = (events, subagentEvents = [], name = 'session') => {
    const file = join(root, `${name}.jsonl`);
    const lines = (list, tag) => {
      let second = 0;
      return list.flatMap((event, i) => {
        if ('at' in event) { second = event.at; return []; }
        if ('derivedFrom' in event) return [{ type: 'derived-from', v: 1, sessionId: name, sessions: [{ type: 'claude_code_session', id: event.derivedFrom, via: 'clear' }] }];
        const timestamp = new Date(Date.UTC(2026, 10, 26, 10, 0, second++)).toISOString();
        const id = `${tag}${i}`;
        const base = { cwd: work, timestamp };
        if ('bash' in event || 'tool' in event) {
          const [toolName, input] = 'bash' in event ? ['Bash', { command: event.bash }] : [event.tool, event.input];
          return [
            { ...base, type: 'assistant', message: { content: [{ type: 'tool_use', id, name: toolName, input }] } },
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
      mkdirSync(join(root, name, 'subagents'), { recursive: true });
      writeFileSync(join(root, name, 'subagents', 'agent-1.jsonl'), lines(subagentEvents, 's'));
    }
    return file;
  };
  // The record reviewer's review of a commit: its file's whole text.
  const review = (sha, text) => {
    mkdirSync(join(home, '.claude', 'housekeeping', 'reviews'), { recursive: true });
    writeFileSync(join(home, '.claude', 'housekeeping', 'reviews', `${sha}.md`), text);
  };
  const reviewed = (sha) => review(sha, `REVIEW ${sha}\nnone\n`);
  const check = (transcriptFile) => spawnSync(process.execPath, [script, '--transcript', transcriptFile], { env, encoding: 'utf8' });
  return { root, home, work, commit, commitFiles, push, ledger, committed, pushed, session, standIn, transcript, review, reviewed, check, run, [Symbol.dispose]: () => rmSync(root, { recursive: true, force: true }) };
}

const ghKey = (sha) => `run list --commit ${sha} --json name,status,conclusion,url`;
function listKey(id) { return `list --session ${id} --all-repos --json`; }
const showKey = (id) => `show ${id} --json`;
const lastLine = (out) => out.trimEnd().split('\n').at(-1);
// The lines under one heading of the output, up to the next heading.
const section = (out, heading) => out.split('\n').slice(out.split('\n').indexOf(heading) + 1).join('\n').split(/\n(?=\S)/)[0];
const inProgress = JSON.stringify([{ name: 'CI', status: 'in_progress', conclusion: '', url: 'https://ci/1' }]);
const green = JSON.stringify([{ name: 'CI', status: 'completed', conclusion: 'success', url: 'https://ci/1' }]);

test('a pushed commit whose CI run is in progress is open, exit 1', () => {
  using s = sandbox();
  const c = s.commit('a.txt');
  s.push();
  s.ledger([s.committed(c.sha), s.pushed(c.sha)]);
  s.reviewed(c.sha);
  s.standIn('gh', { [ghKey(c.sha)]: inProgress });

  const r = s.check(s.transcript([['ls', 'README.md']]));

  assert.match(r.stdout, /  OPEN CI: in_progress https:\/\/ci\/1/);
  assert.equal(lastLine(r.stdout), 'Open: 1');
  assert.equal(r.status, 1, r.stderr);
});

test('all runs green and nothing unpushed prints Nothing open., exit 0', () => {
  using s = sandbox();
  const c = s.commit('a.txt');
  s.push();
  s.ledger([s.committed(c.sha), s.pushed(c.sha)]);
  s.reviewed(c.sha);
  s.standIn('gh', { [ghKey(c.sha)]: JSON.stringify([
    { name: 'CI', status: 'completed', conclusion: 'success', url: 'https://ci/1' },
    { name: 'Release', status: 'completed', conclusion: 'success', url: 'https://ci/2' },
  ]) });

  const r = s.check(s.transcript([['ls', 'README.md']]));

  assert.match(r.stdout, /Release: completed success/);
  assert.doesNotMatch(r.stdout, /OPEN/);
  assert.equal(lastLine(r.stdout), 'Nothing open.');
  assert.equal(r.status, 0, r.stderr);
});

// #5836: the shell guard sends test and build output to a log file, and agents push the same way
// (agent-plugin 9526d2f and 516c4f4, 2026-11-26: 4 of 6 pushes listed). The transcript shows no range at all.
test('a push whose output went to a log file is listed with its head and CI, from the ledger; a fetch is no push', () => {
  using s = sandbox();
  const start = s.run(s.work, 'rev-parse', 'HEAD').trim();
  const c = s.commit('a.txt');
  writeFileSync(join(s.root, 'push.log'), s.push());
  s.ledger([{ ...s.pushed(start), by: 'fetch' }, s.committed(c.sha), s.pushed(c.sha)]);
  s.standIn('gh', { [ghKey(c.sha)]: inProgress });

  const r = s.check(s.transcript([['git commit -m "add a.txt" > $L/commit.log 2>&1', ''], ['git push origin main > $L/push.log 2>&1; echo "push exit $?"', 'push exit 0']]));

  assert.equal(section(r.stdout, 'Pushes'), `  ${s.work} main ${c.sha.slice(0, 12)}\n    OPEN CI: in_progress https://ci/1`);
  assert.equal(section(r.stdout, 'Unpushed'), '  none');
});

// The ledger is not installed: install.sh has not run since e488eed (no installed-at), or a hook key was removed.
const NOT_INSTALLED = /^  OPEN session ledger not installed \(no ~\/\.claude\/ledger\/installed-at, or hook\.session-ledger-commit\.command or hook\.session-ledger-ref\.command not in git's global config\): the commits and pushes of this session were not read; install it: sh \/\S+\/hooks\/session-ledger\/install\.sh$/;

test('with no installed-at marker, one open line says the ledger is not installed, the commits and pushes were not read, and how to install it', () => {
  using s = sandbox({ installedAt: null });
  const c = s.commit('a.txt');
  s.ledger([s.committed(c.sha)]);

  const r = s.check(s.transcript([['git commit -m x', c.result], ['git push origin main', s.push()]]));

  assert.match(section(r.stdout, 'Pushes'), NOT_INSTALLED);
  assert.equal(section(r.stdout, 'Unpushed'), '  not read: no session ledger');
  assert.equal(lastLine(r.stdout), 'Open: 1');
  assert.equal(r.status, 1, r.stderr);
});

test('an installed-at marker that holds no time reads as no install', () => {
  using s = sandbox({ installedAt: 'soon' });

  const r = s.check(s.transcript([['ls', 'README.md']]));

  assert.match(section(r.stdout, 'Pushes'), NOT_INSTALLED);
  assert.equal(lastLine(r.stdout), 'Open: 1');
});

test('with a ledger hook key missing from git config, the same open line says the ledger is not installed', () => {
  using s = sandbox({ hooks: ['session-ledger-commit'] });
  const c = s.commit('a.txt');
  s.ledger([s.committed(c.sha)]);

  const r = s.check(s.transcript([['ls', 'README.md']]));

  assert.match(section(r.stdout, 'Pushes'), NOT_INSTALLED);
  assert.equal(lastLine(r.stdout), 'Open: 1');
});

test('a chain id that began before installed-at is open with its start and installed-at; one that began after is not', () => {
  using s = sandbox({ installedAt: '2026-11-26T10:00:30Z' });
  s.standIn('agent-backlog', { [listKey('new')]: '[]', [listKey('old')]: '[]' });
  s.session([{ say: 'working' }, { at: 45 }, { say: 'still working' }], [], 'old');

  const r = s.check(s.session([{ derivedFrom: 'old' }, { at: 60 }, { say: 'continuing' }], [], 'new'));

  assert.equal(section(r.stdout, 'Pushes'), '  OPEN old began 2026-11-26T10:00:00.000Z, before the session ledger was installed (2026-11-26T10:00:30.000Z): its commits and pushes before then were not read\n  none');
  assert.equal(lastLine(r.stdout), 'Open: 1');
});

test("a reviewed commit's STALE lines are CHECK lines naming the repo and short sha", () => {
  using s = sandbox();
  const c = s.commit('a.txt');
  s.push();
  s.ledger([s.committed(c.sha)]);
  s.review(c.sha, `REVIEW ${c.sha}\nSTALE: ~/.claude/CLAUDE.md:12 — says pushes are parsed from output; the ledger records them\nSTALE: #5831 — still says to parse push ranges\n`);

  const r = s.check(s.transcript([['ls', 'README.md']]));

  assert.equal(section(r.stdout, 'Stale records'), [
    `  CHECK ${s.work} ${c.sha.slice(0, 8)}: ~/.claude/CLAUDE.md:12 — says pushes are parsed from output; the ledger records them`,
    `  CHECK ${s.work} ${c.sha.slice(0, 8)}: #5831 — still says to parse push ranges`,
  ].join('\n'));
  assert.equal(lastLine(r.stdout), 'Nothing open. To mark: 2');
  assert.equal(r.status, 0, r.stderr);
});

test('a commit whose review is none prints no stale record', () => {
  using s = sandbox();
  const c = s.commit('a.txt');
  s.push();
  s.ledger([s.committed(c.sha)]);
  s.review(c.sha, `REVIEW ${c.sha}\nnone\n`);

  const r = s.check(s.transcript([['ls', 'README.md']]));

  assert.equal(section(r.stdout, 'Stale records'), '  none');
  assert.equal(lastLine(r.stdout), 'Nothing open.');
});

test('a commit with no review is open as not reviewed for stale records', () => {
  using s = sandbox();
  const c = s.commit('a.txt');
  s.push();
  s.ledger([s.committed(c.sha)]);

  const r = s.check(s.transcript([['ls', 'README.md']]));

  assert.equal(section(r.stdout, 'Stale records'), `  OPEN ${s.work} ${c.sha.slice(0, 8)}: not reviewed for stale records (run the record reviewer, SKILL.md Finish)`);
  assert.equal(lastLine(r.stdout), 'Open: 1');
  assert.equal(r.status, 1);
});

test('a review whose first line is not REVIEW <its sha> is open as unreadable, and so is one with no STALE line and no none', () => {
  using s = sandbox();
  const wrong = s.commit('a.txt');
  const empty = s.commit('b.txt');
  s.push();
  s.ledger([s.committed(wrong.sha), s.committed(empty.sha)]);
  s.review(wrong.sha, `REVIEW ${empty.sha}\nSTALE: x — y\n`);
  s.review(empty.sha, `REVIEW ${empty.sha}\n`);
  const file = (sha) => join(s.home, '.claude', 'housekeeping', 'reviews', `${sha}.md`);

  const r = s.check(s.transcript([['ls', 'README.md']]));

  assert.equal(section(r.stdout, 'Stale records'), [
    `  OPEN ${s.work} ${wrong.sha.slice(0, 8)}: unreadable review ${file(wrong.sha)}: it must start with "REVIEW ${wrong.sha}", then STALE lines or none`,
    `  OPEN ${s.work} ${empty.sha.slice(0, 8)}: unreadable review ${file(empty.sha)}: it must start with "REVIEW ${empty.sha}", then STALE lines or none`,
  ].join('\n'));
  assert.equal(lastLine(r.stdout), 'Open: 2');
});

const runLog = (s, id) => readFileSync(join(s.home, '.claude', 'housekeeping', 'runs', `${id}.log`), 'utf8');
const block = (ids, out) => String.raw`=== \d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z close-check ${ids}\n` + RegExp.escape(out);

test("a run appends one block to the run log of the chain's first id: a header with the chain ids, then its exact output", () => {
  using s = sandbox();
  s.standIn('agent-backlog', { [listKey('new')]: '[]', [listKey('old')]: '[]' });
  s.session([{ prompt: 'ship it' }], [], 'old');

  const r = s.check(s.session([{ derivedFrom: 'old' }, { prompt: 'continue' }], [], 'new'));

  assert.match(runLog(s, 'new'), new RegExp(`^${block('new,old', r.stdout)}$`));
  assert.equal(lastLine(r.stdout), 'Nothing open. To mark: 2');
  assert.equal(r.status, 0, r.stderr);
});

test('a second run appends a second block after the first', () => {
  using s = sandbox();
  const c = s.commit('a.txt');
  s.ledger([s.committed(c.sha)]);
  const transcript = s.transcript([['ls', 'README.md']]);
  const first = s.check(transcript);
  s.reviewed(c.sha);

  const second = s.check(transcript);

  assert.notEqual(first.stdout, second.stdout);
  assert.match(runLog(s, 'session'), new RegExp(`^${block('session', first.stdout)}${block('session', second.stdout)}$`));
  assert.equal(second.status, 1, second.stderr);
});

test('a run log that cannot be written is one open line naming its path; the rest of the output is printed', () => {
  using s = sandbox();
  mkdirSync(join(s.home, '.claude', 'housekeeping'), { recursive: true });
  writeFileSync(join(s.home, '.claude', 'housekeeping', 'runs'), 'a file where the folder should be');

  const r = s.check(s.transcript([['ls', 'README.md']]));

  assert.match(section(r.stdout, 'Run log'), new RegExp(`^  OPEN could not append to ${RegExp.escape(join(s.home, '.claude', 'housekeeping', 'runs', 'session.log'))}: `));
  assert.match(r.stdout, /^Session\n  session\nPushes\n  none\n/);
  assert.equal(lastLine(r.stdout), 'Open: 1');
  assert.equal(r.status, 1);
});

test('with the ledger installed, no ledger file is a session with no commit and no push: nothing open', () => {
  using s = sandbox();

  const r = s.check(s.transcript([['ls', 'README.md']]));

  assert.equal(section(r.stdout, 'Pushes'), '  none');
  assert.equal(section(r.stdout, 'Unpushed'), '  none');
  assert.equal(lastLine(r.stdout), 'Nothing open.');
  assert.equal(r.status, 0, r.stderr);
});

test('a missing gh is an open item, not silence', () => {
  using s = sandbox();
  const c = s.commit('a.txt');
  s.push();
  // The push went to a GitHub remote, so it has CI to read (a remote on disk has none).
  s.run(s.work, 'remote', 'add', 'github', 'https://github.com/example/work.git');
  s.ledger([s.committed(c.sha), { ...s.pushed(c.sha), ref: 'refs/remotes/github/main' }]);
  s.reviewed(c.sha);

  const r = s.check(s.transcript([['ls', 'README.md']]));

  assert.match(r.stdout, new RegExp(`OPEN could not read CI for ${c.sha.slice(0, 12)}: gh not found`));
  assert.equal(lastLine(r.stdout), 'Open: 1');
  assert.equal(r.status, 1);
});

test('a push to a remote that is a folder on disk has no CI: printed as no CI, not open, when gh cannot read it', () => {
  using s = sandbox();
  const c = s.commit('a.txt');
  s.push();
  s.ledger([s.committed(c.sha), s.pushed(c.sha)]);
  s.reviewed(c.sha);

  const r = s.check(s.transcript([['ls', 'README.md']]));

  assert.match(r.stdout, new RegExp(`main ${c.sha.slice(0, 12)}\\n    no CI: origin is a local repository \\(${join(s.root, 'remote.git')}\\)\\n`));
  assert.doesNotMatch(r.stdout, /could not read CI/);
  assert.equal(lastLine(r.stdout), 'Nothing open.');
});

test('a push from a repo path that no longer exists is open as repo path not found, not gh not found', () => {
  using s = sandbox();
  const c = s.commit('a.txt');
  s.push();
  const gone = join(s.root, 'gone');
  s.ledger([s.pushed(c.sha, gone)]);

  const r = s.check(s.transcript([['ls', 'README.md']]));

  assert.match(r.stdout, new RegExp(`${gone} main ${c.sha.slice(0, 12)}\\n    OPEN repo path not found: ${gone}\\n`));
  assert.doesNotMatch(r.stdout, /gh not found/);
  assert.equal(lastLine(r.stdout), 'Open: 1');
});

test("the session's unpushed commit is open and a peer's unpushed commit is not listed", () => {
  using s = sandbox();
  const mine = s.commit('mine.txt');
  const peer = s.commit('peer.txt');
  s.ledger([s.committed(mine.sha)]);
  s.reviewed(mine.sha);

  const r = s.check(s.transcript([['ls', 'README.md']]));

  assert.match(r.stdout, new RegExp(`OPEN ${s.work} main ${mine.sha.slice(0, 12)} add mine.txt`));
  assert.doesNotMatch(r.stdout, new RegExp(peer.sha.slice(0, 7)));
  assert.equal(lastLine(r.stdout), 'Open: 1');
  assert.equal(r.status, 1);
});

// After a /clear the context gets a new CLAUDE_CODE_SESSION_ID and the new transcript names the old one
// (round 3, 2026-11-26: bdbfc940-… derived from 4e0ac864-…).
test('a session after /clear lists the commits, pushes, items and requests of the session it was derived from', () => {
  using s = sandbox();
  const pushedCommit = s.commit('a.txt');
  s.push();
  const unpushed = s.commit('b.txt');
  s.ledger([s.committed(pushedCommit.sha), s.pushed(pushedCommit.sha), s.committed(unpushed.sha)], 'old');
  s.standIn('gh', { [ghKey(pushedCommit.sha)]: green });
  s.standIn('agent-backlog', { [listKey('new')]: '[]', [listKey('old')]: JSON.stringify([sessionItem(41)]), [showKey(41)]: JSON.stringify(shownItem(41)) });
  s.session([{ prompt: 'ship round 3' }], [], 'old');

  const r = s.check(s.session([{ derivedFrom: 'old' }, { prompt: 'continue' }], [], 'new'));

  assert.equal(section(r.stdout, 'Session'), '  new\n  old');
  assert.equal(section(r.stdout, 'Pushes'), `  ${s.work} main ${pushedCommit.sha.slice(0, 12)}\n    CI: completed success https://ci/1`);
  assert.equal(section(r.stdout, 'Unpushed'), `  OPEN ${s.work} main ${unpushed.sha.slice(0, 12)} add b.txt`);
  assert.equal(section(r.stdout, 'Filed (yours: do it now, or say why it waits)'), '  CHECK #41 item 41 (work)');
  assert.equal(section(r.stdout, 'Requests'), '  CHECK ship round 3\n  CHECK continue');
});

test('a session derived from an id whose transcript is gone is open for that id, and its ledger is still read', () => {
  using s = sandbox();
  const c = s.commit('a.txt');
  s.ledger([s.committed(c.sha)], 'old');
  s.reviewed(c.sha);
  s.standIn('agent-backlog', { [listKey('new')]: '[]', [listKey('old')]: '[]' });

  const r = s.check(s.session([{ derivedFrom: 'old' }, { say: 'continuing' }], [], 'new'));

  assert.equal(section(r.stdout, 'Session'), '  new\n  OPEN old: no transcript found, its calls not read');
  assert.equal(section(r.stdout, 'Unpushed'), `  OPEN ${s.work} main ${c.sha.slice(0, 12)} add a.txt`);
  assert.equal(lastLine(r.stdout), 'Open: 2');
});

// An item as `list --session <id> --json` prints it, and as `show <id> --json` prints it (agent-backlog d8799aefa).
const sessionItem = (id, readiness = 'ready', actions = ['add']) => ({
  id, title: `item ${id}`, repositoryName: 'work', status: readiness === 'done' ? 'done' : 'open', readiness,
  sessionEvents: actions.map((action, n) => ({ action, atMs: 1795000000000 + n })),
});
const shownItem = (id, conditions = []) => ({ id, title: `item ${id}`, repositoryName: 'work', status: 'open', readiness: 'ready', conditions });
const untilMet = { id: 1, itemId: 41, kind: 'until', text: 'a third consumer', met: { note: 'third', metAtMs: 1795000000000 }, state: 'met' };

test("the session's ready items with a condition are open; its waiting and done items are not listed", () => {
  using s = sandbox();
  s.standIn('agent-backlog', {
    [listKey('session')]: JSON.stringify([sessionItem(41), sessionItem(43, 'waiting', ['wait']), sessionItem(44, 'done', ['done'])]),
    [showKey(41)]: JSON.stringify(shownItem(41, [untilMet])),
  });

  const r = s.check(s.transcript([['agent-backlog add "item 41" --kind defect --work-type internal --until "a third consumer"', '']]));

  assert.equal(section(r.stdout, 'Ready items'), '  OPEN #41 item 41 (work)');
  assert.doesNotMatch(r.stdout, /#43|#44/);
  assert.equal(lastLine(r.stdout), 'Open: 1');
  assert.equal(r.status, 1);
});

test('a ready item the session filed with no condition is a CHECK line to mark, not open', () => {
  using s = sandbox();
  s.standIn('agent-backlog', { [listKey('session')]: JSON.stringify([sessionItem(41)]), [showKey(41)]: JSON.stringify(shownItem(41)) });

  const r = s.check(s.transcript([['ls', 'README.md']]));

  assert.match(r.stdout, /Filed \(yours: do it now, or say why it waits\)\n  CHECK #41 item 41 \(work\)\n/);
  assert.doesNotMatch(r.stdout, /OPEN/);
  assert.equal(lastLine(r.stdout), 'Nothing open. To mark: 1');
  assert.equal(r.status, 0);
});

// #5834: an add whose JSON result a jq stage reshaped printed no card, so the old output parser missed #5833.
test('an item added through a jq pipe is listed under Filed', () => {
  using s = sandbox();
  s.standIn('agent-backlog', { [listKey('session')]: JSON.stringify([sessionItem(41)]), [showKey(41)]: JSON.stringify(shownItem(41)) });

  const r = s.check(s.transcript([['agent-backlog add "item 41" --kind defect --work-type internal --json | jq -r \'"#\\(.id) \\(.title)"\'', '#41 item 41\n']]));

  assert.equal(section(r.stdout, 'Filed (yours: do it now, or say why it waits)'), '  CHECK #41 item 41 (work)');
});

test("a failed read of the session's backlog items is open", () => {
  using s = sandbox();
  s.standIn('agent-backlog', {});

  const r = s.check(s.transcript([['ls', 'README.md']]));

  assert.equal(section(r.stdout, 'Ready items'), '  OPEN could not read the backlog items of session session: unexpected call: agent-backlog list --session session --all-repos --json\n  none');
  assert.equal(lastLine(r.stdout), 'Open: 1');
});

test('a transcript that does not exist is a read error, exit 2', () => {
  using s = sandbox();

  const r = s.check(join(s.root, 'missing.jsonl'));

  assert.match(r.stderr, /transcript not found/);
  assert.equal(r.status, 2);
});

test('the docs of a package the session committed to, that its commits did not change, are listed to mark', () => {
  using s = sandbox();
  s.commitFiles({
    'AGENTS.md': 'rules', 'packages/p/package.json': '{"name":"p"}', 'packages/p/README.md': 'p', 'packages/p/CONTEXT.md': 'words',
    'packages/p/docs/adr/0001-a.md': 'adr', 'packages/p/docs/adr/0002-b.md': 'adr', 'packages/p/docs/adr/README.txt': 'not an adr',
    'packages/q/package.json': '{"name":"q"}', 'packages/q/README.md': 'q',
  });
  s.push();
  const c = s.commitFiles({ 'packages/p/src/a.ts': 'export const a = 1;', 'packages/p/CONTEXT.md': 'new words' });
  s.push();
  s.ledger([s.committed(c.sha), s.pushed(c.sha)]);
  s.reviewed(c.sha);
  s.standIn('gh', { [ghKey(c.sha)]: green });

  const r = s.check(s.session([{ bash: 'ls', result: 'README.md' }]));

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
  s.ledger([s.committed(first.sha), s.committed(second.sha)]);

  const r = s.check(s.session([{ bash: 'ls', result: 'README.md' }]));

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

// #5833: a test run is a child process, so the folders it leaves are in no tool call; an empty one is not in
// git status either (agent-plugin skills/scripts-scratch, 2026-11-26).
test('an untracked folder born after the session started, in a repo where the session ran a test, is listed to mark', () => {
  using s = sandbox();
  mkdirSync(join(s.work, 'scratch-left'));

  const r = s.check(s.session([{ bash: 'node --test', result: 'ok' }]));

  assert.equal(section(r.stdout, 'Left by test runs'), `  ${s.work}\n    CHECK scratch-left/`);
  assert.equal(lastLine(r.stdout), 'Nothing open. To mark: 1');
});

test('an untracked folder born before the session started is not listed', () => {
  using s = sandbox();
  mkdirSync(join(s.work, 'older'));

  // The session's first call comes about ten years after the folder was born.
  const r = s.check(s.session([{ at: 315_360_000 }, { bash: 'node --test', result: 'ok' }]));

  assert.equal(section(r.stdout, 'Left by test runs'), '  none');
});

test('an untracked folder in a repo where the session ran no test is not listed', () => {
  using s = sandbox();
  mkdirSync(join(s.work, 'scratch-left'));

  const r = s.check(s.session([{ bash: 'ls', result: 'README.md' }]));

  assert.equal(section(r.stdout, 'Left by test runs'), '  none');
});

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
