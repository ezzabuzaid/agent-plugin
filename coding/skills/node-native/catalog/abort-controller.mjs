// Cancel work: an AbortController whose AbortSignal tells listeners to stop.

// What a listener and a reader of the signal see across one abort.
const aborted = (AbortController, ...reason) => {
  const controller = new AbortController();
  const events = [];
  controller.signal.addEventListener('abort', (event) => events.push(event.type));
  const before = controller.signal.aborted;
  controller.abort(...reason);
  return [before, controller.signal.aborted, events, String(controller.signal)];
};
const reasonOf = (AbortController) => {
  const controller = new AbortController();
  controller.abort('stop');
  return controller.signal.reason;
};
const defaultReason = (AbortController) => {
  const controller = new AbortController();
  controller.abort();
  return controller.signal.reason?.name;
};
const thrown = (AbortController) => {
  const controller = new AbortController();
  controller.abort('stop');
  try {
    controller.signal.throwIfAborted();
    return 'did not throw';
  } catch (error) {
    return error;
  }
};
const abortedTwice = (AbortController) => {
  const controller = new AbortController();
  const events = [];
  controller.signal.addEventListener('abort', () => events.push(controller.signal.reason));
  controller.abort('first');
  controller.abort('second');
  return [events, controller.signal.reason];
};
// Whether the global fetch takes the signal: a fresh signal rejects only for
// the refused connection, a foreign one for its type.
const fetchTakes = async (AbortController) => {
  try {
    await fetch('http://127.0.0.1:0/', { signal: new AbortController().signal });
    return 'resolved';
  } catch (error) {
    return error.message.includes('instance of AbortSignal') ? 'refused the signal' : 'took the signal';
  }
};
const statics = (AbortSignal) => [typeof AbortSignal.abort, typeof AbortSignal.timeout, typeof AbortSignal.any];

export default {
  apis: [
    'globals:AbortController',
    'globals:AbortSignal',
    'globals:abortController.abort',
    'globals:abortSignal.throwIfAborted',
    'globals:AbortSignal.abort',
    'js:AbortController',
    'js:AbortSignal.prototype.reason',
  ],
  reviewedAt: 'v26.13.0',
  replaces: {
    'abort-controller@3.0.0': {
      AbortController: {
        native: () => aborted(AbortController),
        package: ({ AbortController }) => aborted(AbortController),
      },
      'AbortController: abort reason': {
        improves: 'AbortController keeps the reason given to abort(reason) on signal.reason; abort-controller predates abort(reason) and loses it: signal.reason stays undefined',
        native: () => reasonOf(AbortController),
        package: ({ AbortController }) => reasonOf(AbortController),
      },
      'AbortController: default reason': {
        gap: 'abort() with no reason gives the signal an AbortError DOMException; abort-controller leaves reason undefined',
        native: () => defaultReason(AbortController),
        package: ({ AbortController }) => defaultReason(AbortController),
      },
      'AbortController: signal passed to fetch': {
        improves: 'the global fetch takes a native AbortSignal and cancels on it; it refuses an abort-controller signal with TypeError, so that signal cannot cancel a fetch',
        native: () => fetchTakes(AbortController),
        package: ({ AbortController }) => fetchTakes(AbortController),
      },
      'AbortSignal: statics': {
        improves: 'the native AbortSignal has abort(), timeout() and any(); the abort-controller AbortSignal has none of them',
        native: () => statics(AbortSignal),
        package: ({ AbortSignal }) => statics(AbortSignal),
      },
    },
    'abortcontroller-polyfill@1.7.8/dist/cjs-ponyfill.js': {
      AbortController: {
        native: () => aborted(AbortController),
        package: ({ AbortController }) => aborted(AbortController),
      },
      'AbortController: abort reason': {
        native: () => reasonOf(AbortController),
        package: ({ AbortController }) => reasonOf(AbortController),
      },
      'AbortController: default reason': {
        native: () => defaultReason(AbortController),
        package: ({ AbortController }) => defaultReason(AbortController),
      },
      'AbortController: throwIfAborted': {
        native: () => thrown(AbortController),
        package: ({ AbortController }) => thrown(AbortController),
      },
      'AbortController: aborted twice': {
        improves: 'a second abort() is a no-op on a native signal, so listeners run once and the first reason stays; the polyfill fires abort again and replaces the reason',
        native: () => abortedTwice(AbortController),
        package: ({ AbortController }) => abortedTwice(AbortController),
      },
      'AbortController: signal passed to fetch': {
        improves: 'the global fetch takes a native AbortSignal and cancels on it; it refuses an abortcontroller-polyfill signal with TypeError, so that signal cannot cancel a fetch',
        native: () => fetchTakes(AbortController),
        package: ({ AbortController }) => fetchTakes(AbortController),
      },
      'AbortSignal: statics': {
        improves: 'the native AbortSignal has abort(), timeout() and any(); the polyfill AbortSignal has timeout() and any() but no abort()',
        native: () => statics(AbortSignal),
        package: ({ AbortSignal }) => statics(AbortSignal),
      },
    },
  },
};
