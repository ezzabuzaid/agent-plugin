import {
  always,
  type ReminderRule,
} from '@deepagents/experimental/coding-agent-reminders';

import { sessionEvents } from './events.ts';

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
      '- When a rule, hook, automation, or workflow delegates auxiliary work to an AI, pin Claude Sonnet 5 for Claude and gpt-6.1-sol for OpenAI. Use a larger model only when the rule documents a concrete capability gap.',
    ].join('\n'),
  },
  {
    id: 'session-harvest',
    target: 'prompt',
    events: ['UserPromptSubmit'],
    when: always,
    message:
      'SESSION HARVEST: Scan recent messages for unsaved user preferences, corrections, or clarifications. If any, save them to auto-memory and update MEMORY.md. If a skill was used and the user gave feedback on it, save a reflection to ~/.claude/skills-reflections/<YYYY-MM-DD>-<skill-name>.md. If nothing is new, do nothing silently.',
  },
];
