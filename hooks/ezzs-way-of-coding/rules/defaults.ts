import {
  always,
  type ClaudeHookInput,
  type ReminderRule,
} from '@deepagents/experimental/coding-agent-reminders';

import { sessionEvents } from './events.ts';
import { readTranscriptEntries } from './transcript.ts';

type Agent = 'claude' | 'codex';

/**
 * A Codex rollout opens with a `session_meta` entry; a Claude transcript never
 * has one. The `turn_context` entries that the stop audit counts come only
 * after the first user message, so they cannot name the agent on the first
 * prompt. A missing or empty transcript names no agent.
 */
async function transcriptAgent(
  input: ClaudeHookInput,
): Promise<Agent | undefined> {
  if (!input.transcript_path) return undefined;

  for await (const entry of readTranscriptEntries(input.transcript_path)) {
    return entry.type === 'session_meta' ? 'codex' : 'claude';
  }

  return undefined;
}

const agentIs =
  (agent: Agent | undefined) =>
  async (input: ClaudeHookInput): Promise<boolean> =>
    (await transcriptAgent(input)) === agent;

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
      '- Claude Code subagents, Workflow-script agents included, run Opus 5.5: the user settings force it with CLAUDE_CODE_SUBAGENT_MODEL_FORCE.',
    ].join('\n'),
  },
  {
    id: 'session-harvest',
    target: 'prompt',
    events: ['UserPromptSubmit'],
    when: agentIs('claude'),
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
    when: agentIs('codex'),
    message: [
      HARVEST_SCAN,
      HARVEST_ROUTE,
      'If any, save each one as an ad-hoc memory note at ~/.codex/memories/extensions/ad_hoc/notes/<YYYYMMDDTHHMMSS>-<slug>.md; Codex consolidates those notes into its memories. If a skill was used and the user gave feedback on it, save that feedback as a note too and name the skill.',
      HARVEST_QUIET,
    ].join(' '),
  },
  {
    id: 'session-harvest',
    target: 'prompt',
    events: ['UserPromptSubmit'],
    when: agentIs(undefined),
    message: [
      HARVEST_SCAN,
      HARVEST_ROUTE,
      'If any, save them to this agent’s persistent memory. If a skill was used and the user gave feedback on it, save that feedback and name the skill.',
      HARVEST_QUIET,
    ].join(' '),
  },
];
