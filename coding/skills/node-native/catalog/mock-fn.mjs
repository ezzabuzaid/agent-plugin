// Test doubles for a function: record every call, replace what it returns.
import { mock } from 'node:test';
import { join } from 'node:path';
import { runTestFile } from './support/node-test.mjs';
import { inScratch } from './support/scratch.mjs';

// What a test double reports after `exercise` calls it: how often, with which
// arguments, and what each call returned or threw.
const calls = (fn) =>
  fn.mock.calls.map((call) => ({ args: call.arguments, result: call.error ? `threw ${call.error.message}` : call.result }));
const exercise = (fn) => {
  for (const args of [[1], [2, 'b']]) {
    try {
      fn(...args);
    } catch {
      // the double records the throw
    }
  }
  return fn;
};
const native = (...setup) => calls(exercise(mock.fn(...setup)));
const fail = () => {
  throw new Error('no');
};

// Runs one test file with node:test and reports each test as pass or fail.
const outcomes = (source) =>
  inScratch({ 'probe.test.mjs': source }, async (dir) => (await runTestFile(join(dir, 'probe.test.mjs'))).outcomes);
// Each case calls a double with (1) then (2, 'b') and asserts one thing about it.
const callAssertions = {
  called: ['called(fn)', true],
  calledNever: ['called(fn)', false],
  callCount: ['callCount(fn, 2)', true],
  callCountWrong: ['callCount(fn, 1)', true],
  lastCalledWith: ["lastCalledWith(fn, 2, 'b')", true],
  lastCalledWithWrong: ['lastCalledWith(fn, 1)', true],
  nthCalledWith: ['nthCalledWith(fn, 1, 1)', true],
  nthCalledWithWrong: ['nthCalledWith(fn, 2, 1)', true],
};
const nativeAssertions = () =>
  outcomes(
    [
      "import { test } from 'node:test';",
      ...Object.entries(callAssertions).map(
        ([name, [assertion, call]]) =>
          `test('${name}', (t) => { const fn = t.mock.fn(); ${call ? "fn(1); fn(2, 'b');" : ''} t.assert.${assertion}; });`,
      ),
    ].join('\n'),
  );
const sinonAssertions = (sinon) => {
  const checks = {
    called: (spy) => sinon.assert.called(spy),
    calledNever: (spy) => sinon.assert.called(spy),
    callCount: (spy) => sinon.assert.callCount(spy, 2),
    callCountWrong: (spy) => sinon.assert.callCount(spy, 1),
    lastCalledWith: (spy) => sinon.assert.calledWithExactly(spy.lastCall, 2, 'b'),
    lastCalledWithWrong: (spy) => sinon.assert.calledWithExactly(spy.lastCall, 1),
    nthCalledWith: (spy) => sinon.assert.calledWithExactly(spy.getCall(0), 1),
    nthCalledWithWrong: (spy) => sinon.assert.calledWithExactly(spy.getCall(1), 1),
  };
  return Object.fromEntries(
    Object.entries(checks).map(([name, check]) => {
      const spy = sinon.spy();
      if (callAssertions[name][1]) {
        spy(1);
        spy(2, 'b');
      }
      try {
        check(spy);
        return [name, 'pass'];
      } catch {
        return [name, 'fail'];
      }
    }),
  );
};

export default {
  apis: [
    'test:mock.fn',
    'test:MockFunctionContext',
    'test:ctx.callCount',
    'test:ctx.mockImplementation',
    'test:ctx.mockImplementationOnce',
    'test:ctx.resetCalls',
    'test:context.assert.called',
    'test:context.assert.callCount',
    'test:context.assert.lastCalledWith',
    'test:context.assert.nthCalledWith',
  ],
  reviewedAt: 'v26.13.0',
  replaces: {
    'sinon@22.1.0': {
      spy: {
        native: () => native(),
        package: ({ default: sinon }) => {
          const spy = exercise(sinon.spy());
          return spy.getCalls().map((call) => ({ args: call.args, result: call.returnValue }));
        },
      },
      'spy: wraps a function': {
        native: () => native((a, b = 'x') => `${a}${b}`),
        package: ({ default: sinon }) => {
          const spy = exercise(sinon.spy((a, b = 'x') => `${a}${b}`));
          return spy.getCalls().map((call) => ({ args: call.args, result: call.returnValue }));
        },
      },
      'spy: this': {
        native: () => {
          const fn = mock.fn();
          const target = { fn };
          target.fn();
          return fn.mock.calls[0].this === target;
        },
        package: ({ default: sinon }) => {
          const target = { fn: sinon.spy() };
          target.fn();
          return target.fn.thisValues[0] === target;
        },
      },
      stub: {
        native: () => native(() => 'value'),
        package: ({ default: sinon }) => {
          const stub = exercise(sinon.stub().returns('value'));
          return stub.getCalls().map((call) => ({ args: call.args, result: call.returnValue }));
        },
      },
      'stub: throws': {
        native: () => native(fail),
        package: ({ default: sinon }) => {
          const stub = exercise(sinon.stub().throws(new Error('no')));
          return stub.getCalls().map((call) => ({ args: call.args, result: `threw ${call.exception.message}` }));
        },
      },
      'stub: onCall': {
        native: () => {
          const fn = mock.fn(() => 'later');
          fn.mock.mockImplementationOnce(() => 'first', 0);
          return calls(exercise(fn));
        },
        package: ({ default: sinon }) => {
          const stub = sinon.stub().returns('later');
          stub.onCall(0).returns('first');
          return exercise(stub)
            .getCalls()
            .map((call) => ({ args: call.args, result: call.returnValue }));
        },
      },
      'stub: withArgs': {
        gap: 'a mock function has one implementation for every call; sinon picks a behaviour by the arguments (withArgs)',
        native: () => {
          const fn = mock.fn(() => 'default');
          return [fn(1), fn(2)];
        },
        package: ({ default: sinon }) => {
          const stub = sinon.stub().returns('default');
          stub.withArgs(1).returns('one');
          return [stub(1), stub(2)];
        },
      },
      fake: {
        native: () => native(() => 'value'),
        package: ({ default: sinon }) => {
          const fake = exercise(sinon.fake.returns('value'));
          return fake.getCalls().map((call) => ({ args: call.args, result: call.returnValue }));
        },
      },
      resetHistory: {
        native: () => {
          const fn = exercise(mock.fn());
          fn.mock.resetCalls();
          return fn.mock.callCount();
        },
        package: ({ default: sinon }) => {
          const spy = exercise(sinon.spy());
          spy.resetHistory();
          return spy.callCount;
        },
      },
      assert: {
        native: nativeAssertions,
        package: ({ default: sinon }) => sinonAssertions(sinon),
      },
    },
    'jest-mock@30.5.2': {
      fn: {
        native: () => native((a) => a * 2),
        package: ({ fn }) => {
          const double = exercise(fn((a) => a * 2));
          return double.mock.calls.map((args, index) => ({ args, result: double.mock.results[index].value }));
        },
      },
      'fn: throws': {
        native: () => native(fail),
        package: ({ fn }) => {
          const double = exercise(fn(fail));
          return double.mock.calls.map((args, index) => ({
            args,
            result: `threw ${double.mock.results[index].value.message}`,
          }));
        },
      },
      'fn: mockReturnValueOnce': {
        native: () => {
          const fn = mock.fn(() => 'later');
          fn.mock.mockImplementationOnce(() => 'first');
          return calls(exercise(fn));
        },
        package: ({ fn }) => {
          const double = exercise(fn(() => 'later').mockReturnValueOnce('first'));
          return double.mock.calls.map((args, index) => ({ args, result: double.mock.results[index].value }));
        },
      },
      'fn: mockImplementation': {
        native: () => {
          const fn = mock.fn(() => 'before');
          fn.mock.mockImplementation(() => 'after');
          return calls(exercise(fn));
        },
        package: ({ fn }) => {
          const double = exercise(fn(() => 'before').mockImplementation(() => 'after'));
          return double.mock.calls.map((args, index) => ({ args, result: double.mock.results[index].value }));
        },
      },
      'fn: mockClear': {
        native: () => {
          const fn = exercise(mock.fn());
          fn.mock.resetCalls();
          return fn.mock.callCount();
        },
        package: ({ fn }) => exercise(fn()).mockClear().mock.calls.length,
      },
      'fn: mockReturnValueOnce queue': {
        gap: 'mockImplementationOnce replaces one call (the next, or the one numbered onCall); jest queues each Once in turn',
        native: () => {
          const fn = mock.fn(() => 'later');
          fn.mock.mockImplementationOnce(() => 'first');
          fn.mock.mockImplementationOnce(() => 'second');
          return [fn(), fn(), fn()];
        },
        package: ({ fn }) => {
          const double = fn(() => 'later').mockReturnValueOnce('first').mockReturnValueOnce('second');
          return [double(), double(), double()];
        },
      },
    },
    'tinyspy@4.0.6': {
      spy: {
        native: () => native((a) => a * 2),
        package: ({ spy }) => {
          const double = exercise(spy((a) => a * 2));
          return double.calls.map((args, index) => ({ args, result: double.results[index][1] }));
        },
      },
      'spy: reset': {
        native: () => {
          const fn = exercise(mock.fn());
          fn.mock.resetCalls();
          return fn.mock.callCount();
        },
        package: ({ spy }) => {
          const double = exercise(spy());
          double.reset();
          return double.callCount;
        },
      },
    },
    'testdouble@4.0.0': {
      func: {
        native: () => mock.fn()(1),
        package: ({ func }) => func()(1),
      },
      'func: call count': {
        native: () => exercise(mock.fn()).mock.callCount(),
        package: ({ explain, func }) => explain(exercise(func())).callCount,
      },
      'when: arguments': {
        gap: 'a mock function has one implementation for every call; td.when stubs a return value for given arguments',
        native: () => {
          const fn = mock.fn(() => undefined);
          return [fn(1), fn(2)];
        },
        package: ({ func, when }) => {
          const fn = func();
          when(fn(1)).thenReturn('one');
          return [fn(1), fn(2)];
        },
      },
    },
  },
  idioms: {
    handRolledSpy: {
      seed: '(\\w+)\\s*=\\s*\\[\\][\\s\\S]{0,80}=>\\s*\\{?\\s*\\1\\.push\\(',
      native: () => exercise(mock.fn()).mock.calls.map((call) => call.arguments),
      idiom: () => {
        const seen = [];
        exercise((...args) => seen.push(args));
        return seen;
      },
    },
  },
};
