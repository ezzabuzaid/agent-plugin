// Lazy map / filter / take / drop / flatMap / reduce over any iterator.
const source = () => new Set([1, 2, 3, 4, 5, 6, 7, 8]);
const isEven = (n) => n % 2 === 0;

export default {
  apis: [
    'js:Iterator.from',
    'js:Iterator.concat',
    'js:Iterator.prototype.map',
    'js:Iterator.prototype.filter',
    'js:Iterator.prototype.take',
    'js:Iterator.prototype.drop',
    'js:Iterator.prototype.flatMap',
    'js:Iterator.prototype.reduce',
    'js:Iterator.prototype.toArray',
    'js:Iterator.prototype.forEach',
    'js:Iterator.prototype.some',
    'js:Iterator.prototype.every',
    'js:Iterator.prototype.find',
  ],
  reviewedAt: 'v26.13.0',
  replaces: {
    'iterare@1.2.1': {
      iterate: {
        native: () => {
          const seen = [];
          Iterator.from(source()).forEach((n) => seen.push(n));
          return [
            Iterator.from(source()).map((n) => n * 3).filter(isEven).drop(1).take(2).toArray(),
            Iterator.from(source()).reduce((sum, n) => sum + n),
            Iterator.from(source()).reduce((sum, n) => sum + n, 10),
            Iterator.from(source()).find((n) => n > 3),
            Iterator.from(source()).some((n) => n > 7),
            Iterator.from(source()).every((n) => n > 0),
            Iterator.from([[1, 2], [3]]).flatMap((list) => list).toArray(),
            seen,
          ];
        },
        package: ({ iterate }) => {
          const seen = [];
          iterate(source()).forEach((n) => seen.push(n));
          return [
            iterate(source()).map((n) => n * 3).filter(isEven).drop(1).take(2).toArray(),
            iterate(source()).reduce((sum, n) => sum + n),
            iterate(source()).reduce((sum, n) => sum + n, 10),
            iterate(source()).find((n) => n > 3),
            iterate(source()).some((n) => n > 7),
            iterate(source()).every((n) => n > 0),
            iterate([[1, 2], [3]]).flatten().toArray(),
            seen,
          ];
        },
      },
      'iterate: callback counter': {
        gap: 'Iterator#map and #filter pass a counter as the second argument, so a two-parameter callback (map(parseInt)) changes; iterare passes only the value',
        native: () => Iterator.from(['1', '2', '3']).map(parseInt).toArray(),
        package: ({ iterate }) => iterate(['1', '2', '3']).map(parseInt).toArray(),
      },
      'iterate: flatten non-iterables': {
        gap: 'iterare flatten() keeps items that are not iterable; Iterator#flatMap throws TypeError on them',
        native: () => {
          try {
            return Iterator.from([[1], 2]).flatMap((item) => item).toArray();
          } catch (error) {
            return error.name;
          }
        },
        package: ({ iterate }) => iterate([[1], 2]).flatten().toArray(),
      },
    },
  },
  idioms: {
    spreadThenFind: {
      seed: '\\[\\.\\.\\.[\\w$.]+\\.(values|keys|entries)\\(\\)\\]\\.(find|some|every|forEach|reduce)\\(',
      native: () => {
        const map = new Map([['a', 1], ['b', 5], ['c', 9]]);
        return [map.values().find((n) => n > 3), map.values().some((n) => n > 8), map.values().reduce((sum, n) => sum + n, 0)];
      },
      idiom: () => {
        const map = new Map([['a', 1], ['b', 5], ['c', 9]]);
        return [[...map.values()].find((n) => n > 3), [...map.values()].some((n) => n > 8), [...map.values()].reduce((sum, n) => sum + n, 0)];
      },
    },
    spreadConcat: {
      seed: '\\[\\s*\\.\\.\\.[\\w$.]+\\.(?:values|keys|entries)\\(\\)\\s*,\\s*\\.\\.\\.|\\bfor\\s*\\(\\s*(?:const|let|var)\\s+[^;]*?\\bof\\s+\\[\\s*\\.\\.\\.[^\\]]*,\\s*\\.\\.\\.',
      native: () => {
        const seen = [];
        for (const n of Iterator.concat(new Set([1, 2]).values(), new Map([['x', 3]]).values())) seen.push(n);
        return seen;
      },
      idiom: () => {
        const seen = [];
        const set = new Set([1, 2]);
        const map = new Map([['x', 3]]);
        for (const n of [...set.values(), ...map.values()]) seen.push(n);
        return seen;
      },
    },
  },
  lint: {
    spreadThenFind: {
      eslint: '10.12.0',
      plugin: 'eslint-plugin-unicorn@79.0.0',
      rule: 'unicorn/prefer-iterator-helpers',
      idiom: 'spreadThenFind',
      on: 'modern-node/recommended',
      code: 'const map = new Map();\nconst found = [...map.values()].find((value) => value > 3);',
    },
    spreadConcat: {
      eslint: '10.12.0',
      plugin: 'eslint-plugin-unicorn@79.0.0',
      rule: 'unicorn/prefer-iterator-concat',
      idiom: 'spreadConcat',
      off: 'no hits on good code, but TypeScript 6 has no type for Iterator.concat',
      code: 'for (const value of [...a.values(), ...b.values()]) use(value);',
    },
  },
};
