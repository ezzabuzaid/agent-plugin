// Finding the package.json that governs a file, a directory or a dependency.
import { readFileSync } from 'node:fs';
import { mkdir, symlink } from 'node:fs/promises';
import { createRequire, findPackageJSON } from 'node:module';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { inScratch } from './support/scratch.mjs';

const tree = {
  'package.json': JSON.stringify({ name: 'root', version: '1.0.0' }),
  'app/package.json': JSON.stringify({ name: 'app', version: '2.0.0' }),
  'app/src/index.js': '',
  'app/.nvmrc': '26\n',
  'app/node_modules/dep/package.json': JSON.stringify({ name: 'dep', version: '3.0.0', main: 'index.js' }),
  'app/node_modules/dep/index.js': '',
  'app/node_modules/sealed/package.json': JSON.stringify({ name: 'sealed', version: '4.0.0', exports: { '.': './index.js' } }),
  'app/node_modules/sealed/index.js': '',
};
// Runs `find(dir)` in the tree and gives paths relative to its root.
const found = (find) => inScratch(tree, async (dir) => (await find(dir))?.replace(dir, '<root>'));
const src = (dir) => join(dir, 'app', 'src');
// A directory URL needs its trailing slash: without one it names a file.
const directory = (dir) => pathToFileURL(`${dir}/`);
const read = (path) => JSON.parse(readFileSync(path, 'utf8'));
// An app whose node_modules/linked is a symlink to a sibling folder, as a
// workspace package manager links one; `find(dir)` runs in it.
const workspace = {
  'app/package.json': JSON.stringify({ name: 'app', version: '2.0.0' }),
  'app/src/index.js': '',
  'packages/linked/package.json': JSON.stringify({ name: 'linked', version: '5.0.0', main: 'index.js' }),
  'packages/linked/index.js': '',
};
const inWorkspace = (find) =>
  inScratch(workspace, async (dir) => {
    await mkdir(join(dir, 'app', 'node_modules'), { recursive: true });
    await symlink(join(dir, 'packages', 'linked'), join(dir, 'app', 'node_modules', 'linked'));
    return (await find(dir))?.replace(dir, '<root>');
  });

export default {
  apis: ['module:module.findPackageJSON'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'package-up@5.0.0': {
      packageUp: {
        native: () => found((dir) => findPackageJSON(directory(src(dir)))),
        package: ({ packageUp }) => found((dir) => packageUp({ cwd: src(dir) })),
      },
      'packageUp: directory path': {
        gap: 'a directory URL without a trailing slash names a file, so the search starts one level up',
        native: () => found((dir) => findPackageJSON(pathToFileURL(join(dir, 'app')))),
        package: ({ packageUp }) => found((dir) => packageUp({ cwd: join(dir, 'app') })),
      },
      'packageUp: missing start': {
        gap: 'resolves its argument first: a start path that does not exist throws ERR_MODULE_NOT_FOUND',
        native: () =>
          found((dir) => {
            try {
              return findPackageJSON(pathToFileURL(join(src(dir), 'missing.js')));
            } catch (error) {
              return `threw ${error.code}`;
            }
          }),
        package: ({ packageUp }) => found((dir) => packageUp({ cwd: join(src(dir), 'missing') })),
      },
      packageUpSync: {
        native: () => found((dir) => findPackageJSON(pathToFileURL(join(src(dir), 'index.js')))),
        package: ({ packageUpSync }) => found((dir) => packageUpSync({ cwd: src(dir) })),
      },
    },
    'read-package-up@12.0.0': {
      readPackageUp: {
        native: () =>
          found(async (dir) => {
            const path = findPackageJSON(directory(src(dir)));
            const { name, version } = read(path);
            return JSON.stringify({ name, version, path });
          }),
        package: ({ readPackageUp }) =>
          found(async (dir) => {
            const { packageJson, path } = await readPackageUp({ cwd: src(dir) });
            return JSON.stringify({ name: packageJson.name, version: packageJson.version, path });
          }),
      },
      'readPackageUp: normalize': {
        gap: 'gives only the path: reading it does not normalise the manifest (readme, _id, a parsed repository)',
        native: () => found(async (dir) => JSON.stringify(read(findPackageJSON(directory(src(dir)))))),
        package: ({ readPackageUp }) => found(async (dir) => JSON.stringify((await readPackageUp({ cwd: src(dir) })).packageJson)),
      },
    },
    'find-up@8.0.0': {
      'findUp: package.json': {
        native: () => found((dir) => findPackageJSON(directory(src(dir)))),
        package: ({ findUp }) => found((dir) => findUp('package.json', { cwd: src(dir) })),
      },
      'findUp: another file name': {
        gap: 'finds only package.json; any other file name needs a hand-written walk up the directories',
        native: () => found((dir) => findPackageJSON(directory(src(dir)))),
        package: ({ findUp }) => found((dir) => findUp('.nvmrc', { cwd: src(dir) })),
      },
    },
  },
  idioms: {
    resolveDependencyManifest: {
      seed: "\\.resolve\\(\\s*[`'\"][^`'\"]+/package\\.json[`'\"]",
      native: () => found((dir) => findPackageJSON('dep', pathToFileURL(join(src(dir), 'index.js')))),
      idiom: () => found((dir) => createRequire(join(src(dir), 'index.js')).resolve('dep/package.json')),
    },
    'resolveDependencyManifest: linked workspace package': {
      gap: 'findPackageJSON gives the path under node_modules, so a linked workspace package comes back as the symlink path; require.resolve gives the real path, the one a caller that compares or joins paths may expect',
      native: () => inWorkspace((dir) => findPackageJSON('linked', pathToFileURL(join(src(dir), 'index.js')))),
      idiom: () => inWorkspace((dir) => createRequire(join(src(dir), 'index.js')).resolve('linked/package.json')),
    },
    'resolveDependencyManifest: exports leave out package.json': {
      improves: "findPackageJSON finds the package.json of a dependency whose exports leave out ./package.json; require.resolve('<pkg>/package.json') throws ERR_PACKAGE_PATH_NOT_EXPORTED for it",
      native: () => found((dir) => findPackageJSON('sealed', pathToFileURL(join(src(dir), 'index.js')))),
      idiom: () =>
        found((dir) => {
          try {
            return createRequire(join(src(dir), 'index.js')).resolve('sealed/package.json');
          } catch (error) {
            return `threw ${error.code}`;
          }
        }),
    },
  },
  lint: {
    banPackageUp: {
      eslint: '10.12.0',
      plugin: 'eslint-plugin-depend@1.5.0',
      rule: 'depend/ban-dependencies',
      code: "import { packageUp } from 'package-up';",
    },
    banReadPackageUp: {
      eslint: '10.12.0',
      plugin: 'eslint-plugin-depend@1.5.0',
      rule: 'depend/ban-dependencies',
      code: "import { readPackageUp } from 'read-package-up';",
    },
  },
};
