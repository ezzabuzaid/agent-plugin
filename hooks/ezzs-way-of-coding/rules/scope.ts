import {
  always,
  and,
  type ClaudeHookInput,
  not,
  type ReminderRule,
} from '@deepagents/experimental/coding-agent-reminders';

import { readTranscriptEntries, type TranscriptEntry } from './transcript.ts';

function isClaudeUserTurn(entry: TranscriptEntry): boolean {
  if (
    entry.type !== 'user' ||
    entry.isMeta === true ||
    entry.sourceToolAssistantUUID != null ||
    entry.message?.role !== 'user'
  ) {
    return false;
  }

  const { content } = entry.message;
  if (typeof content === 'string') return content.length > 0;
  if (!Array.isArray(content) || content.length === 0) return false;

  return !content.some(
    (block) =>
      typeof block === 'object' &&
      block !== null &&
      'type' in block &&
      block.type === 'tool_result',
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
 * The audit is due after every third assistant message. A Claude Code turn
 * that ends while delegated work runs holds the audit back, so the audit stays
 * due until the transcript records it: it runs on the first later Stop with
 * nothing in flight. A Codex transcript records no hook context, and Codex
 * never holds the audit back, so it runs on every third turn only.
 */
async function auditDue(input: ClaudeHookInput): Promise<boolean> {
  if (!input.transcript_path) return false;

  const codexTurnIds = new Set<string>();
  let claudeUserTurns = 0;
  let claudeUserTurnsAtAudit = 0;

  for await (const entry of readTranscriptEntries(input.transcript_path)) {
    if (entry.type === 'turn_context' && entry.payload?.turn_id) {
      codexTurnIds.add(entry.payload.turn_id);
    } else if (isClaudeUserTurn(entry)) {
      claudeUserTurns += 1;
    } else if (recordsAudit(entry)) {
      claudeUserTurnsAtAudit = claudeUserTurns;
    }
  }

  if (codexTurnIds.size > 0) return codexTurnIds.size % 3 === 0;

  const lastDueTurn = claudeUserTurns - (claudeUserTurns % 3);
  return lastDueTurn > 0 && claudeUserTurnsAtAudit < lastDueTurn;
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
      'Before stopping, capture each concrete, actionable follow-up outside the active request with `agent-backlog`. Close each backlog item that this conversation completed or explicitly closed: append a closing note (what settled it, the commit, how it was verified) with `agent-backlog update <id> --description=<old description and note>`, then run `agent-backlog done <id>`. Never run `agent-backlog remove`: a closed item and its notes are the record later sessions search. Do not invent work or capture blockers, vague cleanup, or completed work as new items. Do not file upstream bug reports or dev-tooling audit items (agent hooks, agent settings, test tooling); mention each one once in your reply instead. If storing or closing fails, report the failure.',
  },
];
