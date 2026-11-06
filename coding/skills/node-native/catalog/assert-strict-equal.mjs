// Identity and truthiness assertions: strictEqual and notStrictEqual compare
// with Object.is, ok passes for a truthy value, fail always fails.
import assert from 'node:assert/strict';
import { verdict } from './support/assertion.mjs';

const pairs = {
  same: () => [1, 1],
  different: () => [1, 2],
  numberString: () => [1, '1'],
  objects: () => [{}, {}],
  symbol: () => [Symbol.for('a'), Symbol.for('a')],
  nan: () => [NaN, NaN],
  negativeZero: () => [0, -0],
};
const values = [1, 0, '', 'x', null, [], NaN];
const compared = (check, keys = Object.keys(pairs)) => keys.map((key) => verdict(() => check(...pairs[key]())));
const sameValueCases = ['same', 'different', 'numberString', 'objects', 'symbol'];
const objectIsText = {
  nan: 'native compares with Object.is, so NaN equals NaN; chai compares with === and fails',
  negativeZero: 'native compares with Object.is, so 0 and -0 differ; chai compares with === and passes',
};

export default {
  apis: ['assert:assert.strictEqual', 'assert:assert.notStrictEqual', 'assert:assert.ok', 'assert:assert.fail'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'chai@6.3.0': {
      assert: {
        native: () => [
          ...compared(assert.strictEqual, sameValueCases),
          ...compared(assert.notStrictEqual, sameValueCases),
          ...values.map((value) => verdict(() => assert.ok(value))),
          verdict(() => assert.fail('no')),
        ],
        package: ({ assert: chai }) => [
          ...compared(chai.strictEqual, sameValueCases),
          ...compared(chai.notStrictEqual, sameValueCases),
          ...values.map((value) => verdict(() => chai.ok(value))),
          verdict(() => chai.fail('no')),
        ],
      },
      ...Object.fromEntries(
        Object.entries(objectIsText).map(([key, gap]) => [
          `assert: ${key}`,
          {
            gap,
            native: () => [...compared(assert.strictEqual, [key]), ...compared(assert.notStrictEqual, [key])],
            package: ({ assert: chai }) => [...compared(chai.strictEqual, [key]), ...compared(chai.notStrictEqual, [key])],
          },
        ]),
      ),
    },
    'expect@30.5.2': {
      expect: {
        native: () => [
          ...compared(assert.strictEqual),
          ...compared(assert.notStrictEqual),
          ...values.map((value) => verdict(() => assert.ok(value))),
        ],
        package: ({ expect }) => [
          ...compared((a, b) => expect(a).toBe(b)),
          ...compared((a, b) => expect(a).not.toBe(b)),
          ...values.map((value) => verdict(() => expect(value).toBeTruthy())),
        ],
      },
    },
  },
};
