// Partial deep equality assertions: pass when the actual value holds everything
// the expected value describes, fail with an AssertionError otherwise.
import assert from 'node:assert/strict';
import { verdict } from './support/assertion.mjs';

class Point {
  constructor() {
    this.x = 1;
    this.y = 2;
  }
}
// [actual, expected] pairs; every probe builds fresh values.
const cases = {
  subset: () => [{ a: 1, b: { c: 2, d: 3 } }, { b: { c: 2 } }],
  mismatch: () => [{ a: 1 }, { a: 2 }],
  missingKey: () => [{ a: 1 }, { b: 1 }],
  arrayPrefix: () => [{ a: [1, 2, 3] }, { a: [1] }],
  arrayMember: () => [{ a: [1, 2, 3] }, { a: [2] }],
  topLevelArray: () => [[1, 2, 3], [1, 3]],
  arrayOfObjects: () => [{ a: [{ x: 1, y: 2 }, { x: 2, y: 3 }] }, { a: [{ x: 1 }, { x: 2 }] }],
  set: () => [new Set([1, 2, 3]), new Set([2])],
  setMismatch: () => [new Set([1, 2, 3]), new Set([5])],
  map: () => [new Map([[1, 1], [2, 2]]), new Map([[2, 2]])],
  nan: () => [{ a: NaN }, { a: NaN }],
  negativeZero: () => [{ a: 0 }, { a: -0 }],
  missingUndefined: () => [{}, { a: undefined }],
  classInstance: () => [new Point(), { x: 1 }],
  date: () => [{ at: new Date(0) }, { at: new Date(0) }],
};
const gapText = {
  arrayPrefix: 'an expected array matches any actual array holding its elements; toMatchObject needs the same length',
  arrayMember: 'an expected array matches any actual array holding its elements; toMatchObject needs the same length',
  topLevelArray: 'an expected array matches any actual array holding its elements; toMatchObject needs the same length',
  set: 'an expected Set matches an actual Set that holds its members; toMatchObject needs equal Sets',
  map: 'an expected Map matches an actual Map that holds its entries; toMatchObject needs equal Maps',
  nan: 'native calls NaN equal to NaN; containSubset does not',
  negativeZero: 'native tells 0 from -0; containSubset calls them equal',
  missingUndefined: 'native fails when an expected key holding undefined is missing; containSubset passes',
};
const improvesText = {
  setMismatch: 'native compares Set members, so a missing member fails; containSubset compares a Set as an object with no keys and always passes',
};
const family = (name, check, disagree) => {
  const agree = Object.keys(cases).filter((key) => !disagree.includes(key));
  return {
    [name]: {
      native: () => agree.map((key) => verdict(() => assert.partialDeepStrictEqual(...cases[key]()))),
      package: (module) => agree.map((key) => verdict(() => check(module, ...cases[key]()))),
    },
    ...Object.fromEntries(
      disagree.map((key) => [
        `${name}: ${key}`,
        {
          ...(key in improvesText ? { improves: improvesText[key] } : { gap: gapText[key] }),
          native: () => verdict(() => assert.partialDeepStrictEqual(...cases[key]())),
          package: (module) => verdict(() => check(module, ...cases[key]())),
        },
      ]),
    ),
  };
};

export default {
  apis: ['assert:assert.partialDeepStrictEqual'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'expect@30.5.2': family('expect', ({ expect }, actual, expected) => expect(actual).toMatchObject(expected), [
      'arrayPrefix',
      'arrayMember',
      'topLevelArray',
      'set',
      'map',
    ]),
    'chai@6.3.0': family('assert', ({ assert: chai }, actual, expected) => chai.containSubset(actual, expected), [
      'setMismatch',
      'nan',
      'negativeZero',
      'missingUndefined',
    ]),
  },
};
