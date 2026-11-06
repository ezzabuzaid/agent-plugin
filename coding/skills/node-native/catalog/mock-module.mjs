// Module mocking: load a module with one of its dependencies replaced.
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { mock } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { inScratch } from './support/scratch.mjs';

// `lib` reports what its dependency gives it; `dep` has two exports.
const files = {
  'dep.mjs': "export const greet = () => 'real greet';\nexport const name = 'real name';\n",
  'lib.mjs': "import * as dep from './dep.mjs';\nexport const report = () => [dep.greet(), dep.name];\n",
  'dep.cjs': "exports.greet = () => 'real greet';\nexports.name = 'real name';\n",
  'lib.cjs': "const dep = require('./dep.cjs');\nexports.report = () => [dep.greet(), dep.name];\n",
};
const greet = () => 'fake greet';

// Imports lib.mjs (or requires lib.cjs) with dep mocked by node:test, and reads
// dep directly while the mock is on. `exports` gets the real dep, so a mock
// can keep what it does not replace.
const natively = (kind, exports) =>
  inScratch(files, async (dir) => {
    const dep = pathToFileURL(join(dir, `dep.${kind}`)).href;
    const real = kind === 'mjs' ? await import(dep) : createRequire(dep)('./dep.cjs');
    const mocked = mock.module(dep, { exports: exports(real) });
    try {
      const lib =
        kind === 'mjs' ? await import(pathToFileURL(join(dir, 'lib.mjs')).href) : createRequire(dep)('./lib.cjs');
      const direct = kind === 'mjs' ? await import(dep) : createRequire(dep)('./dep.cjs');
      return { report: lib.report(), dependencyElsewhere: direct.greet() };
    } finally {
      mocked.restore();
    }
  });
const reportOnly = async (run) => (await run).report;
// proxyquire resolves stubs against the module that required it and keeps
// noCallThru() on its instance; a require from inside the scratch directory
// gives a fresh instance with that parent.
const proxyquireIn = (dir, url) => createRequire(join(dir, 'lib.cjs'))(fileURLToPath(url));

export default {
  apis: ['test:mock.module', 'test:MockModuleContext'],
  reviewedAt: 'v26.13.0',
  flags: ['--experimental-test-module-mocks'],
  replaces: {
    'esmock@3.0.0': {
      strict: {
        native: () => reportOnly(natively('mjs', () => ({ greet }))),
        package: ({ strict }) =>
          inScratch(files, async (dir) => {
            const lib = await strict(join(dir, 'lib.mjs'), { [join(dir, 'dep.mjs')]: { greet } });
            return lib.report();
          }),
      },
      default: {
        native: () => reportOnly(natively('mjs', (real) => ({ ...real, greet }))),
        package: ({ default: esmock }) =>
          inScratch(files, async (dir) => {
            const lib = await esmock(join(dir, 'lib.mjs'), { [join(dir, 'dep.mjs')]: { greet } });
            return lib.report();
          }),
      },
      'default: partial mock': {
        gap: 'mock.module replaces every export; esmock keeps the exports a mock leaves out',
        native: () => reportOnly(natively('mjs', () => ({ greet }))),
        package: ({ default: esmock }) =>
          inScratch(files, async (dir) => {
            const lib = await esmock(join(dir, 'lib.mjs'), { [join(dir, 'dep.mjs')]: { greet } });
            return lib.report();
          }),
      },
      'default: scope': {
        gap: 'mock.module mocks the dependency for every importer until restore(); esmock mocks it only inside the module it loads',
        native: async () => (await natively('mjs', () => ({ greet }))).dependencyElsewhere,
        package: ({ default: esmock }) =>
          inScratch(files, async (dir) => {
            await esmock(join(dir, 'lib.mjs'), { [join(dir, 'dep.mjs')]: { greet } });
            return (await import(pathToFileURL(join(dir, 'dep.mjs')).href)).greet();
          }),
      },
    },
    'proxyquire@2.1.3': {
      noCallThru: {
        native: () => reportOnly(natively('cjs', () => ({ greet }))),
        package: (_, { url }) =>
          inScratch(files, (dir) => proxyquireIn(dir, url).noCallThru()('./lib.cjs', { './dep.cjs': { greet } }).report()),
      },
      default: {
        native: () => reportOnly(natively('cjs', (real) => ({ ...real, greet }))),
        package: (_, { url }) =>
          inScratch(files, (dir) => proxyquireIn(dir, url)('./lib.cjs', { './dep.cjs': { greet } }).report()),
      },
      'default: call thru': {
        gap: 'mock.module replaces every export; proxyquire calls through to the real module for the exports a stub leaves out',
        native: () => reportOnly(natively('cjs', () => ({ greet }))),
        package: (_, { url }) =>
          inScratch(files, (dir) => proxyquireIn(dir, url)('./lib.cjs', { './dep.cjs': { greet } }).report()),
      },
    },
  },
};
