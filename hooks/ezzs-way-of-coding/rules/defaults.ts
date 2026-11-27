import {
  always,
  and,
  type ClaudeHookInput,
  not,
  type ReminderRule,
} from '@deepagents/experimental/coding-agent-reminders';

import { sessionEvents } from './events.ts';
import { typedByUser } from './intent.ts';
import { readTranscriptEntries } from './transcript.ts';

/** A session's first prompt can find its transcript missing or empty. */
async function transcriptHasEntry(input: ClaudeHookInput): Promise<boolean> {
  if (!input.transcript_path) return false;

  for await (const _entry of readTranscriptEntries(input.transcript_path)) {
    return true;
  }

  return false;
}

const HARVEST_SCAN =
  'SESSION HARVEST: Scan recent messages for unsaved user preferences, corrections, or clarifications.';
const HARVEST_ROUTE =
  'Before saving a correction, ask whether a machine could check it (a type, lint rule, git hook, CI step, agent hook or permission rule). If yes, follow the guardrail skill; if its check is not built in this session, save the memory and name the follow-up that will build it.';
const HARVEST_QUIET = 'If nothing is new, do nothing silently.';

export const defaultsRules: ReminderRule[] = [
  {
    id: 'session-ezzs-way',
    target: 'session',
    events: sessionEvents,
    when: always,
    message: [
      "Ezz's coding defaults:",
      '- Start from the real implementation, call sites, generated artifacts, and current runtime state before answering or editing.',
      '- Prefer full, long-term implementations over workarounds, compatibility shims, or hidden tech debt.',
      '- Use the latest Node.js and JavaScript/TypeScript features; do not reach for legacy idioms or polyfills when a modern primitive exists.',
      '- Challenge contradictions and weak premises directly. Ask for clarification when intent is genuinely ambiguous, and prioritize truth over agreement.',
      '- When code or config you build calls an AI for auxiliary work (a prompt or agent hook, a script, a CI job), pin Claude Sonnet 5 for Claude and gpt-6.1-sol for OpenAI. Use a larger model only when that code documents a concrete capability gap.',
    ].join('\n'),
  },
  {
    id: 'session-harvest',
    target: 'prompt',
    events: ['UserPromptSubmit'],
    when: and(typedByUser, transcriptHasEntry),
    message: [
      HARVEST_SCAN,
      HARVEST_ROUTE,
      'If any, save them to auto-memory and update MEMORY.md. If a skill was used and the user gave feedback on it, save a reflection to ~/.claude/skills-reflections/<YYYY-MM-DD>-<skill-name>.md.',
      HARVEST_QUIET,
    ].join(' '),
  },
  {
    id: 'session-harvest',
    target: 'prompt',
    events: ['UserPromptSubmit'],
    when: and(typedByUser, not(transcriptHasEntry)),
    message: [
      HARVEST_SCAN,
      HARVEST_ROUTE,
      'If any, save them to this agent’s persistent memory. If a skill was used and the user gave feedback on it, save that feedback and name the skill.',
      HARVEST_QUIET,
    ].join(' '),
  },
];
