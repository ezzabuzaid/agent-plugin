import {
  and,
  contentPattern,
  not,
  type ReminderRule,
} from '@deepagents/experimental/coding-agent-reminders';

import { promptEvents, stopEvents } from './events.ts';

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
    id: 'stop-verify-before-handoff',
    target: 'stop-feedback',
    events: stopEvents,
    // Suppress only on explicit report-only phrasings; bare words like "stop"
    // appear in ordinary code-work prompts ("stop retrying and fix it") and
    // must not silence the verification nudge.
    when: not(
      contentPattern(
        /\b(only report|just report|report status|status (?:update|check|only)|just checking)\b/i,
      ),
    ),
    message:
      'Before stopping, verify the work that changed code or configuration, and report any command you could not run.',
  },
];
