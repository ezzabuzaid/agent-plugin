// Runs this Node (process.execPath, never a shell or another program) as a
// child process for a probe, waits for it to exit, and reports what it did.
// A file the child needs is written first with inScratch (./scratch.mjs).
//
//   run(args, { cwd, env }) -> { stdout, stderr, code, signal, error }
//     args   Node's arguments: flags, then a script path, or `-e` and source
//            (esm(source) gives the arguments for ES module source).
//     cwd    the child's working directory (default: this process's).
//     env    variables added to this process's environment for the child.
//     It resolves whatever the exit. `error` is the first stderr line that
//     names an error, trimmed, or undefined.
//   output(args, options) -> stdout. Like execFile, it throws when the child
//     exits with a non-zero code or by a signal.
//   esm(source) -> ['--input-type=module', '-e', source].
// The child's stdin is closed; it never waits for input.
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { text } from 'node:stream/consumers';

export async function run(args, { cwd, env = {} } = {}) {
  const child = spawn(process.execPath, args, { cwd, env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'] });
  const [stdout, stderr, [code, signal]] = await Promise.all([text(child.stdout), text(child.stderr), once(child, 'close')]);
  const error = stderr.split('\n').find((line) => /error/i.test(line))?.trim();
  return { stdout, stderr, code, signal, error };
}

export async function output(args, options) {
  const result = await run(args, options);
  if (result.code !== 0) {
    throw new Error(`node exited ${result.signal ?? result.code}: ${result.error ?? result.stderr.trim()}`);
  }
  return result.stdout;
}

export const esm = (source) => ['--input-type=module', '-e', source];
