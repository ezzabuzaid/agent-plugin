// Compress and decompress bytes with deflate, raw deflate, zlib and gzip, in
// one call or as a stream.
import { Readable } from 'node:stream';
import { buffer } from 'node:stream/consumers';
import {
  createDeflate,
  createInflate,
  deflateRawSync,
  deflateSync,
  gunzipSync,
  gzipSync,
  inflateRawSync,
  inflateSync,
  unzipSync,
} from 'node:zlib';
import { outcome } from './support/outcome.mjs';

const message = (error) => error.message;
const TEXT = 'hello hello hello compression '.repeat(20);
const input = () => new TextEncoder().encode(TEXT);
const hex = (bytes) => Buffer.from(bytes).toString('hex');
const text = (bytes) => Buffer.from(bytes).toString();
const dictionary = () => new TextEncoder().encode('hello compression');
// Byte 9 of a gzip header names the OS that wrote it; zlib writes the
// platform's code (19 on macOS, 3 on Linux), so it is zeroed before comparing.
const withoutOs = (bytes) => {
  const copy = Buffer.from(bytes);
  copy[9] = 0;
  return hex(copy);
};
// Fixed streams the decoders read: zlib's own output.
const deflated = () => deflateSync(input());
const gzipped = () => gzipSync(input());
// Streams the input through a zlib transform in three chunks.
const streamed = async (transform, bytes) =>
  hex(await buffer(Readable.from([bytes.subarray(0, 100), bytes.subarray(100, 300), bytes.subarray(300)]).pipe(transform)));
// Feeds a pako Deflate or Inflate the same three chunks.
const pushed = (Stream, bytes) => {
  const stream = new Stream();
  stream.push(bytes.subarray(0, 100), false);
  stream.push(bytes.subarray(100, 300), false);
  stream.push(bytes.subarray(300), true);
  return hex(stream.result);
};

export default {
  apis: [
    'zlib:zlib.deflateSync',
    'zlib:zlib.inflateSync',
    'zlib:zlib.deflateRawSync',
    'zlib:zlib.inflateRawSync',
    'zlib:zlib.gzipSync',
    'zlib:zlib.gunzipSync',
    'zlib:zlib.unzipSync',
    'zlib:zlib.createDeflate',
    'zlib:zlib.createInflate',
  ],
  reviewedAt: 'v26.13.0',
  replaces: {
    // pako is a port of zlib: at the same options it writes the same bytes.
    'pako@3.0.3': {
      deflate: {
        native: () => hex(deflateSync(input())),
        package: ({ deflate }) => hex(deflate(input())),
      },
      'deflate: level': {
        native: () => hex(deflateSync(input(), { level: 9 })),
        package: ({ deflate }) => hex(deflate(input(), { level: 9 })),
      },
      'deflate: dictionary': {
        native: () => hex(deflateSync(input(), { dictionary: dictionary() })),
        package: ({ deflate }) => hex(deflate(input(), { dictionary: dictionary() })),
      },
      'deflate: string input': {
        native: () => hex(deflateSync(TEXT)),
        package: ({ deflate }) => hex(deflate(TEXT)),
      },
      deflateRaw: {
        native: () => hex(deflateRawSync(input())),
        package: ({ deflateRaw }) => hex(deflateRaw(input())),
      },
      gzip: {
        native: () => withoutOs(gzipSync(input())),
        package: ({ gzip }) => withoutOs(gzip(input())),
      },
      inflate: {
        native: () => hex(inflateSync(deflated())),
        package: ({ inflate }) => hex(inflate(deflated())),
      },
      'inflate: toText': {
        native: () => inflateSync(deflated()).toString(),
        package: ({ inflate }) => inflate(deflated(), { toText: true }),
      },
      'inflate: dictionary': {
        native: () => text(inflateSync(deflateSync(input(), { dictionary: dictionary() }), { dictionary: dictionary() })),
        package: ({ inflate }) => text(inflate(deflateSync(input(), { dictionary: dictionary() }), { dictionary: dictionary() })),
      },
      'inflate: corrupt input': {
        native: () => outcome(() => inflateSync(Buffer.from('not deflate')), message),
        package: ({ inflate }) => outcome(() => inflate(Buffer.from('not deflate')), message),
      },
      inflateRaw: {
        native: () => hex(inflateRawSync(deflateRawSync(input()))),
        package: ({ inflateRaw }) => hex(inflateRaw(deflateRawSync(input()))),
      },
      ungzip: {
        native: () => hex(gunzipSync(gzipped())),
        package: ({ ungzip }) => hex(ungzip(gzipped())),
      },
      // pako.inflate reads zlib and gzip streams alike, as zlib.unzip does.
      'inflate: gzip input': {
        native: () => hex(unzipSync(gzipped())),
        package: ({ inflate }) => hex(inflate(gzipped())),
      },
      Deflate: {
        native: () => streamed(createDeflate(), input()),
        package: ({ Deflate }) => pushed(Deflate, input()),
      },
      Inflate: {
        native: () => streamed(createInflate(), deflated()),
        package: ({ Inflate }) => pushed(Inflate, deflated()),
      },
    },
    // fflate has its own encoder: its streams decode to the same bytes, but
    // are not byte-for-byte zlib's.
    'fflate@0.8.3': {
      zlibSync: {
        native: () => text(inflateSync(deflateSync(input()))),
        package: ({ zlibSync }) => text(inflateSync(zlibSync(input()))),
      },
      'zlibSync: bytes': {
        gap: "zlib's encoder writes other bytes than fflate's at the same level; both decode to the same input",
        native: () => hex(deflateSync(input())),
        package: ({ zlibSync }) => hex(zlibSync(input())),
      },
      unzlibSync: {
        native: () => hex(inflateSync(deflated())),
        package: ({ unzlibSync }) => hex(unzlibSync(deflated())),
      },
      deflateSync: {
        native: () => text(inflateRawSync(deflateRawSync(input()))),
        package: ({ deflateSync: deflate }) => text(inflateRawSync(deflate(input()))),
      },
      inflateSync: {
        native: () => hex(inflateRawSync(deflateRawSync(input()))),
        package: ({ inflateSync: inflate }) => hex(inflate(deflateRawSync(input()))),
      },
      gzipSync: {
        native: () => text(gunzipSync(gzipSync(input()))),
        package: ({ gzipSync: gzip }) => text(gunzipSync(gzip(input()))),
      },
      'gzipSync: mtime': {
        gap: 'zlib writes 0 as the gzip modification time; fflate writes the current time unless { mtime } is given',
        native: () => hex(gzipSync(input()).subarray(4, 8)),
        package: ({ gzipSync: gzip }) => hex(gzip(input()).subarray(4, 8)),
      },
      gunzipSync: {
        native: () => hex(gunzipSync(gzipped())),
        package: ({ gunzipSync: gunzip }) => hex(gunzip(gzipped())),
      },
      decompressSync: {
        native: () => [hex(unzipSync(gzipped())), hex(unzipSync(deflated()))],
        package: ({ decompressSync }) => [hex(decompressSync(gzipped())), hex(decompressSync(deflated()))],
      },
      'gunzipSync: corrupt input': {
        gap: 'zlib throws an Error with a Z_ code and the zlib message; fflate throws its own message and numeric code',
        native: () => outcome(() => gunzipSync(Buffer.from('not gzip at all')), message),
        package: ({ gunzipSync: gunzip }) => outcome(() => gunzip(Buffer.from('not gzip at all')), message),
      },
    },
  },
};
