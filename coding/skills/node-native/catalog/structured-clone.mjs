// Deep-copy a value.
import { outcome } from './support/outcome.mjs';

const data = () => ({
  text: 'x',
  count: 1,
  flag: true,
  none: null,
  list: [1, [2, { deep: 3 }]],
  at: new Date(0),
  pattern: /a/gi,
  map: new Map([['k', { v: 1 }]]),
  set: new Set([1, 2]),
  bytes: new Uint8Array([1, 2]),
});
// The copy, and whether it shares nothing with the original.
const copied = (clone, make = data) => {
  const original = make();
  const copy = clone(original);
  return [copy, copy !== original && copy.list !== original.list && copy.map !== original.map];
};
const cycle = () => {
  const node = { name: 'root' };
  node.self = node;
  return node;
};
const keepsCycle = (clone) =>
  outcome(() => {
    const copy = clone(cycle());
    return copy.self === copy;
  });
class Point {
  constructor(x) {
    this.x = x;
  }
}
const keepsClass = (clone) => clone(new Point(1)) instanceof Point;
const withFunction = () => ({ run() {} });
const keepsFunction = (clone) => typeof clone(withFunction()).run;
const tag = Symbol('tag');
const keepsSymbolKey = (clone) => Object.getOwnPropertySymbols(clone({ [tag]: 1 })).length;
const plain = () => ({ text: 'x', count: 1, list: [1, { deep: [true, null] }] });

// The packages each row group probes, and how a probe calls each.
const cloners = {
  'lodash@4.18.1': ['cloneDeep', ({ default: _ }) => _.cloneDeep],
  'lodash-es@4.18.1': ['cloneDeep', ({ cloneDeep }) => cloneDeep],
  'lodash.clonedeep@4.5.0': ['default', ({ default: cloneDeep }) => cloneDeep],
  'es-toolkit@1.53.1': ['cloneDeep', ({ cloneDeep }) => cloneDeep],
  'clone-deep@4.0.1': ['default', ({ default: cloneDeep }) => cloneDeep],
  'klona@2.0.6': ['klona', ({ klona }) => klona],
  'fast-copy@4.3.1': ['copy', ({ copy }) => copy],
  '@ungap/structured-clone@1.4.0': ['default', ({ default: clone }) => clone],
};
// What each package does differently, as structuredClone sees it.
const keepsCycles = new Set(['lodash@4.18.1', 'lodash-es@4.18.1', 'lodash.clonedeep@4.5.0', 'es-toolkit@1.53.1', 'fast-copy@4.3.1', '@ungap/structured-clone@1.4.0']);
const keepsClasses = new Set(['lodash@4.18.1', 'lodash-es@4.18.1', 'lodash.clonedeep@4.5.0', 'es-toolkit@1.53.1', 'clone-deep@4.0.1', 'klona@2.0.6', 'fast-copy@4.3.1']);
const keepsFunctions = new Set(['lodash@4.18.1', 'lodash-es@4.18.1', 'lodash.clonedeep@4.5.0', 'es-toolkit@1.53.1', 'clone-deep@4.0.1', 'klona@2.0.6', 'fast-copy@4.3.1']);
const keepsSymbolKeys = new Set(['lodash@4.18.1', 'lodash-es@4.18.1', 'lodash.clonedeep@4.5.0', 'es-toolkit@1.53.1', 'fast-copy@4.3.1']);

const familyRows = (spec, [member, get]) => ({
  [member]: {
    native: () => copied(structuredClone),
    package: (module) => copied(get(module)),
  },
  [`${member}: cycle`]: keepsCycles.has(spec)
    ? { native: () => keepsCycle(structuredClone), package: (module) => keepsCycle(get(module)) }
    : {
        improves: `structuredClone keeps a cycle; ${spec} overflows the stack`,
        native: () => keepsCycle(structuredClone),
        package: (module) => keepsCycle(get(module)),
      },
  [`${member}: class instance`]: keepsClasses.has(spec)
    ? {
        gap: `structuredClone copies a class instance as a plain object; ${spec} keeps its prototype`,
        native: () => keepsClass(structuredClone),
        package: (module) => keepsClass(get(module)),
      }
    : { native: () => keepsClass(structuredClone), package: (module) => keepsClass(get(module)) },
  ...(keepsFunctions.has(spec) && {
    [`${member}: function property`]: {
      gap: `structuredClone throws DataCloneError on a function; ${spec} copies the reference`,
      native: () => keepsFunction(structuredClone),
      package: (module) => keepsFunction(get(module)),
    },
  }),
  ...(keepsSymbolKeys.has(spec) && {
    [`${member}: symbol key`]: {
      gap: `structuredClone drops symbol-keyed properties; ${spec} copies them`,
      native: () => keepsSymbolKey(structuredClone),
      package: (module) => keepsSymbolKey(get(module)),
    },
  }),
});

export default {
  apis: ['js:structuredClone'],
  reviewedAt: 'v26.13.0',
  replaces: {
    ...Object.fromEntries(Object.entries(cloners).map(([spec, cloner]) => [spec, familyRows(spec, cloner)])),
    'rfdc@1.4.1': {
      default: {
        native: () => copied(structuredClone, () => ({ ...data(), pattern: undefined })),
        package: ({ default: rfdc }) => copied(rfdc(), () => ({ ...data(), pattern: undefined })),
      },
      'default: cycle': {
        native: () => keepsCycle(structuredClone),
        package: ({ default: rfdc }) => keepsCycle(rfdc({ circles: true })),
      },
      'default: cycle without circles': {
        improves: 'structuredClone keeps a cycle; rfdc() without { circles: true } overflows the stack',
        native: () => keepsCycle(structuredClone),
        package: ({ default: rfdc }) => keepsCycle(rfdc()),
      },
      'default: class instance': {
        native: () => keepsClass(structuredClone),
        package: ({ default: rfdc }) => keepsClass(rfdc()),
      },
      'default: RegExp': {
        improves: 'structuredClone copies a RegExp; rfdc turns it into an empty object',
        native: () => structuredClone({ pattern: /a/gi }),
        package: ({ default: rfdc }) => rfdc()({ pattern: /a/gi }),
      },
    },
  },
  idioms: {
    jsonClone: {
      seed: 'JSON\\.parse\\(JSON\\.stringify\\(',
      native: () => structuredClone(plain()),
      idiom: () => JSON.parse(JSON.stringify(plain())),
    },
    'jsonClone: Date': {
      gap: 'a JSON round trip turns a Date into a string; structuredClone keeps the Date',
      native: () => structuredClone({ at: new Date(0) }),
      idiom: () => JSON.parse(JSON.stringify({ at: new Date(0) })),
    },
    'jsonClone: undefined, Map, Set': {
      gap: 'a JSON round trip drops undefined and turns a Map or Set into {}; structuredClone keeps them',
      native: () => structuredClone({ none: undefined, map: new Map([[1, 2]]), set: new Set([1]) }),
      idiom: () => JSON.parse(JSON.stringify({ none: undefined, map: new Map([[1, 2]]), set: new Set([1]) })),
    },
  },
  lint: {
    jsonRoundTrip: {
      eslint: '10.12.0',
      plugin: 'eslint-plugin-unicorn@79.0.0',
      rule: 'unicorn/prefer-structured-clone',
      code: 'const copy = JSON.parse(JSON.stringify(value));',
    },
    lodashCloneDeep: {
      eslint: '10.12.0',
      plugin: 'eslint-plugin-unicorn@79.0.0',
      rule: 'unicorn/prefer-structured-clone',
      code: 'const copy = _.cloneDeep(value);',
    },
  },
};
