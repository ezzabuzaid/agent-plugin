// Black-box tests of records-check.mjs: each test runs the script as a child process, as the skill runs it.
//
// Seams. git is real: each test makes a throwaway repo and commits a real delete or rename; the transcript holds the
// real output of that `git commit`. The project memory is a folder under HOME, which the child gets as its input (an
// empty folder per test, so no user git config, hook or memory is read); the test writes the memory file there the
// way Claude Code does. agent-backlog is the outer seam: a real one reads the user's own backlog, so each test puts a
// stand-in executable on PATH that answers only `list --all-repos --status open --json` and fails on any other call.
// The test process's own env is not changed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync, chmodSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const script = join(here, 'records-check.mjs');
const scratchRoot = join(here, '..', '..', 'scripts-scratch');

function sandbox({ backlog = [] } = {}) {
  mkdirSync(scratchRoot, { recursive: true });
  const root = mkdtempSync(join(scratchRoot, 'records-'));
  const bin = join(root, 'bin');
  const home = join(root, 'home');
  mkdirSync(bin);
  mkdirSync(home);
  symlinkSync('/usr/bin/git', join(bin, 'git'));
  const standIn = join(bin, 'agent-backlog');
  writeFileSync(standIn, `#!${process.execPath}\nif (process.argv.slice(2).join(' ') !== 'list --all-repos --status open --json') { console.error('unexpected call'); process.exit(1); }\nprocess.stdout.write(${JSON.stringify(JSON.stringify(backlog))});\n`);
  chmodSync(standIn, 0o755);
  const env = { PATH: bin, HOME: home, GIT_CONFIG_NOSYSTEM: '1' };
  const work = join(root, 'work');
  const git = (...args) => execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...args], { cwd: work, env, encoding: 'utf8' });
  mkdirSync(join(work, 'src'), { recursive: true });
  git('init', '-q', '-b', 'main');
  const write = (path, text) => {
    mkdirSync(dirname(join(work, path)), { recursive: true });
    writeFileSync(join(work, path), text);
  };
  write('src/old-name.ts', 'export {};\n');
  git('add', '.');
  git('commit', '-q', '-m', 'start');
  // Claude Code's project folder for the repo: each non-alphanumeric character of its path becomes '-'.
  const memory = (name, text) => {
    const dir = join(home, '.claude', 'projects', work.replace(/[^A-Za-z0-9]/g, '-'), 'memory');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, name), text);
    return join(dir, name);
  };
  const transcript = (command, result) => {
    const file = join(root, 'session.jsonl');
    writeFileSync(file, [
      { type: 'assistant', cwd: work, message: { content: [{ type: 'tool_use', id: 't1', name: 'Bash', input: { command } }] } },
      { type: 'user', cwd: work, message: { content: [{ type: 'tool_result', tool_use_id: 't1', content: [{ type: 'text', text: result }] }] } },
    ].map((e) => JSON.stringify(e)).join('\n'));
    return file;
  };
  const check = (...args) => spawnSync(process.execPath, [script, ...args], { env, encoding: 'utf8' });
  return { work, git, write, memory, transcript, check, [Symbol.dispose]: () => rmSync(root, { recursive: true, force: true }) };
}

const lastLine = (out) => out.trimEnd().split('\n').at(-1);

test('a deleted path still named in a doc and in a memory is listed, exit 1', () => {
  using s = sandbox();
  s.write('docs/guide.md', '# Guide\n\nThe entry is `src/old-name.ts`.\n');
  const note = s.memory('note.md', 'See [it](src/old-name.ts) for the entry.\n');
  s.git('add', 'docs/guide.md');
  s.git('rm', '-q', 'src/old-name.ts');
  const committed = s.git('commit', '-m', 'remove old-name');

  const r = s.check('--transcript', s.transcript('git commit -m "remove old-name"', committed));

  assert.match(r.stdout, /: src\/old-name\.ts\n/);
  assert.ok(r.stdout.includes(`${join(s.work, 'docs/guide.md')}:3`), r.stdout);
  assert.ok(r.stdout.includes(`${note}:1`), r.stdout);
  assert.equal(lastLine(r.stdout), 'Stale mentions: 2');
  assert.equal(r.status, 1, r.stderr);
});

test('a basename-only or longer-path match is not listed', () => {
  using s = sandbox();
  s.write('docs/guide.md', 'old-name.ts\npackages/x/src/old-name.ts\nsrc/old-name.tsx\n');
  s.memory('note.md', 'the old-name.ts file\n');
  s.git('add', 'docs/guide.md');
  s.git('rm', '-q', 'src/old-name.ts');
  const committed = s.git('commit', '-m', 'remove old-name');

  const r = s.check('--transcript', s.transcript('git commit -m x', committed));

  assert.equal(r.stdout, 'No stale mention.\n');
  assert.equal(r.status, 0, r.stderr);
});

test('the old path of a rename named in an open backlog item is listed, with --repo and --since', () => {
  using s = sandbox({ backlog: [
    { id: 7, repositoryName: 'work', title: 'tidy the entry', description: 'Done when src/old-name.ts exports nothing.' },
    { id: 8, repositoryName: 'work', title: 'unrelated', description: 'src/new-name.ts is fine' },
  ] });
  const since = s.git('rev-parse', 'HEAD').trim();
  s.git('mv', 'src/old-name.ts', 'src/new-name.ts');
  s.git('commit', '-q', '-m', 'rename');

  const r = s.check('--repo', s.work, '--since', since);

  assert.match(r.stdout, /: src\/old-name\.ts\n {2}#7 description \(work\)\n/);
  assert.doesNotMatch(r.stdout, /#8/);
  assert.equal(lastLine(r.stdout), 'Stale mentions: 1');
  assert.equal(r.status, 1, r.stderr);
});
