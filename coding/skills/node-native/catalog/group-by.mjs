// Group the items of an iterable by a key the callback returns.
const words = () => ['one', 'two', 'three', 'four', 'five', 'six'];
const byLength = (word) => word.length;
// Object.groupBy returns a null-prototype object; the mapping rows compare
// the groups, the `prototype` rows record the difference.
const groups = (object) => ({ ...object });

// lodash and lodash-es export the same groupBy; `lodash` reads it from the module.
const lodashRows = (lodash) => ({
  groupBy: {
    native: () => groups(Object.groupBy(words(), byLength)),
    package: (module) => lodash(module).groupBy(words(), byLength),
  },
  'groupBy: prototype': {
    gap: 'Object.groupBy returns a null-prototype object; lodash returns a plain object (hasOwnProperty, toString)',
    native: () => Object.getPrototypeOf(Object.groupBy(words(), byLength)),
    package: (module) => Object.getPrototypeOf(lodash(module).groupBy(words(), byLength)),
  },
  'groupBy: property shorthand': {
    gap: 'Object.groupBy takes only a callback; lodash also takes a property name',
    native: () => groups(Object.groupBy(words(), 'length')),
    package: (module) => lodash(module).groupBy(words(), 'length'),
  },
  'groupBy: object collection': {
    gap: 'Object.groupBy takes only an iterable; lodash also groups the values of a plain object',
    native: () => groups(Object.groupBy({ a: 1, b: 2, c: 3 }, (n) => n % 2)),
    package: (module) => lodash(module).groupBy({ a: 1, b: 2, c: 3 }, (n) => n % 2),
  },
});

export default {
  apis: ['js:Object.groupBy', 'js:Map.groupBy'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'lodash@4.18.1': lodashRows(({ default: _ }) => _),
    'lodash-es@4.18.1': lodashRows((lodashEs) => lodashEs),
    'lodash.groupby@4.6.0': {
      default: {
        native: () => groups(Object.groupBy(words(), byLength)),
        package: ({ default: groupBy }) => groupBy(words(), byLength),
      },
      'default: prototype': {
        gap: 'Object.groupBy returns a null-prototype object; lodash.groupby returns a plain object',
        native: () => Object.getPrototypeOf(Object.groupBy(words(), byLength)),
        package: ({ default: groupBy }) => Object.getPrototypeOf(groupBy(words(), byLength)),
      },
    },
    'es-toolkit@1.53.1': {
      groupBy: {
        native: () => groups(Object.groupBy(words(), byLength)),
        package: ({ groupBy }) => groupBy(words(), byLength),
      },
      'groupBy: prototype': {
        gap: 'Object.groupBy returns a null-prototype object; es-toolkit returns a plain object',
        native: () => Object.getPrototypeOf(Object.groupBy(words(), byLength)),
        package: ({ groupBy }) => Object.getPrototypeOf(groupBy(words(), byLength)),
      },
    },
  },
  idioms: {
    reduceIntoObject: {
      seed: '\\(\\w+\\[[^\\]]+\\] \\?\\?= \\[\\]\\)\\.push\\(',
      native: () => groups(Object.groupBy(words(), byLength)),
      idiom: () =>
        words().reduce((accumulator, word) => {
          (accumulator[byLength(word)] ??= []).push(word);
          return accumulator;
        }, {}),
    },
    pushIntoMap: {
      seed: '\\.get\\((?:[^()]|\\([^()]*\\))*\\)(?:!|\\?)?\\.push\\(',
      native: () => Map.groupBy(words(), byLength),
      idiom: () => {
        const map = new Map();
        for (const word of words()) {
          if (!map.has(byLength(word))) map.set(byLength(word), []);
          map.get(byLength(word)).push(word);
        }
        return map;
      },
    },
  },
  lint: {
    preferGroupBy: {
      eslint: '10.12.0',
      plugin: 'eslint-plugin-unicorn@79.0.0',
      rule: 'unicorn/prefer-group-by',
      on: 'modern-node/recommended',
      code: 'const groups = items.reduce((accumulator, item) => {\n  (accumulator[item.type] ??= []).push(item);\n  return accumulator;\n}, {});',
    },
  },
};
