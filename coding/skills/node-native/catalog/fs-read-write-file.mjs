// Read and write whole files, JSON included, creating missing parent directories.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { outcome } from './support/outcome.mjs';
import { inScratch } from './support/scratch.mjs';

const codeOrName = (error) => error.code ?? error.name;
const value = { name: 'x', list: [1, 2], nested: { ok: true } };
// Reads `text` back through `read`.
const reads = (read, text) =>
  inScratch({}, async (dir) => {
    await writeFile(join(dir, 'data.json'), text);
    return outcome(() => read(join(dir, 'data.json')), codeOrName);
  });
// The exact text `write` leaves in `target`.
const writes = (write, target = 'data.json') =>
  inScratch({}, async (dir) => {
    const result = await outcome(() => write(join(dir, target), value), codeOrName);
    return result === undefined ? readFile(join(dir, target), 'utf8') : result;
  });
const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));
const writeJson = (path, data) => writeFile(path, `${JSON.stringify(data, null, 2)}\n`);
const output = async (path, text) => {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, text);
};
const outputs = (write) =>
  inScratch({}, async (dir) => {
    await write(join(dir, 'a/b/out.txt'), 'hi');
    return readFile(join(dir, 'a/b/out.txt'), 'utf8');
  });
// ensureFile: an empty file appears, an existing file keeps its text.
const ensures = (ensure) =>
  inScratch({}, async (dir) => {
    await ensure(join(dir, 'a/new.txt'));
    await writeFile(join(dir, 'a/old.txt'), 'kept');
    await ensure(join(dir, 'a/old.txt'));
    return [await readFile(join(dir, 'a/new.txt'), 'utf8'), await readFile(join(dir, 'a/old.txt'), 'utf8')];
  });

export default {
  apis: ['fs:fsPromises.readFile', 'fs:fsPromises.writeFile', 'fs:fs.readFileSync', 'fs:fs.writeFileSync', 'fs:fsPromises.mkdir'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'fs-extra@11.4.1': {
      readJson: {
        native: () => reads(readJson, JSON.stringify(value)),
        package: ({ default: fse }) => reads(fse.readJson, JSON.stringify(value)),
      },
      'readJson: byte order mark': {
        gap: 'JSON.parse throws SyntaxError on a leading byte order mark; readJson strips it',
        native: () => reads(readJson, `﻿${JSON.stringify(value)}`),
        package: ({ default: fse }) => reads(fse.readJson, `﻿${JSON.stringify(value)}`),
      },
      'readJson: invalid JSON': {
        native: () => reads(readJson, '{"a":'),
        package: ({ default: fse }) => reads(fse.readJson, '{"a":'),
      },
      'readJson: throws false': {
        gap: 'JSON.parse has no option to return null for invalid JSON; readJson { throws: false } does',
        native: () => reads(readJson, '{"a":'),
        package: ({ default: fse }) => reads((path) => fse.readJson(path, { throws: false }), '{"a":'),
      },
      readJsonSync: {
        native: () => reads((path) => JSON.parse(readFileSync(path, 'utf8')), JSON.stringify(value)),
        package: ({ default: fse }) => reads(fse.readJsonSync, JSON.stringify(value)),
      },
      writeJson: {
        native: () => writes(writeJson),
        package: ({ default: fse }) => writes((path, data) => fse.writeJson(path, data, { spaces: 2 })),
      },
      'writeJson: missing directory': {
        native: () => writes(writeJson, 'a/data.json'),
        package: ({ default: fse }) => writes((path, data) => fse.writeJson(path, data, { spaces: 2 }), 'a/data.json'),
      },
      writeJsonSync: {
        native: () => writes((path, data) => writeFileSync(path, `${JSON.stringify(data)}\n`)),
        package: ({ default: fse }) => writes(fse.writeJsonSync),
      },
      outputJson: {
        native: () =>
          writes(async (path, data) => {
            await mkdir(dirname(path), { recursive: true });
            await writeJson(path, data);
          }, 'a/data.json'),
        package: ({ default: fse }) => writes((path, data) => fse.outputJson(path, data, { spaces: 2 }), 'a/data.json'),
      },
      outputFile: {
        native: () => outputs(output),
        package: ({ default: fse }) => outputs(fse.outputFile),
      },
      'outputFile: writeFile alone': {
        gap: 'writeFile fails with ENOENT when the parent directory does not exist; outputFile creates it',
        native: () => inScratch({}, (dir) => outcome(() => writeFile(join(dir, 'a/b/out.txt'), 'hi'), codeOrName)),
        package: ({ default: fse }) => inScratch({}, (dir) => outcome(() => fse.outputFile(join(dir, 'a/b/out.txt'), 'hi'), codeOrName)),
      },
      outputFileSync: {
        native: () =>
          outputs((path, text) => {
            mkdirSync(dirname(path), { recursive: true });
            writeFileSync(path, text);
          }),
        package: ({ default: fse }) => outputs(fse.outputFileSync),
      },
      ensureFile: {
        native: () =>
          ensures(async (path) => {
            await mkdir(dirname(path), { recursive: true });
            await writeFile(path, '', { flag: 'a' });
          }),
        package: ({ default: fse }) => ensures(fse.ensureFile),
      },
    },
  },
};
