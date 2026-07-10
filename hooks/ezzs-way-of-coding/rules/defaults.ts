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
    ].join('\n'),
  },
];
