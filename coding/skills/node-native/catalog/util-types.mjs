// Brand checks on built-in object types (RegExp, Date, Map, typed arrays …) that
// a Symbol.toStringTag or a prototype swap cannot fool.
import { types } from 'node:util';

// Every value each check runs on, by name; built fresh for every probe.
const values = () => ({
  regexp: /a/,
  date: new Date(0),
  args: (function () {
    return arguments;
  })(1),
  generatorFunction: function* generator() {},
  asyncFunction: async function asyncFunction() {},
  asyncGeneratorFunction: async function* asyncGenerator() {},
  uint8Array: new Uint8Array(1),
  float64Array: new Float64Array(1),
  dataView: new DataView(new ArrayBuffer(1)),
  map: new Map(),
  set: new Set(),
  weakMap: new WeakMap(),
  weakSet: new WeakSet(),
  arrayBuffer: new ArrayBuffer(1),
  sharedArrayBuffer: new SharedArrayBuffer(1),
  boxedNumber: new Number(1),
  boxedString: new String('s'),
  boxedSymbol: Object(Symbol('s')),
  boxedBigInt: Object(1n),
  boxedBoolean: new Boolean(false),
  number: 1,
  string: 's',
  promise: Promise.resolve(),
  thenable: { then() {} },
  fakeDate: { [Symbol.toStringTag]: 'Date' },
  regexpPrototype: Object.create(RegExp.prototype),
  array: [],
  object: {},
  null: null,
  undefined,
  arrow: () => {},
  proxy: new Proxy({}, {}),
  proxiedMap: new Proxy(new Map(), {}),
});

// One mapping over every value the package agrees on, and one gap per value it does not.
const check = (predicate, pick, disagree = {}) => {
  const agree = () => Object.entries(values()).filter(([name]) => !(name in disagree));
  return [
    {
      native: () => agree().map(([, value]) => types[predicate](value)),
      package: (module) => agree().map(([, value]) => pick(module)(value)),
    },
    Object.entries(disagree).map(([name, claim]) => ({
      name,
      ...(typeof claim === 'string' ? { gap: claim } : claim),
      native: () => types[predicate](values()[name]),
      package: (module) => pick(module)(values()[name]),
    })),
  ];
};
const member = (key, [mapping, gaps]) => ({
  [key]: mapping,
  ...Object.fromEntries(gaps.map(({ name, ...row }) => [`${key}: ${name}`, row])),
});
const single = (predicate, disagree) => member('default', check(predicate, ({ default: is }) => is, disagree));
const named = (entries) =>
  Object.assign({}, ...entries.map(([key, predicate, disagree]) => member(key, check(predicate, (module) => module[key], disagree))));

const asyncGenerator = {
  asyncGeneratorFunction: 'an async generator function counts natively as both a generator function and an async function; the package says neither',
};
const instanceOf = {
  improves: 'native checks the internal slot, so it refuses an object that only has the prototype and a Proxy, whose methods throw; the package checks instanceof, which both pass',
};
const thenable = { thenable: 'native accepts only a real Promise; the package accepts any thenable' };

export default {
  apis: [
    'util:util.types.isRegExp',
    'util:util.types.isDate',
    'util:util.types.isArgumentsObject',
    'util:util.types.isGeneratorFunction',
    'util:util.types.isAsyncFunction',
    'util:util.types.isTypedArray',
    'util:util.types.isMap',
    'util:util.types.isSet',
    'util:util.types.isWeakMap',
    'util:util.types.isWeakSet',
    'util:util.types.isArrayBuffer',
    'util:util.types.isSharedArrayBuffer',
    'util:util.types.isBoxedPrimitive',
    'util:util.types.isPromise',
  ],
  reviewedAt: 'v26.13.0',
  replaces: {
    'is-regex@1.2.1': single('isRegExp'),
    'is-date-object@1.1.0': single('isDate'),
    'is-arguments@1.2.0': single('isArgumentsObject'),
    'is-generator-function@1.1.2': single('isGeneratorFunction', asyncGenerator),
    'is-async-function@2.1.1': single('isAsyncFunction', asyncGenerator),
    'is-typed-array@1.1.15': single('isTypedArray'),
    'is-map@2.0.3': single('isMap'),
    'is-set@2.0.3': single('isSet'),
    'is-weakmap@2.0.2': single('isWeakMap'),
    'is-weakset@2.0.4': single('isWeakSet'),
    'is-array-buffer@3.0.5': single('isArrayBuffer'),
    'is-shared-array-buffer@1.0.4': single('isSharedArrayBuffer'),
    'is-boxed-primitive@1.0.1': single('isBoxedPrimitive'),
    'is-promise@4.0.0': single('isPromise', thenable),
    'es-toolkit@1.53.1': named([
      ['isRegExp', 'isRegExp', { regexpPrototype: instanceOf }],
      ['isDate', 'isDate'],
      ['isMap', 'isMap', { proxiedMap: instanceOf }],
      ['isSet', 'isSet'],
      ['isWeakMap', 'isWeakMap'],
      ['isWeakSet', 'isWeakSet'],
      ['isTypedArray', 'isTypedArray'],
      ['isArrayBuffer', 'isArrayBuffer'],
      ['isPromise', 'isPromise'],
    ]),
  },
  lint: {
    banIsDateObject: {
      eslint: '10.12.0',
      plugin: 'eslint-plugin-depend@1.5.0',
      rule: 'depend/ban-dependencies',
      dependency: 'is-date-object',
      failed: 'reads only the package name, and the code can need the package for what no native API does; e18e/ban-dependencies, which reports the same hits, had 4 of 12 hits on good code',
      code: "import isDate from 'is-date-object';",
    },
    banIsArrayBuffer: {
      eslint: '10.12.0',
      plugin: 'eslint-plugin-depend@1.5.0',
      rule: 'depend/ban-dependencies',
      dependency: 'is-array-buffer',
      failed: 'reads only the package name, and the code can need the package for what no native API does; e18e/ban-dependencies, which reports the same hits, had 4 of 12 hits on good code',
      code: "import isArrayBuffer from 'is-array-buffer';",
    },
  },
};
