// Binary data as Buffer: build it from strings, arrays and bytes, encode it as
// text (hex, base64, base64url, latin1), and read and write numbers in it.
import { Buffer } from 'node:buffer';
import { outcome } from './support/outcome.mjs';

const TEXT = 'héllo?>>~ ✓';
const BYTES = [0, 1, 127, 128, 250, 251, 255];
// Numbers written into and read back from 16 bytes.
const numbers = (Buffer) => {
  const bytes = Buffer.alloc(16);
  bytes.writeUInt32BE(0xdeadbeef, 0);
  bytes.writeInt16LE(-2, 4);
  bytes.writeDoubleLE(1.5, 6);
  return [bytes.toString('hex'), bytes.readUInt32BE(0), bytes.readInt16LE(4), bytes.readDoubleLE(6), bytes.readUIntBE(0, 3)];
};
const bigints = (Buffer) => {
  const bytes = Buffer.alloc(8);
  bytes.writeBigUInt64LE(2n ** 63n + 5n);
  return [bytes.toString('hex'), bytes.readBigUInt64LE(), bytes.readBigInt64LE()];
};
// Encodings a Buffer reads text in and writes it out in.
const encodings = (Buffer) =>
  ['utf8', 'hex', 'base64', 'latin1', 'ascii', 'utf16le'].map((encoding) => Buffer.from(TEXT).toString(encoding));
const searches = (Buffer) => {
  const bytes = Buffer.from('abcabc');
  return [bytes.indexOf('c'), bytes.lastIndexOf('a'), bytes.includes('ca'), bytes.indexOf(Buffer.from('bc'), 2)];
};
const comparisons = (Buffer) => [
  Buffer.compare(Buffer.from('a'), Buffer.from('b')),
  Buffer.from('ab').equals(Buffer.from('ab')),
  Buffer.from('b').compare(Buffer.from('a')),
];
const plain = (bytes) => [...bytes];

export default {
  apis: [
    'buffer:Buffer',
    'buffer:Buffer.from',
    'buffer:Buffer.alloc',
    'buffer:Buffer.concat',
    'buffer:Buffer.byteLength',
    'buffer:Buffer.compare',
    'buffer:Buffer.isEncoding',
    'buffer:Buffer.copyBytesFrom',
    'buffer:buf.toString',
    'buffer:buf.write',
    'buffer:buf.subarray',
    'buffer:buf.indexOf',
    'buffer:buf.equals',
    'buffer:buf.toJSON',
    'buffer:buf.readUInt32BE',
    'buffer:buf.readBigUInt64LE',
    'buffer:buf.writeBigUInt64LE',
  ],
  reviewedAt: 'v26.13.0',
  replaces: {
    // `buffer` names Node's own module, so the probe loads the npm package by
    // its file.
    'buffer@6.0.3/index.js': {
      Buffer: {
        native: () => plain(Buffer.from(BYTES)),
        package: ({ Buffer }) => plain(Buffer.from(BYTES)),
      },
      'Buffer: encodings': {
        native: () => encodings(Buffer),
        package: ({ Buffer }) => encodings(Buffer),
      },
      'Buffer: decode hex and base64': {
        native: () => [plain(Buffer.from('c3a9ff', 'hex')), plain(Buffer.from('w6n/', 'base64')), plain(Buffer.from('abz', 'hex'))],
        package: ({ Buffer }) => [plain(Buffer.from('c3a9ff', 'hex')), plain(Buffer.from('w6n/', 'base64')), plain(Buffer.from('abz', 'hex'))],
      },
      'Buffer: base64url': {
        improves: 'the native Buffer reads and writes the base64url encoding; buffer@6 throws TypeError Unknown encoding',
        native: () => [Buffer.from(BYTES).toString('base64url'), plain(Buffer.from('AAF_gPr7_w', 'base64url'))],
        package: ({ Buffer }) => outcome(() => [Buffer.from(BYTES).toString('base64url'), plain(Buffer.from('AAF_gPr7_w', 'base64url'))]),
      },
      'Buffer: numbers': {
        native: () => numbers(Buffer),
        package: ({ Buffer }) => numbers(Buffer),
      },
      'Buffer: bigints': {
        native: () => bigints(Buffer),
        package: ({ Buffer }) => bigints(Buffer),
      },
      'Buffer: search': {
        native: () => searches(Buffer),
        package: ({ Buffer }) => searches(Buffer),
      },
      'Buffer: compare': {
        native: () => comparisons(Buffer),
        package: ({ Buffer }) => comparisons(Buffer),
      },
      'Buffer: alloc': {
        native: () => [plain(Buffer.alloc(4)), plain(Buffer.alloc(5, 'ab')), plain(Buffer.alloc(3, 7))],
        package: ({ Buffer }) => [plain(Buffer.alloc(4)), plain(Buffer.alloc(5, 'ab')), plain(Buffer.alloc(3, 7))],
      },
      'Buffer: concat': {
        native: () => plain(Buffer.concat([Buffer.from('ab'), Buffer.from([1, 2])], 3)),
        package: ({ Buffer }) => plain(Buffer.concat([Buffer.from('ab'), Buffer.from([1, 2])], 3)),
      },
      'Buffer: byteLength': {
        native: () => [Buffer.byteLength(TEXT), Buffer.byteLength('w6n/', 'base64'), Buffer.byteLength('abcd', 'hex')],
        package: ({ Buffer }) => [Buffer.byteLength(TEXT), Buffer.byteLength('w6n/', 'base64'), Buffer.byteLength('abcd', 'hex')],
      },
      'Buffer: write': {
        native: () => {
          const bytes = Buffer.alloc(6);
          return [bytes.write('hé', 1), plain(bytes)];
        },
        package: ({ Buffer }) => {
          const bytes = Buffer.alloc(6);
          return [bytes.write('hé', 1), plain(bytes)];
        },
      },
      'Buffer: subarray': {
        native: () => {
          const bytes = Buffer.from('abcdef');
          const view = bytes.subarray(1, 3);
          view[0] = 0x7a;
          return [view.toString(), bytes.toString()];
        },
        package: ({ Buffer }) => {
          const bytes = Buffer.from('abcdef');
          const view = bytes.subarray(1, 3);
          view[0] = 0x7a;
          return [view.toString(), bytes.toString()];
        },
      },
      'Buffer: toJSON': {
        native: () => Buffer.from('ab').toJSON(),
        package: ({ Buffer }) => Buffer.from('ab').toJSON(),
      },
      'Buffer: isEncoding': {
        native: () => ['utf8', 'hex', 'latin1', 'binary', 'nope'].map((name) => Buffer.isEncoding(name)),
        package: ({ Buffer }) => ['utf8', 'hex', 'latin1', 'binary', 'nope'].map((name) => Buffer.isEncoding(name)),
      },
      'Buffer: copyBytesFrom': {
        improves: 'the native Buffer.copyBytesFrom copies part of a typed array into a new Buffer; buffer@6 has no copyBytesFrom',
        native: () => outcome(() => plain(Buffer.copyBytesFrom(new Uint16Array([1, 2, 3]), 1, 1))),
        package: ({ Buffer }) => outcome(() => plain(Buffer.copyBytesFrom(new Uint16Array([1, 2, 3]), 1, 1))),
      },
    },
    'base64url@3.0.1': {
      default: {
        native: () => Buffer.from(TEXT).toString('base64url'),
        package: ({ default: base64url }) => base64url(TEXT),
      },
      encode: {
        native: () => Buffer.from(TEXT).toString('base64url'),
        package: ({ default: base64url }) => base64url.encode(TEXT),
      },
      'encode: encoding': {
        native: () => Buffer.from('ÿé', 'latin1').toString('base64url'),
        package: ({ default: base64url }) => base64url.encode('ÿé', 'latin1'),
      },
      'encode: Buffer': {
        native: () => Buffer.from(BYTES).toString('base64url'),
        package: ({ default: base64url }) => base64url.encode(Buffer.from(BYTES)),
      },
      decode: {
        native: () => Buffer.from('aMOpbGxvPz4-fiDinJM', 'base64url').toString(),
        package: ({ default: base64url }) => base64url.decode('aMOpbGxvPz4-fiDinJM'),
      },
      toBuffer: {
        native: () => plain(Buffer.from('AAF_gPr7_w', 'base64url')),
        package: ({ default: base64url }) => plain(base64url.toBuffer('AAF_gPr7_w')),
      },
      toBase64: {
        native: () => Buffer.from('aMOpbGxvPz4-fiDinJM', 'base64url').toString('base64'),
        package: ({ default: base64url }) => base64url.toBase64('aMOpbGxvPz4-fiDinJM'),
      },
      fromBase64: {
        native: () => Buffer.from('+/+/==', 'base64').toString('base64url'),
        package: ({ default: base64url }) => base64url.fromBase64('+/+/=='),
      },
    },
  },
  lint: {
    noNewBuffer: {
      eslint: '10.12.0',
      plugin: 'eslint-plugin-unicorn@79.0.0',
      rule: 'unicorn/no-new-buffer',
      on: 'modern-node/recommended',
      code: 'const bytes = new Buffer(16);',
    },
  },
};
