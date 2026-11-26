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
  // NODE_OPTIONS and WRITE_TEST_MUTANT pass through, so a write-test mutation run reaches the child.
  const passed = Object.entries(process.env).filter(([name]) => name === 'NODE_OPTIONS' || name === 'WRITE_TEST_MUTANT');
  const env = { ...Object.fromEntries(passed), PATH: bin, HOME: home, GIT_CONFIG_NOSYSTEM: '1' };
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

test('a removed export still named in a doc, a memory and an open backlog item is listed, exit 1', () => {
  using s = sandbox({ backlog: [
    { id: 11, repositoryName: 'work', title: 'call warehouseLogin() from the host', description: '' },
    { id: 12, repositoryName: 'work', title: 'unrelated', description: 'the login lives in the host' },
  ] });
  s.write('src/login.ts', 'export function warehouseLogin() {\n  return {};\n}\nexport const keep = 1;\n');
  s.write('AGENTS.md', '# Agents\n\nThe warehouse package holds the login: `warehouseLogin()`.\n');
  s.git('add', '.');
  s.git('commit', '-q', '-m', 'add login');
  const note = s.memory('note.md', 'Read the login with warehouseLogin.\n');
  s.write('src/login.ts', 'export const keep = 1;\n');
  s.git('add', 'src/login.ts');
  const committed = s.git('commit', '-m', 'drop warehouseLogin');

  const r = s.check('--transcript', s.transcript('git commit -m "drop warehouseLogin"', committed));

  assert.match(r.stdout, /: export warehouseLogin \(src\/login\.ts\)\n/);
  assert.ok(r.stdout.includes(`${join(s.work, 'AGENTS.md')}:3`), r.stdout);
  assert.ok(r.stdout.includes(`${note}:1`), r.stdout);
  assert.match(r.stdout, / {2}#11 title \(work\)\n/);
  assert.doesNotMatch(r.stdout, /#12|export keep/);
  assert.equal(lastLine(r.stdout), 'Stale mentions: 3');
  assert.equal(r.status, 1, r.stderr);
});

test('the old name of a renamed export and a removed module.exports key are listed', () => {
  using s = sandbox();
  s.write('src/a.ts', 'export async function loadAll() {}\n');
  s.write('src/b.cjs', 'module.exports = {\n  start,\n  halt: () => {},\n  nested: { inner: 1 },\n};\n');
  s.write('docs/api.md', 'Call loadAll first.\nThen `halt()`.\nnested stays.\n');
  s.git('add', '.');
  s.git('commit', '-q', '-m', 'api');
  const since = s.git('rev-parse', 'HEAD').trim();
  s.write('src/a.ts', 'export async function loadEvery() {}\n');
  s.write('src/b.cjs', 'module.exports = {\n  start,\n  nested: { inner: 1 },\n};\n');
  s.git('add', '.');
  s.git('commit', '-q', '-m', 'rename');

  const r = s.check('--repo', s.work, '--since', since);

  assert.match(r.stdout, /: export loadAll \(src\/a\.ts\)\n {2}\S+docs\/api\.md:1\n/);
  assert.match(r.stdout, /: export halt \(src\/b\.cjs\)\n {2}\S+docs\/api\.md:2\n/);
  assert.equal(lastLine(r.stdout), 'Stale mentions: 2');
  assert.equal(r.status, 1, r.stderr);
});

test('a removed export that another file still declares at HEAD is not listed', () => {
  using s = sandbox();
  s.write('src/login.ts', 'export function warehouseLogin() {}\nexport const retries = 3;\nexport const timeoutMs = 5000;\n');
  s.write('src/host.ts', 'export const port = 8080;\n');
  s.write('AGENTS.md', 'The host calls warehouseLogin.\n');
  s.git('add', '.');
  s.git('commit', '-q', '-m', 'add');
  const since = s.git('rev-parse', 'HEAD').trim();
  s.git('rm', '-q', 'src/login.ts');
  s.write('src/host.ts', 'export const port = 8080;\nexport function warehouseLogin() {}\n');
  s.git('add', '.');
  s.git('commit', '-q', '-m', 'move the login to the host');

  const r = s.check('--repo', s.work, '--since', since);

  assert.equal(r.stdout, 'No stale mention.\n');
  assert.equal(r.status, 0, r.stderr);
});

test('a word that only contains a removed name, or a plain-word name in prose, is not listed', () => {
  using s = sandbox();
  s.write('src/run.ts', 'export function stop() {}\nexport const go = 1;\n');
  s.write('docs/guide.md', '`stopRules`, `unstop`, `stop_all` and the `stop-hook` stay.\n`$stop` and `stop$` too.\nThen stop the run in prose.\n');
  s.memory('note.md', 'See stopRules.\n');
  s.git('add', '.');
  s.git('commit', '-q', '-m', 'add');
  const since = s.git('rev-parse', 'HEAD').trim();
  s.write('src/run.ts', 'export const go = 1;\n');
  s.git('add', '.');
  s.git('commit', '-q', '-m', 'drop stop');

  const r = s.check('--repo', s.work, '--since', since);

  assert.equal(r.stdout, 'No stale mention.\n');
  assert.equal(r.status, 0, r.stderr);
});

test('a rule id removed from a rules file and still named in a doc is listed', () => {
  using s = sandbox();
  s.write('hooks/rules/stop.ts', "export const rules = [\n  { id: 'close-check-before-safe-to-close', run() {} },\n  { id: 'kept-rule', run() {} },\n];\n");
  s.write('hooks/README.md', '| `close-check-before-safe-to-close` | blocks a claim |\n| `kept-rule` | stays |\n');
  s.git('add', '.');
  s.git('commit', '-q', '-m', 'rules');
  const since = s.git('rev-parse', 'HEAD').trim();
  s.write('hooks/rules/stop.ts', "export const rules = [\n  { id: 'kept-rule', run() {} },\n];\n");
  s.git('add', '.');
  s.git('commit', '-q', '-m', 'drop the rule');

  const r = s.check('--repo', s.work, '--since', since);

  assert.match(r.stdout, /: rule id close-check-before-safe-to-close \(hooks\/rules\/stop\.ts\)\n {2}\S+hooks\/README\.md:1\n/);
  assert.equal(lastLine(r.stdout), 'Stale mentions: 1');
  assert.equal(r.status, 1, r.stderr);
});

test('a CLI flag removed from its option parsing, and one removed from its usage text, still named in a doc are listed', () => {
  using s = sandbox();
  s.write('bin/tool.mjs', "#!/usr/bin/env node\n// Usage: tool [--repo <path>] [--dry-run]\nimport { parseArgs } from 'node:util';\nconst { values } = parseArgs({ options: { repo: { type: 'string' }, since: { type: 'string' } }, strict: false });\n");
  s.write('README.md', 'Run `tool --repo . --since v1`.\nAdd --dry-run to print only.\nThe --since-tag form is another tool.\n');
  s.git('add', '.');
  s.git('commit', '-q', '-m', 'cli');
  const since = s.git('rev-parse', 'HEAD').trim();
  s.write('bin/tool.mjs', "#!/usr/bin/env node\n// Usage: tool [--repo <path>]\nimport { parseArgs } from 'node:util';\nconst { values } = parseArgs({ options: { repo: { type: 'string' } } });\n");
  s.git('add', '.');
  s.git('commit', '-q', '-m', 'drop --since and --dry-run');

  const r = s.check('--repo', s.work, '--since', since);

  assert.match(r.stdout, /: flag --since \(bin\/tool\.mjs\)\n {2}\S+README\.md:1\n/);
  assert.match(r.stdout, /: flag --dry-run \(bin\/tool\.mjs\)\n {2}\S+README\.md:2\n/);
  assert.equal(lastLine(r.stdout), 'Stale mentions: 2');
  assert.equal(r.status, 1, r.stderr);
});

test('a flag that another CLI still declares only as a parseArgs key is not listed', () => {
  using s = sandbox();
  s.write('bin/old.mjs', "#!/usr/bin/env node\n// Usage: old [--since <rev>]\nimport { parseArgs } from 'node:util';\nparseArgs({ options: { since: { type: 'string' } } });\n");
  s.write('bin/new.mjs', "#!/usr/bin/env node\nimport { parseArgs } from 'node:util';\nparseArgs({ options: { since: { type: 'string' } } });\n");
  s.write('README.md', 'Pass --since.\n');
  s.git('add', '.');
  s.git('commit', '-q', '-m', 'cli');
  const since = s.git('rev-parse', 'HEAD').trim();
  s.git('rm', '-q', 'bin/old.mjs');
  s.git('commit', '-q', '-m', 'drop old');

  const r = s.check('--repo', s.work, '--since', since);

  assert.equal(r.stdout, 'No stale mention.\n');
  assert.equal(r.status, 0, r.stderr);
});

const HISTORY = 'In decisions (history: keep the text; add a status paragraph only if the decision changed)';

test('mentions in ADRs go under the history heading, one line per ADR file with the names it mentions', () => {
  using s = sandbox();
  s.write('src/login.ts', 'export function warehouseLogin() {}\nexport const retryLimit = 3;\nexport const keep = 1;\n');
  s.write('packages/w/docs/adr/0001-login.md', '# Login\n\nThe host calls `warehouseLogin()`.\nThen warehouseLogin again, with retryLimit.\n');
  s.write('packages/w/docs/adr/0002-retries.md', 'warehouseLogin retries.\n');
  s.write('README.md', 'Call warehouseLogin.\n');
  s.git('add', '.');
  s.git('commit', '-q', '-m', 'add');
  const since = s.git('rev-parse', 'HEAD').trim();
  s.write('src/login.ts', 'export const keep = 1;\n');
  s.git('add', '.');
  s.git('commit', '-q', '-m', 'drop the login');

  const r = s.check('--repo', s.work, '--since', since);

  const adr = (file) => join(s.work, 'packages/w/docs/adr', file);
  assert.equal(r.stdout, [
    `${s.work}: export warehouseLogin (src/login.ts)`,
    `  ${join(s.work, 'README.md')}:1`,
    HISTORY,
    `  ${adr('0001-login.md')}: export warehouseLogin, export retryLimit`,
    `  ${adr('0002-retries.md')}: export warehouseLogin`,
    'Stale mentions: 1',
    '',
  ].join('\n'));
  assert.equal(r.status, 1, r.stderr);
});

test('a removed name that only ADRs mention is no stale mention, exit 0', () => {
  using s = sandbox();
  s.write('src/login.ts', 'export function warehouseLogin() {}\nexport const keep = 1;\n');
  s.write('docs/adr/0001-login.md', 'The host calls warehouseLogin.\n');
  s.git('add', '.');
  s.git('commit', '-q', '-m', 'add');
  const since = s.git('rev-parse', 'HEAD').trim();
  s.write('src/login.ts', 'export const keep = 1;\n');
  s.git('add', '.');
  s.git('commit', '-q', '-m', 'drop the login');

  const r = s.check('--repo', s.work, '--since', since);

  assert.equal(r.stdout, `${HISTORY}\n  ${join(s.work, 'docs/adr/0001-login.md')}: export warehouseLogin\nNo stale mention.\n`);
  assert.equal(r.status, 0, r.stderr);
});
