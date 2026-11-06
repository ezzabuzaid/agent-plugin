// Post-quantum key encapsulation with ML-KEM (FIPS 203): keys from a seed,
// encapsulate a shared secret, decapsulate it.
import { createPrivateKey, createPublicKey, decapsulate, encapsulate } from 'node:crypto';

const SEED = () => new Uint8Array(64).fill(9);
const hex = (bytes) => Buffer.from(bytes).toString('hex');
const VARIANTS = { ml_kem512: 'ML-KEM-512', ml_kem768: 'ML-KEM-768', ml_kem1024: 'ML-KEM-1024' };
const decapsulationKey = (name) => crypto.subtle.importKey('raw-seed', SEED(), name, true, ['decapsulateBits']);
const encapsulationKey = async (name) => crypto.subtle.getPublicKey(await decapsulationKey(name), ['encapsulateBits']);
const keyObject = () => createPrivateKey({ key: SEED(), format: 'raw-seed', asymmetricKeyType: 'ml-kem-768' });

export default {
  apis: [
    'webcrypto:subtle.encapsulateBits',
    'webcrypto:subtle.decapsulateBits',
    'webcrypto:subtle.importKey',
    'webcrypto:subtle.getPublicKey',
    'webcrypto:subtle.exportKey',
    'crypto:crypto.encapsulate',
    'crypto:crypto.decapsulate',
  ],
  reviewedAt: 'v26.13.0',
  replaces: {
    '@noble/post-quantum@0.7.1/ml-kem.js': {
      ...Object.fromEntries(
        Object.entries(VARIANTS).map(([member, name]) => [
          `${member}: keygen`,
          {
            native: async () => hex(await crypto.subtle.exportKey('raw-public', await encapsulationKey(name))),
            package: (module) => hex(module[member].keygen(SEED()).publicKey),
          },
        ]),
      ),
      'ml_kem768: decapsulate': {
        // The package encapsulates with fixed randomness; the native key from the same seed recovers its secret.
        native: async () => {
          const { ciphertext, sharedKey } = await crypto.subtle.encapsulateBits('ML-KEM-768', await encapsulationKey('ML-KEM-768'));
          return hex(await crypto.subtle.decapsulateBits('ML-KEM-768', await decapsulationKey('ML-KEM-768'), ciphertext)) === hex(sharedKey);
        },
        package: async ({ ml_kem768 }) => {
          const { cipherText, sharedSecret } = ml_kem768.encapsulate(ml_kem768.keygen(SEED()).publicKey, new Uint8Array(32).fill(1));
          return hex(await crypto.subtle.decapsulateBits('ML-KEM-768', await decapsulationKey('ML-KEM-768'), cipherText)) === hex(sharedSecret);
        },
      },
      'ml_kem768: encapsulate': {
        native: () => {
          const { sharedKey, ciphertext } = encapsulate(createPublicKey(keyObject()));
          return [hex(decapsulate(keyObject(), ciphertext)) === hex(sharedKey), ciphertext.length, sharedKey.length];
        },
        package: ({ ml_kem768 }) => {
          const { publicKey, secretKey } = ml_kem768.keygen(SEED());
          const { cipherText, sharedSecret } = ml_kem768.encapsulate(publicKey);
          return [hex(ml_kem768.decapsulate(cipherText, secretKey)) === hex(sharedSecret), cipherText.length, sharedSecret.length];
        },
      },
    },
  },
};
