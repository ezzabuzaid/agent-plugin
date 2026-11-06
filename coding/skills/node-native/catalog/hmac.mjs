// Authenticate a message with a keyed MAC: HMAC, KMAC, keyed BLAKE2, CMAC and
// Poly1305.
import { createHmac, createMac } from 'node:crypto';

const TEXT = 'hello world';
const encode = (text) => new TextEncoder().encode(text);
const KEY = () => new Uint8Array(32).fill(7);
const hex = (digest) => Buffer.from(digest).toString('hex');
const hmacHex = (algorithm) => createHmac(algorithm, KEY()).update(TEXT).digest('hex');
const subtleHmac = async (hash) => {
  const key = await crypto.subtle.importKey('raw', KEY(), { name: 'HMAC', hash }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', key, encode(TEXT)));
};
const kmac = (algorithm) => createMac(algorithm, KEY(), { customization: encode('app'), outputLength: 32 }).update(TEXT).final('hex');

// crypto-js: Hmac<NAME>(message, key) -> WordArray; a Latin-1 key string keeps the bytes.
const CRYPTO_JS = { HmacMD5: 'md5', HmacSHA1: 'sha1', HmacSHA256: 'sha256', HmacSHA512: 'sha512', HmacRIPEMD160: 'ripemd160' };
const latin1Key = () => String.fromCharCode(...KEY());

export default {
  apis: [
    'crypto:crypto.createHmac',
    'crypto:hmac.update',
    'crypto:hmac.digest',
    'crypto:crypto.createMac',
    'crypto:mac.update',
    'crypto:mac.final',
    'webcrypto:subtle.sign',
  ],
  reviewedAt: 'v26.13.0',
  replaces: {
    'create-hmac@1.1.7': {
      default: {
        native: () => hmacHex('sha256'),
        package: ({ default: createHmacPackage }) => createHmacPackage('sha256', Buffer.from(KEY())).update(TEXT).digest('hex'),
      },
    },
    'crypto-js@4.2.0': Object.fromEntries(
      Object.entries(CRYPTO_JS).map(([member, algorithm]) => [
        member,
        {
          native: () => hmacHex(algorithm),
          package: ({ default: CryptoJS }) => CryptoJS[member](TEXT, CryptoJS.enc.Latin1.parse(latin1Key())).toString(),
        },
      ]),
    ),
    'hash-wasm@4.12.0': {
      createHMAC: {
        native: () => hmacHex('sha256'),
        package: async ({ createHMAC, createSHA256 }) => (await createHMAC(createSHA256(), KEY())).init().update(TEXT).digest(),
      },
    },
    'node-forge@1.4.3': {
      'hmac: create': {
        native: () => hmacHex('sha512'),
        package: ({ default: forge }) => {
          const hmac = forge.hmac.create();
          hmac.start('sha512', latin1Key());
          hmac.update(TEXT);
          return hmac.digest().toHex();
        },
      },
    },
    '@noble/hashes@2.4.0/hmac.js': {
      hmac: {
        native: () => hmacHex('sha256'),
        package: async ({ hmac }, { load }) => hex(hmac((await load('@noble/hashes/sha2.js')).sha256, KEY(), encode(TEXT))),
      },
      'hmac: create': {
        native: () => hmacHex('sha512'),
        package: async ({ hmac }, { load }) => hex(hmac.create((await load('@noble/hashes/sha2.js')).sha512, KEY()).update(encode('hello ')).update(encode('world')).digest()),
      },
    },
    'hash.js@1.1.7': {
      hmac: {
        native: () => hmacHex('sha256'),
        package: ({ default: hashJs }) => hashJs.hmac(hashJs.sha256, [...KEY()]).update(TEXT).digest('hex'),
      },
    },
    'js-sha256@1.0.0': {
      'sha256: hmac': {
        native: () => subtleHmac('SHA-256'),
        package: ({ sha256 }) => sha256.hmac(KEY(), TEXT),
      },
    },
    'js-sha3@0.13.0': {
      kmac128: {
        native: () => kmac('kmac128'),
        package: ({ default: jsSha3 }) => jsSha3.kmac128(KEY(), TEXT, 256, 'app'),
      },
      kmac256: {
        native: () => kmac('kmac256'),
        package: ({ default: jsSha3 }) => jsSha3.kmac256(KEY(), TEXT, 256, 'app'),
      },
    },
    '@noble/hashes@2.4.0/sha3-addons.js': {
      kmac128: {
        native: () => kmac('kmac128'),
        package: ({ kmac128 }) => hex(kmac128(KEY(), encode(TEXT), { personalization: encode('app'), dkLen: 32 })),
      },
      kmac256: {
        native: async () => {
          const key = await crypto.subtle.importKey('raw-secret', KEY(), 'KMAC256', false, ['sign']);
          return hex(await crypto.subtle.sign({ name: 'KMAC256', outputLength: 256, customization: encode('app') }, key, encode(TEXT)));
        },
        package: ({ kmac256 }) => hex(kmac256(KEY(), encode(TEXT), { personalization: encode('app'), dkLen: 32 })),
      },
    },
    '@noble/hashes@2.4.0/blake2.js': {
      'blake2b: key': {
        native: () => createMac('blake2bmac', KEY(), { outputLength: 32 }).update(TEXT).final('hex'),
        package: ({ blake2b }) => hex(blake2b(encode(TEXT), { key: KEY(), dkLen: 32 })),
      },
      'blake2s: key': {
        native: () => createMac('blake2smac', KEY()).update(TEXT).final('hex'),
        package: ({ blake2s }) => hex(blake2s(encode(TEXT), { key: KEY() })),
      },
    },
    '@noble/ciphers@2.4.0/_poly1305.js': {
      poly1305: {
        native: () => createMac('poly1305', KEY()).update(TEXT).final('hex'),
        package: ({ poly1305 }) => hex(poly1305(encode(TEXT), KEY())),
      },
    },
    '@noble/ciphers@2.4.0/aes.js': {
      cmac: {
        native: () => createMac('cmac', KEY().subarray(0, 16), { cipher: 'aes-128-cbc' }).update(TEXT).final('hex'),
        package: ({ cmac }) => hex(cmac(encode(TEXT), KEY().subarray(0, 16))),
      },
    },
  },
};
