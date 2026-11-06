// Trusting an extra CA in every TLS connection of the process:
// tls.setDefaultCACertificates() with tls.getCACertificates() plus the new
// certificate, or NODE_EXTRA_CA_CERTS at startup.
import { once } from 'node:events';
import { createServer } from 'node:https';
import { join } from 'node:path';
import { esm, run } from './support/child.mjs';
import { inScratch } from './support/scratch.mjs';

// A self-signed test certificate for 127.0.0.1 and localhost (P-256), valid
// 2026-11-06 to 2036-11-03, and its key (the same pair as http2-client.mjs).
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

// Runs `setup` in a child process, then a GET with the default https agent
// against a local server that presents CERT; reports status and body, or the
// TLS error code. `setup` gets `caFile`, the path of a file holding CERT;
// `env(caFile)` adds environment variables to the child.
const trusted = (setup, env = () => ({})) =>
  inScratch({ 'ca.pem': CERT }, async (dir) => {
    const caFile = join(dir, 'ca.pem');
    const server = createServer({ key: KEY, cert: CERT }, (request, response) => response.end('trusted'));
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    try {
      const { stdout } = await run(
        esm(`import https from 'node:https';
import tls from 'node:tls';
import { readFileSync } from 'node:fs';
const caFile = ${JSON.stringify(caFile)};
${setup}
https.get('https://127.0.0.1:${server.address().port}/', async (response) => {
  let body = '';
  for await (const chunk of response) body += chunk;
  process.stdout.write(response.statusCode + ' ' + body);
}).on('error', (error) => process.stdout.write(error.code));`),
        { env: env(caFile) },
      );
      return stdout;
    } finally {
      server.closeAllConnections();
      server.close();
    }
  });

export default {
  apis: ['tls:tls.setDefaultCACertificates', 'tls:tls.getCACertificates', 'cli:NODE_EXTRA_CA_CERTS'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'syswide-cas@5.3.0': {
      addCAs: {
        native: () => trusted(`tls.setDefaultCACertificates([...tls.getCACertificates(), readFileSync(caFile, 'utf8')]);`),
        package: (module, { url }) => trusted(`(await import(${JSON.stringify(url)})).default.addCAs(caFile);`),
      },
      'addCAs: from the environment': {
        native: () => trusted('', (caFile) => ({ NODE_EXTRA_CA_CERTS: caFile })),
        package: (module, { url }) => trusted(`(await import(${JSON.stringify(url)})).default.addCAs(caFile);`),
      },
    },
  },
};
