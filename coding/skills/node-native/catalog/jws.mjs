// Sign and verify a compact JWS / JWT (HS256, RS256, EdDSA) with Web Crypto
// or node:crypto: the token is base64url(header).base64url(payload).base64url(signature).
import { createHmac, createPrivateKey, createPublicKey, sign, timingSafeEqual, verify } from 'node:crypto';
import { outcome } from './support/outcome.mjs';

const PAYLOAD = { sub: '42', name: 'Ada' };
const SECRET = () => new Uint8Array(32).fill(7);
const ED25519 = () => createPrivateKey({ key: new Uint8Array(32).fill(5), format: 'raw-private', asymmetricKeyType: 'ed25519' });
// A throwaway 2048-bit RSA key: RSASSA-PKCS1-v1_5 signatures are deterministic, so RS256 tokens compare byte for byte.
const RSA_PEM = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCzEXtogDsaeewJ
DHc+PXEnZR4ZrUECvSBIEPSjYBkwzrHQ+so0BcqYQrmibWwtCUQJEUUzhz9r4z5N
5j3Sm0WEjca6w9M4It+lQhVWV13NRuBviJXb0nfxh8Wn0t4cgLYZ5FhUAAm6P/dw
GlR8AHrxzIYYmTWUo/o2TLtMnwU4wroU13ra3ApBchgbi7cFvm0KYOy8dsXsXV82
GP0Z/tebAna90RbNbm0QmaEDzryI6CApNEebcFI5AiKHUVgGog9frqdAGBVzH3A9
sG2xKCOGZ8RcwzYoXak6eHTImHfCgM/ScXQrVcftuqqEMcYkIVvGFtU8IdfgaACA
HfKYzhbtAgMBAAECggEAAMfHHNlrjBNE8wMlZTkZb911j0oWSEbUK3bmHnsK5mUp
/DhVWyWvF4LkQ+GsFi7TUj8EaSIFtANGWUqsFNtitTqRKzRr055NguDOdcbQB1bT
WMrdiTdS3/AX0QlAnHBpKPnWgO3hHPkuDwufOBQ8rdEzFfZ4FEDrzUnHUaE4c3BB
uEmnjDJOjYixd73fUCubUv3f/nE7Sdmgc4zgu5gqiI+3/n53w5jURcyfzltAMLGN
hDOlt6IVWC4zfZZPr1BSmjwnQS5utf2X5HmwoTlFrhvoFE9WGyQMoiLbSE2jiLUt
/2ChSvixaAZMVzte9KtCG/05pdoZa+762UEfsBilYQKBgQDkTEvIfaHLsHoLsu4i
dUOVNkwCS1U1tFn2DRadddb85C4bA3XkCjKpWvSyq4qagJSc0fMXvvc3u6wWZi3W
xWCqAVlbd6T4Gq77oRzqiAcc+VaMNoyxTzNoKIRfJZ/TYT8RMkOpYflJ8klRseyA
T/MpTubPT5IMvVI+GrhCKYn0HQKBgQDIy/HgNdHynv1sxaDElDyNsaTJ487LjUoy
+RwDfoBG0OVJ9Zj2c6BFA3fFetLBh0lqXTuVMXQxm3iziIr8Vml1AKMi2YLll+e4
uHAQKPfIA7Ph9T1d1DITSnsN3+Rr5lGYSBNMKiCMRxkuBRJc2TebqVSzC2mnWrIQ
dwy0xNCVEQKBgGz09N41B3kdOsJGnVyYtq6KAXC+32YIMz85M+fmi7qadF60Ihm5
vEAThuGW+UmPwF2v3eMhYv+YdCMklRABl4bLqgf7bCJ1KboyRIiybyKm5WV5y1/8
Or6lR7fZTxQlP2JHqP84IS/nkJKK5iK/BYBbhdC/Wyb1XEEDo5kAFjUJAoGAWZpQ
tCmwJ2F1W12RUUeJAf3cuE7VEBZbnwV0z8Zafb9oIinbeVa9lS5n+xLFC6FQTIuQ
NBJedGiZYxwyUUpKQvDm231OoR+5Qr/jGgL+Fx433kQufzlaoysgYF+hsdiUXq0D
F4DRB2gOv2958z7nRqo4ZrFYE1swjJJjdCNDpNECgYEAwKTLaLl2ycZVxXTMx4Ml
DCcmAqe6NPbTnMpfd70KrYZHPRrznVQzkU/p9iZ2lsVIwoPo6oVTbDV/uL0aKNI6
TxSf/zZMIpoO9dPTJ2bg+rt82XomPaT33nCPjm7BDg8rIQ39plFv/7w5WwlSvjUk
DIEp8lAJKqfn/cFpYBtayaY=
-----END PRIVATE KEY-----
`;
const RSA = () => createPrivateKey(RSA_PEM);
const url = { alphabet: 'base64url', omitPadding: true };
const segment = (value) => new TextEncoder().encode(JSON.stringify(value)).toBase64(url);
const signingInput = (header, payload = PAYLOAD) => `${segment(header)}.${segment(payload)}`;
const hs256 = (header, payload) => {
  const input = signingInput(header, payload);
  return `${input}.${new Uint8Array(createHmac('sha256', SECRET()).update(input).digest()).toBase64(url)}`;
};
const asymmetric = (header, key) => {
  const input = signingInput(header);
  return `${input}.${new Uint8Array(sign(header.alg === 'RS256' ? 'sha256' : null, Buffer.from(input), key)).toBase64(url)}`;
};
const subtleHs256 = async (header) => {
  const key = await crypto.subtle.importKey('raw', SECRET(), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const input = signingInput(header);
  return `${input}.${new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(input))).toBase64(url)}`;
};
const decodePayload = (token) => JSON.parse(new TextDecoder().decode(Uint8Array.fromBase64(token.split('.')[1], { alphabet: 'base64url' })));
// Checks only the signature, then returns the payload: no claim (exp, nbf, aud) is checked.
const verifyHs256 = (token) => {
  const [header, payload, signature] = token.split('.');
  const expected = createHmac('sha256', SECRET()).update(`${header}.${payload}`).digest();
  const actual = Uint8Array.fromBase64(signature, { alphabet: 'base64url' });
  return actual.length === expected.length && timingSafeEqual(actual, expected) ? decodePayload(token) : 'invalid';
};
const verifyEdDSA = (token) => {
  const [header, payload, signature] = token.split('.');
  const signed = Buffer.from(`${header}.${payload}`);
  return verify(null, signed, createPublicKey(ED25519()), Uint8Array.fromBase64(signature, { alphabet: 'base64url' })) ? decodePayload(token) : 'invalid';
};
const EXPIRED = { ...PAYLOAD, exp: 1 };
const codeOrName = (error) => error.code ?? error.name;

export default {
  apis: ['webcrypto:subtle.sign', 'webcrypto:subtle.verify', 'crypto:crypto.createHmac', 'crypto:crypto.sign', 'crypto:crypto.verify', 'crypto:keyObject.toCryptoKey', 'js:Uint8Array.prototype.toBase64'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'jose@6.2.15': {
      'SignJWT: HS256': {
        native: () => subtleHs256({ alg: 'HS256' }),
        package: ({ SignJWT }) => new SignJWT(PAYLOAD).setProtectedHeader({ alg: 'HS256' }).sign(SECRET()),
      },
      'SignJWT: EdDSA': {
        native: () => asymmetric({ alg: 'EdDSA' }, ED25519()),
        package: ({ SignJWT }) => new SignJWT(PAYLOAD).setProtectedHeader({ alg: 'EdDSA' }).sign(ED25519().toCryptoKey('Ed25519', false, ['sign'])),
      },
      'SignJWT: RS256': {
        native: () => asymmetric({ alg: 'RS256' }, RSA()),
        package: ({ SignJWT }) =>
          new SignJWT(PAYLOAD).setProtectedHeader({ alg: 'RS256' }).sign(RSA().toCryptoKey({ name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign'])),
      },
      'jwtVerify: HS256': {
        native: () => verifyHs256(hs256({ alg: 'HS256' })),
        package: async ({ jwtVerify }) => (await jwtVerify(hs256({ alg: 'HS256' }), SECRET())).payload,
      },
      'jwtVerify: EdDSA': {
        native: () => verifyEdDSA(asymmetric({ alg: 'EdDSA' }, ED25519())),
        package: async ({ jwtVerify }) =>
          (await jwtVerify(asymmetric({ alg: 'EdDSA' }, ED25519()), createPublicKey(ED25519()).toCryptoKey('Ed25519', false, ['verify']))).payload,
      },
      'jwtVerify: expired': {
        gap: 'jwtVerify checks the exp, nbf, iat, iss and aud claims; a Web Crypto signature check accepts an expired token, so claim validation stays hand-written',
        native: () => verifyHs256(hs256({ alg: 'HS256' }, EXPIRED)),
        package: ({ jwtVerify }) => outcome(async () => (await jwtVerify(hs256({ alg: 'HS256' }, EXPIRED), SECRET())).payload, codeOrName),
      },
      decodeJwt: {
        native: () => decodePayload(hs256({ alg: 'HS256' })),
        package: ({ decodeJwt }) => decodeJwt(hs256({ alg: 'HS256' })),
      },
      exportJWK: {
        native: async () => {
          const { kty, crv, x } = await crypto.subtle.exportKey('jwk', createPublicKey(ED25519()).toCryptoKey('Ed25519', true, ['verify']));
          return { kty, crv, x };
        },
        package: ({ exportJWK }) => exportJWK(createPublicKey(ED25519()).toCryptoKey('Ed25519', true, ['verify'])),
      },
      'exportJWK: key_ops and ext': {
        gap: 'subtle.exportKey("jwk") also writes key_ops, ext and alg; jose.exportJWK leaves them out',
        native: () => crypto.subtle.exportKey('jwk', createPublicKey(ED25519()).toCryptoKey('Ed25519', true, ['verify'])),
        package: ({ exportJWK }) => exportJWK(createPublicKey(ED25519()).toCryptoKey('Ed25519', true, ['verify'])),
      },
    },
    'jsonwebtoken@9.0.3': {
      'sign: HS256': {
        native: () => hs256({ alg: 'HS256', typ: 'JWT' }),
        package: ({ default: jwt }) => jwt.sign(PAYLOAD, Buffer.from(SECRET()), { algorithm: 'HS256', noTimestamp: true }),
      },
      'sign: RS256': {
        native: () => asymmetric({ alg: 'RS256', typ: 'JWT' }, RSA()),
        package: ({ default: jwt }) => jwt.sign(PAYLOAD, RSA_PEM, { algorithm: 'RS256', noTimestamp: true }),
      },
      verify: {
        native: () => verifyHs256(hs256({ alg: 'HS256', typ: 'JWT' })),
        package: ({ default: jwt }) => jwt.verify(hs256({ alg: 'HS256', typ: 'JWT' }), Buffer.from(SECRET())),
      },
      'verify: expired': {
        gap: 'jwt.verify rejects a token whose exp has passed (TokenExpiredError); a signature check alone accepts it',
        native: () => verifyHs256(hs256({ alg: 'HS256', typ: 'JWT' }, EXPIRED)),
        package: ({ default: jwt }) => outcome(() => jwt.verify(hs256({ alg: 'HS256', typ: 'JWT' }, EXPIRED), Buffer.from(SECRET())), codeOrName),
      },
      decode: {
        native: () => decodePayload(hs256({ alg: 'HS256' })),
        package: ({ default: jwt }) => jwt.decode(hs256({ alg: 'HS256' })),
      },
    },
  },
};
