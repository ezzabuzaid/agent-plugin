// Read a file line by line without loading it whole.
import { createReadStream } from 'node:fs';
import { mkdtempDisposable, open, realpath, writeFile } from 'node:fs/promises';
import { createInterface } from 'node:readline';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Runs `read(path)` on a fresh file with LF, CRLF and empty lines and no final newline.
const lines = async (read) => {
  await using scratch = await mkdtempDisposable(join(tmpdir(), 'node-native-lines-'));
  const path = join(await realpath(scratch.path), 'a.txt');
  await writeFile(path, 'line1\nline2\r\nline3\n\nlast ü');
  return await read(path);
};
const native = async (path) => {
  await using file = await open(path);
  return await Array.fromAsync(file.readLines());
};
const nReadlines = (LineByLine, path) => {
  const reader = new LineByLine(path);
  const found = [];
  for (let line = reader.next(); line; line = reader.next()) found.push(line);
  return found;
};

export default {
  apis: ['fs:filehandle.readLines', 'fs:fsPromises.open'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'n-readlines@3.4.1': {
      default: {
        native: () => lines(native),
        package: ({ default: LineByLine }) => lines((path) => nReadlines(LineByLine, path).map(String)),
      },
      'default: Buffer lines': {
        gap: 'yields strings; n-readlines returns each line as a Buffer',
        native: () => lines(native),
        package: ({ default: LineByLine }) => lines((path) => nReadlines(LineByLine, path)),
      },
    },
  },
  idioms: {
    readlineOverStream: {
      seed: 'createInterface\\(\\s*\\{\\s*input:\\s*(?:fs\\.)?createReadStream\\(',
      native: () => lines(native),
      idiom: () => lines((path) => Array.fromAsync(createInterface({ input: createReadStream(path), crlfDelay: Infinity }))),
    },
  },
};
