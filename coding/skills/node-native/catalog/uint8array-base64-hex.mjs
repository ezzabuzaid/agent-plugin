// Convert bytes to and from base64, base64url and hex.
const bytes = () => new Uint8Array([0, 1, 2, 250, 251, 252, 253, 254, 255]);
const BASE64 = 'AAEC+vv8/f7/';
const BASE64URL = 'AAEC-vv8_f7_';
const HEX = '000102fafbfcfdfeff';
const url = { alphabet: 'base64url' };
// A decoder's result, or the fact that it refused the input.
const decoded = (decode) => {
  try {
    return decode();
  } catch {
    return 'refused';
  }
};

export default {
  apis: [
    'js:Uint8Array.fromBase64',
    'js:Uint8Array.prototype.toBase64',
    'js:Uint8Array.fromHex',
    'js:Uint8Array.prototype.toHex',
  ],
  reviewedAt: 'v26.13.0',
  replaces: {
    'base64-js@1.5.1': {
      fromByteArray: {
        native: () => bytes().toBase64(),
        package: ({ fromByteArray }) => fromByteArray(bytes()),
      },
      toByteArray: {
        native: () => Uint8Array.fromBase64(BASE64),
        package: ({ toByteArray }) => toByteArray(BASE64),
      },
      byteLength: {
        native: () => Uint8Array.fromBase64(BASE64).length,
        package: ({ byteLength }) => byteLength(BASE64),
      },
      'toByteArray: base64url input': {
        gap: 'base64-js decodes - and _ as well as + and /; Uint8Array.fromBase64 needs { alphabet: "base64url" } for them',
        native: () => decoded(() => Uint8Array.fromBase64(BASE64URL)),
        package: ({ toByteArray }) => toByteArray(BASE64URL),
      },
      'toByteArray: invalid character': {
        improves: 'Uint8Array.fromBase64 throws SyntaxError on a character outside the alphabet; base64-js decodes it into wrong bytes',
        native: () => decoded(() => Uint8Array.fromBase64('A$EC')),
        package: ({ toByteArray }) => toByteArray('A$EC'),
      },
      'toByteArray: missing padding': {
        gap: 'base64-js throws on input without = padding; Uint8Array.fromBase64 decodes it',
        native: () => decoded(() => Uint8Array.fromBase64('AAE')),
        package: ({ toByteArray }) => decoded(() => toByteArray('AAE')),
      },
    },
    'base64-arraybuffer@1.0.2': {
      encode: {
        native: () => new Uint8Array(bytes().buffer).toBase64(),
        package: ({ encode }) => encode(bytes().buffer),
      },
      decode: {
        native: () => Uint8Array.fromBase64(BASE64).buffer,
        package: ({ decode }) => decode(BASE64),
      },
      'decode: invalid character': {
        improves: 'Uint8Array.fromBase64 throws SyntaxError on a character outside the alphabet; base64-arraybuffer decodes it into wrong bytes',
        native: () => decoded(() => Uint8Array.fromBase64('A$EC').buffer),
        package: ({ decode }) => decode('A$EC'),
      },
    },
    '@stablelib/base64@2.0.1': {
      encode: {
        native: () => bytes().toBase64(),
        package: ({ encode }) => encode(bytes()),
      },
      decode: {
        native: () => Uint8Array.fromBase64(BASE64),
        package: ({ decode }) => decode(BASE64),
      },
      encodeURLSafe: {
        native: () => bytes().toBase64(url),
        package: ({ encodeURLSafe }) => encodeURLSafe(bytes()),
      },
      decodeURLSafe: {
        native: () => Uint8Array.fromBase64(BASE64URL, url),
        package: ({ decodeURLSafe }) => decodeURLSafe(BASE64URL),
      },
      'decode: missing padding': {
        gap: '@stablelib/base64 throws on input without = padding; Uint8Array.fromBase64 decodes it (lastChunkHandling: "strict" refuses it)',
        native: () => decoded(() => Uint8Array.fromBase64('AAE')),
        package: ({ decode }) => decoded(() => decode('AAE')),
      },
    },
    'uint8array-extras@1.6.0': {
      uint8ArrayToBase64: {
        native: () => [bytes().toBase64(), bytes().toBase64({ alphabet: 'base64url', omitPadding: true })],
        package: ({ uint8ArrayToBase64 }) => [uint8ArrayToBase64(bytes()), uint8ArrayToBase64(bytes(), { urlSafe: true })],
      },
      base64ToUint8Array: {
        native: () => Uint8Array.fromBase64(BASE64),
        package: ({ base64ToUint8Array }) => base64ToUint8Array(BASE64),
      },
      'base64ToUint8Array: base64url input': {
        gap: 'base64ToUint8Array decodes base64url as well as base64; Uint8Array.fromBase64 needs { alphabet: "base64url" } for it',
        native: () => decoded(() => Uint8Array.fromBase64(BASE64URL)),
        package: ({ base64ToUint8Array }) => base64ToUint8Array(BASE64URL),
      },
      uint8ArrayToHex: {
        native: () => bytes().toHex(),
        package: ({ uint8ArrayToHex }) => uint8ArrayToHex(bytes()),
      },
      hexToUint8Array: {
        native: () => Uint8Array.fromHex('0001fafF'),
        package: ({ hexToUint8Array }) => hexToUint8Array('0001fafF'),
      },
      stringToBase64: {
        native: () => new TextEncoder().encode('héllo wörld').toBase64(),
        package: ({ stringToBase64 }) => stringToBase64('héllo wörld'),
      },
      base64ToString: {
        native: () => new TextDecoder().decode(Uint8Array.fromBase64('aMOpbGxvIHfDtnJsZA==')),
        package: ({ base64ToString }) => base64ToString('aMOpbGxvIHfDtnJsZA=='),
      },
    },
  },
  idioms: {
    bufferBase64: {
      seed: "toString\\(['\"]base64(url)?['\"]\\)",
      native: () => [bytes().toBase64(), bytes().toBase64({ alphabet: 'base64url', omitPadding: true })],
      idiom: () => [Buffer.from(bytes()).toString('base64'), Buffer.from(bytes()).toString('base64url')],
    },
    bufferHex: {
      seed: "toString\\(['\"]hex['\"]\\)",
      native: () => bytes().toHex(),
      idiom: () => Buffer.from(bytes()).toString('hex'),
    },
    padStartHex: {
      seed: "toString\\(16\\)\\.padStart\\(2",
      native: () => bytes().toHex(),
      idiom: () => Array.from(bytes(), (byte) => byte.toString(16).padStart(2, '0')).join(''),
    },
    btoaCharCodes: {
      seed: 'btoa\\(String\\.fromCharCode\\(',
      native: () => bytes().toBase64(),
      idiom: () => btoa(String.fromCharCode(...bytes())),
    },
    atobCharCodes: {
      seed: 'atob\\(',
      native: () => Uint8Array.fromBase64(BASE64),
      idiom: () => Uint8Array.from(atob(BASE64), (character) => character.charCodeAt(0)),
    },
    bufferFromBase64: {
      seed: "Buffer\\.from\\([^)]*['\"]base64(url)?['\"]\\)",
      native: () => [Uint8Array.fromBase64(BASE64), Uint8Array.fromBase64(BASE64URL, url)],
      idiom: () => [new Uint8Array(Buffer.from(BASE64, 'base64')), new Uint8Array(Buffer.from(BASE64URL, 'base64url'))],
    },
    'bufferFromBase64: invalid character': {
      gap: "Buffer.from(text, 'base64') skips characters outside the alphabet; Uint8Array.fromBase64 throws SyntaxError",
      native: () => decoded(() => Uint8Array.fromBase64('A$EC')),
      idiom: () => new Uint8Array(Buffer.from('A$EC', 'base64')),
    },
  },
  lint: {
    bufferBase64: {
      eslint: '10.12.0',
      plugin: 'eslint-plugin-unicorn@79.0.0',
      rule: 'unicorn/prefer-uint8array-base64',
      idiom: 'bufferBase64',
      failed: '2 of 8 hits on good code: Uint8Array.fromBase64 throws on input that Buffer accepts',
      code: "const text = Buffer.from(bytes).toString('base64');",
    },
    bufferHex: {
      eslint: '10.12.0',
      plugin: 'eslint-plugin-unicorn@79.0.0',
      rule: 'unicorn/prefer-uint8array-hex',
      idiom: 'bufferHex',
      on: 'modern-node/recommended',
      code: "const hex = Buffer.from(bytes).toString('hex');",
    },
    padStartHex: {
      eslint: '10.12.0',
      plugin: 'eslint-plugin-unicorn@79.0.0',
      rule: 'unicorn/prefer-uint8array-hex',
      idiom: 'padStartHex',
      on: 'modern-node/recommended',
      code: "const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');",
    },
  },
};
