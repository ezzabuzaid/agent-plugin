// Loading a .env file into process.env, from code or from the command line.
import { mkdtempDisposable, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { output } from './support/child.mjs';

const keys = ['PROBE_ENV_A', 'PROBE_ENV_B'];

// Writes each file into a fresh directory, runs `use` with their paths, then
// removes the directory and every probe key the run put into process.env.
async function withEnvFiles(files, use) {
  await using dir = await mkdtempDisposable(join(tmpdir(), 'node-native-env-'));
  const paths = await Promise.all(
    files.map(async (content, index) => {
      const path = join(dir.path, `${index}.env`);
      await writeFile(path, content);
      return path;
    }),
  );
  try {
    await use(...paths, join(dir.path, 'missing.env'));
    return Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  } finally {
    for (const key of keys) delete process.env[key];
  }
}

const file = 'PROBE_ENV_A=1\nPROBE_ENV_B="two words"\n';
const second = 'PROBE_ENV_A=second\nPROBE_ENV_B=second\n';
const preset = (value) => {
  process.env.PROBE_ENV_A = value;
};
const print = "process.stdout.write(String(process.env.PROBE_ENV_A) + ' ' + String(process.env.PROBE_ENV_B))";

export default {
  apis: ['process:process.loadEnvFile', 'cli:--env-file', 'cli:--env-file-if-exists'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'dotenv@18.0.9': {
      config: {
        native: () => withEnvFiles([file], (path) => process.loadEnvFile(path)),
        package: ({ default: dotenv }) => withEnvFiles([file], (path) => dotenv.config({ path, quiet: true })),
      },
      'config: variable already set': {
        native: () =>
          withEnvFiles([file], (path) => {
            preset('kept');
            process.loadEnvFile(path);
          }),
        package: ({ default: dotenv }) =>
          withEnvFiles([file], (path) => {
            preset('kept');
            dotenv.config({ path, quiet: true });
          }),
      },
      'config: override': {
        gap: 'never overrides a variable already set; there is no override option',
        native: () =>
          withEnvFiles([file], (path) => {
            preset('kept');
            process.loadEnvFile(path);
          }),
        package: ({ default: dotenv }) =>
          withEnvFiles([file], (path) => {
            preset('kept');
            dotenv.config({ path, override: true, quiet: true });
          }),
      },
      'config: several files': {
        native: () =>
          withEnvFiles([file, second], (first, next) => {
            process.loadEnvFile(first);
            process.loadEnvFile(next);
          }),
        package: ({ default: dotenv }) =>
          withEnvFiles([file, second], (first, next) => dotenv.config({ path: [first, next], quiet: true })),
      },
      'config: missing file': {
        gap: 'throws ENOENT for a missing file; dotenv.config returns { error } and goes on',
        native: async () => {
          try {
            return await withEnvFiles([], (missing) => process.loadEnvFile(missing));
          } catch (error) {
            return `threw ${error.code}`;
          }
        },
        package: ({ default: dotenv }) =>
          withEnvFiles([], (missing) => {
            dotenv.config({ path: missing, quiet: true });
          }),
      },
      'config: --env-file': {
        native: async () => {
          let seen;
          await withEnvFiles([file], async (path) => {
            seen = await output([`--env-file=${path}`, '-e', print]);
          });
          return seen;
        },
        package: async ({ default: dotenv }) => {
          const target = {};
          await withEnvFiles([file], (path) => dotenv.config({ path, processEnv: target, quiet: true }));
          return `${target.PROBE_ENV_A} ${target.PROBE_ENV_B}`;
        },
      },
      'config: --env-file-if-exists and a missing file': {
        native: async () => {
          let seen;
          await withEnvFiles([], async (missing) => {
            seen = await output([`--env-file-if-exists=${missing}`, '-e', print]);
          });
          return seen;
        },
        package: async ({ default: dotenv }) => {
          const target = {};
          await withEnvFiles([], (missing) => dotenv.config({ path: missing, processEnv: target, quiet: true }));
          return `${target.PROBE_ENV_A} ${target.PROBE_ENV_B}`;
        },
      },
    },
  },
  lint: {
    banDotenv: {
      eslint: '10.12.0',
      plugin: 'eslint-plugin-depend@1.5.0',
      rule: 'depend/ban-dependencies',
      code: "import 'dotenv/config';",
    },
  },
};
