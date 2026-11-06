// Checking whether something listens on a TCP port, once or until it does:
// net.connect() and the 'connect' or 'error' event it settles with.
import { once } from 'node:events';
import { connect, createServer } from 'node:net';
import { setTimeout as sleep } from 'node:timers/promises';

// The native check: connect, and report whether it was accepted.
async function reachable(port, host) {
  const socket = connect(port, host);
  try {
    await once(socket, 'connect');
    return true;
  } catch {
    return false;
  } finally {
    socket.destroy();
  }
}
// The native wait: check until the port answers or `timeout` ms pass.
async function waitFor(port, host, timeout) {
  const deadline = Date.now() + timeout;
  while (!(await reachable(port, host))) {
    if (Date.now() > deadline) return false;
    await sleep(25);
  }
  return true;
}

// Runs `call(port)` while a server listens on `port`.
async function listening(call) {
  const server = createServer((socket) => socket.end()).listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    return await call(server.address().port);
  } finally {
    server.close();
  }
}
// Runs `call(port)` with a port nothing listens on: one that was free a moment ago.
async function closed(call) {
  const server = createServer().listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port } = server.address();
  server.close();
  await once(server, 'close');
  return call(port);
}
// Runs `call(port)` with a port that starts listening 100 ms later.
async function opensLater(call) {
  return closed(async (port) => {
    const server = createServer((socket) => socket.end());
    const timer = setTimeout(() => server.listen(port, '127.0.0.1'), 100);
    try {
      return await call(port);
    } finally {
      clearTimeout(timer);
      server.close();
    }
  });
}
// Both states of one check.
const openAndClosed = async (check) => [await listening(check), await closed(check)];
// What tcp-port-used's wait settled with; it rejects with Error('timeout').
const settled = async (wait) => {
  try {
    await wait();
    return 'resolved';
  } catch (error) {
    return error.message === 'timeout' ? 'timed out' : `rejected ${error.message}`;
  }
};
const outcome = async (wait) => ((await wait) ? 'resolved' : 'timed out');

export default {
  apis: ['net:net.connect', 'net:net.createConnection', 'net:socket.destroy'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'is-port-reachable@4.0.0': {
      default: {
        native: () => openAndClosed((port) => reachable(port, '127.0.0.1')),
        package: ({ default: isPortReachable }) => openAndClosed((port) => isPortReachable(port, { host: '127.0.0.1' })),
      },
    },
    'tcp-port-used@1.0.3': {
      check: {
        native: () => openAndClosed((port) => reachable(port, '127.0.0.1')),
        package: ({ default: tcpPortUsed }) => openAndClosed((port) => tcpPortUsed.check(port, '127.0.0.1')),
      },
      waitUntilUsedOnHost: {
        native: () => opensLater((port) => outcome(waitFor(port, '127.0.0.1', 2000))),
        package: ({ default: tcpPortUsed }) =>
          opensLater((port) => settled(() => tcpPortUsed.waitUntilUsedOnHost(port, '127.0.0.1', 25, 2000))),
      },
      'waitUntilUsedOnHost: timeout': {
        native: () => closed((port) => outcome(waitFor(port, '127.0.0.1', 100))),
        package: ({ default: tcpPortUsed }) =>
          closed((port) => settled(() => tcpPortUsed.waitUntilUsedOnHost(port, '127.0.0.1', 25, 100))),
      },
    },
    'wait-port@1.1.0': {
      default: {
        native: () => opensLater(async (port) => ({ open: await waitFor(port, '127.0.0.1', 2000) })),
        package: ({ default: waitPort }) =>
          opensLater(async (port) => {
            const { open } = await waitPort({ host: '127.0.0.1', port, output: 'silent', timeout: 2000, interval: 25 });
            return { open };
          }),
      },
      'default: timeout': {
        native: () => closed(async (port) => ({ open: await waitFor(port, '127.0.0.1', 100) })),
        package: ({ default: waitPort }) =>
          closed(async (port) => {
            const { open } = await waitPort({ host: '127.0.0.1', port, output: 'silent', timeout: 100, interval: 25 });
            return { open };
          }),
      },
    },
  },
};
