// A test runner: register suites, tests and hooks; skip, todo, only and name
// filters; run the files and report each outcome.
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { runTestFile } from './support/node-test.mjs';
import { inScratch } from './support/scratch.mjs';

// One suite, written for node:test and for mocha's BDD globals; the hooks and
// tests push to `order`, which the probe reads back from the loaded module.
const body = `
export const order = [];
describe('suite', () => {
  before(() => order.push('before'));
  after(() => order.push('after'));
  beforeEach(() => order.push('beforeEach'));
  afterEach(() => order.push('afterEach'));
  it('passes', () => order.push('passes'));
  it('fails', () => {
    order.push('fails');
    throw new Error('no');
  });
  SKIPPED
  TODO
  ONLY('focused', () => order.push('focused'));
});
`;
// `only` marks the last test it.only; `skipped` and `todo` add those tests.
const suite = (todoTest, { only = false, skipped = true, todo = true } = {}) =>
  body
    .replace('SKIPPED', skipped ? "it.skip('skipped', () => order.push('skipped'));" : '')
    .replace('TODO', todo ? todoTest : '')
    .replace('ONLY', only ? 'it.only' : 'it');
const nativeSuite = (options) =>
  `import { describe, it, before, after, beforeEach, afterEach } from 'node:test';\n${suite("it.todo('todo');", options)}`;
const mochaSuite = (options) => suite("it('todo');", options);

// Runs `source` with node:test's run(), in this process so the probe can read
// the module's `order`; reports { outcomes: { <test>: pass|fail|skip|todo }, order }.
const runNative = (source, options = {}) =>
  inScratch({ 'suite.test.mjs': source }, async (dir) => {
    const { outcomes, exports } = await runTestFile(join(dir, 'suite.test.mjs'), { isolation: 'none', ...options });
    return { outcomes, order: exports.order };
  });
// The same with mocha's programmatic API and a reporter that prints nothing.
const runMocha = ({ Mocha }, options = {}, tests = {}) =>
  inScratch({ 'suite.mjs': mochaSuite(tests) }, async (dir) => {
    const file = join(dir, 'suite.mjs');
    const mocha = new Mocha({ reporter: class Silent {}, ...options });
    mocha.addFile(file);
    await mocha.loadFilesAsync();
    const outcomes = {};
    await new Promise((resolve) => {
      const runner = mocha.run(resolve);
      runner.on('pass', (test) => (outcomes[test.title] = 'pass'));
      runner.on('fail', (test) => (outcomes[test.title] = 'fail'));
      runner.on('pending', (test) => (outcomes[test.title] = 'pending'));
    });
    mocha.dispose();
    const { order } = await import(pathToFileURL(file).href);
    return { outcomes, order };
  });
// mocha has one "pending" state for a skipped test and a test with no body.
const pending = (outcomes) =>
  Object.fromEntries(Object.entries(outcomes).map(([name, outcome]) => [name, /skip|todo/.test(outcome) ? 'pending' : outcome]));
const sorted = (outcomes) => Object.fromEntries(Object.entries(outcomes).sort(([a], [b]) => a.localeCompare(b)));

// tape: the same tests registered on a harness; t.plan cases included.
const tapeCases = [
  ['passes', {}, (t) => (t.ok(true), t.end())],
  ['fails', {}, (t) => (t.ok(false), t.end())],
  ['skipped', { skip: true }, (t) => t.end()],
  ['todo', { todo: true }, (t) => (t.ok(false), t.end())],
  ['plan met', {}, (t) => (t.plan(2), t.ok(true), t.ok(true))],
  ['plan short', {}, (t) => (t.plan(2), t.ok(true), t.end())],
  ['plan over', {}, (t) => (t.plan(1), t.ok(true), t.ok(true))],
];
const nativeTapeSuite = `import { test } from 'node:test';
test('passes', (t) => t.assert.ok(true));
test('fails', (t) => t.assert.ok(false));
test('skipped', { skip: true }, () => {});
test('todo', { todo: true }, (t) => t.assert.ok(false));
test('plan met', (t) => { t.plan(2); t.assert.ok(true); t.assert.ok(true); });
test('plan short', (t) => { t.plan(2); t.assert.ok(true); });
test('plan over', (t) => { t.plan(1); t.assert.ok(true); t.assert.ok(true); });
`;
const runTape = async ({ default: tape }) => {
  const harness = tape.createHarness();
  const names = [];
  const outcomes = {};
  harness.createStream({ objectMode: true }).on('data', (row) => {
    if (row.type === 'test') {
      names[row.id] = row.name;
      if (row.skip) outcomes[row.name] = 'skip';
      else if (row.todo) outcomes[row.name] = 'todo';
      else outcomes[row.name] = 'pass';
    }
    if (row.type === 'assert' && !row.ok && !row.todo) outcomes[names[row.test]] = 'fail';
  });
  for (const [name, options, test] of tapeCases) harness(name, options, test);
  await new Promise((resolve) => harness.onFinish(resolve));
  return outcomes;
};

export default {
  apis: [
    'test:test',
    'test:describe',
    'test:it',
    'test:before',
    'test:after',
    'test:beforeEach',
    'test:afterEach',
    'test:it.skip',
    'test:it.todo',
    'test:it.only',
    'test:test.skip',
    'test:test.todo',
    'test:context.plan',
    'test:run',
    'test:TestsStream',
    'cli:--test',
    'cli:--test-only',
    'cli:--test-name-pattern',
    'cli:--test-skip-pattern',
  ],
  reviewedAt: 'v26.13.0',
  replaces: {
    'mocha@12.0.3': {
      Mocha: {
        native: async () => sorted(pending((await runNative(nativeSuite())).outcomes)),
        package: async (module) => sorted((await runMocha(module)).outcomes),
      },
      'Mocha: todo': {
        gap: 'node:test reports a todo test apart from a skipped one; mocha reports both as pending',
        native: async () => (await runNative(nativeSuite())).outcomes.todo,
        package: async (module) => (await runMocha(module)).outcomes.todo,
      },
      'Mocha: hook order': {
        native: async () => (await runNative(nativeSuite({ todo: false }))).order,
        package: async (module) => (await runMocha(module, {}, { todo: false })).order,
      },
      'Mocha: hooks around a todo test': {
        gap: 'node:test runs beforeEach and afterEach around a todo test; mocha runs no hook for a pending test',
        native: async () => (await runNative(nativeSuite({ skipped: false }))).order,
        package: async (module) => (await runMocha(module, {}, { skipped: false })).order,
      },
      'Mocha: only': {
        native: async () => sorted((await runNative(nativeSuite({ only: true }), { only: true })).outcomes),
        package: async (module) => sorted((await runMocha(module, {}, { only: true })).outcomes),
      },
      'Mocha: grep': {
        native: async () => sorted(pending((await runNative(nativeSuite(), { testNamePatterns: ['passes|skipped'] })).outcomes)),
        package: async (module) => sorted((await runMocha(module, { grep: 'passes|skipped' })).outcomes),
      },
      'Mocha: invert': {
        native: async () => sorted(pending((await runNative(nativeSuite(), { testSkipPatterns: ['passes|skipped'] })).outcomes)),
        package: async (module) => sorted((await runMocha(module, { grep: 'passes|skipped', invert: true })).outcomes),
      },
    },
    'tape@5.10.3': {
      createHarness: {
        native: async () => (await runNative(nativeTapeSuite)).outcomes,
        package: runTape,
      },
    },
  },
};
