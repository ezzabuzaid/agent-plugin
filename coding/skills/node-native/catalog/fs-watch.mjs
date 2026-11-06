// Watch a directory tree for changes.
import { watch as watchPath } from 'node:fs';
import { mkdir, mkdtempDisposable, realpath, watch, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

// Waits until `events` holds an event for `path`, for at most two seconds.
const until = async (events, path) => {
  for (let waited = 0; waited < 2000 && !events.some(([, name]) => name === path); waited += 50) await sleep(50);
};
// Starts `start(dir, events)` on a fresh directory with a `sub` directory, runs `act(dir)`,
// waits for an event about `path`, and returns the events, each [type, path relative to dir].
const observe = async (start, act, path) => {
  await using scratch = await mkdtempDisposable(join(tmpdir(), 'node-native-watch-'));
  const dir = await realpath(scratch.path);
  await mkdir(join(dir, 'sub'));
  const events = [];
  const stop = await start(dir, events);
  try {
    await sleep(200);
    await act(dir);
    await until(events, path);
    return events;
  } finally {
    await stop();
  }
};
const native = (options = {}) => async (dir, events) => {
  const controller = new AbortController();
  const loop = (async () => {
    try {
      for await (const event of watch(dir, { recursive: true, signal: controller.signal, ...options })) {
        events.push([event.eventType, event.filename]);
      }
    } catch (error) {
      if (error.name !== 'AbortError') throw error;
    }
  })();
  return async () => {
    controller.abort();
    await loop;
  };
};
const chokidar = (watcher, options = {}) => async (dir, events) => {
  const watching = watcher.watch(dir, { ignoreInitial: true, ...options });
  watching.on('all', (type, path) => events.push([type, relative(dir, path)]));
  await new Promise((resolve) => watching.once('ready', resolve));
  return () => watching.close();
};
const create = (dir) => writeFile(join(dir, 'sub/a.txt'), 'x');
const createBoth = async (dir) => {
  await writeFile(join(dir, 'sub/a.log'), 'x');
  await writeFile(join(dir, 'sub/b.txt'), 'x');
};
const sees = (path) => (events) => events.some(([, name]) => name === path);
const firstTypeFor = (path) => (events) => events.find(([, name]) => name === path)?.[0];
// Watches a path that does not exist yet, then creates it.
const later = async (start) => {
  await using scratch = await mkdtempDisposable(join(tmpdir(), 'node-native-watch-'));
  const dir = await realpath(scratch.path);
  try {
    const events = [];
    const stop = await start(join(dir, 'later.txt'), events);
    try {
      await sleep(200);
      await writeFile(join(dir, 'later.txt'), 'x');
      for (let waited = 0; waited < 2000 && events.length === 0; waited += 50) await sleep(50);
      return events.map(([type]) => type);
    } finally {
      await stop();
    }
  } catch (error) {
    return `threw ${error.code ?? error.name}`;
  }
};

export default {
  apis: ['fs:fsPromises.watch', 'fs:fs.watch'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'chokidar@6.0.0': {
      watch: {
        native: async () => sees('sub/a.txt')(await observe(native(), create, 'sub/a.txt')),
        package: async ({ default: watcher }) => sees('sub/a.txt')(await observe(chokidar(watcher), create, 'sub/a.txt')),
      },
      'watch: ignored': {
        native: async () => {
          const events = await observe(native({ ignore: '**/*.log' }), createBoth, 'sub/b.txt');
          return [sees('sub/a.log')(events), sees('sub/b.txt')(events)];
        },
        package: async ({ default: watcher }) => {
          const events = await observe(chokidar(watcher, { ignored: (path) => path.endsWith('.log') }), createBoth, 'sub/b.txt');
          return [sees('sub/a.log')(events), sees('sub/b.txt')(events)];
        },
      },
      'watch: event names': {
        gap: "reports a new file as 'rename' (and a change as 'rename' or 'change'); chokidar names it 'add', 'change' or 'unlink'",
        native: async () => firstTypeFor('sub/a.txt')(await observe(native(), create, 'sub/a.txt')),
        package: async ({ default: watcher }) => firstTypeFor('sub/a.txt')(await observe(chokidar(watcher), create, 'sub/a.txt')),
      },
      'watch: path that does not exist yet': {
        gap: 'throws ENOENT for a path that does not exist; chokidar waits for it and reports it when it appears',
        native: () =>
          later((path, events) => {
            const watcher = watchPath(path, (type) => events.push([type]));
            return () => watcher.close();
          }),
        package: ({ default: watcher }) =>
          later(async (path, events) => {
            const watching = watcher.watch(path, { ignoreInitial: true });
            watching.on('all', (type) => events.push([type]));
            await new Promise((resolve) => watching.once('ready', resolve));
            return () => watching.close();
          }),
      },
    },
  },
};
