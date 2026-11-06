// Compress and decompress bytes with Brotli.
import { brotliCompressSync, brotliDecompressSync, constants } from 'node:zlib';

const TEXT = 'hello hello hello compression '.repeat(20);
const input = () => new TextEncoder().encode(TEXT);
const hex = (bytes) => Buffer.from(bytes).toString('hex');
const quality = (level) => ({ params: { [constants.BROTLI_PARAM_QUALITY]: level } });
const textMode = { params: { [constants.BROTLI_PARAM_MODE]: constants.BROTLI_MODE_TEXT } };

export default {
  apis: ['zlib:zlib.brotliCompressSync', 'zlib:zlib.brotliDecompressSync', 'zlib:zlib.constants'],
  reviewedAt: 'v26.13.0',
  replaces: {
    // brotli is the reference encoder compiled to JavaScript: at the same
    // quality it writes the bytes zlib's Brotli writes.
    'brotli@2.1.0': {
      compress: {
        native: () => hex(brotliCompressSync(input())),
        package: async ({ compress }) => hex(await compress(input())),
      },
      'compress: quality': {
        native: () => hex(brotliCompressSync(input(), quality(5))),
        package: async ({ compress }) => hex(await compress(input(), { quality: 5 })),
      },
      'compress: text mode': {
        native: () => hex(brotliCompressSync(input(), textMode)),
        package: async ({ compress }) => hex(await compress(input(), { mode: 1 })),
      },
      decompress: {
        native: () => hex(brotliDecompressSync(brotliCompressSync(input()))),
        package: ({ decompress }) => hex(decompress(brotliCompressSync(input()))),
      },
    },
  },
};
