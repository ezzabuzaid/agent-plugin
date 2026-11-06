// Derive a key from a password with scrypt.
import { scrypt, scryptSync } from 'node:crypto';

const PASSWORD = 'correct horse';
const SALT = () => new Uint8Array(16).fill(3);
const COST = { N: 1024, r: 8, p: 1 };
const hex = (bytes) => Buffer.from(bytes).toString('hex');
const nativeHex = () => scryptSync(PASSWORD, SALT(), 32, COST).toString('hex');
const encode = (text) => new TextEncoder().encode(text);

export default {
  apis: ['crypto:crypto.scrypt', 'crypto:crypto.scryptSync'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'scrypt-js@3.0.1': {
      scrypt: {
        native: () =>
          new Promise((resolve, reject) =>
            scrypt(PASSWORD, SALT(), 32, COST, (error, key) => (error ? reject(error) : resolve(key.toString('hex')))),
          ),
        package: async ({ default: { scrypt: derive } }) => hex(await derive(encode(PASSWORD), SALT(), COST.N, COST.r, COST.p, 32)),
      },
      syncScrypt: {
        native: nativeHex,
        package: ({ default: { syncScrypt } }) => hex(syncScrypt(encode(PASSWORD), SALT(), COST.N, COST.r, COST.p, 32)),
      },
    },
    '@noble/hashes@2.4.0/scrypt.js': {
      scrypt: {
        native: nativeHex,
        package: ({ scrypt: derive }) => hex(derive(PASSWORD, SALT(), { ...COST, dkLen: 32 })),
      },
      scryptAsync: {
        native: nativeHex,
        package: async ({ scryptAsync }) => hex(await scryptAsync(PASSWORD, SALT(), { ...COST, dkLen: 32 })),
      },
    },
    'hash-wasm@4.12.0': {
      scrypt: {
        native: nativeHex,
        package: ({ scrypt: derive }) =>
          derive({ password: PASSWORD, salt: SALT(), costFactor: COST.N, blockSize: COST.r, parallelism: COST.p, hashLength: 32, outputType: 'hex' }),
      },
    },
  },
};
