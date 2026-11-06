// Promise-returning timers: sleep, yield to the event loop, cancel through a signal.
import { setImmediate as immediate, setTimeout as sleep } from 'node:timers/promises';

const rejected = (promise) => promise.then(() => 'resolved', () => 'rejected');
const aborted = (start) => {
  const controller = new AbortController();
  const pending = rejected(start(controller.signal));
  controller.abort();
  return pending;
};
// Whether a timer settles within 50 ms; the loser is cancelled.
const within50ms = async (start) => {
  const controller = new AbortController();
  const settled = start(controller.signal).then(() => 'settled', () => 'aborted');
  const verdict = await Promise.race([settled, sleep(50, 'pending')]);
  controller.abort();
  await settled;
  return verdict;
};
const past32Bits = 2 ** 31;

export default {
  apis: ['timers:timersPromises.setTimeout', 'timers:timersPromises.setImmediate'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'delay@7.0.0': {
      default: {
        native: () => sleep(5, 'value'),
        package: ({ default: delay }) => delay(5, { value: 'value' }),
      },
      'default: signal': {
        native: () => aborted((signal) => sleep(1000, undefined, { signal })),
        package: ({ default: delay }) => aborted((signal) => delay(1000, { signal })),
      },
      'default: past 2^31 ms': {
        gap: 'a delay longer than 2^31 - 1 ms overflows to 1 ms (TimeoutOverflowWarning); delay waits the full time',
        native: () => within50ms((signal) => sleep(past32Bits, undefined, { signal })),
        package: ({ default: delay }) => within50ms((signal) => delay(past32Bits, { signal })),
      },
      clearDelay: {
        gap: 'cancelling rejects with an AbortError; clearDelay settles the promise early with its value',
        native: () => {
          const controller = new AbortController();
          const pending = sleep(1000, 'done', { signal: controller.signal }).catch((error) => error.name);
          controller.abort();
          return pending;
        },
        package: ({ default: delay, clearDelay }) => {
          const pending = delay(1000, { value: 'done' });
          clearDelay(pending);
          return pending;
        },
      },
    },
    'es-toolkit@1.53.1': {
      delay: {
        native: () => sleep(5),
        package: ({ delay }) => delay(5),
      },
      'delay: signal': {
        native: () => aborted((signal) => sleep(1000, undefined, { signal })),
        package: ({ delay }) => aborted((signal) => delay(1000, { signal })),
      },
    },
  },
  idioms: {
    sleep: {
      seed: 'new Promise(?:<[^>]*>)?\\(\\s*\\(?\\s*([\\w$]+)\\s*\\)?\\s*=>\\s*\\{?\\s*setTimeout\\(\\s*(?:\\1\\b|\\(\\)\\s*=>\\s*\\{?\\s*\\1\\()',
      native: () => sleep(5, 'value'),
      idiom: () => new Promise((resolve) => setTimeout(resolve, 5, 'value')),
    },
    yieldToEventLoop: {
      seed: 'new Promise(?:<[^>]*>)?\\(\\s*\\(?\\s*([\\w$]+)\\s*\\)?\\s*=>\\s*\\{?\\s*setImmediate\\(\\s*(?:\\1\\b|\\(\\)\\s*=>\\s*\\{?\\s*\\1\\()',
      native: () => immediate('value'),
      idiom: () => new Promise((resolve) => setImmediate(resolve, 'value')),
    },
  },
};
