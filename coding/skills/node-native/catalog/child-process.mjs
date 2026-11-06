// Running a program as a child process and collecting its output and exit status.
import { execFile, execFileSync, spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { mkdir, mkdtempDisposable, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createInterface } from 'node:readline';
import { text } from 'node:stream/consumers';
import { setTimeout as delay } from 'node:timers/promises';
import { promisify } from 'node:util';

// Every probe runs this Node binary, never a shell or another program.
const node = process.execPath;
const both = "process.stdout.write('out\\n'); process.stderr.write('err\\n')";
// Output without a final newline, which nano-spawn strips.
const bare = "process.stdout.write('out'); process.stderr.write('err')";
const sortLines = "let s = ''; process.stdin.on('data', (d) => (s += d)).on('end', () => process.stdout.write(s.split('\\n').sort().join('\\n')))";
// A child that ignores SIGTERM and writes `ready` once its handler is in place.
const stubborn = "process.on('SIGTERM', () => {}); process.stdout.write('ready'); setInterval(() => {}, 1000)";
// How `exited` settles within `ms`, or 'still running'.
const within = (exited, ms) => Promise.race([exited, delay(ms, 'still running')]);
const run = promisify(execFile);
const output = ({ stdout, stderr }) => ({ stdout, stderr });
const exitCode = (promise, read) =>
  promise.then(
    () => 'resolved',
    (error) => read(error),
  );

// A directory whose node_modules/.bin holds `probe-node`, a link to this Node.
async function withLocalBin(use) {
  await using dir = await mkdtempDisposable(join(tmpdir(), 'node-native-bin-'));
  await mkdir(join(dir.path, 'node_modules', '.bin'), { recursive: true });
  await symlink(node, join(dir.path, 'node_modules', '.bin', 'probe-node'));
  return await use(dir.path);
}

async function spawned(child, input) {
  if (input !== undefined) child.stdin.end(input);
  const [stdout] = await Promise.all([text(child.stdout), once(child, 'close')]);
  return stdout;
}

export default {
  apis: [
    'child_process:child_process.execFile',
    'child_process:child_process.execFileSync',
    'child_process:child_process.spawn',
    'child_process:child_process.spawnSync',
    'readline:readline.createInterface',
  ],
  reviewedAt: 'v26.13.0',
  replaces: {
    'execa@10.2.1': {
      execa: {
        native: async () => output(await run(node, ['-e', both])),
        package: async ({ execa }) => output(await execa(node, ['-e', both], { stripFinalNewline: false })),
      },
      'execa: final newline': {
        gap: 'keeps the final newline of stdout and stderr; execa strips it by default',
        native: async () => output(await run(node, ['-e', both])),
        package: async ({ execa }) => output(await execa(node, ['-e', both])),
      },
      'execa: exit code': {
        native: () => exitCode(run(node, ['-e', 'process.exit(3)']), (error) => error.code),
        package: ({ execa }) => exitCode(execa(node, ['-e', 'process.exit(3)']), (error) => error.exitCode),
      },
      'execa: timeout': {
        native: () =>
          exitCode(run(node, ['-e', 'setTimeout(() => {}, 5000)'], { timeout: 100 }), (error) => [error.killed, error.signal]),
        package: ({ execa }) =>
          exitCode(execa(node, ['-e', 'setTimeout(() => {}, 5000)'], { timeout: 100 }), (error) => [error.timedOut, error.signal]),
      },
      'execa: input': {
        native: () => spawned(spawn(node, ['-e', 'process.stdin.pipe(process.stdout)']), 'hi'),
        package: async ({ execa }) =>
          (await execa(node, ['-e', 'process.stdin.pipe(process.stdout)'], { input: 'hi', stripFinalNewline: false })).stdout,
      },
      'execa: all': {
        gap: 'no interleaved stdout and stderr: the result has no `all`',
        native: async () => (await run(node, ['-e', both])).all,
        package: async ({ execa }) => (await execa(node, ['-e', both], { all: true })).all,
      },
      'execa: preferLocal': {
        gap: 'does not look in node_modules/.bin: a local binary needs its full path',
        native: () =>
          withLocalBin((cwd) => run('probe-node', ['-e', 'console.log(7)'], { cwd }).then(output, (error) => `threw ${error.code}`)),
        package: ({ execa }) =>
          withLocalBin(async (cwd) => (await execa('probe-node', ['-e', 'console.log(7)'], { cwd, preferLocal: true })).stdout),
      },
      'execa: env': {
        gap: 'the env option replaces process.env; execa merges it into process.env (extendEnv defaults to true)',
        native: async () => (await run(node, ['-e', 'process.stdout.write(String("PATH" in process.env))'], { env: { X: '1' } })).stdout,
        package: async ({ execa }) =>
          (await execa(node, ['-e', 'process.stdout.write(String("PATH" in process.env))'], { env: { X: '1' } })).stdout,
      },
      'execa: forceKillAfterDelay': {
        gap: 'kill() sends SIGTERM only, so a child that ignores it keeps running; execa\'s kill() sends SIGKILL forceKillAfterDelay ms later (5000 by default)',
        native: async () => {
          const child = spawn(node, ['-e', stubborn]);
          const exited = once(child, 'exit').then(([, signal]) => signal);
          try {
            await once(child.stdout, 'data');
            child.kill();
            return await within(exited, 1000);
          } finally {
            child.kill('SIGKILL');
            await exited;
          }
        },
        package: async ({ execa }) => {
          const subprocess = execa(node, ['-e', stubborn], { forceKillAfterDelay: 200 });
          const exited = subprocess.then(
            () => null,
            (error) => error.signal,
          );
          try {
            await once(subprocess.stdout, 'data');
            subprocess.kill();
            // Settles at the SIGKILL, 200 ms in; the long cap only keeps a
            // loaded machine from reading a late SIGKILL as 'still running'.
            return await within(exited, 10_000);
          } finally {
            subprocess.kill('SIGKILL');
            await exited;
          }
        },
      },
      $: {
        native: async () => (await run(node, ['-e', 'console.log(1 + 1)'])).stdout,
        package: async ({ $ }) => (await $({ stripFinalNewline: false })`${node} -e ${'console.log(1 + 1)'}`).stdout,
      },
      execaSync: {
        native: () => execFileSync(node, ['-e', 'console.log(5)'], { encoding: 'utf8' }),
        package: ({ execaSync }) => execaSync(node, ['-e', 'console.log(5)'], { stripFinalNewline: false }).stdout,
      },
    },
    'cross-spawn@7.0.6': {
      default: {
        native: () => spawned(spawn(node, ['-e', 'console.log(5)'])),
        package: ({ default: crossSpawn }) => spawned(crossSpawn(node, ['-e', 'console.log(5)'])),
      },
      sync: {
        native: () => spawnSync(node, ['-e', 'console.log(5)'], { encoding: 'utf8' }).stdout,
        package: ({ default: crossSpawn }) => crossSpawn.sync(node, ['-e', 'console.log(5)'], { encoding: 'utf8' }).stdout,
      },
    },
    'nano-spawn@2.1.0': {
      default: {
        native: async () => output(await run(node, ['-e', bare])),
        package: async ({ default: nanoSpawn }) => output(await nanoSpawn(node, ['-e', bare])),
      },
      'default: final newline': {
        gap: 'keeps the final newline of stdout and stderr; nano-spawn always strips it',
        native: async () => output(await run(node, ['-e', both])),
        package: async ({ default: nanoSpawn }) => output(await nanoSpawn(node, ['-e', both])),
      },
      'default: exit code': {
        native: () => exitCode(run(node, ['-e', 'process.exit(3)']), (error) => error.code),
        package: ({ default: nanoSpawn }) => exitCode(nanoSpawn(node, ['-e', 'process.exit(3)']), (error) => error.exitCode),
      },
      'default: error shape': {
        gap: 'the error of a failed child carries the exit status as `code`; nano-spawn names it `exitCode` and adds `output`, `command` and `durationMs`',
        native: () => exitCode(run(node, ['-e', 'process.exit(3)']), (error) => [error.code, error.exitCode, typeof error.command]),
        package: ({ default: nanoSpawn }) =>
          exitCode(nanoSpawn(node, ['-e', 'process.exit(3)']), (error) => [error.code, error.exitCode, typeof error.command]),
      },
      'default: timeout': {
        native: () => exitCode(run(node, ['-e', 'setTimeout(() => {}, 5000)'], { timeout: 100 }), (error) => error.signal),
        package: ({ default: nanoSpawn }) =>
          exitCode(nanoSpawn(node, ['-e', 'setTimeout(() => {}, 5000)'], { timeout: 100 }), (error) => error.signalName),
      },
      'default: stdin string': {
        native: () => spawned(spawn(node, ['-e', 'process.stdin.pipe(process.stdout)']), 'hi'),
        package: async ({ default: nanoSpawn }) =>
          (await nanoSpawn(node, ['-e', 'process.stdin.pipe(process.stdout)'], { stdin: { string: 'hi' } })).stdout,
      },
      'default: stdout lines': {
        native: () => Array.fromAsync(createInterface({ input: spawn(node, ['-e', "console.log('a\\nb')"]).stdout })),
        package: ({ default: nanoSpawn }) => Array.fromAsync(nanoSpawn(node, ['-e', "console.log('a\\nb')"]).stdout),
      },
      'default: stdout lines without readline': {
        gap: 'a child\'s stdout yields Buffer chunks, not lines; nano-spawn\'s subprocess.stdout yields one string per line',
        native: async () => (await Array.fromAsync(spawn(node, ['-e', "console.log('a\\nb')"]).stdout)).map(String),
        package: ({ default: nanoSpawn }) => Array.fromAsync(nanoSpawn(node, ['-e', "console.log('a\\nb')"]).stdout),
      },
      'default: pipe': {
        native: () => {
          const first = spawn(node, ['-e', "process.stdout.write('b\\na')"]);
          const second = spawn(node, ['-e', sortLines]);
          first.stdout.pipe(second.stdin);
          return spawned(second);
        },
        package: async ({ default: nanoSpawn }) =>
          (await nanoSpawn(node, ['-e', "process.stdout.write('b\\na')"]).pipe(node, ['-e', sortLines])).stdout,
      },
      'default: output': {
        gap: 'no interleaved stdout and stderr: the result has no `output`',
        native: async () => (await run(node, ['-e', bare])).output,
        package: async ({ default: nanoSpawn }) => (await nanoSpawn(node, ['-e', bare])).output,
      },
      'default: env': {
        gap: 'the env option replaces process.env; nano-spawn merges it into process.env',
        native: async () => (await run(node, ['-e', 'process.stdout.write(String("PATH" in process.env))'], { env: { X: '1' } })).stdout,
        package: async ({ default: nanoSpawn }) =>
          (await nanoSpawn(node, ['-e', 'process.stdout.write(String("PATH" in process.env))'], { env: { X: '1' } })).stdout,
      },
      'default: preferLocal': {
        gap: 'does not look in node_modules/.bin: a local binary needs its full path',
        native: () =>
          withLocalBin((cwd) => run('probe-node', ['-e', 'console.log(7)'], { cwd }).then(output, (error) => `threw ${error.code}`)),
        package: ({ default: nanoSpawn }) =>
          withLocalBin(async (cwd) => (await nanoSpawn('probe-node', ['-e', 'console.log(7)'], { cwd, preferLocal: true })).stdout),
      },
    },
  },
  idioms: {
    promisedExecFile: {
      seed: 'new Promise\\(\\s*\\(\\s*resolve\\s*,\\s*reject\\s*\\)\\s*=>\\s*\\{?\\s*(?:[\\w.]+\\.)?execFile\\(',
      native: async () => output(await run(node, ['-e', both])),
      idiom: () =>
        new Promise((resolve, reject) => {
          execFile(node, ['-e', both], (error, stdout, stderr) => (error ? reject(error) : resolve({ stdout, stderr })));
        }),
    },
  },
  lint: {
    banExeca: {
      eslint: '10.12.0',
      plugin: 'eslint-plugin-depend@1.5.0',
      rule: 'depend/ban-dependencies',
      code: "import { execa } from 'execa';",
    },
  },
};
