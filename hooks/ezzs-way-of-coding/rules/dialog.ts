import type { GuardRule } from '@deepagents/experimental/coding-agent-reminders';

// The dialog only asks (the user's ruling, 2026-11-26): the explanation goes in
// the chat, the dialog holds a one-line question and short option labels.
// 150 characters fit one line and one short clause of context; 100 fit a short
// description of what an option does. Measured on 746 real dialogs (forensics
// 2026-11-26) in rules.test.ts.
const QUESTION_LIMIT = 150;
const DESCRIPTION_LIMIT = 100;

function longerThan(value: unknown, limit: number): boolean {
  return typeof value === 'string' && value.length > limit;
}

function overLimit(question: unknown): boolean {
  if (typeof question !== 'object' || question === null) return false;
  if ('question' in question && longerThan(question.question, QUESTION_LIMIT)) return true;
  const options = 'options' in question ? question.options : undefined;
  return (
    Array.isArray(options) &&
    options.some(
      (option: unknown) =>
        typeof option === 'object' &&
        option !== null &&
        'description' in option &&
        longerThan(option.description, DESCRIPTION_LIMIT),
    )
  );
}

export const dialogGuards: GuardRule[] = [
  {
    id: 'dialog-only-asks',
    // The library denies when a guard throws; this guard must fail open.
    when: (input) => {
      try {
        const questions = input.tool_input?.questions;
        return input.tool_name === 'AskUserQuestion' && Array.isArray(questions) && questions.some(overLimit);
      } catch {
        return false;
      }
    },
    deny: `The dialog only asks: put the explanation in the chat, in plain words, then ask a one-line question with short labels (your pick first). Limits: a question of ${QUESTION_LIMIT} characters, an option description of ${DESCRIPTION_LIMIT}.`,
  },
];
