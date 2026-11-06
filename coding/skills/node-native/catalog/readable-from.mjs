// Turn a value, an iterable, an async iterable or a promise into a readable
// stream.
import { Readable } from 'node:stream';

// What a stream emits, read through 'data' events: old readable-stream copies
// that from2 and merge2 build on have no async iterator.
const emitted = (stream) =>
  new Promise((resolve, reject) => {
    const out = [];
    stream.on('data', (chunk) => out.push(chunk));
    stream.on('end', () => resolve(out));
    stream.on('error', reject);
  });
// The text a byte stream carries, whichever way it was split.
const textOf = async (stream) => (await emitted(stream)).join('');
const letters = async function* () {
  yield 'x';
  yield 'y';
};

export default {
  apis: ['stream:stream.Readable.from'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'into-stream@9.1.0': {
      default: {
        native: () => textOf(Readable.from('unicorn')),
        package: ({ default: intoStream }) => textOf(intoStream('unicorn')),
      },
      'default: iterable': {
        native: () => textOf(Readable.from(['a', 'b'])),
        package: ({ default: intoStream }) => textOf(intoStream(['a', 'b'])),
      },
      'default: async iterable': {
        native: () => textOf(Readable.from(letters())),
        package: ({ default: intoStream }) => textOf(intoStream(letters())),
      },
      'default: promise': {
        native: () => textOf(Readable.from([Promise.resolve('p')])),
        package: ({ default: intoStream }) => textOf(intoStream(Promise.resolve('p'))),
      },
      'default: bytes': {
        native: async () => [...Buffer.concat(await emitted(Readable.from([new Uint8Array([1, 2])])))],
        package: async ({ default: intoStream }) => [...Buffer.concat(await emitted(intoStream(new Uint8Array([1, 2]))))],
      },
      'default: chunk type': {
        gap: 'Readable.from emits each string as it is, in object mode; into-stream emits Buffers from a byte stream (pass { objectMode: false } and decode to compare)',
        native: () => emitted(Readable.from(['a', 'b'])),
        package: ({ default: intoStream }) => emitted(intoStream(['a', 'b'])),
      },
      object: {
        native: () => emitted(Readable.from([{ a: 1 }, { b: 2 }])),
        package: ({ default: intoStream }) => emitted(intoStream.object([{ a: 1 }, { b: 2 }])),
      },
      'object: single value': {
        native: () => emitted(Readable.from([{ a: 1 }])),
        package: ({ default: intoStream }) => emitted(intoStream.object({ a: 1 })),
      },
    },
    'from2@2.3.0': {
      default: {
        native: () => {
          const queue = ['a', 'b', 'c'];
          return textOf(
            new Readable({
              read() {
                this.push(queue.shift() ?? null);
              },
            }),
          );
        },
        package: ({ default: from2 }) => {
          const queue = ['a', 'b', 'c'];
          return textOf(from2((size, next) => next(null, queue.shift() ?? null)));
        },
      },
      'default: generator': {
        native: () => textOf(Readable.from(['a', 'b', 'c'])),
        package: ({ default: from2 }) => {
          const queue = ['a', 'b', 'c'];
          return textOf(from2((size, next) => next(null, queue.shift() ?? null)));
        },
      },
      obj: {
        native: () => emitted(Readable.from([{ a: 1 }, { b: 2 }])),
        package: ({ default: from2 }) => {
          const queue = [{ a: 1 }, { b: 2 }];
          return emitted(from2.obj((size, next) => next(null, queue.shift() ?? null)));
        },
      },
    },
    // merge2 with streams as separate arguments drains them one after another.
    'merge2@1.4.1': {
      default: {
        native: () =>
          emitted(
            Readable.from(
              (async function* () {
                yield* Readable.from(['a1', 'a2']);
                yield* Readable.from(['b1', 'b2']);
              })(),
            ),
          ),
        package: ({ default: merge2 }) => emitted(merge2(Readable.from(['a1', 'a2']), Readable.from(['b1', 'b2']))),
      },
    },
  },
  idioms: {
    // A Readable whose read() pulls the next value from an async iterator.
    iteratorRead: {
      seed: 'async read\\([^)]*\\)[^{]*\\{[\\s\\S]{0,200}?\\bawait\\s+[\\w$.#]+\\.next\\(\\)[\\s\\S]{0,200}?\\bthis\\.push\\(',
      native: () => textOf(Readable.from(letters())),
      idiom: () => {
        const iterator = letters();
        return textOf(
          new Readable({
            async read() {
              const { value, done } = await iterator.next();
              this.push(done ? null : value);
            },
          }),
        );
      },
    },
    pushAll: {
      seed: 'new (?:[\\w$]+\\.)?Readable\\(\\s*\\{[^{}]*\\bread(?:\\s*\\(\\s*\\)|\\s*:\\s*\\(\\s*\\)\\s*=>|\\s*:\\s*function\\s*\\(\\s*\\))\\s*\\{\\s*\\}',
      native: () => emitted(Readable.from([{ a: 1 }, { b: 2 }])),
      idiom: () => {
        const stream = new Readable({ objectMode: true, read() {} });
        for (const value of [{ a: 1 }, { b: 2 }]) stream.push(value);
        stream.push(null);
        return emitted(stream);
      },
    },
  },
};
