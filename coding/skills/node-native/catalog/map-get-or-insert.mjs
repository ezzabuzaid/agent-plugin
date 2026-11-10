// Read a key from a Map or WeakMap, storing a default the first time.
const words = () => ['apple', 'avocado', 'banana', 'blueberry', 'cherry'];
const firstLetter = (word) => word[0];

export default {
  apis: [
    'js:Map.prototype.getOrInsert',
    'js:Map.prototype.getOrInsertComputed',
    'js:WeakMap.prototype.getOrInsert',
    'js:WeakMap.prototype.getOrInsertComputed',
  ],
  reviewedAt: 'v26.13.0',
  idioms: {
    hasThenSet: {
      seed: 'if \\(!\\s*([\\w$.#]+)(?<![hH]eaders|[sS]earchParams)\\.has\\((?:[^()]|\\([^()]*\\))*\\)\\)\\s*\\{?\\s*(?<![\\w$#.])\\1\\.set\\(',
      native: () => {
        const map = new Map();
        for (const word of words()) map.getOrInsertComputed(firstLetter(word), () => []).push(word);
        return map;
      },
      idiom: () => {
        const map = new Map();
        for (const word of words()) {
          if (!map.has(firstLetter(word))) map.set(firstLetter(word), []);
          map.get(firstLetter(word)).push(word);
        }
        return map;
      },
    },
    getThenSet: {
      seed: '([\\w$.#]+)\\.get\\((?:[^()]|\\([^()]*\\))*\\);\\s*if\\s*\\(\\s*(?:!\\s*[\\w$]+|[\\w$]+\\s*===?\\s*(?:undefined|null))\\s*\\)(?!\\s*(?:return|throw|continue|break)\\b)\\s*\\{?[^}]{0,200}?(?<![\\w$#.])\\1\\.set\\(',
      native: () => {
        const map = new Map();
        for (const word of words()) map.getOrInsertComputed(firstLetter(word), () => []).push(word);
        return map;
      },
      idiom: () => {
        const map = new Map();
        for (const word of words()) {
          let list = map.get(firstLetter(word));
          if (!list) {
            list = [];
            map.set(firstLetter(word), list);
          }
          list.push(word);
        }
        return map;
      },
    },
    weakMapCache: {
      native: () => {
        const cache = new WeakMap();
        const key = {};
        let computed = 0;
        const read = () => cache.getOrInsertComputed(key, () => ++computed);
        return [read(), read(), computed];
      },
      idiom: () => {
        const cache = new WeakMap();
        const key = {};
        let computed = 0;
        const read = () => {
          if (!cache.has(key)) cache.set(key, ++computed);
          return cache.get(key);
        };
        return [read(), read(), computed];
      },
    },
    'getThenSet: falsy value': {
      gap: 'if (!value) treats a stored 0, "" or null as missing and overwrites it; getOrInsert keeps any value stored under the key',
      native: () => {
        const map = new Map([['k', 0]]);
        map.getOrInsert('k', 5);
        return map.get('k');
      },
      idiom: () => {
        const map = new Map([['k', 0]]);
        let value = map.get('k');
        if (!value) {
          value = 5;
          map.set('k', value);
        }
        return map.get('k');
      },
    },
  },
  lint: {
    e18eGetThenSet: {
      eslint: '10.12.0',
      plugin: '@e18e/eslint-plugin@0.8.1',
      rule: 'e18e/prefer-get-or-insert',
      idiom: 'getThenSet',
      failed: '2 of 7 hits on good code: the default runs on each call, so a cache stops working',
      code: 'let list = map.get(key);\nif (!list) {\n  list = [];\n  map.set(key, list);\n}',
    },
  },
};
