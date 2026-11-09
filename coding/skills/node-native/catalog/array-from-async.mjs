// Collect an async (or sync) iterable into an array.
async function* numbers() {
  yield 1;
  yield 2;
  yield 3;
}

export default {
  apis: ['js:Array.fromAsync'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'it-all@3.0.11': {
      default: {
        native: () => Array.fromAsync(numbers()),
        package: ({ default: all }) => all(numbers()),
      },
      'default: sync iterable': {
        native: () => Array.fromAsync(new Set([1, 2, 3])),
        package: ({ default: all }) => all(new Set([1, 2, 3])),
      },
      'default: returns synchronously': {
        gap: 'it-all returns a plain array for a sync iterable; Array.fromAsync always returns a promise',
        native: () => Array.isArray(Array.fromAsync(new Set([1]))),
        package: ({ default: all }) => Array.isArray(all(new Set([1]))),
      },
      'default: sync iterable of promises': {
        gap: 'Array.fromAsync awaits each promise in a sync iterable; it-all keeps the promises',
        native: () => Array.fromAsync([Promise.resolve(1), 2]),
        package: async ({ default: all }) => (await all([Promise.resolve(1), 2])).map((item) => item instanceof Promise),
      },
    },
  },
  idioms: {
    forAwaitPush: {
      seed: 'for await \\((?:const|let) ([\\w$]+) of .+?\\)\\s*\\{?\\s*[\\w$.]+\\.push\\(\\1\\)',
      native: () => Array.fromAsync(numbers()),
      idiom: async () => {
        const items = [];
        for await (const item of numbers()) items.push(item);
        return items;
      },
    },
  },
  lint: {
    noCollectLoop: {
      eslint: '10.12.0',
      plugin: '@zukhruf/eslint@0.8.12',
      rule: 'zukhruf/no-collect-loop',
      on: 'zukhruf/base',
      note: 'has the exclusions learned from real code; unicorn/prefer-array-from-async reports only an empty array in the statement before the loop, and gives the fix',
      code: 'const items = [];\nfor await (const item of source) items.push(item);',
    },
    preferArrayFromAsync: {
      eslint: '10.12.0',
      plugin: 'eslint-plugin-unicorn@79.0.0',
      rule: 'unicorn/prefer-array-from-async',
      on: 'modern-node/recommended',
      code: 'const items = [];\nfor await (const item of source) items.push(item);',
    },
  },
};
