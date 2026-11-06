// Match file paths against glob patterns.
import { globSync } from 'node:fs';
import { glob, symlink, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { inScratch } from './support/scratch.mjs';

const files = ['a.js', 'b.ts', '.hidden.js', 'src/c.js', 'src/deep/d.js', 'node_modules/x/e.js', '.dot/f.js'];
const tree = Object.fromEntries(files.map((file) => [file, file]));
// Adds `link`, a symlink to `src`, before `run(dir)`.
const linked = (run) => async (dir) => {
  await symlink(join(dir, 'src'), join(dir, 'link'));
  return run(dir);
};
const sorted = (paths) => [...paths].sort();
// Native glob in `dir`, sorted (native order is the walk order).
const native = (pattern, options = {}) =>
  inScratch(tree, linked(async (dir) => sorted(await Array.fromAsync(glob(pattern, { cwd: dir, ...options })))));
const nativeSync = (pattern, options = {}) => inScratch(tree, linked((dir) => sorted(globSync(pattern, { cwd: dir, ...options }))));
const theirs = (find, pattern, options = {}) => inScratch(tree, linked(async (dir) => sorted(await find(pattern, { cwd: dir, ...options }))));
const absolute = (find) =>
  inScratch(tree, linked(async (dir) => sorted((await find(dir)).map((path) => relative(dir, path)))));
const nativeAbsolute = () =>
  absolute(async (dir) => Array.fromAsync(glob(join(dir, '**/*.js'))));
const entries = (list) => list.map((entry) => [entry.name, entry.isDirectory()]).sort();

const ban = (name) => ({
  eslint: '10.12.0',
  plugin: 'eslint-plugin-depend@1.5.0',
  rule: 'depend/ban-dependencies',
  code: `import x from '${name}';`,
});

export default {
  apis: ['fs:fsPromises.glob', 'fs:fs.glob', 'fs:fs.globSync'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'glob@14.0.4': {
      glob: {
        native: () => native('**/*.js'),
        package: ({ glob: find }) => theirs(find, '**/*.js'),
      },
      'glob: directories': {
        native: () => native('**'),
        package: ({ glob: find }) => theirs(find, '**'),
      },
      'glob: ignore': {
        native: () => native('**/*.js', { exclude: ['node_modules/**'] }),
        package: ({ glob: find }) => theirs(find, '**/*.js', { ignore: ['node_modules/**'] }),
      },
      'glob: maxDepth': {
        native: () => native('**/*.js', { maxDepth: 2 }),
        package: ({ glob: find }) => theirs(find, '**/*.js', { maxDepth: 2 }),
      },
      'glob: follow': {
        native: () => native('**/*.js', { followSymlinks: true }),
        package: ({ glob: find }) => theirs(find, '**/*.js', { follow: true }),
      },
      'glob: absolute': {
        native: nativeAbsolute,
        package: ({ glob: find }) => absolute((dir) => find('**/*.js', { cwd: dir, absolute: true })),
      },
      'glob: withFileTypes': {
        native: () => inScratch(tree, linked(async (dir) => entries(await Array.fromAsync(glob('src/*', { cwd: dir, withFileTypes: true }))))),
        package: ({ glob: find }) => inScratch(tree, linked(async (dir) => entries(await find('src/*', { cwd: dir, withFileTypes: true })))),
      },
      'glob: dot': {
        gap: 'no dot option: `**` never enters a dot directory and `*` never matches a dot file',
        native: () => native('**/*.js'),
        package: ({ glob: find }) => theirs(find, '**/*.js', { dot: true }),
      },
      'glob: mark': {
        gap: 'no mark option: a directory comes back without a trailing slash',
        native: () => native('*'),
        package: ({ glob: find }) => theirs(find, '*', { mark: true }),
      },
      globSync: {
        native: () => nativeSync('**/*.js'),
        package: ({ globSync: find }) => inScratch(tree, linked((dir) => sorted(find('**/*.js', { cwd: dir })))),
      },
    },
    'fast-glob@3.3.3': {
      default: {
        native: () => native('**/*.js', { followSymlinks: true }),
        package: ({ default: fg }) => theirs(fg, '**/*.js'),
      },
      'default: symlinked directory': {
        gap: 'does not follow a symlinked directory unless followSymlinks is true; fast-glob follows by default',
        native: () => native('**/*.js'),
        package: ({ default: fg }) => theirs(fg, '**/*.js'),
      },
      'default: onlyFiles': {
        gap: 'returns directories too; there is no onlyFiles option (fast-glob returns files only by default)',
        native: () => native('src/**'),
        package: ({ default: fg }) => theirs(fg, 'src/**'),
      },
      'default: ignore': {
        native: () => native('**/*.js', { exclude: ['node_modules/**'], followSymlinks: true }),
        package: ({ default: fg }) => theirs(fg, '**/*.js', { ignore: ['node_modules/**'] }),
      },
      'default: deep': {
        native: () => native('**/*.js', { maxDepth: 2, followSymlinks: true }),
        package: ({ default: fg }) => theirs(fg, '**/*.js', { deep: 2 }),
      },
      'default: absolute': {
        native: nativeAbsolute,
        package: ({ default: fg }) =>
          absolute((dir) => fg('**/*.js', { cwd: dir, absolute: true, followSymbolicLinks: false })),
      },
      'default: negative pattern': {
        gap: "a '!' pattern excludes nothing; pass it to `exclude` instead",
        native: () => native(['**/*.js', '!src/**']),
        package: ({ default: fg }) => theirs(fg, ['**/*.js', '!src/**'], { followSymbolicLinks: false }),
      },
      'default: dot': {
        gap: 'no dot option: `**` never enters a dot directory and `*` never matches a dot file',
        native: () => native('**/*.js'),
        package: ({ default: fg }) => theirs(fg, '**/*.js', { dot: true, followSymbolicLinks: false }),
      },
      sync: {
        native: () => nativeSync('**/*.js', { followSymlinks: true }),
        package: ({ default: fg }) => inScratch(tree, linked((dir) => sorted(fg.sync('**/*.js', { cwd: dir })))),
      },
    },
    'tinyglobby@0.2.17': {
      glob: {
        native: () => native('**/*.js', { followSymlinks: true }),
        package: ({ glob: find }) => theirs(find, '**/*.js'),
      },
      'glob: ignore': {
        native: () => native('**/*.js', { exclude: ['node_modules/**'], followSymlinks: true }),
        package: ({ glob: find }) => theirs(find, '**/*.js', { ignore: ['node_modules/**'] }),
      },
      'glob: deep': {
        native: () => native('**/*.js', { maxDepth: 2, followSymlinks: true }),
        package: ({ glob: find }) => theirs(find, '**/*.js', { deep: 1 }),
      },
      'glob: expandDirectories': {
        gap: 'a directory pattern matches the directory itself; tinyglobby expands it to the files inside',
        native: () => native('src'),
        package: ({ glob: find }) => theirs(find, 'src'),
      },
      'glob: negative pattern': {
        gap: "a '!' pattern excludes nothing; pass it to `exclude` instead",
        native: () => native(['**/*.js', '!src/**']),
        package: ({ glob: find }) => theirs(find, ['**/*.js', '!src/**'], { followSymbolicLinks: false }),
      },
      'glob: dot': {
        gap: 'no dot option: `**` never enters a dot directory and `*` never matches a dot file',
        native: () => native('**/*.js'),
        package: ({ glob: find }) => theirs(find, '**/*.js', { dot: true, followSymbolicLinks: false }),
      },
      globSync: {
        native: () => nativeSync('**/*.js', { followSymlinks: true }),
        package: ({ globSync: find }) => inScratch(tree, linked((dir) => sorted(find('**/*.js', { cwd: dir })))),
      },
    },
    'globby@16.2.4': {
      globby: {
        native: () => native('**/*.js', { followSymlinks: true }),
        package: ({ globby }) => theirs(globby, '**/*.js'),
      },
      'globby: gitignore': {
        gap: 'reads no .gitignore; pass its patterns to `exclude`',
        native: () =>
          inScratch(tree, linked(async (dir) => {
            await writeFile(join(dir, '.gitignore'), 'src/deep\n');
            return sorted(await Array.fromAsync(glob('src/**/*.js', { cwd: dir })));
          })),
        package: ({ globby }) =>
          inScratch(tree, linked(async (dir) => {
            await writeFile(join(dir, '.gitignore'), 'src/deep\n');
            return sorted(await globby('src/**/*.js', { cwd: dir, gitignore: true }));
          })),
      },
      'globby: expandDirectories': {
        gap: 'a directory pattern matches the directory itself; globby expands it to the files inside',
        native: () => native('src'),
        package: ({ globby }) => theirs(globby, 'src'),
      },
      'globby: negative pattern': {
        gap: "a '!' pattern excludes nothing; pass it to `exclude` instead",
        native: () => native(['**/*.js', '!src/**']),
        package: ({ globby }) => theirs(globby, ['**/*.js', '!src/**'], { followSymbolicLinks: false }),
      },
      globbySync: {
        native: () => nativeSync('**/*.js', { followSymlinks: true }),
        package: ({ globbySync }) => inScratch(tree, linked((dir) => sorted(globbySync('**/*.js', { cwd: dir })))),
      },
    },
  },
  lint: {
    banGlob: ban('glob'),
    banFastGlob: ban('fast-glob'),
    banGlobby: ban('globby'),
  },
};
