// Read a server-sent event stream (text/event-stream) with an EventSource client.
import { createServer } from 'node:http';
import { served } from './support/server.mjs';

// The local server's routes: /stream sends a default and a named event;
// /missing answers 404; /auth echoes the authorization header it saw as one event.
const answer = (request, response) => {
  if (request.url === '/missing') {
    response.writeHead(404);
    response.end();
    return;
  }
  response.writeHead(200, { 'content-type': 'text/event-stream' });
  if (request.url === '/auth') {
    response.write(`data: ${request.headers.authorization ?? 'none'}\n\n`);
    return;
  }
  response.write('id: 1\ndata: first\ndata: line\n\n');
  response.write('event: tick\nid: 2\ndata: {"n":2}\n\n');
};
const local = (call) => served(createServer(answer), call);
// The first `count` events as [type, data, lastEventId], then closes the source.
const events = (source, count, types = ['message', 'tick']) =>
  new Promise((resolve) => {
    const seen = [];
    for (const type of types) {
      source.addEventListener(type, (event) => {
        seen.push([event.type, event.data, event.lastEventId]);
        if (seen.length === count) {
          source.close();
          resolve(seen);
        }
      });
    }
  });
const failedOn = (source) =>
  new Promise((resolve) => {
    source.addEventListener('error', () => {
      resolve([source.readyState, source.readyState === source.CLOSED]);
      source.close();
    });
  });
const authorized = { headers: { authorization: 'Bearer t' } };

export default {
  apis: ['globals:EventSource'],
  reviewedAt: 'v26.13.0',
  flags: ['--experimental-eventsource'],
  replaces: {
    'eventsource@5.1.4': {
      EventSource: {
        native: () => local((base) => events(new EventSource(`${base}/stream`), 2)),
        package: ({ EventSource }) => local((base) => events(new EventSource(`${base}/stream`), 2)),
      },
      'EventSource: error status': {
        native: () => local((base) => failedOn(new EventSource(`${base}/missing`))),
        package: ({ EventSource }) => local((base) => failedOn(new EventSource(`${base}/missing`))),
      },
      'EventSource: request headers': {
        gap: 'eventsource takes a fetch option that can add headers such as Authorization; the native EventSource sends no custom headers',
        native: () => local((base) => events(new EventSource(`${base}/auth`, authorized), 1, ['message'])),
        package: ({ EventSource }) =>
          local((base) =>
            events(
              new EventSource(`${base}/auth`, {
                fetch: (url, init) => fetch(url, { ...init, headers: { ...init.headers, ...authorized.headers } }),
              }),
              1,
              ['message'],
            ),
          ),
      },
    },
  },
};
