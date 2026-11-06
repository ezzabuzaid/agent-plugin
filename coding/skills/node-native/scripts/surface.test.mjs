import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdir, mkdtempDisposable, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('./surface.mjs', import.meta.url));

async function surface(dir, args = [], { docs = join(dir, 'all.json') } = {}) {
  const child = spawn(
    process.execPath,
    [
      script,
      '--index',
      join(dir, 'index.json'),
      '--docs',
      docs,
      '--surface',
      join(dir, 'surface.json'),
      '--catalog',
      join(dir, 'catalog'),
      ...args,
    ],
    { env: { PATH: process.env.PATH }, signal: AbortSignal.timeout(60_000), killSignal: 'SIGKILL' },
  );
  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (chunk) => (stdout += chunk));
  child.stderr.on('data', (chunk) => (stderr += chunk));
  const [status] = await once(child, 'close');
  return { status, stderr, json: stdout ? JSON.parse(stdout) : null };
}

const writeJson = (path, value) => writeFile(path, JSON.stringify(value));

async function writeEntry(dir, id, entry) {
  await mkdir(join(dir, 'catalog'), { recursive: true });
  await writeFile(join(dir, 'catalog', `${id}.mjs`), `export default ${JSON.stringify(entry)};\n`);
}

const utilDocs = (...methods) => ({
  modules: [{ textRaw: 'Util', name: 'util', type: 'module', source: 'doc/api/util.md', stability: 2, methods }],
});

// Captured from https://nodejs.org/docs/v26.13.0/api/all.json, without `desc`,
// `signatures` and `pr-url`, which the surface does not read.
const styleText = {
  textRaw: '`util.styleText(format, text[, options])`',
  name: 'styleText',
  type: 'method',
  meta: {
    added: ['v21.7.0', 'v20.12.0'],
    changes: [
      { version: 'v26.1.0', description: 'Add support for hexadecimal colors.' },
      { version: ['v24.2.0', 'v22.17.0'], description: "Added the `'none'` format as a non-op format." },
      { version: ['v23.5.0', 'v22.13.0'], description: 'styleText is now stable.' },
    ],
  },
};

test('a build on a Node that is not the LTS exits 2 and leaves the snapshot as it was', async () => {
  await using dir = await mkdtempDisposable(join(tmpdir(), 'surface-'));
  await writeJson(join(dir.path, 'index.json'), [{ version: process.version, lts: 'Fixture' }]);
  await writeJson(join(dir.path, 'all.json'), utilDocs(styleText));
  await surface(dir.path, ['--write']);
  const before = await readFile(join(dir.path, 'surface.json'), 'utf8');
  await writeJson(join(dir.path, 'index.json'), [
    { version: 'v0.0.1', lts: 'Elsewhere' },
    { version: process.version, lts: false },
  ]);

  const { status, stderr, json } = await surface(dir.path, ['--write']);

  assert.equal(status, 2);
  assert.ok(stderr.includes(`the LTS is v0.0.1 but this is Node ${process.version}`), stderr);
  assert.equal(json, null);
  assert.equal(await readFile(join(dir.path, 'surface.json'), 'utf8'), before);
});

test('docs that answer an HTTP error exit 2 naming the URL and write no snapshot', async () => {
  await using dir = await mkdtempDisposable(join(tmpdir(), 'surface-'));
  await writeJson(join(dir.path, 'index.json'), [{ version: process.version, lts: 'Fixture' }]);
  const server = createServer((request, response) => response.writeHead(404).end());
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    const docs = `http://127.0.0.1:${server.address().port}/docs/${process.version}/api/all.json`;

    const { status, stderr } = await surface(dir.path, ['--write'], { docs });

    assert.equal(status, 2);
    assert.ok(stderr.includes(`${docs} answered 404`), stderr);
    await assert.rejects(readFile(join(dir.path, 'surface.json')), { code: 'ENOENT' });
  } finally {
    server.close();
  }
});

test('a catalog api the surface does not have is reported as dangling and counts as drift', async () => {
  await using dir = await mkdtempDisposable(join(tmpdir(), 'surface-'));
  await writeJson(join(dir.path, 'index.json'), [{ version: process.version, lts: 'Fixture' }]);
  await writeJson(join(dir.path, 'all.json'), utilDocs(styleText));
  await surface(dir.path, ['--write']);
  await writeEntry(dir.path, 'style-text', {
    apis: ['util:util.styleText', 'util:util.colorize'],
    reviewedAt: process.version,
  });

  const { status, json } = await surface(dir.path);

  assert.equal(status, 1);
  assert.deepEqual(json.dangling, [{ entry: 'style-text', api: 'util:util.colorize' }]);
  assert.deepEqual(json.new, []);
});

test('only doc changes that reached the LTS line after the entry was reviewed are listed for re-review', async () => {
  await using dir = await mkdtempDisposable(join(tmpdir(), 'surface-'));
  const major = Number(process.version.slice(1).split('.')[0]);
  await writeJson(join(dir.path, 'index.json'), [{ version: process.version, lts: 'Fixture' }]);
  await writeJson(
    join(dir.path, 'all.json'),
    utilDocs({
      ...styleText,
      meta: {
        added: ['v20.12.0'],
        changes: [
          { version: `v${major}.2.0`, description: 'after review, this line' },
          { version: [`v${major}.3.0`, `v${major - 2}.20.0`], description: 'after review, backported' },
          { version: `v${major}.1.0`, description: 'in the reviewed release' },
          { version: `v${major}.0.0`, description: 'before review, this line' },
          { version: [`v${major - 2}.10.0`, `v${major - 4}.30.0`], description: 'older majors only' },
          { version: `v${major + 1}.0.0`, description: 'newer major only' },
        ],
      },
    }),
  );
  await surface(dir.path, ['--write']);
  await writeEntry(dir.path, 'reviewed-this-line', { apis: ['util:util.styleText'], reviewedAt: `v${major}.1.0` });
  await writeEntry(dir.path, 'reviewed-last-line', { apis: ['util:util.styleText'], reviewedAt: `v${major - 1}.5.0` });

  const { status, json } = await surface(dir.path);

  assert.equal(status, 1);
  const listed = (entry) =>
    json.changedSinceReview.filter((item) => item.entry === entry).map(({ version, change }) => [version, change]);
  assert.deepEqual(listed('reviewed-this-line'), [
    [`v${major}.2.0`, 'after review, this line'],
    [`v${major}.3.0`, 'after review, backported'],
  ]);
  assert.deepEqual(listed('reviewed-last-line'), [
    [`v${major}.2.0`, 'after review, this line'],
    [`v${major}.3.0`, 'after review, backported'],
    [`v${major}.1.0`, 'in the reviewed release'],
    [`v${major}.0.0`, 'before review, this line'],
    [`v${major}.0.0`, 'older majors only'],
  ]);
});

test('docs that add one API over the snapshot report exactly that API as new', async () => {
  await using dir = await mkdtempDisposable(join(tmpdir(), 'surface-'));
  await writeJson(join(dir.path, 'index.json'), [{ version: process.version, lts: 'Fixture' }]);
  await writeJson(join(dir.path, 'all.json'), utilDocs(styleText));
  await surface(dir.path, ['--write']);
  await writeJson(
    join(dir.path, 'all.json'),
    utilDocs(styleText, { textRaw: '`util.parseArgs([config])`', type: 'method', name: 'parseArgs' }),
  );

  const { status, json } = await surface(dir.path);

  assert.equal(status, 1);
  assert.deepEqual(json.new, ['util:util.parseArgs']);
  assert.deepEqual(json.removed, []);
});

test('docs that drop an API the snapshot has report exactly that API as removed', async () => {
  await using dir = await mkdtempDisposable(join(tmpdir(), 'surface-'));
  await writeJson(join(dir.path, 'index.json'), [{ version: process.version, lts: 'Fixture' }]);
  await writeJson(
    join(dir.path, 'all.json'),
    utilDocs(styleText, { textRaw: '`util.parseArgs([config])`', type: 'method', name: 'parseArgs' }),
  );
  await surface(dir.path, ['--write']);
  await writeJson(join(dir.path, 'all.json'), utilDocs(styleText));

  const { status, json } = await surface(dir.path);

  assert.equal(status, 1);
  assert.deepEqual(json.removed, ['util:util.parseArgs']);
  assert.deepEqual(json.new, []);
});

test('a build that matches the snapshot and the catalog exits 0 with nothing to review', async () => {
  await using dir = await mkdtempDisposable(join(tmpdir(), 'surface-'));
  await writeJson(join(dir.path, 'index.json'), [{ version: process.version, lts: 'Fixture' }]);
  await writeJson(join(dir.path, 'all.json'), utilDocs(styleText));
  await writeEntry(dir.path, 'style-text', { apis: ['util:util.styleText'], reviewedAt: process.version });
  await surface(dir.path, ['--write']);

  const { status, json } = await surface(dir.path);

  assert.equal(status, 0);
  assert.deepEqual(json, {
    lts: process.version,
    snapshot: process.version,
    new: [],
    removed: [],
    changedSinceReview: [],
    dangling: [],
  });
});

test('--check compares only the LTS with the snapshot and never reads the docs', async () => {
  await using dir = await mkdtempDisposable(join(tmpdir(), 'surface-'));
  await writeJson(join(dir.path, 'index.json'), [{ version: process.version, lts: 'Fixture' }]);
  await writeJson(join(dir.path, 'all.json'), utilDocs(styleText));
  await surface(dir.path, ['--write']);
  const missingDocs = join(dir.path, 'missing-all.json');

  const current = await surface(dir.path, ['--check'], { docs: missingDocs });
  await writeJson(join(dir.path, 'index.json'), [{ version: 'v999.0.0', lts: 'Future' }]);
  const behind = await surface(dir.path, ['--check'], { docs: missingDocs });

  assert.deepEqual([current.status, current.json], [0, { lts: process.version, snapshot: process.version }]);
  assert.deepEqual([behind.status, behind.json], [1, { lts: 'v999.0.0', snapshot: process.version }]);
});

test('--write records every documented kind and the running Node, one api per line in id order', async () => {
  await using dir = await mkdtempDisposable(join(tmpdir(), 'surface-'));
  await writeJson(join(dir.path, 'index.json'), [{ version: process.version, lts: 'Fixture' }]);
  const bufferWarning =
    'Calling this constructor emits a deprecation warning when run from code outside the `node_modules` directory.';
  await writeJson(join(dir.path, 'all.json'), {
    modules: [
      {
        textRaw: 'Util',
        name: 'util',
        type: 'module',
        stability: 2,
        stabilityText: 'Stable',
        source: 'doc/api/util.md',
        methods: [styleText],
      },
      {
        textRaw: 'Buffer',
        name: 'buffer',
        type: 'module',
        stability: 2,
        stabilityText: 'Stable',
        source: 'doc/api/buffer.md',
        classes: [
          {
            textRaw: 'Class: `Buffer`',
            name: 'Buffer',
            type: 'class',
            classMethods: [
              {
                textRaw: 'Static method: `Buffer.alloc(size[, fill[, encoding]])`',
                name: 'alloc',
                type: 'classMethod',
                meta: { added: ['v5.10.0'], changes: [] },
              },
            ],
            signatures: [
              {
                textRaw: '`new Buffer(array)`',
                name: 'Buffer',
                type: 'ctor',
                meta: { changes: [{ version: 'v10.0.0', description: bufferWarning }], deprecated: ['v6.0.0'] },
                stability: 0,
                stabilityText: 'Deprecated: Use `Buffer.from(array)` instead.',
              },
              {
                textRaw: '`new Buffer(arrayBuffer[, byteOffset[, length]])`',
                name: 'Buffer',
                type: 'ctor',
                meta: {
                  added: ['v3.0.0'],
                  changes: [
                    { version: 'v10.0.0', description: bufferWarning },
                    { version: 'v6.0.0', description: 'The `byteOffset` and `length` parameters are supported now.' },
                  ],
                  deprecated: ['v6.0.0'],
                },
                stability: 0,
                stabilityText: 'Deprecated: Use `Buffer.from(arrayBuffer[, byteOffset[, length]])` instead.',
              },
            ],
            events: [{ textRaw: "Event: `'close'`", name: 'close', type: 'event', meta: { added: ['v0.7.7'], changes: [] } }],
          },
        ],
      },
      {
        textRaw: 'Crypto',
        name: 'crypto',
        type: 'module',
        stability: 2,
        stabilityText: 'Stable',
        source: 'doc/api/crypto.md',
        classes: [
          {
            textRaw: 'Class: `Certificate`',
            name: 'Certificate',
            type: 'class',
            meta: { added: ['v0.11.8'], changes: [] },
            modules: [
              {
                textRaw: 'Legacy API',
                name: 'legacy_api',
                type: 'module',
                stability: 0,
                stabilityText: 'Deprecated',
                methods: [
                  {
                    textRaw: '`certificate.verifySpkac(spkac[, encoding])`',
                    name: 'verifySpkac',
                    type: 'method',
                    meta: { added: ['v0.11.8'], changes: [] },
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
    miscs: [
      {
        textRaw: 'Command-line API',
        name: 'Command-line API',
        type: 'misc',
        source: 'doc/api/cli.md',
        miscs: [
          {
            textRaw: 'Options',
            name: 'options',
            type: 'misc',
            stability: 2,
            stabilityText: 'Stable',
            modules: [
              {
                textRaw: '`--env-file=file`',
                name: '`--env-file=file`',
                type: 'module',
                meta: {
                  added: ['v20.6.0'],
                  changes: [
                    { version: ['v24.10.0', 'v22.21.0'], description: 'The `--env-file` flag is no longer experimental.' },
                  ],
                },
              },
              {
                textRaw: '`-r`, `--require module`',
                name: '`-r`,_`--require_module`',
                type: 'module',
                meta: { added: ['v1.6.0'], changes: [] },
              },
            ],
          },
          {
            textRaw: 'Environment variables',
            name: 'environment_variables',
            type: 'misc',
            modules: [
              {
                textRaw: '`NODE_USE_ENV_PROXY=1`',
                name: '`node_use_env_proxy=1`',
                type: 'module',
                meta: { added: ['v24.0.0', 'v22.21.0'], changes: [] },
                stability: 1.1,
                stabilityText: 'Active Development',
              },
            ],
          },
        ],
      },
      {
        textRaw: 'Global objects',
        name: 'Global objects',
        type: 'misc',
        stability: 2,
        stabilityText: 'Stable',
        source: 'doc/api/globals.md',
        miscs: [
          {
            textRaw: '`fetch`',
            name: '`fetch`',
            type: 'misc',
            meta: { added: ['v17.5.0', 'v16.15.0'], changes: [{ version: ['v21.0.0'], description: 'No longer experimental.' }] },
          },
        ],
      },
    ],
  });

  const { status } = await surface(dir.path, ['--write']);
  const text = await readFile(join(dir.path, 'surface.json'), 'utf8');
  const snapshot = JSON.parse(text);

  assert.equal(status, 1);
  assert.equal(snapshot.node, process.version);
  assert.equal(snapshot.v8, process.versions.v8);
  assert.deepEqual(snapshot.apis['util:util.styleText'], {
    kind: 'method',
    since: 'v20.12.0',
    stability: 2,
    changes: [
      { v: ['v26.1.0'], d: 'Add support for hexadecimal colors.' },
      { v: ['v24.2.0', 'v22.17.0'], d: "Added the `'none'` format as a non-op format." },
      { v: ['v23.5.0', 'v22.13.0'], d: 'styleText is now stable.' },
    ],
  });
  assert.deepEqual(snapshot.apis['buffer:new Buffer'], {
    kind: 'ctor',
    since: 'v3.0.0',
    stability: 0,
    guidance: [
      'Deprecated: Use `Buffer.from(array)` instead.',
      'Deprecated: Use `Buffer.from(arrayBuffer[, byteOffset[, length]])` instead.',
    ],
    changes: [
      { v: ['v10.0.0'], d: bufferWarning },
      { v: ['v6.0.0'], d: 'The `byteOffset` and `length` parameters are supported now.' },
    ],
  });
  assert.deepEqual(snapshot.apis['buffer:Buffer.alloc'], { kind: 'classMethod', since: 'v5.10.0', stability: 2 });
  assert.deepEqual(snapshot.apis['crypto:certificate.verifySpkac'], {
    kind: 'method',
    since: 'v0.11.8',
    stability: 0,
    guidance: ['Deprecated'],
  });
  assert.deepEqual(snapshot.apis['cli:--env-file'], {
    kind: 'flag',
    since: 'v20.6.0',
    stability: 2,
    changes: [{ v: ['v24.10.0', 'v22.21.0'], d: 'The `--env-file` flag is no longer experimental.' }],
  });
  assert.deepEqual(snapshot.apis['cli:--require'], { kind: 'flag', since: 'v1.6.0', stability: 2 });
  assert.deepEqual(snapshot.apis['cli:NODE_USE_ENV_PROXY'], { kind: 'env', since: 'v22.21.0', stability: 1.1 });
  assert.deepEqual(snapshot.apis['globals:fetch'], {
    kind: 'global',
    since: 'v16.15.0',
    stability: 2,
    changes: [{ v: ['v21.0.0'], d: 'No longer experimental.' }],
  });
  for (const id of [
    'js:Map.prototype.get',
    'js:Math.max',
    'js:Intl.DateTimeFormat.prototype.format',
    'js:Array.prototype[Symbol.iterator]',
    'js:import.meta.dirname',
    'node:module.builtinModules',
    'node:fs/promises.readFile',
  ]) {
    assert.deepEqual(snapshot.apis[id], { kind: 'runtime' }, id);
  }
  for (const name of [
    'class-extends',
    'using',
    'await-using',
    'regexp-modifiers',
    'regexp-duplicate-named-groups',
    'regexp-v-flag',
    'import-attributes',
  ]) {
    assert.deepEqual(snapshot.apis[`js:syntax:${name}`], { kind: 'syntax' }, name);
  }
  assert.deepEqual(
    Object.keys(snapshot.apis).filter((id) => id.startsWith('buffer:')),
    ['buffer:Buffer', 'buffer:Buffer.alloc', 'buffer:new Buffer'],
  );
  assert.deepEqual(
    Object.keys(snapshot.apis).filter((id) => id.includes('[') && !id.includes('[Symbol.')),
    [],
  );
  assert.deepEqual(
    Object.keys(snapshot.apis).filter((id) => id.startsWith('node:_')),
    [],
  );
  const apiLines = text.split('\n').filter((line) => line.startsWith('    "'));
  const lineIds = apiLines.map((line) => JSON.parse(line.slice(0, line.indexOf('": {') + 1).trim()));
  assert.deepEqual(lineIds, Object.keys(snapshot.apis));
  assert.deepEqual(lineIds, lineIds.toSorted());
});
