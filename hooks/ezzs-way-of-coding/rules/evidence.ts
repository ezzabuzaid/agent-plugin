import {
  and,
  contentPattern,
  or,
  type ReminderRule,
} from '@deepagents/experimental/coding-agent-reminders';

import { promptEvents } from './events.ts';
import { asksToBuild } from './intent.ts';

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
      or(
        asksToBuild,
        contentPattern(
          /\b(refactor|wire|extend|integrate|introduc(?:e|ing)|replace|write|propos(?:e|ing)|design(?:ing)?)\b/i,
        ),
      ),
      or(
        contentPattern(
          /\b(package|dependency|library|SDK|client|plugin|provider|framework|module|API)\b/i,
        ),
        contentPattern(
          /\b(custom|wrapper|adapter|helper|watcher|executor|script|cache|storage|fetch|abstraction|primitive|composition)\b/i,
        ),
      ),
    ),
    message:
      'Before hand-rolling local behavior or proposing new machinery, reduce the requested concept to its essential behavior. Map that behavior onto the repository’s established patterns and the existing primitives and compositions of installed packages or local workspace packages. Inspect the actual installed API surface first: exports, type declarations, source, docs, and call sites. Prove it with a small snippet, test, runtime introspection, or targeted search. Prefer the proven package API when it satisfies the contract; do not assume capabilities or limitations from training data, README memory, manifests, or guesses. Introduce a new abstraction only after demonstrating a concrete capability gap.',
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
