// HTTP/2 clients: http2.connect() opens a session and session.request()
// sends a request on it; http2.createSecureServer() serves both HTTP/2 and,
// with allowHTTP1, HTTP/1.1.
import { once } from 'node:events';
import http2 from 'node:http2';
import https from 'node:https';
import { text } from 'node:stream/consumers';

// A self-signed test certificate for 127.0.0.1 and localhost (P-256), valid
// 2026-11-06 to 2036-11-03, and its key.
const KEY = `-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgTs7DZ9II/EIE3JVq
Gtd7O2nViv6s+oQQxOGuWHakUg+hRANCAAR9+hou2qutjDGSy38jkX5ei/bBuHvB
WBBoVxvEonKA4l4+ZsliHC9UMLbPpA6Bql/2miCmbzM8jgRP8KOLaNmw
-----END PRIVATE KEY-----
`;
const CERT = `-----BEGIN CERTIFICATE-----
MIIBeDCCAR6gAwIBAgIUGpR01mekjQ3KwJVphc9AYHZf4H8wCgYIKoZIzj0EAwIw
FDESMBAGA1UEAwwJMTI3LjAuMC4xMB4XDTI2MTEwNjEwNTE1N1oXDTM2MTEwMzEw
NTE1N1owFDESMBAGA1UEAwwJMTI3LjAuMC4xMFkwEwYHKoZIzj0CAQYIKoZIzj0D
AQcDQgAEffoaLtqrrYwxkst/I5F+Xov2wbh7wVgQaFcbxKJygOJePmbJYhwvVDC2
z6QOgapf9pogpm8zPI4ET/Cji2jZsKNOMEwwHQYDVR0OBBYEFP1BMpVRxKc2ZI/q
CvysMIu7rEnkMA8GA1UdEwEB/wQFMAMBAf8wGgYDVR0RBBMwEYcEfwAAAYIJbG9j
YWxob3N0MAoGCCqGSM49BAMCA0gAMEUCIQCRt11DbNbYJqvJHfUHzYugIefpyMNJ
5eY7RcWStu6vywIgbfZFXAyJ4xWQnddiZHwNVEOwvAh4EgNlKVwvWKzhYgs=
-----END CERTIFICATE-----
`;
const handler = (request, response) => response.end(`${request.httpVersion} ${request.method} ${request.url}`);

// Runs `call(base)` against a local TLS server: `secure` builds it.
async function overTLS(secure, call) {
  const server = secure({ key: KEY, cert: CERT, allowHTTP1: true }, handler);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    return await call(`https://127.0.0.1:${server.address().port}`);
  } finally {
    server.closeAllConnections?.();
    server.close();
  }
}
const h2 = (call) => overTLS(http2.createSecureServer, call);
const h1Only = (call) => overTLS(https.createServer, call);

// The native request: one session, one stream, then the session closes.
async function nativeGet(base, path) {
  const session = http2.connect(base, { ca: CERT });
  try {
    await once(session, 'connect');
    const stream = session.request({ ':path': path });
    const [headers] = await once(stream, 'response');
    return `${headers[':status']} ${await text(stream)}`;
  } finally {
    session.close();
  }
}
// What a node:http-style request answered.
const answered = async (request) => {
  request.end();
  const [response] = await once(request, 'response');
  return `${response.statusCode} ${await text(response)}`;
};
// http2-wrapper derives the TLS server name from the host and Node 26
// refuses an IP there, so the wrapper side names the certificate's host.
const tls = { ca: CERT, servername: 'localhost' };
// One http2-wrapper request; its global agent's sessions close afterwards.
const viaWrapper = async (http2Wrapper, request) => {
  try {
    return await answered(await request());
  } finally {
    http2Wrapper.globalAgent.destroy();
  }
};

export default {
  apis: ['http2:http2.connect', 'http2:clienthttp2session.request', 'http2:http2.createSecureServer'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'http2-wrapper@2.2.4': {
      request: {
        native: () => h2((base) => nativeGet(base, '/x')),
        package: ({ default: http2Wrapper }) => h2((base) => viaWrapper(http2Wrapper, () => http2Wrapper.request(`${base}/x`, tls))),
      },
      auto: {
        native: () => h2((base) => nativeGet(base, '/x')),
        package: ({ default: http2Wrapper }) => h2((base) => viaWrapper(http2Wrapper, () => http2Wrapper.auto(`${base}/x`, tls))),
      },
      'auto: HTTP/1.1 fallback': {
        gap: 'http2-wrapper.auto negotiates ALPN and falls back to HTTP/1.1 for a server without h2; http2.connect fails the session (ERR_SSL_TLSV1_ALERT_NO_APPLICATION_PROTOCOL)',
        native: () =>
          h1Only(async (base) => {
            try {
              return await nativeGet(base, '/x');
            } catch (error) {
              return error.code;
            }
          }),
        package: ({ default: http2Wrapper }) => h1Only((base) => viaWrapper(http2Wrapper, () => http2Wrapper.auto(`${base}/x`, tls))),
      },
    },
  },
};
