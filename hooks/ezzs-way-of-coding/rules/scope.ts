import {
  always,
  and,
  type ClaudeHookInput,
  not,
  type ReminderRule,
} from '@deepagents/experimental/coding-agent-reminders';

import { RELAYED_PROMPT } from './intent.ts';
import { readTranscriptEntries, type TranscriptEntry } from './transcript.ts';

/**
 * Claude Code writes a user entry also for a local command and its output
 * (`/effort`, `/clear`, `!git status`) and for an interrupt marker. A built-in
 * command starts with `<command-name>`; a skill command, which asks the agent
 * for work, starts with `<command-message>`.
 */
const LOCAL_ENTRY =
  /^<(?:command-name|bash-(?:input|stdout|stderr)|local-command-(?:stdout|stderr))>|^\[Request interrupted by user/;

function isBlockOfType(
  block: unknown,
  type: string,
): block is Record<string, unknown> {
  return (
    typeof block === 'object' &&
    block !== null &&
    'type' in block &&
    block.type === type
  );
}

/** A Claude Code user entry that holds a prompt the user typed. */
function isTypedPrompt(entry: TranscriptEntry): boolean {
  if (
    entry.type !== 'user' ||
    entry.isMeta === true ||
    entry.sourceToolAssistantUUID != null ||
    entry.message?.role !== 'user'
  ) {
    return false;
  }

  const { content } = entry.message;
  let text: string;
  if (typeof content === 'string') {
    text = content;
  } else if (
    Array.isArray(content) &&
    !content.some((block) => isBlockOfType(block, 'tool_result'))
  ) {
    text = content
      .flatMap((block) =>
        isBlockOfType(block, 'text') && typeof block.text === 'string'
          ? [block.text]
          : [],
      )
      .join('\n');
  } else {
    return false;
  }

  return (
    text.length > 0 && !RELAYED_PROMPT.test(text) && !LOCAL_ENTRY.test(text)
  );
}

const AUDIT_ID = 'audit-out-of-scope-followups';

/**
 * Claude Code records the context that a Stop hook adds as a
 * `hook_additional_context` attachment, which holds each reminder under its
 * `[target:id]` header.
 */
function recordsAudit(entry: TranscriptEntry): boolean {
  const content = entry.attachment?.content;
  return (
    entry.type === 'attachment' &&
    entry.attachment?.type === 'hook_additional_context' &&
    Array.isArray(content) &&
    content.some(
      (text) =>
        typeof text === 'string' &&
        text.includes(`[stop-feedback:${AUDIT_ID}]\n`),
    )
  );
}

/**
 * The audit is due once the user has typed three prompts since the transcript
 * last recorded it, or since the session started. A Claude Code turn that ends
 * while delegated work runs holds the audit back, so it runs on the first later
 * Stop with nothing in flight, and the next one waits for three more prompts.
 * A Codex transcript records no hook context, and Codex never holds the audit
 * back, so it runs on every third turn.
 */
async function auditDue(input: ClaudeHookInput): Promise<boolean> {
  if (!input.transcript_path) return false;

  const codexTurnIds = new Set<string>();
  let promptsSinceAudit = 0;

  for await (const entry of readTranscriptEntries(input.transcript_path)) {
    if (entry.type === 'turn_context' && entry.payload?.turn_id) {
      codexTurnIds.add(entry.payload.turn_id);
    } else if (isTypedPrompt(entry)) {
      promptsSinceAudit += 1;
    } else if (recordsAudit(entry)) {
      promptsSinceAudit = 0;
    }
  }

  if (codexTurnIds.size > 0) return codexTurnIds.size % 3 === 0;
  return promptsSinceAudit >= 3;
}

/**
 * Claude Code sends `background_tasks` on Stop: the background work still in
 * flight, so that a hook can tell a finished session from one that waits for
 * that work to wake it. Each task names its type as a display name. A turn that
 * ends while a subagent or a workflow it started still runs only waits; an
 * audit then asks the agent to file and close items in the middle of that
 * work. A shell or a monitor can run for the whole session, such as a dev
 * server, so it does not hold the audit back. Codex sends no `background_tasks`.
 */
const DELEGATED_WORK = new Set(['subagent', 'workflow']);

function waitsOnDelegatedWork(input: ClaudeHookInput): boolean {
  const tasks = input.background_tasks;
  return (
    Array.isArray(tasks) &&
    tasks.some(
      (task) =>
        typeof task === 'object' &&
        task !== null &&
        'type' in task &&
        typeof task.type === 'string' &&
        DELEGATED_WORK.has(task.type),
    )
  );
}

export const scopeRules: ReminderRule[] = [
  {
    id: 'capture-out-of-scope-followups',
    target: 'session',
    events: ['SessionStart', 'Setup'],
    when: always,
    message: [
      'Keep the active user request as the execution scope.',
      '- When the work exposes a concrete, actionable follow-up that is valuable but unnecessary to complete the active request, do not expand the task. Add it with `agent-backlog`, briefly report the captured item, then continue the active task.',
      '- Classify each stored item on both axes: `--kind feature|defect|risk|debt` (what the item is) and `--work-type business|internal|change|unplanned` (how the work entered: planned follow-ups are usually `internal` or `change`; incident-driven ones `unplanned`).',
      '- When an item can start only after something, give that as a condition flag on `add` (or later with `agent-backlog wait <id>`), never as "Trigger:" prose: `--after <id>` (another item is done), `--published <pkg@range>` (npm has a version in the range), `--clean <repo:glob>` (no uncommitted file there, such as paths a peer holds), `--until "<event>"` (an event or a judgement, such as a third consumer). A question for the user is `agent-backlog ask <id> "<question>"`; read `agent-backlog decisions` before you ask one again.',
      '- Required blockers and explicit user additions remain in scope. Do not capture vague suggestions, speculative cleanup, or completed work.',
      '- Do not file upstream bug reports or dev-tooling audit items (agent hooks, agent settings, test tooling) with `agent-backlog`. Mention each one once in your reply instead.',
      '- If `agent-backlog` fails, do not claim the item was stored; follow its configuration guidance or report the failure.',
    ].join('\n'),
  },
  {
    id: AUDIT_ID,
    target: 'stop-feedback',
    events: ['Stop'],
    when: and(not(waitsOnDelegatedWork), auditDue),
    message:
      'Before stopping, capture each concrete, actionable follow-up outside the active request with `agent-backlog`. Close each backlog item that this conversation completed or explicitly closed: append a closing note (what settled it, the commit, how it was verified) with `agent-backlog update <id> --description=<old description and note>`, then run `agent-backlog done <id>`. When this conversation saw the event of an `--until` condition happen, mark it with `agent-backlog met <condition-id> --note "<what happened>"`. Never run `agent-backlog remove`: a closed item and its notes are the record later sessions search. Do not invent work or capture blockers, vague cleanup, or completed work as new items. Do not file upstream bug reports or dev-tooling audit items (agent hooks, agent settings, test tooling); mention each one once in your reply instead. If storing or closing fails, report the failure.',
  },
];
