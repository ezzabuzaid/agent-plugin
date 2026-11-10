// Sort, reverse, splice or replace an item without changing the original array.
const items = () => [3, 1, 2, 10];
const byValue = (a, b) => a - b;
// The result, and the original after the call.
const copied = (change) => {
  const original = items();
  return [change(original), original];
};

export default {
  apis: ['js:Array.prototype.toSorted', 'js:Array.prototype.toReversed', 'js:Array.prototype.toSpliced', 'js:Array.prototype.with'],
  reviewedAt: 'v26.13.0',
  idioms: {
    spreadSort: {
      seed: '\\[\\.\\.\\.(?:[\\w$]+|\\([^()]*\\))(?:\\??\\.#?[\\w$]+|\\[[^\\[\\]]*\\])*\\]\\.sort\\(',
      native: () => copied((list) => list.toSorted(byValue)),
      idiom: () => copied((list) => [...list].sort(byValue)),
    },
    sliceSort: {
      seed: '\\.slice\\(\\)\\.sort\\(',
      native: () => copied((list) => list.toSorted()),
      idiom: () => copied((list) => list.slice().sort()),
    },
    spreadReverse: {
      seed: '(\\[\\.\\.\\.[\\w$.]+\\]|\\.slice\\(\\))\\.reverse\\(\\)',
      native: () => copied((list) => list.toReversed()),
      idiom: () => copied((list) => [...list].reverse()),
    },
    copySplice: {
      native: () => copied((list) => list.toSpliced(1, 2, 'x')),
      idiom: () =>
        copied((list) => {
          const copy = [...list];
          copy.splice(1, 2, 'x');
          return copy;
        }),
    },
    copyAssign: {
      native: () => copied((list) => list.with(-1, 0)),
      idiom: () => copied((list) => list.map((item, index) => (index === list.length - 1 ? 0 : item))),
    },
    'sliceSort: sparse array': {
      gap: 'toSorted turns holes into undefined; spread does too, but slice().sort() keeps the holes',
      native: () => Object.keys([3, , 1].toSorted()),
      idiom: () => Object.keys([3, , 1].slice().sort()),
    },
  },
  lint: {
    e18eSpreadSort: {
      eslint: '10.12.0',
      plugin: '@e18e/eslint-plugin@0.8.1',
      rule: 'e18e/prefer-array-to-sorted',
      idiom: 'spreadSort',
      on: 'modern-node/recommended',
      note: 'the fixer does not read types: [...set].sort() becomes set.toSorted(); the type check finds this in TypeScript, and no check finds it in a .mjs file',
      code: 'const sorted = [...items].sort((a, b) => a - b);',
    },
    e18eSpreadReverse: {
      eslint: '10.12.0',
      plugin: '@e18e/eslint-plugin@0.8.1',
      rule: 'e18e/prefer-array-to-reversed',
      idiom: 'spreadReverse',
      on: 'modern-node/recommended',
      code: 'const reversed = [...items].reverse();',
    },
    spreadSort: {
      eslint: '10.12.0',
      plugin: 'eslint-plugin-unicorn@79.0.0',
      rule: 'unicorn/no-array-sort',
      idiom: 'spreadSort',
      off: 'in all 12 hits read, the array was already a new copy, so the change fixed nothing; e18e/prefer-array-to-sorted reports the [...x].sort() form',
      code: 'const sorted = [...items].sort((a, b) => a - b);',
    },
    spreadReverse: {
      eslint: '10.12.0',
      plugin: 'eslint-plugin-unicorn@79.0.0',
      rule: 'unicorn/no-array-reverse',
      idiom: 'spreadReverse',
      off: 'no hits on good code, but it is off with no-array-sort; e18e/prefer-array-to-reversed reports the [...x].reverse() form',
      code: 'const reversed = [...items].reverse();',
    },
  },
};
