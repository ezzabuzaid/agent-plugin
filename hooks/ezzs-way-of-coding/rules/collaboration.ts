import {
  always,
  and,
  contentPattern,
  or,
  type ReminderRule,
} from '@deepagents/experimental/coding-agent-reminders';

import { promptEvents } from './events.ts';
import { asksAQuestion, asksToBuild, typedByUser } from './intent.ts';

export const collaborationRules: ReminderRule[] = [
  {
    id: 'concrete-critical-design',
    target: 'prompt',
    events: promptEvents,
    when: and(
      typedByUser,
      contentPattern(/\b(product|architecture|design|concept|proposal|plan)\b/i),
      contentPattern(
        /\b(discuss|talk|evaluate|review|envision|picture|make sense|what do you think|finalize)\b/i,
      ),
    ),
    message:
      'Make the artifact, workflow, or runtime shape concrete early. Challenge weak premises, names, and boundaries directly instead of agreeing at an abstract level.',
  },
  {
    id: 'source-before-new-implementation',
    target: 'prompt',
    events: ['UserPromptSubmit'],
    when: and(
      typedByUser,
      or(
        asksToBuild,
        contentPattern(/\b(extend|integrate|wire|refactor|replace|fix)\b/i),
      ),
    ),
    message:
      'Look for a similar implementation in the codebase first. If none exists, probe the relevant behavior and read its source code before implementing it.',
  },
  {
    id: 'answer-first',
    target: 'prompt',
    events: promptEvents,
    when: and(typedByUser, (input) => typeof input.prompt === 'string' && asksAQuestion(input.prompt)),
    message:
      'The prompt asks a question. Answer it first, in the chat, before other work: run only the reads the answer needs, then answer, then go on.',
  },
  {
    id: 'wait-what-register',
    target: 'session',
    events: ['SessionStart'],
    when: always,
    message:
      'Write every reply in the /wait-what register: a little context first, then ASD-STE100 Simplified Technical English. Name each concept by its standard industry term first, then the project’s own term from GLOSSARY.md where the two differ.',
  },
];
