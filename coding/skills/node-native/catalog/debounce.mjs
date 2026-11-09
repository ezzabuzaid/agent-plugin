// Debouncing: run a function once calls have stopped for a while.
import { setTimeout as sleep } from 'node:timers/promises';
import { debounce } from 'node:util';

// Calls the debounced function with 1, 2, 3 in one tick, then lets `act`
// flush or cancel it, waits past the delay, and returns what reached `fn`.
const calls = async (make, act = () => {}) => {
  const log = [];
  const debounced = make((value) => {
    log.push(value);
    return value * 10;
  });
  const returned = [1, 2, 3].map((value) => debounced(value));
  const settled = Promise.allSettled(returned);
  act(debounced);
  await sleep(80);
  await settled;
  return log;
};
// What each call's promise settles with.
const results = async (make) => {
  const debounced = make((value) => value * 10);
  return Promise.all([1, 2, 3].map((value) => debounced(value)));
};
const native = (options) => (fn) => debounce(fn, 20, options);
const flush = (debounced) => debounced.flush();

const leadingOnly = 'no leading-only mode: with leading, a later call in the window still runs on the trailing edge';

// lodash and lodash-es export the same debounce; `lodash` reads it from the module.
const lodashRows = (lodash) => ({
  debounce: {
    native: () => calls(native()),
    package: (module) => calls((fn) => lodash(module).debounce(fn, 20)),
  },
  'debounce: leading': {
    native: () => calls(native({ leading: true })),
    package: (module) => calls((fn) => lodash(module).debounce(fn, 20, { leading: true })),
  },
  'debounce: flush': {
    native: () => calls((fn) => debounce(fn, 1000), flush),
    package: (module) => calls((fn) => lodash(module).debounce(fn, 1000), flush),
  },
  'debounce: trailing false': {
    gap: leadingOnly,
    native: () => calls(native({ leading: true })),
    package: (module) => calls((fn) => lodash(module).debounce(fn, 20, { leading: true, trailing: false })),
  },
});

export default {
  apis: ['util:util.debounce'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'lodash.debounce@4.0.8': {
      default: {
        native: () => calls(native()),
        package: ({ default: lodashDebounce }) => calls((fn) => lodashDebounce(fn, 20)),
      },
      'default: leading': {
        native: () => calls(native({ leading: true })),
        package: ({ default: lodashDebounce }) => calls((fn) => lodashDebounce(fn, 20, { leading: true })),
      },
      'default: flush': {
        native: () => calls((fn) => debounce(fn, 1000), flush),
        package: ({ default: lodashDebounce }) => calls((fn) => lodashDebounce(fn, 1000), flush),
      },
      'default: cancel': {
        native: () => calls(native(), (debounced) => debounced.cancel()),
        package: ({ default: lodashDebounce }) => calls((fn) => lodashDebounce(fn, 20), (debounced) => debounced.cancel()),
      },
      'default: trailing false': {
        gap: leadingOnly,
        native: () => calls(native({ leading: true })),
        package: ({ default: lodashDebounce }) => calls((fn) => lodashDebounce(fn, 20, { leading: true, trailing: false })),
      },
      'default: maxWait': {
        gap: 'no maxWait: calls that keep coming postpone fn indefinitely',
        native: async () => {
          const log = [];
          const debounced = debounce((value) => log.push(value), 30);
          for (let value = 0; value < 10; value++) {
            void debounced(value);
            await sleep(10);
          }
          await sleep(60);
          return log;
        },
        package: async ({ default: lodashDebounce }) => {
          const log = [];
          const debounced = lodashDebounce((value) => log.push(value), 30, { maxWait: 50 });
          for (let value = 0; value < 10; value++) {
            debounced(value);
            await sleep(10);
          }
          await sleep(60);
          return log;
        },
      },
      'default: return value': {
        gap: 'returns a promise of the result, not the previous result synchronously',
        native: () => {
          const debounced = debounce((value) => value, 1000);
          const returned = debounced(1);
          debounced.cancel();
          return returned.catch(() => typeof returned);
        },
        package: ({ default: lodashDebounce }) => {
          const debounced = lodashDebounce((value) => value, 1000);
          const returned = debounced(1);
          debounced.cancel();
          return typeof returned;
        },
      },
    },
    'lodash@4.18.1': lodashRows(({ default: _ }) => _),
    'lodash-es@4.18.1': lodashRows((lodashEs) => lodashEs),
    'es-toolkit@1.53.1': {
      debounce: {
        native: () => calls(native()),
        package: ({ debounce: toolkit }) => calls((fn) => toolkit(fn, 20)),
      },
      'debounce: leading and trailing edges': {
        native: () => calls(native({ leading: true })),
        package: ({ debounce: toolkit }) => calls((fn) => toolkit(fn, 20, { edges: ['leading', 'trailing'] })),
      },
      'debounce: flush': {
        native: () => calls((fn) => debounce(fn, 1000), flush),
        package: ({ debounce: toolkit }) => calls((fn) => toolkit(fn, 1000), flush),
      },
      'debounce: cancel': {
        native: () => calls(native(), (debounced) => debounced.cancel()),
        package: ({ debounce: toolkit }) => calls((fn) => toolkit(fn, 20), (debounced) => debounced.cancel()),
      },
      'debounce: leading edge only': {
        gap: leadingOnly,
        native: () => calls(native({ leading: true })),
        package: ({ debounce: toolkit }) => calls((fn) => toolkit(fn, 20, { edges: ['leading'] })),
      },
    },
    'debounce@3.0.0': {
      default: {
        native: () => calls(native()),
        package: ({ default: userland }) => calls((fn) => userland(fn, 20)),
      },
      'default: flush': {
        native: () => calls((fn) => debounce(fn, 1000), flush),
        package: ({ default: userland }) => calls((fn) => userland(fn, 1000), flush),
      },
      'default: clear': {
        native: () => calls(native(), (debounced) => debounced.cancel()),
        package: ({ default: userland }) => calls((fn) => userland(fn, 20), (debounced) => debounced.clear()),
      },
      'default: immediate': {
        gap: leadingOnly,
        native: () => calls(native({ leading: true })),
        package: ({ default: userland }) => calls((fn) => userland(fn, 20, { immediate: true })),
      },
    },
    'p-debounce@6.0.0': {
      default: {
        native: async () => [await calls(native()), await results(native())],
        package: async ({ default: pDebounce }) => [await calls((fn) => pDebounce(fn, 20)), await results((fn) => pDebounce(fn, 20))],
      },
      'default: before': {
        gap: leadingOnly,
        native: () => calls(native({ leading: true })),
        package: ({ default: pDebounce }) => calls((fn) => pDebounce(fn, 20, { before: true })),
      },
    },
    'throttle-debounce@5.0.2': {
      debounce: {
        native: () => calls(native()),
        package: ({ debounce: userland }) => calls((fn) => userland(20, fn)),
      },
      'debounce: atBegin': {
        gap: leadingOnly,
        native: () => calls(native({ leading: true })),
        package: ({ debounce: userland }) => calls((fn) => userland(20, fn, { atBegin: true })),
      },
    },
  },
  lint: {
    banLodashDebounce: {
      eslint: '10.12.0',
      plugin: 'eslint-plugin-depend@1.5.0',
      rule: 'depend/ban-dependencies',
      failed: 'reads only the package name, and the code can need the package for what no native API does; e18e/ban-dependencies, which reports the same hits, had 4 of 12 hits on good code',
      code: "import debounce from 'lodash.debounce';",
    },
  },
};
