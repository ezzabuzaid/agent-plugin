// Derive keys from input keying material with HKDF (RFC 5869).
import { createHmac, hkdfSync } from 'node:crypto';

const IKM = () => new Uint8Array(32).fill(9);
const SALT = 'salt';
const INFO = 'context';
const hex = (bytes) => Buffer.from(bytes).toString('hex');
const encode = (text) => new TextEncoder().encode(text);
const nativeHex = (digest, length) => hex(hkdfSync(digest, IKM(), SALT, INFO, length));

export default {
  apis: ['crypto:crypto.hkdf', 'crypto:crypto.hkdfSync', 'webcrypto:subtle.deriveBits'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'futoin-hkdf@1.5.3': {
      default: {
        native: () => nativeHex('sha256', 42),
        package: ({ default: hkdf }) => hkdf(Buffer.from(IKM()), 42, { salt: SALT, info: INFO, hash: 'SHA-256' }).toString('hex'),
      },
      'default: SHA-512': {
        native: async () => {
          const key = await crypto.subtle.importKey('raw', IKM(), 'HKDF', false, ['deriveBits']);
          const bits = await crypto.subtle.deriveBits(
            { name: 'HKDF', hash: 'SHA-512', salt: new TextEncoder().encode(SALT), info: new TextEncoder().encode(INFO) },
            key,
            512,
          );
          return hex(bits);
        },
        package: ({ default: hkdf }) => hkdf(Buffer.from(IKM()), 64, { salt: SALT, info: INFO, hash: 'SHA-512' }).toString('hex'),
      },
      extract: {
        native: () => createHmac('sha256', SALT).update(IKM()).digest('hex'),
        package: ({ default: hkdf }) => hkdf.extract('SHA-256', 32, Buffer.from(IKM()), SALT).toString('hex'),
      },
      expand: {
        gap: 'crypto.hkdf always runs Extract then Expand; there is no native HKDF-Expand from an existing pseudorandom key',
        native: () => nativeHex('sha256', 42),
        package: ({ default: hkdf }) => hkdf.expand('SHA-256', 32, Buffer.from(IKM()), 42, INFO).toString('hex'),
      },
    },
    '@noble/hashes@2.4.0/hkdf.js': {
      hkdf: {
        native: () => nativeHex('sha256', 42),
        package: async ({ hkdf }, { load }) => hex(hkdf((await load('@noble/hashes/sha2.js')).sha256, IKM(), encode(SALT), encode(INFO), 42)),
      },
      'hkdf: SHA-512': {
        native: () => nativeHex('sha512', 64),
        package: async ({ hkdf }, { load }) => hex(hkdf((await load('@noble/hashes/sha2.js')).sha512, IKM(), encode(SALT), encode(INFO), 64)),
      },
      extract: {
        native: () => createHmac('sha256', SALT).update(IKM()).digest('hex'),
        package: async ({ extract }, { load }) => hex(extract((await load('@noble/hashes/sha2.js')).sha256, IKM(), encode(SALT))),
      },
      expand: {
        gap: 'crypto.hkdf always runs Extract then Expand; there is no native HKDF-Expand from an existing pseudorandom key',
        native: () => nativeHex('sha256', 42),
        package: async ({ expand }, { load }) => hex(expand((await load('@noble/hashes/sha2.js')).sha256, IKM(), encode(INFO), 42)),
      },
    },
  },
};
