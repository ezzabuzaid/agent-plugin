// One signal that aborts when any of several signals aborts, with that signal's reason.
import { outcome } from './support/outcome.mjs';

// The combined signal before and after one of its sources aborts.
const follows = (combine) => {
  const user = new AbortController();
  const other = new AbortController();
  const signal = combine([user.signal, other.signal]);
  const before = signal.aborted;
  other.abort('other');
  user.abort('user');
  return [before, signal.aborted, signal.reason];
};
const alreadyAborted = (combine) => {
  const signal = combine([new AbortController().signal, AbortSignal.abort('early')]);
  return [signal.aborted, signal.reason];
};
const withNothing = (combine) => outcome(() => combine([new AbortController().signal, undefined]).aborted);
const forwardedOnce = (signals) => {
  const controller = new AbortController();
  for (const signal of signals) signal.addEventListener('abort', () => controller.abort(signal.reason));
  return controller.signal;
};

export default {
  apis: ['globals:AbortSignal.any', 'js:AbortSignal.any'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'any-signal@4.2.0': {
      anySignal: {
        native: () => follows(AbortSignal.any),
        package: ({ anySignal }) => follows(anySignal),
      },
      'anySignal: already aborted': {
        native: () => alreadyAborted(AbortSignal.any),
        package: ({ anySignal }) => alreadyAborted(anySignal),
      },
      'anySignal: undefined entry': {
        gap: 'anySignal skips undefined and null entries; AbortSignal.any throws TypeError, so filter optional signals first',
        native: () => withNothing(AbortSignal.any),
        package: ({ anySignal }) => withNothing(anySignal),
      },
    },
  },
  idioms: {
    forwardAbort: {
      seed: 'new AbortController\\(\\)[\\s\\S]{0,400}?\\.addEventListener\\(\\s*[\'"]abort[\'"]\\s*,\\s*(?:\\([^)]*\\)|[\\w$]+)\\s*=>\\s*\\{?\\s*[\\w$.?]+\\.abort\\(',
      native: () => follows(AbortSignal.any),
      // The hand-written merge: a controller that every source signal aborts.
      idiom: () =>
        follows((signals) => {
          const controller = new AbortController();
          for (const signal of signals) {
            if (signal.aborted) {
              controller.abort(signal.reason);
              break;
            }
            signal.addEventListener('abort', () => controller.abort(signal.reason), { once: true });
          }
          return controller.signal;
        }),
    },
    'forwardAbort: already aborted': {
      improves: 'AbortSignal.any starts aborted when a source is already aborted; a forwarding listener never fires for that source, so the merged signal stays live',
      native: () => alreadyAborted(AbortSignal.any),
      idiom: () => alreadyAborted(forwardedOnce),
    },
  },
  lint: {
    forwardAbort: {
      eslint: '10.12.0',
      plugin: 'eslint-plugin-unicorn@79.0.0',
      rule: 'unicorn/prefer-abort-signal-any',
      code: 'export function merge(userSignal, timeoutSignal) { const controller = new AbortController(); userSignal.addEventListener("abort", () => controller.abort()); timeoutSignal.addEventListener("abort", () => controller.abort()); return controller.signal; }',
    },
  },
};
