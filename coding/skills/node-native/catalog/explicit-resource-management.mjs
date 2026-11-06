// Release resources at scope exit, in reverse order, even when the body throws.
const resource = (name, log, { failOnClose = false } = {}) => ({
  name,
  close() {
    log.push(`close ${name}`);
    if (failOnClose) throw new Error(`close ${name} failed`);
  },
  [Symbol.dispose]() {
    this.close();
  },
  async [Symbol.asyncDispose]() {
    this.close();
  },
});
const outcome = (run) => {
  const log = [];
  try {
    run(log);
  } catch (error) {
    log.push(`${error.name}: ${error.message}${error.suppressed ? ` / ${error.suppressed.message}` : ''}`);
  }
  return log;
};
const outcomeAsync = async (run) => {
  const log = [];
  try {
    await run(log);
  } catch (error) {
    log.push(`${error.name}: ${error.message}`);
  }
  return log;
};

// The order of 'disposed' and 'settled' when an async function holding a
// resource returns a promise that settles on a later timer.
const returnOrder = async (body) => {
  const log = [];
  const handle = {
    close() {
      log.push('disposed');
    },
    async [Symbol.asyncDispose]() {
      this.close();
    },
  };
  const pending = () =>
    new Promise((resolve) => {
      setTimeout(() => {
        log.push('settled');
        resolve();
      }, 5);
    });
  await body(handle, pending);
  return log;
};

export default {
  apis: [
    'js:syntax:using',
    'js:syntax:await-using',
    'js:Symbol.dispose',
    'js:Symbol.asyncDispose',
    'js:DisposableStack',
    'js:AsyncDisposableStack',
    'js:SuppressedError',
  ],
  reviewedAt: 'v26.13.0',
  idioms: {
    tryFinally: {
      seed: '\\}\\s*finally\\s*\\{\\s*(?:await\\s+)?[\\w$.]+(?:\\.(?:close|dispose|destroy)\\(|\\[Symbol\\.(?:asyncD|d)ispose\\]\\()',
      native: () =>
        outcome((log) => {
          using first = resource('first', log);
          using second = resource('second', log);
          log.push(`use ${first.name} ${second.name}`);
          throw new Error('body');
        }),
      idiom: () =>
        outcome((log) => {
          const first = resource('first', log);
          try {
            const second = resource('second', log);
            try {
              log.push(`use ${first.name} ${second.name}`);
              throw new Error('body');
            } finally {
              second.close();
            }
          } finally {
            first.close();
          }
        }),
    },
    asyncTryFinally: {
      native: () =>
        outcomeAsync(async (log) => {
          await using handle = resource('handle', log);
          log.push(`use ${handle.name}`);
        }),
      idiom: () =>
        outcomeAsync(async (log) => {
          const handle = resource('handle', log);
          try {
            log.push(`use ${handle.name}`);
          } finally {
            await handle[Symbol.asyncDispose]();
          }
        }),
    },
    'tryFinally: returned promise': {
      native: () =>
        returnOrder(async (handle, pending) => {
          await using held = handle;
          return await pending();
        }),
      idiom: () =>
        returnOrder(async (handle, pending) => {
          try {
            return await pending();
          } finally {
            handle.close();
          }
        }),
    },
    'tryFinally: bare return after await using': {
      gap: 'await using disposes at the return statement, so `return promise` (no await) disposes the resource before the promise settles; the try { return await promise } finally version it replaces keeps it open until then: write return await',
      native: () =>
        returnOrder(async (handle, pending) => {
          await using held = handle;
          return pending();
        }),
      idiom: () =>
        returnOrder(async (handle, pending) => {
          try {
            return await pending();
          } finally {
            handle.close();
          }
        }),
    },
    'tryFinally: bare return': {
      native: () =>
        returnOrder(async (handle, pending) => {
          await using held = handle;
          return pending();
        }),
      idiom: () =>
        returnOrder(async (handle, pending) => {
          try {
            return pending();
          } finally {
            handle.close();
          }
        }),
    },
    cleanupList: {
      native: () =>
        outcome((log) => {
          using stack = new DisposableStack();
          for (const name of ['a', 'b', 'c']) stack.use(resource(name, log));
          stack.defer(() => log.push('deferred'));
        }),
      idiom: () =>
        outcome((log) => {
          const cleanups = [];
          try {
            for (const name of ['a', 'b', 'c']) {
              const opened = resource(name, log);
              cleanups.push(() => opened.close());
            }
            cleanups.push(() => log.push('deferred'));
          } finally {
            for (const cleanup of cleanups.reverse()) cleanup();
          }
        }),
    },
    'tryFinally: cleanup throws': {
      improves: "using throws a SuppressedError that keeps both the body's error and the cleanup error; when cleanup throws in a finally block, the body's error is lost",
      native: () =>
        outcome((log) => {
          using handle = resource('handle', log, { failOnClose: true });
          log.push(`use ${handle.name}`);
          throw new Error('body');
        }),
      idiom: () =>
        outcome((log) => {
          const handle = resource('handle', log, { failOnClose: true });
          try {
            log.push(`use ${handle.name}`);
            throw new Error('body');
          } finally {
            handle.close();
          }
        }),
    },
  },
  lint: {
    tryFinally: {
      eslint: '10.12.0',
      plugin: 'eslint-plugin-unicorn@79.0.0',
      rule: 'unicorn/prefer-dispose',
      code: 'const handle = open();\ntry {\n  use(handle);\n} finally {\n  handle.close();\n}',
    },
  },
};
