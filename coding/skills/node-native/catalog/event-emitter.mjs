// An in-process event bus: subscribe, emit, unsubscribe.
import { EventEmitter } from 'node:events';

const script = (emitter) => {
  const log = [];
  const listener = (a, b) => log.push(['on', a, b]);
  emitter.on('x', listener);
  emitter.once('x', (a) => log.push(['once', a]));
  const emitted = [emitter.emit('x', 1, 2), emitter.emit('x', 3)];
  emitter.off('x', listener);
  emitted.push(emitter.emit('x', 4));
  return { log, emitted, names: emitter.eventNames(), count: emitter.listenerCount('x') };
};
const unhandledError = (emitter) => {
  try {
    return emitter.emit('error', new Error('boom'));
  } catch (error) {
    return ['threw', error.message];
  }
};
const context = { id: 'context' };
const thisOf = (emitter) => {
  let seen;
  emitter.on(
    'x',
    function () {
      seen = this;
    },
    context,
  );
  emitter.emit('x');
  return seen === context;
};
const mittScript = (bus) => {
  const log = [];
  const handler = (value) => log.push(value);
  bus.on('x', handler);
  bus.emit('x', 1);
  bus.off('x', handler);
  bus.emit('x', 2);
  return log;
};

export default {
  apis: ['events:EventEmitter'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'eventemitter3@5.0.4': {
      default: {
        native: () => script(new EventEmitter()),
        package: ({ default: EventEmitter3 }) => script(new EventEmitter3()),
      },
      'default: unhandled error event': {
        gap: "emitting 'error' with no listener throws natively; eventemitter3 returns false",
        native: () => unhandledError(new EventEmitter()),
        package: ({ default: EventEmitter3 }) => unhandledError(new EventEmitter3()),
      },
      'default: listener context': {
        gap: 'no context argument: a listener runs with the emitter as this',
        native: () => thisOf(new EventEmitter()),
        package: ({ default: EventEmitter3 }) => thisOf(new EventEmitter3()),
      },
    },
    'mitt@3.0.1': {
      default: {
        native: () => mittScript(new EventEmitter()),
        package: ({ default: mitt }) => mittScript(mitt()),
      },
      'default: wildcard handler': {
        gap: "no '*' listener that receives every event",
        native: () => {
          const log = [];
          const emitter = new EventEmitter();
          emitter.on('*', (type, value) => log.push([type, value]));
          emitter.emit('x', 1);
          return log;
        },
        package: ({ default: mitt }) => {
          const log = [];
          const bus = mitt();
          bus.on('*', (type, value) => log.push([type, value]));
          bus.emit('x', 1);
          return log;
        },
      },
    },
  },
};
