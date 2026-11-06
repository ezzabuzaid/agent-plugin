// Awaiting events: the next emission as a promise, a stream of emissions as an async iterator.
import { EventEmitter, on, once } from 'node:events';
import { settled } from './support/outcome.mjs';

const message = (error) => error.message;
// Emits after the listener is attached, as a real source would.
const later = (emitter, ...emissions) => {
  setImmediate(() => {
    for (const [name, ...args] of emissions) emitter.emit(name, ...args);
  });
  return emitter;
};
const collect = async (iterator, pick) => {
  const values = [];
  for await (const value of iterator) values.push(pick(value));
  return values;
};

export default {
  apis: ['events:events.once', 'events:events.on'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'p-event@8.0.2': {
      pEvent: {
        native: async () => (await once(later(new EventEmitter(), ['ready', 'v', 2]), 'ready'))[0],
        package: ({ pEvent }) => pEvent(later(new EventEmitter(), ['ready', 'v', 2]), 'ready'),
      },
      'pEvent: multiArgs': {
        native: () => once(later(new EventEmitter(), ['ready', 'v', 2]), 'ready'),
        package: ({ pEvent }) => pEvent(later(new EventEmitter(), ['ready', 'v', 2]), 'ready', { multiArgs: true }),
      },
      'pEvent: error event rejects': {
        native: () => settled(() => once(later(new EventEmitter(), ['error', new Error('bad')]), 'ready'), message),
        package: ({ pEvent }) => settled(() => pEvent(later(new EventEmitter(), ['error', new Error('bad')]), 'ready'), message),
      },
      'pEvent: EventTarget': {
        native: async () => {
          const target = new EventTarget();
          setImmediate(() => target.dispatchEvent(new Event('go')));
          return (await once(target, 'go'))[0].type;
        },
        package: async ({ pEvent }) => {
          const target = new EventTarget();
          setImmediate(() => target.dispatchEvent(new Event('go')));
          return (await pEvent(target, 'go')).type;
        },
      },
      'pEvent: filter': {
        gap: 'no filter: once resolves on the first emission',
        native: async () => (await once(later(new EventEmitter(), ['n', 1], ['n', 2]), 'n'))[0],
        package: ({ pEvent }) => pEvent(later(new EventEmitter(), ['n', 1], ['n', 2]), 'n', (value) => value > 1),
      },
      pEventIterator: {
        native: () => collect(on(later(new EventEmitter(), ['data', 1], ['data', 2], ['end']), 'data', { close: ['end'] }), ([value]) => value),
        package: ({ pEventIterator }) =>
          collect(pEventIterator(later(new EventEmitter(), ['data', 1], ['data', 2], ['end']), 'data', { resolutionEvents: ['end'] }), (value) => value),
      },
    },
  },
};
