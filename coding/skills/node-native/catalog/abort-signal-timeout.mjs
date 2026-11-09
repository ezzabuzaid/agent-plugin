// A signal that aborts itself after a delay: time out a fetch or any abortable work.
import { createServer } from 'node:http';
import { setTimeout as delay } from 'node:timers/promises';
import { failure } from './support/outcome.mjs';
import { served } from './support/server.mjs';

// Whether the signal is aborted before and after its delay, and why.
const expires = async (signal) => {
  const before = signal.aborted;
  await delay(40);
  return [before, signal.aborted, signal.reason?.name];
};
const expired = async (signal) => (await expires(signal)).slice(0, 2);

// Runs `call(url)` against a local server whose one route answers after 200 ms,
// and reports how the call settled and whether the server saw the client hang
// up before the answer: a timeout that only rejects leaves the request running.
async function slow(call) {
  let hungUp;
  const settled = new Promise((resolve) => {
    hungUp = resolve;
  });
  const server = createServer((request, response) => {
    const timer = setTimeout(() => response.end('late'), 200);
    response.on('close', () => {
      clearTimeout(timer);
      hungUp(!response.writableFinished);
    });
  });
  return await served(server, async (base) => [
    await failure(() => call(`${base}/`), (error) => error.name),
    await settled,
  ]);
}
const timedOutFetch = (url) => fetch(url, { signal: AbortSignal.timeout(20) });
const rejected = async (call) => (await slow(call))[0] !== 'resolved';

export default {
  apis: ['globals:AbortSignal.timeout', 'js:AbortSignal.timeout'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'timeout-signal@2.0.0': {
      default: {
        native: () => expired(AbortSignal.timeout(10)),
        package: ({ default: timeoutSignal }) => expired(timeoutSignal(10)),
      },
      'default: reason': {
        gap: 'AbortSignal.timeout aborts with a TimeoutError DOMException, so a caller tells a timeout from a cancel; timeout-signal aborts with AbortError',
        native: () => expires(AbortSignal.timeout(10)),
        package: ({ default: timeoutSignal }) => expires(timeoutSignal(10)),
      },
    },
  },
  idioms: {
    raceTimeout: {
      seed: 'Promise\\.race\\(\\s*\\[[^;]{0,300}?new Promise(?:<[^>]*>)?\\(\\s*(?:(?:\\([^)]*\\)|[\\w$]+)\\s*=>|function\\s*\\([^)]*\\))\\s*\\{?\\s*(?:return\\s+)?setTimeout\\(',
      native: () => rejected(timedOutFetch),
      idiom: () =>
        rejected((url) =>
          Promise.race([
            fetch(url).then((response) => response.text()),
            new Promise((resolve, reject) => setTimeout(() => reject(new Error('timed out')), 20)),
          ]),
        ),
    },
    'raceTimeout: request keeps running': {
      improves: 'AbortSignal.timeout aborts the request and closes the connection; racing fetch against a setTimeout promise rejects the caller but leaves the request open until the server answers',
      native: () => slow(timedOutFetch),
      idiom: () =>
        slow((url) =>
          Promise.race([
            fetch(url).then((response) => response.text()),
            new Promise((resolve, reject) => setTimeout(() => reject(new Error('timed out')), 20)),
          ]),
        ),
    },
    controllerTimeout: {
      seed: 'setTimeout\\(\\s*(?:\\(\\)\\s*=>\\s*\\{?\\s*[\\w$.?]+\\.abort\\(|[\\w$.]+\\.abort\\.bind\\()',
      native: async () => (await slow(timedOutFetch))[1],
      idiom: async () =>
        (
          await slow((url) => {
            const controller = new AbortController();
            setTimeout(() => controller.abort(), 20);
            return fetch(url, { signal: controller.signal });
          })
        )[1],
    },
    'controllerTimeout: reason': {
      gap: 'aborting a controller from setTimeout rejects with AbortError, the same as a user cancel; AbortSignal.timeout rejects with TimeoutError',
      native: () => slow(timedOutFetch),
      idiom: () =>
        slow((url) => {
          const controller = new AbortController();
          setTimeout(() => controller.abort(), 20);
          return fetch(url, { signal: controller.signal });
        }),
    },
  },
  lint: {
    controllerTimeout: {
      eslint: '10.12.0',
      plugin: 'eslint-plugin-unicorn@79.0.0',
      rule: 'unicorn/prefer-abort-signal-timeout',
      off: 'no hits, but code cannot obey it: island/no-ambient-time reports AbortSignal.timeout in each library file',
      code: 'const controller = new AbortController(); setTimeout(() => controller.abort(), 1000); await fetch(url, { signal: controller.signal });',
    },
  },
};
