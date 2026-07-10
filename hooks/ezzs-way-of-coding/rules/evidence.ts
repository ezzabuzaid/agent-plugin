import {
  and,
  contentPattern,
  or,
  type ReminderRule,
} from '@deepagents/experimental/coding-agent-reminders';

import { promptEvents } from './events.ts';

export const evidenceRules: ReminderRule[] = [
  {
    id: 'bug-reproduce-first',
    target: 'prompt',
    events: promptEvents,
    when: contentPattern(
      /\b(bug|fix|failing|failure|error|regression|broken|crash|debug)\b/i,
    ),
    message:
      'Reproduce the failure live and trace the real data, render, or runtime boundary before patching the visible symptom. Preserve the fixture, command, or output that proved the diagnosis.',
  },
  {
    id: 'package-api-first',
    target: 'prompt',
    events: promptEvents,
    when: and(
      contentPattern(
        /\b(implement|build|add|change|refactor|wire|create|extend|integrate|introduce|replace|write)\b/i,
      ),
      or(
        contentPattern(
          /\b(package|dependency|library|SDK|client|plugin|provider|framework|module|API)\b/i,
        ),
        contentPattern(
          /\b(custom|wrapper|adapter|helper|watcher|executor|script|cache|storage|fetch)\b/i,
        ),
      ),
    ),
    message:
      'Before writing local machinery, inspect the repository’s established pattern and the package or tool’s exports, types, source, docs, and call sites. Prove the native surface with a targeted probe and introduce a new abstraction only when it cannot satisfy the contract.',
  },
  {
    id: 'evidence-before-claims',
    target: 'prompt',
    events: promptEvents,
    when: contentPattern(
      /\b(do we|does (?:it|this|the)|is (?:it|this|the)|are we|currently|current state|already|still|actually|in use|wired|connected|supported|exists?)\b/i,
    ),
    message:
      'Answer current-state questions from the real source of truth: runtime wiring, call sites, generated surfaces, installed resolution, or live state. Names and manifests alone are not evidence that behavior exists or is active.',
  },
];
