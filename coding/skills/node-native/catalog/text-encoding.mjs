// Encode text to UTF-8 bytes and decode bytes in UTF-8 and the legacy encodings.
import { outcome } from './support/outcome.mjs';

const TEXT = 'héllo ✓ 😀';
const encoded = (TextEncoder) => {
  const encoder = new TextEncoder();
  return [encoder.encoding, [...encoder.encode(TEXT)]];
};
// Decoding UTF-8, a byte-order mark, an invalid byte, a split sequence and
// three legacy encodings.
const decoded = (TextDecoder) => {
  const streaming = new TextDecoder();
  return [
    new TextDecoder().decode(new TextEncoder().encode(TEXT)),
    new TextDecoder().decode(new Uint8Array([0xef, 0xbb, 0xbf, 0x61])),
    new TextDecoder().decode(new Uint8Array([0xff])),
    outcome(() => new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array([0xff]))),
    streaming.decode(new Uint8Array([0xe2, 0x9c]), { stream: true }) + streaming.decode(new Uint8Array([0x93])),
    new TextDecoder('utf-16le').decode(new Uint8Array([104, 0, 105, 0])),
    new TextDecoder('windows-1252').decode(new Uint8Array([0x80])),
    new TextDecoder('shift_jis').decode(new Uint8Array([0x82, 0xa0])),
  ];
};
const into = (TextEncoder) => {
  const target = new Uint8Array(4);
  const encoder = new TextEncoder();
  return typeof encoder.encodeInto === 'function' ? [encoder.encodeInto('é!', target), [...target]] : 'no encodeInto';
};

export default {
  apis: ['globals:TextEncoder', 'globals:TextDecoder', 'js:TextEncoder.prototype.encodeInto'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'text-encoding@0.7.0': {
      TextEncoder: {
        native: () => encoded(TextEncoder),
        package: ({ default: { TextEncoder } }) => encoded(TextEncoder),
      },
      TextDecoder: {
        native: () => decoded(TextDecoder),
        package: ({ default: { TextDecoder } }) => decoded(TextDecoder),
      },
      'TextEncoder: encodeInto': {
        improves: 'TextEncoder has encodeInto(), which writes into an existing Uint8Array; text-encoding has none',
        native: () => into(TextEncoder),
        package: ({ default: { TextEncoder } }) => into(TextEncoder),
      },
      'TextEncoder: legacy encodings': {
        gap: 'text-encoding can encode UTF-16 with NONSTANDARD_allowLegacyEncoding; TextEncoder only encodes UTF-8 and ignores the label',
        native: () => {
          const encoder = new TextEncoder('utf-16le');
          return [encoder.encoding, [...encoder.encode('hi')]];
        },
        package: ({ default: { TextEncoder } }) => {
          const encoder = new TextEncoder('utf-16le', { NONSTANDARD_allowLegacyEncoding: true });
          return [encoder.encoding, [...encoder.encode('hi')]];
        },
      },
    },
    'fastestsmallesttextencoderdecoder@1.0.22': {
      TextEncoder: {
        native: () => TextEncoder,
        package: ({ default: { TextEncoder } }) => TextEncoder,
      },
      TextDecoder: {
        native: () => TextDecoder,
        package: ({ default: { TextDecoder } }) => TextDecoder,
      },
      encode: {
        native: () => [...new TextEncoder().encode(TEXT)],
        package: ({ default: { encode } }) => [...encode(TEXT)],
      },
      decode: {
        native: () => new TextDecoder().decode(new TextEncoder().encode(TEXT)),
        package: ({ default: { decode } }) => decode(new TextEncoder().encode(TEXT)),
      },
    },
  },
};
