import {
  and,
  contentPattern,
  type ReminderRule,
} from '@deepagents/experimental/coding-agent-reminders';

import { promptEvents } from './events.ts';
import { typedByUser } from './intent.ts';

export const frontendRules: ReminderRule[] = [
  // Mined from text2sql + global CLAUDE.md (reminders-curator, 2026-07-10).
  {
    id: 'ascii-before-ui',
    target: 'prompt',
    events: promptEvents,
    // The verb and the UI word must be one phrase, at most three words apart
    // in one sentence. As two words anywhere in the prompt, they also matched
    // "build" and "page" in a pasted log and "update(page.text)" in code.
    when: and(
      typedByUser,
      contentPattern(
        /\b(?:implement|build|add|create|change|redesign|update|make(?!\s+sure))\s+(?:\S*[^\s.;!?]\s+){0,3}(?:ui|ux|frontend|screens?|pages?|layouts?|views?|modals?|forms?|dashboards?|widgets?|components?)\b/i,
      ),
    ),
    message:
      'UI work starts with an ASCII wireframe and explicit user approval before implementation, with the repo design contract (e.g. DESIGN.md) read in full — alignment first prevents rework.',
  },
];
