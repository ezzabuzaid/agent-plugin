#!/usr/bin/env node
// Local automations: Claude Code prompts that run headless on this Mac at the times of an RFC 5545
// schedule, through launchd and `claude -p` on the login of the Claude plan. The skill that writes
// them: agent-plugin/skills/automations/SKILL.md.
//
//   node cli.ts sync                 check every automation, install a launchd job for each active one, remove the rest
//   node cli.ts run <id> [--if-due]  run one automation now; with --if-due, only when its schedule has a time due
//   node cli.ts list [--json]        the automations, their next run and their last run

import { atomicWrite, isErrno } from '@zukhruf/fs';
import { type AgentJob, type CalendarInterval, isAbsolutePath, Launchd } from '@zukhruf/launchd';
import { RRuleTemporal } from 'rrule-temporal';
import { parse as parseYaml } from 'yaml';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { readdir, readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, isAbsolute, join } from 'node:path';
import { parseArgs } from 'node:util';

const HOME = homedir();
const AUTOMATIONS = join(HOME, '.claude/automations');
const LABEL_PREFIX = 'com.ezzabuzaid.automations.';
// The native installer's link; auto-update moves it to each new version. The `claude` on PATH can be a
// terminal's shim in a temporary folder.
const CLAUDE = join(HOME, '.local/bin/claude');
const CMUX = '/Applications/cmux.app/Contents/Resources/bin/cmux';
const DEFAULT_TIMEOUT = 'PT2H';
// The Opus 5.5 prompting guide, "Unattended agentic runs", the system-prompt addition, verbatim:
// https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5-5
const UNATTENDED =
  "A standing instruction from the user, the person you are working for. It is about how your turns end. A message with no tool call in it ends your turn, and the work stops there until you are asked to continue. The user has seen you end turns in four ways while work they asked for was still owed, and does not want any of them. One: a long summary of what was done that closes by announcing the next step and has no tool call, so the next thing never starts. Two: an offer to carry on with something unless the user would prefer otherwise, which stops to wait for an answer the user was not going to give. Three: a list of decisions for the user when, by your own account, none of them blocks the rest of the work. Four: deciding that this is a good place to report, because the turn has been long or a milestone is done. Status notes are welcome, and so are your recommendations on open decisions, but put them in the same message as your next tool call and carry on with whatever does not depend on the user's answer. If you notice yourself inviting the user to redirect you or offering to wait, delete it and do the next thing. The stops the user does want are the ones where nothing can move without them, or where the thing blocking you is deliberately protected from you. This does not override the need for confirmation on risky or destructive actions.";

/** An automation that cannot run as written. `sync` reports every one of them, and installs nothing. */
class AutomationError extends Error {
  constructor(id: string, reason: string) {
    super(`${id}: ${reason}`);
    this.name = 'AutomationError';
  }
}

/** DTSTART and RRULE (RFC 5545). The only source of truth for when an automation runs. */
class Schedule {
  readonly #rule: RRuleTemporal;

  constructor(text: string) {
    this.#rule = new RRuleTemporal({ rruleString: text.trim() });
  }

  /** A time of the schedule falls after `since` (with no `since`: at or after DTSTART), and at or before `now`. */
  isDue(since: Temporal.Instant | undefined, now: Temporal.Instant): boolean {
    const { dtstart } = this.#rule.options();
    const start = since?.toZonedDateTimeISO(dtstart.timeZoneId) ?? dtstart;
    return this.#rule
      .between(start, now.toZonedDateTimeISO(dtstart.timeZoneId), true)
      .some((time) => since === undefined || Temporal.Instant.compare(time.toInstant(), since) > 0);
  }

  next(now: Temporal.Instant): Temporal.ZonedDateTime | null {
    return this.#rule.next(now.toZonedDateTimeISO(this.#rule.options().dtstart.timeZoneId));
  }

  /** When launchd checks the schedule: each hour at the minutes of the rule, or each minute for a finer rule. */
  calendar(): CalendarInterval | CalendarInterval[] {
    const { freq, byMinute, dtstart } = this.#rule.options();
    if (freq === 'SECONDLY' || freq === 'MINUTELY') return {};
    // launchd counts in the time zone of the Mac; the rule counts in the zone of its DTSTART.
    const shift = dtstart.withTimeZone(Temporal.Now.timeZoneId()).minute - dtstart.minute;
    return (byMinute ?? [dtstart.minute]).map((minute) => ({ Minute: Schedule.#minute(minute + shift) }));
  }

  static #minute(value: number): CalendarInterval['Minute'] {
    // A whole number modulo 60 is 0-59, the union of the type; TypeScript cannot follow the arithmetic.
    return (((value % 60) + 60) % 60) as CalendarInterval['Minute'];
  }
}

interface Resume {
  readonly times: number;
  readonly while: string;
  readonly prompt: string;
}

/** ~/.claude/automations/<id>/automation.md: YAML frontmatter, then the prompt. */
class Automation {
  readonly id: string;
  readonly folder: string;
  readonly name: string;
  readonly schedule: Schedule;
  readonly cwd: string;
  readonly status: 'active' | 'paused';
  readonly prompt: string;
  readonly model: string | undefined;
  readonly effort: string | undefined;
  readonly timeout: string;
  readonly timeoutMs: number;
  readonly requiresAcPower: boolean;
  readonly resume: Resume | undefined;

  private constructor(id: string, frontmatter: Record<string, unknown>, prompt: string) {
    this.id = id;
    this.folder = join(AUTOMATIONS, id);
    this.prompt = prompt;
    this.name = Automation.#text(id, frontmatter, 'name');
    try {
      this.schedule = new Schedule(Automation.#text(id, frontmatter, 'schedule'));
    } catch (error) {
      if (error instanceof AutomationError) throw error;
      throw new AutomationError(id, `schedule: ${messageOf(error)}`);
    }
    this.cwd = Automation.#text(id, frontmatter, 'cwd');
    if (!isAbsolute(this.cwd)) throw new AutomationError(id, `cwd: ${this.cwd} is not an absolute folder`);
    const status = frontmatter.status;
    if (status !== 'active' && status !== 'paused') {
      throw new AutomationError(id, `status: must be active or paused, not ${String(status)}`);
    }
    this.status = status;
    this.model = Automation.#optionalText(id, frontmatter, 'model');
    this.effort = Automation.#optionalText(id, frontmatter, 'effort');
    this.timeout = Automation.#optionalText(id, frontmatter, 'timeout') ?? DEFAULT_TIMEOUT;
    this.timeoutMs = Automation.#milliseconds(id, this.timeout);
    const requiresAcPower = frontmatter.requiresAcPower ?? false;
    if (typeof requiresAcPower !== 'boolean') throw new AutomationError(id, 'requiresAcPower: must be true or false');
    this.requiresAcPower = requiresAcPower;
    this.resume = Automation.#resume(id, frontmatter.resume);
  }

  static async read(id: string): Promise<Automation> {
    if (!/^[a-z0-9-]+$/.test(id)) {
      throw new AutomationError(id, 'the id (the folder name) may have only the characters a-z0-9 and -');
    }
    let text: string;
    try {
      text = await readFile(join(AUTOMATIONS, id, 'automation.md'), 'utf8');
    } catch (error) {
      if (isErrno(error, 'ENOENT')) throw new AutomationError(id, 'the folder has no automation.md');
      throw error;
    }
    const match = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(text);
    if (match === null) throw new AutomationError(id, 'automation.md must start with a --- frontmatter block');
    let frontmatter: unknown;
    try {
      frontmatter = parseYaml(match[1] ?? '');
    } catch (error) {
      throw new AutomationError(id, `frontmatter: ${messageOf(error)}`);
    }
    if (typeof frontmatter !== 'object' || frontmatter === null || Array.isArray(frontmatter)) {
      throw new AutomationError(id, 'frontmatter: must be a YAML mapping');
    }
    const prompt = (match[2] ?? '').trim();
    if (prompt === '') throw new AutomationError(id, 'the prompt (the text after the frontmatter) is empty');
    return new Automation(id, frontmatter as Record<string, unknown>, prompt);
  }

  /** Every automation under ~/.claude/automations, and the reason of each one that cannot run. */
  static async readAll(): Promise<{ automations: Automation[]; errors: AutomationError[] }> {
    let ids: string[];
    try {
      const entries = await readdir(AUTOMATIONS, { withFileTypes: true });
      ids = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
    } catch (error) {
      if (!isErrno(error, 'ENOENT')) throw error;
      ids = [];
    }
    const automations: Automation[] = [];
    const errors: AutomationError[] = [];
    for (const id of ids.sort()) {
      try {
        automations.push(await Automation.read(id));
      } catch (error) {
        if (!(error instanceof AutomationError)) throw error;
        errors.push(error);
      }
    }
    return { automations, errors };
  }

  static #text(id: string, frontmatter: Record<string, unknown>, key: string): string {
    const value = Automation.#optionalText(id, frontmatter, key);
    if (value === undefined) throw new AutomationError(id, `${key}: is required`);
    return value;
  }

  static #optionalText(id: string, frontmatter: Record<string, unknown>, key: string): string | undefined {
    const value = frontmatter[key];
    if (value === undefined || value === null) return undefined;
    if (typeof value !== 'string' || value.trim() === '') throw new AutomationError(id, `${key}: must be text`);
    return value;
  }

  static #milliseconds(id: string, timeout: string): number {
    let milliseconds: number;
    try {
      milliseconds = Temporal.Duration.from(timeout).total({ unit: 'milliseconds' });
    } catch {
      throw new AutomationError(id, `timeout: ${timeout} is not an ISO 8601 duration such as PT75M`);
    }
    if (!(milliseconds > 0)) throw new AutomationError(id, `timeout: ${timeout} is not longer than zero`);
    return milliseconds;
  }

  static #resume(id: string, value: unknown): Resume | undefined {
    if (value === undefined || value === null) return undefined;
    if (typeof value !== 'object' || Array.isArray(value)) {
      throw new AutomationError(id, 'resume: must be a mapping with times, while and prompt');
    }
    const fields = value as Record<string, unknown>;
    const times = fields.times;
    if (typeof times !== 'number' || !Number.isInteger(times) || times < 1) {
      throw new AutomationError(id, 'resume.times: must be a whole number of 1 or more');
    }
    const check = fields.while;
    const prompt = fields.prompt;
    if (typeof check !== 'string' || check.trim() === '') throw new AutomationError(id, 'resume.while: must be a shell command');
    if (typeof prompt !== 'string' || prompt.trim() === '') throw new AutomationError(id, 'resume.prompt: must be text');
    return { times, while: check, prompt };
  }
}

interface State {
  readonly lastRunAt: string;
  readonly exitCode: number;
  readonly sessionId?: string;
}

/** <folder>/state.json: the runner's record of the last run. */
class StateFile {
  static async read(folder: string): Promise<State | undefined> {
    try {
      return JSON.parse(await readFile(join(folder, 'state.json'), 'utf8')) as State;
    } catch (error) {
      if (isErrno(error, 'ENOENT')) return undefined;
      throw error;
    }
  }

  static async write(folder: string, state: State): Promise<void> {
    await atomicWrite(join(folder, 'state.json'), `${JSON.stringify(state, null, 2)}\n`, { clock: globalThis });
  }
}

type Outcome =
  | { readonly kind: 'done'; readonly result: string; readonly sessionId: string }
  | { readonly kind: 'failed'; readonly exitCode: number; readonly result: string; readonly sessionId?: string }
  | { readonly kind: 'timed out'; readonly sessionId?: string };

/** One fire of one automation: the check, the claude session and its resumes, the record and the notification. */
class Runner {
  readonly #automation: Automation;

  constructor(automation: Automation) {
    this.#automation = automation;
  }

  async fire({ ifDue }: { ifDue: boolean }): Promise<number> {
    const automation = this.#automation;
    const now = Temporal.Now.instant();
    if (ifDue) {
      if (automation.status === 'paused') return 0;
      const state = await StateFile.read(automation.folder);
      const since = state === undefined ? undefined : Temporal.Instant.from(state.lastRunAt);
      if (!automation.schedule.isDue(since, now)) return 0;
      if (automation.requiresAcPower && (await this.#onBattery())) {
        this.#log('on battery power: skipped; a check on AC power runs it');
        return 0;
      }
    }
    // The Mac stays awake until this process ends: the session, its resumes and the notification.
    spawn('caffeinate', ['-is', '-w', String(process.pid)], { stdio: 'ignore' }).unref();
    this.#log('starts');
    const outcome = await this.#session(AbortSignal.timeout(automation.timeoutMs));
    const exitCode = Runner.#exitCode(outcome);
    await StateFile.write(automation.folder, {
      lastRunAt: now.toString(),
      exitCode,
      ...(outcome.sessionId === undefined ? {} : { sessionId: outcome.sessionId }),
    });
    await this.#notify(outcome);
    this.#log(`ends: ${outcome.kind}${outcome.sessionId === undefined ? '' : `, session ${outcome.sessionId}`}`);
    return exitCode;
  }

  static #exitCode(outcome: Outcome): number {
    switch (outcome.kind) {
      case 'done':
        return 0;
      case 'timed out':
        return 124;
      case 'failed':
        return outcome.exitCode;
    }
  }

  async #session(signal: AbortSignal): Promise<Outcome> {
    const { prompt, resume } = this.#automation;
    let outcome = await this.#claude(prompt, undefined, signal);
    for (let count = 0; resume !== undefined && count < resume.times && outcome.kind === 'done'; count++) {
      const check = await this.#spawn('/bin/sh', ['-c', resume.while], signal);
      if (check.timedOut) return { kind: 'timed out', sessionId: outcome.sessionId };
      if (check.exitCode !== 0) break;
      outcome = await this.#claude(resume.prompt.replaceAll('{stdout}', check.stdout.trim()), outcome.sessionId, signal);
    }
    return outcome;
  }

  async #claude(prompt: string, sessionId: string | undefined, signal: AbortSignal): Promise<Outcome> {
    const { model, effort } = this.#automation;
    const args = ['-p', prompt, '--output-format', 'json', '--permission-prompts', 'none'];
    args.push('--append-system-prompt', this.#systemPrompt());
    if (model !== undefined) args.push('--model', model);
    if (effort !== undefined) args.push('--effort', effort);
    if (sessionId !== undefined) args.push('--resume', sessionId);
    let run: { exitCode: number; stdout: string; timedOut: boolean };
    try {
      run = await this.#spawn(CLAUDE, args, signal);
    } catch (error) {
      return { kind: 'failed', exitCode: 127, result: `claude did not start: ${messageOf(error)}`, sessionId };
    }
    if (run.timedOut) return { kind: 'timed out', sessionId };
    const reply = Runner.#reply(run.stdout);
    if (run.exitCode === 0 && reply !== undefined && !reply.isError) {
      return { kind: 'done', result: reply.result, sessionId: reply.sessionId };
    }
    return {
      kind: 'failed',
      exitCode: run.exitCode === 0 ? 1 : run.exitCode,
      result: reply?.result ?? `claude exited ${run.exitCode} with no JSON reply`,
      sessionId: reply?.sessionId ?? sessionId,
    };
  }

  // The same text on each resume: a changed system prompt invalidates the earlier thinking blocks.
  #systemPrompt(): string {
    const { id, name, folder } = this.#automation;
    return [
      `This is an unattended run of the scheduled automation "${name}" (${id}).`,
      `Its memory file is ${join(folder, 'memory.md')}. Read it first when it exists. Before you finish, append to it what the next run needs to know.`,
      '',
      UNATTENDED,
    ].join('\n');
  }

  /** Runs in the cwd of the automation, on the login of the Claude plan: an API key would bill the API. */
  async #spawn(file: string, args: string[], signal: AbortSignal) {
    if (signal.aborted) return { exitCode: 124, stdout: '', timedOut: true };
    const env = { ...process.env };
    delete env.ANTHROPIC_API_KEY;
    const child = spawn(file, args, { cwd: this.#automation.cwd, env, stdio: ['ignore', 'pipe', 'inherit'] });
    const stop = () => {
      child.kill('SIGTERM');
      setTimeout(() => child.kill('SIGKILL'), 10_000).unref();
    };
    signal.addEventListener('abort', stop, { once: true });
    let stdout = '';
    child.stdout.setEncoding('utf8').on('data', (chunk: string) => (stdout += chunk));
    try {
      const [code] = (await once(child, 'close')) as [number | null];
      return { exitCode: code ?? 1, stdout, timedOut: signal.aborted };
    } finally {
      signal.removeEventListener('abort', stop);
    }
  }

  static #reply(stdout: string): { result: string; sessionId: string; isError: boolean } | undefined {
    let value: unknown;
    try {
      value = JSON.parse(stdout);
    } catch {
      return undefined;
    }
    if (typeof value !== 'object' || value === null) return undefined;
    const { result, session_id: sessionId, is_error: isError } = value as Record<string, unknown>;
    if (typeof sessionId !== 'string' || typeof isError !== 'boolean') return undefined;
    return { result: typeof result === 'string' ? result : '', sessionId, isError };
  }

  async #notify(outcome: Outcome): Promise<void> {
    const { id, name, cwd, timeout } = this.#automation;
    const subtitle = outcome.kind === 'failed' ? `failed (exit ${outcome.exitCode})` : outcome.kind;
    const message =
      outcome.kind === 'timed out' ? `stopped after ${timeout}` : (outcome.result.trim().split('\n')[0] ?? '');
    const args = ['-title', name, '-subtitle', subtitle, '-message', message || '(no reply)', '-group', LABEL_PREFIX + id];
    if (outcome.sessionId !== undefined) {
      const resume = `claude --resume ${outcome.sessionId}`;
      args.push('-execute', `${CMUX} workspace create --name ${quote(name)} --cwd ${quote(cwd)} --command ${quote(resume)}`);
    }
    try {
      const notifier = spawn('terminal-notifier', args, { stdio: 'ignore' });
      await once(notifier, 'close');
    } catch (error) {
      this.#log(`no notification: ${messageOf(error)}`);
    }
  }

  async #onBattery(): Promise<boolean> {
    const pmset = spawn('pmset', ['-g', 'batt'], { stdio: ['ignore', 'pipe', 'ignore'] });
    let stdout = '';
    pmset.stdout.setEncoding('utf8').on('data', (chunk: string) => (stdout += chunk));
    await once(pmset, 'close');
    return stdout.includes("'Battery Power'");
  }

  #log(message: string): void {
    console.log(`${new Date().toISOString()} ${this.#automation.id}: ${message}`);
  }
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function quote(text: string): string {
  return `'${text.replaceAll("'", `'\\''`)}'`;
}

/** One launchd agent for each active automation; the agents of paused and deleted automations go. */
class Sync {
  readonly #launchd = Launchd.agents({ clock: globalThis });

  async run(): Promise<number> {
    const { automations, errors } = await Automation.readAll();
    if (errors.length > 0) {
      for (const error of errors) console.error(error.message);
      console.error('Nothing was installed. Fix these automations, then run sync again.');
      return 1;
    }
    const active = automations.filter((automation) => automation.status === 'active');
    for (const automation of active) {
      const service = await this.#launchd.install(this.#job(automation));
      console.log(`installed ${service.label}`);
    }
    const keep = new Set(active.map((automation) => LABEL_PREFIX + automation.id));
    for (const service of await this.#launchd.installed()) {
      if (!service.label.startsWith(LABEL_PREFIX) || keep.has(service.label)) continue;
      await service.uninstall({ signal: AbortSignal.timeout(30_000) });
      console.log(`removed ${service.label}`);
    }
    return 0;
  }

  #job(automation: Automation): AgentJob {
    const log = join(automation.folder, 'run.log');
    const node = process.execPath;
    if (!isAbsolutePath(log) || !isAbsolutePath(node)) throw new Error(`${log} or ${node} is not absolute`);
    return {
      Label: LABEL_PREFIX + automation.id,
      ProgramArguments: [node, import.meta.filename, 'run', automation.id, '--if-due'],
      EnvironmentVariables: {
        HOME,
        // node first: the hooks of the user's settings run a bare `node`.
        PATH: [dirname(node), join(HOME, '.local/bin'), '/opt/homebrew/bin', '/usr/local/bin', '/usr/bin', '/bin', '/usr/sbin', '/sbin'].join(':'),
      },
      StartCalendarInterval: automation.schedule.calendar(),
      StandardOutPath: log,
      StandardErrorPath: log,
    };
  }
}

async function list({ json }: { json: boolean }): Promise<void> {
  const { automations, errors } = await Automation.readAll();
  const launchd = Launchd.agents({ clock: globalThis });
  const now = Temporal.Now.instant();
  const rows = await Promise.all(
    automations.map(async (automation) => {
      const state = await StateFile.read(automation.folder);
      const service = await launchd.service(LABEL_PREFIX + automation.id).state();
      return {
        id: automation.id,
        name: automation.name,
        status: automation.status,
        timeout: automation.timeout,
        next: automation.status === 'active' ? (automation.schedule.next(now)?.toString() ?? null) : null,
        lastRunAt: state?.lastRunAt ?? null,
        lastExit: state?.exitCode ?? null,
        installed: service.state !== 'not loaded',
      };
    }),
  );
  if (json) {
    console.log(JSON.stringify({ automations: rows, errors: errors.map((error) => error.message) }, null, 2));
    return;
  }
  for (const row of rows) {
    console.log(
      `${row.id}  ${row.status}${row.status === 'active' && !row.installed ? ' (not installed: run sync)' : ''}  next ${row.next ?? '-'}  last ${row.lastRunAt ?? '-'} (exit ${row.lastExit ?? '-'})`,
    );
  }
  for (const error of errors) console.error(error.message);
}

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: { 'if-due': { type: 'boolean', default: false }, json: { type: 'boolean', default: false } },
});
const [command, id] = positionals;
if (command === 'sync') {
  process.exitCode = await new Sync().run();
} else if (command === 'run' && id !== undefined) {
  try {
    process.exitCode = await new Runner(await Automation.read(id)).fire({ ifDue: values['if-due'] });
  } catch (error) {
    if (!(error instanceof AutomationError)) throw error;
    console.error(error.message);
    process.exitCode = 1;
  }
} else if (command === 'list') {
  await list({ json: values.json });
} else {
  console.error('usage: node cli.ts sync | run <id> [--if-due] | list [--json]');
  process.exitCode = 2;
}
