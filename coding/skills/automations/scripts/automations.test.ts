import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, readdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { setTimeout as sleep } from 'node:timers/promises';

import { TemporaryFiles } from '@zukhruf/fs';
import { build } from 'esbuild';

import { options } from './build.ts';

const CLI = new URL('./automations.ts', import.meta.url).pathname;
const BUNDLE = new URL('./dist/automations.mjs', import.meta.url).pathname;

// The runner finds `claude` at $HOME/.local/bin and the other tools on PATH, as under launchd.
function cli(home: string, args: string[], extraEnv: Record<string, string> = {}) {
  const result = spawnSync(process.execPath, [CLI, ...args], {
    encoding: 'utf8',
    env: {
      HOME: home,
      PATH: `${join(home, '.local/bin')}:${dirname(process.execPath)}:/usr/bin:/bin:/usr/sbin:/sbin`,
      // The load hook of a write-test mutation run reaches the CLI through these two.
      ...(process.env.NODE_OPTIONS === undefined ? {} : { NODE_OPTIONS: process.env.NODE_OPTIONS }),
      ...(process.env.WRITE_TEST_MUTANT === undefined ? {} : { WRITE_TEST_MUTANT: process.env.WRITE_TEST_MUTANT }),
      ...extraEnv,
    },
  });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

function writeAutomation(home: string, id: string, text: string) {
  const folder = join(home, '.claude/automations', id);
  mkdirSync(folder, { recursive: true });
  writeFileSync(join(folder, 'automation.md'), text);
}

function writeExecutable(path: string, text: string) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
  chmodSync(path, 0o755);
}

// Stands in for `claude -p --output-format json`: records what it was given, then prints `reply`.
function writeFakeClaude(home: string, reply: object, { exitCode = 0, before = '' } = {}) {
  writeExecutable(
    join(home, '.local/bin/claude'),
    `#!/usr/bin/env node
const fs = require('node:fs');
${before}
fs.appendFileSync(process.env.HOME + '/claude-calls.jsonl', JSON.stringify({ argv: process.argv.slice(2), cwd: process.cwd(), apiKey: process.env.ANTHROPIC_API_KEY ?? null, ...globalThis.extra }) + '\\n');
process.stdout.write(${JSON.stringify(JSON.stringify(reply))});
process.exitCode = ${exitCode};
`,
  );
}

function claudeCalls(home: string): { argv: string[]; cwd: string; apiKey: string | null; caffeinated?: boolean }[] {
  const file = join(home, 'claude-calls.jsonl');
  if (!existsSync(file)) return [];
  return readFileSync(file, 'utf8').trim().split('\n').map((line) => JSON.parse(line));
}

function writeFakeNotifier(home: string) {
  writeExecutable(
    join(home, '.local/bin/terminal-notifier'),
    `#!/usr/bin/env node
require('node:fs').appendFileSync(process.env.HOME + '/notifications.jsonl', JSON.stringify(process.argv.slice(2)) + '\\n');
`,
  );
}

function notifications(home: string): string[][] {
  const file = join(home, 'notifications.jsonl');
  if (!existsSync(file)) return [];
  return readFileSync(file, 'utf8').trim().split('\n').map((line) => JSON.parse(line));
}

function option(argv: string[] | undefined, flag: string): string | undefined {
  const index = argv?.indexOf(flag) ?? -1;
  return index === -1 ? undefined : argv?.[index + 1];
}

// An RFC 5545 local date-time in UTC, such as 20261116T090000.
function icsTime(time: Temporal.ZonedDateTime): string {
  return time.toPlainDateTime().round({ smallestUnit: 'second' }).toString().replaceAll(/[-:]/g, '');
}

// Rules here repeat on the hour, so 30 minutes past keeps every time of a rule half an hour away from now.
function minutesAgo(minutes: number): Temporal.ZonedDateTime {
  return Temporal.Now.zonedDateTimeISO('UTC').subtract({ minutes });
}

// The reply of claude 2.1.325 to `-p 'Reply with the single word: ok' --output-format json`, captured
// 2026-11-16, with the keys the runner does not read left out.
const OK_REPLY = {
  type: 'result',
  subtype: 'success',
  is_error: false,
  num_turns: 1,
  result: 'ok',
  session_id: 'f22c949b-4cc6-47cc-a755-5997075983a8',
};

test('sync names each automation it rejects with the reason, and installs no job, also for the valid ones', () => {
  using home = new TemporaryFiles().directorySync('automations-');
  const cwd = home.path;
  const valid = `t${process.pid}x${Date.now().toString(36)}-valid`;
  writeAutomation(
    home.path,
    valid,
    `---\nname: Valid\nschedule: |\n  DTSTART;TZID=UTC:20261117T090000\n  RRULE:FREQ=DAILY\ncwd: ${cwd}\nstatus: active\n---\nhello\n`,
  );
  writeAutomation(
    home.path,
    'bad-rule',
    `---\nname: Bad rule\nschedule: |\n  DTSTART;TZID=UTC:20261117T090000\n  RRULE:FREQ=FORTNIGHTLY\ncwd: ${cwd}\nstatus: active\n---\nhello\n`,
  );
  writeAutomation(
    home.path,
    'no-start',
    `---\nname: No start\nschedule: RRULE:FREQ=DAILY\ncwd: ${cwd}\nstatus: active\n---\nhello\n`,
  );
  writeAutomation(
    home.path,
    'Bad_Id',
    `---\nname: Bad id\nschedule: |\n  DTSTART;TZID=UTC:20261117T090000\n  RRULE:FREQ=DAILY\ncwd: ${cwd}\nstatus: active\n---\nhello\n`,
  );
  writeAutomation(
    home.path,
    'bad-timeout',
    `---\nname: Bad timeout\nschedule: |\n  DTSTART;TZID=UTC:20261117T090000\n  RRULE:FREQ=DAILY\ncwd: ${cwd}\nstatus: active\ntimeout: 75 minutes\n---\nhello\n`,
  );

  try {
    const result = cli(home.path, ['sync']);

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /bad-rule: .*FREQ/);
    assert.match(result.stderr, /no-start: .*dtstart/i);
    assert.match(result.stderr, /Bad_Id: .*a-z0-9/);
    assert.match(result.stderr, /bad-timeout: .*timeout/);
    const agents = join(home.path, 'Library/LaunchAgents');
    assert.deepEqual(existsSync(agents) ? readdirSync(agents) : [], []);
  } finally {
    spawnSync('launchctl', ['bootout', `gui/${process.getuid?.()}/com.ezzabuzaid.automations.${valid}`]);
  }
});

test('a run whose claude fails is notified as failed with the first line of its error, is not resumed, and run exits non-zero', () => {
  using home = new TemporaryFiles().directorySync('automations-');
  writeAutomation(
    home.path,
    'nightly',
    `---\nname: Nightly\nschedule: |\n  DTSTART;TZID=UTC:20261117T090000\n  RRULE:FREQ=DAILY\ncwd: ${home.path}\nstatus: active\nresume:\n  times: 2\n  while: echo open\n  prompt: Continue.\n---\nhello\n`,
  );
  // The reply of claude 2.1.325 to `--model not-a-real-model`, captured 2026-11-16: exit 1, is_error, subtype success.
  writeFakeClaude(
    home.path,
    {
      type: 'result',
      subtype: 'success',
      is_error: true,
      num_turns: 1,
      result:
        "There's an issue with the selected model (not-a-real-model). It may not exist or you may not have access to it. Run --model to pick a different model.",
      session_id: '6af7ca7f-6caf-4856-9c1b-e029137fcb91',
    },
    { exitCode: 1 },
  );
  writeFakeNotifier(home.path);

  const result = cli(home.path, ['run', 'nightly']);

  assert.equal(result.status, 1);
  const [notification] = notifications(home.path);
  assert.equal(option(notification, '-subtitle'), 'failed (exit 1)');
  assert.match(option(notification, '-message') ?? '', /^There's an issue with the selected model \(not-a-real-model\)/);
  assert.equal(claudeCalls(home.path).length, 1);
});

test('a run that outlives its timeout is stopped, notified as timed out, and run exits non-zero', () => {
  using home = new TemporaryFiles().directorySync('automations-');
  writeAutomation(
    home.path,
    'slow',
    `---\nname: Slow\nschedule: |\n  DTSTART;TZID=UTC:20261117T090000\n  RRULE:FREQ=DAILY\ncwd: ${home.path}\nstatus: active\ntimeout: PT1S\n---\nhello\n`,
  );
  writeFakeClaude(home.path, OK_REPLY, { before: 'Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 30_000);' });
  writeFakeNotifier(home.path);
  const started = performance.now();

  const result = cli(home.path, ['run', 'slow']);

  assert.ok(performance.now() - started < 15_000, 'the run was not stopped at its timeout');
  assert.equal(result.status, 124);
  const [notification] = notifications(home.path);
  assert.equal(option(notification, '-subtitle'), 'timed out');
  assert.equal(option(notification, '-message'), 'stopped after PT1S');
});

test('the timeout bounds the whole run, resumes included', () => {
  using home = new TemporaryFiles().directorySync('automations-');
  writeAutomation(
    home.path,
    'long-resume',
    `---\nname: Long resume\nschedule: |\n  DTSTART;TZID=UTC:20261117T090000\n  RRULE:FREQ=DAILY\ncwd: ${home.path}\nstatus: active\ntimeout: PT4S\nresume:\n  times: 2\n  while: echo open\n  prompt: Continue.\n---\nstart\n`,
  );
  // The first call takes 3 s and a resume 30 s: a deadline for the whole run stops the resume at about 4 s,
  // a fresh deadline for each call at about 7 s.
  writeExecutable(
    join(home.path, '.local/bin/claude'),
    `#!/usr/bin/env node
const fs = require('node:fs');
const calls = process.env.HOME + '/claude-calls.jsonl';
const first = !fs.existsSync(calls);
fs.appendFileSync(calls, JSON.stringify({ argv: process.argv.slice(2), cwd: process.cwd(), apiKey: null }) + '\\n');
Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, first ? 3_000 : 30_000);
process.stdout.write(JSON.stringify(${JSON.stringify(OK_REPLY)}));
`,
  );
  writeFakeNotifier(home.path);
  const started = performance.now();

  const result = cli(home.path, ['run', 'long-resume']);

  const elapsed = performance.now() - started;
  assert.equal(result.status, 124);
  assert.equal(claudeCalls(home.path).length, 2);
  assert.ok(elapsed < 5_500, `the run took ${Math.round(elapsed)} ms: the resume got a deadline of its own`);
  assert.equal(option(notifications(home.path)[0], '-subtitle'), 'timed out');
});

test('a run whose claude cannot start is notified as failed, and run exits non-zero', () => {
  using home = new TemporaryFiles().directorySync('automations-');
  writeAutomation(
    home.path,
    'no-claude',
    `---\nname: No claude\nschedule: |\n  DTSTART;TZID=UTC:20261117T090000\n  RRULE:FREQ=DAILY\ncwd: ${home.path}\nstatus: active\n---\nhello\n`,
  );
  writeFakeNotifier(home.path);

  const result = cli(home.path, ['run', 'no-claude']);

  assert.equal(result.status, 127);
  const [notification] = notifications(home.path);
  assert.equal(option(notification, '-subtitle'), 'failed (exit 127)');
  assert.match(option(notification, '-message') ?? '', /claude did not start/);
});

test('a resume that fails ends the run as failed, with no further resume', () => {
  using home = new TemporaryFiles().directorySync('automations-');
  writeAutomation(
    home.path,
    'breaks',
    `---\nname: Breaks\nschedule: |\n  DTSTART;TZID=UTC:20261117T090000\n  RRULE:FREQ=DAILY\ncwd: ${home.path}\nstatus: active\nresume:\n  times: 3\n  while: echo item-A\n  prompt: Continue.\n---\nstart\n`,
  );
  // The first call answers as OK_REPLY; each later call answers with the captured unknown-model error.
  writeExecutable(
    join(home.path, '.local/bin/claude'),
    `#!/usr/bin/env node
const fs = require('node:fs');
const calls = process.env.HOME + '/claude-calls.jsonl';
const first = !fs.existsSync(calls);
fs.appendFileSync(calls, JSON.stringify({ argv: process.argv.slice(2), cwd: process.cwd(), apiKey: null }) + '\\n');
process.stdout.write(JSON.stringify(first ? ${JSON.stringify(OK_REPLY)} : { type: 'result', subtype: 'success', is_error: true, num_turns: 1, result: "There's an issue with the selected model (not-a-real-model).", session_id: '${OK_REPLY.session_id}' }));
process.exitCode = first ? 0 : 1;
`,
  );
  writeFakeNotifier(home.path);

  const result = cli(home.path, ['run', 'breaks']);

  assert.equal(result.status, 1);
  assert.equal(claudeCalls(home.path).length, 2);
  assert.equal(option(notifications(home.path)[0], '-subtitle'), 'failed (exit 1)');
});

test('a paused automation does not run when its time is due', () => {
  using home = new TemporaryFiles().directorySync('automations-');
  writeAutomation(
    home.path,
    'paused',
    `---\nname: Paused\nschedule: |\n  DTSTART;TZID=UTC:${icsTime(minutesAgo(210))}\n  RRULE:FREQ=HOURLY\ncwd: ${home.path}\nstatus: paused\n---\nhello\n`,
  );
  writeFakeClaude(home.path, OK_REPLY);
  writeFakeNotifier(home.path);

  const result = cli(home.path, ['run', 'paused', '--if-due']);

  assert.equal(result.status, 0);
  assert.deepEqual(claudeCalls(home.path), []);
});

test('an automation whose first time is in the future runs only when asked to run now', () => {
  using home = new TemporaryFiles().directorySync('automations-');
  writeAutomation(
    home.path,
    'later',
    `---\nname: Later\nschedule: |\n  DTSTART;TZID=UTC:${icsTime(minutesAgo(-24 * 60))}\n  RRULE:FREQ=DAILY\ncwd: ${home.path}\nstatus: active\n---\nhello\n`,
  );
  writeFakeClaude(home.path, OK_REPLY);
  writeFakeNotifier(home.path);

  const scheduled = cli(home.path, ['run', 'later', '--if-due']);
  const callsWhenScheduled = claudeCalls(home.path).length;
  const now = cli(home.path, ['run', 'later']);

  assert.equal(scheduled.status, 0);
  assert.equal(callsWhenScheduled, 0);
  assert.equal(now.status, 0);
  assert.equal(claudeCalls(home.path).length, 1);
});

test('missed times make one run, and the next check runs nothing until a new time is due', () => {
  using home = new TemporaryFiles().directorySync('automations-');
  writeAutomation(
    home.path,
    'hourly',
    `---\nname: Hourly\nschedule: |\n  DTSTART;TZID=UTC:${icsTime(minutesAgo(210))}\n  RRULE:FREQ=HOURLY\ncwd: ${home.path}\nstatus: active\n---\nhello\n`,
  );
  writeFakeClaude(home.path, OK_REPLY);
  writeFakeNotifier(home.path);

  const first = cli(home.path, ['run', 'hourly', '--if-due']);
  const second = cli(home.path, ['run', 'hourly', '--if-due']);

  assert.equal(first.status, 0);
  assert.equal(second.status, 0);
  assert.equal(claudeCalls(home.path).length, 1);
});

test('an automation that requires AC power waits on battery and runs at the next check on AC power', () => {
  using home = new TemporaryFiles().directorySync('automations-');
  writeAutomation(
    home.path,
    'plugged',
    `---\nname: Plugged\nschedule: |\n  DTSTART;TZID=UTC:${icsTime(minutesAgo(210))}\n  RRULE:FREQ=HOURLY\ncwd: ${home.path}\nstatus: active\nrequiresAcPower: true\n---\nhello\n`,
  );
  writeFakeClaude(home.path, OK_REPLY);
  writeFakeNotifier(home.path);
  // Stands in for `pmset -g batt`; the lines are the real output of macOS 27.2, captured 2026-11-16.
  writeExecutable(join(home.path, '.local/bin/pmset'), '#!/bin/sh\ncat "$HOME/power"\n');
  writeFileSync(
    join(home.path, 'power'),
    "Now drawing from 'Battery Power'\n -InternalBattery-0 (id=23461987)\t87%; discharging; 4:10 remaining present: true\n",
  );

  const onBattery = cli(home.path, ['run', 'plugged', '--if-due']);
  const callsOnBattery = claudeCalls(home.path).length;
  writeFileSync(
    join(home.path, 'power'),
    "Now drawing from 'AC Power'\n -InternalBattery-0 (id=23461987)\t100%; charged; 0:00 remaining present: true\n",
  );
  const onAc = cli(home.path, ['run', 'plugged', '--if-due']);

  assert.equal(onBattery.status, 0);
  assert.equal(callsOnBattery, 0);
  assert.equal(onAc.status, 0);
  assert.equal(claudeCalls(home.path).length, 1);
});

test('claude runs from ~/.local/bin in the cwd with the prompt, the options and the unattended system prompt, and never with an API key', () => {
  using home = new TemporaryFiles().directorySync('automations-');
  const work = join(home.path, 'work');
  mkdirSync(work);
  writeAutomation(
    home.path,
    'docs',
    `---\nname: Docs\nschedule: |\n  DTSTART;TZID=UTC:20261117T090000\n  RRULE:FREQ=DAILY\ncwd: ${work}\nstatus: active\nmodel: sonnet\neffort: low\n---\n/update-docs next\n`,
  );
  writeFakeClaude(home.path, OK_REPLY);
  writeFakeNotifier(home.path);
  // A `claude` earlier on PATH, as a terminal's shim is; the runner must not start it.
  writeExecutable(join(home.path, 'shim/claude'), '#!/bin/sh\ntouch "$HOME/shim-started"\n');

  const result = cli(home.path, ['run', 'docs'], {
    ANTHROPIC_API_KEY: 'sk-ant-test',
    PATH: `${join(home.path, 'shim')}:${join(home.path, '.local/bin')}:${dirname(process.execPath)}:/usr/bin:/bin:/usr/sbin:/sbin`,
  });

  assert.equal(result.status, 0);
  assert.equal(existsSync(join(home.path, 'shim-started')), false);
  const [call] = claudeCalls(home.path);
  assert.equal(call?.cwd, realpathSync(work));
  assert.equal(call?.apiKey, null);
  assert.equal(option(call?.argv, '-p'), '/update-docs next');
  assert.equal(option(call?.argv, '--model'), 'sonnet');
  assert.equal(option(call?.argv, '--effort'), 'low');
  assert.equal(option(call?.argv, '--permission-prompts'), 'none');
  assert.equal(call?.argv.includes('--bare'), false);
  const system = option(call?.argv, '--append-system-prompt') ?? '';
  assert.ok(system.includes(join(home.path, '.claude/automations/docs/memory.md')), system);
  assert.ok(system.includes('A standing instruction from the user, the person you are working for.'), system);
});

test('resume continues the same session with the open items while its check says work is open, at most its times', () => {
  using home = new TemporaryFiles().directorySync('automations-');
  const work = join(home.path, 'ledger-work');
  mkdirSync(work);
  writeAutomation(
    home.path,
    'ledger',
    `---\nname: Ledger\nschedule: |\n  DTSTART;TZID=UTC:20261117T090000\n  RRULE:FREQ=DAILY\ncwd: ${work}\nstatus: active\nmodel: sonnet\neffort: low\nresume:\n  times: 2\n  while: basename "$PWD"\n  prompt: "Open items:\\n{stdout}\\nContinue with them."\n---\nstart\n`,
  );
  writeFakeClaude(home.path, OK_REPLY);
  writeFakeNotifier(home.path);

  const result = cli(home.path, ['run', 'ledger']);

  assert.equal(result.status, 0);
  const calls = claudeCalls(home.path);
  assert.equal(calls.length, 3);
  assert.equal(option(calls[0]?.argv, '--resume'), undefined);
  for (const call of calls.slice(1)) {
    assert.equal(option(call.argv, '--resume'), OK_REPLY.session_id);
    assert.equal(option(call.argv, '-p'), 'Open items:\nledger-work\nContinue with them.');
    assert.equal(option(call.argv, '--model'), 'sonnet');
    assert.equal(option(call.argv, '--effort'), 'low');
    assert.equal(option(call.argv, '--permission-prompts'), 'none');
    assert.equal(option(call.argv, '--append-system-prompt'), option(calls[0]?.argv, '--append-system-prompt'));
  }
});

test('resume does not continue a session whose check says no work is open', () => {
  using home = new TemporaryFiles().directorySync('automations-');
  writeAutomation(
    home.path,
    'finished',
    `---\nname: Finished\nschedule: |\n  DTSTART;TZID=UTC:20261117T090000\n  RRULE:FREQ=DAILY\ncwd: ${home.path}\nstatus: active\nresume:\n  times: 2\n  while: exit 1\n  prompt: Continue.\n---\nstart\n`,
  );
  writeFakeClaude(home.path, OK_REPLY);
  writeFakeNotifier(home.path);

  const result = cli(home.path, ['run', 'finished']);

  assert.equal(result.status, 0);
  assert.equal(claudeCalls(home.path).length, 1);
});

test('the notification of a run names it, gives the first line of the reply, and its click resumes the session in the cwd', () => {
  using home = new TemporaryFiles().directorySync('automations-');
  const work = join(home.path, 'my work');
  mkdirSync(work);
  writeAutomation(
    home.path,
    'digest',
    `---\nname: Ezz's digest\nschedule: |\n  DTSTART;TZID=UTC:20261117T090000\n  RRULE:FREQ=WEEKLY\ncwd: ${work}\nstatus: active\n---\nwrite the digest\n`,
  );
  writeFakeClaude(home.path, { ...OK_REPLY, result: 'The digest is in digest.md.\n\nDetails follow.' });
  writeFakeNotifier(home.path);

  const result = cli(home.path, ['run', 'digest']);

  assert.equal(result.status, 0);
  const [notification] = notifications(home.path);
  assert.equal(option(notification, '-title'), "Ezz's digest");
  assert.equal(option(notification, '-subtitle'), 'done');
  assert.equal(option(notification, '-message'), 'The digest is in digest.md.');
  // terminal-notifier runs the click command with /bin/sh; printf in place of cmux shows the words cmux gets.
  const click = option(notification, '-execute') ?? '';
  const words = execFileSync('/bin/sh', ['-c', click.replace(/^\S+/, "printf '%s\\n'")], { encoding: 'utf8' });
  assert.deepEqual(words.trimEnd().split('\n'), [
    'workspace',
    'create',
    '--name',
    "Ezz's digest",
    '--cwd',
    work,
    '--command',
    `claude --resume ${OK_REPLY.session_id}`,
  ]);
});

test('with no terminal-notifier, the notification of a run comes from the osascript of macOS', () => {
  using home = new TemporaryFiles().directorySync('automations-');
  writeAutomation(
    home.path,
    'digest',
    `---\nname: Ezz's "digest"\nschedule: |\n  DTSTART;TZID=UTC:20261117T090000\n  RRULE:FREQ=WEEKLY\ncwd: ${home.path}\nstatus: active\n---\nwrite the digest\n`,
  );
  writeFakeClaude(home.path, { ...OK_REPLY, result: 'The digest is in digest.md.\n\nDetails follow.' });
  writeExecutable(
    join(home.path, '.local/bin/osascript'),
    `#!/usr/bin/env node
require('node:fs').appendFileSync(process.env.HOME + '/notifications.jsonl', JSON.stringify(process.argv.slice(2)) + '\\n');
`,
  );

  const result = cli(home.path, ['run', 'digest']);

  assert.equal(result.status, 0);
  const [argv = []] = notifications(home.path);
  // osascript takes the script lines after -e and gives the words after them to `on run argv`.
  const script = argv.flatMap((word, index) => (argv[index - 1] === '-e' ? ['-e', word] : []));
  const values = argv.slice(argv.lastIndexOf('-e') + 2);
  assert.deepEqual(values, [`Ezz's "digest"`, 'done', 'The digest is in digest.md.']);
  // osacompile checks the script the way osascript reads it, with no notification shown.
  assert.equal(spawnSync('/usr/bin/osacompile', ['-o', join(home.path, 'notify.scpt'), ...script]).status, 0);
});

test('the Mac is held awake while claude runs', () => {
  using home = new TemporaryFiles().directorySync('automations-');
  writeAutomation(
    home.path,
    'awake',
    `---\nname: Awake\nschedule: |\n  DTSTART;TZID=UTC:20261117T090000\n  RRULE:FREQ=DAILY\ncwd: ${home.path}\nstatus: active\n---\nhello\n`,
  );
  // The fake asks the real power management for an assertion made on behalf of its runner, its parent.
  writeFakeClaude(home.path, OK_REPLY, {
    before: `const { execFileSync } = require('node:child_process');
const deadline = Date.now() + 3000;
let caffeinated = false;
while (!caffeinated && Date.now() < deadline) {
  caffeinated = execFileSync('pmset', ['-g', 'assertions'], { encoding: 'utf8' })
    .split(/\\n(?=\\s+pid \\d+\\()/)
    .some((block) => block.includes('PreventUserIdleSystemSleep') && block.includes('caffeinate asserting on behalf of Process ID ' + process.ppid + '\\n'));
}
globalThis.extra = { caffeinated };`,
  });
  writeFakeNotifier(home.path);

  const result = cli(home.path, ['run', 'awake']);

  assert.equal(result.status, 0);
  assert.equal(claudeCalls(home.path)[0]?.caffeinated, true);
});

test('list gives the next time of an every-3-days rule and the last run', () => {
  using home = new TemporaryFiles().directorySync('automations-');
  const id = `t${process.pid}x${Date.now().toString(36)}-every-three`;
  const start = minutesAgo(24 * 60).round({ smallestUnit: 'second', roundingMode: 'floor' });
  writeAutomation(
    home.path,
    id,
    `---\nname: Every three days\nschedule: |\n  DTSTART;TZID=UTC:${icsTime(start)}\n  RRULE:FREQ=DAILY;INTERVAL=3\ncwd: ${home.path}\nstatus: active\n---\nhello\n`,
  );
  writeFakeClaude(home.path, OK_REPLY);
  writeFakeNotifier(home.path);
  cli(home.path, ['run', id]);

  const result = cli(home.path, ['list', '--json']);

  assert.equal(result.status, 0);
  const [row] = JSON.parse(result.stdout).automations;
  assert.equal(row.id, id);
  assert.equal(row.status, 'active');
  assert.equal(row.timeout, 'PT2H');
  assert.equal(row.next, start.add({ days: 3 }).toString());
  assert.equal(row.lastExit, 0);
  assert.ok(Temporal.Instant.compare(Temporal.Instant.from(row.lastRunAt), start.toInstant()) > 0);
  assert.equal(row.installed, false);
});

test('sync installs a launchd job for each active automation, launchd runs it through the job environment only when due, and sync removes the jobs of paused and deleted automations and no other', async () => {
  using home = new TemporaryFiles().directorySync('automations-');
  const unique = `t${process.pid}x${Date.now().toString(36)}`;
  const [due, half, minutely, zoned] = [`${unique}-due`, `${unique}-half`, `${unique}-minutely`, `${unique}-zoned`];
  const target = (id: string) => `gui/${process.getuid?.()}/com.ezzabuzaid.automations.${id}`;
  const jobFile = (id: string) => join(home.path, 'Library/LaunchAgents', `com.ezzabuzaid.automations.${id}.plist`);
  const job = (id: string) => JSON.parse(execFileSync('plutil', ['-convert', 'json', '-o', '-', jobFile(id)], { encoding: 'utf8' }));
  const loaded = (id: string) => spawnSync('launchctl', ['print', target(id)]).status === 0;
  const listed = (id: string) => JSON.parse(cli(home.path, ['list', '--json']).stdout).automations.find((row: { id: string }) => row.id === id);
  const finished = (id: string) => {
    const printed = spawnSync('launchctl', ['print', target(id)], { encoding: 'utf8' }).stdout;
    return /^\truns = [1-9]/m.test(printed) && /^\tstate = not running/m.test(printed);
  };
  // launchd counts in the zone of the Mac, so these rules are written in it.
  const zone = Temporal.Now.timeZoneId();
  const start = Temporal.Now.zonedDateTimeISO(zone).subtract({ minutes: 210 }).round({ smallestUnit: 'second', roundingMode: 'floor' });
  const future = Temporal.Now.zonedDateTimeISO(zone).add({ days: 7 });
  // A zone whose offset has other minutes than the Mac's: launchd must get the minute of the Mac's clock.
  const otherZone = Temporal.Now.zonedDateTimeISO(zone).offset.endsWith(':45') ? 'Asia/Kolkata' : 'Asia/Kathmandu';
  const zonedStart = Temporal.Now.zonedDateTimeISO(otherZone).add({ days: 7 }).round({ smallestUnit: 'second', roundingMode: 'floor' });
  try {
    writeAutomation(
      home.path,
      due,
      `---\nname: Due\nschedule: |\n  DTSTART;TZID=${zone}:${icsTime(start)}\n  RRULE:FREQ=HOURLY\ncwd: ${home.path}\nstatus: active\n---\nhello from launchd\n`,
    );
    writeAutomation(
      home.path,
      half,
      `---\nname: Half\nschedule: |\n  DTSTART;TZID=${zone}:${icsTime(future)}\n  RRULE:FREQ=WEEKLY;BYMINUTE=0,30\ncwd: ${home.path}\nstatus: active\n---\nhello\n`,
    );
    writeAutomation(
      home.path,
      minutely,
      `---\nname: Minutely\nschedule: |\n  DTSTART;TZID=${zone}:${icsTime(future)}\n  RRULE:FREQ=MINUTELY;INTERVAL=5\ncwd: ${home.path}\nstatus: active\n---\nhello\n`,
    );
    writeAutomation(
      home.path,
      zoned,
      `---\nname: Zoned\nschedule: |\n  DTSTART;TZID=${otherZone}:${icsTime(zonedStart)}\n  RRULE:FREQ=DAILY\ncwd: ${home.path}\nstatus: active\n---\nhello\n`,
    );
    writeFakeClaude(home.path, OK_REPLY);
    writeFakeNotifier(home.path);

    const installed = cli(home.path, ['sync']);

    assert.equal(installed.status, 0, installed.stderr);
    assert.deepEqual(job(due).StartCalendarInterval, [{ Minute: start.minute }]);
    assert.deepEqual(job(half).StartCalendarInterval, [{ Minute: 0 }, { Minute: 30 }]);
    assert.deepEqual(job(minutely).StartCalendarInterval, {});
    assert.deepEqual(job(zoned).StartCalendarInterval, [{ Minute: zonedStart.withTimeZone(zone).minute }]);
    // A plugin keeps each version in its own folder: the job runs a copy of the bundle that the next sync replaces.
    const runner = join(home.path, '.claude/automations/runner.mjs');
    assert.equal(job(due).ProgramArguments[1], runner);
    assert.equal(readFileSync(runner, 'utf8'), readFileSync(BUNDLE, 'utf8'));
    // The hooks of the user's settings run a bare `node`: the job finds the node that installed it first.
    assert.equal(job(due).EnvironmentVariables.PATH.split(':')[0], dirname(process.execPath));
    assert.equal(listed(due).installed, true);

    // A change to the prompt applies at the next run, with no sync.
    writeAutomation(
      home.path,
      due,
      `---\nname: Due\nschedule: |\n  DTSTART;TZID=${zone}:${icsTime(start)}\n  RRULE:FREQ=HOURLY\ncwd: ${home.path}\nstatus: active\n---\nhello after an edit\n`,
    );
    execFileSync('launchctl', ['kickstart', target(due)]);
    const log = join(home.path, '.claude/automations', due, 'run.log');
    for (const deadline = Date.now() + 30_000; Date.now() < deadline; await sleep(250)) {
      if (existsSync(log) && readFileSync(log, 'utf8').includes('ends:')) break;
    }
    assert.match(readFileSync(log, 'utf8'), /ends: done/);
    assert.equal(option(claudeCalls(home.path)[0]?.argv, '-p'), 'hello after an edit');
    assert.equal(notifications(home.path).length, 1);

    execFileSync('launchctl', ['kickstart', target(half)]);
    for (const deadline = Date.now() + 30_000; Date.now() < deadline && !finished(half); ) await sleep(250);
    assert.equal(finished(half), true);
    assert.equal(claudeCalls(home.path).length, 1);

    writeAutomation(
      home.path,
      half,
      `---\nname: Half\nschedule: |\n  DTSTART;TZID=${zone}:${icsTime(future)}\n  RRULE:FREQ=WEEKLY;BYMINUTE=0,30\ncwd: ${home.path}\nstatus: paused\n---\nhello\n`,
    );
    rmSync(join(home.path, '.claude/automations', minutely), { recursive: true });
    // Another program's agent in the same folder.
    const foreign = join(home.path, 'Library/LaunchAgents/com.example.other.plist');
    writeFileSync(
      foreign,
      '<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0"><dict><key>Label</key><string>com.example.other</string><key>Program</key><string>/usr/bin/true</string></dict></plist>\n',
    );
    const removed = cli(home.path, ['sync']);

    assert.equal(removed.status, 0, removed.stderr);
    assert.equal(loaded(due), true);
    assert.equal(loaded(half), false);
    assert.equal(loaded(minutely), false);
    assert.equal(existsSync(jobFile(half)), false);
    assert.equal(existsSync(jobFile(minutely)), false);
    assert.equal(existsSync(foreign), true);
    assert.deepEqual(
      (({ status, next, installed }) => ({ status, next, installed }))(listed(half)),
      { status: 'paused', next: null, installed: false },
    );
  } finally {
    for (const id of [due, half, minutely, zoned]) spawnSync('launchctl', ['bootout', target(id)]);
  }
});

test('the committed bundle is what build.ts makes of the source', async () => {
  const { outputFiles } = await build({ ...options, write: false, logLevel: 'silent' });

  assert.equal(outputFiles[0]?.text, readFileSync(BUNDLE, 'utf8'), 'dist/automations.mjs is stale: run npm run build');
});

test('the bundle runs alone, with no node_modules beside it, as the plugin installs it', () => {
  using home = new TemporaryFiles().directorySync('automations-');
  const alone = join(home.path, 'plugin/automations.mjs');
  mkdirSync(dirname(alone));
  writeFileSync(alone, readFileSync(BUNDLE));
  writeAutomation(
    home.path,
    'digest',
    `---\nname: Digest\nschedule: |\n  DTSTART;TZID=UTC:20261117T090000\n  RRULE:FREQ=WEEKLY\ncwd: ${home.path}\nstatus: paused\n---\nwrite the digest\n`,
  );

  const result = spawnSync(process.execPath, [alone, 'list', '--json'], { cwd: dirname(alone), encoding: 'utf8', env: { HOME: home.path, PATH: '/usr/bin:/bin' } });

  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).automations[0].status, 'paused');
});
