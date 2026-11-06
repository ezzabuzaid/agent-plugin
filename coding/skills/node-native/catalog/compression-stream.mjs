// Compress and decompress a stream of bytes with the web CompressionStream and
// DecompressionStream (gzip, deflate, deflate-raw, brotli).
import { deflateRawSync, deflateSync, gunzipSync, gzipSync, inflateRawSync, inflateSync } from 'node:zlib';

const TEXT = 'hello hello hello compression '.repeat(20);
const input = () => new TextEncoder().encode(TEXT);
const hex = (bytes) => Buffer.from(bytes).toString('hex');
// The bytes split into three chunks, as a stream delivers them.
const chunks = (bytes) => [bytes.subarray(0, 100), bytes.subarray(100, 300), bytes.subarray(300)];
// Pipes the chunks through a web transform and joins what comes out.
const piped = async (transform, bytes) => {
  const out = await Array.fromAsync(ReadableStream.from(chunks(bytes)).pipeThrough(transform));
  return Buffer.concat(out);
};
// Pushes the chunks into an fflate stream and joins what it emits.
const pushed = (stream, bytes) => {
  const out = [];
  stream.ondata = (data) => out.push(data);
  const parts = chunks(bytes);
  parts.forEach((part, index) => stream.push(part, index === parts.length - 1));
  return Buffer.concat(out);
};
// Compressed bytes from either side, decoded with zlib: the encoders differ,
// so only what the bytes decode to is compared.
const decodedBy = { gzip: gunzipSync, deflate: inflateSync, 'deflate-raw': inflateRawSync };
const encodedBy = { gzip: gzipSync, deflate: deflateSync, 'deflate-raw': deflateRawSync };
const rows = (format, Compressor, Decompressor) => ({
  [Compressor]: {
    native: async () => decodedBy[format](await piped(new CompressionStream(format), input())).toString(),
    package: (fflate) => decodedBy[format](pushed(new fflate[Compressor](), input())).toString(),
  },
  [Decompressor]: {
    native: async () => hex(await piped(new DecompressionStream(format), encodedBy[format](input()))),
    package: (fflate) => hex(pushed(new fflate[Decompressor](), encodedBy[format](input()))),
  },
});

export default {
  apis: ['globals:CompressionStream', 'globals:DecompressionStream', 'webstreams:new CompressionStream', 'webstreams:new DecompressionStream'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'fflate@0.8.3': {
      ...rows('gzip', 'Gzip', 'Gunzip'),
      ...rows('deflate', 'Zlib', 'Unzlib'),
      ...rows('deflate-raw', 'Deflate', 'Inflate'),
      'Decompress: any format': {
        gap: 'DecompressionStream needs the format named; fflate Decompress detects gzip, zlib or raw deflate from the bytes',
        native: async () => {
          try {
            return hex(await piped(new DecompressionStream('deflate'), gzipSync(input())));
          } catch (error) {
            return `threw ${error.name}`;
          }
        },
        package: ({ Decompress }) => hex(pushed(new Decompress(), gzipSync(input()))),
      },
    },
  },
};
