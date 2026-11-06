// Deep equality assertions: pass when two values are structurally equal, fail
// with an AssertionError otherwise.
import assert from 'node:assert/strict';
import { verdict } from './support/assertion.mjs';

class Point {
  constructor() {
    this.x = 1;
  }
}
// [1, <hole>, 3]
const holey = () => {
  const array = [1];
  array[2] = 3;
  return array;
};
const cyclic = () => {
  const value = { n: 1 };
  value.self = value;
  return value;
};

// Each case is a pair; every probe builds fresh values.
const cases = {
  nested: () => [{ a: [1, { b: 2 }], at: new Date(0) }, { a: [1, { b: 2 }], at: new Date(0) }],
  different: () => [{ a: 1 }, { a: 2 }],
  nan: () => [NaN, NaN],
  negativeZero: () => [0, -0],
  prototype: () => [new Point(), { x: 1 }],
  nullPrototype: () => [Object.assign(Object.create(null), { a: 1 }), { a: 1 }],
  map: () => [new Map([[1, { a: 1 }]]), new Map([[1, { a: 1 }]])],
  mapValues: () => [new Map([[1, 1]]), new Map([[1, 2]])],
  set: () => [new Set([1, 2]), new Set([2, 1])],
  setOfObjects: () => [new Set([{ a: 1 }]), new Set([{ a: 1 }])],
  regexpFlags: () => [/a/g, /a/i],
  typedArray: () => [new Uint8Array([1, 2]), new Uint8Array([1, 2])],
  sparseArray: () => [holey(), [1, undefined, 3]],
  undefinedKey: () => [{ a: undefined }, {}],
  boxedNumber: () => [new Number(1), new Number(2)],
  symbolKey: () => [{ [Symbol.for('s')]: 1 }, { [Symbol.for('s')]: 2 }],
  errorMessage: () => [new Error('a'), new Error('b')],
  numberString: () => [1, '1'],
  date: () => [new Date(0), new Date(1)],
  arrayLike: () => [[1], { 0: 1, length: 1 }],
  cycle: () => [cyclic(), cyclic()],
};
const gapText = {
  prototype: 'native fails on a different prototype (a class instance vs a plain object); the package ignores prototypes',
  nullPrototype: 'native fails on a null-prototype object vs a plain one; the package ignores prototypes',
  sparseArray: 'native tells a hole from an undefined element; the package calls them equal',
  undefinedKey: 'native fails on a key holding undefined vs a missing key; toEqual calls them equal',
};
const skipPrototype = new assert.Assert({ skipPrototype: true });

// A mapping over every case the package agrees on, a mapping through
// skipPrototype for prototype cases, and a gap for each case it disagrees on.
const family = (name, check, disagree) => {
  const prototypeCases = ['prototype', 'nullPrototype'].filter((key) => disagree.includes(key));
  const agree = Object.keys(cases).filter((key) => !disagree.includes(key));
  return {
    [name]: {
      native: () => agree.map((key) => verdict(() => assert.deepStrictEqual(...cases[key]()))),
      package: (module) => agree.map((key) => verdict(() => check(module, ...cases[key]()))),
    },
    ...(prototypeCases.length > 0 && {
      [`${name}: skipPrototype`]: {
        native: () => prototypeCases.map((key) => verdict(() => skipPrototype.deepStrictEqual(...cases[key]()))),
        package: (module) => prototypeCases.map((key) => verdict(() => check(module, ...cases[key]()))),
      },
    }),
    ...Object.fromEntries(
      disagree.map((key) => [
        `${name}: ${key}`,
        {
          gap: gapText[key],
          native: () => verdict(() => assert.deepStrictEqual(...cases[key]())),
          package: (module) => verdict(() => check(module, ...cases[key]())),
        },
      ]),
    ),
  };
};
const unequal = [cases.different, cases.mapValues, cases.date];
const looseChai = ['prototype', 'nullPrototype', 'sparseArray'];

export default {
  apis: ['assert:assert.deepStrictEqual', 'assert:assert.notDeepStrictEqual', 'assert:new assert.Assert'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'chai@6.3.0': {
      ...family('assert', ({ assert: chai }, a, b) => chai.deepStrictEqual(a, b), looseChai),
      ...family('expect', ({ expect }, a, b) => expect(a).to.deep.equal(b), looseChai),
      'assert: notDeepEqual': {
        native: () => unequal.map((pair) => verdict(() => assert.notDeepStrictEqual(...pair()))),
        package: ({ assert: chai }) => unequal.map((pair) => verdict(() => chai.notDeepEqual(...pair()))),
      },
    },
    'expect@30.5.2': {
      ...family('expect', ({ expect }, a, b) => expect(a).toStrictEqual(b), []),
      ...family('expect: toEqual', ({ expect }, a, b) => expect(a).toEqual(b), [...looseChai, 'undefinedKey']),
      'expect: not': {
        native: () => unequal.map((pair) => verdict(() => assert.notDeepStrictEqual(...pair()))),
        package: ({ expect }) => unequal.map((pair) => verdict(() => expect(pair()[0]).not.toStrictEqual(pair()[1]))),
      },
      'expect: asymmetric matchers': {
        gap: 'deepStrictEqual compares exact values; expect accepts matchers such as expect.any(Number) inside the expected value',
        native: () => verdict(() => assert.deepStrictEqual({ id: 7, name: 'x' }, { id: Number, name: 'x' })),
        package: ({ expect }) => verdict(() => expect({ id: 7, name: 'x' }).toStrictEqual({ id: expect.any(Number), name: 'x' })),
      },
    },
  },
};
