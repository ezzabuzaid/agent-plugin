// Stack traces that point at the original source through its source map.
import { mkdtempDisposable, realpath, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { esm, output } from './support/child.mjs';


// fail.mjs is "compiled" from fail.ts: its `new Error` (line 1, column 33)
// comes from line 3, column 10 of fail.ts.
const map = { version: 3, sources: ['fail.ts'], names: [], mappings: 'AACA,gCACS' };
const compiled = [
  "export function fail() { return new Error('boom'); }",
  `//# sourceMappingURL=data:application/json;base64,${Buffer.from(JSON.stringify(map)).toString('base64')}`,
  '',
].join('\n');

// Writes fail.mjs into a fresh directory and returns the top stack frame of
// the error `stackOf` produces from it, with the directory replaced by <dir>.
async function topFrame(stackOf) {
  await using dir = await mkdtempDisposable(join(tmpdir(), 'node-native-map-'));
  const real = await realpath(dir.path);
  const file = join(real, 'fail.mjs');
  await writeFile(file, compiled);
  const stack = await stackOf(pathToFileURL(file).href);
  return stack.split('\n')[1].trim().replaceAll(real, '<dir>');
}

const nativeFrame = () =>
  topFrame(async (url) => {
    const program = `const module = await import(${JSON.stringify(url)}); process.stdout.write(module.fail().stack);`;
    return output(['--enable-source-maps', ...esm(program)]);
  });

const packageFrame = ({ default: support }) => {
  support.install();
  return topFrame(async (url) => (await import(url)).fail().stack);
};

export default {
  apis: ['cli:--enable-source-maps'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'source-map-support@0.5.21': {
      install: {
        native: nativeFrame,
        package: async (module) => (await packageFrame(module)).replace('file://', ''),
      },
      'install: file URL': {
        gap: 'the mapped frame names a path; source-map-support keeps the file: URL of an ES module',
        native: nativeFrame,
        package: packageFrame,
      },
    },
  },
};
