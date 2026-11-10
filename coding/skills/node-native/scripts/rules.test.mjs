import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdir, mkdtempDisposable, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('./rules.mjs', import.meta.url));

// Runs rules.mjs on findings, with a catalog of the given entries and a surface
// of the given APIs, all written into `dir`. Resolves to { code, stdout, stderr }.
async function rules(dir, { entries, apis = {}, findings }) {
  await mkdir(join(dir, 'catalog'));
  for (const [id, entry] of Object.entries(entries)) {
    await writeFile(join(dir, 'catalog', `${id}.mjs`), `export default ${JSON.stringify(entry)};\n`);
  }
  await writeFile(join(dir, 'surface.json'), JSON.stringify({ node: process.version, apis }));
  await writeFile(join(dir, 'findings.json'), JSON.stringify(findings));
  const args = [script, join(dir, 'findings.json'), '--catalog', join(dir, 'catalog'), '--surface', join(dir, 'surface.json')];
  return new Promise((resolve) => {
    execFile(process.execPath, args, (error, stdout, stderr) => resolve({ code: error ? error.code : 0, stdout, stderr }));
  });
}

const row = (fields) => ({ eslint: '10.12.0', plugin: 'eslint-plugin-x@1.0.0', code: 'bad();', ...fields });

test('a finding that names an idiom its entry does not have stops the run, so a typo never becomes a rule candidate', async () => {
  await using dir = await mkdtempDisposable(join(tmpdir(), 'rules-'));

  const { code, stdout, stderr } = await rules(dir.path, {
    entries: { 'group-by': { idioms: { reduceIntoObject: {} } } },
    findings: [{ file: 'a.ts', line: 3, entry: 'group-by', idiom: 'reduceIntoObjekt' }],
  });

  assert.equal(code, 2);
  assert.equal(stdout, '');
  assert.match(stderr, /reduceIntoObjekt/);
});

test('a finding that names a case row of an idiom stops the run, because a case is no idiom of its own', async () => {
  await using dir = await mkdtempDisposable(join(tmpdir(), 'rules-'));

  const { code, stderr } = await rules(dir.path, {
    entries: { 'structured-clone': { idioms: { jsonClone: {}, 'jsonClone: Date': {} } } },
    findings: [{ file: 'a.ts', line: 3, entry: 'structured-clone', idiom: 'jsonClone: Date' }],
  });

  assert.equal(code, 2);
  assert.match(stderr, /jsonClone: Date/);
});

test('a finding that names an entry the catalog does not have, or a dependency its entry does not replace, stops the run', async () => {
  await using dir = await mkdtempDisposable(join(tmpdir(), 'rules-'));

  const unknownEntry = await rules(dir.path, {
    entries: { 'style-text': { replaces: { 'chalk@5.0.0': {} } } },
    findings: [{ file: 'a.ts', line: 1, entry: 'style-txt', dependency: 'chalk' }],
  });
  await using other = await mkdtempDisposable(join(tmpdir(), 'rules-'));
  const unknownDependency = await rules(other.path, {
    entries: { 'style-text': { replaces: { 'chalk@5.0.0': {} } } },
    findings: [{ file: 'a.ts', line: 1, entry: 'style-text', dependency: 'kleur' }],
  });

  assert.deepEqual([unknownEntry.code, unknownDependency.code], [2, 2]);
  assert.match(unknownEntry.stderr, /style-txt/);
  assert.match(unknownDependency.stderr, /kleur/);
});

test('an api finding that the surface does not mark deprecated or legacy stops the run', async () => {
  await using dir = await mkdtempDisposable(join(tmpdir(), 'rules-'));

  const { code, stderr } = await rules(dir.path, {
    entries: {},
    apis: { 'url:url.parse': { stability: 0 }, 'url:URL': { stability: 2 } },
    findings: [{ file: 'a.ts', line: 1, api: 'url:URL' }],
  });

  assert.equal(code, 2);
  assert.match(stderr, /url:URL/);
});

test('an idiom with a rule on in a config is covered, even when another rule for it is unmeasured', async () => {
  await using dir = await mkdtempDisposable(join(tmpdir(), 'rules-'));

  const { code, stdout } = await rules(dir.path, {
    entries: {
      url: {
        idioms: { tryNewURL: {} },
        lint: {
          e18e: row({ plugin: '@e18e/eslint-plugin@0.8.1', rule: 'e18e/prefer-url-canparse', idiom: 'tryNewURL', on: 'modern-node/recommended' }),
          unicorn: row({ rule: 'unicorn/prefer-url-can-parse', idiom: 'tryNewURL', unmeasured: 'not judged' }),
        },
      },
    },
    findings: [{ file: 'a.ts', line: 7, entry: 'url', idiom: 'tryNewURL' }],
  });

  assert.equal(code, 0);
  const result = JSON.parse(stdout);
  assert.deepEqual(result.unmeasured, []);
  assert.deepEqual(result.covered, [
    {
      entry: 'url',
      idiom: 'tryNewURL',
      count: 1,
      sites: ['a.ts:7'],
      rules: [
        { plugin: '@e18e/eslint-plugin@0.8.1', rule: 'e18e/prefer-url-canparse', state: 'on', says: 'modern-node/recommended' },
        { plugin: 'eslint-plugin-x@1.0.0', rule: 'unicorn/prefer-url-can-parse', state: 'unmeasured', says: 'not judged' },
      ],
    },
  ]);
});

test('an idiom whose only rule is unmeasured is a candidate to measure, with the plugin and the rule', async () => {
  await using dir = await mkdtempDisposable(join(tmpdir(), 'rules-'));

  const { stdout } = await rules(dir.path, {
    entries: {
      'fs-access': {
        idioms: { existsCallback: {} },
        lint: { n: row({ plugin: 'eslint-plugin-n@18.5.0', rule: 'n/no-deprecated-api', idiom: 'existsCallback', unmeasured: 'ADR 0008 does not judge it' }) },
      },
    },
    findings: [{ file: 'b.js', line: 2, entry: 'fs-access', idiom: 'existsCallback' }],
  });

  const result = JSON.parse(stdout);
  assert.deepEqual(result.covered, []);
  assert.deepEqual(result.unmeasured, [
    {
      entry: 'fs-access',
      idiom: 'existsCallback',
      count: 1,
      sites: ['b.js:2'],
      rules: [{ plugin: 'eslint-plugin-n@18.5.0', rule: 'n/no-deprecated-api', state: 'unmeasured', says: 'ADR 0008 does not judge it' }],
    },
  ]);
});

test('an idiom that no row names is a candidate for an own rule, though a row of its entry names another idiom', async () => {
  await using dir = await mkdtempDisposable(join(tmpdir(), 'rules-'));

  const { stdout } = await rules(dir.path, {
    entries: {
      'group-by': {
        idioms: { reduceIntoObject: {}, pushIntoMap: {} },
        lint: { unicorn: row({ rule: 'unicorn/prefer-group-by', idiom: 'reduceIntoObject', on: 'modern-node/recommended' }) },
      },
    },
    findings: [{ file: 'c.ts', line: 9, entry: 'group-by', idiom: 'pushIntoMap' }],
  });

  const result = JSON.parse(stdout);
  assert.deepEqual(result.covered, []);
  assert.deepEqual(result.noRule, [{ entry: 'group-by', idiom: 'pushIntoMap', count: 1, sites: ['c.ts:9'], rules: [] }]);
});

test('an idiom whose rules failed or are off is judged, with each reason, and is no candidate', async () => {
  await using dir = await mkdtempDisposable(join(tmpdir(), 'rules-'));

  const { stdout } = await rules(dir.path, {
    entries: {
      'array-change-by-copy': {
        idioms: { spreadSort: {} },
        lint: {
          sort: row({ rule: 'unicorn/no-array-sort', idiom: 'spreadSort', off: 'the array was already a copy' }),
          other: row({ rule: 'x/prefer-sorted', idiom: 'spreadSort', failed: '3 of 4 hits on good code' }),
        },
      },
    },
    findings: [{ file: 'd.ts', line: 4, entry: 'array-change-by-copy', idiom: 'spreadSort' }],
  });

  const result = JSON.parse(stdout);
  assert.deepEqual([result.covered, result.unmeasured, result.noRule], [[], [], []]);
  assert.deepEqual(result.judged, [
    {
      entry: 'array-change-by-copy',
      idiom: 'spreadSort',
      count: 1,
      sites: ['d.ts:4'],
      rules: [
        { plugin: 'eslint-plugin-x@1.0.0', rule: 'unicorn/no-array-sort', state: 'off', says: 'the array was already a copy' },
        { plugin: 'eslint-plugin-x@1.0.0', rule: 'x/prefer-sorted', state: 'failed', says: '3 of 4 hits on good code' },
      ],
    },
  ]);
});

test('the sites of one subject are counted together, and an idiom of the same name in another entry is another subject', async () => {
  await using dir = await mkdtempDisposable(join(tmpdir(), 'rules-'));

  const { stdout } = await rules(dir.path, {
    entries: { first: { idioms: { loop: {} } }, second: { idioms: { loop: {} } } },
    findings: [
      { file: 'a.ts', line: 1, entry: 'first', idiom: 'loop' },
      { file: 'b.ts', line: 5, entry: 'second', idiom: 'loop' },
      { file: 'a.ts', line: 9, entry: 'first', idiom: 'loop' },
    ],
  });

  assert.deepEqual(JSON.parse(stdout).noRule, [
    { entry: 'first', idiom: 'loop', count: 2, sites: ['a.ts:1', 'a.ts:9'], rules: [] },
    { entry: 'second', idiom: 'loop', count: 1, sites: ['b.ts:5'], rules: [] },
  ]);
});

test('a dependency takes only the rows of the entry the finding names, and an api takes its rows from any entry', async () => {
  await using dir = await mkdtempDisposable(join(tmpdir(), 'rules-'));

  const { stdout } = await rules(dir.path, {
    entries: {
      'group-by': { replaces: { 'lodash@4.18.1': {} } },
      'structured-clone': {
        replaces: { 'lodash@4.18.1': {} },
        lint: { clone: row({ rule: 'unicorn/prefer-structured-clone', dependency: 'lodash', failed: 'the code wants JSON' }) },
      },
      buffer: {
        replaces: { 'buffer@6.0.3/index.js': {} },
        lint: { newBuffer: row({ rule: 'unicorn/no-new-buffer', api: 'buffer:new Buffer', on: 'modern-node/recommended' }) },
      },
    },
    apis: { 'buffer:new Buffer': { stability: 0 } },
    findings: [
      { file: 'e.ts', line: 1, entry: 'group-by', dependency: 'lodash' },
      { file: 'f.ts', line: 2, api: 'buffer:new Buffer' },
    ],
  });

  const result = JSON.parse(stdout);
  assert.deepEqual(result.skillKeeps, [{ entry: 'group-by', dependency: 'lodash', count: 1, sites: ['e.ts:1'], rules: [] }]);
  assert.deepEqual(result.covered, [
    {
      api: 'buffer:new Buffer',
      count: 1,
      sites: ['f.ts:2'],
      rules: [{ plugin: 'eslint-plugin-x@1.0.0', rule: 'unicorn/no-new-buffer', state: 'on', says: 'modern-node/recommended' }],
    },
  ]);
});

test('a dependency is never a rule candidate: with no rule, an unmeasured rule or a failed one the skill keeps it, and only a rule on covers it', async () => {
  await using dir = await mkdtempDisposable(join(tmpdir(), 'rules-'));
  const ban = (fields) => row({ plugin: 'eslint-plugin-depend@1.5.0', rule: 'depend/ban-dependencies', ...fields });

  const { stdout } = await rules(dir.path, {
    entries: {
      'server-close': { replaces: { '@godaddy/terminus@4.12.1': {} } },
      'style-text': {
        replaces: { 'chalk@5.0.0': {}, 'kleur@4.1.5': {} },
        lint: { chalk: ban({ dependency: 'chalk', failed: 'reads only the package name' }), kleur: ban({ dependency: 'kleur', unmeasured: 'not judged' }) },
      },
      fetch: { replaces: { 'node-fetch@3.3.2': {} }, lint: { nodeFetch: ban({ dependency: 'node-fetch', on: 'modern-node/recommended' }) } },
    },
    findings: [
      { file: 'a.ts', line: 1, entry: 'server-close', dependency: '@godaddy/terminus' },
      { file: 'b.ts', line: 2, entry: 'style-text', dependency: 'chalk' },
      { file: 'c.ts', line: 3, entry: 'style-text', dependency: 'kleur' },
      { file: 'd.ts', line: 4, entry: 'fetch', dependency: 'node-fetch' },
    ],
  });

  const result = JSON.parse(stdout);
  assert.deepEqual([result.noRule, result.unmeasured, result.judged], [[], [], []]);
  assert.deepEqual(
    result.skillKeeps.map(({ dependency, rules }) => [dependency, rules.map(({ state }) => state)]),
    [
      ['@godaddy/terminus', []],
      ['chalk', ['failed']],
      ['kleur', ['unmeasured']],
    ],
  );
  assert.deepEqual(
    result.covered.map(({ dependency }) => dependency),
    ['node-fetch'],
  );
});
