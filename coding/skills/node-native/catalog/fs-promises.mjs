// Promise-returning file system calls, without wrapping the callback API.
import * as fs from 'node:fs';
import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { settled } from './support/outcome.mjs';
import { inScratch } from './support/scratch.mjs';

const code = (error) => error.code;
// Reads a.txt and a missing file through `read(path, encoding)`.
const reads = (read) =>
  inScratch({ 'a.txt': 'text' }, async (dir) => [await settled(() => read(join(dir, 'a.txt'), 'utf8'), code), await settled(() => read(join(dir, 'missing'), 'utf8'), code)]);
// Writes b.txt through `write`, then lists the directory.
const writes = (write) =>
  inScratch({ 'a.txt': 'text' }, async (dir) => {
    await write(join(dir, 'b.txt'), 'new');
    return [await readFile(join(dir, 'b.txt'), 'utf8'), (await readdir(dir)).sort()];
  });
const stats = (statOf) => inScratch({ 'a.txt': 'text' }, async (dir) => (await statOf(join(dir, 'a.txt'))).isFile());
const lists = (list) => inScratch({ 'a.txt': 'text' }, async (dir) => (await list(dir)).sort());

export default {
  apis: ['fs:fsPromises.readFile', 'fs:fsPromises.writeFile', 'fs:fsPromises.stat', 'fs:fsPromises.readdir'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'mz@2.7.0/fs.js': {
      readFile: {
        native: () => reads(readFile),
        package: ({ default: mz }) => reads(mz.readFile),
      },
      writeFile: {
        native: () => writes(writeFile),
        package: ({ default: mz }) => writes(mz.writeFile),
      },
      stat: {
        native: () => stats(stat),
        package: ({ default: mz }) => stats(mz.stat),
      },
      readdir: {
        native: () => lists(readdir),
        package: ({ default: mz }) => lists(mz.readdir),
      },
    },
    'fs-extra@11.4.1': {
      readFile: {
        native: () => reads(readFile),
        package: ({ default: fse }) => reads(fse.readFile),
      },
      writeFile: {
        native: () => writes(writeFile),
        package: ({ default: fse }) => writes(fse.writeFile),
      },
      stat: {
        native: () => stats(stat),
        package: ({ default: fse }) => stats(fse.stat),
      },
      readdir: {
        native: () => lists(readdir),
        package: ({ default: fse }) => lists(fse.readdir),
      },
    },
  },
  idioms: {
    promisifyFs: {
      seed: 'promisify\\(\\s*fs\\.',
      native: () => reads(readFile),
      idiom: () => reads(promisify(fs.readFile)),
    },
    newPromiseCallback: {
      seed: 'fs\\.\\w+\\([^()]*\\(\\s*err',
      native: () => reads(readFile),
      idiom: () =>
        reads(
          (path, encoding) =>
            new Promise((resolve, reject) => fs.readFile(path, encoding, (error, data) => (error ? reject(error) : resolve(data)))),
        ),
    },
  },
  lint: {
    preferPromisesFs: {
      eslint: '10.12.0',
      plugin: 'eslint-plugin-n@18.5.0',
      rule: 'n/prefer-promises/fs',
      failed: '2 of 2 hits on good code: it reads fs.watch as callback I/O',
      code: "import fs from 'node:fs';\nfs.readFile('a', 'utf8', (error, data) => {});",
    },
  },
};
