// Getting a free TCP port: listen on port 0 and read server.address().port,
// or listen on a chosen port and handle EADDRINUSE.
import { once } from 'node:events';
import { createServer } from 'node:net';

// The port a fresh listen(0) on 127.0.0.1 gets.
async function freePort() {
  const server = createServer().listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port } = server.address();
  server.close();
  await once(server, 'close');
  return port;
}
// Whether `port` can be listened on now: the claim every row checks.
async function listenable(port) {
  const server = createServer();
  try {
    server.listen(port, '127.0.0.1');
    await once(server, 'listening');
    return true;
  } catch (error) {
    return error.code;
  } finally {
    server.close();
  }
}
// Runs `call(port)` while `port` is held by another server.
async function whileBusy(call) {
  const server = createServer().listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    return await call(server.address().port);
  } finally {
    server.close();
  }
}
// How a request for the busy port `busy` was answered.
const answered = (port, busy) => (port === busy ? 'the busy port' : port > busy ? 'a later port' : 'another port');
// Listening on `port` the native way: the port, or the error code.
async function listenOn(port) {
  const server = createServer();
  try {
    server.listen(port, '127.0.0.1');
    await once(server, 'listening');
    return server.address().port;
  } catch (error) {
    return error.code;
  } finally {
    server.close();
  }
}

export default {
  apis: ['net:net.createServer', 'net:server.listen', 'net:server.address'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'get-port@7.2.0': {
      default: {
        native: async () => listenable(await freePort()),
        package: async ({ default: getPort }) => listenable(await getPort()),
      },
      'default: preferred port': {
        native: async () => {
          const preferred = await freePort();
          return (await listenOn(preferred)) === preferred;
        },
        package: async ({ default: getPort }) => {
          const preferred = await freePort();
          return (await getPort({ port: preferred, host: '127.0.0.1' })) === preferred;
        },
      },
      'default: busy preferred port': {
        gap: 'get-port falls back to another free port when the preferred one is taken; listen() fails with EADDRINUSE and the caller retries on port 0',
        native: () => whileBusy((busy) => listenOn(busy)),
        package: ({ default: getPort }) =>
          whileBusy(async (busy) => answered(await getPort({ port: busy, host: '127.0.0.1' }), busy)),
      },
    },
    'portfinder@1.0.38': {
      getPortPromise: {
        native: async () => listenable(await freePort()),
        package: async ({ default: portfinder }) => listenable(await portfinder.getPortPromise({ host: '127.0.0.1' })),
      },
      'getPortPromise: scan from a port': {
        gap: 'portfinder scans upward from options.port to the next free port; listen() has no scan and fails with EADDRINUSE',
        native: () => whileBusy((busy) => listenOn(busy)),
        package: ({ default: portfinder }) =>
          whileBusy(async (busy) => answered(await portfinder.getPortPromise({ port: busy, host: '127.0.0.1' }), busy)),
      },
    },
    'detect-port@2.1.0': {
      default: {
        native: async () => listenable(await freePort()),
        package: async ({ default: detectPort }) => listenable(await detectPort()),
      },
      'default: busy port': {
        gap: 'detect-port answers a later free port for a busy one; listen() fails with EADDRINUSE',
        native: () => whileBusy((busy) => listenOn(busy)),
        package: ({ default: detectPort }) =>
          whileBusy(async (busy) => answered(await detectPort({ port: busy, hostname: '127.0.0.1' }), busy)),
      },
    },
  },
  idioms: {
    portInUseLoop: {
      seed: String.raw`EADDRINUSE['"][\s\S]{0,160}?\bport\s*(?:\+\+|\+=\s*1\b|=\s*port\s*\+\s*1\b)`,
      native: async () => listenable(await freePort()),
      idiom: () =>
        whileBusy(async (start) => {
          let port = start;
          for (;;) {
            try {
              await new Promise((resolve, reject) => {
                const server = createServer();
                server.once('error', reject);
                server.listen(port, '127.0.0.1', () => server.close(resolve));
              });
              break;
            } catch (error) {
              if (error.code !== 'EADDRINUSE') throw error;
              port++;
            }
          }
          return listenable(port);
        }),
    },
  },
};
