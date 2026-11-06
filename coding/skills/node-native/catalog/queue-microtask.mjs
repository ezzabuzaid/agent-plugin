// Run a callback as a microtask: after the current job, before timers and I/O.

// The order in which a microtask, a promise reaction and a timer run.
const order = (queue) =>
  new Promise((resolve) => {
    const seen = [];
    setTimeout(() => {
      seen.push('timeout');
      resolve(seen);
    }, 0);
    queue(() => seen.push('microtask'));
    seen.push('sync');
  });
// Where an error thrown inside the callback goes.
const thrown = (queue) =>
  new Promise((resolve) => {
    const caught = (error) => {
      process.off('uncaughtException', caught);
      process.off('unhandledRejection', rejected);
      resolve(['uncaughtException', error.message]);
    };
    const rejected = (error) => {
      process.off('uncaughtException', caught);
      process.off('unhandledRejection', rejected);
      resolve(['unhandledRejection', error.message]);
    };
    process.on('uncaughtException', caught);
    process.on('unhandledRejection', rejected);
    queue(() => {
      throw new Error('boom');
    });
  });

export default {
  apis: ['globals:queueMicrotask', 'js:queueMicrotask'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'queue-microtask@1.2.3': {
      default: {
        native: () => order(queueMicrotask),
        package: ({ default: queue }) => order(queue),
      },
    },
  },
  idioms: {
    promiseThen: {
      seed: '(?:^|[;{}\\n])[ \\t]*(?:void\\s+)?Promise\\.resolve\\(\\)\\.then\\((?:[^()]|\\((?:[^()]|\\([^()]*\\))*\\))*\\)\\s*;',
      native: () => order(queueMicrotask),
      idiom: () =>
        order((callback) => {
          Promise.resolve().then(callback);
        }),
    },
    'promiseThen: thrown error': {
      gap: 'an error thrown in a Promise.resolve().then callback becomes an unhandled rejection; queueMicrotask reports it as an uncaught exception, like any other callback',
      native: () => thrown(queueMicrotask),
      idiom: () =>
        thrown((callback) => {
          Promise.resolve().then(callback);
        }),
    },
  },
};
