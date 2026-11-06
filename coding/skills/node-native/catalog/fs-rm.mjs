// Remove a file or a directory tree, ignoring a path that does not exist.
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { mkdir, readdir, rm } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { inScratch } from './support/scratch.mjs';

const files = ['t/a.log', 't/b.txt', 't/s/c.log', 'keep.txt'];
const tree = Object.fromEntries(files.map((file) => [file, file]));
const list = async (dir) => (await readdir(dir, { recursive: true })).sort();
// What is left after `remove(dir)` deleted `t` and `missing`: the tree, and what each call returned.
const removes = (remove) =>
  inScratch(tree, async (dir) => {
    await remove(join(dir, 't'));
    await remove(join(dir, 'missing'));
    return list(dir);
  });
const returns = (remove) => inScratch(tree, async (dir) => [await remove(join(dir, 't')), await remove(join(dir, 'missing'))]);
const rmTree = (path) => rm(path, { recursive: true, force: true });
const rmTreeSync = (path) => rmSync(path, { recursive: true, force: true });
// emptyDir: the directory stays (or is created) and holds nothing.
const empties = (empty) =>
  inScratch(tree, async (dir) => {
    await empty(join(dir, 't'));
    await empty(join(dir, 'new/x'));
    return [await list(join(dir, 't')), existsSync(join(dir, 'new/x'))];
  });
const nativeEmpty = async (path) => {
  await rm(path, { recursive: true, force: true });
  await mkdir(path, { recursive: true });
};
const logs = (remove) =>
  inScratch(tree, async (dir) => {
    await remove(dir);
    return list(join(dir, 't'));
  });

export default {
  apis: ['fs:fsPromises.rm', 'fs:fs.rm', 'fs:fs.rmSync'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'rimraf@6.1.4': {
      rimraf: {
        native: () => removes(rmTree),
        package: ({ rimraf }) => removes(rimraf),
      },
      'rimraf: return value': {
        gap: 'resolves undefined; rimraf resolves true',
        native: () => returns(rmTree),
        package: ({ rimraf }) => returns(rimraf),
      },
      'rimraf: glob': {
        gap: 'takes one literal path; rimraf { glob } removes every match of a pattern',
        native: () => logs((dir) => rm(join(dir, 't/**/*.log'), { recursive: true, force: true })),
        package: ({ rimraf }) => logs((dir) => rimraf('**/*.log', { glob: { cwd: join(dir, 't') } })),
      },
      rimrafSync: {
        native: () => removes(rmTreeSync),
        package: ({ rimrafSync }) => removes(rimrafSync),
      },
    },
    'del@9.0.1': {
      deleteAsync: {
        native: () => removes(rmTree),
        package: ({ deleteAsync }) => removes((path) => deleteAsync(path, { force: true })),
      },
      'deleteAsync: return value': {
        gap: 'resolves undefined; deleteAsync resolves the paths it deleted',
        native: () => inScratch(tree, (dir) => rmTree(join(dir, 't'))),
        package: ({ deleteAsync }) =>
          inScratch(tree, async (dir) => (await deleteAsync(join(dir, 't'), { force: true })).map((path) => relative(dir, path))),
      },
      'deleteAsync: glob': {
        gap: 'takes one literal path; deleteAsync removes every match of its patterns',
        native: () => logs((dir) => rm(join(dir, 't/**/*.log'), { recursive: true, force: true })),
        package: ({ deleteAsync }) => logs((dir) => deleteAsync(['**/*.log'], { cwd: join(dir, 't') })),
      },
      'deleteAsync: outside cwd': {
        gap: 'removes any path; deleteAsync refuses a path outside cwd unless force is true',
        native: () => inScratch(tree, async (dir) => [await rmTree(join(dir, 't')), existsSync(join(dir, 't'))]),
        package: ({ deleteAsync }) =>
          inScratch(tree, async (dir) => {
            try {
              return await deleteAsync(join(dir, 't'), { cwd: join(dir, 't', 's') });
            } catch (error) {
              return `threw ${error.name}`;
            }
          }),
      },
      'deleteAsync: dryRun': {
        gap: 'has no dry run that lists what it would remove',
        native: () => inScratch(tree, async (dir) => [await rmTree(join(dir, 't')), existsSync(join(dir, 't'))]),
        package: ({ deleteAsync }) =>
          inScratch(tree, async (dir) => [(await deleteAsync(join(dir, 't'), { dryRun: true, force: true })).length, existsSync(join(dir, 't'))]),
      },
      deleteSync: {
        native: () => removes(rmTreeSync),
        package: ({ deleteSync }) => removes((path) => deleteSync(path, { force: true })),
      },
    },
    'premove@4.0.0': {
      premove: {
        native: () => removes(rmTree),
        package: ({ premove }) => removes(premove),
      },
      'premove: return value': {
        gap: 'resolves undefined; premove resolves whether the path existed',
        native: () => returns(rmTree),
        package: ({ premove }) => returns(premove),
      },
    },
    'fs-extra@11.4.1': {
      remove: {
        native: () => removes(rmTree),
        package: ({ default: fse }) => removes(fse.remove),
      },
      removeSync: {
        native: () => removes(rmTreeSync),
        package: ({ default: fse }) => removes(fse.removeSync),
      },
      emptyDir: {
        native: () => empties(nativeEmpty),
        package: ({ default: fse }) => empties(fse.emptyDir),
      },
      emptyDirSync: {
        native: () =>
          empties((path) => {
            rmSync(path, { recursive: true, force: true });
            mkdirSync(path, { recursive: true });
          }),
        package: ({ default: fse }) => empties(fse.emptyDirSync),
      },
    },
  },
  lint: {
    banRimraf: {
      eslint: '10.12.0',
      plugin: 'eslint-plugin-depend@1.5.0',
      rule: 'depend/ban-dependencies',
      code: "import { rimraf } from 'rimraf';",
    },
  },
};
