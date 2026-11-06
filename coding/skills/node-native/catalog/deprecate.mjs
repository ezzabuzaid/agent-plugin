// Marking a function deprecated: it still works and warns once.
import { setImmediate } from 'node:timers/promises';
import { deprecate } from 'node:util';

// Calls the wrapped function twice and returns its results and the messages
// warned through `event` on process ('warning' natively, 'deprecation' for depd).
const observe = async (event, wrap) => {
  const messages = [];
  const listener = (warning) => messages.push(warning.message);
  process.on(event, listener);
  try {
    const wrapped = wrap((value) => value * 2);
    const results = [wrapped(1), wrapped(2)];
    await setImmediate();
    return { results, messages };
  } finally {
    process.off(event, listener);
  }
};

export default {
  apis: ['util:util.deprecate'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'depd@2.0.0': {
      'default: function': {
        native: () => observe('warning', (fn) => deprecate(fn, 'double() is deprecated')),
        package: ({ default: depd }) => observe('deprecation', (fn) => depd('probe').function(fn, 'double() is deprecated')),
      },
    },
    'util-deprecate@1.0.2': {
      default: {
        native: () => observe('warning', (fn) => deprecate(fn, 'triple() is deprecated')),
        package: ({ default: utilDeprecate }) => observe('warning', (fn) => utilDeprecate(fn, 'triple() is deprecated')),
      },
    },
  },
};
