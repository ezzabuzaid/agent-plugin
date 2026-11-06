// Compare secrets (tokens, signatures, MACs) in constant time.
import { hash, timingSafeEqual } from 'node:crypto';
import { outcome } from './support/outcome.mjs';

const CASES = [
  ['s3cret-token', 's3cret-token'],
  ['s3cret-token', 's3cret-tokem'],
  ['s3cret-token', 's3cret'],
];
// Hashing both sides first gives equal lengths, so a length mismatch neither throws nor leaks.
const safeEqual = (a, b) => timingSafeEqual(hash('sha256', a, 'buffer'), hash('sha256', b, 'buffer'));
const each = (compare) => CASES.map(([a, b]) => compare(a, b));
const raw = (a, b) => outcome(() => timingSafeEqual(Buffer.from(a), Buffer.from(b)), (error) => error.code);
const lengthGap = 'crypto.timingSafeEqual throws RangeError on inputs of different byte lengths; the package returns false, so compare equal-length digests (or check the length first)';

export default {
  apis: ['crypto:crypto.timingSafeEqual'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'tsscmp@1.0.6': {
      default: {
        native: () => each(safeEqual),
        package: ({ default: compare }) => each(compare),
      },
      'default: different lengths': {
        gap: lengthGap,
        native: () => raw(...CASES[2]),
        package: ({ default: compare }) => compare(...CASES[2]),
      },
    },
    'safe-compare@1.1.4': {
      default: {
        native: () => each(safeEqual),
        package: ({ default: compare }) => each(compare),
      },
      'default: different lengths': {
        gap: lengthGap,
        native: () => raw(...CASES[2]),
        package: ({ default: compare }) => compare(...CASES[2]),
      },
    },
    'timing-safe-compare@1.0.1': {
      default: {
        native: () => each(safeEqual),
        package: ({ default: compare }) => each(compare),
      },
    },
  },
  idioms: {
    xorLoop: {
      seed: '\\|=\\s*\\(?\\s*\\w+(\\[\\w+\\]|\\.charCodeAt\\(\\w+\\))\\s*\\^',
      native: () => each(safeEqual),
      idiom: () =>
        each((a, b) => {
          if (a.length !== b.length) return false;
          let difference = 0;
          for (let index = 0; index < a.length; index++) difference |= a.charCodeAt(index) ^ b.charCodeAt(index);
          return difference === 0;
        }),
    },
  },
};
