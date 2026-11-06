// Start a promise chain from a function that may throw synchronously.
const add = (a, b) => a + b;
const boom = () => {
  throw new TypeError('sync');
};
const order = async (start) => {
  const seen = [];
  const pending = start(() => seen.push('fn'));
  seen.push('after');
  await pending;
  return seen;
};

export default {
  apis: ['js:Promise.try'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'p-try@3.0.0': {
      default: {
        native: () => Promise.try(add, 1, 2),
        package: ({ default: pTry }) => pTry(add, 1, 2),
      },
      'default: synchronous throw': {
        native: () => Promise.try(boom).catch((error) => error.name),
        package: ({ default: pTry }) => pTry(boom).catch((error) => error.name),
      },
      'default: runs the function now': {
        native: () => order((fn) => Promise.try(fn)),
        package: ({ default: pTry }) => order((fn) => pTry(fn)),
      },
    },
  },
  idioms: {
    resolveWrapper: {
      seed: 'new Promise\\(\\(?resolve\\)? => resolve\\(',
      native: () => order((fn) => Promise.try(fn)),
      idiom: () => order((fn) => new Promise((resolve) => resolve(fn()))),
    },
    resolveThen: {
      seed: 'Promise\\.resolve\\(\\)\\.then\\(',
      gap: 'Promise.resolve().then(fn) runs fn on a later microtask; Promise.try runs it at once',
      native: () => order((fn) => Promise.try(fn)),
      idiom: () => order((fn) => Promise.resolve().then(fn)),
    },
  },
  lint: {
    preferPromiseTry: {
      eslint: '10.12.0',
      plugin: 'eslint-plugin-unicorn@79.0.0',
      rule: 'unicorn/prefer-promise-try',
      code: 'const pending = new Promise((resolve) => resolve(work()));',
    },
  },
};
