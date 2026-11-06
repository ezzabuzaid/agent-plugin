// Copy a file or a directory tree.
import { cpSync } from 'node:fs';
import { cp, readdir, readFile, stat, utimes, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { inScratch } from './support/scratch.mjs';

const files = ['src/a.txt', 'src/s/b.txt'];
const sources = Object.fromEntries(files.map((file) => [file, file]));
// Every path under `dir` with the text of each file.
const contents = async (dir) => {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true });
  const read = entries.map(async (entry) => {
    const path = join(entry.parentPath, entry.name).slice(dir.length + 1);
    return [path, entry.isFile() ? await readFile(join(dir, path), 'utf8') : 'dir'];
  });
  return (await Promise.all(read)).sort(([a], [b]) => a.localeCompare(b));
};
const outcome = async (run) => {
  try {
    await run();
    return 'copied';
  } catch {
    return 'threw';
  }
};
// The copied tree.
const copies = (copy) =>
  inScratch(sources, async (dir) => {
    await copy(join(dir, 'src'), join(dir, 'out'));
    return contents(join(dir, 'out'));
  });
// A single file copied to a path whose parents do not exist.
const intoNewParent = (copy) =>
  inScratch(sources, async (dir) => {
    const result = await outcome(() => copy(join(dir, 'src/a.txt'), join(dir, 'x/y/a.txt')));
    return result === 'copied' ? readFile(join(dir, 'x/y/a.txt'), 'utf8') : result;
  });
// Copies over a changed file, and reports what the file holds afterwards.
const keepsExisting = (copy) =>
  inScratch(sources, async (dir) => {
    await copy(join(dir, 'src'), join(dir, 'out'));
    await writeFile(join(dir, 'out/a.txt'), 'changed');
    const result = await outcome(() => copy(join(dir, 'src'), join(dir, 'out')));
    return [result, await readFile(join(dir, 'out/a.txt'), 'utf8')];
  });
const filters = (copy) =>
  inScratch(sources, async (dir) => {
    await copy(join(dir, 'src'), join(dir, 'out'), (source) => !source.endsWith('b.txt'));
    return contents(join(dir, 'out'));
  });
const timestamps = (copy) =>
  inScratch(sources, async (dir) => {
    await utimes(join(dir, 'src/a.txt'), 1000, 1000);
    await copy(join(dir, 'src'), join(dir, 'out'));
    return (await stat(join(dir, 'out/a.txt'))).mtimeMs;
  });
const intoItself = (copy) => inScratch(sources, (dir) => outcome(() => copy(join(dir, 'src'), join(dir, 'src/inner'))));
const tree = (src, dest, options) => cp(src, dest, { recursive: true, ...options });
const ncpAsync = (ncp, options = {}) => (src, dest) =>
  new Promise((resolve, reject) => ncp(src, dest, options, (error) => (error ? reject(error) : resolve())));

export default {
  apis: ['fs:fsPromises.cp', 'fs:fs.cp', 'fs:fs.cpSync'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'fs-extra@11.4.1': {
      copy: {
        native: () => copies(tree),
        package: ({ default: fse }) => copies(fse.copy),
      },
      'copy: file into a new directory': {
        native: () => intoNewParent(tree),
        package: ({ default: fse }) => intoNewParent(fse.copy),
      },
      'copy: directory without recursive': {
        gap: 'copies a directory only with { recursive: true }; fs-extra copy needs no option',
        native: () => inScratch(sources, (dir) => outcome(() => cp(join(dir, 'src'), join(dir, 'out')))),
        package: ({ default: fse }) => inScratch(sources, (dir) => outcome(() => fse.copy(join(dir, 'src'), join(dir, 'out')))),
      },
      'copy: overwrite false': {
        native: () => keepsExisting((src, dest) => tree(src, dest, { force: false })),
        package: ({ default: fse }) => keepsExisting((src, dest) => fse.copy(src, dest, { overwrite: false })),
      },
      'copy: errorOnExist': {
        native: () => keepsExisting((src, dest) => tree(src, dest, { force: false, errorOnExist: true })),
        package: ({ default: fse }) =>
          keepsExisting((src, dest) => fse.copy(src, dest, { overwrite: false, errorOnExist: true })),
      },
      'copy: filter': {
        native: () => filters((src, dest, filter) => tree(src, dest, { filter })),
        package: ({ default: fse }) => filters((src, dest, filter) => fse.copy(src, dest, { filter })),
      },
      'copy: preserveTimestamps': {
        native: () => timestamps((src, dest) => tree(src, dest, { preserveTimestamps: true })),
        package: ({ default: fse }) => timestamps((src, dest) => fse.copy(src, dest, { preserveTimestamps: true })),
      },
      'copy: into itself': {
        native: () => intoItself(tree),
        package: ({ default: fse }) => intoItself(fse.copy),
      },
      copySync: {
        native: () => copies((src, dest) => cpSync(src, dest, { recursive: true })),
        package: ({ default: fse }) => copies(fse.copySync),
      },
    },
    'ncp@2.0.0': {
      default: {
        native: () => copies(tree),
        package: ({ default: ncp }) => copies(ncpAsync(ncp)),
      },
      'default: file into a new directory': {
        improves: 'fs.cp creates the missing parents of a copied file; ncp fails with ENOENT',
        native: () => intoNewParent(tree),
        package: ({ default: ncp }) => intoNewParent(ncpAsync(ncp)),
      },
      'default: clobber false': {
        native: () => keepsExisting((src, dest) => tree(src, dest, { force: false })),
        package: ({ default: ncp }) => keepsExisting(ncpAsync(ncp, { clobber: false })),
      },
    },
  },
  lint: {
    banFsExtra: {
      eslint: '10.12.0',
      plugin: 'eslint-plugin-depend@1.5.0',
      rule: 'depend/ban-dependencies',
      code: "import fse from 'fs-extra';",
    },
  },
};
