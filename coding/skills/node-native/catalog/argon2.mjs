// Hash a password with Argon2 (argon2d, argon2i, argon2id).
import { argon2, argon2Sync } from 'node:crypto';

const PASSWORD = 'correct horse';
const SALT = () => new Uint8Array(16).fill(3);
const COST = { parallelism: 1, memory: 64, passes: 3, tagLength: 32 };
const hex = (bytes) => Buffer.from(bytes).toString('hex');
const nativeTag = (algorithm) => argon2Sync(algorithm, { message: PASSWORD, nonce: SALT(), ...COST });
const ENCODED = (algorithm) => {
  const unpadded = { omitPadding: true };
  return `$${algorithm}$v=19$m=${COST.memory},t=${COST.passes},p=${COST.parallelism}$${SALT().toBase64(unpadded)}$${new Uint8Array(nativeTag(algorithm)).toBase64(unpadded)}`;
};
// argon2 and @node-rs/argon2 both number the variants this way.
const ARGON2_TYPE = { argon2d: 0, argon2i: 1, argon2id: 2 };
const nodeArgon2 = (algorithm, extra = {}) => ({
  salt: Buffer.from(SALT()),
  type: ARGON2_TYPE[algorithm],
  memoryCost: COST.memory,
  timeCost: COST.passes,
  parallelism: COST.parallelism,
  hashLength: COST.tagLength,
  ...extra,
});
const VARIANTS = Object.keys(ARGON2_TYPE);
const perVariant = (row) => Object.fromEntries(VARIANTS.map((algorithm) => [algorithm, row(algorithm)]));

export default {
  apis: ['crypto:crypto.argon2', 'crypto:crypto.argon2Sync', 'webcrypto:subtle.deriveBits'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'argon2@0.45.2': {
      hash: {
        native: () => hex(nativeTag('argon2id')),
        package: async ({ default: { hash } }) => hex(await hash(PASSWORD, nodeArgon2('argon2id', { raw: true }))),
      },
      'hash: argon2d': {
        native: () => hex(nativeTag('argon2d')),
        package: async ({ default: { hash } }) => hex(await hash(PASSWORD, nodeArgon2('argon2d', { raw: true }))),
      },
      'hash: encoded': {
        native: () => ENCODED('argon2id'),
        package: ({ default: { hash } }) => hash(PASSWORD, nodeArgon2('argon2id')),
      },
      'hash: encoded string': {
        gap: 'crypto.argon2 returns the raw tag; it neither writes nor reads the $argon2id$v=19$m=…$salt$tag PHC string, so verify() and needsRehash() have no native counterpart',
        native: () => nativeTag('argon2id'),
        package: ({ default: { hash } }) => hash(PASSWORD, nodeArgon2('argon2id')),
      },
    },
    '@node-rs/argon2@2.2.2': {
      hashRaw: {
        native: () =>
          new Promise((resolve, reject) =>
            argon2('argon2id', { message: PASSWORD, nonce: SALT(), ...COST }, (error, tag) => (error ? reject(error) : resolve(hex(tag)))),
          ),
        package: async ({ hashRaw }) =>
          hex(await hashRaw(PASSWORD, { salt: Buffer.from(SALT()), algorithm: ARGON2_TYPE.argon2id, memoryCost: COST.memory, timeCost: COST.passes, parallelism: COST.parallelism, outputLen: COST.tagLength })),
      },
      hashRawSync: {
        native: () => hex(nativeTag('argon2i')),
        package: ({ hashRawSync }) =>
          hex(hashRawSync(PASSWORD, { salt: Buffer.from(SALT()), algorithm: ARGON2_TYPE.argon2i, memoryCost: COST.memory, timeCost: COST.passes, parallelism: COST.parallelism, outputLen: COST.tagLength })),
      },
    },
    'hash-wasm@4.12.0': perVariant((algorithm) => ({
      native: () => hex(nativeTag(algorithm)),
      package: (module) =>
        module[algorithm]({
          password: PASSWORD,
          salt: SALT(),
          parallelism: COST.parallelism,
          iterations: COST.passes,
          memorySize: COST.memory,
          hashLength: COST.tagLength,
          outputType: 'hex',
        }),
    })),
    '@noble/hashes@2.4.0/argon2.js': {
      ...perVariant((algorithm) => ({
        native: () => hex(nativeTag(algorithm)),
        package: (module) => hex(module[algorithm](PASSWORD, SALT(), { t: COST.passes, m: COST.memory, p: COST.parallelism, dkLen: COST.tagLength })),
      })),
      argon2idAsync: {
        native: async () => {
          const key = await crypto.subtle.importKey('raw-secret', new TextEncoder().encode(PASSWORD), 'Argon2id', false, ['deriveBits']);
          const { parallelism, memory, passes, tagLength } = COST;
          return hex(await crypto.subtle.deriveBits({ name: 'Argon2id', nonce: SALT(), parallelism, memory, passes }, key, tagLength * 8));
        },
        package: async ({ argon2idAsync }) =>
          hex(await argon2idAsync(PASSWORD, SALT(), { t: COST.passes, m: COST.memory, p: COST.parallelism, dkLen: COST.tagLength })),
      },
    },
  },
};
