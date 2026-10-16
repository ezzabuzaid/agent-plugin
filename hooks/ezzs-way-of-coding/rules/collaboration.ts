import {
  always,
  and,
  type ClaudeHookInput,
  contentPattern,
  type ReminderRule,
} from '@deepagents/experimental/coding-agent-reminders';

import { promptEvents } from './events.ts';
import { readTranscriptEntries, type TranscriptEntry } from './transcript.ts';

/**
 * A slash command is recorded as a user entry whose `message.content` is a
 * plain string carrying the `<command-name>` tag. Tool results and injected
 * skill bodies use array content, so the string check alone keeps a transcript
 * that merely quotes the skill from arming the register. The prefix is left
 * open because the command answers to `/mattpocock-skills:wait-what` today and
 * to `/wait-what` once the skill is owned locally.
 */
const WAIT_WHAT_INVOCATION = /<command-name>[^<]*wait-what/;

function invokesWaitWhat(entry: TranscriptEntry): boolean {
  const content = entry.message?.content;
  return (
    entry.type === 'user' &&
    typeof content === 'string' &&
    WAIT_WHAT_INVOCATION.test(content)
  );
}

/**
 * The skill itself sets `disable-model-invocation: true`, so a model turn can
 * never reload it. Only the transcript records that the user invoked it, which
 * is what keeps the register alive after the turn it was asked for.
 */
async function waitWhatRegisterIsActive(
  input: ClaudeHookInput,
): Promise<boolean> {
  if (!input.transcript_path) return false;

  for await (const entry of readTranscriptEntries(input.transcript_path)) {
    if (invokesWaitWhat(entry)) return true;
  }

  return false;
}

export const collaborationRules: ReminderRule[] = [
  {
    id: 'concrete-critical-design',
    target: 'prompt',
    events: promptEvents,
    when: and(
      contentPattern(/\b(product|architecture|design|concept|proposal|plan)\b/i),
      contentPattern(
        /\b(discuss|talk|evaluate|review|envision|picture|make sense|what do you think|finalize)\b/i,
      ),
    ),
    message:
      'Make the artifact, workflow, or runtime shape concrete early. Challenge weak premises, names, and boundaries directly instead of agreeing at an abstract level.',
  },
  {
    id: 'source-before-new-implementation',
    target: 'prompt',
    events: ['UserPromptSubmit'],
    when: always,
    message:
      'Look for a similar implementation in the codebase first. If none exists, probe the relevant behavior and read its source code before implementing it.',
  },
  {
    id: 'wait-what-register',
    target: 'prompt',
    events: ['UserPromptSubmit'],
    when: waitWhatRegisterIsActive,
    message:
      'The /wait-what register is active for the rest of this session, not only the turn it was invoked on. Write every reply in ASD-STE100 Simplified Technical English: short sentences, active voice, one idea per sentence, no ambiguous pronouns. Use the ubiquitous language of the repository, taken from its AGENTS.md or CLAUDE.md and from the code; do not source terms from product documents that a pivot or a rename has made stale, and do not assume a CONTEXT.md that the repository does not have. Lead with the context, then the facts, then the assumption the conclusion depends on, then the conclusion.',
  },
];
