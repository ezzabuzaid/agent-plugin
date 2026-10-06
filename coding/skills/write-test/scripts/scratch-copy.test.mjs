import assert from 'node:assert/strict';
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { randomBytes, randomUUID } from 'node:crypto';
import {
  chmodSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readlinkSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { once } from 'node:events';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('./scratch-copy.mjs', import.meta.url));

// A git and node environment that the user's global config and an enclosing
// test runner can't leak into.
function cleanEnv(root) {
  const env = { PATH: process.env.PATH, HOME: root, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1' };
  return env;
}

function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, env: cleanEnv(cwd), encoding: 'utf8' });
}

function scratchCopy(args, root, env = {}) {
  const result = spawnSync(process.execPath, [script, ...args], { env: { ...cleanEnv(root), ...env }, encoding: 'utf8' });
  return { status: result.status, stderr: result.stderr, json: result.stdout ? JSON.parse(result.stdout) : null };
}

test('a tracked symlink whose target does not exist is recreated verbatim and the copy still succeeds', () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'wt-copy-')));
  try {
    const repo = join(root, 'repo');
    mkdirSync(join(repo, 'packages/llm'), { recursive: true });
    writeFileSync(join(repo, 'packages/llm/index.js'), 'export {};\n');
    symlinkSync('../../packages/llm-missing', join(repo, 'packages/llm/llm'));
    git(repo, 'init', '-q');
    git(repo, 'add', '-A');
    git(repo, '-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '-qm', 'init');
    const dest = join(root, `copy-${randomUUID()}`);

    const { status, json } = scratchCopy(['--repo', repo, '--dest', dest, '--min-free-gb', '0'], root);

    assert.equal(status, 0);
    assert.equal(json.copy, dest);
    assert.equal(lstatSync(join(dest, 'packages/llm/llm')).isSymbolicLink(), true);
    assert.equal(readlinkSync(join(dest, 'packages/llm/llm')), '../../packages/llm-missing');
    assert.equal(readFileSync(join(dest, 'packages/llm/index.js'), 'utf8'), 'export {};\n');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('a tracked file deleted in the working tree is skipped and reported, and the copy still succeeds', () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'wt-copy-')));
  try {
    const repo = join(root, 'repo');
    mkdirSync(join(repo, 'docs'), { recursive: true });
    writeFileSync(join(repo, 'docs/kept.md'), 'kept\n');
    writeFileSync(join(repo, 'docs/gone.md'), 'gone\n');
    git(repo, 'init', '-q');
    git(repo, 'add', '-A');
    git(repo, '-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '-qm', 'init');
    rmSync(join(repo, 'docs/gone.md'));
    const dest = join(root, `copy-${randomUUID()}`);

    const { status, json } = scratchCopy(['--repo', repo, '--dest', dest, '--min-free-gb', '0'], root);

    assert.equal(status, 0);
    assert.deepEqual(json.skipped, [{ path: 'docs/gone.md', reason: 'deleted in working tree' }]);
    assert.equal(existsSync(join(dest, 'docs/gone.md')), false);
    assert.equal(readFileSync(join(dest, 'docs/kept.md'), 'utf8'), 'kept\n');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

// A real APFS volume of a few MB, so disk limits are the volume's own, not faked.
function mountTinyVolume(root, megabytes) {
  const image = join(root, 'tiny.dmg');
  const mountpoint = join(root, 'tiny');
  execFileSync('hdiutil', ['create', '-size', `${megabytes}m`, '-fs', 'APFS', '-volname', 'wt', image, '-quiet']);
  execFileSync('hdiutil', ['attach', image, '-nobrowse', '-mountpoint', mountpoint, '-quiet']);
  return { mountpoint, [Symbol.dispose]: () => execFileSync('hdiutil', ['detach', mountpoint, '-force', '-quiet']) };
}

test('a destination volume with less free space than --min-free-gb (1 GB unless given) is refused before copying and nothing is left behind', () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'wt-copy-')));
  try {
    const repo = join(root, 'repo');
    mkdirSync(repo);
    writeFileSync(join(repo, 'a.txt'), 'a\n');
    git(repo, 'init', '-q');
    using volume = mountTinyVolume(root, 8);
    const dest = join(volume.mountpoint, `copy-${randomUUID()}`);

    const { status, json } = scratchCopy(['--repo', repo, '--dest', dest], root);

    assert.equal(status, 1);
    assert.match(json.error, /free/);
    assert.ok(json.freeGbBefore > 0 && json.freeGbBefore < 0.01, `freeGbBefore=${json.freeGbBefore}`);
    assert.equal(existsSync(dest), false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('the destination volume running out of space mid-copy fails and removes the partial copy', () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'wt-copy-')));
  try {
    const repo = join(root, 'repo');
    mkdirSync(repo);
    writeFileSync(join(repo, 'small.txt'), 'small\n');
    writeFileSync(join(repo, 'large.bin'), randomBytes(12 * 1024 * 1024));
    git(repo, 'init', '-q');
    using volume = mountTinyVolume(root, 8);
    const dest = join(volume.mountpoint, `copy-${randomUUID()}`);

    const { status, json } = scratchCopy(['--repo', repo, '--dest', dest, '--min-free-gb', '0'], root);

    assert.equal(status, 1);
    assert.match(json.error, /ENOSPC/);
    assert.equal(existsSync(dest), false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('a file that cannot be read fails the copy and removes the partial copy', () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'wt-copy-')));
  try {
    const repo = join(root, 'repo');
    mkdirSync(repo);
    writeFileSync(join(repo, 'a-readable.txt'), 'a\n');
    writeFileSync(join(repo, 'z-locked.txt'), 'z\n');
    git(repo, 'init', '-q');
    chmodSync(join(repo, 'z-locked.txt'), 0o000);
    const dest = join(root, `copy-${randomUUID()}`);

    const { status, json } = scratchCopy(['--repo', repo, '--dest', dest, '--min-free-gb', '0'], root);

    assert.equal(status, 1);
    assert.match(json.error, /EACCES/);
    assert.equal(existsSync(dest), false);
  } finally {
    chmodSync(join(root, 'repo/z-locked.txt'), 0o644);
    rmSync(root, { recursive: true, force: true });
  }
});

test('a node_modules entry that /bin/cp silently drops is reported as a short node_modules and the copy is flagged', async () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'wt-copy-')));
  const server = createServer();
  try {
    const repo = join(root, 'repo');
    mkdirSync(join(repo, 'node_modules/tslib'), { recursive: true });
    mkdirSync(join(repo, 'node_modules/lodash'), { recursive: true });
    writeFileSync(join(repo, 'node_modules/tslib/package.json'), '{"name":"tslib"}\n');
    writeFileSync(join(repo, '.gitignore'), 'node_modules/\n');
    writeFileSync(join(repo, 'index.js'), 'export {};\n');
    git(repo, 'init', '-q');
    // cp copies every entry of node_modules except a socket, and still exits 0.
    await new Promise((done) => server.listen(join(repo, 'node_modules/.cache.sock'), done));
    const dest = join(root, `copy-${randomUUID()}`);

    const { status, json } = scratchCopy(['--repo', repo, '--dest', dest, '--min-free-gb', '0'], root);

    assert.equal(status, 2);
    assert.deepEqual(json.shortNodeModules, [{ path: 'node_modules', missing: ['.cache.sock'] }]);
    assert.equal(existsSync(join(dest, 'node_modules/tslib/package.json')), true);
  } finally {
    server.close();
    rmSync(root, { recursive: true, force: true });
  }
});

test('a workspace build the copy left out fails the check with an --include-ignored hint, while one the repo never built is only listed', () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'wt-copy-')));
  try {
    const repo = join(root, 'repo');
    mkdirSync(join(repo, 'packages/a'), { recursive: true });
    mkdirSync(join(repo, 'packages/b/dist'), { recursive: true });
    mkdirSync(join(repo, 'node_modules/@ws'), { recursive: true });
    writeFileSync(join(repo, '.gitignore'), 'node_modules/\ndist/\n');
    writeFileSync(join(repo, 'packages/a/package.json'), JSON.stringify({ name: '@ws/a', main: 'dist/a.js' }));
    writeFileSync(
      join(repo, 'packages/b/package.json'),
      JSON.stringify({ name: '@ws/b', exports: { '.': { import: './dist/b.mjs' }, './lib/*': './dist/lib/*.mjs' } }),
    );
    writeFileSync(join(repo, 'packages/b/dist/b.mjs'), 'export {};\n');
    symlinkSync('../../packages/a', join(repo, 'node_modules/@ws/a'));
    symlinkSync('../../packages/b', join(repo, 'node_modules/@ws/b'));
    git(repo, 'init', '-q');
    const dest = join(root, `copy-${randomUUID()}`);

    const { status, json } = scratchCopy(
      ['--repo', repo, '--dest', dest, '--min-free-gb', '0', '--exclude-ignored', 'dist'],
      root,
    );

    assert.equal(status, 2);
    assert.deepEqual(json.missingBuilds, [
      { package: '@ws/b', path: 'packages/b/dist/b.mjs', hint: 'left out of the copy; add --include-ignored dist' },
    ]);
    assert.deepEqual(json.unbuilt, [{ package: '@ws/a', path: 'packages/a/dist/a.js' }]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('a node_modules link that resolves into the original repo instead of the copy is reported as bad', () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'wt-copy-')));
  try {
    const repo = join(root, 'repo');
    mkdirSync(join(repo, 'packages/c'), { recursive: true });
    mkdirSync(join(repo, 'node_modules/@ws'), { recursive: true });
    writeFileSync(join(repo, '.gitignore'), 'node_modules/\n');
    writeFileSync(join(repo, 'packages/c/package.json'), JSON.stringify({ name: '@ws/c' }));
    symlinkSync(join(repo, 'packages/c'), join(repo, 'node_modules/@ws/c'));
    git(repo, 'init', '-q');
    const dest = join(root, `copy-${randomUUID()}`);

    const { status, json } = scratchCopy(['--repo', repo, '--dest', dest, '--min-free-gb', '0'], root);

    assert.equal(status, 2);
    assert.deepEqual(json.links, { ok: 0, bad: [{ link: 'node_modules/@ws/c', resolvesTo: join(repo, 'packages/c') }] });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('another cp first on PATH does not change how ignored directories are cloned', () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'wt-copy-')));
  try {
    const repo = join(root, 'repo');
    mkdirSync(join(repo, 'node_modules/tslib'), { recursive: true });
    writeFileSync(join(repo, 'node_modules/tslib/package.json'), '{"name":"tslib"}\n');
    writeFileSync(join(repo, '.gitignore'), 'node_modules/\n');
    git(repo, 'init', '-q');
    // Stands in for GNU cp from coreutils: different flags, here it just refuses.
    mkdirSync(join(root, 'bin'));
    writeFileSync(join(root, 'bin/cp'), `#!/bin/sh\ntouch ${join(root, 'decoy-ran')}\nexit 1\n`, { mode: 0o755 });
    const dest = join(root, `copy-${randomUUID()}`);

    const { status } = scratchCopy(['--repo', repo, '--dest', dest, '--min-free-gb', '0'], root, {
      PATH: `${join(root, 'bin')}:${process.env.PATH}`,
    });

    assert.equal(status, 0);
    assert.equal(existsSync(join(root, 'decoy-ran')), false);
    assert.equal(readFileSync(join(dest, 'node_modules/tslib/package.json'), 'utf8'), '{"name":"tslib"}\n');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('--remove refuses a directory that has no copy manifest and leaves it intact', () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'wt-copy-')));
  try {
    // A directory scratch-copy never made: the manifest's absence is the point.
    const work = join(root, 'real-work');
    mkdirSync(work);
    writeFileSync(join(work, 'notes.md'), 'keep me\n');

    const { status, json } = scratchCopy(['--remove', work], root);

    assert.equal(status, 1);
    assert.match(json.error, /manifest/);
    assert.equal(readFileSync(join(work, 'notes.md'), 'utf8'), 'keep me\n');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('--remove kills a process running from the copy, leaves a process outside it running, and deletes the copy', async () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'wt-copy-')));
  const idle = 'setInterval(() => {}, 1000)';
  let fromCopy;
  let elsewhere;
  try {
    const repo = join(root, 'repo');
    mkdirSync(repo);
    writeFileSync(join(repo, 'a.txt'), 'a\n');
    git(repo, 'init', '-q');
    const dest = join(root, `copy-${randomUUID()}`);
    assert.equal(scratchCopy(['--repo', repo, '--dest', dest, '--min-free-gb', '0'], root).status, 0);
    // Like an nx daemon started from the copy: its argv names the copy's path.
    fromCopy = spawn(process.execPath, ['-e', idle, join(dest, 'daemon')], { stdio: 'ignore' });
    elsewhere = spawn(process.execPath, ['-e', idle, join(root, 'not-the-copy')], { stdio: 'ignore' });
    await Promise.all([once(fromCopy, 'spawn'), once(elsewhere, 'spawn')]);

    const { status, json } = scratchCopy(['--remove', dest], root);

    assert.equal(status, 0);
    assert.deepEqual(json.killedPids, [fromCopy.pid]);
    await once(fromCopy, 'exit', { signal: AbortSignal.timeout(5000) });
    assert.equal(elsewhere.exitCode, null);
    assert.equal(elsewhere.signalCode, null);
    assert.equal(existsSync(dest), false);
  } finally {
    fromCopy?.kill('SIGKILL');
    elsewhere?.kill('SIGKILL');
    rmSync(root, { recursive: true, force: true });
  }
});

test('uncommitted edits and untracked files are copied with their working-tree content', () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'wt-copy-')));
  try {
    const repo = join(root, 'repo');
    mkdirSync(join(repo, 'src'), { recursive: true });
    writeFileSync(join(repo, 'src/queue.ts'), 'export const limit = 1;\n');
    git(repo, 'init', '-q');
    git(repo, 'add', '-A');
    git(repo, '-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '-qm', 'init');
    writeFileSync(join(repo, 'src/queue.ts'), 'export const limit = 2;\n');
    writeFileSync(join(repo, 'src/queue.test.ts'), 'new test\n');
    const dest = join(root, `copy-${randomUUID()}`);

    const { status, json } = scratchCopy(['--repo', repo, '--dest', dest, '--min-free-gb', '0'], root);

    assert.equal(status, 0);
    assert.equal(json.filesCopied, 2);
    assert.ok(json.freeGbBefore > 0 && json.freeGbAfter > 0, `free ${json.freeGbBefore} → ${json.freeGbAfter}`);
    assert.equal(readFileSync(join(dest, 'src/queue.ts'), 'utf8'), 'export const limit = 2;\n');
    assert.equal(readFileSync(join(dest, 'src/queue.test.ts'), 'utf8'), 'new test\n');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('ignored build output and dependencies are copied while caches and secrets stay out unless asked for', () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'wt-copy-')));
  try {
    const repo = join(root, 'repo');
    const ignored = ['dist/', 'node_modules/', '.nx/', '.env', '.env.local', '.DS_Store', 'coverage/', 'test-results.xml'];
    mkdirSync(join(repo, 'dist'), { recursive: true });
    mkdirSync(join(repo, 'packages/p/node_modules/dep'), { recursive: true });
    mkdirSync(join(repo, '.nx/cache'), { recursive: true });
    mkdirSync(join(repo, 'coverage'), { recursive: true });
    writeFileSync(join(repo, '.gitignore'), `${ignored.join('\n')}\n`);
    writeFileSync(join(repo, 'dist/index.js'), 'built\n');
    writeFileSync(join(repo, 'packages/p/node_modules/dep/index.js'), 'dep\n');
    writeFileSync(join(repo, '.nx/cache/run.json'), '{}\n');
    writeFileSync(join(repo, '.env'), 'TOKEN=secret\n');
    writeFileSync(join(repo, '.env.local'), 'TOKEN=local\n');
    writeFileSync(join(repo, '.DS_Store'), '');
    writeFileSync(join(repo, 'coverage/lcov.info'), '');
    writeFileSync(join(repo, 'test-results.xml'), '<testsuites/>\n');
    git(repo, 'init', '-q');
    const byDefault = join(root, `copy-${randomUUID()}`);
    const withEnv = join(root, `copy-${randomUUID()}`);

    const defaults = scratchCopy(['--repo', repo, '--dest', byDefault, '--min-free-gb', '0'], root);
    const overridden = scratchCopy(
      ['--repo', repo, '--dest', withEnv, '--min-free-gb', '0', '--include-ignored', '.env', '--exclude-ignored', 'dist'],
      root,
    );

    assert.equal(defaults.status, 0);
    assert.deepEqual(defaults.json.ignoredCopied.sort(), ['dist', 'packages/p/node_modules']);
    for (const left of ['.nx', '.env', '.env.local', '.DS_Store', 'coverage', 'test-results.xml']) {
      assert.equal(existsSync(join(byDefault, left)), false, `${left} was copied`);
    }
    assert.equal(readFileSync(join(byDefault, 'packages/p/node_modules/dep/index.js'), 'utf8'), 'dep\n');
    assert.equal(overridden.status, 0);
    assert.deepEqual(overridden.json.ignoredCopied.sort(), ['.env', 'packages/p/node_modules']);
    assert.equal(readFileSync(join(withEnv, '.env'), 'utf8'), 'TOKEN=secret\n');
    assert.equal(existsSync(join(withEnv, '.env.local')), false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('a relative workspace link resolves inside the copy and no link is reported bad', () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'wt-copy-')));
  try {
    const repo = join(root, 'repo');
    mkdirSync(join(repo, 'packages/queue/dist'), { recursive: true });
    mkdirSync(join(repo, 'node_modules/@ws'), { recursive: true });
    writeFileSync(join(repo, '.gitignore'), 'node_modules/\ndist/\n');
    writeFileSync(join(repo, 'packages/queue/package.json'), JSON.stringify({ name: '@ws/queue', main: 'dist/index.js' }));
    writeFileSync(join(repo, 'packages/queue/dist/index.js'), 'export {};\n');
    symlinkSync('../../packages/queue', join(repo, 'node_modules/@ws/queue'));
    // A workspace package deleted from the tree leaves its link behind, dangling.
    symlinkSync('../../packages/removed', join(repo, 'node_modules/@ws/removed'));
    git(repo, 'init', '-q');
    const dest = join(root, `copy-${randomUUID()}`);

    const { status, json } = scratchCopy(['--repo', repo, '--dest', dest, '--min-free-gb', '0'], root);

    assert.equal(status, 0);
    assert.deepEqual(json.links, { ok: 1, bad: [] });
    assert.deepEqual(json.missingBuilds, []);
    assert.equal(realpathSync(join(dest, 'node_modules/@ws/queue')), join(dest, 'packages/queue'));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('without --dest the copy goes to a new temporary directory, and its path is reported', () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'wt-copy-')));
  let copy;
  try {
    const repo = join(root, 'repo');
    mkdirSync(repo);
    writeFileSync(join(repo, 'a.txt'), 'a\n');
    git(repo, 'init', '-q');

    const { status, json } = scratchCopy(['--repo', repo, '--min-free-gb', '0'], root, { TMPDIR: root });
    copy = json.copy;

    assert.equal(status, 0);
    assert.equal(dirname(copy), root);
    assert.equal(readFileSync(join(copy, 'a.txt'), 'utf8'), 'a\n');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('a workspace package the repo itself never built does not fail the copy', () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'wt-copy-')));
  try {
    const repo = join(root, 'repo');
    mkdirSync(join(repo, 'tools/playground'), { recursive: true });
    mkdirSync(join(repo, 'node_modules'), { recursive: true });
    writeFileSync(join(repo, '.gitignore'), 'node_modules/\n');
    // Its entry is a build output nobody has built, in the repo or the copy.
    writeFileSync(join(repo, 'tools/playground/package.json'), JSON.stringify({ name: 'playground', main: 'extension.cjs' }));
    symlinkSync('../tools/playground', join(repo, 'node_modules/playground'));
    git(repo, 'init', '-q');
    const dest = join(root, `copy-${randomUUID()}`);

    const { status, json } = scratchCopy(['--repo', repo, '--dest', dest, '--min-free-gb', '0'], root);

    assert.equal(status, 0);
    assert.deepEqual(json.missingBuilds, []);
    assert.deepEqual(json.unbuilt, [{ package: 'playground', path: 'tools/playground/extension.cjs' }]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('--remove given a symlinked path to the copy still kills a process that names the resolved path', async () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'wt-copy-')));
  let fromCopy;
  try {
    const repo = join(root, 'repo');
    mkdirSync(repo);
    writeFileSync(join(repo, 'a.txt'), 'a\n');
    git(repo, 'init', '-q');
    // macOS gives /var/folders/… from tmpdir(), while processes may name /private/var/….
    symlinkSync(root, join(root, 'alias'));
    const name = `copy-${randomUUID()}`;
    const viaAlias = join(root, 'alias', name);
    assert.equal(scratchCopy(['--repo', repo, '--dest', viaAlias, '--min-free-gb', '0'], root).status, 0);
    fromCopy = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)', join(root, name, 'daemon')], { stdio: 'ignore' });
    await once(fromCopy, 'spawn');

    const { status, json } = scratchCopy(['--remove', viaAlias], root);

    assert.equal(status, 0);
    assert.deepEqual(json.killedPids, [fromCopy.pid]);
    await once(fromCopy, 'exit', { signal: AbortSignal.timeout(5000) });
    assert.equal(existsSync(join(root, name)), false);
  } finally {
    fromCopy?.kill('SIGKILL');
    rmSync(root, { recursive: true, force: true });
  }
});
