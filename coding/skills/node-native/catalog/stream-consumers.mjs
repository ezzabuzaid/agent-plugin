// Read a whole stream into one value: text, JSON, a Buffer, bytes, an
// ArrayBuffer, a Blob, or an array of its chunks.
import { Readable } from 'node:stream';
import { arrayBuffer, blob, buffer, bytes, json, text } from 'node:stream/consumers';
import { failure } from './support/outcome.mjs';

const TEXT = 'héllo ✓';
// A byte stream of TEXT split inside a multi-byte character.
const split = () => {
  const encoded = Buffer.from(TEXT);
  return Readable.from([encoded.subarray(0, 2), encoded.subarray(2, 9), encoded.subarray(9)]);
};
const records = () => Readable.from([{ n: 1 }, { n: 2 }]);
const jsonStream = () => Readable.from([Buffer.from('{"a":'), Buffer.from('[1,2]}')]);
const web = () => new Blob(['wé', '!']).stream();
const plain = (value) => [...new Uint8Array(value)];
// Reads `stream` with a callback-style writable such as concat-stream's.
const collected = (stream, make) => new Promise((resolve) => stream.pipe(make(resolve)));

export default {
  apis: [
    'webstreams:streamConsumers.text',
    'webstreams:streamConsumers.json',
    'webstreams:streamConsumers.buffer',
    'webstreams:streamConsumers.bytes',
    'webstreams:streamConsumers.arrayBuffer',
    'webstreams:streamConsumers.blob',
    'stream:readable.toArray',
  ],
  reviewedAt: 'v26.13.0',
  replaces: {
    'get-stream@9.0.1': {
      default: {
        native: () => text(split()),
        package: ({ default: getStream }) => getStream(split()),
      },
      'default: web stream': {
        native: () => text(web()),
        package: ({ default: getStream }) => getStream(web()),
      },
      getStreamAsBuffer: {
        native: async () => plain(await buffer(split())),
        package: async ({ getStreamAsBuffer }) => plain(await getStreamAsBuffer(split())),
      },
      getStreamAsArrayBuffer: {
        native: async () => plain(await arrayBuffer(split())),
        package: async ({ getStreamAsArrayBuffer }) => plain(await getStreamAsArrayBuffer(split())),
      },
      getStreamAsArray: {
        native: () => records().toArray(),
        package: ({ getStreamAsArray }) => getStreamAsArray(records()),
      },
      'default: maxBuffer': {
        gap: 'the consumers read the whole stream; they have no size limit like get-stream maxBuffer, which rejects with MaxBufferError',
        native: () => failure(() => text(Readable.from(['abcdef'])), (error) => error.name),
        package: ({ default: getStream }) => failure(() => getStream(Readable.from(['abcdef']), { maxBuffer: 3 }), (error) => error.name),
      },
    },
    'concat-stream@2.0.0': {
      default: {
        native: async () => plain(await buffer(split())),
        package: async ({ default: concat }) => plain(await collected(split(), (done) => concat(done))),
      },
      'default: string encoding': {
        native: () => text(split()),
        package: ({ default: concat }) => collected(split(), (done) => concat({ encoding: 'string' }, done)),
      },
      'default: uint8array encoding': {
        native: async () => plain(await bytes(split())),
        package: async ({ default: concat }) => plain(await collected(split(), (done) => concat({ encoding: 'uint8array' }, done))),
      },
      'default: objects': {
        native: () => records().toArray(),
        package: ({ default: concat }) => collected(records(), (done) => concat({ encoding: 'object' }, done)),
      },
      'default: empty stream': {
        gap: 'buffer() of an empty stream is an empty Buffer; concat-stream, which guesses the type from the first chunk, gives an empty array',
        native: async () => buffer(Readable.from([])),
        package: ({ default: concat }) => collected(Readable.from([]), (done) => concat(done)),
      },
    },
    'stream-to-array@2.3.0': {
      default: {
        native: () => records().toArray(),
        package: ({ default: toArray }) => toArray(records()),
      },
    },
    'raw-body@4.0.0': {
      default: {
        native: async () => plain(await buffer(split())),
        package: async ({ default: getRawBody }) => plain(await getRawBody(split())),
      },
      'default: encoding': {
        native: () => text(split()),
        package: ({ default: getRawBody }) => getRawBody(split(), { encoding: 'utf-8' }),
      },
      getRawBodyWeb: {
        native: () => text(web()),
        package: ({ getRawBodyWeb }) => getRawBodyWeb(web(), 'utf-8'),
      },
      'default: limit': {
        gap: 'the consumers have no byte limit; raw-body rejects past { limit } with a 413 entity.too.large error',
        native: () => failure(() => buffer(Readable.from([Buffer.from('abcdef')])), (error) => error.type),
        package: ({ default: getRawBody }) => failure(() => getRawBody(Readable.from([Buffer.from('abcdef')]), { limit: 3 }), (error) => error.type),
      },
      'default: length': {
        gap: 'the consumers do not check the length a Content-Length header declares; raw-body rejects a mismatch with a 400 request.size.invalid error',
        native: () => failure(() => buffer(Readable.from([Buffer.from('abcdef')])), (error) => error.type),
        package: ({ default: getRawBody }) => failure(() => getRawBody(Readable.from([Buffer.from('abcdef')]), { length: 3 }), (error) => error.type),
      },
    },
    'bl@7.0.14': {
      BufferListStream: {
        native: () => text(split()),
        package: ({ BufferListStream }) =>
          new Promise((resolve, reject) => {
            split().pipe(new BufferListStream((error, list) => (error ? reject(error) : resolve(list.toString()))));
          }),
      },
    },
  },
  idioms: {
    // Collecting 'data' chunks and joining them on 'end'.
    concatOnEnd: {
      seed: 'Buffer\\.concat\\(chunks',
      native: async () => plain(await buffer(split())),
      idiom: () =>
        new Promise((resolve, reject) => {
          const chunks = [];
          const stream = split();
          stream.on('data', (chunk) => chunks.push(chunk));
          stream.on('end', () => resolve(plain(Buffer.concat(chunks))));
          stream.on('error', reject);
        }),
    },
    // Appending each chunk to a string: a character split across two chunks
    // turns into replacement characters.
    stringOnEnd: {
      seed: "\\+= chunk",
      improves: 'text() decodes across chunk boundaries; appending each chunk to a string decodes it alone, so a character split between chunks becomes U+FFFD',
      native: () => text(split()),
      idiom: () =>
        new Promise((resolve, reject) => {
          let body = '';
          const stream = split();
          stream.on('data', (chunk) => {
            body += chunk;
          });
          stream.on('end', () => resolve(body));
          stream.on('error', reject);
        }),
    },
    jsonOnEnd: {
      seed: 'JSON\\.parse\\(Buffer\\.concat\\(',
      native: () => json(jsonStream()),
      idiom: () =>
        new Promise((resolve, reject) => {
          const chunks = [];
          const stream = jsonStream();
          stream.on('data', (chunk) => chunks.push(chunk));
          stream.on('end', () => resolve(JSON.parse(Buffer.concat(chunks).toString())));
          stream.on('error', reject);
        }),
    },
    blobFromChunks: {
      seed: 'new Blob\\(\\s*(?:[\\w$]+|await\\s[^)]*\\.toArray\\(\\))\\s*[,)]',
      native: async () => (await blob(split())).text(),
      idiom: async () => {
        const chunks = [];
        for await (const chunk of split()) chunks.push(chunk);
        return new Blob(chunks).text();
      },
    },
  },
};
