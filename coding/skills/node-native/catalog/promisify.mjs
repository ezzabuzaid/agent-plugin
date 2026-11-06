// Turning an error-first callback function into a promise-returning one.
import { promisify } from 'node:util';
import { settled } from './support/outcome.mjs';

const message = (error) => error.message;
const add = (a, b, done) => setImmediate(() => (a < 0 ? done(new Error('negative')) : done(null, a + b, 'extra')));
const counter = {
  value: 5,
  read(done) {
    done(null, this.value);
  },
};
const calls = (promisified) => Promise.all([settled(() => promisified(1, 2), message), settled(() => promisified(-1, 2), message)]);

export default {
  apis: ['util:util.promisify'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'pify@6.1.0': {
      default: {
        native: () => calls(promisify(add)),
        package: ({ default: pify }) => calls(pify(add)),
      },
      'default: method with this': {
        native: () => promisify(counter.read).call(counter),
        package: ({ default: pify }) => pify(counter.read).call(counter),
      },
      'default: multiArgs': {
        gap: 'resolves only the first callback value; there is no multiArgs',
        native: () => promisify(add)(1, 2),
        package: ({ default: pify }) => pify(add, { multiArgs: true })(1, 2),
      },
      'default: whole module': {
        gap: 'promisifies one function, not every method of an object',
        native: () => settled(() => Promise.try(() => promisify({ add }).add(1, 2)), message),
        package: ({ default: pify }) => settled(() => pify({ add }).add(1, 2), message),
      },
      'default: errorFirst false': {
        gap: 'always treats the first callback argument as the error',
        native: () => settled(() => promisify((value, done) => done(value * 2))(2), message),
        package: ({ default: pify }) => settled(() => pify((value, done) => done(value * 2), { errorFirst: false })(2), message),
      },
    },
    'es6-promisify@7.0.0': {
      promisify: {
        native: () => calls(promisify(add)),
        package: ({ promisify: es6 }) => calls(es6(add)),
      },
      'promisify: argumentNames': {
        gap: 'resolves only the first callback value; there is no named-arguments object',
        native: () => promisify(add)(1, 2),
        package: ({ promisify: es6 }) => {
          const named = (a, b, done) => add(a, b, done);
          named[es6.argumentNames] = ['sum', 'extra'];
          return es6(named)(1, 2);
        },
      },
    },
  },
};
