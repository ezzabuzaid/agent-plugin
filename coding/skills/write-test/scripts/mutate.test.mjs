import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { constants as osConstants, tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const mutateScript = fileURLToPath(new URL('./mutate.mjs', import.meta.url));
const copyScript = fileURLToPath(new URL('./scratch-copy.mjs', import.meta.url));

// No user git config, and no NODE_TEST_CONTEXT from this runner leaking into
// the `node --test` that mutate spawns inside the copy.
function cleanEnv(root) {
  return { PATH: process.env.PATH, HOME: root, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1' };
}

// A git repo holding `files`, copied by the real scratch-copy, as a prover would.
function copyOf(root, files) {
  const repo = join(root, 'repo');
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(repo, path)), { recursive: true });
    writeFileSync(join(repo, path), content);
  }
  execFileSync('git', ['init', '-q'], { cwd: repo, env: cleanEnv(root) });
  const copy = join(root, `copy-${randomUUID()}`);
  execFileSync(process.execPath, [copyScript, '--repo', repo, '--dest', copy, '--min-free-gb', '0'], {
    env: cleanEnv(root),
  });
  return { repo, copy };
}

// Async on purpose: a hung mutate must not block this runner's own timeout.
async function mutate(root, spec) {
  const specPath = join(root, `spec-${randomUUID()}.json`);
  writeFileSync(specPath, JSON.stringify(spec));
  const child = spawn(process.execPath, [mutateScript, specPath], {
    env: cleanEnv(root),
    signal: AbortSignal.timeout(60_000),
    killSignal: 'SIGKILL',
  });
  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (chunk) => (stdout += chunk));
  child.stderr.on('data', (chunk) => (stderr += chunk));
  const [status] = await once(child, 'close');
  const lines = stdout.split('\n').filter(Boolean).map((line) => JSON.parse(line));
  return { status, stderr, lines, of: (id) => lines.find((line) => line.id === id) };
}

const clampSource = 'export function clamp(n) {\n  return Math.min(n, 10);\n}\n';
const clampTest = [
  "import test from 'node:test';",
  "import assert from 'node:assert/strict';",
  "import { appendFileSync } from 'node:fs';",
  "import { clamp } from './clamp.mjs';",
  'if (process.env.RUNS_FILE) appendFileSync(process.env.RUNS_FILE, "run\\n");',
  "test('clamps to ten', async () => {",
  '  assert.equal(clamp(42), 10);',
  '});',
  '',
].join('\n');

test('an edit that does not match exactly once fails to apply, the tests never run, and no earlier edit stays applied', async () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'wt-mutate-')));
  try {
    const { copy } = copyOf(root, { 'src/clamp.mjs': clampSource, 'src/clamp.test.mjs': clampTest });
    const runs = join(root, 'runs.log');

    const { status, of } = await mutate(root, {
      copy,
      command: [process.execPath, '--test', 'src/'],
      env: { RUNS_FILE: runs },
      timeoutSeconds: 60,
      mutations: [
        { id: 'absent', claim: 'clamp caps at ten', edits: [{ file: 'src/clamp.mjs', find: 'Math.max', replace: 'Math.min' }] },
        {
          id: 'partial',
          claim: 'clamp caps at ten',
          edits: [
            { file: 'src/clamp.mjs', find: '10', replace: '11' },
            { file: 'src/clamp.mjs', find: 'n', replace: 'x' },
          ],
        },
      ],
    });

    assert.equal(status, 0);
    assert.equal(of('absent').verdict, 'APPLY-FAILED');
    assert.match(of('absent').reason, /edit 1 .*matched 0 times/);
    assert.equal(of('partial').verdict, 'APPLY-FAILED');
    assert.match(of('partial').reason, /edit 2 .*matched \d+ times/);
    assert.equal(readFileSync(runs, 'utf8'), 'run\n', 'only the baseline ran the tests');
    assert.equal(readFileSync(join(copy, 'src/clamp.mjs'), 'utf8'), clampSource);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('a command that fails without any mutation is reported INVALID-BASELINE, its mutations are skipped, and the hint names what the copy left out', async () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'wt-mutate-')));
  try {
    const needsEnv = [
      "import test from 'node:test';",
      "import { readFileSync } from 'node:fs';",
      "test('reads the token', async () => { readFileSync('.env', 'utf8'); });",
      '',
    ].join('\n');
    const { copy } = copyOf(root, {
      '.gitignore': '.env\n',
      '.env': 'TOKEN=secret\n',
      'src/clamp.mjs': clampSource,
      'src/token.test.mjs': needsEnv,
    });

    const { status, lines, of } = await mutate(root, {
      copy,
      command: [process.execPath, '--test', 'src/'],
      timeoutSeconds: 60,
      mutations: [{ id: 'M1', claim: 'clamp caps at ten', edits: [{ file: 'src/clamp.mjs', find: '10', replace: '11' }] }],
    });

    const baseline = lines.find((line) => line.kind === 'baseline');
    assert.equal(status, 0);
    assert.equal(baseline.verdict, 'INVALID-BASELINE');
    assert.match(baseline.hint, /\.env/);
    assert.match(baseline.hint, /--include-ignored/);
    assert.equal(of('M1').verdict, 'SKIPPED');
    assert.equal(readFileSync(join(copy, 'src/clamp.mjs'), 'utf8'), clampSource);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('a per-mutation command gets its own baseline, identical commands share one, and only the failing command skips its mutations', async () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'wt-mutate-')));
  try {
    const alreadyBroken = "import test from 'node:test';\ntest('was red before', async () => { throw new Error('red'); });\n";
    const { copy } = copyOf(root, {
      'src/clamp.mjs': clampSource,
      'src/clamp.test.mjs': clampTest,
      'src/broken.test.mjs': alreadyBroken,
    });
    const runs = join(root, 'runs.log');
    const clampOnly = [process.execPath, '--test', 'src/clamp.test.mjs'];
    const brokenOnly = [process.execPath, '--test', 'src/broken.test.mjs'];
    const lift = { file: 'src/clamp.mjs', find: '10', replace: '11' };

    const { lines, of } = await mutate(root, {
      copy,
      command: clampOnly,
      env: { RUNS_FILE: runs },
      timeoutSeconds: 60,
      mutations: [
        { id: 'top', claim: 'clamp caps at ten', edits: [lift] },
        { id: 'narrowed-red', claim: 'clamp caps at ten', edits: [lift], command: brokenOnly },
        { id: 'same-as-top', claim: 'clamp caps at ten', edits: [lift], command: clampOnly },
      ],
    });

    const baselines = lines.filter((line) => line.kind === 'baseline');
    assert.deepEqual(
      baselines.map((line) => [line.command.at(-1), line.verdict]),
      [
        ['src/clamp.test.mjs', 'PASS'],
        ['src/broken.test.mjs', 'INVALID-BASELINE'],
      ],
    );
    assert.equal(of('top').verdict, 'CAUGHT');
    assert.equal(of('narrowed-red').verdict, 'SKIPPED');
    assert.equal(of('same-as-top').verdict, 'CAUGHT');
    assert.equal(readFileSync(runs, 'utf8'), 'run\nrun\nrun\n', 'one baseline plus two mutation runs');
    assert.deepEqual(lines.at(-1), { kind: 'summary', counts: { CAUGHT: 2, SKIPPED: 1 } });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('a mutation that makes the test hang is reported TIMEOUT and its whole process group is killed, even a grandchild that ignores SIGTERM', { timeout: 30_000 }, async () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'wt-mutate-')));
  const pidFile = join(root, 'grandchild.pid');
  try {
    const hangTest = [
      "import test from 'node:test';",
      "import { spawn } from 'node:child_process';",
      "import { writeFileSync } from 'node:fs';",
      "import { hang } from './flag.mjs';",
      "test('finishes', async () => {",
      '  if (!hang) return;',
      "  const stubborn = spawn(process.execPath, ['-e', \"process.on('SIGTERM', () => {}); setInterval(() => {}, 1000)\"], { stdio: 'ignore' });",
      `  writeFileSync(${JSON.stringify(pidFile)}, String(stubborn.pid));`,
      '  await new Promise(() => {});',
      '});',
      '',
    ].join('\n');
    const { copy } = copyOf(root, { 'src/flag.mjs': 'export const hang = false;\n', 'src/hang.test.mjs': hangTest });
    const started = Date.now();

    const { of } = await mutate(root, {
      copy,
      command: [process.execPath, '--test', 'src/'],
      timeoutSeconds: 3,
      mutations: [
        { id: 'H1', claim: 'the test finishes', edits: [{ file: 'src/flag.mjs', find: 'false', replace: 'true' }] },
      ],
    });

    const grandchild = Number(readFileSync(pidFile, 'utf8'));
    assert.equal(of('H1').verdict, 'TIMEOUT');
    assert.ok(of('H1').killedPids.includes(grandchild), `killed ${of('H1').killedPids}, grandchild ${grandchild}`);
    assert.throws(() => process.kill(grandchild, 0), { code: 'ESRCH' });
    assert.ok(Date.now() - started < 20_000, 'the timeout bounded the run');
    assert.equal(readFileSync(join(copy, 'src/flag.mjs'), 'utf8'), 'export const hang = false;\n');
  } finally {
    try {
      process.kill(Number(readFileSync(pidFile, 'utf8')), 'SIGKILL');
    } catch {}
    rmSync(root, { recursive: true, force: true });
  }
});

test('a mutation that breaks the import, or fails the run with no failing test, is reported INVALID rather than CAUGHT', async () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'wt-mutate-')));
  try {
    const check = "import { strict } from './src/flag.mjs';\nif (strict) process.exit(2);\n";
    const { copy } = copyOf(root, {
      'src/clamp.mjs': clampSource,
      'src/clamp.test.mjs': clampTest,
      'src/flag.mjs': 'export const strict = false;\n',
      'check.mjs': check,
    });

    const { of } = await mutate(root, {
      copy,
      // Tests, then a second step, the way an nx target chains a build or lint.
      command: ['sh', '-c', `"${process.execPath}" --test src/ && "${process.execPath}" check.mjs`],
      timeoutSeconds: 60,
      mutations: [
        {
          id: 'syntax',
          claim: 'clamp caps at ten',
          edits: [{ file: 'src/clamp.mjs', find: 'Math.min(n, 10);', replace: 'Math.min(n, 10;' }],
        },
        { id: 'no-failing-test', claim: 'the check passes', edits: [{ file: 'src/flag.mjs', find: 'false', replace: 'true' }] },
      ],
    });

    assert.equal(of('syntax').verdict, 'INVALID');
    assert.match(of('syntax').reason, /SyntaxError/);
    assert.equal(of('no-failing-test').verdict, 'INVALID');
    assert.equal(of('no-failing-test').tests.fail, 0);
    assert.match(of('no-failing-test').reason, /no test failed/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('a failing run with no test summary in its output is reported UNPARSED with an excerpt, not guessed', async () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'wt-mutate-')));
  try {
    // Like a target whose only reporter writes junit to a file: nothing on stdout.
    const quietRunner = [
      "import { strict } from './src/flag.mjs';",
      "if (strict) { console.error('strict check refused the input'); process.exit(1); }",
      '',
    ].join('\n');
    const { copy } = copyOf(root, { 'src/flag.mjs': 'export const strict = false;\n', 'run.mjs': quietRunner });

    const { of } = await mutate(root, {
      copy,
      command: [process.execPath, 'run.mjs'],
      timeoutSeconds: 60,
      mutations: [{ id: 'Q1', claim: 'the check passes', edits: [{ file: 'src/flag.mjs', find: 'false', replace: 'true' }] }],
    });

    assert.equal(of('Q1').verdict, 'UNPARSED');
    assert.equal(of('Q1').tests, null);
    assert.match(of('Q1').excerpt, /strict check refused the input/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('a mutation that never reaches the built output the tests import is reported INVALID, not SURVIVED', async () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'wt-mutate-')));
  try {
    const distTest = [
      "import test from 'node:test';",
      "import assert from 'node:assert/strict';",
      "import { clamp } from '../dist/clamp.mjs';",
      "test('clamps to ten', () => { assert.equal(clamp(42), 10); });",
      '',
    ].join('\n');
    // The tests import dist, and the command never rebuilds it: a stale build.
    const { copy } = copyOf(root, {
      '.gitignore': 'dist/\n',
      'src/clamp.mjs': clampSource,
      'dist/clamp.mjs': clampSource,
      'test/clamp.test.mjs': distTest,
    });

    const { of } = await mutate(root, {
      copy,
      command: [process.execPath, '--test', 'test/'],
      timeoutSeconds: 60,
      mutations: [
        {
          id: 'B1',
          claim: 'clamp caps at ten',
          edits: [{ file: 'src/clamp.mjs', find: 'Math.min(n, 10)', replace: 'Math.min(n, 11)' }],
          built: { file: 'dist/clamp.mjs', contains: 'Math.min(n, 11)' },
        },
      ],
    });

    assert.equal(of('B1').verdict, 'INVALID');
    assert.match(of('B1').reason, /not in the build.*dist\/clamp\.mjs/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

for (const signal of ['SIGTERM', 'SIGINT']) {
  test(`${signal} to mutate in the middle of a run restores the mutated file in the copy`, { timeout: 30_000 }, async () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), 'wt-mutate-')));
    let child;
    try {
      const pidFile = join(root, 'hung.pid');
      const hangTest = [
        "import test from 'node:test';",
        "import { writeFileSync } from 'node:fs';",
        "import { hang } from './flag.mjs';",
        "test('finishes', async () => {",
        '  if (!hang) return;',
        `  writeFileSync(${JSON.stringify(pidFile)}, String(process.pid));`,
        '  await new Promise(() => {});',
        '});',
        '',
      ].join('\n');
      const { copy } = copyOf(root, { 'src/flag.mjs': 'export const hang = false;\n', 'src/hang.test.mjs': hangTest });
      const specPath = join(root, 'spec.json');
      writeFileSync(
        specPath,
        JSON.stringify({
          copy,
          command: [process.execPath, '--test', 'src/'],
          timeoutSeconds: 60,
          mutations: [{ id: 'S1', claim: 'the test finishes', edits: [{ file: 'src/flag.mjs', find: 'false', replace: 'true' }] }],
        }),
      );
      child = spawn(process.execPath, [mutateScript, specPath], { env: cleanEnv(root), stdio: 'ignore' });
      const deadline = Date.now() + 20_000;
      while (!existsSync(pidFile)) {
        assert.ok(Date.now() < deadline, 'the mutated test never started');
        await new Promise((tick) => setTimeout(tick, 50));
      }

      child.kill(signal);
      const [code] = await once(child, 'close');

      // 128 + the signal's number is what the handler exits with after a verified restore.
      assert.equal(code, 128 + osConstants.signals[signal]);
      assert.equal(readFileSync(join(copy, 'src/flag.mjs'), 'utf8'), 'export const hang = false;\n');
      assert.throws(() => process.kill(Number(readFileSync(pidFile, 'utf8')), 0), { code: 'ESRCH' });
    } finally {
      child?.kill('SIGKILL');
      rmSync(root, { recursive: true, force: true });
    }
  });
}

test('a restore that cannot write the file back fails loudly instead of leaving a mutated copy silently', async () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'wt-mutate-')));
  try {
    const lockingTest = [
      "import test from 'node:test';",
      "import assert from 'node:assert/strict';",
      "import { chmodSync } from 'node:fs';",
      "import { clamp } from './clamp.mjs';",
      "test('clamps to ten', () => {",
      "  if (clamp(42) !== 10) chmodSync(new URL('./clamp.mjs', import.meta.url), 0o444);",
      '  assert.equal(clamp(42), 10);',
      '});',
      '',
    ].join('\n');
    const { copy } = copyOf(root, { 'src/clamp.mjs': clampSource, 'src/clamp.test.mjs': lockingTest });

    const { status, of } = await mutate(root, {
      copy,
      command: [process.execPath, '--test', 'src/'],
      timeoutSeconds: 60,
      mutations: [{ id: 'R1', claim: 'clamp caps at ten', edits: [{ file: 'src/clamp.mjs', find: '10', replace: '11' }] }],
    });

    assert.equal(status, 3);
    assert.equal(of('R1').restored, false);
    assert.match(of('R1').restoreError, /EACCES/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('an original file edited after the copy was made marks the result as drifted, and the copy is restored to its own content', async () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'wt-mutate-')));
  try {
    const { repo, copy } = copyOf(root, { 'src/clamp.mjs': clampSource, 'src/clamp.test.mjs': clampTest });
    // Another session keeps editing the real tree while the proof runs.
    const editedInRepo = 'export function clamp(n) {\n  return Math.min(n, 12);\n}\n';
    writeFileSync(join(repo, 'src/clamp.mjs'), editedInRepo);

    const { of } = await mutate(root, {
      copy,
      command: [process.execPath, '--test', 'src/'],
      timeoutSeconds: 60,
      mutations: [{ id: 'D1', claim: 'clamp caps at ten', edits: [{ file: 'src/clamp.mjs', find: '10', replace: '11' }] }],
    });

    assert.equal(of('D1').drift, true);
    assert.equal(of('D1').restored, true);
    assert.equal(readFileSync(join(copy, 'src/clamp.mjs'), 'utf8'), clampSource);
    assert.equal(readFileSync(join(repo, 'src/clamp.mjs'), 'utf8'), editedInRepo);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('a command that forces colored output is still parsed, and a caught mutation is reported CAUGHT', async () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'wt-mutate-')));
  try {
    const { copy } = copyOf(root, { 'src/clamp.mjs': clampSource, 'src/clamp.test.mjs': clampTest });

    const { of } = await mutate(root, {
      copy,
      command: [process.execPath, '--test', 'src/'],
      env: { FORCE_COLOR: '1' },
      timeoutSeconds: 60,
      mutations: [{ id: 'C1', claim: 'clamp caps at ten', edits: [{ file: 'src/clamp.mjs', find: '10', replace: '11' }] }],
    });

    assert.equal(of('C1').verdict, 'CAUGHT');
    assert.deepEqual(of('C1').tests, { run: 1, pass: 0, fail: 1, cancelled: 0 });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('a mutation the tests catch is reported CAUGHT with the failing assertion, from the spec cwd and env, and both trees end unchanged', async () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'wt-mutate-')));
  try {
    const { repo, copy } = copyOf(root, {
      'packages/lib/src/clamp.mjs': clampSource,
      'packages/lib/src/clamp.test.mjs': clampTest,
    });
    const runs = join(root, 'runs.log');

    const { status, of } = await mutate(root, {
      copy,
      cwd: 'packages/lib',
      command: [process.execPath, '--test', 'src/'],
      env: { RUNS_FILE: runs },
      timeoutSeconds: 60,
      mutations: [
        { id: 'M1', claim: 'clamp caps at ten', edits: [{ file: 'packages/lib/src/clamp.mjs', find: '10', replace: '11' }] },
      ],
    });

    assert.equal(status, 0);
    assert.equal(of('M1').verdict, 'CAUGHT');
    assert.equal(of('M1').claim, 'clamp caps at ten');
    assert.match(of('M1').excerpt, /11 !== 10/);
    assert.equal(of('M1').restored, true);
    assert.equal(readFileSync(runs, 'utf8'), 'run\nrun\n', 'the spec env reached the tests');
    assert.equal(readFileSync(join(copy, 'packages/lib/src/clamp.mjs'), 'utf8'), clampSource);
    assert.equal(readFileSync(join(repo, 'packages/lib/src/clamp.mjs'), 'utf8'), clampSource);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('a mutation the tests miss is reported SURVIVED and the copy is restored', async () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'wt-mutate-')));
  try {
    // The test only checks a value above the cap, so lowering the floor goes unseen.
    const floored = 'export function clamp(n) {\n  return Math.max(Math.min(n, 10), 0);\n}\n';
    const { copy } = copyOf(root, { 'src/clamp.mjs': floored, 'src/clamp.test.mjs': clampTest });

    const { status, of } = await mutate(root, {
      copy,
      command: [process.execPath, '--test', 'src/'],
      timeoutSeconds: 60,
      mutations: [{ id: 'F1', claim: 'clamp never goes below zero', edits: [{ file: 'src/clamp.mjs', find: ', 0)', replace: ', -5)' }] }],
    });

    assert.equal(status, 0);
    assert.equal(of('F1').verdict, 'SURVIVED');
    assert.equal(of('F1').restored, true);
    assert.equal(readFileSync(join(copy, 'src/clamp.mjs'), 'utf8'), floored);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('TAP reporter output gives the same verdict and counts as the spec reporter', async () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'wt-mutate-')));
  try {
    const { copy } = copyOf(root, { 'src/clamp.mjs': clampSource, 'src/clamp.test.mjs': clampTest });

    const { of } = await mutate(root, {
      copy,
      command: [process.execPath, '--test', '--test-reporter=tap', 'src/'],
      timeoutSeconds: 60,
      mutations: [{ id: 'T1', claim: 'clamp caps at ten', edits: [{ file: 'src/clamp.mjs', find: '10', replace: '11' }] }],
    });

    assert.equal(of('T1').verdict, 'CAUGHT');
    assert.deepEqual(of('T1').tests, { run: 1, pass: 0, fail: 1, cancelled: 0 });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('the baseline reports how many tests the command ran, so a filter the target ignored shows up', async () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'wt-mutate-')));
  try {
    const other = "import test from 'node:test';\ntest('unrelated one', () => {});\ntest('unrelated two', () => {});\n";
    const { copy } = copyOf(root, {
      'src/clamp.mjs': clampSource,
      'src/clamp.test.mjs': clampTest,
      'src/other.test.mjs': other,
    });

    const { lines } = await mutate(root, {
      copy,
      // The prover meant one test; a target that drops the filter runs all three.
      command: [process.execPath, '--test', 'src/'],
      timeoutSeconds: 60,
      mutations: [],
    });

    const baseline = lines.find((line) => line.kind === 'baseline');
    assert.equal(baseline.verdict, 'PASS');
    assert.deepEqual(baseline.tests, { run: 3, pass: 3, fail: 0, cancelled: 0 });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a mutation that makes a test outlast node:test's own --test-timeout is CAUGHT, though node counts it cancelled, not failed", async () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'wt-mutate-')));
  try {
    const hangTest = [
      "import test from 'node:test';",
      "import { hang } from './flag.mjs';",
      "test('finishes', async () => { if (hang) await new Promise(() => {}); });",
      '',
    ].join('\n');
    const { copy } = copyOf(root, { 'src/flag.mjs': 'export const hang = false;\n', 'src/hang.test.mjs': hangTest });

    const { of } = await mutate(root, {
      copy,
      // The target's own per-test timeout fires long before mutate's.
      command: [process.execPath, '--test', '--test-timeout=1000', 'src/'],
      timeoutSeconds: 60,
      mutations: [{ id: 'X1', claim: 'the test finishes', edits: [{ file: 'src/flag.mjs', find: 'false', replace: 'true' }] }],
    });

    assert.equal(of('X1').verdict, 'CAUGHT');
    assert.deepEqual(of('X1').tests, { run: 1, pass: 0, fail: 0, cancelled: 1 });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('a command that itself ignores SIGTERM is still killed after the grace period and reported TIMEOUT', { timeout: 30_000 }, async () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'wt-mutate-')));
  const pidFile = join(root, 'leader.pid');
  try {
    // Like a runner that traps SIGTERM for a shutdown that never finishes.
    const stubbornRunner = [
      "import { writeFileSync } from 'node:fs';",
      "import { hang } from './src/flag.mjs';",
      'if (hang) {',
      "  process.on('SIGTERM', () => {});",
      `  writeFileSync(${JSON.stringify(pidFile)}, String(process.pid));`,
      '  setInterval(() => {}, 1000);',
      '}',
      '',
    ].join('\n');
    const { copy } = copyOf(root, { 'src/flag.mjs': 'export const hang = false;\n', 'run.mjs': stubbornRunner });

    const { of } = await mutate(root, {
      copy,
      command: [process.execPath, 'run.mjs'],
      timeoutSeconds: 2,
      mutations: [{ id: 'K1', claim: 'the run finishes', edits: [{ file: 'src/flag.mjs', find: 'false', replace: 'true' }] }],
    });

    const leader = Number(readFileSync(pidFile, 'utf8'));
    assert.equal(of('K1').verdict, 'TIMEOUT');
    assert.ok(of('K1').killedPids.includes(leader), `killed ${of('K1').killedPids}, leader ${leader}`);
    assert.throws(() => process.kill(leader, 0), { code: 'ESRCH' });
  } finally {
    try {
      process.kill(Number(readFileSync(pidFile, 'utf8')), 'SIGKILL');
    } catch {}
    rmSync(root, { recursive: true, force: true });
  }
});

// A real APFS volume of a few MB, so a full disk is the volume's own, not faked.
function mountTinyVolume(root, megabytes) {
  const image = join(root, 'tiny.dmg');
  const mountpoint = join(root, 'tiny');
  execFileSync('hdiutil', ['create', '-size', `${megabytes}m`, '-fs', 'APFS', '-volname', 'wt', image, '-quiet']);
  execFileSync('hdiutil', ['attach', image, '-nobrowse', '-mountpoint', mountpoint, '-quiet']);
  return { mountpoint, [Symbol.dispose]: () => execFileSync('hdiutil', ['detach', mountpoint, '-force', '-quiet']) };
}

test('a test that fails because a module is missing or the disk is full is INVALID, not CAUGHT', async () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'wt-mutate-')));
  try {
    using volume = mountTinyVolume(root, 8);
    const writesToDisk = [
      "import test from 'node:test';",
      "import { writeFileSync } from 'node:fs';",
      "import { size } from './size.mjs';",
      `test('saves the export', () => { writeFileSync(${JSON.stringify(join(volume.mountpoint, 'export.bin'))}, Buffer.alloc(size)); });`,
      '',
    ].join('\n');
    const { copy } = copyOf(root, {
      'src/clamp.mjs': clampSource,
      'src/clamp.test.mjs': clampTest,
      'src/size.mjs': 'export const size = 1024;\n',
      'src/export.test.mjs': writesToDisk,
    });

    const { of } = await mutate(root, {
      copy,
      command: [process.execPath, '--test', 'src/'],
      timeoutSeconds: 60,
      mutations: [
        {
          id: 'missing-module',
          claim: 'clamp caps at ten',
          edits: [{ file: 'src/clamp.mjs', find: 'export function', replace: "import './gone.mjs';\nexport function" }],
        },
        {
          id: 'disk-full',
          claim: 'the export is saved',
          edits: [{ file: 'src/size.mjs', find: '1024', replace: '64 * 1024 * 1024' }],
        },
      ],
    });

    assert.equal(of('missing-module').verdict, 'INVALID');
    assert.match(of('missing-module').reason, /ERR_MODULE_NOT_FOUND|Cannot find module/);
    assert.equal(of('disk-full').verdict, 'INVALID');
    assert.match(of('disk-full').reason, /ENOSPC/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
