// Compress and decompress bytes with Zstandard.
import { constants, zstdCompressSync, zstdDecompressSync } from 'node:zlib';

const TEXT = 'hello hello hello compression '.repeat(20);
const input = () => new TextEncoder().encode(TEXT);
const hex = (bytes) => Buffer.from(bytes).toString('hex');
const compressed = () => zstdCompressSync(input());
const level = (value) => ({ params: { [constants.ZSTD_c_compressionLevel]: value } });
// zstd-codec hands its API to a callback once its WebAssembly is ready.
const codec = (ZstdCodec) => new Promise((resolve) => ZstdCodec.run((zstd) => resolve(new zstd.Simple())));

export default {
  apis: ['zlib:zlib.zstdCompressSync', 'zlib:zlib.zstdDecompressSync'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'fzstd@0.1.1': {
      decompress: {
        native: () => hex(zstdDecompressSync(compressed())),
        package: ({ decompress }) => hex(decompress(compressed())),
      },
    },
    // zstd-codec is libzstd compiled to WebAssembly: at the same level it
    // writes the bytes zlib's Zstandard writes.
    'zstd-codec@0.1.5': {
      ZstdCodec: {
        native: () => hex(zstdCompressSync(input())),
        package: async ({ default: { ZstdCodec } }) => hex((await codec(ZstdCodec)).compress(input())),
      },
      'ZstdCodec: level': {
        native: () => hex(zstdCompressSync(input(), level(19))),
        package: async ({ default: { ZstdCodec } }) => hex((await codec(ZstdCodec)).compress(input(), 19)),
      },
      'ZstdCodec: decompress': {
        native: () => hex(zstdDecompressSync(compressed())),
        package: async ({ default: { ZstdCodec } }) => hex((await codec(ZstdCodec)).decompress(compressed())),
      },
    },
  },
};
