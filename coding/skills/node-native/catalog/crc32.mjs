// CRC-32 checksums of bytes and strings, in one call or rolled over chunks.
import { crc32 } from 'node:zlib';

const TEXT = 'The quick brown fox jumps over the lazy dog ✓';
const bytes = () => new TextEncoder().encode(TEXT);
// crc-32 returns a signed 32-bit integer; zlib.crc32 an unsigned one.
const unsigned = (value) => value >>> 0;

export default {
  apis: ['zlib:zlib.crc32'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'crc-32@1.2.2': {
      buf: {
        native: () => crc32(bytes()),
        package: ({ default: CRC32 }) => unsigned(CRC32.buf(bytes())),
      },
      str: {
        native: () => crc32(TEXT),
        package: ({ default: CRC32 }) => unsigned(CRC32.str(TEXT)),
      },
      // bstr reads each UTF-16 code unit as one byte: a binary string.
      bstr: {
        native: () => crc32(Buffer.from(TEXT, 'latin1')),
        package: ({ default: CRC32 }) => unsigned(CRC32.bstr(TEXT)),
      },
      'buf: seed': {
        native: () => crc32('def', crc32('abc')),
        package: ({ default: CRC32 }) => unsigned(CRC32.str('def', CRC32.str('abc'))),
      },
      'buf: sign': {
        gap: 'zlib.crc32 returns an unsigned 32-bit integer; crc-32 returns it signed (apply >>> 0 to compare)',
        native: () => crc32(bytes()),
        package: ({ default: CRC32 }) => CRC32.buf(bytes()),
      },
    },
    'crc@4.3.2': {
      crc32: {
        native: () => crc32(bytes()),
        package: ({ crc32: crc }) => crc(bytes()),
      },
      'crc32: string': {
        native: () => crc32(TEXT),
        package: ({ crc32: crc }) => crc(TEXT),
      },
      'crc32: previous': {
        native: () => crc32('def', crc32('abc')),
        package: ({ crc32: crc }) => crc('def', crc('abc')),
      },
    },
  },
};
