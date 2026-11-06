// List every entry under a directory, at any depth.
import { readdirSync, statSync } from 'node:fs';
import { opendir, readdir, stat, symlink } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { inScratch } from './support/scratch.mjs';

const files = ['a.js', 'src/c.js', 'src/deep/d.txt', '.h/e.js'];
const tree = Object.fromEntries(files.map((file) => [file, file]));
// Adds `link`, a symlink to `src`, before `run(dir)`.
const linked = (run) => async (dir) => {
  await symlink(join(dir, 'src'), join(dir, 'link'));
  return run(dir);
};
const sorted = (paths) => [...paths].sort();
const filesOf = (dir, dirents) =>
  sorted(dirents.filter((entry) => entry.isFile()).map((entry) => relative(dir, join(entry.parentPath, entry.name))));
const nativeFiles = ({ link = false } = {}) => {
  const run = async (dir) => filesOf(dir, await readdir(dir, { recursive: true, withFileTypes: true }));
  return inScratch(tree, link ? linked(run) : run);
};
// The walker idiom's hand-written walker (readdir, stat each entry, recurse into directories), for the row that reuses it.
const walkWithStat = async (dir) => {
  const found = [];
  for (const name of await readdir(dir)) {
    const path = join(dir, name);
    if ((await stat(path)).isDirectory()) found.push(...(await walkWithStat(path)));
    else found.push(path);
  }
  return found;
};
// The Dirent walker idiom's hand-written walker, for the row that reuses it.
const walkWithDirent = async (dir) => {
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...(await walkWithDirent(path)));
    else found.push(path);
  }
  return found;
};
// Lists the tree with `walk(dir)`, relative to the scratch directory.
const walked = (walk, { link = false } = {}) => {
  const run = async (dir) => sorted((await walk(dir)).map((path) => relative(dir, path)));
  return inScratch(tree, link ? linked(run) : run);
};

export default {
  apis: ['fs:fsPromises.readdir', 'fs:fs.readdir', 'fs:fs.readdirSync', 'fs:fsPromises.opendir'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'readdirp@5.1.1': {
      readdirpPromise: {
        native: () => nativeFiles(),
        package: ({ readdirpPromise }) => inScratch(tree, async (dir) => sorted((await readdirpPromise(dir)).map((entry) => entry.path))),
      },
      'readdirpPromise: files_directories': {
        native: () => inScratch(tree, async (dir) => sorted(await readdir(dir, { recursive: true }))),
        package: ({ readdirpPromise }) =>
          inScratch(tree, async (dir) => sorted((await readdirpPromise(dir, { type: 'files_directories' })).map((entry) => entry.path))),
      },
      'readdirpPromise: depth': {
        gap: 'has no depth limit: recursive lists every level',
        native: () => nativeFiles(),
        package: ({ readdirpPromise }) =>
          inScratch(tree, async (dir) => sorted((await readdirpPromise(dir, { depth: 0 })).map((entry) => entry.path))),
      },
      'readdirpPromise: symlinked directory': {
        native: () => nativeFiles({ link: true }),
        package: ({ readdirpPromise }) =>
          inScratch(tree, linked(async (dir) => sorted((await readdirpPromise(dir)).map((entry) => entry.path)))),
      },
      default: {
        native: () =>
          inScratch(tree, async (dir) => {
            const found = [];
            for await (const entry of await opendir(dir, { recursive: true })) found.push(entry);
            return filesOf(dir, found);
          }),
        package: ({ default: readdirp }) =>
          inScratch(tree, async (dir) => sorted((await Array.fromAsync(readdirp(dir))).map((entry) => entry.path))),
      },
    },
    'recursive-readdir@2.2.3': {
      default: {
        native: () => nativeFiles(),
        package: ({ default: recursiveReaddir }) =>
          inScratch(tree, async (dir) => sorted((await recursiveReaddir(dir)).map((path) => relative(dir, path)))),
      },
      'default: ignore': {
        gap: 'takes no ignore patterns; filter the result instead',
        native: () => nativeFiles(),
        package: ({ default: recursiveReaddir }) =>
          inScratch(tree, async (dir) => sorted((await recursiveReaddir(dir, ['*.txt'])).map((path) => relative(dir, path)))),
      },
    },
  },
  idioms: {
    walker: {
      // A function that reads a directory, and calls itself again for an entry that isDirectory().
      seed: 'function\\*?\\s+([\\w$]+)[\\s\\S]{0,300}?\\breaddir\\((?![^;]{0,200}withFileTypes)[\\s\\S]{0,400}?\\.isDirectory\\(\\)[\\s\\S]{0,120}?\\b\\1\\(|(?:const|let)\\s+([\\w$]+)\\s*=\\s*(?:async\\s*)?(?:\\([^)]*\\)|[\\w$]+)(?:\\s*:[^=;{]{1,80})?\\s*=>[\\s\\S]{0,300}?\\breaddir\\((?![^;]{0,200}withFileTypes)[\\s\\S]{0,400}?\\.isDirectory\\(\\)[\\s\\S]{0,120}?\\b\\2\\(',
      native: () => nativeFiles(),
      idiom: () =>
        walked(async function walk(dir) {
          const found = [];
          for (const name of await readdir(dir)) {
            const path = join(dir, name);
            if ((await stat(path)).isDirectory()) found.push(...(await walk(path)));
            else found.push(path);
          }
          return found;
        }),
    },
    'walker: symlinked directory': {
      native: () => nativeFiles({ link: true }),
      idiom: () => walked(walkWithStat, { link: true }),
    },
    direntWalker: {
      // A function that reads a directory as Dirents, and calls itself again for an entry that isDirectory().
      seed: 'function\\*?\\s+([\\w$]+)[\\s\\S]{0,300}?\\breaddir\\([^;]{0,200}?withFileTypes[\\s\\S]{0,400}?\\.isDirectory\\(\\)[\\s\\S]{0,120}?\\b\\1\\(|(?:const|let)\\s+([\\w$]+)\\s*=\\s*(?:async\\s*)?(?:\\([^)]*\\)|[\\w$]+)(?:\\s*:[^=;{]{1,80})?\\s*=>[\\s\\S]{0,300}?\\breaddir\\([^;]{0,200}?withFileTypes[\\s\\S]{0,400}?\\.isDirectory\\(\\)[\\s\\S]{0,120}?\\b\\2\\(',
      native: () => nativeFiles(),
      idiom: () =>
        walked(async function walk(dir) {
          const found = [];
          for (const entry of await readdir(dir, { withFileTypes: true })) {
            const path = join(dir, entry.name);
            if (entry.isDirectory()) found.push(...(await walk(path)));
            else found.push(path);
          }
          return found;
        }),
    },
    'direntWalker: symlinked directory': {
      gap: 'a Dirent of a symlink to a directory is not isDirectory(), so a Dirent walker lists the link as one entry (or drops it behind an isFile() test) and never enters it; readdir recursive descends into the linked directory',
      native: () => nativeFiles({ link: true }),
      idiom: () => walked(walkWithDirent, { link: true }),
    },
    walkerSync: {
      seed: 'function\\*?\\s+([\\w$]+)[\\s\\S]{0,300}?\\breaddirSync\\([\\s\\S]{0,400}?\\.isDirectory\\(\\)[\\s\\S]{0,120}?\\b\\1\\(|(?:const|let)\\s+([\\w$]+)\\s*=\\s*(?:\\([^)]*\\)|[\\w$]+)(?:\\s*:[^=;{]{1,80})?\\s*=>[\\s\\S]{0,300}?\\breaddirSync\\([\\s\\S]{0,400}?\\.isDirectory\\(\\)[\\s\\S]{0,120}?\\b\\2\\(',
      native: () => inScratch(tree, (dir) => filesOf(dir, readdirSync(dir, { recursive: true, withFileTypes: true }))),
      idiom: () =>
        inScratch(tree, (dir) => {
          const walk = (current) =>
            readdirSync(current).flatMap((name) => {
              const path = join(current, name);
              return statSync(path).isDirectory() ? walk(path) : [path];
            });
          return sorted(walk(dir).map((path) => relative(dir, path)));
        }),
    },
  },
};
