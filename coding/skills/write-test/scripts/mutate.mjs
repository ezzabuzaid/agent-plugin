#!/usr/bin/env node
// Runs mutations against a scratch copy (made by scratch-copy.mjs) and says,
// per mutation, whether the tests caught it.
//
//   node mutate.mjs <<'JSON'
//   { ...the spec... }
//   JSON
//
// The spec comes on stdin, the report goes to stdout, and `copy` must be
// absolute, so nothing a run reads or writes depends on the shell's working
// directory: a prover whose `cd` failed leaves no file in the tree its shell is in.
//
// The spec:
//   {
//     "copy": "/abs/path/to/copy",             // the path scratch-copy printed
//     "cwd": "packages/queue",                 // optional, relative to the copy
//     "command": ["npx", "nx", "run", "queue:test", "--skip-nx-cache"],
//     "env": { "NX_DAEMON": "false" },         // optional, added to this process's env
//     "timeoutSeconds": 180,                   // per run, default 180
//     "mutations": [
//       {
//         "id": "M1",
//         "claim": "ledger row: what breaks",
//         "edits": [{ "file": "src/index.ts", "find": "exact text", "replace": "new text" }],
//         "command": [...],                    // optional override, baselined on its own
//         "built": { "file": "dist/index.js", "contains": "new text" }  // optional
//       }
//     ]
//   }
//
// `file` paths are relative to the copy; `cwd` is where the command runs.
// Every distinct command runs once unmutated first (its baseline); a command
// without a passing named test skips its mutations. Then each mutation: every `find` must
// match exactly once or nothing is written; the command runs in its own process
// group, killed on timeout; the files are restored from the copy's own content
// and read back to prove it. With the copy's manifest, `drift` says whether the
// real tree changed a mutated file since the copy was made.
//
// Prints one JSON line per baseline and per mutation, then a summary line.
// Verdicts: CAUGHT, SURVIVED, INVALID, UNPARSED, TIMEOUT, APPLY-FAILED, SKIPPED.
// Exit codes: 0 all restores verified; 3 a restore failed; 1 bad spec.
//
// Configure Node's reporters in the command that actually runs the tests:
//   node --test --test-reporter=spec --test-reporter=/abs/path/node-evidence.mjs \
//     --test-reporter-destination=stdout --test-reporter-destination=stdout test.mjs
// With Nx or another wrapper, forward these flags to its test runner while
// retaining its build steps. Use an absolute reporter path. TAP can replace
// spec. Keep Node's default process isolation: the reporter needs its per-file
// summaries. Do not inject reporters through NODE_OPTIONS: Node combines those with
// explicit reporter flags, which can mismatch the reporter destinations.
// Baselines without structured evidence, or with no passing named test, are
// INVALID-BASELINE. A mutation with zero executed tests is INVALID, not SURVIVED.
// WRITE_TEST_REPORT_ID correlates each command's evidence; wrappers must pass
// that environment variable through. Human summary counts are not evidence.
import { execFileSync, spawn } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { constants as osConstants } from 'node:os';
import { isAbsolute, join } from 'node:path';
import { text } from 'node:stream/consumers';
import { stripVTControlCharacters } from 'node:util';

function badSpec(reason) {
  console.error(reason);
  process.exit(1);
}

// An argument is most likely a spec file. Refuse it at once rather than read
// stdin, which may be a terminal that never ends.
if (process.argv.length > 2) badSpec('mutate.mjs takes no arguments: pipe the spec to it as JSON on stdin');
const spec = await text(process.stdin)
  .then(JSON.parse)
  .catch((error) => badSpec(`the spec on stdin is not JSON: ${error.message}`));
if (typeof spec?.copy !== 'string' || !Array.isArray(spec.command) || !Array.isArray(spec.mutations)) {
  badSpec('the spec on stdin needs "copy", a "command" argv array, and a "mutations" array');
}
if (!isAbsolute(spec.copy)) {
  badSpec(`"copy" must be the absolute path scratch-copy printed, not ${JSON.stringify(spec.copy)}`);
}
const copy = spec.copy;
const timeoutMs = (spec.timeoutSeconds ?? 180) * 1000;

const emit = (line) => console.log(JSON.stringify(line));

// The manifest scratch-copy wrote: what it left out, and each source file's hash.
const manifest = (() => {
  try {
    return JSON.parse(readFileSync(join(copy, '.write-test-copy.json'), 'utf8'));
  } catch {
    return null;
  }
})();

// A baseline that fails in the copy often needs something the copy left out.
const leftOutHint = manifest?.ignoredLeftOut?.length
  ? `the copy left out ${manifest.ignoredLeftOut.join(', ')}; if the command needs one, re-copy with --include-ignored <name>`
  : undefined;

// Human reporters count an empty test file as a pass. Only the companion
// reporter's structured per-file summaries establish that named tests ran.
function totals(output, reportId) {
  const prefix = `write-test:${reportId}:`;
  const reports = output.split('\n').filter((line) => line.startsWith(prefix));
  if (!reports.length) return null;
  const result = { run: 0, pass: 0, fail: 0, cancelled: 0 };
  for (const line of reports) {
    let counts;
    try {
      counts = JSON.parse(line.slice(prefix.length));
    } catch {
      return null;
    }
    if (!Object.keys(result).every((key) => Number.isSafeInteger(counts?.[key]) && counts[key] >= 0)) return null;
    for (const key of Object.keys(result)) result[key] += counts[key];
  }
  return result;
}

function excerpt(output) {
  const lines = output.split('\n');
  const failing = lines.findIndex((line) => line.includes('failing tests:'));
  return (failing >= 0 ? lines.slice(failing, failing + 25) : lines.slice(-25)).join('\n');
}

// The pids in a process group, read before signalling so the report can name them.
function groupMembers(pgid) {
  return execFileSync('ps', ['-A', '-o', 'pid=,pgid='], { encoding: 'utf8' })
    .split('\n')
    .map((line) => line.trim().split(/\s+/).map(Number))
    .filter(([pid, group]) => group === pgid && pid)
    .map(([pid]) => pid);
}

function signalGroup(pgid, signal) {
  try {
    process.kill(-pgid, signal);
  } catch (error) {
    if (error.code !== 'ESRCH') throw error;
  }
}

// What is in flight: the running group, and the mutated files' original text.
// A SIGTERM or SIGINT mid-run must not leave either behind.
const active = { pgid: null, original: null };
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    if (active.pgid) signalGroup(active.pgid, 'SIGKILL');
    const restoring = active.original ? restore(active.original) : { restored: true };
    emit({ kind: 'interrupted', signal, ...restoring });
    process.exit(restoring.restored ? 128 + osConstants.signals[signal] : 3);
  });
}

// Runs the command as the leader of its own process group, so everything it
// starts (test workers, a hung grandchild) can be stopped together.
function run(command) {
  return new Promise((done) => {
    const reportId = randomUUID();
    const child = spawn(command[0], command.slice(1), {
      cwd: join(copy, spec.cwd ?? '.'),
      env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0', ...spec.env, WRITE_TEST_REPORT_ID: reportId },
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: true,
    });
    active.pgid = child.pid;
    let output = '';
    let killedPids;
    child.stdout.on('data', (chunk) => (output += chunk));
    child.stderr.on('data', (chunk) => (output += chunk));
    const timer = setTimeout(() => {
      killedPids = groupMembers(child.pid);
      signalGroup(child.pid, 'SIGTERM');
      setTimeout(() => signalGroup(child.pid, 'SIGKILL'), 2000).unref();
    }, timeoutMs);
    // Whatever the command left running in its group would hold the output
    // pipes open, and this run would never end.
    child.on('exit', () => signalGroup(child.pid, 'SIGKILL'));
    child.on('close', (exit) => {
      clearTimeout(timer);
      active.pgid = null;
      const text = stripVTControlCharacters(output);
      done({ exit, output: text, tests: totals(text, reportId), timedOut: killedPids !== undefined, killedPids });
    });
  });
}

// Whether the real tree changed a mutated file since the copy was made: the
// verdict then describes code that is no longer there. Null without a manifest.
function drifted(edits) {
  if (!manifest) return null;
  return [...new Set(edits.map(({ file }) => file))].some((file) => {
    const original = join(manifest.source, file);
    const now = existsSync(original) ? createHash('sha256').update(readFileSync(original)).digest('hex') : null;
    return now !== manifest.files[file];
  });
}

// Failures that happen before any assertion runs. node:test counts a test file
// that can't load as a failing test, so these are checked before the count.
const SETUP_FAILURES = [
  /^\s*SyntaxError: .*$/m,
  /^.*\b(?:ERR_MODULE_NOT_FOUND|Cannot find (?:module|package))\b.*$/m,
  /^.*\berror TS\d{4}:.*$/m,
  /^.*\bENOSPC\b.*$/m,
];

function classify(result) {
  for (const pattern of SETUP_FAILURES) {
    const match = result.output.match(pattern);
    if (match) return { verdict: 'INVALID', reason: `failed before any assertion: ${match[0].trim()}` };
  }
  // A reporter that writes only to a file leaves nothing to count; say so
  // rather than guess, and let the excerpt speak.
  if (!result.tests) return { verdict: 'UNPARSED', reason: `exit ${result.exit}, and no structured test evidence; configure node-evidence.mjs as a Node test reporter` };
  if (result.tests.pass + result.tests.fail + result.tests.cancelled === 0) {
    return { verdict: 'INVALID', reason: 'no named tests executed; check the filter, skips and test registration' };
  }
  if (result.exit === 0) return { verdict: 'SURVIVED' };
  if (result.tests.fail + result.tests.cancelled === 0) {
    return { verdict: 'INVALID', reason: `exit ${result.exit}, but no test failed` };
  }
  return { verdict: 'CAUGHT' };
}

// When the tests import built output, a mutation the command didn't rebuild
// into it proves nothing either way.
function notInBuild(built) {
  if (!built) return null;
  const text = readFileSync(join(copy, built.file), 'utf8');
  return text.includes(built.contains)
    ? null
    : { verdict: 'INVALID', reason: `mutation not in the build: ${built.file} does not contain the replacement` };
}

// Applies every edit to the files' text in memory first, so a mutation whose
// edits don't all match leaves the copy untouched.
function apply(edits) {
  const original = new Map();
  const mutated = new Map();
  for (const [index, { file, find, replace }] of edits.entries()) {
    if (!original.has(file)) original.set(file, readFileSync(join(copy, file), 'utf8'));
    const text = mutated.get(file) ?? original.get(file);
    const count = text.split(find).length - 1;
    if (count !== 1) return { error: `edit ${index + 1} (${file}): find matched ${count} times, expected exactly 1` };
    mutated.set(file, text.replace(find, () => replace));
  }
  for (const [file, text] of mutated) writeFileSync(join(copy, file), text);
  return { original };
}

// Writes the copy's own text back and reads it again to prove it. A failure is
// reported, never thrown: a silently mutated copy poisons every later run.
function restore(original) {
  try {
    for (const [file, text] of original) writeFileSync(join(copy, file), text);
    const ok = [...original].every(([file, text]) => readFileSync(join(copy, file), 'utf8') === text);
    return ok ? { restored: true } : { restored: false, restoreError: 'content differs after writing it back' };
  } catch (error) {
    return { restored: false, restoreError: `${error.code ?? ''} ${error.message}`.trim() };
  }
}

const commandOf = (mutation) => mutation.command ?? spec.command;
const baselines = new Map();
for (const command of [spec.command, ...spec.mutations.map(commandOf)]) {
  const key = JSON.stringify(command);
  if (baselines.has(key)) continue;
  const result = await run(command);
  const passed = result.exit === 0 && result.tests?.pass > 0 && result.tests.fail === 0 && result.tests.cancelled === 0;
  baselines.set(key, passed);
  emit({
    kind: 'baseline',
    command,
    verdict: passed ? 'PASS' : 'INVALID-BASELINE',
    exit: result.exit,
    tests: result.tests,
    ...(passed ? {} : {
      reason: result.exit !== 0 ? `command exited ${result.exit}`
        : !result.tests ? 'no structured test evidence; configure node-evidence.mjs as a Node test reporter'
          : 'no named tests passed; check the filter, skips and test registration',
      excerpt: excerpt(result.output), hint: leftOutHint,
    }),
  });
}

const counts = {};
let restoreFailed = false;
for (const mutation of spec.mutations) {
  const { id, claim } = mutation;
  const report = (line) => {
    counts[line.verdict] = (counts[line.verdict] ?? 0) + 1;
    emit({ kind: 'mutation', id, claim, ...line, drift: drifted(mutation.edits) });
  };
  if (!baselines.get(JSON.stringify(commandOf(mutation)))) {
    report({ verdict: 'SKIPPED', reason: 'its command has no valid passing baseline (INVALID-BASELINE)' });
    continue;
  }
  const applied = apply(mutation.edits);
  if (applied.error) {
    report({ verdict: 'APPLY-FAILED', reason: applied.error });
    continue;
  }
  active.original = applied.original;
  const result = await run(commandOf(mutation));
  const restoring = restore(applied.original);
  active.original = null;
  if (!restoring.restored) restoreFailed = true;
  if (result.timedOut) {
    report({ verdict: 'TIMEOUT', killedPids: result.killedPids, excerpt: excerpt(result.output), ...restoring });
    continue;
  }
  const verdict = notInBuild(mutation.built) ?? classify(result);
  report({ ...verdict, exit: result.exit, tests: result.tests, excerpt: excerpt(result.output), ...restoring });
}

emit({ kind: 'summary', counts });
process.exitCode = restoreFailed ? 3 : 0;
