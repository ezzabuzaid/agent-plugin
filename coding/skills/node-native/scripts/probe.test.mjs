import assert from 'node:assert/strict';
import { execFile, spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { once } from 'node:events';
import { mkdir, mkdtempDisposable, readdir, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const script = fileURLToPath(new URL('./probe.mjs', import.meta.url));

// Every run names a surface snapshot; `node` is the Node it claims to be built
// on, the running one unless a test says otherwise.
async function probe(dir, args, { env = {}, node = process.version } = {}) {
  const surface = join(dir, 'surface.json');
  await writeFile(surface, JSON.stringify({ node, apis: {} }));
  const child = spawn(process.execPath, [script, '--surface', surface, ...args], {
    env: { PATH: process.env.PATH, ...env },
    signal: AbortSignal.timeout(120_000),
    killSignal: 'SIGKILL',
  });
  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (chunk) => (stdout += chunk));
  child.stderr.on('data', (chunk) => (stderr += chunk));
  const [status] = await once(child, 'close');
  return { status, stderr, json: stdout ? JSON.parse(stdout) : null };
}

async function write(path, content) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content);
}

// A workspace the way a user's repo looks to Node: a package installed in its
// node_modules, found by the normal resolution.
async function workspaceWithGreeter(dir) {
  await write(join(dir, 'package.json'), '{ "private": true }\n');
  await write(
    join(dir, 'node_modules', 'greeter', 'package.json'),
    JSON.stringify({ name: 'greeter', version: '1.0.0', type: 'module', exports: './index.js' }),
  );
  await write(join(dir, 'node_modules', 'greeter', 'index.js'), 'export const greet = (name) => `Hello, ${name}!`;\n');
}

async function site(dir, source) {
  await workspaceWithGreeter(join(dir, 'workspace'));
  await write(join(dir, 'site.mjs'), source);
  return ['--site', join(dir, 'site.mjs'), '--from', join(dir, 'workspace')];
}

// npm with no user config or cache of the developer's, a registry that is
// whatever the test says, and a TMPDIR the test can inspect.
const isolatedNpm = (dir, registry) => ({
  HOME: dir,
  npm_config_cache: join(dir, 'npm-cache'),
  npm_config_registry: registry,
  npm_config_fetch_retries: '0',
  npm_config_update_notifier: 'false',
  TMPDIR: join(dir, 'tmp'),
});

const leftoverScratch = async (dir) =>
  (await readdir(join(dir, 'tmp'))).filter((name) => name.startsWith('node-native-probe-'));

test('a run on a Node other than the one the surface was built on is refused before anything is probed', async () => {
  await using dir = await mkdtempDisposable(join(tmpdir(), 'probe-'));
  const args = await site(
    dir.path,
    `export default { replaces: { greeter: { greet: { native: () => 'Hello, Ada!', package: (greeter) => greeter.greet('Ada') } } } };\n`,
  );

  const offSurface = await probe(dir.path, args, { node: 'v0.0.1' });

  assert.equal(offSurface.status, 2);
  assert.ok(
    offSurface.stderr.includes(`the surface is v0.0.1 but this is Node ${process.version}; probe on v0.0.1`),
    offSurface.stderr,
  );
  assert.equal(offSurface.json, null);
});

test('a mapping whose native side differs from the package, or throws, is reported broken', async () => {
  await using dir = await mkdtempDisposable(join(tmpdir(), 'probe-'));
  const args = await site(
    dir.path,
    `export default { replaces: { greeter: {
      differs: { native: () => 'Hello, Ada.', package: (greeter) => greeter.greet('Ada') },
      throws: { native: () => { throw new RangeError('no greeting'); }, package: (greeter) => greeter.greet('Ada') },
      throwsWhereThePackageReturnsNothing: { native: () => { throw new RangeError('no removal'); }, package: () => undefined },
    } } };\n`,
  );

  const { status, json } = await probe(dir.path, args);

  assert.equal(status, 1);
  assert.deepEqual(
    json.rows.map(({ entry, group, member, claim, verdict }) => ({ entry, group, member, claim, verdict })),
    [
      { entry: 'site', group: 'greeter', member: 'differs', claim: 'equal', verdict: 'broken' },
      { entry: 'site', group: 'greeter', member: 'throws', claim: 'equal', verdict: 'broken' },
      { entry: 'site', group: 'greeter', member: 'throwsWhereThePackageReturnsNothing', claim: 'equal', verdict: 'broken' },
    ],
  );
  assert.ok(json.rows[0].native.includes('Hello, Ada.') && json.rows[0].other.includes('Hello, Ada!'));
  assert.ok(json.rows[1].native.includes('RangeError'));
});

test('a gap whose native side now matches the package is reported gap-closed', async () => {
  await using dir = await mkdtempDisposable(join(tmpdir(), 'probe-'));
  const args = await site(
    dir.path,
    `export default { replaces: { greeter: { greet: {
      gap: 'no native greeting',
      native: () => 'Hello, Ada!',
      package: (greeter) => greeter.greet('Ada'),
    } } } };\n`,
  );

  const { status, json } = await probe(dir.path, args);

  assert.equal(status, 1);
  assert.deepEqual(
    json.rows.map(({ member, claim, verdict }) => ({ member, claim, verdict })),
    [{ member: 'greet', claim: 'differs', verdict: 'gap-closed' }],
  );
});

test('a row where Node does better holds while the two differ, and is reported improvement-lost once they are equal', async () => {
  await using dir = await mkdtempDisposable(join(tmpdir(), 'probe-'));
  const args = await site(
    dir.path,
    `export default { replaces: { greeter: {
      'greet: punctuation': {
        improves: 'Node ends the greeting with a full stop',
        native: () => 'Hello, Ada.',
        package: (greeter) => greeter.greet('Ada'),
      },
      'greet: unchanged': {
        improves: 'Node greets differently',
        native: () => 'Hello, Ada!',
        package: (greeter) => greeter.greet('Ada'),
      },
      'greet: empty name': {
        improves: 'Node refuses an empty name where the package greets nobody',
        native: () => { throw new RangeError('empty name'); },
        package: (greeter) => greeter.greet(''),
      },
    } } };\n`,
  );

  const { status, json } = await probe(dir.path, args);

  assert.equal(status, 1);
  assert.deepEqual(
    json.rows.map(({ member, claim, verdict }) => ({ member, claim, verdict })),
    [
      { member: 'greet: punctuation', claim: 'differs', verdict: 'holds' },
      { member: 'greet: unchanged', claim: 'differs', verdict: 'improvement-lost' },
      { member: 'greet: empty name', claim: 'differs', verdict: 'holds' },
    ],
  );
});

test('a row whose package side throws, or that lacks a function to run, proves nothing and is reported probe-error', async () => {
  await using dir = await mkdtempDisposable(join(tmpdir(), 'probe-'));
  const args = await site(
    dir.path,
    `export default { replaces: { greeter: {
      mapped: { native: () => 'Hello, Ada!', package: (greeter) => greeter.wave('Ada') },
      gapped: { gap: 'no native wave', native: () => { throw new Error('no wave'); }, package: (greeter) => greeter.wave('Ada') },
      gapWithoutNative: { gap: 'no native greeting', package: (greeter) => greeter.greet('Ada') },
      mappingWithoutPackage: { native: () => 'Hello, Ada!' },
    } } };\n`,
  );

  const { status, json } = await probe(dir.path, args);

  assert.equal(status, 1);
  assert.deepEqual(
    json.rows.map(({ member, verdict, other }) => ({ member, verdict, other })),
    [
      { member: 'mapped', verdict: 'probe-error', other: 'threw TypeError' },
      { member: 'gapped', verdict: 'probe-error', other: 'threw TypeError' },
      { member: 'gapWithoutNative', verdict: 'probe-error', other: 'the row has no native()' },
      { member: 'mappingWithoutPackage', verdict: 'probe-error', other: 'the row has no package()' },
    ],
  );
});

test('a site probe for a package the workspace does not have reports that it cannot load it', async () => {
  await using dir = await mkdtempDisposable(join(tmpdir(), 'probe-'));
  const args = await site(
    dir.path,
    `export default { replaces: { farewell: { wave: { native: () => 'Bye', package: (farewell) => farewell.wave() } } } };\n`,
  );

  const { status, json } = await probe(dir.path, args);

  assert.equal(status, 1);
  assert.deepEqual(
    json.rows.map(({ group, member, claim, verdict }) => ({ group, member, claim, verdict })),
    [{ group: 'farewell', member: '*', claim: 'loads', verdict: 'probe-error' }],
  );
  assert.ok(json.rows[0].other.includes('ERR_MODULE_NOT_FOUND'), json.rows[0].other);
});

test('a probe process that dies stops the run and names the entry', async () => {
  await using dir = await mkdtempDisposable(join(tmpdir(), 'probe-'));
  await write(
    join(dir.path, 'catalog', 'exits.mjs'),
    `export default { apis: [], idioms: { exits: { native: () => process.exit(3), idiom: () => 0 } } };\n`,
  );

  const { status, stderr, json } = await probe(dir.path, ['--catalog', join(dir.path, 'catalog')]);

  assert.equal(status, 2);
  assert.ok(stderr.includes('the probes of exits exited 3'), stderr);
  assert.equal(json, null);
});

test('two entries that probe two versions of one package are refused before anything installs', async () => {
  await using dir = await mkdtempDisposable(join(tmpdir(), 'probe-'));
  await mkdir(join(dir.path, 'tmp'));
  await write(join(dir.path, 'catalog', 'old.mjs'), `export default { apis: [], replaces: { 'greeter@1.0.0': {} } };\n`);
  await write(join(dir.path, 'catalog', 'new.mjs'), `export default { apis: [], replaces: { 'greeter@2.0.0': {} } };\n`);

  const { status, stderr, json } = await probe(dir.path, ['--catalog', join(dir.path, 'catalog')], {
    env: isolatedNpm(dir.path, 'http://127.0.0.1:9/'),
  });

  assert.equal(status, 2);
  assert.ok(stderr.includes('the catalog probes two versions of one package'), stderr);
  assert.ok(stderr.includes('greeter@1.0.0') && stderr.includes('greeter@2.0.0'), stderr);
  assert.ok(!stderr.includes('npm install'), stderr);
  assert.equal(json, null);
});

test('an install that fails stops the run, names what it tried to install and leaves no scratch behind', async () => {
  await using dir = await mkdtempDisposable(join(tmpdir(), 'probe-'));
  await mkdir(join(dir.path, 'tmp'));
  await write(
    join(dir.path, 'catalog', 'greeting.mjs'),
    `export default { apis: [], replaces: {
      'greeter@1.0.0': { greet: { native: () => 'Hello, Ada!', package: (greeter) => greeter.greet('Ada') } },
      'farewell@2.0.0': { wave: { native: () => 'Bye', package: (farewell) => farewell.wave() } },
    } };\n`,
  );

  const { status, stderr, json } = await probe(dir.path, ['--catalog', join(dir.path, 'catalog')], {
    env: isolatedNpm(dir.path, 'http://127.0.0.1:9/'),
  });

  assert.equal(status, 2);
  assert.ok(stderr.includes('npm install greeter@1.0.0 farewell@2.0.0 failed'), stderr);
  assert.equal(json, null);
  assert.deepEqual(await leftoverScratch(dir.path), []);
});

test('an --entry the catalog does not have is refused instead of probing nothing', async () => {
  await using dir = await mkdtempDisposable(join(tmpdir(), 'probe-'));
  await write(join(dir.path, 'catalog', 'greeting.mjs'), `export default { apis: [] };\n`);

  const { status, stderr, json } = await probe(dir.path, ['--catalog', join(dir.path, 'catalog'), '--entry', 'greting']);

  assert.equal(status, 2);
  assert.ok(stderr.includes(`no catalog entry named greting in ${join(dir.path, 'catalog')}`), stderr);
  assert.equal(json, null);
});

test('a catalog with no entries is refused instead of reporting that every row holds', async () => {
  await using dir = await mkdtempDisposable(join(tmpdir(), 'probe-'));
  await mkdir(join(dir.path, 'catalog'));

  const empty = await probe(dir.path, ['--catalog', join(dir.path, 'catalog')]);
  const missing = await probe(dir.path, ['--catalog', join(dir.path, 'catalgo')]);

  assert.deepEqual([empty.status, empty.json], [2, null]);
  assert.ok(empty.stderr.includes(`no catalog entries in ${join(dir.path, 'catalog')}`), empty.stderr);
  assert.deepEqual([missing.status, missing.json], [2, null]);
  assert.ok(missing.stderr.includes(`no catalog entries in ${join(dir.path, 'catalgo')}`), missing.stderr);
});

test('in a catalog run an open gap holds and a closed gap is reported gap-closed', async () => {
  await using dir = await mkdtempDisposable(join(tmpdir(), 'probe-'));
  await write(
    join(dir.path, 'catalog', 'clone.mjs'),
    `export default { apis: [], idioms: {
      jsonDropsDates: {
        gap: 'a JSON round trip turns a Date into a string',
        native: () => structuredClone({ at: new Date(0) }),
        idiom: () => JSON.parse(JSON.stringify({ at: new Date(0) })),
      },
      nativeRefusesFunctions: {
        gap: 'structuredClone refuses functions',
        native: () => structuredClone({ run() {} }),
        idiom: () => ({ ...{ run() {} } }),
      },
      plainObjectsMatch: {
        gap: 'claimed open, but both sides copy a plain object the same way',
        native: () => structuredClone({ a: 1 }),
        idiom: () => JSON.parse(JSON.stringify({ a: 1 })),
      },
    } };\n`,
  );

  const { status, json } = await probe(dir.path, ['--catalog', join(dir.path, 'catalog')]);

  assert.equal(status, 1);
  assert.deepEqual(
    json.rows.map(({ member, verdict }) => ({ member, verdict })),
    [
      { member: 'jsonDropsDates', verdict: 'holds' },
      { member: 'nativeRefusesFunctions', verdict: 'holds' },
      { member: 'plainObjectsMatch', verdict: 'gap-closed' },
    ],
  );
});

test('an entry flag reaches the probe and is carried on its rows', async () => {
  await using dir = await mkdtempDisposable(join(tmpdir(), 'probe-'));
  const row = `{ native: () => typeof gc, idiom: () => 'function' }`;
  await write(
    join(dir.path, 'catalog', 'collect.mjs'),
    `export default { apis: [], flags: ['--expose-gc'], idioms: { gc: ${row} } };\n`,
  );
  await write(join(dir.path, 'catalog', 'collect-unflagged.mjs'), `export default { apis: [], idioms: { gc: ${row} } };\n`);

  const { status, json } = await probe(dir.path, ['--catalog', join(dir.path, 'catalog')]);

  assert.equal(status, 1);
  assert.deepEqual(
    json.rows.map(({ entry, flags, verdict }) => ({ entry, flags, verdict })),
    [
      { entry: 'collect-unflagged', flags: undefined, verdict: 'broken' },
      { entry: 'collect', flags: ['--expose-gc'], verdict: 'holds' },
    ],
  );
});

test('an entry’s env reaches the probe and is carried on its rows', async () => {
  await using dir = await mkdtempDisposable(join(tmpdir(), 'probe-'));
  const row = `{ native: () => process.env.NODE_NATIVE_PROBE, idiom: () => 'on' }`;
  await write(
    join(dir.path, 'catalog', 'debug-log.mjs'),
    `export default { apis: [], env: { NODE_NATIVE_PROBE: 'on' }, idioms: { enabled: ${row} } };\n`,
  );
  await write(join(dir.path, 'catalog', 'debug-log-unset.mjs'), `export default { apis: [], idioms: { enabled: ${row} } };\n`);

  const { status, json } = await probe(dir.path, ['--catalog', join(dir.path, 'catalog')]);

  assert.equal(status, 1);
  assert.deepEqual(
    json.rows.map(({ entry, env, verdict }) => ({ entry, env, verdict })),
    [
      { entry: 'debug-log-unset', env: undefined, verdict: 'broken' },
      { entry: 'debug-log', env: { NODE_NATIVE_PROBE: 'on' }, verdict: 'holds' },
    ],
  );
});

test('--entry reads only the entries it names, so a half-written sibling does not break the run', async () => {
  await using dir = await mkdtempDisposable(join(tmpdir(), 'probe-'));
  await write(
    join(dir.path, 'catalog', 'ready.mjs'),
    `export default { apis: [], idioms: { same: { native: () => 1, idiom: () => 1 } } };\n`,
  );
  await write(join(dir.path, 'catalog', 'half-written.mjs'), 'export default { apis: [], idioms: { same: { native: () =>\n');

  const selected = await probe(dir.path, ['--catalog', join(dir.path, 'catalog'), '--entry', 'ready']);
  const everything = await probe(dir.path, ['--catalog', join(dir.path, 'catalog')]);

  assert.equal(selected.status, 0, selected.stderr);
  assert.deepEqual(selected.json.rows.map(({ entry, verdict }) => ({ entry, verdict })), [{ entry: 'ready', verdict: 'holds' }]);
  assert.equal(everything.status, 2);
  assert.equal(everything.json, null);
});

test('a site probe can key a package subpath and gets that subpath’s export', async () => {
  await using dir = await mkdtempDisposable(join(tmpdir(), 'probe-'));
  const workspace = join(dir.path, 'workspace');
  await write(join(workspace, 'package.json'), '{ "private": true }\n');
  await write(
    join(workspace, 'node_modules', 'greeter', 'package.json'),
    JSON.stringify({ name: 'greeter', version: '1.0.0', type: 'module', exports: { '.': './index.js', './loud': './loud.js' } }),
  );
  await write(join(workspace, 'node_modules', 'greeter', 'index.js'), 'export const greet = (name) => `Hello, ${name}!`;\n');
  await write(join(workspace, 'node_modules', 'greeter', 'loud.js'), 'export const shout = (name) => `HELLO, ${name}!`;\n');
  await write(
    join(dir.path, 'site.mjs'),
    `export default { replaces: {
      greeter: { greet: { native: () => 'Hello, Ada!', package: (greeter) => greeter.greet('Ada') } },
      'greeter/loud': { shout: { native: () => 'HELLO, Ada!', package: (loud) => loud.shout('Ada') } },
    } };\n`,
  );

  const { status, json } = await probe(dir.path, ['--site', join(dir.path, 'site.mjs'), '--from', workspace]);

  assert.equal(status, 0);
  assert.deepEqual(
    json.rows.map(({ group, member, verdict }) => ({ group, member, verdict })),
    [
      { group: 'greeter', member: 'greet', verdict: 'holds' },
      { group: 'greeter/loud', member: 'shout', verdict: 'holds' },
    ],
  );
});

test('the package side learns the URL its package or subpath loaded from, so it can run it in a child process', async () => {
  await using dir = await mkdtempDisposable(join(tmpdir(), 'probe-'));
  const workspace = join(dir.path, 'workspace');
  await write(join(workspace, 'package.json'), '{ "private": true }\n');
  await write(
    join(workspace, 'node_modules', 'greeter', 'package.json'),
    JSON.stringify({ name: 'greeter', version: '1.0.0', type: 'module', exports: { '.': './index.js', './loud': './loud.js' } }),
  );
  await write(join(workspace, 'node_modules', 'greeter', 'index.js'), 'export const greet = (name) => `Hello, ${name}!`;\n');
  await write(join(workspace, 'node_modules', 'greeter', 'loud.js'), 'export const shout = (name) => `HELLO, ${name}!`;\n');
  await write(
    join(dir.path, 'site.mjs'),
    `import { execFileSync } from 'node:child_process';
    const inChild = (url, call) => execFileSync(
      process.execPath,
      ['--input-type=module', '-e', \`const module = await import(\${JSON.stringify(url)}); process.stdout.write(module.\${call});\`],
      { encoding: 'utf8' },
    );
    export default { replaces: {
      greeter: { greet: { native: () => 'Hello, Ada!', package: (greeter, { url }) => inChild(url, "greet('Ada')") } },
      'greeter/loud': { shout: { native: () => 'HELLO, Ada!', package: (loud, { url }) => inChild(url, "shout('Ada')") } },
    } };\n`,
  );

  const { status, json } = await probe(dir.path, ['--site', join(dir.path, 'site.mjs'), '--from', workspace]);

  assert.equal(status, 0, JSON.stringify(json));
  assert.deepEqual(
    json.rows.map(({ group, member, verdict }) => ({ group, member, verdict })),
    [
      { group: 'greeter', member: 'greet', verdict: 'holds' },
      { group: 'greeter/loud', member: 'shout', verdict: 'holds' },
    ],
  );
});

test('the package side can load another export of an installed package', async () => {
  await using dir = await mkdtempDisposable(join(tmpdir(), 'probe-'));
  const workspace = join(dir.path, 'workspace');
  await write(join(workspace, 'package.json'), '{ "private": true }\n');
  await write(
    join(workspace, 'node_modules', 'greeter', 'package.json'),
    JSON.stringify({ name: 'greeter', version: '1.0.0', type: 'module', exports: { '.': './index.js', './loud': './loud.js' } }),
  );
  await write(join(workspace, 'node_modules', 'greeter', 'index.js'), 'export const greet = (name) => `Hello, ${name}!`;\n');
  await write(join(workspace, 'node_modules', 'greeter', 'loud.js'), 'export const shout = (text) => text.toUpperCase();\n');
  await write(
    join(dir.path, 'site.mjs'),
    `export default { replaces: {
      greeter: { greet: {
        native: () => 'HELLO, ADA!',
        package: async (greeter, { load }) => (await load('greeter/loud')).shout(greeter.greet('Ada')),
      } },
      'greeter/loud': { shout: {
        native: () => 'HELLO, ADA!',
        package: async (loud, { load }) => loud.shout((await load('greeter')).greet('Ada')),
      } },
    } };\n`,
  );

  const { status, json } = await probe(dir.path, ['--site', join(dir.path, 'site.mjs'), '--from', workspace]);

  assert.equal(status, 0, JSON.stringify(json));
  assert.deepEqual(
    json.rows.map(({ group, member, verdict, other }) => ({ group, member, verdict, other })),
    [
      { group: 'greeter', member: 'greet', verdict: 'holds', other: "'HELLO, ADA!'" },
      { group: 'greeter/loud', member: 'shout', verdict: 'holds', other: "'HELLO, ADA!'" },
    ],
  );
});

test('a key that resolves to a Node built-in is refused, and a file of the package is probed', async () => {
  await using dir = await mkdtempDisposable(join(tmpdir(), 'probe-'));
  const workspace = join(dir.path, 'workspace');
  await write(join(workspace, 'package.json'), '{ "private": true }\n');
  await write(
    join(workspace, 'node_modules', 'string_decoder', 'package.json'),
    JSON.stringify({ name: 'string_decoder', version: '1.3.0', main: 'lib/string_decoder.js' }),
  );
  await write(join(workspace, 'node_modules', 'string_decoder', 'lib', 'string_decoder.js'), "exports.origin = 'npm';\n");
  await write(
    join(workspace, 'node_modules', 'util', 'package.json'),
    JSON.stringify({ name: 'util', version: '0.12.5', main: 'util.js' }),
  );
  await write(join(workspace, 'node_modules', 'util', 'types.js'), "exports.origin = 'npm';\n");
  const origin = `{ origin: { native: () => 'npm', package: (module) => module.origin } }`;
  await write(
    join(dir.path, 'site.mjs'),
    `export default { replaces: {
      string_decoder: ${origin},
      'string_decoder/lib/string_decoder.js': ${origin},
      'util/types': ${origin},
      'util/types.js': ${origin},
    } };\n`,
  );

  const { status, json } = await probe(dir.path, ['--site', join(dir.path, 'site.mjs'), '--from', workspace]);

  assert.equal(status, 1);
  assert.deepEqual(
    json.rows.map(({ group, member, claim, verdict }) => ({ group, member, claim, verdict })),
    [
      { group: 'string_decoder', member: '*', claim: 'loads', verdict: 'probe-error' },
      { group: 'string_decoder/lib/string_decoder.js', member: 'origin', claim: 'equal', verdict: 'holds' },
      { group: 'util/types', member: '*', claim: 'loads', verdict: 'probe-error' },
      { group: 'util/types.js', member: 'origin', claim: 'equal', verdict: 'holds' },
    ],
  );
  assert.ok(json.rows[0].other.includes('resolves to the Node built-in node:string_decoder'), json.rows[0].other);
  assert.ok(json.rows[2].other.includes('resolves to the Node built-in node:util/types'), json.rows[2].other);
});

async function contents(directory) {
  const files = {};
  for (const entry of await readdir(directory, { recursive: true, withFileTypes: true })) {
    if (entry.isFile()) files[join(entry.parentPath, entry.name)] = await readFile(join(entry.parentPath, entry.name), 'utf8');
  }
  return files;
}

test('a site probe loads the package the workspace resolves and writes nothing into the workspace', async () => {
  await using dir = await mkdtempDisposable(join(tmpdir(), 'probe-'));
  const workspace = join(dir.path, 'workspace');
  await workspaceWithGreeter(workspace);
  await write(
    join(dir.path, 'probes', 'node_modules', 'greeter', 'package.json'),
    JSON.stringify({ name: 'greeter', version: '9.0.0', type: 'module', exports: './index.js' }),
  );
  await write(join(dir.path, 'probes', 'node_modules', 'greeter', 'index.js'), 'export const greet = () => "wrong greeter";\n');
  await write(
    join(dir.path, 'probes', 'site.mjs'),
    `export default { replaces: { greeter: { greet: {
      native: () => 'Hello, Ada!',
      package: (greeter) => greeter.greet('Ada'),
    } } } };\n`,
  );
  const before = await contents(workspace);

  const { status, json } = await probe(dir.path, ['--site', join(dir.path, 'probes', 'site.mjs'), '--from', workspace]);

  assert.equal(status, 0);
  assert.deepEqual(
    json.rows.map(({ verdict, other }) => ({ verdict, other })),
    [{ verdict: 'holds', other: "'Hello, Ada!'" }],
  );
  assert.deepEqual(await contents(workspace), before);
});

// A registry on 127.0.0.1 that serves each package from a tarball `npm pack`
// built, so the install is a real `npm install` with no network.
async function registryOf(dir, packages) {
  const tarballs = new Map();
  await mkdir(join(dir, 'tarballs'));
  for (const [name, files] of Object.entries(packages)) {
    for (const [file, content] of Object.entries(files)) await write(join(dir, 'packages', name, file), content);
    const { stdout } = await promisify(execFile)(
      'npm',
      ['pack', join(dir, 'packages', name), '--pack-destination', join(dir, 'tarballs'), '--json'],
      { env: { PATH: process.env.PATH, ...isolatedNpm(dir, 'http://127.0.0.1:9/') } },
    );
    const { filename } = JSON.parse(stdout)[name];
    tarballs.set(name, await readFile(join(dir, 'tarballs', filename)));
  }
  const server = createServer((request, response) => {
    const name = decodeURIComponent(request.url.slice(1).split('/-/')[0]);
    const tarball = tarballs.get(name);
    if (!tarball) return response.writeHead(404).end();
    if (request.url.includes('/-/')) return response.writeHead(200).end(tarball);
    const manifest = JSON.parse(packages[name]['package.json']);
    const base = `http://127.0.0.1:${server.address().port}`;
    response.writeHead(200, { 'content-type': 'application/json' }).end(
      JSON.stringify({
        name,
        'dist-tags': { latest: manifest.version },
        versions: {
          [manifest.version]: {
            ...manifest,
            dist: {
              tarball: `${base}/${name}/-/${name}-${manifest.version}.tgz`,
              integrity: `sha512-${createHash('sha512').update(tarball).digest('base64')}`,
              shasum: createHash('sha1').update(tarball).digest('hex'),
            },
          },
        },
      }),
    );
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return server;
}

test('the catalog run installs packages under their real names, so a package finds its peer, and leaves no install behind', async () => {
  await using dir = await mkdtempDisposable(join(tmpdir(), 'probe-'));
  await mkdir(join(dir.path, 'tmp'));
  const server = await registryOf(dir.path, {
    'host-lib': {
      'package.json': JSON.stringify({
        name: 'host-lib',
        version: '1.0.0',
        type: 'module',
        exports: { '.': './index.js', './extra': './extra.js' },
      }),
      'index.js': 'export const greet = (name) => `Hello, ${name}!`;\n',
      'extra.js': 'export const wave = () => "o/";\n',
    },
    'peer-lib': {
      'package.json': JSON.stringify({
        name: 'peer-lib',
        version: '1.0.0',
        type: 'module',
        exports: './index.js',
        peerDependencies: { 'host-lib': '1.0.0' },
      }),
      'index.js': "import { greet } from 'host-lib';\nexport const shout = (name) => greet(name).toUpperCase();\n",
    },
  });
  try {
    await write(
      join(dir.path, 'catalog', 'shout.mjs'),
      `export default { apis: [], replaces: {
        'host-lib@1.0.0': { greet: { native: () => 'Hello, Ada!', package: (lib) => lib.greet('Ada') } },
        'host-lib@1.0.0/extra': { wave: { native: () => 'o/', package: (extra) => extra.wave() } },
        'peer-lib@1.0.0': { shout: { native: () => 'HELLO, ADA!', package: (lib) => lib.shout('Ada') } },
      } };\n`,
    );

    // With legacy peer deps, npm installs no peer on its own, as in a repo whose
    // .npmrc sets it: host-lib resolves for peer-lib only under its real name.
    const { status, stderr, json } = await probe(dir.path, ['--catalog', join(dir.path, 'catalog')], {
      env: {
        ...isolatedNpm(dir.path, `http://127.0.0.1:${server.address().port}/`),
        npm_config_legacy_peer_deps: 'true',
      },
    });

    assert.equal(status, 0, stderr);
    assert.deepEqual(
      json.rows.map(({ group, member, verdict }) => ({ group, member, verdict })),
      [
        { group: 'host-lib@1.0.0', member: 'greet', verdict: 'holds' },
        { group: 'host-lib@1.0.0/extra', member: 'wave', verdict: 'holds' },
        { group: 'peer-lib@1.0.0', member: 'shout', verdict: 'holds' },
      ],
    );
    assert.deepEqual(await leftoverScratch(dir.path), []);
  } finally {
    server.close();
  }
});

// Published packages for a lint row. The fake ESLint answers as the real one
// does: verify() runs the row's rule, and calculateConfigForFile() merges the
// config blocks that apply to a file, with each severity as an array. preset
// imports optional-lib when it loads, so it loads only when the catalog's config
// table installs that peer. Rule no-bad reports; no-worse is on only in a
// TypeScript block, and no-other only as off.
const lintPackages = {
  eslint: {
    'package.json': JSON.stringify({ name: 'eslint', version: '1.0.0', type: 'module', exports: './index.js' }),
    'index.js': `export class Linter {
      verify(code, [{ plugins, rules }]) {
        const [ruleId] = Object.keys(rules);
        const [namespace, name] = ruleId.split('/');
        return plugins[namespace].rules[name](code) ? [{ ruleId, message: 'reported' }] : [];
      }
    }
    export class ESLint {
      constructor({ overrideConfig }) { this.blocks = overrideConfig; }
      async calculateConfigForFile(file) {
        const blocks = this.blocks.filter(({ files }) => !files || file.endsWith(files));
        return { rules: Object.assign({}, ...blocks.map(({ rules }) => rules)) };
      }
    }\n`,
  },
  'config-lib': {
    'package.json': JSON.stringify({
      name: 'config-lib',
      version: '1.0.0',
      type: 'module',
      exports: { './preset': './preset.js' },
      peerDependencies: { 'optional-lib': '1.0.0' },
      peerDependenciesMeta: { 'optional-lib': { optional: true } },
    }),
    'preset.js': `import { isBad } from 'optional-lib';
    export default {
      rules: { 'no-bad': isBad, 'no-worse': isBad, 'no-other': isBad, 'no-unset': isBad },
      configs: { recommended: [
        { rules: { 'plugin/no-bad': [2], 'plugin/no-other': [0] } },
        { files: '.ts', rules: { 'plugin/no-worse': [2] } },
      ] },
    };\n`,
  },
  'optional-lib': {
    'package.json': JSON.stringify({ name: 'optional-lib', version: '1.0.0', type: 'module', exports: './index.js' }),
    'index.js': "export const isBad = (code) => code.includes('bad');\n",
  },
};

const lintCatalog = async (dir, rows) => {
  await write(
    join(dir, 'catalog', 'support', 'lint-configs.mjs'),
    `export default { 'preset/recommended': { from: 'config-lib@1.0.0/preset', config: 'recommended', peers: ['optional-lib@1.0.0'] } };\n`,
  );
  await write(
    join(dir, 'catalog', 'no-bad.mjs'),
    `export default { apis: [], lint: ${JSON.stringify(
      Object.fromEntries(
        Object.entries(rows).map(([name, row]) => [name, { eslint: '1.0.0', plugin: 'config-lib@1.0.0/preset', code: 'bad();', ...row }]),
      ),
    )} };\n`,
  );
  return ['--catalog', join(dir, 'catalog')];
};

const verdicts = (json) => json.rows.map(({ member, verdict }) => ({ member, verdict }));

test('a lint row loads its plugin from a subpath, with the peers the config table installs, and holds while the config agrees', async () => {
  await using dir = await mkdtempDisposable(join(tmpdir(), 'probe-'));
  await mkdir(join(dir.path, 'tmp'));
  const server = await registryOf(dir.path, lintPackages);
  try {
    const args = await lintCatalog(dir.path, {
      onEverywhere: { rule: 'plugin/no-bad', on: 'preset/recommended' },
      onInTypeScriptOnly: { rule: 'plugin/no-worse', on: 'preset/recommended' },
      failedAndOff: { rule: 'plugin/no-other', failed: 'it fails' },
      failedAndUnset: { rule: 'plugin/no-unset', failed: 'it fails' },
    });

    const { status, stderr, json } = await probe(dir.path, args, {
      env: isolatedNpm(dir.path, `http://127.0.0.1:${server.address().port}/`),
    });

    assert.equal(status, 0, JSON.stringify(json) + stderr);
    assert.deepEqual(verdicts(json), [
      { member: 'onEverywhere', verdict: 'holds' },
      { member: 'onInTypeScriptOnly', verdict: 'holds' },
      { member: 'failedAndOff', verdict: 'holds' },
      { member: 'failedAndUnset', verdict: 'holds' },
    ]);
  } finally {
    server.close();
  }
});

test('a row that says on, whose rule the published config does not turn on, is a config-mismatch', async () => {
  await using dir = await mkdtempDisposable(join(tmpdir(), 'probe-'));
  await mkdir(join(dir.path, 'tmp'));
  const server = await registryOf(dir.path, lintPackages);
  try {
    const args = await lintCatalog(dir.path, {
      setToOff: { rule: 'plugin/no-other', on: 'preset/recommended' },
      absent: { rule: 'plugin/no-unset', on: 'preset/recommended' },
    });

    const { status, json } = await probe(dir.path, args, {
      env: isolatedNpm(dir.path, `http://127.0.0.1:${server.address().port}/`),
    });

    assert.equal(status, 1);
    assert.deepEqual(verdicts(json), [
      { member: 'setToOff', verdict: 'config-mismatch' },
      { member: 'absent', verdict: 'config-mismatch' },
    ]);
    assert.ok(json.rows[0].other.includes('plugin/no-other is not on in preset/recommended of config-lib@1.0.0/preset'), json.rows[0].other);
  } finally {
    server.close();
  }
});

test('a row that says failed, off or unmeasured, whose rule a published config turns on, is a config-mismatch', async () => {
  await using dir = await mkdtempDisposable(join(tmpdir(), 'probe-'));
  await mkdir(join(dir.path, 'tmp'));
  const server = await registryOf(dir.path, lintPackages);
  try {
    const args = await lintCatalog(dir.path, {
      failed: { rule: 'plugin/no-bad', failed: 'it fails' },
      off: { rule: 'plugin/no-bad', off: 'it is off' },
      unmeasured: { rule: 'plugin/no-worse', unmeasured: 'nothing judged it' },
    });

    const { status, json } = await probe(dir.path, args, {
      env: isolatedNpm(dir.path, `http://127.0.0.1:${server.address().port}/`),
    });

    assert.equal(status, 1);
    assert.deepEqual(verdicts(json), [
      { member: 'failed', verdict: 'config-mismatch' },
      { member: 'off', verdict: 'config-mismatch' },
      { member: 'unmeasured', verdict: 'config-mismatch' },
    ]);
    assert.ok(json.rows[0].other.includes('plugin/no-bad is on in preset/recommended of config-lib@1.0.0/preset'), json.rows[0].other);
  } finally {
    server.close();
  }
});

test('a row whose on names a config the table does not have proves nothing', async () => {
  await using dir = await mkdtempDisposable(join(tmpdir(), 'probe-'));
  await mkdir(join(dir.path, 'tmp'));
  const server = await registryOf(dir.path, lintPackages);
  try {
    const args = await lintCatalog(dir.path, { unknown: { rule: 'plugin/no-bad', on: 'preset/other' } });

    const { status, json } = await probe(dir.path, args, {
      env: isolatedNpm(dir.path, `http://127.0.0.1:${server.address().port}/`),
    });

    assert.equal(status, 1);
    assert.deepEqual(verdicts(json), [{ member: 'unknown', verdict: 'probe-error' }]);
  } finally {
    server.close();
  }
});

test('a lint row whose catalog has no config table stops the run', async () => {
  await using dir = await mkdtempDisposable(join(tmpdir(), 'probe-'));
  await write(
    join(dir.path, 'catalog', 'no-bad.mjs'),
    `export default { apis: [], lint: { row: { eslint: '1.0.0', plugin: 'p@1.0.0', rule: 'p/r', on: 'x/y', code: 'c' } } };\n`,
  );

  const { status, stderr, json } = await probe(dir.path, ['--catalog', join(dir.path, 'catalog')]);

  assert.equal(status, 2);
  assert.ok(stderr.includes('lint-configs.mjs'), stderr);
  assert.equal(json, null);
});
