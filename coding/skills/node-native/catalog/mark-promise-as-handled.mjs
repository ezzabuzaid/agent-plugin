// Silencing the unhandled-rejection report for a promise that is awaited later or on purpose never.
import { setImmediate } from 'node:timers/promises';
import { markPromiseAsHandled } from 'node:util';

// Rejects a promise, lets `handle` mark it, and returns how many
// 'unhandledRejection' events fired and what the promise still rejects with.
const report = async (handle) => {
  let unhandled = 0;
  const count = () => unhandled++;
  process.on('unhandledRejection', count);
  try {
    const promise = Promise.reject(new Error('later'));
    handle(promise);
    await setImmediate();
    await setImmediate();
    return { unhandled, reason: await promise.catch((error) => error.message) };
  } finally {
    process.off('unhandledRejection', count);
  }
};

export default {
  apis: ['util:util.markPromiseAsHandled'],
  reviewedAt: 'v26.13.0',
  idioms: {
    emptyCatch: {
      seed: '(?<=(?:^|[\\n;{)])[ \\t]*)(?:void\\s+)?(?:[\\w$#][\\w$.#?]*(?:\\((?:[^()]|\\([^()]*\\))*\\))?|\\}\\)\\(\\))\\.catch\\(\\s*\\(\\s*\\)\\s*=>\\s*(?:\\{\\s*\\}|undefined|null|void 0)\\s*\\)(?=[ \\t]*(?:;|\\n|$))',
      native: () => report((promise) => markPromiseAsHandled(promise)),
      idiom: () =>
        report((promise) => {
          promise.catch(() => {});
        }),
    },
  },
};
