#!/usr/bin/env node
// Runs mutations and says, per mutation, whether the tests caught it.
//
//   node mutate.mjs <<'JSON'
//   { ...the spec... }
//   JSON
//
// A claim only the type checker can see (an @ts-expect-error, a type that must
// not accept a value) is proven by the type mode ("typecheck"), in place: the
// compiler that the project's `tsc` runs (the first node_modules/.bin/tsc from
// `cwd` up, followed to its package) checks the project's own tsconfig, and a
// mutated file reads as its mutated text from memory. TypeScript 6 or older
// checks through its compiler API, TypeScript 7 through its unstable API with
// a file-system hook; a repo whose `typescript` is an alias of TypeScript 6
// and whose tsc is TypeScript 7 is checked by TypeScript 7. No command runs,
// nothing is copied and nothing is written (no emit, no build info). Each
// mutation names the lines of the test that assert the claim:
// `"assertion": { "file": "src/a.test.ts", "lines": [12, 14] }`.
// Each assertion first gets a baseline, which names the compiler
// (`"compiler": "typescript 7.0.2"`): no error on its lines without any
// mutation, or INVALID-BASELINE and its mutations SKIPPED. Then a mutation is
// - CAUGHT when the claimed lines have an error: TS2578 ("Unused
//   '@ts-expect-error' directive") on the directive, or any error on the line
//   that asserts;
// - INVALID when a mutated file is not in the tsconfig's program, or the
//   mutation gives a mutated file an error it did not have;
// - SURVIVED otherwise.
// The check reads sources, never built declarations: TypeScript 6 drops
// project references and composite, and TypeScript 7's API follows a
// reference to its source, as an editor reads the source of a reference.
//
//   { "cwd": "/abs/packages/launchd", "typecheck": "tsconfig.spec.json",
//     "mutations": [{ "id": "T1", "claim": "...", "edits": [...],
//                     "assertion": { "file": "src/job/job.test.ts", "lines": [247, 254] } }] }
//
// For a claim a test run sees, each mutant exists only in the memory of the
// Node processes of its own run. mutant-hook.mjs, loaded through
// NODE_OPTIONS=--import, edits a file's source as Node loads it, so nothing is
// copied, written, rebuilt or restored, and other sessions keep building and
// testing the same tree. It reaches every Node process the run starts with its
// environment, a TypeScript source before Node strips its types, and require()
// as well as import. Edit the file the tests load: a source they import
// directly, or a dependency's built output. A file no process loaded is INVALID
// ("never loaded"); so is a process that clears its environment before loading
// it.
//
// The spec comes on stdin, the report goes to stdout, and the directory the
// command runs in is absolute, so nothing a run reads or writes depends on the
// shell's working directory: a prover whose `cd` failed leaves no file in the
// tree its shell is in.
//
// The spec:
//   {
//     "cwd": "/abs/dir",                       // where the command runs, absolute
//     "command": ["npx", "nx", "run", "queue:test", "--skip-nx-cache"],
//     "env": { "NX_DAEMON": "false" },         // optional, added to this process's env
//     "timeoutSeconds": 180,                   // per run, default 180
//     "mutations": [
//       {
//         "id": "M1",
//         "claim": "ledger row: what breaks",
//         "edits": [{ "file": "src/index.ts", "find": "exact text", "replace": "new text" }],
//         "command": [...]                     // optional override, baselined on its own
//       }
//     ]
//   }
//
// `file` paths are relative to `cwd`, or absolute.
// Every distinct command runs once unmutated first (its baseline); a command
// without a passing named test skips its mutations. Then each mutation: every `find` must
// match exactly once or nothing runs; the command runs in its own process
// group, killed on timeout. `drift` says whether a mutated file changed on disk
// during its run.
//
// Prints one JSON line per baseline and per mutation, then a summary line.
// Verdicts: CAUGHT, SURVIVED, INVALID, UNPARSED, TIMEOUT, APPLY-FAILED, SKIPPED.
// Exit codes: 0 the spec ran; 1 bad spec; 128 + the signal's number when a
// SIGTERM or SIGINT stops it.
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
// that environment variable through. A wrapper may put text in front of each
// line, such as Nx's `<project>: ` with --output-style=stream; the evidence is
// found anywhere in its line. Human summary counts are not evidence.
import { execFileSync, spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync, realpathSync, rmSync } from 'node:fs';
import { constants as osConstants, tmpdir } from 'node:os';
import { isAbsolute, join, relative, resolve } from 'node:path';
import { text } from 'node:stream/consumers';
import { pathToFileURL } from 'node:url';
import { stripVTControlCharacters } from 'node:util';
import { projectChecker } from './type-check.mjs';

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
const typeMode = spec?.typecheck !== undefined;
if (typeMode) {
  if (typeof spec.typecheck !== 'string') badSpec(`"typecheck" names the tsconfig, relative to "cwd", not ${JSON.stringify(spec.typecheck)}`);
  if (spec.command !== undefined) badSpec('"typecheck" checks the tree in place and runs no command: drop "command"');
  if (!Array.isArray(spec.mutations)) badSpec('the spec on stdin needs a "mutations" array');
  const unclaimed = spec.mutations.find(({ assertion }) => typeof assertion?.file !== 'string'
    || !Array.isArray(assertion.lines) || assertion.lines.length !== 2 || !assertion.lines.every(Number.isSafeInteger));
  if (unclaimed) badSpec(`mutation ${unclaimed.id} needs "assertion": { "file", "lines": [first, last] }, the test lines that assert its claim`);
} else if (!Array.isArray(spec?.command) || !Array.isArray(spec.mutations)) {
  badSpec('the spec on stdin needs a "command" argv array and a "mutations" array');
}
if (typeof spec.cwd !== 'string' || !isAbsolute(spec.cwd)) {
  badSpec(`"cwd" must be the absolute directory the command runs in, not ${JSON.stringify(spec.cwd)}`);
}
const pathOf = (file) => resolve(spec.cwd, file);
const timeoutMs = (spec.timeoutSeconds ?? 180) * 1000;

const emit = (line) => console.log(JSON.stringify(line));

// Human reporters count an empty test file as a pass. Only the companion
// reporter's structured per-file summaries establish that named tests ran.
// The record runs from its marker to the end of the line, wherever the marker
// sits: runners such as Nx's stream output style, Turborepo and `pnpm -r` put
// the project's name in front of every line. The marker holds this run's
// random id, so no other output can match it.
function totals(output, reportId) {
  const marker = `write-test:${reportId}:`;
  const reports = output.split('\n').filter((line) => line.includes(marker));
  if (!reports.length) return null;
  const result = { run: 0, pass: 0, fail: 0, cancelled: 0 };
  for (const line of reports) {
    let counts;
    try {
      counts = JSON.parse(line.slice(line.indexOf(marker) + marker.length));
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
    // ESRCH: the group is gone. EPERM: on macOS, every member is a zombie that
    // nobody has reaped yet. Either way, nothing is left to signal.
    if (error.code !== 'ESRCH' && error.code !== 'EPERM') throw error;
  }
}

// What is in flight: the running group. A SIGTERM or SIGINT mid-run must not
// leave it behind.
const active = { pgid: null };
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    if (active.pgid) signalGroup(active.pgid, 'SIGKILL');
    emit({ kind: 'interrupted', signal });
    process.exit(128 + osConstants.signals[signal]);
  });
}

// Runs the command as the leader of its own process group, so everything it
// starts (test workers, a hung grandchild) can be stopped together.
function run(command, mutantEnv = {}) {
  return new Promise((done) => {
    const reportId = randomUUID();
    const child = spawn(command[0], command.slice(1), {
      cwd: spec.cwd,
      env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0', ...spec.env, ...mutantEnv, WRITE_TEST_REPORT_ID: reportId },
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: true,
    });
    active.pgid = child.pid;
    let output = '';
    let killedPids;
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
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

// Applies every edit to the files' text in memory first, so a mutation whose
// edits don't all match changes nothing and runs nothing.
function mutatedTexts(edits) {
  const original = new Map();
  const mutated = new Map();
  for (const [index, { file, find, replace }] of edits.entries()) {
    if (!original.has(file)) original.set(file, readFileSync(pathOf(file), 'utf8'));
    const text = mutated.get(file) ?? original.get(file);
    const count = text.split(find).length - 1;
    if (count !== 1) return { error: `edit ${index + 1} (${file}): find matched ${count} times, expected exactly 1` };
    mutated.set(file, text.replace(find, () => replace));
  }
  return { original, mutated };
}

// The hook that carries an in-memory mutant into the run's Node processes. It
// joins whatever NODE_OPTIONS the run already has, never replacing them.
const hook = pathToFileURL(join(import.meta.dirname, 'mutant-hook.mjs')).href;
const inheritedNodeOptions = { ...process.env, ...spec.env }.NODE_OPTIONS;

const urlOf = (file) => {
  try {
    return pathToFileURL(realpathSync(pathOf(file))).href;
  } catch {
    return null;
  }
};

// Runs one mutant that exists only in the memory of the run's processes. Each
// process that loads a mutated file logs it; a mutant no process loaded proves
// nothing, so it is INVALID rather than SURVIVED.
async function proveInMemory(mutation, original) {
  const log = join(tmpdir(), `write-test-mutant-${randomUUID()}.jsonl`);
  const edits = mutation.edits.map((edit) => ({ ...edit, file: pathOf(edit.file) }));
  const result = await run(commandOf(mutation), {
    WRITE_TEST_MUTANT: JSON.stringify({ log, edits }),
    NODE_OPTIONS: [inheritedNodeOptions, `--import=${hook}`].filter(Boolean).join(' '),
  });
  const loads = existsSync(log) ? readFileSync(log, 'utf8').trim().split('\n').map((line) => JSON.parse(line)) : [];
  rmSync(log, { force: true });
  const drift = [...original].some(([file, text]) => !existsSync(pathOf(file)) || readFileSync(pathOf(file), 'utf8') !== text);
  const evidence = {
    loadedBy: new Set(loads.filter((load) => load.applied).map((load) => load.pid)).size,
    drift,
    exit: result.exit,
    tests: result.tests,
    excerpt: excerpt(result.output),
  };
  const mismatch = loads.find((load) => !load.applied);
  if (mismatch) {
    return { verdict: 'INVALID', reason: `find does not match exactly once in the source Node loaded from ${mismatch.url}`, ...evidence };
  }
  const loaded = new Set(loads.map((load) => load.url));
  const unloaded = [...original.keys()].filter((file) => !loaded.has(urlOf(file)));
  if (unloaded.length) {
    return { verdict: 'INVALID', reason: `mutant never loaded: no process of the run loaded ${unloaded.join(', ')}`, ...evidence };
  }
  if (result.timedOut) return { verdict: 'TIMEOUT', killedPids: result.killedPids, ...evidence };
  return { ...classify(result), ...evidence };
}

// The type mode: each mutant is a text in the memory of this process, which
// the compiler of the project's tsc reads in place of the file on disk.
async function proveTypes() {
  let checker;
  let unmutated;
  try {
    checker = await projectChecker(spec.cwd, resolve(spec.cwd, spec.typecheck));
    unmutated = checker.check(new Map());
  } catch (error) {
    // undefined when no compiler was found; else it stops TypeScript 7's server.
    checker?.close();
    badSpec(error.message);
  }
  try {
    proveWith(checker, unmutated);
  } finally {
    checker.close();
  }
}

function proveWith({ compiler, check }, unmutated) {
  const claimed = ({ file, lines: [first, last] }) => (error) => error.file === pathOf(file) && error.line >= first && error.line <= last;
  const asText = (error) => `${relative(spec.cwd, error.file)}:${error.line} TS${error.code} ${error.message}`;

  const baselines = new Map();
  for (const { assertion } of spec.mutations) {
    const key = JSON.stringify(assertion);
    if (baselines.has(key)) continue;
    const inProgram = unmutated.has(pathOf(assertion.file));
    const diagnostics = unmutated.errors(pathOf(assertion.file)).filter(claimed(assertion));
    const passed = inProgram && diagnostics.length === 0;
    baselines.set(key, passed);
    emit({
      kind: 'baseline',
      typecheck: resolve(spec.cwd, spec.typecheck),
      compiler,
      assertion,
      verdict: passed ? 'PASS' : 'INVALID-BASELINE',
      diagnostics,
      ...(passed ? {} : {
        reason: inProgram ? 'the claimed lines have a type error without any mutation' : `${assertion.file} is not in the program of ${spec.typecheck}`,
      }),
    });
  }

  for (const mutation of spec.mutations) {
    const { id, claim, assertion } = mutation;
    const report = (line) => {
      counts[line.verdict] = (counts[line.verdict] ?? 0) + 1;
      emit({ kind: 'mutation', id, claim, ...line });
    };
    if (!baselines.get(JSON.stringify(assertion))) {
      report({ verdict: 'SKIPPED', reason: 'its assertion has no clean baseline (INVALID-BASELINE)' });
      continue;
    }
    const applied = mutatedTexts(mutation.edits);
    if (applied.error) {
      report({ verdict: 'APPLY-FAILED', reason: applied.error });
      continue;
    }
    const mutant = check(new Map([...applied.mutated].map(([file, text]) => [pathOf(file), text])));
    const drift = [...applied.original].some(([file, text]) => !existsSync(pathOf(file)) || readFileSync(pathOf(file), 'utf8') !== text);
    const diagnostics = mutant.errors(pathOf(assertion.file)).filter(claimed(assertion));
    const outside = [...applied.mutated.keys()].filter((file) => !mutant.has(pathOf(file)));
    if (outside.length) {
      report({ verdict: 'INVALID', reason: `not in the program of ${resolve(spec.cwd, spec.typecheck)}: ${outside.join(', ')}`, diagnostics, drift });
      continue;
    }
    // An error the mutation gave a mutated file itself: the mutant does not
    // compile, so it proves nothing. Errors the file had before stay allowed.
    const broken = [...applied.mutated.keys()].flatMap((file) => {
      const before = unmutated.errors(pathOf(file)).map(({ code, message }) => `${code} ${message}`);
      return mutant.errors(pathOf(file)).filter(({ code, message }) => {
        const at = before.indexOf(`${code} ${message}`);
        if (at === -1) return true;
        before.splice(at, 1);
        return false;
      });
    });
    if (broken.length) {
      report({ verdict: 'INVALID', reason: `the mutant does not compile: ${broken.map(asText).join('; ')}`, diagnostics, drift });
      continue;
    }
    report({ verdict: diagnostics.length ? 'CAUGHT' : 'SURVIVED', diagnostics, drift });
  }
}

// The runtime mode: each mutant runs under the test command, in memory.
async function proveRuntime() {
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
        excerpt: excerpt(result.output),
      }),
    });
  }

  for (const mutation of spec.mutations) {
    const { id, claim } = mutation;
    const report = (line) => {
      counts[line.verdict] = (counts[line.verdict] ?? 0) + 1;
      emit({ kind: 'mutation', id, claim, ...line });
    };
    if (!baselines.get(JSON.stringify(commandOf(mutation)))) {
      report({ verdict: 'SKIPPED', reason: 'its command has no valid passing baseline (INVALID-BASELINE)' });
      continue;
    }
    const applied = mutatedTexts(mutation.edits);
    if (applied.error) {
      report({ verdict: 'APPLY-FAILED', reason: applied.error });
      continue;
    }
    report(await proveInMemory(mutation, applied.original));
  }
}

const commandOf = (mutation) => mutation.command ?? spec.command;
const counts = {};
if (typeMode) await proveTypes();
else await proveRuntime();

emit({ kind: 'summary', counts });
