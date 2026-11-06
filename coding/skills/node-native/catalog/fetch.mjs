// HTTP requests with the WHATWG fetch API: fetch, Headers, Request, Response.
import { once } from 'node:events';
import { createServer } from 'node:http';
import { failure } from './support/outcome.mjs';
import { served } from './support/server.mjs';

const routes = {
  '/json': (request, response) => {
    response.setHeader('content-type', 'application/json');
    response.end('{"ok":true}');
  },
  '/redirect': (request, response) => {
    response.writeHead(302, { location: '/json' });
    response.end();
  },
  '/missing': (request, response) => {
    response.writeHead(404, 'Nope');
    response.end('missing');
  },
  '/cookies': (request, response) => {
    response.setHeader('set-cookie', ['a=1', 'b=2']);
    response.end('ok');
  },
  '/echo': async (request, response) => {
    let body = '';
    for await (const chunk of request) body += chunk;
    response.end(JSON.stringify({ method: request.method, type: request.headers['content-type'] ?? null, body }));
  },
  '/agent': (request, response) => {
    response.end(JSON.stringify({ agent: request.headers['user-agent'], encoding: request.headers['accept-encoding'] }));
  },
  '/slow': (request, response) => {
    setTimeout(() => response.end('late'), 1000).unref();
  },
};

// Runs `call(base)` against a local server that answers `routes`.
const local = (call) => served(createServer((request, response) => routes[request.url](request, response)), call);
// A base URL that refuses connections: a port that was free a moment ago.
async function refused(call) {
  const server = createServer().listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port } = server.address();
  server.close();
  await once(server, 'close');
  return call(`http://127.0.0.1:${port}`);
}

// The parts of a response a caller reads; the URL loses its per-run port.
const received = async (response) => ({
  status: response.status,
  statusText: response.statusText,
  ok: response.ok,
  redirected: response.redirected,
  path: new URL(response.url).pathname,
  location: response.headers.get('location'),
  body: await response.text(),
});
const get = (fetch, path, init) => local(async (base) => received(await fetch(`${base}${path}`, init)));
// A failure can come with the response or while its body is read.
const failed = (fetch, path, init, describe = (error) => error.name) =>
  local((base) => failure(async () => (await fetch(`${base}${path}`, init)).text(), describe));

const nodeFetch2 = ['cross-fetch@4.1.0', 'isomorphic-fetch@3.0.0'];
const fetchOf = {
  'node-fetch@3.3.2': ({ default: fetch }) => fetch,
  'cross-fetch@4.1.0': ({ default: fetch }) => fetch,
  'isomorphic-fetch@3.0.0': ({ default: fetch }) => fetch,
};

// Rows every fetch package shares: the request, the response, and how each
// failure is reported.
const fetchRows = (spec, fetchFrom) => ({
  default: {
    native: () => get(fetch, '/json'),
    package: (module) => get(fetchFrom(module), '/json'),
  },
  'default: error status': {
    native: () => get(fetch, '/missing'),
    package: (module) => get(fetchFrom(module), '/missing'),
  },
  'default: follows a redirect': {
    native: () => get(fetch, '/redirect'),
    package: (module) => get(fetchFrom(module), '/redirect'),
  },
  'default: manual redirect': nodeFetch2.includes(spec)
    ? {
        gap: `${spec} (node-fetch 2) resolves a manual redirect's Location header to an absolute URL; fetch returns it as sent`,
        native: () => get(fetch, '/redirect', { redirect: 'manual' }),
        package: (module) => get(fetchFrom(module), '/redirect', { redirect: 'manual' }),
      }
    : {
        native: () => get(fetch, '/redirect', { redirect: 'manual' }),
        package: (module) => get(fetchFrom(module), '/redirect', { redirect: 'manual' }),
      },
  'default: text body': {
    native: () => get(fetch, '/echo', { method: 'POST', body: 'x=1' }),
    package: (module) => get(fetchFrom(module), '/echo', { method: 'POST', body: 'x=1' }),
  },
  'default: URLSearchParams body': {
    native: () => get(fetch, '/echo', { method: 'POST', body: new URLSearchParams({ a: '1' }) }),
    package: (module) => get(fetchFrom(module), '/echo', { method: 'POST', body: new URLSearchParams({ a: '1' }) }),
  },
  'default: aborted': {
    native: () => failed(fetch, '/slow', { signal: AbortSignal.abort() }),
    package: (module) => failed(fetchFrom(module), '/slow', { signal: AbortSignal.abort() }),
  },
  'default: timeout signal': {
    gap: `fetch rejects with a TimeoutError DOMException when an AbortSignal.timeout fires; ${spec} rejects with AbortError`,
    native: () => failed(fetch, '/slow', { signal: AbortSignal.timeout(20) }),
    package: (module) => failed(fetchFrom(module), '/slow', { signal: AbortSignal.timeout(20) }),
  },
  'default: connection refused': {
    native: () => refused((base) => failure(() => fetch(base), (error) => error.cause.code)),
    package: (module) => refused((base) => failure(() => fetchFrom(module)(base), (error) => error.code)),
  },
  'default: connection refused error class': {
    gap: `fetch rejects with TypeError "fetch failed" and the system error as its cause; ${spec} rejects with a FetchError that carries the code itself`,
    native: () => refused((base) => failure(() => fetch(base), (error) => error.name)),
    package: (module) => refused((base) => failure(() => fetchFrom(module)(base), (error) => error.name)),
  },
  'default: redirect error': {
    gap: `fetch rejects a redirect under redirect: "error" with TypeError "fetch failed"; ${spec} rejects with FetchError of type no-redirect`,
    native: () => failed(fetch, '/redirect', { redirect: 'error' }),
    package: (module) => failed(fetchFrom(module), '/redirect', { redirect: 'error' }),
  },
  'default: follow option': {
    gap: `fetch has no redirect limit option and follows the redirect; ${spec} rejects at { follow: 0 }`,
    native: () => failed(fetch, '/redirect', { follow: 0 }),
    package: (module) => failed(fetchFrom(module), '/redirect', { follow: 0 }),
  },
  'default: size option': {
    gap: `fetch has no response size limit option and reads the whole body; ${spec} rejects past { size }`,
    native: () => failed(fetch, '/json', { size: 4 }),
    package: (module) => failed(fetchFrom(module), '/json', { size: 4 }),
  },
  'default: user agent': {
    gap: `fetch sends user-agent "node" and accept-encoding "gzip, deflate"; ${spec} sends its own user-agent and encodings`,
    native: () => get(fetch, '/agent'),
    package: (module) => get(fetchFrom(module), '/agent'),
  },
});

const headers = (Headers) => {
  const list = new Headers({ 'X-B': '2' });
  list.append('x-a', '1');
  list.append('x-a', '3');
  list.set('Content-Type', 'text/plain');
  list.delete('x-b');
  return [[...list], list.get('X-A'), list.has('content-type')];
};
const request = (Request) => {
  const made = new Request('http://127.0.0.1/path?q=1', { method: 'POST', headers: { 'x-a': '1' }, body: 'x' });
  return [made.method, made.url, made.headers.get('x-a'), made.redirect];
};
const response = async (Response) => {
  const made = new Response('{"a":1}', { status: 201, statusText: 'Created', headers: { 'x-a': '1' } });
  return [made.status, made.statusText, made.ok, made.headers.get('x-a'), await made.json()];
};
const json = async (Response) => {
  const made = Response.json({ a: 1 }, { status: 201 });
  return [made.status, made.headers.get('content-type'), await made.json()];
};
// The set-cookie headers of a response, one per cookie.
const cookies = (fetch, list) => local(async (base) => list((await fetch(`${base}/cookies`)).headers));
const classRows = (spec) => ({
  Headers: {
    native: () => headers(Headers),
    package: (module) => headers(module.Headers),
  },
  'Headers: raw set-cookie': {
    native: () => cookies(fetch, (list) => list.getSetCookie()),
    package: (module) => cookies(fetchOf[spec](module), (list) => list.raw()['set-cookie']),
  },
  Request: {
    native: () => request(Request),
    package: (module) => request(module.Request),
  },
  Response: {
    native: () => response(Response),
    package: (module) => response(module.Response),
  },
});

export default {
  apis: [
    'globals:fetch',
    'globals:Headers',
    'globals:Request',
    'globals:Response',
    'js:fetch',
    'js:Headers.prototype.getSetCookie',
    'js:Response.json',
  ],
  reviewedAt: 'v26.13.0',
  replaces: {
    'node-fetch@3.3.2': {
      ...fetchRows('node-fetch@3.3.2', fetchOf['node-fetch@3.3.2']),
      ...classRows('node-fetch@3.3.2'),
      'default: response type': {
        gap: 'a fetched response has type "basic"; node-fetch reports "default"',
        native: () => local(async (base) => (await fetch(`${base}/json`)).type),
        package: ({ default: fetch }) => local(async (base) => (await fetch(`${base}/json`)).type),
      },
      'Response: json': {
        native: () => json(Response),
        package: ({ Response }) => json(Response),
      },
    },
    'cross-fetch@4.1.0': {
      ...fetchRows('cross-fetch@4.1.0', fetchOf['cross-fetch@4.1.0']),
      ...classRows('cross-fetch@4.1.0'),
      fetch: {
        native: () => get(fetch, '/json'),
        package: ({ fetch }) => get(fetch, '/json'),
      },
      'Response: json': {
        improves: 'the native Response has the static Response.json(data), which builds a JSON response; the node-fetch 2 Response that cross-fetch exports has none',
        native: () => typeof Response.json,
        package: ({ Response }) => typeof Response.json,
      },
    },
    'isomorphic-fetch@3.0.0': fetchRows('isomorphic-fetch@3.0.0', fetchOf['isomorphic-fetch@3.0.0']),
  },
  lint: {
    banNodeFetch: {
      eslint: '10.12.0',
      plugin: 'eslint-plugin-depend@1.5.0',
      rule: 'depend/ban-dependencies',
      code: "import fetch from 'node-fetch';",
    },
    banCrossFetch: {
      eslint: '10.12.0',
      plugin: 'eslint-plugin-depend@1.5.0',
      rule: 'depend/ban-dependencies',
      code: "import fetch from 'cross-fetch';",
    },
  },
};
