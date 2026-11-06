// Request-scoped context that follows async work: callbacks, timers, promises
// and await, without passing it through every call.
import { AsyncLocalStorage, AsyncResource } from 'node:async_hooks';
import { EventEmitter } from 'node:events';
import { setTimeout as sleep } from 'node:timers/promises';

const storage = new AsyncLocalStorage();
const user = () => storage.getStore()?.user;

// One namespace per package: both keep their namespaces on process.namespaces.
// A namespace's context keeps its own `id`, so the probes store `user`.
const namespaceOf = (cls, name) => cls.getNamespace(name) ?? cls.createNamespace(name);

// What a callback scheduled with `schedule` reads once it runs.
const later = (schedule, read) => new Promise((resolve) => schedule(() => resolve(read())));

// The rows one context-propagation case needs, for each package.
function propagation(name) {
  const inRun = (cls, body) => {
    const ns = namespaceOf(cls, name);
    return ns.runAndReturn(() => {
      ns.set('user', 1);
      return body(ns);
    });
  };
  return {
    createNamespace: {
      native: () => storage.run({ user: 1 }, user),
      package: ({ default: cls }) => inRun(cls, (ns) => ns.get('user')),
    },
    'createNamespace: setTimeout': {
      native: () => storage.run({ user: 1 }, () => later((done) => setTimeout(done, 1), user)),
      package: ({ default: cls }) => inRun(cls, (ns) => later((done) => setTimeout(done, 1), () => ns.get('user'))),
    },
    'createNamespace: await': {
      native: () =>
        storage.run({ user: 1 }, async () => {
          await sleep(1);
          return user();
        }),
      package: ({ default: cls }) =>
        inRun(cls, async (ns) => {
          await sleep(1);
          return ns.get('user');
        }),
    },
    'createNamespace: outside run': {
      native: () => {
        storage.run({ user: 1 }, () => {});
        return user();
      },
      package: ({ default: cls }) => {
        inRun(cls, () => {});
        return namespaceOf(cls, name).get('user');
      },
    },
    // A nested run inherits through the prototype in cls; natively the inner
    // store spreads the outer one.
    'createNamespace: nested run': {
      native: () =>
        storage.run({ user: 1 }, () => {
          const inner = storage.run({ ...storage.getStore(), role: 'admin' }, () => storage.getStore());
          return [inner.user, inner.role, storage.getStore().role];
        }),
      package: ({ default: cls }) =>
        inRun(cls, (ns) => {
          const inner = ns.runAndReturn(() => {
            ns.set('role', 'admin');
            return { user: ns.get('user'), role: ns.get('role') };
          });
          return [inner.user, inner.role, ns.get('role')];
        }),
    },
    'createNamespace: bind': {
      native: () => storage.run({ user: 1 }, () => AsyncLocalStorage.bind(user))(),
      package: ({ default: cls }) => inRun(cls, (ns) => ns.bind(() => ns.get('user')))(),
    },
    'createNamespace: bind snapshot': {
      native: () => storage.run({ user: 1 }, () => AsyncLocalStorage.snapshot())(user),
      package: ({ default: cls }) => inRun(cls, (ns) => ns.bind((read) => read()))(() => namespaceOf(cls, name).get('user')),
    },
  };
}

// A listener added inside the context, called by an emit outside it.
const emittedOutside = (bind, read) => {
  const emitter = new EventEmitter();
  let seen;
  bind(emitter, (listener) => emitter.on('event', listener), () => (seen = read()));
  emitter.emit('event');
  return seen;
};

export default {
  apis: [
    'async_context:AsyncLocalStorage',
    'async_context:new AsyncLocalStorage',
    'async_context:asyncLocalStorage.run',
    'async_context:asyncLocalStorage.getStore',
    'async_context:asyncLocalStorage.withScope',
    'async_context:AsyncLocalStorage.bind',
    'async_context:AsyncLocalStorage.snapshot',
    'async_context:AsyncResource.bind',
  ],
  reviewedAt: 'v26.13.0',
  replaces: {
    'cls-hooked@4.2.2': {
      ...propagation('probe-cls-hooked'),
      'createNamespace: runPromise': {
        native: () =>
          storage.run({ user: 1 }, async () => {
            await sleep(1);
            return user();
          }),
        package: ({ default: cls }) => {
          const ns = namespaceOf(cls, 'probe-cls-hooked');
          return ns.runPromise(async () => {
            ns.set('user', 1);
            await sleep(1);
            return ns.get('user');
          });
        },
      },
      'createNamespace: bindEmitter': {
        native: () =>
          storage.run({ user: 1 }, () =>
            emittedOutside((emitter, on, listener) => on(AsyncResource.bind(listener)), user),
          ),
        package: ({ default: cls }) => {
          const ns = namespaceOf(cls, 'probe-cls-hooked');
          return ns.runAndReturn(() => {
            ns.set('user', 1);
            return emittedOutside((emitter, on, listener) => {
              ns.bindEmitter(emitter);
              on(listener);
            }, () => ns.get('user'));
          });
        },
      },
      'createNamespace: enter and exit': {
        native: () => {
          let inside;
          {
            using _scope = storage.withScope({ user: 1 });
            inside = user();
          }
          return [inside, user()];
        },
        package: ({ default: cls }) => {
          const ns = namespaceOf(cls, 'probe-cls-hooked');
          const context = ns.createContext();
          ns.enter(context);
          ns.set('user', 1);
          const inside = ns.get('user');
          ns.exit(context);
          return [inside, ns.get('user')];
        },
      },
      'createNamespace: error context': {
        gap: "a thrown error does not carry the store; cls attaches the context to it (error['error@context'])",
        native: () => {
          try {
            storage.run({ user: 1 }, () => {
              throw new Error('failed');
            });
          } catch (error) {
            return error['error@context']?.user;
          }
        },
        package: ({ default: cls }) => {
          const ns = namespaceOf(cls, 'probe-cls-hooked');
          try {
            ns.run(() => {
              ns.set('user', 1);
              throw new Error('failed');
            });
          } catch (error) {
            return error['error@context']?.user;
          }
        },
      },
      getNamespace: {
        gap: 'no registry by name: code that needs the store imports the AsyncLocalStorage instance; cls finds a namespace with getNamespace(name)',
        native: () => storage.run({ user: 1 }, () => new AsyncLocalStorage({ name: 'probe-cls-hooked' }).getStore()?.user),
        package: ({ default: cls }) => {
          const ns = namespaceOf(cls, 'probe-cls-hooked');
          return ns.runAndReturn(() => {
            ns.set('user', 1);
            return cls.getNamespace('probe-cls-hooked').get('user');
          });
        },
      },
    },
    'continuation-local-storage@3.2.1': (() => {
      const rows = propagation('probe-continuation-local-storage');
      return {
        createNamespace: rows.createNamespace,
        'createNamespace: outside run': rows['createNamespace: outside run'],
        'createNamespace: nested run': rows['createNamespace: nested run'],
        'createNamespace: bind': rows['createNamespace: bind'],
        'createNamespace: bind snapshot': rows['createNamespace: bind snapshot'],
        'createNamespace: setTimeout': rows['createNamespace: setTimeout'],
        'createNamespace: await': {
          improves: 'AsyncLocalStorage keeps the context across await; continuation-local-storage loses it after an await',
          ...rows['createNamespace: await'],
        },
      };
    })(),
  },
};
