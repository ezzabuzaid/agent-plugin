// A fast UTF-8 file writer with optional synchronous writes (the sonic-boom design).
import { Utf8Stream } from 'node:fs';
import { mkdtempDisposable, readFile, realpath, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Writes three lines through `make({ dest, ...options })`, waits for close, and returns the file text.
const written = async (make, options = {}, target = 'out.log') => {
  await using scratch = await mkdtempDisposable(join(tmpdir(), 'node-native-utf8-'));
  const dest = join(await realpath(scratch.path), target);
  await writeFile(join(await realpath(scratch.path), 'out.log'), 'old\n');
  const stream = make({ dest, ...options });
  const closed = new Promise((resolve, reject) => {
    stream.once('close', resolve);
    stream.once('error', reject);
  });
  if (!options.sync) await new Promise((resolve) => stream.once('ready', resolve));
  for (const line of ['a', 'b', 'ü']) stream.write(`${line}\n`);
  stream.end();
  await closed;
  return readFile(dest, 'utf8');
};
const native = (options) => new Utf8Stream(options);

export default {
  apis: ['fs:fs.Utf8Stream', 'fs:new fs.Utf8Stream', 'fs:utf8Stream.write', 'fs:utf8Stream.end'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'sonic-boom@5.0.2': {
      default: {
        native: () => written(native),
        package: ({ default: SonicBoom }) => written((options) => new SonicBoom(options)),
      },
      'default: sync': {
        native: () => written(native, { sync: true }),
        package: ({ default: SonicBoom }) => written((options) => new SonicBoom(options), { sync: true }),
      },
      'default: append false': {
        native: () => written(native, { append: false }),
        package: ({ default: SonicBoom }) => written((options) => new SonicBoom(options), { append: false }),
      },
      'default: mkdir': {
        native: () => written(native, { mkdir: true }, 'logs/out.log'),
        package: ({ default: SonicBoom }) => written((options) => new SonicBoom(options), { mkdir: true }, 'logs/out.log'),
      },
    },
  },
};
