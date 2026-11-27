import { readFile } from 'node:fs/promises';
import { availableParallelism } from 'node:os';
import { basename, dirname } from 'node:path';

import {
  ClaudeCodeAdapter,
  type ClaudeCodeSessionInfo,
  ClaudeCodeStore,
  SessionReadError,
  type Step,
} from '@deepagents/trajectory';

import type { ClaudeHome } from '../claude-home.ts';
import { under } from '../paths.ts';
import { Since } from '../since.ts';
import type { Project } from '../workspace/project.ts';
import { TEXT_EXCERPT, TOOL_INPUT_EXCERPT, excerpt } from './excerpt.ts';
import type { TranscriptRecord } from './record.ts';
import { TranscriptSelection } from './transcript-selection.ts';

/** A project to find in the transcripts, from a start on. */
export interface Watch {
  readonly project: Project;
  readonly since: Since;
}

type Found = Pick<TranscriptRecord, 'kind' | 'text'>;

/** A listed session with a working folder outside ~/.claude. */
type Listed = ClaudeCodeSessionInfo & { readonly cwd: string };

// This skill's own runs start with /update-docs, under a plugin's name or
// none, typed (<command-name>) or passed to a headless run as the prompt.
const UPDATE_DOCS =
  /^\/(?:[\w-]+:)?update-docs(?:\s|$)|<command-name>\/(?:[\w-]+:)?update-docs<\/command-name>/;

/**
 * The Claude Code transcripts of the user's sessions, read once for every
 * watched project through @deepagents/trajectory. Only what the user said
 * and what the assistant did or wrote is evidence; tool results echo files,
 * and attachments echo context.
 */
export class TranscriptArchive {
  readonly #claude: ClaudeHome;
  readonly #repoRoot: string;
  readonly #selection = new TranscriptSelection();
  readonly #adapter = new ClaudeCodeAdapter();

  constructor(claude: ClaudeHome, repoRoot: string) {
    this.#claude = claude;
    this.#repoRoot = repoRoot;
  }

  async scan(
    watches: readonly Watch[],
  ): Promise<Map<string, TranscriptRecord[]>> {
    const found = new Map<string, TranscriptRecord[]>(
      watches.map(({ project }) => [project.name, []]),
    );
    const sessions = await this.#sessions(
      Since.earliest(watches.map(({ since }) => since)),
    );
    const needles = [
      ...new Set(watches.flatMap(({ project }) => project.needles)),
    ].map((needle) => Buffer.from(needle));
    const next = sessions[Symbol.iterator]();
    const worker = async () => {
      for (const listed of next) {
        const buffer = await readFile(listed.session.transcriptPath);
        if (needles.some((needle) => buffer.includes(needle))) {
          for (const record of await this.#records(listed, watches)) {
            found.get(record.project)?.push(record.record);
          }
        }
      }
    };
    await Promise.all(
      Array.from({ length: Math.min(16, availableParallelism() * 2) }, worker),
    );
    return new Map(
      [...found].map(([project, records]) => [
        project,
        this.#selection.select(records),
      ]),
    );
  }

  /**
   * The sessions changed since the start. One that ran under ~/.claude (a
   * tool or hook run), or that records no working folder, is dropped before
   * it is read.
   */
  async #sessions(since: Since): Promise<Listed[]> {
    const listed: Listed[] = [];
    const store = new ClaudeCodeStore({ root: this.#claude.root });
    for await (const info of store.sessions({ since: since.toDate() })) {
      const { cwd } = info;
      if (cwd !== undefined && !this.#claude.holds(cwd)) {
        listed.push({ ...info, cwd });
      }
    }
    return listed;
  }

  /**
   * The records of the steps before the session's first /update-docs prompt:
   * from that prompt on, the steps are that run's own work. A session with no
   * prompt before it is dropped. A session in the workspace gives no tool
   * input, since git history holds the package's own development; a
   * consumer's tool inputs show how it uses the package.
   */
  async #records(
    { session, cwd }: Listed,
    watches: readonly Watch[],
  ): Promise<{ project: string; record: TranscriptRecord }[]> {
    let steps: readonly Step[];
    try {
      ({ steps } = (await this.#adapter.read(session, { subagents: false }))
        .trajectory);
    } catch (error) {
      // ADR 0009 of the package: a miner skips a session it cannot read.
      if (error instanceof SessionReadError) return [];
      throw error;
    }
    const before: Step[] = [];
    let prompted = false;
    for (const step of steps) {
      const prompt = typedPrompt(step);
      if (prompt !== undefined && UPDATE_DOCS.test(prompt)) break;
      prompted ||= prompt !== undefined;
      before.push(step);
    }
    if (!prompted) return [];
    const origin = under(cwd, this.#repoRoot) ? 'workspace' : 'consumer';
    const file = `${basename(dirname(session.transcriptPath))}/${basename(session.transcriptPath)}`;
    const records: { project: string; record: TranscriptRecord }[] = [];
    for (const step of before) {
      const uuid = claudeCodeOf(step)?.uuid;
      if (typeof step.timestamp !== 'string' || typeof uuid !== 'string') {
        continue;
      }
      for (const { kind, text } of found(step)) {
        if (kind === 'tool-input' && origin === 'workspace') continue;
        for (const { project, since } of watches) {
          if (project.names(text) && since.includesText(step.timestamp)) {
            records.push({
              project: project.name,
              record: {
                source: 'transcript',
                kind,
                ts: step.timestamp,
                ref: `${file}#${uuid}`,
                text: excerpt(
                  text,
                  project.needles,
                  kind === 'tool-input' ? TOOL_INPUT_EXCERPT : TEXT_EXCERPT,
                ),
                session: session.sessionId,
                cwd,
              },
            });
          }
        }
      }
    }
    return records;
  }
}

/**
 * The text of a prompt the user typed, at the prompt or while the agent
 * worked (a queued_command attachment). Injected context (isMeta) is no
 * prompt, and an origin other than human (a task notification) is the
 * harness talking. Transcripts older than the origin field record none, so
 * those are kept.
 */
function typedPrompt(step: Step): string | undefined {
  const claudeCode = claudeCodeOf(step);
  if (
    step.source !== 'user' ||
    claudeCode?.is_meta === true ||
    (claudeCode?.origin !== undefined && claudeCode.origin !== 'human')
  ) {
    return undefined;
  }
  return typeof step.message === 'string' ? step.message : undefined;
}

/** The Claude Code fields the adapter keeps beside a step (its README, "Claude Code entry → ATIF"). */
function claudeCodeOf(step: Step): Readonly<Record<string, unknown>> | undefined {
  const claudeCode: unknown = step.extra?.claude_code;
  return typeof claudeCode === 'object' && claudeCode !== null
    ? (claudeCode as Readonly<Record<string, unknown>>)
    : undefined;
}

function* found(step: Step): Generator<Found> {
  const prompt = typedPrompt(step);
  if (prompt !== undefined) {
    yield { kind: 'prompt', text: prompt };
    return;
  }
  if (step.source !== 'agent') return;
  if (typeof step.message === 'string' && step.message !== '') {
    yield { kind: 'assistant-text', text: step.message };
  }
  for (const call of step.tool_calls ?? []) {
    yield { kind: 'tool-input', text: JSON.stringify(call.arguments) };
  }
}
