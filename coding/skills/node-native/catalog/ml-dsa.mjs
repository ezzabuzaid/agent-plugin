// Post-quantum signatures with ML-DSA (FIPS 204): keys from a seed, sign, verify.
import { createPrivateKey, createPublicKey, sign, verify } from 'node:crypto';

const MESSAGE = () => new TextEncoder().encode('hello world');
const SEED = () => new Uint8Array(32).fill(5);
const hex = (bytes) => Buffer.from(bytes).toString('hex');
const VARIANTS = { ml_dsa44: 'ML-DSA-44', ml_dsa65: 'ML-DSA-65', ml_dsa87: 'ML-DSA-87' };
const signingKey = (name) => crypto.subtle.importKey('raw-seed', SEED(), name, true, ['sign']);
const verifyingKey = async (name) => crypto.subtle.getPublicKey(await signingKey(name), ['verify']);
const publicHex = async (name) => hex(await crypto.subtle.exportKey('raw-public', await verifyingKey(name)));
const keyObject = (name) => createPrivateKey({ key: SEED(), format: 'raw-seed', asymmetricKeyType: name.toLowerCase() });

export default {
  apis: [
    'webcrypto:subtle.importKey',
    'webcrypto:subtle.getPublicKey',
    'webcrypto:subtle.exportKey',
    'webcrypto:subtle.sign',
    'webcrypto:subtle.verify',
    'crypto:crypto.sign',
    'crypto:crypto.verify',
  ],
  reviewedAt: 'v26.13.0',
  replaces: {
    '@noble/post-quantum@0.7.1/ml-dsa.js': {
      ...Object.fromEntries(
        Object.entries(VARIANTS).map(([member, name]) => [
          `${member}: keygen`,
          { native: () => publicHex(name), package: (module) => hex(module[member].keygen(SEED()).publicKey) },
        ]),
      ),
      'ml_dsa65: verify': {
        // ML-DSA signing is randomised, so each side verifies the other's signature.
        native: async () => {
          const signature = await crypto.subtle.sign('ML-DSA-65', await signingKey('ML-DSA-65'), MESSAGE());
          return [await crypto.subtle.verify('ML-DSA-65', await verifyingKey('ML-DSA-65'), signature, MESSAGE()), signature.byteLength];
        },
        package: ({ ml_dsa65 }) => {
          const { secretKey, publicKey } = ml_dsa65.keygen(SEED());
          const signature = ml_dsa65.sign(MESSAGE(), secretKey);
          return [ml_dsa65.verify(signature, MESSAGE(), publicKey), signature.byteLength];
        },
      },
      'ml_dsa65: sign': {
        native: () => {
          const key = keyObject('ML-DSA-65');
          return verify(null, MESSAGE(), createPublicKey(key), sign(null, MESSAGE(), key));
        },
        package: ({ ml_dsa65 }) => {
          const { secretKey, publicKey } = ml_dsa65.keygen(SEED());
          return ml_dsa65.verify(ml_dsa65.sign(MESSAGE(), secretKey), MESSAGE(), publicKey);
        },
      },
      'ml_dsa65: signature interoperates': {
        // The package's signature verifies under the native public key made from the same seed.
        native: async () =>
          crypto.subtle.verify('ML-DSA-65', await verifyingKey('ML-DSA-65'), await crypto.subtle.sign('ML-DSA-65', await signingKey('ML-DSA-65'), MESSAGE()), MESSAGE()),
        package: async ({ ml_dsa65 }) =>
          crypto.subtle.verify('ML-DSA-65', await verifyingKey('ML-DSA-65'), ml_dsa65.sign(MESSAGE(), ml_dsa65.keygen(SEED()).secretKey), MESSAGE()),
      },
      'ml_dsa65: deterministic signature': {
        gap: 'ML-DSA in Web Crypto and crypto.sign is hedged (a fresh random value per signature); @noble/post-quantum signs deterministically with { extraEntropy: false }',
        native: async () => {
          const key = await signingKey('ML-DSA-65');
          return hex(await crypto.subtle.sign('ML-DSA-65', key, MESSAGE())) === hex(await crypto.subtle.sign('ML-DSA-65', key, MESSAGE()));
        },
        package: ({ ml_dsa65 }) => {
          const { secretKey } = ml_dsa65.keygen(SEED());
          const once = () => hex(ml_dsa65.sign(MESSAGE(), secretKey, { extraEntropy: false }));
          return once() === once();
        },
      },
    },
  },
};
