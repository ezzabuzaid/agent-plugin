import {
  and,
  contentPattern,
  type ReminderRule,
} from '@deepagents/experimental/coding-agent-reminders';

import { promptEvents } from './events.ts';

export const testingRules: ReminderRule[] = [
  {
    id: 'tests-before-risky-migration',
    target: 'prompt',
    events: promptEvents,
    when: and(
      contentPattern(/\b(refactor|migrate|migration|move|restructure|rewrite)\b/i),
      contentPattern(
        /\b(existing|behavior|flow|interaction|component|system|architecture)\b/i,
      ),
    ),
    message:
      'Before moving existing behavior, add scenario-based integration coverage for the end-to-end flows that must remain unchanged, then use those scenarios to verify parity after the migration.',
  },
  // Mined from 8+ AGENTS.md files (reminders-curator, 2026-07-10).
  {
    id: 'builtin-test-runner-discipline',
    target: 'prompt',
    events: promptEvents,
    when: and(
      contentPattern(/\b(write|add|create|update|fix|generate|cover)\b/i),
      contentPattern(/\b(tests?|specs?|coverage|e2e)\b/i),
    ),
    message:
      "Use the runtime's built-in test runner and assert (node --test / bun test) — never jest, vitest, or another test library. Keep each test self-contained AAA with teardown in try/finally; no before/after lifecycle hooks and no pre-seeded shared state.",
  },
];
