// Move or rename a file on the same file system.
import { renameSync } from 'node:fs';
import { mkdir, readdir, readFile, rename } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { outcome } from './support/outcome.mjs';
import { inScratch } from './support/scratch.mjs';

const codeOrName = (error) => error.code ?? error.name;
// Moves from.txt to `target`, and reports the outcome, the files left, and what `target` holds.
const moves = (move, target) =>
  inScratch({ 'from.txt': 'from', 'to.txt': 'to' }, async (dir) => {
    await mkdir(join(dir, 'sub'));
    const result = await outcome(async () => {
      await move(join(dir, 'from.txt'), join(dir, target));
      return 'moved';
    }, codeOrName);
    const left = (await readdir(dir, { recursive: true })).sort();
    const text = left.includes(target) ? await readFile(join(dir, target), 'utf8') : null;
    return [result, left, text];
  });

export default {
  apis: ['fs:fsPromises.rename', 'fs:fs.rename', 'fs:fs.renameSync'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'fs-extra@11.4.1': {
      move: {
        native: () => moves(rename, 'sub/moved.txt'),
        package: ({ default: fse }) => moves(fse.move, 'sub/moved.txt'),
      },
      'move: into a new directory': {
        gap: 'fails with ENOENT when the destination directory does not exist; fs-extra move creates it',
        native: () => moves(rename, 'new/moved.txt'),
        package: ({ default: fse }) => moves(fse.move, 'new/moved.txt'),
      },
      'move: existing destination': {
        gap: 'replaces an existing destination and has no option to refuse; fs-extra move refuses unless overwrite is true',
        native: () => moves(rename, 'to.txt'),
        package: ({ default: fse }) => moves(fse.move, 'to.txt'),
      },
      'move: overwrite': {
        native: () => moves(rename, 'to.txt'),
        package: ({ default: fse }) => moves((from, to) => fse.move(from, to, { overwrite: true }), 'to.txt'),
      },
      moveSync: {
        native: () => moves(renameSync, 'sub/moved.txt'),
        package: ({ default: fse }) => moves(fse.moveSync, 'sub/moved.txt'),
      },
    },
    'move-file@4.1.0': {
      moveFile: {
        native: () => moves(rename, 'to.txt'),
        package: ({ moveFile }) => moves(moveFile, 'to.txt'),
      },
      'moveFile: into a new directory': {
        gap: 'fails with ENOENT when the destination directory does not exist; moveFile creates it',
        native: () => moves(rename, 'new/moved.txt'),
        package: ({ moveFile }) => moves(moveFile, 'new/moved.txt'),
      },
      'moveFile: overwrite false': {
        gap: 'replaces an existing destination and has no option to refuse; moveFile { overwrite: false } refuses',
        native: () => moves(rename, 'to.txt'),
        package: ({ moveFile }) => moves((from, to) => moveFile(from, to, { overwrite: false }), 'to.txt'),
      },
      moveFileSync: {
        native: () => moves(renameSync, 'to.txt'),
        package: ({ moveFileSync }) => moves(moveFileSync, 'to.txt'),
      },
      renameFile: {
        native: () => moves(rename, 'renamed.txt'),
        package: ({ renameFile }) => moves((from, to) => renameFile(basename(from), basename(to), { cwd: dirname(from) }), 'renamed.txt'),
      },
    },
  },
};
