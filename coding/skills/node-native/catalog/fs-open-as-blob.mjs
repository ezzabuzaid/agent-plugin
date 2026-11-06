// A Blob backed by a file on disk, read lazily.
import { openAsBlob, openAsBlobSync } from 'node:fs';
import { mkdtempDisposable, realpath, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Runs `open(path)` on a fresh file and describes the Blob it returns.
const opened = async (open, describe = async (blob) => [await blob.text(), blob.size, blob.type, await blob.slice(0, 5).text()]) => {
  await using scratch = await mkdtempDisposable(join(tmpdir(), 'node-native-blob-'));
  const path = join(await realpath(scratch.path), 'a.txt');
  await writeFile(path, 'line1\nline2');
  return await describe(await open(path));
};
const isGlobalBlob = async (blob) => blob instanceof Blob;
const named = async (blob) => [blob.constructor.name, blob.name, typeof blob.lastModified];

export default {
  apis: ['fs:fs.openAsBlob', 'fs:fs.openAsBlobSync'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'fetch-blob@4.0.0/from.js': {
      blobFrom: {
        native: () => opened((path) => openAsBlob(path, { type: 'text/plain' })),
        package: ({ blobFrom }) => opened((path) => blobFrom(path, 'text/plain')),
      },
      'blobFrom: Blob class': {
        improves: 'openAsBlob returns the global Blob, which fetch and Response send as bytes; fetch-blob blobFrom returns its own Blob class, not an instance of the global one',
        native: () => opened((path) => openAsBlob(path), isGlobalBlob),
        package: ({ blobFrom }) => opened((path) => blobFrom(path), isGlobalBlob),
      },
      blobFromSync: {
        native: () => opened((path) => openAsBlobSync(path, { type: 'text/plain' })),
        package: ({ blobFromSync }) => opened((path) => blobFromSync(path, 'text/plain')),
      },
      fileFrom: {
        gap: 'returns a Blob with no file name or lastModified; fileFrom returns a File',
        native: () => opened((path) => openAsBlob(path), named),
        package: ({ fileFrom }) => opened((path) => fileFrom(path), named),
      },
    },
  },
};
