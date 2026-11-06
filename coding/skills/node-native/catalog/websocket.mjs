// A WebSocket client: connect, send text and binary frames, receive, close.
// The ws server has no native counterpart, so both sides talk to a minimal
// RFC 6455 echo server written here on node:http.
import { createHash } from 'node:crypto';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { served } from './support/server.mjs';

const frame = (opcode, payload) => {
  const body = Buffer.from(payload);
  return Buffer.concat([Buffer.from([0x80 | opcode, body.length]), body]);
};
// Unmasks every complete client frame in `buffer`; returns them and the rest.
const frames = (buffer) => {
  const done = [];
  while (buffer.length >= 2) {
    const opcode = buffer[0] & 0x0f;
    let length = buffer[1] & 0x7f;
    let offset = 2;
    if (length === 126) {
      length = buffer.readUInt16BE(2);
      offset = 4;
    }
    if (buffer.length < offset + 4 + length) break;
    const mask = buffer.subarray(offset, offset + 4);
    const payload = Buffer.from(buffer.subarray(offset + 4, offset + 4 + length));
    for (let index = 0; index < payload.length; index += 1) payload[index] ^= mask[index % 4];
    done.push([opcode, payload]);
    buffer = buffer.subarray(offset + 4 + length);
  }
  return [done, buffer];
};
// Runs `call(url)` against the echo server. It greets each client with the
// subprotocol and authorization header it saw, echoes text as "echo:<text>"
// and binary as is, and answers a close.
async function echoed(call) {
  const server = createServer();
  server.on('upgrade', (request, socket) => {
    const accept = createHash('sha1')
      .update(`${request.headers['sec-websocket-key']}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`)
      .digest('base64');
    const protocol = request.headers['sec-websocket-protocol']?.split(',')[0].trim();
    socket.write(
      [
        'HTTP/1.1 101 Switching Protocols',
        'Upgrade: websocket',
        'Connection: Upgrade',
        `Sec-WebSocket-Accept: ${accept}`,
        ...(protocol ? [`Sec-WebSocket-Protocol: ${protocol}`] : []),
        '\r\n',
      ].join('\r\n'),
    );
    socket.write(frame(1, JSON.stringify({ protocol: protocol ?? '', authorization: request.headers.authorization ?? null })));
    let pending = Buffer.alloc(0);
    socket.on('data', (chunk) => {
      const [done, rest] = frames(Buffer.concat([pending, chunk]));
      pending = rest;
      for (const [opcode, payload] of done) {
        if (opcode === 1) socket.write(frame(1, `echo:${payload}`));
        if (opcode === 2) socket.write(frame(2, payload));
        if (opcode === 8) socket.end(frame(8, payload));
      }
    });
    socket.on('error', () => {});
  });
  return await served(server, call, { scheme: 'ws' });
}
// One conversation: open, send a text and a binary frame, read three
// messages, close with a code and reason.
async function converse(make, url) {
  const socket = make(url);
  socket.binaryType = 'arraybuffer';
  const messages = [];
  const three = new Promise((resolve) => {
    socket.addEventListener('message', (event) => {
      messages.push(typeof event.data === 'string' ? event.data : [...new Uint8Array(event.data)]);
      if (messages.length === 3) resolve();
    });
  });
  await new Promise((resolve) => socket.addEventListener('open', resolve, { once: true }));
  socket.send('hi');
  socket.send(new Uint8Array([1, 2]));
  await three;
  const closed = new Promise((resolve) =>
    socket.addEventListener('close', (event) => resolve([event.code, event.reason, event.wasClean])),
  );
  socket.close(4000, 'bye');
  return [new URL(socket.url).pathname, socket.protocol, messages, await closed];
}
const firstMessage = (socket) =>
  new Promise((resolve) => {
    socket.addEventListener('message', (event) => {
      resolve(event.data);
      socket.close();
    });
  });
// A ws:// URL that refuses connections: a port that was free a moment ago.
async function refused(call) {
  const server = createServer().listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port } = server.address();
  server.close();
  await once(server, 'close');
  return call(`ws://127.0.0.1:${port}`);
}
// What an error event says about a refused connection.
const refusal = (socket) =>
  new Promise((resolve) => socket.addEventListener('error', (event) => resolve([event.type, event.message || null])));

export default {
  apis: ['globals:WebSocket', 'globals:CloseEvent', 'js:WebSocket'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'ws@8.22.1': {
      WebSocket: {
        native: () => echoed((url) => converse((at) => new WebSocket(at, ['chat']), url)),
        package: ({ WebSocket }) => echoed((url) => converse((at) => new WebSocket(at, ['chat']), url)),
      },
      'WebSocket: headers option': {
        native: () =>
          echoed((url) => firstMessage(new WebSocket(url, { headers: { authorization: 'Bearer t' } }))),
        package: ({ WebSocket }) =>
          echoed(async (url) => String(await firstMessage(new WebSocket(url, { headers: { authorization: 'Bearer t' } })))),
      },
      'WebSocket: default binaryType': {
        gap: 'a native WebSocket delivers binary frames as Blob by default; ws delivers a Node Buffer ("nodebuffer"), so set binaryType = "arraybuffer" to read bytes the same way',
        native: () => new WebSocket('ws://127.0.0.1:9/').binaryType,
        package: ({ WebSocket }) => {
          const socket = new WebSocket('ws://127.0.0.1:9/');
          socket.on('error', () => {});
          return socket.binaryType;
        },
      },
      'WebSocket: EventEmitter API': {
        gap: 'ws sockets are EventEmitters with on(), ping() and pong(); a native WebSocket has only addEventListener and on<event> handlers, and no ping()',
        native: () => {
          const socket = new WebSocket('ws://127.0.0.1:9/');
          return [typeof socket.on, typeof socket.ping];
        },
        package: ({ WebSocket }) => {
          const socket = new WebSocket('ws://127.0.0.1:9/');
          socket.on('error', () => {});
          return [typeof socket.on, typeof socket.ping];
        },
      },
      'WebSocket: connection error': {
        gap: 'ws puts the system error on the error event (message "connect ECONNREFUSED …", error.code); the native error event carries no reason',
        native: () => refused((url) => refusal(new WebSocket(url))),
        package: ({ WebSocket }) => refused((url) => refusal(new WebSocket(url))),
      },
    },
    'isomorphic-ws@5.0.0': {
      default: {
        native: () => echoed((url) => converse((at) => new WebSocket(at, ['chat']), url)),
        package: ({ default: WebSocket }) => echoed((url) => converse((at) => new WebSocket(at, ['chat']), url)),
      },
    },
  },
};
