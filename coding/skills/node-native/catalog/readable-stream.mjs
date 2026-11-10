// Node's stream classes and helpers, which the readable-stream package copies
// from a past Node release.
import { compose, Duplex, duplexPair, finished, PassThrough, pipeline, Readable, Transform, Writable } from 'node:stream';

const CHUNKS = ['ab', 'cd', 'ef'];
// The text a Readable built with `read()` gives, read through 'data' events.
const readText = (Readable) =>
  new Promise((resolve, reject) => {
    const queue = [...CHUNKS];
    const source = new Readable({
      read() {
        this.push(queue.shift() ?? null);
      },
    });
    let text = '';
    source.on('data', (chunk) => (text += chunk));
    source.on('end', () => resolve(text));
    source.on('error', reject);
  });
const writeText = (Writable) =>
  new Promise((resolve, reject) => {
    let text = '';
    const target = new Writable({
      write(chunk, encoding, done) {
        text += chunk;
        done();
      },
      final(done) {
        text += '|';
        done();
      },
    });
    target.on('finish', () => resolve(text));
    target.on('error', reject);
    for (const chunk of CHUNKS) target.write(chunk);
    target.end();
  });
// Runs a source, an upper-casing Transform and a sink of one implementation
// through its own pipeline.
const piped = ({ pipeline, Readable, Transform, Writable }) =>
  new Promise((resolve, reject) => {
    let text = '';
    pipeline(
      Readable.from(CHUNKS),
      new Transform({ transform: (chunk, encoding, done) => done(null, String(chunk).toUpperCase()) }),
      new Writable({
        write(chunk, encoding, done) {
          text += chunk;
          done();
        },
      }),
      (error) => (error ? reject(error) : resolve(text)),
    );
  });
const pipedError = ({ pipeline, Readable, PassThrough }) =>
  new Promise((resolve) => {
    const source = new Readable({
      read() {
        this.destroy(new Error('source failed'));
      },
    });
    const through = new PassThrough();
    pipeline(source, through, (error) => resolve([error?.message, source.destroyed, through.destroyed]));
  });
const finishedOf = ({ finished, Readable }) =>
  new Promise((resolve) => {
    const source = Readable.from(CHUNKS);
    finished(source, (error) => resolve(error?.message ?? 'done'));
    source.resume();
  });
const duplexText = async (Duplex) => {
  const duplex = new Duplex({
    read() {},
    write(chunk, encoding, done) {
      this.push(String(chunk).toUpperCase());
      done();
    },
    final(done) {
      this.push(null);
      done();
    },
  });
  duplex.end('ab');
  let text = '';
  for await (const chunk of duplex) text += chunk;
  return text;
};
const composedText = async (compose, Transform) => {
  const upper = new Transform({ transform: (chunk, encoding, done) => done(null, String(chunk).toUpperCase()) });
  const twice = new Transform({ transform: (chunk, encoding, done) => done(null, String(chunk).repeat(2)) });
  const duplex = compose(upper, twice);
  duplex.end('ab');
  let text = '';
  for await (const chunk of duplex) text += chunk;
  return text;
};
const passText = async (PassThrough) => {
  const through = new PassThrough();
  through.end('ab');
  let text = '';
  for await (const chunk of through) text += chunk;
  return text;
};

export default {
  apis: [
    'stream:stream.Readable',
    'stream:new stream.Readable',
    'stream:stream.Writable',
    'stream:new stream.Writable',
    'stream:stream.Duplex',
    'stream:stream.Transform',
    'stream:stream.PassThrough',
    'stream:stream.pipeline',
    'stream:stream.finished',
    'stream:stream.compose',
    'stream:stream.duplexPair',
    'stream:stream.getDefaultHighWaterMark',
  ],
  reviewedAt: 'v26.13.0',
  replaces: {
    'readable-stream@4.8.0': {
      Readable: {
        native: () => readText(Readable),
        package: ({ Readable }) => readText(Readable),
      },
      'Readable: from': {
        native: async () => (await Readable.from(CHUNKS).toArray()).join(''),
        package: async ({ Readable }) => (await Readable.from(CHUNKS).toArray()).join(''),
      },
      'Readable: highWaterMark': {
        gap: 'a Node 22+ byte stream buffers 64 KiB by default (stream.getDefaultHighWaterMark); readable-stream 4 copies the older 16 KiB default',
        native: () => [new Readable().readableHighWaterMark, new Writable().writableHighWaterMark],
        package: ({ Readable, Writable }) => [new Readable().readableHighWaterMark, new Writable().writableHighWaterMark],
      },
      Writable: {
        native: () => writeText(Writable),
        package: ({ Writable }) => writeText(Writable),
      },
      Duplex: {
        native: () => duplexText(Duplex),
        package: ({ Duplex }) => duplexText(Duplex),
      },
      Transform: {
        native: () => piped({ pipeline, Readable, Transform, Writable }),
        package: (module) => piped(module),
      },
      PassThrough: {
        native: () => passText(PassThrough),
        package: ({ PassThrough }) => passText(PassThrough),
      },
      pipeline: {
        native: () => piped({ pipeline, Readable, Transform, Writable }),
        package: (module) => piped(module),
      },
      'pipeline: error': {
        native: () => pipedError({ pipeline, Readable, PassThrough }),
        package: (module) => pipedError(module),
      },
      finished: {
        native: () => finishedOf({ finished, Readable }),
        package: (module) => finishedOf(module),
      },
      compose: {
        native: () => composedText(compose, Transform),
        package: ({ compose, Transform }) => composedText(compose, Transform),
      },
      duplexPair: {
        improves: 'node:stream has duplexPair, two duplex streams wired to each other; readable-stream 4 has none',
        native: () => typeof duplexPair,
        package: (module) => typeof module.duplexPair,
      },
    },
  },
  lint: {
    banReadableStream: {
      eslint: '10.12.0',
      plugin: 'eslint-plugin-depend@1.5.0',
      rule: 'depend/ban-dependencies',
      dependency: 'readable-stream',
      failed: 'reads only the package name, and the code can need the package for what no native API does; e18e/ban-dependencies, which reports the same hits, had 4 of 12 hits on good code',
      code: "import { Readable } from 'readable-stream';",
    },
  },
};
