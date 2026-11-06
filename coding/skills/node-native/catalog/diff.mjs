// Minimal (Myers) diff of two strings or arrays.
import { diff } from 'node:util';

const pairs = [
  ['12345678', '12!!5!7!'],
  ['kitten', 'sitting'],
  ['', 'ab'],
  ['ab', ''],
  ['the cat sat', 'the hat sat'],
];
const arrays = [
  [['1', '2', '3'], ['1', '3', '4']],
  [['a', 'b', 'c', 'd'], ['a', 'c', 'd', 'e']],
];

// util.diff gives one entry per element: 0 kept, 1 only in the first value
// (removed), -1 only in the second (added). Runs of one kind become one chunk
// whose sign follows the packages: -1 removed, 1 added.
const runs = (entries, join) => {
  const chunks = [];
  for (const [op, value] of entries) {
    const kind = op === 0 ? 0 : -op;
    const last = chunks.at(-1);
    if (last?.[0] === kind) last[1] = join(last[1], value);
    else chunks.push([kind, join(undefined, value)]);
  }
  return chunks;
};
const text = (before = '', value) => before + value;
const list = (before = [], value) => [...before, value];
const jsdiffOp = (change) => {
  if (change.added) return 1;
  if (change.removed) return -1;
  return 0;
};
const jsdiffChunks = (changes) => changes.map((change) => [jsdiffOp(change), change.value]);

export default {
  apis: ['util:util.diff'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'fast-diff@1.3.0': {
      default: {
        native: () => pairs.map(([a, b]) => runs(diff(a, b), text)),
        package: ({ default: fastDiff }) => pairs.map(([a, b]) => fastDiff(a, b)),
      },
      'default: equal input': {
        gap: 'equal input gives no entries; fast-diff gives one unchanged chunk',
        native: () => runs(diff('abc', 'abc'), text),
        package: ({ default: fastDiff }) => fastDiff('abc', 'abc'),
      },
    },
    'diff@9.0.0': {
      diffChars: {
        native: () => pairs.map(([a, b]) => runs(diff(a, b), text)),
        package: ({ diffChars }) => pairs.map(([a, b]) => jsdiffChunks(diffChars(a, b))),
      },
      diffArrays: {
        native: () => arrays.map(([a, b]) => runs(diff(a, b), list)),
        package: ({ diffArrays }) => arrays.map(([a, b]) => jsdiffChunks(diffArrays(a, b))),
      },
    },
  },
};
