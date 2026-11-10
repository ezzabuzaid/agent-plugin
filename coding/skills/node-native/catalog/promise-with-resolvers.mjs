// A deferred: a promise whose resolve and reject are handed out.
const settleLater = async (deferred) => {
  setTimeout(deferred.resolve, 1, 'settled');
  return [Object.keys(deferred).sort(), await deferred.promise];
};

const rejectLater = async (deferred) => {
  setTimeout(deferred.reject, 1, new TypeError('no'));
  return deferred.promise.catch((error) => [error.name, error.message]);
};

export default {
  apis: ['js:Promise.withResolvers'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'p-defer@4.0.1': {
      default: {
        native: () => settleLater(Promise.withResolvers()),
        package: ({ default: pDefer }) => settleLater(pDefer()),
      },
      'default: reject': {
        native: () => rejectLater(Promise.withResolvers()),
        package: ({ default: pDefer }) => rejectLater(pDefer()),
      },
    },
  },
  idioms: {
    deferred: {
      seed: 'new Promise(?:<[^>]*>)?\\(\\s*\\(?\\s*([\\w$]+)\\s*(?:,\\s*[\\w$]+\\s*)?\\)?\\s*=>\\s*\\{\\s*[\\w$.]+\\s*=\\s*\\1\\s*[;,\\n}]',
      native: () => settleLater(Promise.withResolvers()),
      idiom: () => {
        let resolve;
        let reject;
        const promise = new Promise((res, rej) => {
          resolve = res;
          reject = rej;
        });
        return settleLater({ promise, resolve, reject });
      },
    },
  },
  lint: {
    preferPromiseWithResolvers: {
      eslint: '10.12.0',
      plugin: 'eslint-plugin-unicorn@79.0.0',
      rule: 'unicorn/prefer-promise-with-resolvers',
      idiom: 'deferred',
      on: 'modern-node/recommended',
      code: 'let resolve, reject;\nconst promise = new Promise((res, rej) => {\n  resolve = res;\n  reject = rej;\n});',
    },
  },
};
