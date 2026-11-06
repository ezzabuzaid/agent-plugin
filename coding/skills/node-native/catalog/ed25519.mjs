// Sign and verify with Ed25519 and Ed448 (EdDSA, RFC 8032).
import { createPrivateKey, createPublicKey, sign, verify } from 'node:crypto';

const MESSAGE = () => new TextEncoder().encode('hello world');
const SEED = () => new Uint8Array(32).fill(5);
const SEED_448 = () => new Uint8Array(57).fill(5);
const hex = (bytes) => Buffer.from(bytes).toString('hex');
// EdDSA is deterministic: one seed and one message give one signature.
const SIGNATURE =
  '356ffc6914a0c13e3a17f37f56a687b66f6b2601e689f44ba11f8101a2b2d0a1ae820e1a6b1c3b06af16698a7dff656a30b011e60f8603498f970f6cb33f460a';
const signature = () => Uint8Array.fromHex(SIGNATURE);
const tampered = () => {
  const bytes = signature();
  bytes[0] ^= 1;
  return bytes;
};
const privateKey = (seed = SEED(), asymmetricKeyType = 'ed25519') => createPrivateKey({ key: seed, format: 'raw-private', asymmetricKeyType });
const publicBytes = (key) => new Uint8Array(createPublicKey(key).export({ format: 'raw-public' }));
const publicKey = () => createPublicKey(privateKey());
const nativeSign = (key = privateKey()) => hex(sign(null, MESSAGE(), key));
const nativeVerify = () => [verify(null, MESSAGE(), publicKey(), signature()), verify(null, MESSAGE(), publicKey(), tampered())];
const subtleSign = async () => {
  const key = privateKey().toCryptoKey('Ed25519', false, ['sign']);
  return hex(await crypto.subtle.sign('Ed25519', key, MESSAGE()));
};

export default {
  apis: ['crypto:crypto.sign', 'crypto:crypto.verify', 'crypto:crypto.createPrivateKey', 'crypto:crypto.createPublicKey', 'crypto:keyObject.toCryptoKey', 'webcrypto:subtle.sign', 'webcrypto:subtle.verify'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'tweetnacl@1.0.3': {
      'sign: keyPair.fromSeed': {
        native: () => hex(publicBytes(privateKey())),
        package: ({ default: nacl }) => hex(nacl.sign.keyPair.fromSeed(SEED()).publicKey),
      },
      'sign: detached': {
        native: () => nativeSign(),
        package: ({ default: nacl }) => hex(nacl.sign.detached(MESSAGE(), nacl.sign.keyPair.fromSeed(SEED()).secretKey)),
      },
      'sign: detached.verify': {
        native: nativeVerify,
        package: ({ default: nacl }) => {
          const { publicKey: key } = nacl.sign.keyPair.fromSeed(SEED());
          return [nacl.sign.detached.verify(MESSAGE(), signature(), key), nacl.sign.detached.verify(MESSAGE(), tampered(), key)];
        },
      },
      sign: {
        native: () => nativeSign() + hex(MESSAGE()),
        package: ({ default: nacl }) => hex(nacl.sign(MESSAGE(), nacl.sign.keyPair.fromSeed(SEED()).secretKey)),
      },
    },
    '@noble/ed25519@3.2.0': {
      getPublicKeyAsync: {
        native: () => hex(publicBytes(privateKey())),
        package: async ({ getPublicKeyAsync }) => hex(await getPublicKeyAsync(SEED())),
      },
      signAsync: {
        native: subtleSign,
        package: async ({ signAsync }) => hex(await signAsync(MESSAGE(), SEED())),
      },
      verifyAsync: {
        native: async () => {
          const key = publicKey().toCryptoKey('Ed25519', false, ['verify']);
          return [await crypto.subtle.verify('Ed25519', key, signature(), MESSAGE()), await crypto.subtle.verify('Ed25519', key, tampered(), MESSAGE())];
        },
        package: async ({ getPublicKeyAsync, verifyAsync }) => {
          const key = await getPublicKeyAsync(SEED());
          return [await verifyAsync(signature(), MESSAGE(), key), await verifyAsync(tampered(), MESSAGE(), key)];
        },
      },
    },
    '@noble/curves@2.4.0/ed25519.js': {
      'ed25519: getPublicKey': {
        native: () => hex(publicBytes(privateKey())),
        package: ({ ed25519 }) => hex(ed25519.getPublicKey(SEED())),
      },
      'ed25519: sign': {
        native: () => nativeSign(),
        package: ({ ed25519 }) => hex(ed25519.sign(MESSAGE(), SEED())),
      },
      'ed25519: verify': {
        native: nativeVerify,
        package: ({ ed25519 }) => {
          const key = ed25519.getPublicKey(SEED());
          return [ed25519.verify(signature(), MESSAGE(), key), ed25519.verify(tampered(), MESSAGE(), key)];
        },
      },
    },
    '@noble/curves@2.4.0/ed448.js': {
      'ed448: getPublicKey': {
        native: () => hex(publicBytes(privateKey(SEED_448(), 'ed448'))),
        package: ({ ed448 }) => hex(ed448.getPublicKey(SEED_448())),
      },
      'ed448: sign': {
        native: () => nativeSign(privateKey(SEED_448(), 'ed448')),
        package: ({ ed448 }) => hex(ed448.sign(MESSAGE(), SEED_448())),
      },
    },
  },
};
