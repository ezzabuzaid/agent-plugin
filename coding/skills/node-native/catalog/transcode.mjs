// Decode bytes in a legacy character encoding, and convert text between the
// encodings Buffer knows (utf8, utf16le, latin1, ascii).
import { Buffer, transcode } from 'node:buffer';
import { outcome } from './support/outcome.mjs';

// One sample per WHATWG encoding family TextDecoder reads.
const SAMPLES = {
  shift_jis: [0x82, 0xa0],
  'euc-jp': [0xa4, 0xa2],
  gbk: [0xc4, 0xe3],
  big5: [0xa4, 0xa4],
  'euc-kr': [0xb0, 0xa1],
  'koi8-r': [0xc1],
  'windows-1251': [0xc0],
  'windows-1252': [0x80],
  'iso-8859-2': [0xa1],
  macintosh: [0x80],
  'utf-16be': [0, 104],
  'utf-16le': [104, 0],
};
const decodedAll = (decode) => Object.entries(SAMPLES).map(([encoding, bytes]) => decode(Buffer.from(bytes), encoding));
const hex = (bytes) => Buffer.from(bytes).toString('hex');
const TEXT = 'hé€';

export default {
  apis: ['globals:TextDecoder', 'buffer:buffer.transcode', 'buffer:Buffer.from', 'buffer:buf.toString'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'iconv-lite@0.7.3': {
      decode: {
        native: () => decodedAll((bytes, encoding) => new TextDecoder(encoding).decode(bytes)),
        package: ({ default: iconv }) => decodedAll((bytes, encoding) => iconv.decode(bytes, encoding)),
      },
      'decode: byte order mark': {
        native: () => new TextDecoder().decode(new Uint8Array([0xef, 0xbb, 0xbf, 0x61])),
        package: ({ default: iconv }) => iconv.decode(Buffer.from([0xef, 0xbb, 0xbf, 0x61]), 'utf8'),
      },
      'decode: invalid byte': {
        native: () => new TextDecoder().decode(new Uint8Array([0xff, 0x61])),
        package: ({ default: iconv }) => iconv.decode(Buffer.from([0xff, 0x61]), 'utf8'),
      },
      'decode: utf-32': {
        gap: 'TextDecoder has no UTF-32 (nor UTF-7); its constructor throws RangeError',
        native: () => outcome(() => new TextDecoder('utf-32le').decode(new Uint8Array([104, 0, 0, 0]))),
        package: ({ default: iconv }) => iconv.decode(Buffer.from([104, 0, 0, 0]), 'utf-32le'),
      },
      'decode: cp437': {
        gap: 'TextDecoder has no DOS code pages; its constructor throws RangeError for cp437',
        native: () => outcome(() => new TextDecoder('cp437').decode(new Uint8Array([0x80]))),
        package: ({ default: iconv }) => iconv.decode(Buffer.from([0x80]), 'cp437'),
      },
      getDecoder: {
        native: () => {
          const decoder = new TextDecoder('shift_jis');
          return decoder.decode(new Uint8Array([0x82]), { stream: true }) + decoder.decode(new Uint8Array([0xa0]));
        },
        package: ({ default: iconv }) => {
          const decoder = iconv.getDecoder('shift_jis');
          return decoder.write(Buffer.from([0x82])) + decoder.write(Buffer.from([0xa0])) + (decoder.end() ?? '');
        },
      },
      encode: {
        native: () => [hex(Buffer.from(TEXT)), hex(Buffer.from(TEXT, 'utf16le'))],
        package: ({ default: iconv }) => [hex(iconv.encode(TEXT, 'utf8')), hex(iconv.encode(TEXT, 'utf16le'))],
      },
      // A character latin1 cannot hold: transcode writes '?', as iconv-lite does.
      'encode: latin1': {
        native: () => hex(transcode(Buffer.from(TEXT), 'utf8', 'latin1')),
        package: ({ default: iconv }) => hex(iconv.encode(TEXT, 'latin1')),
      },
      'encode: latin1 through Buffer.from': {
        gap: "Buffer.from(text, 'latin1') keeps the low byte of a character latin1 cannot hold (€ becomes 0xac); iconv-lite writes '?'",
        native: () => hex(Buffer.from(TEXT, 'latin1')),
        package: ({ default: iconv }) => hex(iconv.encode(TEXT, 'latin1')),
      },
      'encode: legacy multi-byte encoding': {
        gap: 'Node encodes text only as UTF-8, UTF-16LE, latin1 and ASCII; TextEncoder writes UTF-8 alone, so there is no Shift_JIS, GBK or windows-1252 encoder',
        native: () => hex(new TextEncoder().encode('あ')),
        package: ({ default: iconv }) => hex(iconv.encode('あ', 'shift_jis')),
      },
    },
  },
};
