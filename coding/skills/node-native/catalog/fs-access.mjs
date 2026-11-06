// Whether a path exists.
import { accessSync, exists, existsSync } from 'node:fs';
import { access, mkdtempDisposable, realpath, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Runs `check(path)` on a file, a directory, a missing path and a symlink to a missing path.
const checks = async (check) => {
  await using scratch = await mkdtempDisposable(join(tmpdir(), 'node-native-access-'));
  const dir = await realpath(scratch.path);
  await writeFile(join(dir, 'file'), '');
  await symlink(join(dir, 'missing'), join(dir, 'dangling'));
  return [await check(join(dir, 'file')), await check(dir), await check(join(dir, 'missing')), await check(join(dir, 'dangling'))];
};
const accessible = (path) => access(path).then(
  () => true,
  () => false,
);
const accessibleSync = (path) => {
  try {
    accessSync(path);
    return true;
  } catch {
    return false;
  }
};

export default {
  apis: ['fs:fsPromises.access', 'fs:fs.accessSync', 'fs:fs.existsSync'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'path-exists@5.0.0': {
      pathExists: {
        native: () => checks(accessible),
        package: ({ pathExists }) => checks(pathExists),
      },
      pathExistsSync: {
        native: () => checks(existsSync),
        package: ({ pathExistsSync }) => checks(pathExistsSync),
      },
    },
    'fs-extra@11.4.1': {
      pathExists: {
        native: () => checks(accessible),
        package: ({ default: fse }) => checks(fse.pathExists),
      },
      pathExistsSync: {
        native: () => checks(accessibleSync),
        package: ({ default: fse }) => checks(fse.pathExistsSync),
      },
    },
  },
  idioms: {
    existsCallback: {
      seed: '(?:\\bfs\\.|(?<![\\w$.]))exists\\(\\s*[^,()]+,\\s*(?:[\\w$]+\\s*\\)|\\(|function\\b|async\\b|[\\w$]+\\s*=>)',
      native: () => checks(accessible),
      idiom: () => checks((path) => new Promise((resolve) => exists(path, resolve))),
    },
  },
  lint: {
    banPathExists: {
      eslint: '10.12.0',
      plugin: 'eslint-plugin-depend@1.5.0',
      rule: 'depend/ban-dependencies',
      code: "import { pathExists } from 'path-exists';",
    },
    deprecatedExists: {
      eslint: '10.12.0',
      plugin: 'eslint-plugin-n@18.5.0',
      rule: 'n/no-deprecated-api',
      code: "import fs from 'node:fs';\nfs.exists('a', (ok) => {});",
    },
  },
};
