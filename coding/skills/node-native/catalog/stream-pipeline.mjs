// Pipe streams into each other with errors and cleanup handled: pipeline
// waits for the whole chain, and compose joins a chain into one duplex stream.
import { compose, PassThrough, Readable, Transform, Writable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { failure } from './support/outcome.mjs';

const CHUNKS = ['ab', 'cd', 'ef'];
const upper = () => new Transform({ transform: (chunk, encoding, done) => done(null, String(chunk).toUpperCase()) });
const upperObjects = () => new Transform({ objectMode: true, transform: (record, encoding, done) => done(null, { n: record.n * 10 }) });
// A writable that keeps what it receives as text in `sink.text`.
const sink = () => {
  const target = new Writable({
    write(chunk, encoding, done) {
      target.text += chunk;
      done();
    },
  });
  target.text = '';
  return target;
};
// A source that fails after its first chunk.
const failing = () =>
  new Readable({
    read() {
      this.push('ab');
      this.destroy(new Error('source failed'));
    },
  });
// What a run of `chain` reports: its error, or the text that reached the sink,
// and whether every stream in it was destroyed.
const settled = async (chain, run) => {
  let outcome;
  try {
    await run(chain);
    outcome = chain.at(-1).text;
  } catch (error) {
    outcome = error.message;
  }
  return [outcome, chain.map((stream) => stream.destroyed)];
};
const callback = (pump) => (chain) => new Promise((resolve, reject) => pump(...chain, (error) => (error ? reject(error) : resolve())));
// Writes `chunks` into a composed duplex and reads what comes out.
const composed = async (duplex, chunks = CHUNKS, objectMode = false) => {
  const out = [];
  await pipeline(Readable.from(chunks, { objectMode }), duplex, async (source) => {
    for await (const chunk of source) out.push(objectMode ? chunk : String(chunk));
  });
  return objectMode ? out : out.join('');
};
const composedError = (duplex) => failure(() => composed(duplex));
const failingTransform = () => new Transform({ transform: (chunk, encoding, done) => done(new Error('transform failed')) });

export default {
  apis: ['stream:stream.pipeline', 'stream:stream.compose'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'pump@3.0.4': {
      default: {
        native: () => settled([Readable.from(CHUNKS), upper(), sink()], (chain) => pipeline(...chain)),
        package: ({ default: pump }) => settled([Readable.from(CHUNKS), upper(), sink()], callback(pump)),
      },
      'default: error': {
        native: () => settled([failing(), upper(), sink()], (chain) => pipeline(...chain)),
        package: ({ default: pump }) => settled([failing(), upper(), sink()], callback(pump)),
      },
    },
    'pumpify@2.0.1': {
      default: {
        native: () => composed(compose(upper(), new PassThrough())),
        package: ({ default: pumpify }) => composed(pumpify(upper(), new PassThrough())),
      },
      obj: {
        native: () => composed(compose(upperObjects(), new PassThrough({ objectMode: true })), [{ n: 1 }, { n: 2 }], true),
        package: ({ default: pumpify }) => composed(pumpify.obj(upperObjects(), new PassThrough({ objectMode: true })), [{ n: 1 }, { n: 2 }], true),
      },
      'default: error': {
        native: () => composedError(compose(failingTransform(), new PassThrough())),
        package: ({ default: pumpify }) => composedError(pumpify(failingTransform(), new PassThrough())),
      },
    },
    'stream-combiner2@1.1.1': {
      default: {
        native: () => composed(compose(upper(), new PassThrough())),
        package: ({ default: combine }) => composed(combine(upper(), new PassThrough())),
      },
      'default: array': {
        native: () => composed(compose(...[upper(), new PassThrough()])),
        package: ({ default: combine }) => composed(combine([upper(), new PassThrough()])),
      },
      obj: {
        native: () => composed(compose(upperObjects(), new PassThrough({ objectMode: true })), [{ n: 1 }, { n: 2 }], true),
        package: ({ default: combine }) => composed(combine.obj(upperObjects(), new PassThrough({ objectMode: true })), [{ n: 1 }, { n: 2 }], true),
      },
      'default: error': {
        native: () => composedError(compose(failingTransform(), new PassThrough())),
        package: ({ default: combine }) => composedError(combine(failingTransform(), new PassThrough())),
      },
    },
  },
  idioms: {
    // .pipe() forwards data but not errors: a failed source leaves the
    // streams after it open, and nothing reports the error to the caller.
    pipeChain: {
      improves: 'pipeline rejects with the source error and destroys every stream; a .pipe() chain reports nothing and leaves the downstream streams open',
      native: () => settled([failing(), upper(), sink()], (chain) => pipeline(...chain)),
      idiom: () =>
        settled([failing(), upper(), sink()], async ([source, transform, target]) => {
          source.on('error', () => {});
          source.pipe(transform).pipe(target);
          await new Promise((resolve) => source.on('close', resolve));
        }),
    },
    pipeChainHandled: {
      seed: '\\.pipe\\(.*?\\)\\s*\\.pipe\\(',
      native: () => settled([failing(), upper(), sink()], (chain) => pipeline(...chain)),
      idiom: () =>
        settled([failing(), upper(), sink()], (chain) =>
          new Promise((resolve, reject) => {
            const fail = (error) => {
              for (const stream of chain) stream.destroy();
              reject(error);
            };
            for (const stream of chain) stream.on('error', fail);
            chain.at(-1).on('finish', resolve);
            chain[0].pipe(chain[1]).pipe(chain[2]);
          }),
        ),
    },
  },
};
