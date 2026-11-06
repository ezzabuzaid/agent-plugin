// Draw cryptographically secure random bytes, integers and strings.
import { randomBytes, randomFillSync, randomInt } from 'node:crypto';

// Random output is compared by what it is made of, never by value.
const bytesShape = (bytes) => ({ type: bytes.constructor.name, length: bytes.length, octets: [...bytes].every((byte) => byte >= 0 && byte <= 255) });
const textShape = (text, alphabet) => ({ length: text.length, alphabet: alphabet.test(text) });
const draws = (draw) => Array.from({ length: 1000 }, draw);
const intShape = (values, min, max) => ({ integers: values.every(Number.isInteger), inRange: values.every((value) => value >= min && value < max), coversRange: new Set(values).size === max - min });
const HEX = /^[0-9a-f]+$/;
const BASE64 = /^[A-Za-z0-9+/]+$/;
const BASE64URL = /^[\w-]+$/;
const DIGITS = /^\d+$/;
const BASE36 = /^[0-9a-z]+$/;
// One character of a set per secure random index.
const fromSet = (characters, length) => Array.from({ length }, () => characters[randomInt(characters.length)]).join('');
const ALPHANUMERIC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export default {
  apis: ['crypto:crypto.randomBytes', 'crypto:crypto.randomFillSync', 'crypto:crypto.randomInt', 'webcrypto:crypto.getRandomValues'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'randombytes@2.1.0': {
      default: {
        native: () => bytesShape(randomBytes(32)),
        package: ({ default: randombytes }) => bytesShape(randombytes(32)),
      },
    },
    'secure-random@1.1.2': {
      default: {
        native: () => bytesShape(Array.from(randomBytes(16))),
        package: ({ default: secureRandom }) => bytesShape(secureRandom(16)),
      },
      'default: Uint8Array': {
        native: () => bytesShape(crypto.getRandomValues(new Uint8Array(16))),
        package: ({ default: secureRandom }) => bytesShape(secureRandom(16, { type: 'Uint8Array' })),
      },
      'default: Buffer': {
        native: () => bytesShape(randomFillSync(Buffer.alloc(16))),
        package: ({ default: secureRandom }) => bytesShape(secureRandom(16, { type: 'Buffer' })),
      },
    },
    'crypto-random-string@6.0.0': {
      default: {
        native: () => textShape(randomBytes(5).toString('hex'), HEX),
        package: ({ default: cryptoRandomString }) => textShape(cryptoRandomString({ length: 10 }), HEX),
      },
      'default: base64': {
        native: () => textShape(randomBytes(9).toBase64(), BASE64),
        package: ({ default: cryptoRandomString }) => textShape(cryptoRandomString({ length: 12, type: 'base64' }), BASE64),
      },
      'default: numeric': {
        native: () => textShape(fromSet('0123456789', 12), DIGITS),
        package: ({ default: cryptoRandomString }) => textShape(cryptoRandomString({ length: 12, type: 'numeric' }), DIGITS),
      },
      'default: characters': {
        native: () => textShape(fromSet('abc', 12), /^[abc]+$/),
        package: ({ default: cryptoRandomString }) => textShape(cryptoRandomString({ length: 12, characters: 'abc' }), /^[abc]+$/),
      },
      'default: url-safe': {
        gap: "type 'url-safe' draws from A-Z a-z 0-9 - . _ ~ (RFC 3986 unreserved); base64url has no . or ~",
        native: () => new Set(draws(() => randomBytes(12).toString('base64url')).join('')).size,
        package: ({ default: cryptoRandomString }) => new Set(draws(() => cryptoRandomString({ length: 16, type: 'url-safe' })).join('')).size,
      },
    },
    'nanoid@6.0.2': {
      nanoid: {
        native: () => textShape(randomBytes(16).toString('base64url'), BASE64URL).alphabet,
        package: ({ nanoid }) => textShape(nanoid(), BASE64URL).alphabet,
      },
      'nanoid: length': {
        gap: 'nanoid() is 21 characters (126 bits); 16 random bytes in base64url are 22 characters (128 bits)',
        native: () => randomBytes(16).toString('base64url').length,
        package: ({ nanoid }) => nanoid().length,
      },
      customAlphabet: {
        native: () => textShape(fromSet(ALPHANUMERIC, 10), /^[A-Za-z0-9]{10}$/),
        package: ({ customAlphabet }) => textShape(customAlphabet(ALPHANUMERIC, 10)(), /^[A-Za-z0-9]{10}$/),
      },
    },
  },
  idioms: {
    mathRandomToken: {
      seed: 'Math\\.random\\(\\)\\.toString\\(36\\)',
      native: () => textShape(randomBytes(8).toString('hex'), BASE36).alphabet,
      idiom: () => textShape(Math.random().toString(36).slice(2), BASE36).alphabet,
    },
    mathRandomInt: {
      seed: 'Math\\.floor\\(Math\\.random\\(\\)\\s*\\*',
      native: () => intShape(draws(() => randomInt(5, 15)), 5, 15),
      idiom: () => intShape(draws(() => Math.floor(Math.random() * 10) + 5), 5, 15),
    },
  },
};
