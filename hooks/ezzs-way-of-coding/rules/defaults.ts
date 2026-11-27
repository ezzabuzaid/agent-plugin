import {
  always,
  type ReminderRule,
} from '@deepagents/experimental/coding-agent-reminders';

import { sessionEvents } from './events.ts';
import { typedByUser } from './intent.ts';

const HARVEST_SCAN =
  'SESSION HARVEST: Scan recent messages for unsaved user preferences, corrections, or clarifications.';
const HARVEST_ROUTE =
  'Before saving a correction, ask whether a machine could check it (a type, lint rule, git hook, CI step, agent hook or permission rule). If yes, follow the guardrail skill; if its check is not built in this session, save the memory and name the follow-up that will build it.';
// The 6 of 1060 saves Ezz rejected in 2026-10-30..11-27 each turned a correction about one task or
// one session into a standing rule (#6073, ~/.claude/plans/user-repeats-2026-11-27/triage-6073.md).
const HARVEST_SCOPE =
  'Save only a rule meant to hold in later sessions. A correction about the current task or turn, or an instruction meant for this session ("just for now", "don\'t store this"), is not a memory: apply it in the work. When unsure, do not save.';
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
      '- Build the full, long-term implementation, never a workaround or hidden tech debt.',
      "- No backward compatibility: break the API, migrate the data and force every host into the package's design; no aliases, shims, fallbacks or deprecated paths.",
      "- Decide a design from the leading tools' source and a measurement, never from preference.",
      '- Before changing a design, learn why it is so: the memories of every project (`node ~/.claude/skills/memory-curator/memory/cli.ts recall "<topic>"`), the ADRs and the git history.',
      '- Take the newest stable release when you add or bump a dependency, not the smallest lane, and fix what it breaks; when a package misbehaves, move it to latest first.',
      "- Use a maintained dependency, the framework's own feature or a standard tool before writing our own; install size is no argument on the server.",
      "- Before building, list Ezz's own packages (zukhruf, deepagents, elt, sdk-it) and use them; report every gap you meet in them, with evidence, in the owning repo, and fix it there, never around it in the host.",
      "- State a cause, gap, cost or speed only after a probe or measurement, at the scope of that evidence; a subagent's claim is not evidence.",
      '- Use the latest Node.js and JavaScript/TypeScript features; do not reach for legacy idioms or polyfills when a modern primitive exists.',
      '- Challenge contradictions and weak premises directly. Ask for clarification when intent is genuinely ambiguous, and prioritize truth over agreement.',
      '- When code or config you build calls an AI for auxiliary work (a prompt or agent hook, a script, a CI job), pin Claude Sonnet 5 for Claude and gpt-6.1-sol for OpenAI. Use a larger model only when that code documents a concrete capability gap.',
    ].join('\n'),
  },
  {
    id: 'session-harvest',
    target: 'prompt',
    events: ['UserPromptSubmit'],
    when: typedByUser,
    message: [
      HARVEST_SCAN,
      HARVEST_SCOPE,
      HARVEST_ROUTE,
      'If any, save them to auto-memory and update MEMORY.md. If a skill was used and the user gave feedback on it, save a reflection to ~/.claude/skills-reflections/<YYYY-MM-DD>-<skill-name>.md.',
      HARVEST_QUIET,
    ].join(' '),
  },
];
