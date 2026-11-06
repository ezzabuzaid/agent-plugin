// Agree on a shared secret with X25519 and X448 (RFC 7748).
import { createPrivateKey, createPublicKey, diffieHellman } from 'node:crypto';

const OURS = () => new Uint8Array(32).fill(5);
const THEIRS = () => new Uint8Array(32).fill(6);
const OURS_448 = () => new Uint8Array(56).fill(5);
const THEIRS_448 = () => new Uint8Array(56).fill(6);
const hex = (bytes) => Buffer.from(bytes).toString('hex');
const privateKey = (secret, asymmetricKeyType = 'x25519') => createPrivateKey({ key: secret, format: 'raw-private', asymmetricKeyType });
const publicHex = (secret, type) => hex(createPublicKey(privateKey(secret, type)).export({ format: 'raw-public' }));
const shared = (ours = OURS(), theirs = THEIRS(), type = 'x25519') =>
  hex(diffieHellman({ privateKey: privateKey(ours, type), publicKey: createPublicKey(privateKey(theirs, type)) }));

export default {
  apis: ['crypto:crypto.diffieHellman', 'crypto:crypto.createPrivateKey', 'crypto:crypto.createPublicKey', 'crypto:keyObject.export', 'webcrypto:subtle.deriveBits'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'tweetnacl@1.0.3': {
      scalarMult: {
        native: () => shared(),
        package: ({ default: nacl }) => hex(nacl.scalarMult(OURS(), nacl.scalarMult.base(THEIRS()))),
      },
      'scalarMult: base': {
        native: () => publicHex(OURS()),
        package: ({ default: nacl }) => hex(nacl.scalarMult.base(OURS())),
      },
      'box: keyPair.fromSecretKey': {
        native: () => publicHex(OURS()),
        package: ({ default: nacl }) => hex(nacl.box.keyPair.fromSecretKey(OURS()).publicKey),
      },
      'box: before': {
        gap: 'nacl.box.before hashes the X25519 secret with HSalsa20 into an XSalsa20-Poly1305 key; Node has no HSalsa20 or XSalsa20, and crypto.diffieHellman returns the raw secret',
        native: () => shared(),
        package: ({ default: nacl }) => hex(nacl.box.before(nacl.scalarMult.base(THEIRS()), OURS())),
      },
    },
    '@noble/curves@2.4.0/ed25519.js': {
      'x25519: getSharedSecret': {
        native: async () => {
          const ours = privateKey(OURS()).toCryptoKey('X25519', false, ['deriveBits']);
          const theirs = createPublicKey(privateKey(THEIRS())).toCryptoKey('X25519', true, []);
          return hex(await crypto.subtle.deriveBits({ name: 'X25519', public: theirs }, ours, 256));
        },
        package: ({ x25519 }) => hex(x25519.getSharedSecret(OURS(), x25519.getPublicKey(THEIRS()))),
      },
      'x25519: getPublicKey': {
        native: () => publicHex(OURS()),
        package: ({ x25519 }) => hex(x25519.getPublicKey(OURS())),
      },
    },
    '@noble/curves@2.4.0/ed448.js': {
      'x448: getSharedSecret': {
        native: () => shared(OURS_448(), THEIRS_448(), 'x448'),
        package: ({ x448 }) => hex(x448.getSharedSecret(OURS_448(), x448.getPublicKey(THEIRS_448()))),
      },
      'x448: getPublicKey': {
        native: () => publicHex(OURS_448(), 'x448'),
        package: ({ x448 }) => hex(x448.getPublicKey(OURS_448())),
      },
    },
  },
};
