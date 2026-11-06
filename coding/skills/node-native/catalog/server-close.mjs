// Shutting an HTTP server down: server.close() stops accepting and closes idle
// keep-alive sockets, closeIdleConnections() and closeAllConnections() close
// the rest, and a SIGTERM listener runs it from a signal.
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { Agent, createServer, get } from 'node:http';
import { connect } from 'node:net';
import { setTimeout as sleep } from 'node:timers/promises';
import { text } from 'node:stream/consumers';

// The app every shutdown is judged on: `/` answers at once, `/slow` after
// 150 ms, `/hang` never; `received` hears of each request.
const app = (received) => (request, response) => {
  received(request.url);
  if (request.url === '/slow') setTimeout(() => response.end('slow done'), 150);
  else if (request.url !== '/hang') response.end(`app ${request.url}`);
};

// What a client sees of one GET: status and body, or the error code.
const fetched = (url, agent) =>
  new Promise((resolve) => {
    get(url, { agent }, async (response) => resolve(`${response.statusCode} ${await text(response)}`)).on('error', (error) =>
      resolve(error.code),
    );
  });
// Whether a socket closes within `ms`.
const closesWithin = (socket, ms) =>
  Promise.race([once(socket, 'close').then(() => 'closed'), sleep(ms).then(() => 'still open')]);
// Whether a new connection is accepted.
const accepts = async (port) => {
  const socket = connect(port, '127.0.0.1');
  try {
    await once(socket, 'connect');
    return 'accepted';
  } catch (error) {
    return error.code;
  } finally {
    socket.destroy();
  }
};

// Drives one shutdown: an idle keep-alive socket, a request in flight
// (`/slow`, or `/hang` for a grace timeout), then `stop()`; reports what each
// client saw. `started` resolves once the server has the in-flight request.
async function shutdown({ port, started, stop, inFlight = '/slow' }) {
  const keepAlive = new Agent({ keepAlive: true });
  const base = `http://127.0.0.1:${port}`;
  const idleSocket = await new Promise((resolve) => {
    get(`${base}/`, { agent: keepAlive }, (response) => {
      const { socket } = response;
      response.resume();
      response.on('end', () => resolve(socket));
    });
  });
  const pending = fetched(`${base}${inFlight}`, new Agent());
  await started;
  const stopped = stop();
  const [response, idle] = await Promise.all([pending, closesWithin(idleSocket, 1000)]);
  const outcome = await stopped;
  return { inFlight: response, idle, afterwards: await accepts(port), ...outcome };
}

// The same shutdown against a server in this process; `wrap(server)` lets a
// package decorate it, `stop(server)` shuts it down.
async function inProcess(stop, { wrap = (server) => server, inFlight } = {}) {
  let heard;
  const started = new Promise((resolve) => (heard = resolve));
  const server = wrap(createServer(app((url) => url !== '/' && heard())));
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    return await shutdown({
      port: server.address().port,
      started,
      inFlight,
      stop: async () => {
        await stop(server);
        return { closed: !server.listening };
      },
    });
  } finally {
    server.closeAllConnections();
    server.close();
  }
}

// The same shutdown against a server in a child process, stopped by SIGTERM.
// `setup` is module code that gets `server` and `log(line)`; the child prints
// `port <n>`, then every line `log` writes and `request <url>` per request.
async function bySignal(setup, path = '/slow') {
  const child = spawn(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `import { createServer } from 'node:http';
const log = (line) => process.stdout.write(line + '\\n');
const server = createServer((${app})((url) => log('request ' + url)));
${setup}
server.listen(0, '127.0.0.1', () => log('port ' + server.address().port));`,
    ],
    { stdio: ['ignore', 'pipe', 'inherit'] },
  );
  const lines = [];
  const waiters = [];
  child.stdout.setEncoding('utf8');
  let buffered = '';
  child.stdout.on('data', (chunk) => {
    buffered += chunk;
    for (let at = buffered.indexOf('\n'); at >= 0; at = buffered.indexOf('\n')) {
      lines.push(buffered.slice(0, at));
      buffered = buffered.slice(at + 1);
      for (const waiter of waiters.splice(0)) waiter();
    }
  });
  const line = async (match) => {
    while (!lines.some(match)) await new Promise((resolve) => waiters.push(resolve));
    return lines.find(match);
  };
  const exited = once(child, 'exit');
  try {
    const port = Number((await line((text) => text.startsWith('port '))).slice(5));
    const outcome = await shutdown({
      port,
      inFlight: path,
      started: line((text) => text === `request ${path}`),
      stop: async () => {
        child.kill('SIGTERM');
        const [code, signal] = await exited;
        return { exit: signal ?? code };
      },
    });
    return { ...outcome, log: lines.filter((text) => !/^(port|request) /.test(text)) };
  } finally {
    child.kill('SIGKILL');
  }
}

// A health check request against a child server, before any signal.
async function health(setup) {
  const child = spawn(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `import { createServer } from 'node:http';
const server = createServer((${app})(() => {}));
${setup}
server.listen(0, '127.0.0.1', () => process.stdout.write(String(server.address().port)));`,
    ],
    { stdio: ['ignore', 'pipe', 'inherit'] },
  );
  try {
    const [port] = await once(child.stdout, 'data');
    return await fetched(`http://127.0.0.1:${String(port)}/healthcheck`, new Agent());
  } finally {
    child.kill('SIGKILL');
  }
}

// The native SIGTERM handler: hooks around server.close(), a grace timeout
// that ends what is still open, then the signal again with the trap removed.
const nativeHandler = `
process.once('SIGTERM', async () => {
  log('before shutdown');
  const grace = setTimeout(() => server.closeAllConnections(), 1000).unref();
  await new Promise((resolve) => server.close(resolve));
  clearTimeout(grace);
  log('on signal');
  log('on shutdown');
  process.kill(process.pid, 'SIGTERM');
});`;
const terminusSetup = (url, options = '') => `
const { createTerminus } = (await import(${JSON.stringify(url)})).default;
createTerminus(server, {
  beforeShutdown: async () => log('before shutdown'),
  onSignal: async () => log('on signal'),
  onShutdown: async () => log('on shutdown'),
  ${options}
});`;

export default {
  apis: [
    'http:server.close',
    'http:server.closeAllConnections',
    'http:server[Symbol.asyncDispose]',
  ],
  reviewedAt: 'v26.13.0',
  replaces: {
    'stoppable@1.1.0': {
      default: {
        native: () => inProcess((server) => server[Symbol.asyncDispose]()),
        package: ({ default: stoppable }) =>
          inProcess((server) => new Promise((resolve) => server.stop(resolve)), { wrap: (server) => stoppable(server) }),
      },
      'default: grace': {
        native: () =>
          inProcess(
            async (server) => {
              const grace = setTimeout(() => server.closeAllConnections(), 50);
              await server[Symbol.asyncDispose]();
              clearTimeout(grace);
            },
            { inFlight: '/hang' },
          ),
        package: ({ default: stoppable }) =>
          inProcess((server) => new Promise((resolve) => server.stop(resolve)), {
            wrap: (server) => stoppable(server, 50),
            inFlight: '/hang',
          }),
      },
    },
    'http-terminator@3.2.0': {
      createHttpTerminator: {
        native: () => inProcess((server) => server[Symbol.asyncDispose]()),
        package: ({ createHttpTerminator }) => {
          let terminator;
          return inProcess(() => terminator.terminate(), {
            wrap: (server) => ((terminator = createHttpTerminator({ server })), server),
          });
        },
      },
      'createHttpTerminator: gracefulTerminationTimeout': {
        native: () =>
          inProcess(
            async (server) => {
              const grace = setTimeout(() => server.closeAllConnections(), 50);
              await server[Symbol.asyncDispose]();
              clearTimeout(grace);
            },
            { inFlight: '/hang' },
          ),
        package: ({ createHttpTerminator }) => {
          let terminator;
          return inProcess(() => terminator.terminate(), {
            wrap: (server) => ((terminator = createHttpTerminator({ server, gracefulTerminationTimeout: 50 })), server),
            inFlight: '/hang',
          });
        },
      },
    },
    '@godaddy/terminus@4.12.1': {
      createTerminus: {
        native: () => bySignal(nativeHandler),
        package: (module, { url }) => bySignal(terminusSetup(url)),
      },
      'createTerminus: timeout': {
        native: () => bySignal(nativeHandler.replace('1000', '50'), '/hang'),
        package: (module, { url }) => bySignal(terminusSetup(url, 'timeout: 50,'), '/hang'),
      },
      'createTerminus: healthChecks': {
        gap: 'terminus answers the health check routes it is given (200 {"status":"ok"}, 503 while shutting down); a native server answers them with the app handler',
        native: () => health(''),
        package: (module, { url }) => health(terminusSetup(url, "healthChecks: { '/healthcheck': async () => {} },")),
      },
    },
  },
  idioms: {
    socketSet: {
      seed: "\\.on\\(\\s*['\"]connection['\"]\\s*,\\s*(?:function\\s*)?\\(?\\s*\\w+\\s*\\)?\\s*(?:=>)?\\s*\\{?\\s*\\w+\\.(?:add|push)\\(",
      native: () =>
        inProcess(
          async (server) => {
            server.closeAllConnections();
            await server[Symbol.asyncDispose]();
          },
          { inFlight: '/hang' },
        ),
      idiom: () => {
        const sockets = new Set();
        return inProcess(
          async (server) => {
            for (const socket of sockets) socket.destroy();
            await new Promise((resolve) => server.close(resolve));
          },
          {
            inFlight: '/hang',
            wrap: (server) => {
              server.on('connection', (socket) => {
                sockets.add(socket);
                socket.on('close', () => sockets.delete(socket));
              });
              return server;
            },
          },
        );
      },
    },
  },
};
