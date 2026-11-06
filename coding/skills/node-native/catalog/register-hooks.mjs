// Changing the source of modules as require() loads them.
import { createRequire, registerHooks } from 'node:module';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { inScratch } from './support/scratch.mjs';

const tree = {
  'greeting.txt': 'module.exports = "HELLO"',
  'skipped.txt': 'module.exports = "HELLO"',
  'plain.js': 'module.exports = "HELLO"',
};
const shout = (source) => String(source).replace('HELLO', 'hooked');
// require() of each file in the tree, with hooks set up by `hook(dir)`,
// which returns how to remove them.
const loadAll = (hook, files = ['greeting.txt']) =>
  inScratch(tree, (dir) => {
    const remove = hook(dir);
    try {
      const require = createRequire(join(dir, 'index.js'));
      return files.map((file) => require(`./${file}`));
    } finally {
      remove();
    }
  });
// A load hook that rewrites the files `wanted` picks, read as CommonJS.
const nativeHook = (wanted) => () => {
  const hooks = registerHooks({
    load(url, context, nextLoad) {
      if (!wanted(url)) return nextLoad(url, context);
      const loaded = nextLoad(url, { ...context, format: 'commonjs' });
      return { ...loaded, format: 'commonjs', source: shout(loaded.source) };
    },
  });
  return () => hooks.deregister();
};

export default {
  apis: ['module:module.registerHooks'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'pirates@4.0.7': {
      addHook: {
        native: () => loadAll(nativeHook((url) => url.endsWith('.txt'))),
        package: ({ addHook }) => loadAll(() => addHook(shout, { exts: ['.txt'] })),
      },
      'addHook: matcher': {
        native: () =>
          loadAll(
            (dir) => nativeHook((url) => url === pathToFileURL(join(dir, 'greeting.txt')).href)(),
            ['greeting.txt', 'skipped.txt'],
          ),
        package: ({ addHook }) =>
          loadAll(
            () => addHook(shout, { exts: ['.txt'], matcher: (file) => file.endsWith('greeting.txt') }),
            ['greeting.txt', 'skipped.txt'],
          ),
      },
      'addHook: default extension': {
        native: () => loadAll(nativeHook((url) => url.endsWith('.js')), ['plain.js']),
        package: ({ addHook }) => loadAll(() => addHook(shout), ['plain.js']),
      },
      'addHook: revert': {
        native: () =>
          inScratch(tree, (dir) => {
            nativeHook(() => true)()();
            return createRequire(join(dir, 'index.js'))('./plain.js');
          }),
        package: ({ addHook }) =>
          inScratch(tree, (dir) => {
            addHook(shout)();
            return createRequire(join(dir, 'index.js'))('./plain.js');
          }),
      },
    },
  },
};
