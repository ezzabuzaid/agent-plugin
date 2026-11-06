// Transform a stream chunk by chunk: a Transform built from functions, an
// async generator turned into a duplex stream, and the web TransformStream.
import { Duplex, Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { failure } from './support/outcome.mjs';

const CHUNKS = ['ab', 'cd', 'ef'];
const RECORDS = [{ n: 1 }, { n: 2 }, { n: 3 }];
// Writes `chunks` through `transform` and returns what comes out: the text,
// or the objects themselves in object mode. A byte stream may merge chunks, so
// only the text is compared.
const through = async (transform, chunks = CHUNKS, objectMode = false) => {
  const out = [];
  await pipeline(Readable.from(chunks, { objectMode }), transform, async (source) => {
    for await (const chunk of source) out.push(objectMode ? chunk : String(chunk));
  });
  return objectMode ? out : out.join('');
};
// The same through `.pipe()` and 'data' events, which a classic stream (no
// 'close', no async iterator) needs.
const piped = (transform) =>
  new Promise((resolve, reject) => {
    const out = [];
    transform.on('data', (chunk) => out.push(String(chunk)));
    transform.on('end', () => resolve(out));
    transform.on('error', reject);
    Readable.from(CHUNKS).pipe(transform);
  });
const upper = (chunk) => String(chunk).toUpperCase();
// What a transform that fails rejects the pipeline with.
const failed = (transform) => failure(() => through(transform));
const web = async (stream) => Array.fromAsync(ReadableStream.from(CHUNKS).pipeThrough(stream));

export default {
  apis: [
    'stream:stream.Transform',
    'stream:new stream.Transform',
    'stream:transform._transform',
    'stream:transform._flush',
    'stream:stream.Duplex.from',
    'webstreams:TransformStream',
    'webstreams:new TransformStream',
    'webstreams:transformStreamDefaultController.enqueue',
  ],
  reviewedAt: 'v26.13.0',
  replaces: {
    'through2@5.0.12': {
      default: {
        native: () => through(new Transform({ transform: (chunk, encoding, done) => done(null, upper(chunk)) })),
        package: ({ default: through2 }) => through(through2((chunk, encoding, done) => done(null, upper(chunk)))),
      },
      'default: push': {
        native: () =>
          through(
            new Transform({
              transform(chunk, encoding, done) {
                this.push(chunk);
                this.push(chunk);
                done();
              },
            }),
          ),
        package: ({ default: through2 }) =>
          through(
            through2(function (chunk, encoding, done) {
              this.push(chunk);
              this.push(chunk);
              done();
            }),
          ),
      },
      'default: flush': {
        native: () =>
          through(
            new Transform({
              transform: (chunk, encoding, done) => done(null, chunk),
              flush: (done) => done(null, 'end'),
            }),
          ),
        package: ({ default: through2 }) =>
          through(
            through2(
              (chunk, encoding, done) => done(null, chunk),
              function (done) {
                this.push('end');
                done();
              },
            ),
          ),
      },
      'default: async function': {
        native: () =>
          through(
            Duplex.from(async function* (source) {
              for await (const chunk of source) yield upper(chunk);
            }),
          ),
        package: ({ default: through2 }) => through(through2(async (chunk) => upper(chunk))),
      },
      'default: async generator': {
        native: () =>
          through(
            Duplex.from(async function* (source) {
              let joined = '';
              for await (const chunk of source) joined += chunk;
              yield* joined.match(/../g).reverse();
            }),
          ),
        package: ({ default: through2 }) =>
          through(
            through2(async function* (source) {
              let joined = '';
              for await (const chunk of source) joined += chunk;
              yield* joined.match(/../g).reverse();
            }),
          ),
      },
      'default: error': {
        native: () => failed(new Transform({ transform: (chunk, encoding, done) => done(new Error('bad chunk')) })),
        package: ({ default: through2 }) => failed(through2((chunk, encoding, done) => done(new Error('bad chunk')))),
      },
      obj: {
        native: () =>
          through(new Transform({ objectMode: true, transform: (record, encoding, done) => done(null, { n: record.n * 2 }) }), RECORDS, true),
        package: ({ default: through2 }) => through(through2.obj((record, encoding, done) => done(null, { n: record.n * 2 })), RECORDS, true),
      },
      objectTransform: {
        native: () =>
          through(new Transform({ objectMode: true, transform: (record, encoding, done) => done(null, { n: record.n + 1 }) }), RECORDS, true),
        package: ({ objectTransform }) => through(objectTransform(async (record) => ({ n: record.n + 1 })), RECORDS, true),
      },
      ctor: {
        native: () => {
          class Upper extends Transform {
            _transform(chunk, encoding, done) {
              done(null, upper(chunk));
            }
          }
          return through(new Upper());
        },
        package: ({ default: through2 }) => {
          const Upper = through2.ctor((chunk, encoding, done) => done(null, upper(chunk)));
          return through(new Upper());
        },
      },
    },
    'through2@5.0.12/web': {
      transform: {
        native: () => web(new TransformStream({ transform: (chunk, controller) => controller.enqueue(upper(chunk)) })),
        package: ({ transform }) => web(transform(async (chunk) => upper(chunk))),
      },
      'transform: controller': {
        native: () =>
          web(
            new TransformStream({
              transform(chunk, controller) {
                controller.enqueue(chunk);
                controller.enqueue(chunk.length);
              },
            }),
          ),
        package: ({ transform }) =>
          web(
            transform((chunk, controller) => {
              controller.enqueue(chunk);
              controller.enqueue(chunk.length);
            }),
          ),
      },
    },
    'through@2.3.8': {
      'default: in a pipeline': {
        improves: 'stream.pipeline finishes with a native Transform; a through stream ends without the close event pipeline waits for, so pipeline rejects with ERR_STREAM_PREMATURE_CLOSE',
        native: () => failed(new Transform({ transform: (chunk, encoding, done) => done(null, chunk) })),
        package: ({ default: classic }) =>
          failed(
            classic(function (chunk) {
              this.queue(chunk);
            }),
          ),
      },
      default: {
        native: () =>
          piped(
            new Transform({
              objectMode: true,
              transform: (chunk, encoding, done) => done(null, upper(chunk)),
              flush: (done) => done(null, 'end'),
            }),
          ),
        package: ({ default: classic }) =>
          piped(
            classic(
              function (chunk) {
                this.queue(upper(chunk));
              },
              function () {
                this.queue('end');
                this.queue(null);
              },
            ),
          ),
      },
    },
  },
};
