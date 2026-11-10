// Deep structural equality of two values.
import { isDeepStrictEqual } from 'node:util';

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
  regexp: () => [/a/g, /a/g],
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
};

const gapText = {
  negativeZero: '0 and -0 are different values natively (Object.is); the package calls them equal',
  sparseArray: 'a hole and an undefined element are different natively; the package calls them equal',
  symbolKey: 'native compares symbol keys; the package ignores them',
  numberString: 'the package compares loosely (1 == "1"); native compares strictly',
};
const improvesText = {
  mapValues: 'native compares Map entries, so Maps with different values differ; the package compares Maps as plain objects and calls them equal',
  boxedNumber: 'native compares the boxed value, so new Number(1) and new Number(2) differ; the package calls them equal',
  errorMessage: "native compares an error's message and name, so errors with different messages differ; the package calls them equal",
};

// A mapping over every case the package agrees on, and a gap for each one it does
// not; `elsewhere` names cases another row of the package covers.
const family = (call, disagree, elsewhere = []) => {
  const agree = Object.keys(cases).filter((name) => !disagree.includes(name) && !elsewhere.includes(name));
  return {
    [call.name]: {
      native: () => agree.map((name) => isDeepStrictEqual(...cases[name]())),
      package: (module) => agree.map((name) => call.compare(module, ...cases[name]())),
    },
    ...Object.fromEntries(
      disagree.map((name) => [
        `${call.name}: ${name}`,
        {
          ...(name in improvesText ? { improves: improvesText[name] } : { gap: gapText[name] }),
          native: () => isDeepStrictEqual(...cases[name]()),
          package: (module) => call.compare(module, ...cases[name]()),
        },
      ]),
    ),
  };
};

const lodashLike = (name, compare) => ({
  ...family({ name, compare }, ['negativeZero', 'sparseArray'], ['nullPrototype']),
  [`${name}: null-prototype objects`]: {
    native: () => isDeepStrictEqual(...cases.nullPrototype(), { skipPrototype: true }),
    package: (module) => compare(module, ...cases.nullPrototype()),
  },
});

export default {
  apis: ['util:util.isDeepStrictEqual'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'fast-deep-equal@3.1.3': family(
      { name: 'default', compare: ({ default: equal }, a, b) => equal(a, b) },
      ['negativeZero', 'mapValues', 'sparseArray', 'symbolKey'],
    ),
    'deep-equal@2.2.3': {
      ...family(
        { name: 'default', compare: ({ default: deepEqual }, a, b) => deepEqual(a, b, { strict: true }) },
        ['boxedNumber', 'symbolKey'],
      ),
      'default: loose by default': {
        gap: gapText.numberString,
        native: () => isDeepStrictEqual(...cases.numberString()),
        package: ({ default: deepEqual }) => deepEqual(...cases.numberString()),
      },
    },
    'lodash.isequal@4.5.0': lodashLike('default', ({ default: isEqual }, a, b) => isEqual(a, b)),
    'lodash@4.18.1': lodashLike('isEqual', ({ default: _ }, a, b) => _.isEqual(a, b)),
    'lodash-es@4.18.1': lodashLike('isEqual', ({ isEqual }, a, b) => isEqual(a, b)),
    'es-toolkit@1.53.1': lodashLike('isEqual', ({ isEqual }, a, b) => isEqual(a, b)),
    'dequal@2.0.3': family(
      { name: 'dequal', compare: ({ dequal }, a, b) => dequal(a, b) },
      ['negativeZero', 'sparseArray', 'boxedNumber', 'symbolKey', 'errorMessage'],
    ),
  },
  idioms: {
    jsonEqual: {
      seed: 'JSON\\.stringify\\([^)]*\\)\\s*[!=]==?\\s*JSON\\.stringify\\(',
      native: () => isDeepStrictEqual({ a: 1, b: [1, 2] }, { a: 1, b: [1, 2] }),
      idiom: () => JSON.stringify({ a: 1, b: [1, 2] }) === JSON.stringify({ a: 1, b: [1, 2] }),
    },
    'jsonEqual: key order': {
      gap: 'a JSON comparison depends on key order; native does not',
      native: () => isDeepStrictEqual({ a: 1, b: 2 }, { b: 2, a: 1 }),
      idiom: () => JSON.stringify({ a: 1, b: 2 }) === JSON.stringify({ b: 2, a: 1 }),
    },
  },
  lint: {
    banDeepEqual: {
      eslint: '10.12.0',
      plugin: 'eslint-plugin-depend@1.5.0',
      rule: 'depend/ban-dependencies',
      dependency: 'deep-equal',
      failed: 'reads only the package name, and the code can need the package for what no native API does; e18e/ban-dependencies, which reports the same hits, had 4 of 12 hits on good code',
      code: "import deepEqual from 'deep-equal';",
    },
    banLodashIsEqual: {
      eslint: '10.12.0',
      plugin: 'eslint-plugin-depend@1.5.0',
      rule: 'depend/ban-dependencies',
      dependency: 'lodash.isequal',
      failed: 'reads only the package name, and the code can need the package for what no native API does; e18e/ban-dependencies, which reports the same hits, had 4 of 12 hits on good code',
      code: "import isEqual from 'lodash.isequal';",
    },
  },
};
