import {
  and,
  contentPattern,
  type ReminderRule,
} from '@deepagents/experimental/coding-agent-reminders';

import { promptEvents } from './events.ts';

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
];
