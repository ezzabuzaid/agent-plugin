// Close a FileHandle or a Dir at scope exit, also when the body throws.
import { open, opendir } from 'node:fs/promises';
import { join } from 'node:path';
import { inScratch } from './support/scratch.mjs';

const handleClosed = (file) => file.fd === -1;
const dirClosed = async (directory) => {
  try {
    await directory.read();
    return false;
  } catch (error) {
    return error.code === 'ERR_DIR_CLOSED';
  }
};
// Reads through `withResource`, whose body throws, and reports [text read, error, closed].
const throwsInside = (withResource, closed) =>
  inScratch({ 'a.txt': 'text' }, async (dir) => {
    let resource;
    let read;
    try {
      await withResource(dir, async (opened) => {
        resource = opened;
        read = opened.readFile ? await opened.readFile('utf8') : (await opened.read()).name;
        throw new Error('body');
      });
    } catch (error) {
      return [read, error.message, await closed(resource)];
    }
    return 'did not throw';
  });

export default {
  apis: ['fs:filehandle[Symbol.asyncDispose]', 'fs:dir[Symbol.asyncDispose]', 'fs:fsPromises.open', 'fs:fsPromises.opendir'],
  reviewedAt: 'v26.13.0',
  idioms: {
    fileHandleTryFinally: {
      seed: '([\\w$]+)\\s*=\\s*await\\s+(?:[\\w$]*[fF]s[\\w$]*\\.|promises\\.)*open\\([\\s\\S]{0,2000}?\\}\\s*finally\\s*\\{\\s*await\\s+\\1\\.close\\(\\)',
      native: () =>
        throwsInside(async (dir, body) => {
          await using file = await open(join(dir, 'a.txt'));
          await body(file);
        }, handleClosed),
      idiom: () =>
        throwsInside(async (dir, body) => {
          const file = await open(join(dir, 'a.txt'));
          try {
            await body(file);
          } finally {
            await file.close();
          }
        }, handleClosed),
    },
    dirTryFinally: {
      seed: '\\b(?:const|let|var)\\s+[\\w$]+\\s*=\\s*(?:await\\s+)?(?:[\\w$]+\\.)*opendir(?:Sync)?\\(',
      native: () =>
        throwsInside(async (dir, body) => {
          await using directory = await opendir(dir);
          await body(directory);
        }, dirClosed),
      idiom: () =>
        throwsInside(async (dir, body) => {
          const directory = await opendir(dir);
          try {
            await body(directory);
          } finally {
            await directory.close();
          }
        }, dirClosed),
    },
  },
};
