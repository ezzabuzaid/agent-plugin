// Reading a stream one line at a time.
import { createInterface } from 'node:readline';
import { Readable } from 'node:stream';

const source = (text) => Readable.from([text]);

async function nativeLines(text) {
  const lines = [];
  for await (const line of createInterface({ input: source(text), crlfDelay: Infinity })) lines.push(line);
  return lines;
}

async function split2Lines({ default: split2 }, text, ...options) {
  const lines = [];
  for await (const line of source(text).pipe(split2(...options))) lines.push(line);
  return lines;
}

export default {
  apis: ['readline:readline.createInterface', 'readline:rl[Symbol.asyncIterator]'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'split2@4.2.0': {
      default: {
        native: () => nativeLines('a\nb\r\nc'),
        package: (module) => split2Lines(module, 'a\nb\r\nc'),
      },
      'default: empty lines': {
        native: () => nativeLines('a\n\nb\n'),
        package: (module) => split2Lines(module, 'a\n\nb\n'),
      },
      'default: mapper': {
        native: async () => (await nativeLines('{"a":1}\n{"a":2}\n')).map((line) => JSON.parse(line)),
        package: (module) => split2Lines(module, '{"a":1}\n{"a":2}\n', JSON.parse),
      },
      'default: lone CR': {
        gap: 'a lone \\r also ends a line; split2 splits on \\n and \\r\\n only',
        native: () => nativeLines('a\rb\nc'),
        package: (module) => split2Lines(module, 'a\rb\nc'),
      },
      'default: line separator': {
        gap: 'U+2028 and U+2029 also end a line',
        native: () => nativeLines('x y'),
        package: (module) => split2Lines(module, 'x y'),
      },
      'default: custom separator': {
        gap: 'splits on line endings only; split2 takes any string or RegExp',
        native: () => nativeLines('a,b,c'),
        package: (module) => split2Lines(module, 'a,b,c', ','),
      },
    },
  },
};
