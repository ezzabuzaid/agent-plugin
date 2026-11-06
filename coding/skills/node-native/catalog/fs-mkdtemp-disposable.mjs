// Create a unique temporary directory, and remove it with its contents at scope exit.
import { existsSync, mkdtempDisposableSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { mkdtemp, mkdtempDisposable, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';

const prefix = () => join(tmpdir(), 'node-native-mkdtemp-');
// Whether the directory existed (with a file written into it) while in use, and whether it is gone after.
const lifecycle = async (use) => {
  let path;
  let inside;
  await use(async (dir) => {
    path = dir;
    inside = await during(dir);
  });
  return [inside, existsSync(path)];
};
const during = async (dir) => {
  await writeFile(join(dir, 'file.txt'), 'x');
  return existsSync(join(dir, 'file.txt'));
};
// The directory also goes away when the body throws.
const afterThrow = async (use) => {
  let path;
  try {
    await use(async (dir) => {
      path = dir;
      throw new Error('body');
    });
  } catch (error) {
    return [error.message, existsSync(path)];
  }
  return 'did not throw';
};
const native = async (body) => {
  await using dir = await mkdtempDisposable(prefix());
  await body(dir.path);
};
const nativeSync = (body) => {
  using dir = mkdtempDisposableSync(prefix());
  return [body(dir.path), dir.path];
};
const syncLifecycle = (use) => {
  const [inside, path] = use((dir) => {
    writeFileSync(join(dir, 'file.txt'), 'x');
    return existsSync(join(dir, 'file.txt'));
  });
  return [inside, existsSync(path)];
};

export default {
  apis: [
    'fs:fsPromises.mkdtempDisposable',
    'fs:fs.mkdtempDisposableSync',
    'fs:fsPromises.mkdtemp',
    'fs:fs.mkdtempSync',
    'fs:fs.realpathSync',
    'os:os.tmpdir',
  ],
  reviewedAt: 'v26.13.0',
  replaces: {
    'tmp@0.2.7': {
      dirSync: {
        native: () => syncLifecycle(nativeSync),
        package: ({ default: tmp }) =>
          syncLifecycle((body) => {
            const dir = tmp.dirSync({ unsafeCleanup: true });
            const inside = body(dir.name);
            dir.removeCallback();
            return [inside, dir.name];
          }),
      },
      'dirSync: prefix': {
        native: () => syncLifecycle((body) => nativeSync((dir) => body(dir) && basename(dir).startsWith('node-native-mkdtemp-'))),
        package: ({ default: tmp }) =>
          syncLifecycle((body) => {
            const dir = tmp.dirSync({ prefix: 'node-native-mkdtemp-', unsafeCleanup: true });
            const inside = body(dir.name) && basename(dir.name).startsWith('node-native-mkdtemp-');
            dir.removeCallback();
            return [inside, dir.name];
          }),
      },
      'dirSync: postfix': {
        gap: 'takes only a prefix; the random part always ends the name',
        native: () => nativeSync((dir) => basename(dir).endsWith('-post'))[0],
        package: ({ default: tmp }) => {
          const dir = tmp.dirSync({ postfix: '-post' });
          rmSync(dir.name, { recursive: true });
          return basename(dir.name).endsWith('-post');
        },
      },
      'dirSync: non-empty without unsafeCleanup': {
        gap: 'disposal removes the directory with its contents; tmp removeCallback throws ENOTEMPTY unless unsafeCleanup is true',
        native: () => syncLifecycle(nativeSync),
        package: ({ default: tmp }) => {
          const dir = tmp.dirSync();
          writeFileSync(join(dir.name, 'file.txt'), 'x');
          try {
            dir.removeCallback();
            return [true, existsSync(dir.name)];
          } catch (error) {
            return `threw ${error.code}`;
          } finally {
            rmSync(dir.name, { recursive: true, force: true });
          }
        },
      },
    },
    'tempy@3.2.0': {
      temporaryDirectoryTask: {
        native: () => lifecycle(native),
        package: ({ temporaryDirectoryTask }) => lifecycle((body) => temporaryDirectoryTask(body)),
      },
      'temporaryDirectoryTask: body throws': {
        native: () => afterThrow(native),
        package: ({ temporaryDirectoryTask }) => afterThrow((body) => temporaryDirectoryTask(body)),
      },
      temporaryDirectory: {
        native: async () => {
          const dir = await mkdtemp(prefix());
          const inside = await during(dir);
          await rm(dir, { recursive: true });
          return inside;
        },
        package: async ({ temporaryDirectory }) => {
          const dir = temporaryDirectory();
          const inside = await during(dir);
          await rm(dir, { recursive: true });
          return inside;
        },
      },
    },
    'temp-dir@3.0.0': {
      default: {
        native: () => realpathSync(tmpdir()),
        package: ({ default: tempDirectory }) => tempDirectory,
      },
    },
  },
  idioms: {
    tryFinallyRm: {
      seed: 'mkdtemp(?:Sync)?\\(',
      native: () => lifecycle(native),
      idiom: () =>
        lifecycle(async (body) => {
          const dir = await mkdtemp(prefix());
          try {
            await body(dir);
          } finally {
            await rm(dir, { recursive: true, force: true });
          }
        }),
    },
  },
  lint: {
    banTempy: {
      eslint: '10.12.0',
      plugin: 'eslint-plugin-depend@1.5.0',
      rule: 'depend/ban-dependencies',
      code: "import { temporaryDirectory } from 'tempy';",
    },
  },
};
