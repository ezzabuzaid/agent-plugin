// Sending HTTP(S) requests through a proxy: http.Agent and https.Agent take
// `proxyEnv` (HTTP_PROXY, HTTPS_PROXY, NO_PROXY), http.setGlobalProxyFromEnv()
// routes the global agents, and NODE_USE_ENV_PROXY=1 / --use-env-proxy do the
// same from the environment at startup.
import http from 'node:http';
import https from 'node:https';
import { text } from 'node:stream/consumers';
import { esm, run } from './support/child.mjs';
import { served } from './support/server.mjs';

// Runs `call({ proxy, target, log })` with a local proxy and a local target.
// The proxy answers plain requests itself ("via proxy") and refuses every
// CONNECT tunnel with 403; `log()` returns what it received, with the
// target's per-run port replaced by PORT.
async function viaProxy(call) {
  const seen = [];
  const proxy = http.createServer((request, response) => {
    const auth = request.headers['proxy-authorization'];
    seen.push(`${request.method} ${request.url}${auth ? ` ${auth}` : ''}`);
    response.end('via proxy');
  });
  proxy.on('connect', (request, socket) => {
    seen.push(`CONNECT ${request.url}`);
    socket.end('HTTP/1.1 403 Forbidden\r\n\r\n');
  });
  const target = http.createServer((request, response) => response.end('direct'));
  return served(proxy, (proxyUrl) =>
    served(target, (targetUrl) => {
      const port = new URL(targetUrl).port;
      const log = () => seen.map((line) => line.replaceAll(port, 'PORT'));
      return call({ proxy: proxyUrl, target: targetUrl, log });
    }),
  );
}

// What a GET answers: status and body, or the error code.
const answer = (module, url, agent) =>
  new Promise((resolve) => {
    module
      .get(url, { agent }, async (response) => resolve(`${response.statusCode} ${await text(response)}`))
      .on('error', (error) => resolve(error.code ?? error.message));
  });
// One GET through `agentFor(proxy)`: what the client got and what the proxy saw.
const through = (module, path, agentFor) =>
  viaProxy(async ({ proxy, target, log }) => {
    const url = `${module === https ? target.replace('http:', 'https:') : target}${path}`;
    const got = await answer(module, url, agentFor(proxy));
    return { got, proxy: log() };
  });
const withAuth = (proxy) => proxy.replace('http://', 'http://user:secret@');
// The variables set for one call, then restored.
async function withEnv(variables, call) {
  const saved = Object.fromEntries(Object.keys(variables).map((name) => [name, process.env[name]]));
  Object.assign(process.env, variables);
  try {
    return await call();
  } finally {
    for (const [name, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
}
// One GET with the default global agent in a child process that first runs
// `setup` (global-agent patches the process for good, so it runs apart);
// `env(proxy)` adds environment variables to the child.
const globalGet = (setup, env = () => ({})) =>
  viaProxy(async ({ proxy, target, log }) => {
    const { stdout: got } = await run(
      esm(`import http from 'node:http';
const proxy = ${JSON.stringify(proxy)};
${setup}
http.get(${JSON.stringify(`${target}/a`)}, async (response) => {
  let body = '';
  for await (const chunk of response) body += chunk;
  process.stdout.write(response.statusCode + ' ' + body);
}).on('error', (error) => process.stdout.write(error.code));`),
      { env: env(proxy) },
    );
    return { got, proxy: log() };
  });

export default {
  apis: [
    'http:new Agent',
    'https:new Agent',
    'http:http.setGlobalProxyFromEnv',
    'cli:NODE_USE_ENV_PROXY',
    'cli:--use-env-proxy',
  ],
  reviewedAt: 'v26.13.0',
  replaces: {
    'http-proxy-agent@9.1.0': {
      HttpProxyAgent: {
        native: () => through(http, '/a?b=1', (proxy) => new http.Agent({ proxyEnv: { HTTP_PROXY: proxy } })),
        package: ({ HttpProxyAgent }) => through(http, '/a?b=1', (proxy) => new HttpProxyAgent(proxy)),
      },
      'HttpProxyAgent: credentials': {
        native: () => through(http, '/a', (proxy) => new http.Agent({ proxyEnv: { HTTP_PROXY: withAuth(proxy) } })),
        package: ({ HttpProxyAgent }) => through(http, '/a', (proxy) => new HttpProxyAgent(withAuth(proxy))),
      },
    },
    'https-proxy-agent@9.1.0': {
      'HttpsProxyAgent: tunnel request': {
        native: async () =>
          (await through(https, '/a', (proxy) => new https.Agent({ proxyEnv: { HTTPS_PROXY: proxy } }))).proxy,
        package: async ({ HttpsProxyAgent }) =>
          (await through(https, '/a', (proxy) => new HttpsProxyAgent(proxy))).proxy,
      },
      'HttpsProxyAgent: refused tunnel': {
        gap: "https.Agent fails the request with ERR_PROXY_TUNNEL when the proxy refuses CONNECT; HttpsProxyAgent hands the proxy's 403 to the caller as the response",
        native: async () =>
          (await through(https, '/a', (proxy) => new https.Agent({ proxyEnv: { HTTPS_PROXY: proxy } }))).got,
        package: async ({ HttpsProxyAgent }) => (await through(https, '/a', (proxy) => new HttpsProxyAgent(proxy))).got,
      },
    },
    'proxy-agent@8.0.2': {
      ProxyAgent: {
        native: () =>
          viaProxy(({ proxy, target, log }) =>
            withEnv({ HTTP_PROXY: proxy }, async () => ({
              got: await answer(http, `${target}/a`, new http.Agent({ proxyEnv: process.env })),
              proxy: log(),
            })),
          ),
        package: ({ ProxyAgent }) =>
          viaProxy(({ proxy, target, log }) =>
            withEnv({ HTTP_PROXY: proxy }, async () => ({ got: await answer(http, `${target}/a`, new ProxyAgent()), proxy: log() })),
          ),
      },
      'ProxyAgent: NO_PROXY': {
        native: () =>
          viaProxy(async ({ proxy, target, log }) => ({
            got: await answer(http, `${target}/a`, new http.Agent({ proxyEnv: { HTTP_PROXY: proxy, NO_PROXY: '127.0.0.1' } })),
            proxy: log(),
          })),
        package: ({ ProxyAgent }) =>
          viaProxy(({ proxy, target, log }) =>
            withEnv({ HTTP_PROXY: proxy, NO_PROXY: '127.0.0.1' }, async () => ({
              got: await answer(http, `${target}/a`, new ProxyAgent()),
              proxy: log(),
            })),
          ),
      },
    },
    'global-agent@4.1.6': {
      bootstrap: {
        native: () => globalGet(`http.setGlobalProxyFromEnv({ HTTP_PROXY: proxy });`),
        package: (module, { url }) =>
          globalGet(`process.env.GLOBAL_AGENT_HTTP_PROXY = proxy;
const { bootstrap } = await import(${JSON.stringify(url)});
bootstrap();`),
      },
      'bootstrap: from the environment': {
        native: () => globalGet('', (proxy) => ({ NODE_USE_ENV_PROXY: '1', HTTP_PROXY: proxy })),
        package: (module, { url }) =>
          globalGet(`(await import(${JSON.stringify(url)})).bootstrap();`, (proxy) => ({ GLOBAL_AGENT_HTTP_PROXY: proxy })),
      },
    },
  },
};
