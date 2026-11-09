// Throttling: limit how often a function runs.
import { setTimeout as sleep } from 'node:timers/promises';
import { throttle } from 'node:util';

// Calls the throttled function with each value in one tick and returns what
// reached `fn` within 10 ms and by the end.
const calls = async (make, values = [1, 2, 3]) => {
  const log = [];
  const throttled = make((value) => {
    log.push(value);
    return value * 10;
  });
  const settled = Promise.allSettled(values.map((value) => throttled(value)));
  await sleep(10);
  const early = [...log];
  await sleep(150);
  await settled;
  return { early, all: log };
};
const results = (make, values) => {
  const throttled = make((value) => value * 10);
  return Promise.all(values.map((value) => throttled(value)));
};

const queues = 'queues every call and runs each one; the package drops all but the last call of a window';

// lodash and lodash-es export the same throttle; `lodash` reads it from the module.
const lodashRows = (lodash) => ({
  throttle: {
    gap: queues,
    native: () => calls((fn) => throttle(fn, 1, 20)),
    package: (module) => calls((fn) => lodash(module).throttle(fn, 20)),
  },
  'throttle: trailing false': {
    native: () => calls((fn) => throttle(fn, 1, 20, { overflow: 'drop' })),
    package: (module) => calls((fn) => lodash(module).throttle(fn, 20, { trailing: false })),
  },
});

export default {
  apis: ['util:util.throttle'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'p-throttle@8.1.1': {
      default: {
        native: async () => [await calls((fn) => throttle(fn, 2, 50), [1, 2, 3, 4]), await results((fn) => throttle(fn, 2, 50), [1, 2, 3, 4])],
        package: async ({ default: pThrottle }) => [
          await calls((fn) => pThrottle({ limit: 2, interval: 50 })(fn), [1, 2, 3, 4]),
          await results((fn) => pThrottle({ limit: 2, interval: 50 })(fn), [1, 2, 3, 4]),
        ],
      },
      'default: strict': {
        native: () => calls((fn) => throttle(fn, 2, 50, { strict: true }), [1, 2, 3, 4]),
        package: ({ default: pThrottle }) => calls((fn) => pThrottle({ limit: 2, interval: 50, strict: true })(fn), [1, 2, 3, 4]),
      },
    },
    'lodash.throttle@4.1.1': {
      default: {
        gap: queues,
        native: () => calls((fn) => throttle(fn, 1, 20)),
        package: ({ default: lodashThrottle }) => calls((fn) => lodashThrottle(fn, 20)),
      },
      'default: trailing false': {
        native: () => calls((fn) => throttle(fn, 1, 20, { overflow: 'drop' })),
        package: ({ default: lodashThrottle }) => calls((fn) => lodashThrottle(fn, 20, { trailing: false })),
      },
    },
    'lodash@4.18.1': lodashRows(({ default: _ }) => _),
    'lodash-es@4.18.1': lodashRows((lodashEs) => lodashEs),
    'es-toolkit@1.53.1': {
      throttle: {
        gap: queues,
        native: () => calls((fn) => throttle(fn, 1, 20)),
        package: ({ throttle: toolkit }) => calls((fn) => toolkit(fn, 20)),
      },
      'throttle: leading edge only': {
        native: () => calls((fn) => throttle(fn, 1, 20, { overflow: 'drop' })),
        package: ({ throttle: toolkit }) => calls((fn) => toolkit(fn, 20, { edges: ['leading'] })),
      },
    },
    'throttle-debounce@5.0.2': {
      throttle: {
        gap: queues,
        native: () => calls((fn) => throttle(fn, 1, 20)),
        package: ({ throttle: userland }) => calls((fn) => userland(20, fn)),
      },
      'throttle: noTrailing': {
        native: () => calls((fn) => throttle(fn, 1, 20, { overflow: 'drop' })),
        package: ({ throttle: userland }) => calls((fn) => userland(20, fn, { noTrailing: true })),
      },
    },
  },
  lint: {
    banLodashThrottle: {
      eslint: '10.12.0',
      plugin: 'eslint-plugin-depend@1.5.0',
      rule: 'depend/ban-dependencies',
      failed: 'reads only the package name, and the code can need the package for what no native API does; e18e/ban-dependencies, which reports the same hits, had 4 of 12 hits on good code',
      code: "import throttle from 'lodash.throttle';",
    },
  },
};
