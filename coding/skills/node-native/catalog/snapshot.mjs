// Snapshot testing: the first run records a value in a snapshot file, later
// runs fail when the value no longer matches it.
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { runTestFile } from './support/node-test.mjs';
import { inScratch } from './support/scratch.mjs';

// Runs a test file that snapshots `value` (source text) with node:test, in a
// child process; `update` passes --test-update-snapshots. Reports pass or fail.
const nativeRun = async (dir, value, { update = false, serializer } = {}) => {
  const file = join(dir, 'value.test.mjs');
  const options = serializer ? `, { serializers: [${serializer}] }` : '';
  const source = `import { test } from 'node:test';\nimport { inspect } from 'node:util';\ntest('value', (t) => t.assert.snapshot(${value}${options}));\n`;
  await writeFile(file, source);
  const { outcomes } = await runTestFile(file, { execArgv: update ? ['--test-update-snapshots'] : [] });
  return outcomes.value;
};
// The same with jest-snapshot's SnapshotState, saved after every match.
const jestRun = (SnapshotState, dir, value, { update = false } = {}) => {
  const state = new SnapshotState(join(dir, '__snapshots__', 'value.test.snap'), {
    updateSnapshot: update ? 'all' : 'none',
    snapshotFormat: {},
    rootDir: dir,
  });
  const { pass } = state.match({ testName: 'value', received: value });
  state.save();
  return pass ? 'pass' : 'fail';
};

// record, then the same value, then a changed one; and a value never recorded.
const nativeLifecycle = (first, changed, options = {}) =>
  inScratch({}, async (dir) => [
    await nativeRun(dir, first, { ...options, update: true }),
    await nativeRun(dir, first, options),
    await nativeRun(dir, changed, options),
    await inScratch({}, (fresh) => nativeRun(fresh, first, options)),
  ]);
const jestLifecycle = (SnapshotState, first, changed) =>
  inScratch({}, async (dir) => [
    jestRun(SnapshotState, dir, first, { update: true }),
    jestRun(SnapshotState, dir, first),
    jestRun(SnapshotState, dir, changed),
    await inScratch({}, (fresh) => jestRun(SnapshotState, fresh, first)),
  ]);

export default {
  apis: ['test:context.assert.snapshot', 'cli:--test-update-snapshots'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'jest-snapshot@30.5.2': {
      SnapshotState: {
        native: () => nativeLifecycle("{ id: 1, tags: ['a'] }", "{ id: 2, tags: ['a'] }"),
        package: ({ SnapshotState }) => jestLifecycle(SnapshotState, { id: 1, tags: ['a'] }, { id: 2, tags: ['a'] }),
      },
      'SnapshotState: Map': {
        gap: 'the default serializer is JSON.stringify, which writes a Map as {}, so a changed Map still matches; jest serializes the entries',
        native: () => nativeLifecycle("new Map([['a', 1]])", "new Map([['a', 2]])"),
        package: ({ SnapshotState }) => jestLifecycle(SnapshotState, new Map([['a', 1]]), new Map([['a', 2]])),
      },
      'SnapshotState: Map with a serializer': {
        native: () => nativeLifecycle("new Map([['a', 1]])", "new Map([['a', 2]])", { serializer: '(value) => inspect(value)' }),
        package: ({ SnapshotState }) => jestLifecycle(SnapshotState, new Map([['a', 1]]), new Map([['a', 2]])),
      },
    },
  },
};
