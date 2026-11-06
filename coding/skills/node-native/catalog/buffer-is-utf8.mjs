// Check whether bytes are valid UTF-8 (or plain ASCII) without decoding them.
import { isAscii, isUtf8 } from 'node:buffer';

// Valid text, then the malformed sequences a validator must refuse: a stray
// continuation byte, an overlong NUL, a UTF-16 surrogate, a code point past
// U+10FFFF and a truncated sequence.
const SAMPLES = [
  [0x68, 0xc3, 0xa9, 0xe2, 0x9c, 0x93, 0xf0, 0x9f, 0x98, 0x80],
  [],
  [0x80],
  [0xc0, 0x80],
  [0xed, 0xa0, 0x80],
  [0xf4, 0x90, 0x80, 0x80],
  [0xe2, 0x9c],
];
const checked = (check) => SAMPLES.map((bytes) => check(Buffer.from(bytes)));

export default {
  apis: ['buffer:buffer.isUtf8', 'buffer:buffer.isAscii'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'utf-8-validate@6.0.6': {
      default: {
        native: () => checked(isUtf8),
        package: ({ default: isValidUTF8 }) => checked(isValidUTF8),
      },
    },
    'utf-8-validate@6.0.6/fallback.js': {
      default: {
        native: () => checked(isUtf8),
        package: ({ default: isValidUTF8 }) => checked(isValidUTF8),
      },
    },
    'isutf8@4.0.4': {
      default: {
        native: () => checked(isUtf8),
        package: ({ default: isUtf8Package }) => checked(isUtf8Package),
      },
    },
    'is-utf8@0.2.1': {
      default: {
        native: () => checked(isUtf8),
        package: ({ default: isUtf8Package }) => checked(isUtf8Package),
      },
    },
  },
  idioms: {
    asciiRegExp: {
      seed: '\\\\x00-\\\\x7[Ff]',
      native: () => [isAscii(Buffer.from('plain text')), isAscii(Buffer.from('héllo'))],
      idiom: () => [/^[\x00-\x7F]*$/.test(Buffer.from('plain text').toString('latin1')), /^[\x00-\x7F]*$/.test(Buffer.from('héllo').toString('latin1'))],
    },
  },
};
