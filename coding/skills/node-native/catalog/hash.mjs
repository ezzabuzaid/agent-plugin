// Hash bytes or text with MD5, SHA-1, SHA-2, SHA-3, Keccak, SHAKE, cSHAKE,
// BLAKE2, RIPEMD-160, TurboSHAKE and KangarooTwelve.
import { createHash, hash } from 'node:crypto';

const TEXT = 'hello world';
const bytes = () => new TextEncoder().encode(TEXT);
const hex = (digest) => Buffer.from(digest).toString('hex');
const subtleHex = async (algorithm) => hex(await crypto.subtle.digest(algorithm, bytes()));

// crypto-js returns a WordArray; its toString() is hex.
const CRYPTO_JS = { MD5: 'md5', SHA1: 'sha1', SHA224: 'sha224', SHA256: 'sha256', SHA384: 'sha384', SHA512: 'sha512', RIPEMD160: 'ripemd160' };
// hash.js exposes one constructor per algorithm.
const HASH_JS = { sha1: 'sha1', sha224: 'sha224', sha256: 'sha256', sha384: 'sha384', sha512: 'sha512', ripemd160: 'ripemd160' };
// @noble/hashes: subpath -> { export: Node algorithm }.
const NOBLE = {
  'sha2.js': { sha224: 'sha224', sha256: 'sha256', sha384: 'sha384', sha512: 'sha512', sha512_224: 'sha512-224', sha512_256: 'sha512-256' },
  'legacy.js': { md5: 'md5', sha1: 'sha1', ripemd160: 'ripemd160' },
};
const NOBLE_SHA3 = {
    sha3_224: 'sha3-224',
    sha3_256: 'sha3-256',
    sha3_384: 'sha3-384',
    sha3_512: 'sha3-512',
    keccak_224: 'keccak-224',
    keccak_256: 'keccak-256',
    keccak_384: 'keccak-384',
    keccak_512: 'keccak-512',
};
const NOBLE_BLAKE2 = { blake2b: 'blake2b512', blake2s: 'blake2s256' };
// js-sha3 exports one function per algorithm, returning hex.
const JS_SHA3 = {
  sha3_224: 'sha3-224',
  sha3_256: 'sha3-256',
  sha3_384: 'sha3-384',
  sha3_512: 'sha3-512',
  keccak224: 'keccak-224',
  keccak256: 'keccak-256',
  keccak384: 'keccak-384',
  keccak512: 'keccak-512',
};
// hash-wasm: async functions that return hex; sha3 and keccak take the bit length.
const HASH_WASM = { md5: 'md5', sha1: 'sha1', sha224: 'sha224', sha256: 'sha256', sha384: 'sha384', sha512: 'sha512', ripemd160: 'ripemd160', sm3: 'sm3', blake2b: 'blake2b512', blake2s: 'blake2s256' };
// node-forge: forge.md.<name>.create().update(text).digest().toHex().
const FORGE_MD = { md5: 'md5', sha1: 'sha1', sha256: 'sha256', sha384: 'sha384', sha512: 'sha512' };
const oneShot = (table, digest) =>
  Object.fromEntries(
    Object.entries(table).map(([member, algorithm]) => [
      member,
      { native: () => hash(algorithm, TEXT), package: (module) => digest(module, member) },
    ]),
  );

export default {
  apis: ['crypto:crypto.hash', 'crypto:crypto.createHash', 'crypto:hash.update', 'crypto:hash.digest', 'webcrypto:subtle.digest'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'md5@2.3.0': {
      default: {
        native: () => hash('md5', TEXT),
        package: ({ default: md5 }) => md5(TEXT),
      },
    },
    'sha1@1.1.1': {
      default: {
        native: () => hash('sha1', TEXT),
        package: ({ default: sha1 }) => sha1(TEXT),
      },
    },
    'sha.js@2.4.12': {
      default: {
        native: () => createHash('sha256').update(TEXT).digest('hex'),
        package: ({ default: shajs }) => shajs('sha256').update(TEXT).digest('hex'),
      },
    },
    'create-hash@1.2.0': {
      default: {
        native: () => createHash('sha512').update(TEXT).digest('hex'),
        package: ({ default: createHashPackage }) => createHashPackage('sha512').update(TEXT).digest('hex'),
      },
    },
    'hash.js@1.1.7': oneShot(HASH_JS, ({ default: hashJs }, member) => hashJs[member]().update(TEXT).digest('hex')),
    'crypto-js@4.2.0': {
      ...oneShot(CRYPTO_JS, ({ default: CryptoJS }, member) => CryptoJS[member](TEXT).toString()),
      SHA3: {
        native: () => [hash('keccak-512', TEXT), hash('keccak-256', TEXT)],
        package: ({ default: CryptoJS }) => [CryptoJS.SHA3(TEXT).toString(), CryptoJS.SHA3(TEXT, { outputLength: 256 }).toString()],
      },
      'SHA3: FIPS 202 SHA-3': {
        gap: "CryptoJS.SHA3 is the original Keccak, not FIPS 202 SHA-3: crypto.hash('sha3-512') gives another digest; its native twin is 'keccak-512'",
        native: () => hash('sha3-512', TEXT),
        package: ({ default: CryptoJS }) => CryptoJS.SHA3(TEXT).toString(),
      },
    },
    'hash-wasm@4.12.0': {
      ...oneShot(HASH_WASM, (module, member) => module[member](TEXT)),
      sha3: {
        native: () => [hash('sha3-256', TEXT), hash('sha3-512', TEXT)],
        package: async ({ sha3 }) => [await sha3(TEXT, 256), await sha3(TEXT)],
      },
      keccak: {
        native: () => [hash('keccak-256', TEXT), hash('keccak-512', TEXT)],
        package: async ({ keccak }) => [await keccak(TEXT, 256), await keccak(TEXT)],
      },
      createSHA256: {
        native: () => createHash('sha256').update('hello ').update('world').digest('hex'),
        package: async ({ createSHA256 }) => (await createSHA256()).init().update('hello ').update('world').digest(),
      },
    },
    'node-forge@1.4.3': Object.fromEntries(
      Object.entries(FORGE_MD).map(([name, algorithm]) => [
        `md: ${name}`,
        { native: () => hash(algorithm, TEXT), package: ({ default: forge }) => forge.md[name].create().update(TEXT).digest().toHex() },
      ]),
    ),
    'js-sha256@1.0.0': {
      sha256: {
        native: () => hash('sha256', TEXT),
        package: ({ sha256 }) => sha256(TEXT),
      },
      sha224: {
        native: () => hash('sha224', TEXT),
        package: ({ sha224 }) => sha224(TEXT),
      },
    },
    'js-sha3@0.13.0': {
      ...oneShot(JS_SHA3, ({ default: jsSha3 }, member) => jsSha3[member](TEXT)),
      shake128: {
        native: () => hash('shake128', TEXT, { outputLength: 32 }),
        package: ({ default: jsSha3 }) => jsSha3.shake128(TEXT, 256),
      },
      shake256: {
        native: () => hash('shake256', TEXT, { outputLength: 64 }),
        package: ({ default: jsSha3 }) => jsSha3.shake256(TEXT, 512),
      },
      cshake128: {
        native: () => hash('cshake128', TEXT, { outputLength: 32, customization: 'app' }),
        package: ({ default: jsSha3 }) => jsSha3.cshake128(TEXT, 256, '', 'app'),
      },
      cshake256: {
        native: () => hash('cshake256', TEXT, { outputLength: 64, functionName: 'KMAC', customization: 'app' }),
        package: ({ default: jsSha3 }) => jsSha3.cshake256(TEXT, 512, 'KMAC', 'app'),
      },
    },
    ...Object.fromEntries(
      Object.entries(NOBLE).map(([subpath, table]) => [
        `@noble/hashes@2.4.0/${subpath}`,
        oneShot(table, (module, member) => hex(module[member](bytes()))),
      ]),
    ),
    '@noble/hashes@2.4.0/sha3.js': {
      ...oneShot(NOBLE_SHA3, (module, member) => hex(module[member](bytes()))),
      shake128: {
        native: () => hash('shake128', TEXT, { outputLength: 16 }),
        package: ({ shake128 }) => hex(shake128(bytes(), { dkLen: 16 })),
      },
      shake256: {
        native: () => hash('shake256', TEXT, { outputLength: 16 }),
        package: ({ shake256 }) => hex(shake256(bytes(), { dkLen: 16 })),
      },
    },
    '@noble/hashes@2.4.0/blake2.js': {
      ...oneShot(NOBLE_BLAKE2, (module, member) => hex(module[member](bytes()))),
      'blake2b: dkLen': {
        gap: "crypto.hash('blake2b512') has one output length; BLAKE2b with dkLen 32 needs crypto.createMac('blake2bmac', key, { outputLength }), which takes a key",
        native: () => {
          try {
            return hash('blake2b512', TEXT, { outputLength: 32 });
          } catch (error) {
            return `threw ${error.code ?? error.name}`;
          }
        },
        package: ({ blake2b }) => hex(blake2b(bytes(), { dkLen: 32 })),
      },
    },
    '@noble/hashes@2.4.0/sha3-addons.js': {
      cshake128: {
        native: () => hash('cshake128', TEXT, { outputLength: 32, customization: 'app' }),
        package: ({ cshake128 }) => hex(cshake128(bytes(), { personalization: new TextEncoder().encode('app'), dkLen: 32 })),
      },
      cshake256: {
        native: () => hash('cshake256', TEXT, { outputLength: 32, functionName: 'KMAC', customization: 'app' }),
        package: ({ cshake256 }) =>
          hex(cshake256(bytes(), { personalization: new TextEncoder().encode('app'), NISTfn: 'KMAC', dkLen: 32 })),
      },
      turboshake128: {
        native: () => subtleHex({ name: 'TurboSHAKE128', outputLength: 256 }),
        package: ({ turboshake128 }) => hex(turboshake128(bytes(), { dkLen: 32 })),
      },
      turboshake256: {
        native: () => subtleHex({ name: 'TurboSHAKE256', outputLength: 512 }),
        package: ({ turboshake256 }) => hex(turboshake256(bytes(), { dkLen: 64 })),
      },
      kt128: {
        native: () => subtleHex({ name: 'KT128', outputLength: 256 }),
        package: ({ kt128 }) => hex(kt128(bytes(), { dkLen: 32 })),
      },
      kt256: {
        native: () => subtleHex({ name: 'KT256', outputLength: 512 }),
        package: ({ kt256 }) => hex(kt256(bytes(), { dkLen: 64 })),
      },
    },
  },
  idioms: {
    createHashOneLiner: {
      seed: 'createHash\\([^)]*\\)\\s*\\.update\\((?:(?!\\.update\\(|;)[\\s\\S]){0,400}?\\)\\s*\\.digest\\(',
      native: () => [hash('sha256', TEXT), hash('sha256', TEXT, 'base64'), hash('sha256', TEXT, 'buffer')],
      idiom: () => [
        createHash('sha256').update(TEXT).digest('hex'),
        createHash('sha256').update(TEXT).digest('base64'),
        createHash('sha256').update(TEXT).digest(),
      ],
    },
    subtleDigestHex: {
      seed: "subtle\\.digest\\(['\"]SHA-",
      native: () => hash('sha256', TEXT),
      idiom: async () => hex(await crypto.subtle.digest('SHA-256', bytes())),
    },
  },
  lint: {
    banMd5: {
      eslint: '10.12.0',
      plugin: 'eslint-plugin-depend@1.5.0',
      rule: 'depend/ban-dependencies',
      code: "import md5 from 'md5';",
    },
  },
};
