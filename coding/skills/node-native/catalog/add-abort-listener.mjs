// Running a callback once when an AbortSignal aborts.
import { addAbortListener } from 'node:events';

const run = (listen) => {
  const controller = new AbortController();
  const log = [];
  listen(controller.signal, () => log.push(controller.signal.reason));
  controller.abort('stop');
  controller.signal.dispatchEvent(new Event('abort'));
  return log;
};

export default {
  apis: ['events:events.addAbortListener'],
  reviewedAt: 'v26.13.0',
  idioms: {
    abortEventListener: {
      seed: "addEventListener\\(\\s*['\"]abort['\"]",
      native: () => run((signal, listener) => addAbortListener(signal, listener)),
      idiom: () => run((signal, listener) => signal.addEventListener('abort', listener, { once: true })),
    },
    'abortEventListener: stopImmediatePropagation': {
      gap: 'an earlier abort listener that calls stopImmediatePropagation() silences an addEventListener listener, not an addAbortListener one',
      native: () =>
        run((signal, listener) => {
          signal.addEventListener('abort', (event) => event.stopImmediatePropagation());
          addAbortListener(signal, listener);
        }),
      idiom: () =>
        run((signal, listener) => {
          signal.addEventListener('abort', (event) => event.stopImmediatePropagation());
          signal.addEventListener('abort', listener, { once: true });
        }),
    },
  },
};
