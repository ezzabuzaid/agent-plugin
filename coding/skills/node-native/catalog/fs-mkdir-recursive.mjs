// Create a directory and every missing parent; an existing directory is fine.
import { mkdirSync } from 'node:fs';
import { mkdir, stat, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { outcome } from './support/outcome.mjs';
import { inScratch } from './support/scratch.mjs';

const shown = (dir, path) => (typeof path === 'string' ? relative(dir, path) : path);
// What `make` returns for a new nested path, then for the same path again, and whether it is a directory.
const makes = (make) =>
  inScratch({}, async (dir) => [
    shown(dir, await make(join(dir, 'a/b/c'))),
    shown(dir, await make(join(dir, 'a/b/c'))),
    (await stat(join(dir, 'a/b/c'))).isDirectory(),
  ]);
const created = (make) =>
  inScratch({}, async (dir) => {
    await make(join(dir, 'a/b/c'));
    await make(join(dir, 'a/b/c'));
    return (await stat(join(dir, 'a/b/c'))).isDirectory();
  });
// A file where the directory should be.
const overFile = (make) =>
  inScratch({}, async (dir) => {
    await writeFile(join(dir, 'file'), '');
    return outcome(() => make(join(dir, 'file')), (error) => error.code);
  });
const mode = (make) =>
  inScratch({}, async (dir) => {
    await make(join(dir, 'private'), { mode: 0o700 });
    return (await stat(join(dir, 'private'))).mode & 0o777;
  });
const native = (path, options) => mkdir(path, { recursive: true, ...options });
const nativeSync = (path, options) => mkdirSync(path, { recursive: true, ...options });

export default {
  apis: ['fs:fsPromises.mkdir', 'fs:fs.mkdir', 'fs:fs.mkdirSync'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'mkdirp@3.0.1': {
      mkdirp: {
        native: () => makes(native),
        package: ({ mkdirp }) => makes(mkdirp),
      },
      'mkdirp: over a file': {
        native: () => overFile(native),
        package: ({ mkdirp }) => overFile(mkdirp),
      },
      'mkdirp: mode': {
        native: () => mode(native),
        package: ({ mkdirp }) => mode(mkdirp),
      },
      mkdirpSync: {
        native: () => makes(nativeSync),
        package: ({ mkdirpSync }) => makes(mkdirpSync),
      },
    },
    'make-dir@5.1.0': {
      makeDirectory: {
        native: () => created(native),
        package: ({ makeDirectory }) => created(makeDirectory),
      },
      'makeDirectory: return value': {
        gap: 'resolves the first directory it created, or undefined; makeDirectory resolves the full path every time',
        native: () => makes(native),
        package: ({ makeDirectory }) => makes(makeDirectory),
      },
      'makeDirectory: over a file': {
        native: () => overFile(native),
        package: ({ makeDirectory }) => overFile(makeDirectory),
      },
      makeDirectorySync: {
        native: () => created(nativeSync),
        package: ({ makeDirectorySync }) => created(makeDirectorySync),
      },
    },
    'fs-extra@11.4.1': {
      ensureDir: {
        native: () => makes(native),
        package: ({ default: fse }) => makes(fse.ensureDir),
      },
      ensureDirSync: {
        native: () => makes(nativeSync),
        package: ({ default: fse }) => makes(fse.ensureDirSync),
      },
      mkdirs: {
        native: () => makes(native),
        package: ({ default: fse }) => makes(fse.mkdirs),
      },
      mkdirp: {
        native: () => makes(native),
        package: ({ default: fse }) => makes(fse.mkdirp),
      },
    },
  },
  lint: {
    banMkdirp: {
      eslint: '10.12.0',
      plugin: 'eslint-plugin-depend@1.5.0',
      rule: 'depend/ban-dependencies',
      dependency: 'mkdirp',
      failed: 'reads only the package name, and the code can need the package for what no native API does; e18e/ban-dependencies, which reports the same hits, had 4 of 12 hits on good code',
      code: "import { mkdirp } from 'mkdirp';",
    },
    banMakeDir: {
      eslint: '10.12.0',
      plugin: 'eslint-plugin-depend@1.5.0',
      rule: 'depend/ban-dependencies',
      dependency: 'make-dir',
      failed: 'reads only the package name, and the code can need the package for what no native API does; e18e/ban-dependencies, which reports the same hits, had 4 of 12 hits on good code',
      code: "import { makeDirectory } from 'make-dir';",
    },
  },
};
