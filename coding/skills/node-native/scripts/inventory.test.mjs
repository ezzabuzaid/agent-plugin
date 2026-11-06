import assert from 'node:assert/strict';
import { execFile, spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdir, mkdtempDisposable, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const script = fileURLToPath(new URL('./inventory.mjs', import.meta.url));

// Captured from https://unpkg.com/module-replacements@3.4.0/manifests/ and
// trimmed to the entries these tests read (`engines` and `webFeatureId` left
// out). In 3.4.0 no package appears in two manifests and micro-utilities has
// no native replacement.
const E18E = {
  native: {
    mappings: {
      'array.prototype.at': { type: 'module', moduleName: 'array.prototype.at', replacements: ['Array.prototype.at'] },
      'has-symbols': { type: 'module', moduleName: 'has-symbols', replacements: ['has-symbols'] },
      'safe-buffer': { type: 'module', moduleName: 'safe-buffer', replacements: ['safe-buffer'] },
      inherits: { type: 'module', moduleName: 'inherits', replacements: ['extends', 'util.inherits'] },
    },
    replacements: {
      'Array.prototype.at': {
        id: 'Array.prototype.at',
        type: 'native',
        url: { type: 'mdn', id: 'Web/JavaScript/Reference/Global_Objects/Array/at' },
      },
      'has-symbols': {
        id: 'has-symbols',
        type: 'removal',
        description: 'Every modern environment has support for `Symbol`. You can just remove the check.',
        url: { type: 'mdn', id: 'Web/JavaScript/Reference/Global_Objects/Symbol' },
      },
      extends: {
        id: 'extends',
        type: 'native',
        description: 'ES6 classes `extends` syntax for prototype inheritance',
        url: { type: 'mdn', id: 'Web/JavaScript/Reference/Classes/extends' },
      },
      'util.inherits': {
        id: 'util.inherits',
        type: 'native',
        nodeFeatureId: { moduleName: 'node:util', exportName: 'inherits' },
        url: { type: 'node', id: 'api/util.html#utilinheritsconstructor-superconstructor' },
      },
      'safe-buffer': {
        id: 'safe-buffer',
        type: 'removal',
        description: 'All modern versions of Node have `Buffer.from` for safely creating buffers from arbitrary types.',
        url: { type: 'node', id: 'api/buffer.html' },
      },
    },
  },
  'micro-utilities': { mappings: {}, replacements: {} },
  preferred: {
    mappings: {
      chalk: { type: 'module', moduleName: 'chalk', replacements: ['util.styleText', 'picocolors', 'ansis'] },
      execa: { type: 'module', moduleName: 'execa', replacements: ['tinyexec', 'nanoexec', 'Bun.Shell'] },
      rimraf: { type: 'module', moduleName: 'rimraf', replacements: ['fs.promises.rm', 'fs.promises.rmdir', 'premove'] },
      clipboardy: { type: 'module', moduleName: 'clipboardy', replacements: ['tinyclip', 'ClipboardAPI'] },
      dotenv: { type: 'module', moduleName: 'dotenv', replacements: ['process.loadEnvFile', '--env-file'] },
      'lodash-es': { type: 'module', moduleName: 'lodash-es', replacements: ['lodash-underscore', 'es-toolkit'] },
      jquery: { type: 'module', moduleName: 'jquery', replacements: ['jquery'] },
    },
    replacements: {
      'lodash-underscore': {
        id: 'lodash-underscore',
        type: 'removal',
        url: { type: 'e18e', id: 'lodash-underscore' },
        description: 'lodash and Underscore can be replaced with native JavaScript APIs',
      },
      'es-toolkit': { id: 'es-toolkit', type: 'documented', replacementModule: 'es-toolkit' },
      jquery: {
        id: 'jquery',
        type: 'removal',
        url: { type: 'e18e', id: 'jquery' },
        description: 'jQuery can be replaced with native DOM and Web APIs',
      },
      'util.styleText': {
        id: 'util.styleText',
        type: 'native',
        nodeFeatureId: { moduleName: 'node:util', exportName: 'styleText' },
        url: { type: 'node', id: 'api/util.html#utilstyletextformat-text-options' },
      },
      picocolors: { id: 'picocolors', type: 'documented', replacementModule: 'picocolors' },
      ansis: { id: 'ansis', type: 'documented', replacementModule: 'ansis' },
      tinyexec: { id: 'tinyexec', type: 'documented', replacementModule: 'tinyexec' },
      nanoexec: { id: 'nanoexec', type: 'documented', replacementModule: 'nanoexec' },
      'Bun.Shell': { id: 'Bun.Shell', type: 'native', url: 'https://bun.com/docs/runtime/shell' },
      'fs.promises.rm': {
        id: 'fs.promises.rm',
        type: 'native',
        nodeFeatureId: { moduleName: 'node:fs/promises', exportName: 'rm' },
        url: { type: 'node', id: 'api/fs.html#fspromisesrmpath-options' },
      },
      'fs.promises.rmdir': {
        id: 'fs.promises.rmdir',
        type: 'native',
        nodeFeatureId: { moduleName: 'node:fs/promises', exportName: 'rmdir' },
        url: { type: 'node', id: 'api/fs.html#fspromisesrmdirpath-options' },
      },
      premove: { id: 'premove', type: 'documented', replacementModule: 'premove' },
      tinyclip: { id: 'tinyclip', type: 'documented', replacementModule: 'tinyclip' },
      ClipboardAPI: { id: 'ClipboardAPI', type: 'native', url: { type: 'mdn', id: 'Web/API/Clipboard_API' } },
      'process.loadEnvFile': {
        id: 'process.loadEnvFile',
        type: 'native',
        url: { type: 'node', id: 'api/process.html#processloadenvfilepath' },
      },
      '--env-file': { id: '--env-file', type: 'native', url: { type: 'node', id: 'api/cli.html#--env-filefile' } },
    },
  },
};

// git with none of the developer's config.
const gitEnv = (home) => ({ PATH: process.env.PATH, HOME: home, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1' });

async function write(path, content) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content);
}

async function repoWith(dir, files) {
  for (const [path, content] of Object.entries(files)) await write(join(dir, path), content);
  await promisify(execFile)('git', ['init', '-q', dir], { env: gitEnv(dir) });
}

async function inventory(repo, args, home) {
  const child = spawn(process.execPath, [script, repo, ...args], {
    env: gitEnv(home),
    signal: AbortSignal.timeout(60_000),
    killSignal: 'SIGKILL',
  });
  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (chunk) => (stdout += chunk));
  child.stderr.on('data', (chunk) => (stderr += chunk));
  const [status] = await once(child, 'close');
  return { status, stderr, json: stdout ? JSON.parse(stdout) : null };
}

async function listen(handler) {
  const server = createServer(handler);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return server;
}

// A run as a user makes it: a surface snapshot (on this Node unless a test
// says otherwise), a catalog directory, and e18e manifests served over HTTP.
async function scan(dir, repo, { node = process.version, apis = {}, entries = {}, manifests = E18E } = {}) {
  await write(join(dir, 'surface.json'), JSON.stringify({ node, apis }));
  await mkdir(join(dir, 'catalog'), { recursive: true });
  for (const [id, source] of Object.entries(entries)) await write(join(dir, 'catalog', `${id}.mjs`), source);
  const server = await listen((request, response) => {
    const body = manifests[request.url.match(/^\/manifests\/([\w-]+)\.json$/)?.[1]];
    if (!body) return response.writeHead(404).end();
    response.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(body));
  });
  try {
    const e18e = `http://127.0.0.1:${server.address().port}/manifests`;
    const args = ['--surface', join(dir, 'surface.json'), '--catalog', join(dir, 'catalog'), '--e18e', e18e];
    return await inventory(repo, args, dir);
  } finally {
    server.close();
  }
}

function workspace(json, path) {
  const found = json.workspaces.find((item) => item.path === path);
  assert.ok(found, `no workspace ${path} in ${json.workspaces.map((item) => item.path).join(', ')}`);
  return found;
}

test('a target that is not a git work tree is refused instead of reporting nothing to replace', async () => {
  await using dir = await mkdtempDisposable(join(tmpdir(), 'inventory-'));
  await write(join(dir.path, 'plain', 'package.json'), '{ "dependencies": { "chalk": "5.6.0" } }');

  const { status, stderr, json } = await scan(dir.path, join(dir.path, 'plain'));

  assert.equal(status, 2);
  assert.ok(stderr.includes(`${join(dir.path, 'plain')} is not a git work tree`), stderr);
  assert.equal(json, null);
});

test('a run on a Node other than the surface snapshot’s is refused', async () => {
  await using dir = await mkdtempDisposable(join(tmpdir(), 'inventory-'));
  await repoWith(join(dir.path, 'repo'), { 'package.json': '{}' });

  const { status, stderr, json } = await scan(dir.path, join(dir.path, 'repo'), { node: 'v0.0.1' });

  assert.equal(status, 2);
  assert.ok(stderr.includes(`is v0.0.1 but this is Node ${process.version}`), stderr);
  assert.equal(json, null);
});

test('e18e manifests that cannot be fetched stop the run and name the URL, whether the server errs or nothing answers', async () => {
  await using dir = await mkdtempDisposable(join(tmpdir(), 'inventory-'));
  await repoWith(join(dir.path, 'repo'), { 'package.json': '{}' });
  await write(join(dir.path, 'surface.json'), JSON.stringify({ node: process.version, apis: {} }));
  const args = (e18e) => ['--surface', join(dir.path, 'surface.json'), '--catalog', join(dir.path, 'catalog'), '--e18e', e18e];
  const closed = await listen(() => {});
  const closedPort = closed.address().port;
  closed.close();
  const erring = await listen((request, response) => response.writeHead(404).end());
  try {
    const base = `http://127.0.0.1:${erring.address().port}/manifests`;

    const errs = await inventory(join(dir.path, 'repo'), args(base), dir.path);
    const silent = await inventory(join(dir.path, 'repo'), args(`http://127.0.0.1:${closedPort}/manifests`), dir.path);

    assert.deepEqual([errs.status, errs.json], [2, null]);
    assert.ok(errs.stderr.includes(`${base}/native.json answered 404`), errs.stderr);
    assert.deepEqual([silent.status, silent.json], [2, null]);
    assert.ok(silent.stderr.includes(`http://127.0.0.1:${closedPort}/manifests/native.json could not be fetched`), silent.stderr);
  } finally {
    erring.close();
  }
});

const styleTextEntry = `export default { apis: ['util:util.styleText'], reviewedAt: '${process.version}', replaces: { 'chalk@5.6.0': {
  red: { native: () => 0, package: () => 0 },
  green: { native: () => 0, package: () => 0 },
} } };\n`;

test('a nested workspace dependency is listed with every import site and the names each one uses', async () => {
  await using dir = await mkdtempDisposable(join(tmpdir(), 'inventory-'));
  await repoWith(join(dir.path, 'repo'), {
    'package.json': '{ "private": true }',
    'packages/x/package.json': '{ "dependencies": { "chalk": "5.6.0" } }',
    'packages/x/src/default.ts': "import chalk from 'chalk';\nconsole.log(chalk.red('a'), chalk.bold.blue('b'));\n",
    'packages/x/src/named.ts': "import { Chalk } from 'chalk';\nnew Chalk();\n",
    'packages/x/src/both.ts': "import chalk, { Chalk } from 'chalk';\nnew Chalk(chalk.level);\n",
    'packages/x/src/namespace.ts': "import * as colors from 'chalk';\ncolors.default.red('x');\n",
    'packages/x/src/reexport.ts': "export { red } from 'chalk';\n",
    'packages/x/src/side-effect.ts': "import 'chalk';\n",
    'packages/x/src/dynamic.mjs': "export async function paint() {\n  const { default: chalk } = await import('chalk');\n  return chalk.green('x');\n}\n",
    'packages/x/src/required.cjs': "const { supportsColor } = require('chalk');\nmodule.exports = supportsColor;\n",
    'packages/x/src/types.ts': "import type { ChalkInstance } from 'chalk';\nexport type Paint = ChalkInstance;\n",
  });

  const { status, json } = await scan(dir.path, join(dir.path, 'repo'), { entries: { 'style-text': styleTextEntry } });

  assert.equal(status, 0);
  assert.deepEqual(workspace(json, '.').dependencies, []);
  const [chalk] = workspace(json, 'packages/x').dependencies;
  assert.deepEqual(
    { package: chalk.package, entries: chalk.entries, e18e: chalk.e18e },
    { package: 'chalk', entries: ['style-text'], e18e: ['util.styleText'] },
  );
  assert.deepEqual(
    chalk.sites.map(({ file, line, typeOnly, imports, members }) => ({ file, line, typeOnly, imports, members })),
    [
      { file: 'packages/x/src/both.ts', line: 1, typeOnly: false, imports: ['default', 'Chalk'], members: ['level'] },
      { file: 'packages/x/src/default.ts', line: 1, typeOnly: false, imports: ['default'], members: ['blue', 'bold', 'red'] },
      { file: 'packages/x/src/dynamic.mjs', line: 2, typeOnly: false, imports: ['default'], members: ['green'] },
      { file: 'packages/x/src/named.ts', line: 1, typeOnly: false, imports: ['Chalk'], members: [] },
      { file: 'packages/x/src/namespace.ts', line: 1, typeOnly: false, imports: ['default'], members: ['default', 'red'] },
      { file: 'packages/x/src/reexport.ts', line: 1, typeOnly: false, imports: ['red'], members: [] },
      { file: 'packages/x/src/required.cjs', line: 1, typeOnly: false, imports: ['supportsColor'], members: [] },
      { file: 'packages/x/src/side-effect.ts', line: 1, typeOnly: false, imports: [], members: [] },
      { file: 'packages/x/src/types.ts', line: 1, typeOnly: true, imports: ['ChalkInstance'], members: [] },
    ],
  );
});

test('only dependencies a workspace declares are listed, devDependencies included, never a transitive one', async () => {
  await using dir = await mkdtempDisposable(join(tmpdir(), 'inventory-'));
  await repoWith(join(dir.path, 'repo'), {
    '.gitignore': 'node_modules/\n',
    'package.json': '{ "devDependencies": { "chalk": "5.6.0" } }',
    'node_modules/rimraf/package.json': '{ "name": "rimraf", "version": "6.0.0" }',
    'src/clean.ts': "import chalk from 'chalk';\nimport { rimraf } from 'rimraf';\nawait rimraf(chalk.red('dist'));\n",
  });

  const { status, json } = await scan(dir.path, join(dir.path, 'repo'));

  assert.equal(status, 0);
  assert.deepEqual(
    workspace(json, '.').dependencies.map((dependency) => dependency.package),
    ['chalk'],
  );
});

test('a site splits the names it uses into those the catalog maps and those that keep the package', async () => {
  await using dir = await mkdtempDisposable(join(tmpdir(), 'inventory-'));
  const entry = (apis, spec, member) =>
    `export default { apis: ${JSON.stringify(apis)}, reviewedAt: '${process.version}', replaces: { '${spec}': {
      ${member}: { native: () => 0, package: () => 0 },
    } } };\n`;
  await repoWith(join(dir.path, 'repo'), {
    'package.json': '{ "dependencies": { "lodash-es": "4.17.21", "@scope/colors": "1.0.0" } }',
    'src/named.ts': "import { groupBy, flatten, debounce } from 'lodash-es';\nexport { groupBy, flatten, debounce };\n",
    'src/namespace.ts': "import * as _ from 'lodash-es';\n_.groupBy([], String);\n_.chunk([], 2);\n",
    'src/scoped.ts': "import { paint, fade } from '@scope/colors';\npaint(fade);\n",
  });

  const { status, json } = await scan(dir.path, join(dir.path, 'repo'), {
    entries: {
      'group-by': entry(['js:Object.groupBy'], 'lodash-es@4.17.21', 'groupBy'),
      flat: entry(['js:Array.prototype.flat'], 'lodash-es@4.17.21', 'flatten'),
      paint: entry(['util:util.styleText'], '@scope/colors@1.0.0', 'paint'),
    },
  });

  assert.equal(status, 0);
  assert.deepEqual(
    workspace(json, '.').dependencies.map(({ package: name, entries, sites }) => ({
      name,
      entries,
      sites: sites.map(({ file, mapped, unmapped }) => ({ file, mapped, unmapped })),
    })),
    [
      { name: '@scope/colors', entries: ['paint'], sites: [{ file: 'src/scoped.ts', mapped: ['paint'], unmapped: ['fade'] }] },
      {
        name: 'lodash-es',
        entries: ['flat', 'group-by'],
        sites: [
          { file: 'src/named.ts', mapped: ['flatten', 'groupBy'], unmapped: ['debounce'] },
          { file: 'src/namespace.ts', mapped: ['groupBy'], unmapped: ['chunk'] },
        ],
      },
    ],
  );
});

test('a name counts as mapped only through a mapping row, carries the gaps proven for it, and a subpath site names its specifier', async () => {
  await using dir = await mkdtempDisposable(join(tmpdir(), 'inventory-'));
  await repoWith(join(dir.path, 'repo'), {
    'package.json': '{ "dependencies": { "chalk": "6.0.1", "dayjs": "1.11.13", "dequal": "2.0.3" } }',
    'src/paint.ts': "import chalk from 'chalk';\nchalk.red('a');\nchalk.ansi256(208)('b');\nchalk.hex('#fff')('c');\n",
    'src/when.ts': "import dayjs from 'dayjs';\nexport const now = () => dayjs().valueOf();\n",
    'src/same.ts': "import { dequal } from 'dequal/lite';\nexport const same = dequal;\n",
  });

  const { status, json } = await scan(dir.path, join(dir.path, 'repo'), {
    entries: {
      'style-text': `export default { apis: ['util:util.styleText'], reviewedAt: '${process.version}', replaces: { 'chalk@6.0.1': {
        red: { native: () => 0, package: () => 0 },
        hex: { native: () => 0, package: () => 0 },
        'hex: background': { gap: 'no background hex', native: () => 0, package: () => 1 },
        ansi256: { gap: 'no 256-colour palette', native: () => 0, package: () => 1 },
      } } };\n`,
      temporal: `export default { apis: ['js:Temporal'], reviewedAt: '${process.version}', replaces: { 'dayjs@1.11.13': {
        default: { native: () => 0, package: () => 0 },
      } } };\n`,
      'deep-equal': `export default { apis: ['util:util.isDeepStrictEqual'], reviewedAt: '${process.version}', replaces: { 'dequal@2.0.3/lite': {
        dequal: { native: () => 0, package: () => 0 },
      } } };\n`,
    },
  });

  assert.equal(status, 0);
  assert.deepEqual(
    workspace(json, '.').dependencies.map(({ package: name, sites }) => ({
      name,
      sites: sites.map(({ specifier, mapped, unmapped, gaps }) => ({ specifier, mapped, unmapped, gaps })),
    })),
    [
      {
        name: 'chalk',
        sites: [
          {
            specifier: 'chalk',
            mapped: ['hex', 'red'],
            unmapped: ['ansi256'],
            gaps: { ansi256: ['no 256-colour palette'], hex: ['no background hex'] },
          },
        ],
      },
      { name: 'dayjs', sites: [{ specifier: 'dayjs', mapped: ['default'], unmapped: [], gaps: {} }] },
      { name: 'dequal', sites: [{ specifier: 'dequal/lite', mapped: ['dequal'], unmapped: [], gaps: {} }] },
    ],
  );
});

test('every name in a member chain counts as used, so a gap or an unmapped name behind a chained name still reaches the site', async () => {
  await using dir = await mkdtempDisposable(join(tmpdir(), 'inventory-'));
  await repoWith(join(dir.path, 'repo'), {
    'package.json': '{ "dependencies": { "chalk": "6.0.1" } }',
    'src/banner.ts':
      "import chalk from 'chalk';\nconsole.log(chalk.bgBlue.white.bold(' title '));\nconsole.log(chalk.red.ansi256(208)('warn'));\nconsole.log(chalk\n  .green\n  .underline('done'));\nconsole.log(chalk?.magenta?.dim('maybe'));\n",
  });

  const { status, json } = await scan(dir.path, join(dir.path, 'repo'), {
    entries: {
      'style-text': `export default { apis: ['util:util.styleText'], reviewedAt: '${process.version}', replaces: { 'chalk@6.0.1': {
        bgBlue: { native: () => 0, package: () => 0 },
        white: { native: () => 0, package: () => 0 },
        bold: { native: () => 0, package: () => 0 },
        red: { native: () => 0, package: () => 0 },
        green: { native: () => 0, package: () => 0 },
        magenta: { native: () => 0, package: () => 0 },
        ansi256: { gap: 'no 256-colour palette', native: () => 0, package: () => 1 },
      } } };\n`,
    },
  });

  assert.equal(status, 0);
  const [site] = workspace(json, '.').dependencies[0].sites;
  assert.deepEqual(
    { members: site.members, mapped: site.mapped, unmapped: site.unmapped, gaps: site.gaps },
    {
      members: ['ansi256', 'bgBlue', 'bold', 'dim', 'green', 'magenta', 'red', 'underline', 'white'],
      mapped: ['bgBlue', 'bold', 'green', 'magenta', 'red', 'white'],
      unmapped: ['ansi256', 'dim', 'underline'],
      gaps: { ansi256: ['no 256-colour palette'] },
    },
  );
});

test('a name whose rows say Node does better counts as mapped, and its site lists those improvements apart from its gaps', async () => {
  await using dir = await mkdtempDisposable(join(tmpdir(), 'inventory-'));
  await repoWith(join(dir.path, 'repo'), {
    'package.json': '{ "dependencies": { "continuation-local-storage": "3.2.1" } }',
    'src/context.ts':
      "import { createNamespace, getNamespace } from 'continuation-local-storage';\nexport const requests = createNamespace('requests');\nexport const current = () => getNamespace('requests');\n",
  });

  const { status, json } = await scan(dir.path, join(dir.path, 'repo'), {
    entries: {
      'async-local-storage': `export default { apis: ['async_hooks:AsyncLocalStorage'], reviewedAt: '${process.version}', replaces: { 'continuation-local-storage@3.2.1': {
        'createNamespace: await': { improves: 'AsyncLocalStorage keeps the context across await', native: () => 1, package: () => 0 },
        'createNamespace: bind emitter': { gap: 'no bindEmitter', native: () => 0, package: () => 1 },
        'getNamespace: after await': { improves: 'the store is still there after await', native: () => 1, package: () => 0 },
      } } };\n`,
    },
  });

  assert.equal(status, 0);
  assert.deepEqual(
    workspace(json, '.').dependencies.map(({ package: name, sites }) => ({
      name,
      sites: sites.map(({ mapped, unmapped, gaps, improvements }) => ({ mapped, unmapped, gaps, improvements })),
    })),
    [
      {
        name: 'continuation-local-storage',
        sites: [
          {
            mapped: ['createNamespace', 'getNamespace'],
            unmapped: [],
            gaps: { createNamespace: ['no bindEmitter'] },
            improvements: {
              createNamespace: ['AsyncLocalStorage keeps the context across await'],
              getNamespace: ['the store is still there after await'],
            },
          },
        ],
      },
    ],
  );
});

test('a workspace whose package.json is deleted from the working tree but still tracked is skipped, not fatal', async () => {
  await using dir = await mkdtempDisposable(join(tmpdir(), 'inventory-'));
  const repo = join(dir.path, 'repo');
  await repoWith(repo, {
    'package.json': '{ "dependencies": { "chalk": "6.0.1" } }',
    'tools/gone/package.json': '{ "dependencies": { "chalk": "6.0.1" } }',
    'tools/gone/index.ts': "import chalk from 'chalk';\nchalk.red('left behind');\n",
  });
  const git = (...args) =>
    promisify(execFile)('git', ['-C', repo, '-c', 'user.email=t@t', '-c', 'user.name=t', ...args], { env: gitEnv(dir.path) });
  await git('add', '--', 'package.json', 'tools/gone/package.json', 'tools/gone/index.ts');
  await git('commit', '-q', '--only', '-m', 'init', '--', 'package.json', 'tools/gone/package.json', 'tools/gone/index.ts');
  await rm(join(repo, 'tools', 'gone', 'package.json'));

  const { status, stderr, json } = await scan(dir.path, repo, { entries: { 'style-text': styleTextEntry } });

  assert.equal(status, 0, stderr);
  assert.deepEqual(json.workspaces.map((item) => item.path), ['.']);
  assert.deepEqual(
    workspace(json, '.').dependencies[0].sites.map((site) => site.file),
    ['tools/gone/index.ts'],
  );
});

test('a deleted but tracked tsconfig is skipped while the workspace keeps the signals of the ones present', async () => {
  await using dir = await mkdtempDisposable(join(tmpdir(), 'inventory-'));
  const repo = join(dir.path, 'repo');
  await repoWith(repo, {
    'package.json': '{}',
    'packages/y/package.json': '{}',
    'packages/y/tsconfig.json': '{ "compilerOptions": { "types": ["node"] } }',
    'packages/y/tsconfig.app.json': '{ "compilerOptions": { "lib": ["DOM", "ESNext"] } }',
  });
  const git = (...args) =>
    promisify(execFile)('git', ['-C', repo, '-c', 'user.email=t@t', '-c', 'user.name=t', ...args], { env: gitEnv(dir.path) });
  const tracked = ['package.json', 'packages/y/package.json', 'packages/y/tsconfig.json', 'packages/y/tsconfig.app.json'];
  await git('add', '--', ...tracked);
  await git('commit', '-q', '--only', '-m', 'init', '--', ...tracked);
  await rm(join(repo, 'packages', 'y', 'tsconfig.json'));

  const { status, stderr, json } = await scan(dir.path, repo);

  assert.equal(status, 0, stderr);
  assert.deepEqual(
    { runtime: workspace(json, 'packages/y').runtime, signals: workspace(json, 'packages/y').signals },
    { runtime: 'browser', signals: ['tsconfig.app.json lib has DOM'] },
  );
});

test('a package.json that exists but cannot be read stops the scan and names the file', async () => {
  await using dir = await mkdtempDisposable(join(tmpdir(), 'inventory-'));
  const repo = join(dir.path, 'repo');
  await repoWith(repo, { 'package.json': '{}', 'packages/broken/package.json': '{ "dependencies": ' });

  const { status, stderr, json } = await scan(dir.path, repo);

  assert.equal(status, 2);
  assert.ok(stderr.includes(`${join(repo, 'packages', 'broken', 'package.json')} is not valid JSON`), stderr);
  assert.equal(json, null);
});

test('files git ignores are not scanned, and a new file git would track is', async () => {
  await using dir = await mkdtempDisposable(join(tmpdir(), 'inventory-'));
  await repoWith(join(dir.path, 'repo'), {
    '.gitignore': 'node_modules/\ndist/\n',
    'package.json': '{ "dependencies": { "chalk": "5.6.0" } }',
    'node_modules/chalk/index.js': "import chalk from 'chalk';\nchalk.red('vendored');\n",
    'dist/index.js': "import chalk from 'chalk';\nchalk.red('built');\n",
    'src/new.ts': "import chalk from 'chalk';\nchalk.red('new');\n",
  });

  const { status, json } = await scan(dir.path, join(dir.path, 'repo'), { entries: { 'style-text': styleTextEntry } });

  assert.equal(status, 0);
  assert.deepEqual(
    workspace(json, '.').dependencies[0].sites.map((site) => site.file),
    ['src/new.ts'],
  );
});

test('calls to APIs Node deprecated or made legacy are found through the file’s own import of the module', async () => {
  await using dir = await mkdtempDisposable(join(tmpdir(), 'inventory-'));
  const urlGuidance = ['Deprecated: Use the WHATWG URL API instead.'];
  await repoWith(join(dir.path, 'repo'), {
    'package.json': '{}',
    'src/named.ts': "import { parse, format } from 'node:url';\nconst a = parse(x);\nconst b = JSON.parse(y);\nformat(a);\n",
    'src/aliased.ts': "import { parse as parseUrl } from 'url';\nparseUrl(x);\n",
    'src/namespace.ts': "import * as url from 'node:url';\nurl.parse(x);\n",
    'src/required.cjs': "const url = require('url');\nurl.parse(x);\n",
    'src/legacy-assert.ts': "import assert from 'node:assert';\nassert.equal(1, 1);\n",
    'src/strict-assert.ts': "import assert from 'node:assert/strict';\nassert.equal(1, 1);\n",
    'src/buffer.ts': 'const b = new Buffer(10);\n',
  });

  const { status, json } = await scan(dir.path, join(dir.path, 'repo'), {
    apis: {
      'url:url.parse': { kind: 'method', stability: 0, guidance: urlGuidance },
      'assert:assert.equal': { kind: 'method', stability: 3, guidance: ['Legacy: Use `assert.strictEqual()` instead.'] },
      'buffer:new Buffer': { kind: 'ctor', stability: 0, guidance: ['Deprecated: Use `Buffer.from(array)` instead.'] },
      'url:url.format': { kind: 'method', stability: 2 },
    },
  });

  assert.equal(status, 0);
  assert.deepEqual(
    workspace(json, '.').deprecated.map(({ file, line, api }) => `${file}:${line} ${api}`).sort(),
    [
      'src/aliased.ts:2 url:url.parse',
      'src/buffer.ts:1 buffer:new Buffer',
      'src/legacy-assert.ts:2 assert:assert.equal',
      'src/named.ts:2 url:url.parse',
      'src/namespace.ts:2 url:url.parse',
      'src/required.cjs:2 url:url.parse',
    ],
  );
  assert.deepEqual(
    workspace(json, '.').deprecated.find((hit) => hit.file === 'src/named.ts').guidance,
    urlGuidance,
  );
});

test('a catalog idiom’s seed lists where to look, by file and line', async () => {
  await using dir = await mkdtempDisposable(join(tmpdir(), 'inventory-'));
  await repoWith(join(dir.path, 'repo'), {
    'package.json': '{}',
    'src/deferred.ts':
      'export function deferred() {\n  let settle;\n  const promise = new Promise((resolve, reject) => {\n    settle = { resolve, reject };\n  });\n  return { promise, ...settle };\n}\n',
  });

  const { status, json } = await scan(dir.path, join(dir.path, 'repo'), {
    entries: {
      'with-resolvers': `export default { apis: ['js:Promise.withResolvers'], reviewedAt: '${process.version}', idioms: {
        deferred: { seed: 'new Promise\\\\(\\\\(resolve, reject\\\\) =>', native: () => 0, idiom: () => 0 },
      } };\n`,
    },
  });

  assert.equal(status, 0);
  assert.deepEqual(workspace(json, '.').seeds, [
    { file: 'src/deferred.ts', line: 3, entry: 'with-resolvers', idiom: 'deferred' },
  ]);
});

test('an e18e replacement counts only when Node ships it', async () => {
  await using dir = await mkdtempDisposable(join(tmpdir(), 'inventory-'));
  await repoWith(join(dir.path, 'repo'), {
    'package.json': JSON.stringify({
      dependencies: Object.fromEntries(
        [
          'array.prototype.at',
          'chalk',
          'clipboardy',
          'dotenv',
          'execa',
          'rimraf',
          'future-colors',
          'has-symbols',
          'safe-buffer',
          'jquery',
          'lodash-es',
          'inherits',
        ].map((name) => [
          name,
          '1.0.0',
        ]),
      ),
    }),
  });
  // Every nodeFeatureId in 3.4.0 loads on the LTS; this one names an export
  // Node does not have, as a replacement newer than the LTS would.
  const manifests = structuredClone(E18E);
  manifests.preferred.mappings['future-colors'] = {
    type: 'module',
    moduleName: 'future-colors',
    replacements: ['util.paintText'],
  };
  manifests.preferred.replacements['util.paintText'] = {
    id: 'util.paintText',
    type: 'native',
    nodeFeatureId: { moduleName: 'node:util', exportName: 'paintText' },
  };

  const { status, json } = await scan(dir.path, join(dir.path, 'repo'), {
    apis: {
      'cli:--env-file': { kind: 'flag' },
      'process:process.loadEnvFile': { kind: 'method' },
      'util:util.inherits': { kind: 'method', stability: 3, guidance: ['Legacy: Use ES2015 class syntax and `extends` keyword instead.'] },
    },
    manifests,
  });

  assert.equal(status, 0);
  assert.deepEqual(
    workspace(json, '.').dependencies.map(({ package: name, e18e, removal }) => ({ name, e18e, ...(removal && { removal }) })),
    [
      { name: 'array.prototype.at', e18e: ['Array.prototype.at'] },
      { name: 'chalk', e18e: ['util.styleText'] },
      { name: 'dotenv', e18e: ['--env-file', 'process.loadEnvFile'] },
      {
        name: 'has-symbols',
        e18e: [],
        removal: 'Every modern environment has support for `Symbol`. You can just remove the check.',
      },
      { name: 'inherits', e18e: ['extends'] },
      { name: 'rimraf', e18e: ['fs.promises.rm', 'fs.promises.rmdir'] },
      {
        name: 'safe-buffer',
        e18e: [],
        removal: 'All modern versions of Node have `Buffer.from` for safely creating buffers from arbitrary types.',
      },
    ],
  );
});

test('a workspace is browser when it says so, and node when it also carries node types', async () => {
  await using dir = await mkdtempDisposable(join(tmpdir(), 'inventory-'));
  await repoWith(join(dir.path, 'repo'), {
    'package.json': '{}',
    'packages/field/package.json': '{ "browser": "./browser.js" }',
    'packages/dom/package.json': '{}',
    'packages/dom/tsconfig.app.json': '{ "compilerOptions": { "lib": ["DOM", "ESNext"] } }',
    'packages/mixed/package.json': '{}',
    'packages/mixed/tsconfig.app.json': '{ "compilerOptions": { "lib": ["DOM", "ESNext"] } }',
    'packages/mixed/tsconfig.node.json': '{ "compilerOptions": { "types": ["node"] } }',
  });

  const { status, json } = await scan(dir.path, join(dir.path, 'repo'));

  assert.equal(status, 0);
  assert.deepEqual(
    Object.fromEntries(json.workspaces.map(({ path, runtime }) => [path, runtime])),
    { '.': 'node', 'packages/dom': 'browser', 'packages/field': 'browser', 'packages/mixed': 'node' },
  );
});

async function contents(directory) {
  const files = {};
  for (const entry of await readdir(directory, { recursive: true, withFileTypes: true })) {
    if (entry.isFile()) files[join(entry.parentPath, entry.name)] = await readFile(join(entry.parentPath, entry.name), 'utf8');
  }
  return files;
}

test('a scan writes nothing into the repository, lists files in path order, and gives the same answer twice', async () => {
  await using dir = await mkdtempDisposable(join(tmpdir(), 'inventory-'));
  const repo = join(dir.path, 'repo');
  await repoWith(repo, {
    'package.json': '{ "dependencies": { "chalk": "5.6.0" } }',
    'src/a.ts': "import chalk from 'chalk';\nchalk.red('committed');\n",
    'src/b.ts': "import chalk from 'chalk';\nchalk.green('untracked');\n",
  });
  // git lists untracked files before committed ones, so a committed a.ts and
  // an untracked b.ts come out of git as b, a.
  const git = (...args) =>
    promisify(execFile)('git', ['-C', repo, '-c', 'user.email=t@t', '-c', 'user.name=t', ...args], { env: gitEnv(dir.path) });
  await git('add', '--', 'package.json', 'src/a.ts');
  await git('commit', '-q', '--only', '-m', 'init', '--', 'package.json', 'src/a.ts');
  const before = await contents(repo);

  const first = await scan(dir.path, repo, { entries: { 'style-text': styleTextEntry } });
  const second = await scan(dir.path, repo, { entries: { 'style-text': styleTextEntry } });

  assert.equal(first.status, 0);
  assert.deepEqual(
    workspace(first.json, '.').dependencies[0].sites.map((site) => site.file),
    ['src/a.ts', 'src/b.ts'],
  );
  assert.deepEqual(second.json.workspaces, first.json.workspaces);
  assert.deepEqual(await contents(repo), before);
});
