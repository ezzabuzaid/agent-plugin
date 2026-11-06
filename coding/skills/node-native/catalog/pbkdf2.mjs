// Derive a key from a password with PBKDF2.
import { pbkdf2, pbkdf2Sync } from 'node:crypto';

const PASSWORD = 'correct horse';
const SALT = () => new Uint8Array(16).fill(3);
const ITERATIONS = 1000;
const hex = (bytes) => Buffer.from(bytes).toString('hex');
const nativeHex = (digest, length) => pbkdf2Sync(PASSWORD, SALT(), ITERATIONS, length, digest).toString('hex');
const subtleHex = async (hash, bits) => {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(PASSWORD), 'PBKDF2', false, ['deriveBits']);
  return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash, salt: SALT(), iterations: ITERATIONS }, key, bits));
};

export default {
  apis: ['crypto:crypto.pbkdf2', 'crypto:crypto.pbkdf2Sync', 'webcrypto:subtle.deriveBits'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'pbkdf2@3.1.7': {
      pbkdf2Sync: {
        native: () => nativeHex('sha256', 32),
        package: ({ pbkdf2Sync: derive }) => derive(PASSWORD, Buffer.from(SALT()), ITERATIONS, 32, 'sha256').toString('hex'),
      },
      pbkdf2: {
        native: () =>
          new Promise((resolve, reject) =>
            pbkdf2(PASSWORD, SALT(), ITERATIONS, 64, 'sha512', (error, key) => (error ? reject(error) : resolve(key.toString('hex')))),
          ),
        package: ({ pbkdf2: derive }) =>
          new Promise((resolve, reject) =>
            derive(PASSWORD, Buffer.from(SALT()), ITERATIONS, 64, 'sha512', (error, key) => (error ? reject(error) : resolve(key.toString('hex')))),
          ),
      },
    },
    'crypto-js@4.2.0': {
      PBKDF2: {
        native: () => nativeHex('sha256', 32),
        package: ({ default: CryptoJS }) =>
          CryptoJS.PBKDF2(PASSWORD, CryptoJS.enc.Hex.parse(hex(SALT())), { keySize: 8, iterations: ITERATIONS }).toString(),
      },
      'PBKDF2: SHA-1': {
        native: () => subtleHex('SHA-1', 160),
        package: ({ default: CryptoJS }) =>
          CryptoJS.PBKDF2(PASSWORD, CryptoJS.enc.Hex.parse(hex(SALT())), { keySize: 5, iterations: ITERATIONS, hasher: CryptoJS.algo.SHA1 }).toString(),
      },
    },
    'node-forge@1.4.3': {
      'pkcs5: pbkdf2': {
        native: () => nativeHex('sha256', 32),
        package: ({ default: forge }) => forge.util.bytesToHex(forge.pkcs5.pbkdf2(PASSWORD, String.fromCharCode(...SALT()), ITERATIONS, 32, 'sha256')),
      },
    },
    '@noble/hashes@2.4.0/pbkdf2.js': {
      pbkdf2: {
        native: () => nativeHex('sha256', 32),
        package: async ({ pbkdf2: derive }, { load }) => hex(derive((await load('@noble/hashes/sha2.js')).sha256, PASSWORD, SALT(), { c: ITERATIONS, dkLen: 32 })),
      },
      pbkdf2Async: {
        native: () => subtleHex('SHA-512', 512),
        package: async ({ pbkdf2Async }, { load }) => hex(await pbkdf2Async((await load('@noble/hashes/sha2.js')).sha512, PASSWORD, SALT(), { c: ITERATIONS, dkLen: 64 })),
      },
    },
    'hash-wasm@4.12.0': {
      pbkdf2: {
        native: () => subtleHex('SHA-256', 256),
        package: ({ pbkdf2: derive, createSHA256 }) =>
          derive({ password: PASSWORD, salt: SALT(), iterations: ITERATIONS, hashLength: 32, hashFunction: createSHA256(), outputType: 'hex' }),
      },
    },
  },
};
