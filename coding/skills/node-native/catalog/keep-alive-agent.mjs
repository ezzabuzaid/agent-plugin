// Reusing HTTP connections: new http.Agent({ keepAlive: true }) keeps idle
// sockets for the next request, and its `timeout` closes an idle socket. The
// global agent keeps sockets alive by default since Node 19.
import { Agent, createServer, get, globalAgent } from 'node:http';
import { setTimeout as sleep } from 'node:timers/promises';
import { text } from 'node:stream/consumers';
import { served } from './support/server.mjs';

// A server that answers each request with the client port it came from, so
// two equal answers mean one reused socket.
const portOf = (call) => served(createServer((request, response) => response.end(String(request.socket.remotePort))), call);
const fetchPort = (base, agent) => new Promise((resolve) => get(base, { agent }, async (response) => resolve(await text(response))));
// Whether two requests in a row, `pause` ms apart, share one socket.
const reused = (agent, pause = 0) =>
  portOf(async (base) => {
    const first = await fetchPort(base, agent);
    await sleep(pause);
    const second = await fetchPort(base, agent);
    return first === second;
  });
// How many idle sockets the agent still holds `ms` after a request.
const idleAfter = (agent, ms) =>
  portOf(async (base) => {
    await fetchPort(base, agent);
    await sleep(ms);
    const idle = Object.values(agent.freeSockets).flat().length;
    agent.destroy();
    return idle;
  });

export default {
  apis: ['http:http.Agent', 'http:new Agent', 'http:agent.destroy'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'agentkeepalive@4.6.0': {
      HttpAgent: {
        native: () => reused(new Agent({ keepAlive: true })),
        package: ({ HttpAgent }) => reused(new HttpAgent()),
      },
      'HttpAgent: global agent': {
        native: () => reused(globalAgent),
        package: ({ HttpAgent }) => reused(new HttpAgent()),
      },
      'HttpAgent: freeSocketTimeout': {
        native: () => idleAfter(new Agent({ keepAlive: true, timeout: 50 }), 200),
        package: ({ HttpAgent }) => idleAfter(new HttpAgent({ freeSocketTimeout: 50 }), 200),
      },
      'HttpAgent: socketActiveTTL': {
        gap: 'agentkeepalive retires a socket older than socketActiveTTL and opens a new one; http.Agent has no socket age limit and reuses it',
        native: () => reused(new Agent({ keepAlive: true, socketActiveTTL: 50 }), 150),
        package: ({ HttpAgent }) => reused(new HttpAgent({ socketActiveTTL: 50 }), 150),
      },
      'HttpAgent: getCurrentStatus': {
        gap: 'agentkeepalive counts created, closed, errored and timed-out sockets and requests (getCurrentStatus); http.Agent exposes only the live sockets, freeSockets and requests maps',
        native: () => typeof new Agent({ keepAlive: true }).getCurrentStatus,
        package: ({ HttpAgent }) => typeof new HttpAgent().getCurrentStatus,
      },
    },
  },
};
