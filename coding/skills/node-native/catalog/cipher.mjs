// Encrypt and decrypt with AES (CBC, CTR, GCM, GCM-SIV, SIV, OCB, key wrap)
// and ChaCha20(-Poly1305).
import { createCipheriv, createDecipheriv } from 'node:crypto';
import { outcome } from './support/outcome.mjs';

const TEXT = 'hello world';
const MESSAGE = () => new TextEncoder().encode(TEXT);
const KEY = () => new Uint8Array(32).fill(1);
const IV = () => new Uint8Array(16).fill(2);
const NONCE = () => new Uint8Array(12).fill(3);
const AAD = () => new TextEncoder().encode('header');
const hex = (bytes) => Buffer.from(bytes).toString('hex');
const AEAD = /gcm|poly1305|ocb|siv/;
// Ciphertext, then the tag for an AEAD mode: the layout most packages return.
const encrypt = (algorithm, { key = KEY(), iv = IV(), aad, options, data = MESSAGE() } = {}) => {
  const cipher = createCipheriv(algorithm, key, iv, options);
  if (aad) cipher.setAAD(aad);
  const body = hex(Buffer.concat([cipher.update(data), cipher.final()]));
  return AEAD.test(algorithm) ? { body, tag: hex(cipher.getAuthTag()) } : { body };
};
const sealed = (algorithm, settings) => {
  const { body, tag = '' } = encrypt(algorithm, settings);
  return body + tag;
};
const decrypt = (algorithm, ciphertext, { key = KEY(), iv = IV() } = {}) => {
  const decipher = createDecipheriv(algorithm, key, iv);
  return Buffer.concat([decipher.update(Buffer.from(ciphertext, 'hex')), decipher.final()]).toString();
};
const subtleEncrypt = async (name, params) => {
  const key = await crypto.subtle.importKey(name === 'AES-GCM' ? 'raw' : 'raw-secret', KEY(), name, false, ['encrypt']);
  return hex(await crypto.subtle.encrypt({ name, ...params }, key, MESSAGE()));
};
const unknownCipher = (algorithm, iv) => outcome(() => encrypt(algorithm, { iv, options: { authTagLength: 16 } }), (error) => error.code);
const CBC_HEX = 'f563737a376afbed282274255a7fcabd';

export default {
  apis: [
    'crypto:crypto.createCipheriv',
    'crypto:crypto.createDecipheriv',
    'crypto:cipher.update',
    'crypto:cipher.final',
    'crypto:cipher.setAAD',
    'crypto:cipher.getAuthTag',
    'crypto:decipher.update',
    'crypto:decipher.final',
    'webcrypto:subtle.encrypt',
    'webcrypto:subtle.decrypt',
  ],
  reviewedAt: 'v26.13.0',
  replaces: {
    'crypto-js@4.2.0': {
      'AES: encrypt': {
        native: () => Buffer.from(encrypt('aes-256-cbc').body, 'hex').toString('base64'),
        package: ({ default: CryptoJS }) =>
          CryptoJS.AES.encrypt(TEXT, CryptoJS.enc.Hex.parse(hex(KEY())), { iv: CryptoJS.enc.Hex.parse(hex(IV())) }).toString(),
      },
      'AES: decrypt': {
        native: () => decrypt('aes-256-cbc', CBC_HEX),
        package: ({ default: CryptoJS }) =>
          CryptoJS.AES.decrypt(CryptoJS.enc.Hex.parse(CBC_HEX).toString(CryptoJS.enc.Base64), CryptoJS.enc.Hex.parse(hex(KEY())), {
            iv: CryptoJS.enc.Hex.parse(hex(IV())),
          }).toString(CryptoJS.enc.Utf8),
      },
      'AES: CTR': {
        native: () => encrypt('aes-256-ctr').body,
        package: ({ default: CryptoJS }) =>
          CryptoJS.AES.encrypt(TEXT, CryptoJS.enc.Hex.parse(hex(KEY())), {
            iv: CryptoJS.enc.Hex.parse(hex(IV())),
            mode: CryptoJS.mode.CTR,
            padding: CryptoJS.pad.NoPadding,
          }).ciphertext.toString(),
      },
      'AES: passphrase': {
        gap: 'CryptoJS.AES with a string key derives key and IV from the passphrase with OpenSSL EVP_BytesToKey (MD5, "Salted__" header); createCipheriv takes only a raw key and IV, and Node has no EVP_BytesToKey',
        native: () => {
          try {
            return decrypt('aes-256-cbc', CBC_HEX, { key: 'passphrase', iv: null });
          } catch (error) {
            return `threw ${error.code}`;
          }
        },
        package: ({ default: CryptoJS }) => CryptoJS.AES.decrypt(CryptoJS.AES.encrypt(TEXT, 'passphrase').toString(), 'passphrase').toString(CryptoJS.enc.Utf8),
      },
    },
    'node-forge@1.4.3': {
      'cipher: AES-CBC': {
        native: () => encrypt('aes-256-cbc').body,
        package: ({ default: forge }) => {
          const cipher = forge.cipher.createCipher('AES-CBC', forge.util.hexToBytes(hex(KEY())));
          cipher.start({ iv: forge.util.hexToBytes(hex(IV())) });
          cipher.update(forge.util.createBuffer(TEXT));
          cipher.finish();
          return cipher.output.toHex();
        },
      },
      'cipher: AES-GCM': {
        native: () => encrypt('aes-256-gcm', { iv: NONCE(), aad: AAD() }),
        package: ({ default: forge }) => {
          const cipher = forge.cipher.createCipher('AES-GCM', forge.util.hexToBytes(hex(KEY())));
          cipher.start({ iv: forge.util.hexToBytes(hex(NONCE())), additionalData: 'header' });
          cipher.update(forge.util.createBuffer(TEXT));
          cipher.finish();
          return { body: cipher.output.toHex(), tag: cipher.mode.tag.toHex() };
        },
      },
    },
    'aes-js@3.1.2': {
      'ModeOfOperation: cbc': {
        native: () => encrypt('aes-256-cbc').body,
        package: ({ default: aesjs }) => hex(new aesjs.ModeOfOperation.cbc(KEY(), IV()).encrypt(aesjs.padding.pkcs7.pad(MESSAGE()))),
      },
      'ModeOfOperation: ctr': {
        native: () => encrypt('aes-256-ctr', { iv: Uint8Array.fromHex('00000000000000000000000000000005') }).body,
        package: ({ default: aesjs }) => hex(new aesjs.ModeOfOperation.ctr(KEY(), new aesjs.Counter(5)).encrypt(MESSAGE())),
      },
    },
    '@noble/ciphers@2.4.0/aes.js': {
      gcm: {
        native: () => sealed('aes-256-gcm', { iv: NONCE(), aad: AAD() }),
        package: ({ gcm }) => hex(gcm(KEY(), NONCE(), AAD()).encrypt(MESSAGE())),
      },
      'gcm: decrypt': {
        native: () => {
          const { body, tag } = encrypt('aes-256-gcm', { iv: NONCE() });
          const decipher = createDecipheriv('aes-256-gcm', KEY(), NONCE()).setAuthTag(Buffer.from(tag, 'hex'));
          return Buffer.concat([decipher.update(Buffer.from(body, 'hex')), decipher.final()]).toString();
        },
        package: ({ gcm }) => new TextDecoder().decode(gcm(KEY(), NONCE()).decrypt(gcm(KEY(), NONCE()).encrypt(MESSAGE()))),
      },
      'gcm: webcrypto': {
        native: () => subtleEncrypt('AES-GCM', { iv: NONCE(), additionalData: AAD() }),
        package: ({ gcm }) => hex(gcm(KEY(), NONCE(), AAD()).encrypt(MESSAGE())),
      },
      cbc: {
        native: () => encrypt('aes-256-cbc').body,
        package: ({ cbc }) => hex(cbc(KEY(), IV()).encrypt(MESSAGE())),
      },
      ctr: {
        native: () => encrypt('aes-256-ctr').body,
        package: ({ ctr }) => hex(ctr(KEY(), IV()).encrypt(MESSAGE())),
      },
      gcmsiv: {
        native: () => sealed('aes-256-gcm-siv', { iv: NONCE(), aad: AAD() }),
        package: ({ gcmsiv }) => hex(gcmsiv(KEY(), NONCE(), AAD()).encrypt(MESSAGE())),
      },
      aessiv: {
        native: () => {
          const { body, tag } = encrypt('aes-128-siv', { iv: null, aad: AAD() });
          return tag + body;
        },
        package: ({ aessiv }) => hex(aessiv(KEY(), AAD()).encrypt(MESSAGE())),
      },
      aeskw: {
        native: () => encrypt('id-aes256-wrap', { iv: Uint8Array.fromHex('a6a6a6a6a6a6a6a6'), data: new Uint8Array(16).fill(4) }).body,
        package: ({ aeskw }) => hex(aeskw(KEY()).encrypt(new Uint8Array(16).fill(4))),
      },
    },
    '@noble/ciphers@2.4.0/chacha.js': {
      chacha20poly1305: {
        native: () => sealed('chacha20-poly1305', { iv: NONCE(), aad: AAD(), options: { authTagLength: 16 } }),
        package: ({ chacha20poly1305 }) => hex(chacha20poly1305(KEY(), NONCE(), AAD()).encrypt(MESSAGE())),
      },
      'chacha20poly1305: webcrypto': {
        native: () => subtleEncrypt('ChaCha20-Poly1305', { iv: NONCE(), additionalData: AAD() }),
        package: ({ chacha20poly1305 }) => hex(chacha20poly1305(KEY(), NONCE(), AAD()).encrypt(MESSAGE())),
      },
      chacha20: {
        // OpenSSL's 16-byte chacha20 IV is the 32-bit little-endian block counter, then the 96-bit nonce.
        native: () => encrypt('chacha20', { iv: new Uint8Array([0, 0, 0, 0, ...NONCE()]) }).body,
        package: ({ chacha20 }) => hex(chacha20(KEY(), NONCE(), MESSAGE())),
      },
      xchacha20poly1305: {
        gap: 'no XChaCha20-Poly1305 (24-byte nonce) cipher in createCipheriv or Web Crypto; only the 12-byte-nonce ChaCha20-Poly1305',
        native: () => unknownCipher('xchacha20-poly1305', new Uint8Array(24)),
        package: ({ xchacha20poly1305 }) => hex(xchacha20poly1305(KEY(), new Uint8Array(24), AAD()).encrypt(MESSAGE())),
      },
    },
    'tweetnacl@1.0.3': {
      secretbox: {
        gap: 'no XSalsa20-Poly1305 (NaCl secretbox) cipher in createCipheriv or Web Crypto',
        native: () => unknownCipher('xsalsa20-poly1305', new Uint8Array(24)),
        package: ({ default: nacl }) => hex(nacl.secretbox(MESSAGE(), new Uint8Array(24), KEY())),
      },
    },
  },
  lint: {
    banCryptoJs: {
      eslint: '10.12.0',
      plugin: 'eslint-plugin-depend@1.5.0',
      rule: 'depend/ban-dependencies',
      failed: 'reads only the package name, and the code can need the package for what no native API does; e18e/ban-dependencies, which reports the same hits, had 4 of 12 hits on good code',
      code: "import CryptoJS from 'crypto-js';",
    },
  },
};
