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
 * that merely quotes the skill from arming the register. The skill is the
 * user-level `~/.claude/skills/wait-what/SKILL.md`, so the command is
 * `/wait-what`; a plugin copy adds a `<plugin>:` prefix. The pattern matches
 * that command name and nothing else, so a command such as `/wait-what-notes`
 * does not arm the register.
 */
const WAIT_WHAT_INVOCATION =
  /<command-name>\/(?:[\w-]+:)?wait-what<\/command-name>/;

function invokesWaitWhat(entry: TranscriptEntry): boolean {
  const content = entry.message?.content;
  return (
    entry.type === 'user' &&
    typeof content === 'string' &&
    WAIT_WHAT_INVOCATION.test(content)
  );
}

/**
 * The model can invoke the skill too, but only when its description matches
 * the turn. A user who runs `/wait-what` asks for the register for the whole
 * session. Only the transcript records that request, so the rule reads it on
 * every prompt. The register has no off switch: once the command ran, it stays
 * on for the rest of the session. A new session starts with it off.
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
      'The /wait-what register stays on for the rest of this session, not only the turn it was invoked on. Write every reply as the wait-what skill says: ASD-STE100 Simplified Technical English with the project’s ubiquitous language. Follow that skill for where the terms come from.',
  },
];
