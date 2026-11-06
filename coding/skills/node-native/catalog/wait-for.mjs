// Polling in a test: call a condition until it succeeds or a timeout passes.
import { join } from 'node:path';
import { runTestFile } from './support/node-test.mjs';
import { inScratch } from './support/scratch.mjs';

// Each test waits on one condition with t.waitFor and stores how it settled
// and how often the condition ran in `results`, which the probe reads back.
const source = `
import { test } from 'node:test';
export const results = {};
const settle = async (t, name, condition, options) => {
  const state = { calls: 0 };
  try {
    const value = await t.waitFor(() => condition(++state.calls), { interval: 1, ...options });
    results[name] = { settled: 'resolved', value, calls: state.calls };
  } catch {
    results[name] = { settled: 'rejected', calls: state.calls };
  }
};
const notYet = () => {
  throw new Error('not yet');
};
test('eventually', (t) => settle(t, 'eventually', (calls) => (calls < 3 ? notYet() : 'ready')));
test('never', (t) => settle(t, 'never', notYet, { timeout: 20 }));
test('falsy', (t) => settle(t, 'falsy', (calls) => calls >= 3, { timeout: 200 }));
`;
const nativeResults = () =>
  inScratch({ 'wait.test.mjs': source }, async (dir) => {
    const { exports } = await runTestFile(join(dir, 'wait.test.mjs'), { isolation: 'none' });
    return exports.results;
  });
// What a package's wait did: how it settled and how often the condition ran.
const settle = async (wait, condition) => {
  const state = { calls: 0 };
  try {
    await wait(() => condition(++state.calls));
    return { settled: 'resolved', calls: state.calls };
  } catch {
    return { settled: 'rejected', calls: state.calls };
  }
};
const without = ({ value, ...rest }) => rest;
const rejectedOnly = ({ settled }) => settled;
const notYet = () => {
  throw new Error('not yet');
};
// p-wait-for polls a boolean; t.waitFor polls until the condition stops throwing.
const passes = (condition) => {
  try {
    condition();
    return true;
  } catch {
    return false;
  }
};

export default {
  apis: ['test:context.waitFor'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'wait-for-expect@4.0.0': {
      default: {
        native: async () => without((await nativeResults()).eventually),
        package: ({ default: { default: waitForExpect } }) =>
          settle(
            (expectation) => waitForExpect(expectation, 1000, 1),
            (calls) => {
              if (calls < 3) notYet();
            },
          ),
      },
      'default: timeout': {
        native: async () => rejectedOnly((await nativeResults()).never),
        package: async ({ default: { default: waitForExpect } }) =>
          rejectedOnly(await settle((expectation) => waitForExpect(expectation, 20, 1), notYet)),
      },
    },
    'p-wait-for@7.0.0': {
      default: {
        native: async () => without((await nativeResults()).eventually),
        package: ({ default: pWaitFor }) =>
          settle(
            (condition) => pWaitFor(() => passes(condition), { interval: 1, timeout: 1000 }),
            (calls) => {
              if (calls < 3) notYet();
            },
          ),
      },
      'default: timeout': {
        native: async () => rejectedOnly((await nativeResults()).never),
        package: async ({ default: pWaitFor }) =>
          rejectedOnly(await settle((condition) => pWaitFor(condition, { interval: 1, timeout: 20 }), () => false)),
      },
      'default: false result': {
        gap: 't.waitFor resolves as soon as the condition returns, even false; p-wait-for keeps polling until it returns true',
        native: async () => without((await nativeResults()).falsy),
        package: ({ default: pWaitFor }) =>
          settle((condition) => pWaitFor(condition, { interval: 1, timeout: 200 }), (calls) => calls >= 3),
      },
      resolveWith: {
        native: async () => (await nativeResults()).eventually.value,
        package: ({ default: pWaitFor }) => {
          let calls = 0;
          return pWaitFor(() => (++calls < 3 ? false : pWaitFor.resolveWith('ready')), { interval: 1 });
        },
      },
    },
  },
};
