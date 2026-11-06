// Union, intersection, difference and subset tests on collections of unique values.
const a = () => [5, 1, 3, 2];
const b = () => [2, 9, 5, 7, 8];
const set = (items) => new Set(items);

// [package member, Set method] pairs that give the same order.
const sameOrder = [
  ['union', (x, y) => [...set(x).union(set(y))]],
  ['difference', (x, y) => [...set(x).difference(set(y))]],
  ['xor', (x, y) => [...set(x).symmetricDifference(set(y))]],
  // Set#intersection walks the smaller set, so the first argument is the smaller one here.
  ['intersection', (x, y) => [...set(x).intersection(set(y))]],
];

const rows = (get) => ({
  ...Object.fromEntries(
    sameOrder.map(([member, native]) => [
      member,
      { native: () => native(a(), b()), package: (module) => get(module)[member](a(), b()) },
    ]),
  ),
  'intersection: larger set first': {
    gap: 'Set#intersection walks the smaller set, so its order follows the second Set when that one is smaller; the array version keeps the first array\'s order',
    native: () => [...set(b()).intersection(set(a()))],
    package: (module) => get(module).intersection(b(), a()),
  },
  'difference: duplicate items': {
    gap: 'a Set has no duplicates; the array difference keeps every repeated item of the first array',
    native: () => [...set([1, 1, 2]).difference(set([2]))],
    package: (module) => get(module).difference([1, 1, 2], [2]),
  },
});

export default {
  apis: [
    'js:Set.prototype.union',
    'js:Set.prototype.intersection',
    'js:Set.prototype.difference',
    'js:Set.prototype.symmetricDifference',
    'js:Set.prototype.isSubsetOf',
    'js:Set.prototype.isSupersetOf',
    'js:Set.prototype.isDisjointFrom',
  ],
  reviewedAt: 'v26.13.0',
  replaces: {
    'lodash@4.18.1': rows(({ default: _ }) => _),
    'lodash-es@4.18.1': rows((lodashEs) => lodashEs),
    'es-toolkit@1.53.1': {
      ...rows((module) => module),
      isSubset: {
        native: () => [set([1, 2]).isSubsetOf(set([1, 2, 3])), set([1, 4]).isSubsetOf(set([1, 2, 3]))],
        package: ({ isSubset }) => [isSubset([1, 2, 3], [1, 2]), isSubset([1, 2, 3], [1, 4])],
      },
    },
    'lodash.union@4.6.0': {
      default: {
        native: () => [...set(a()).union(set(b()))],
        package: ({ default: union }) => union(a(), b()),
      },
    },
    'lodash.difference@4.5.0': {
      default: {
        native: () => [...set(a()).difference(set(b()))],
        package: ({ default: difference }) => difference(a(), b()),
      },
      'default: duplicate items': {
        gap: 'a Set has no duplicates; lodash.difference keeps every repeated item of the first array',
        native: () => [...set([1, 1, 2]).difference(set([2]))],
        package: ({ default: difference }) => difference([1, 1, 2], [2]),
      },
    },
  },
  idioms: {
    spreadUnion: {
      seed: 'new Set(?:<[^>]*>)?\\(\\s*\\[\\s*\\.\\.\\.(?:[\\w$]+|\\([^()]*\\))(?:\\??\\.#?[\\w$]+|\\[[^\\[\\]]*\\])*\\s*,\\s*\\.\\.\\.',
      native: () => set(a()).union(set(b())),
      idiom: () => {
        const left = set(a());
        const right = set(b());
        return new Set([...left, ...right]);
      },
    },
    filterHas: {
      seed: '\\.filter\\(\\(?(\\w+)\\)? => !?\\w+\\.has\\(\\1\\)\\)',
      native: () => [set(a()).intersection(set(b())), set(a()).difference(set(b()))],
      idiom: () => {
        const left = set(a());
        const right = set(b());
        return [new Set([...left].filter((x) => right.has(x))), new Set([...left].filter((x) => !right.has(x)))];
      },
    },
    everyHas: {
      seed: '\\.every\\(\\(?(\\w+)\\)? => \\w+\\.has\\(\\1\\)\\)',
      native: () => [set([1, 2]).isSubsetOf(set([1, 2, 3])), set([1, 2, 3]).isSupersetOf(set([1, 4]))],
      idiom: () => {
        const small = set([1, 2]);
        const large = set([1, 2, 3]);
        return [[...small].every((x) => large.has(x)), [...set([1, 4])].every((x) => large.has(x))];
      },
    },
    someHas: {
      seed: '\\.some\\(\\s*\\(?\\s*([\\w$]+)\\s*\\)?\\s*=>\\s*[\\w$.]+\\.has\\(\\s*\\1\\s*\\)\\s*\\)',
      native: () => [set([1, 2]).isDisjointFrom(set([3])), set([1, 2]).isDisjointFrom(set([2]))],
      idiom: () => {
        const left = set([1, 2]);
        const three = set([3]);
        const two = set([2]);
        return [![...left].some((x) => three.has(x)), ![...left].some((x) => two.has(x))];
      },
    },
  },
  lint: {
    spreadUnion: {
      eslint: '10.12.0',
      plugin: 'eslint-plugin-unicorn@79.0.0',
      rule: 'unicorn/prefer-set-methods',
      code: 'const a = new Set(x);\nconst b = new Set(y);\nconst all = new Set([...a, ...b]);',
    },
    filterHas: {
      eslint: '10.12.0',
      plugin: 'eslint-plugin-unicorn@79.0.0',
      rule: 'unicorn/prefer-set-methods',
      code: 'const a = new Set(x);\nconst b = new Set(y);\nconst both = new Set([...a].filter((value) => b.has(value)));',
    },
    everyHas: {
      eslint: '10.12.0',
      plugin: 'eslint-plugin-unicorn@79.0.0',
      rule: 'unicorn/prefer-set-methods',
      code: 'const a = new Set(x);\nconst b = new Set(y);\nconst subset = [...a].every((value) => b.has(value));',
    },
  },
};
