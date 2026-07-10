import {
  and,
  contentPattern,
  type ReminderRule,
} from '@deepagents/experimental/coding-agent-reminders';

import { promptEvents } from './events.ts';

export const frontendRules: ReminderRule[] = [
  // Mined from text2sql + global CLAUDE.md (reminders-curator, 2026-07-10).
  {
    id: 'ascii-before-ui',
    target: 'prompt',
    events: promptEvents,
    when: and(
      contentPattern(/\b(build|implement|add|create|change|redesign|update|make)\b/i),
      contentPattern(
        /\b(ui|ux|frontend|screens?|pages?|layouts?|views?|modals?|forms?|dashboards?|widgets?|components?)\b/i,
      ),
    ),
    message:
      'UI work starts with an ASCII wireframe and explicit user approval before implementation, with the repo design contract (e.g. DESIGN.md) read in full — alignment first prevents rework.',
  },
];
