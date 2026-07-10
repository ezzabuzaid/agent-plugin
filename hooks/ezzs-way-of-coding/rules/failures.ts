import {
  always,
  toolCall,
  type ClaudeHookInput,
  type HookPredicate,
  type ReminderRule,
} from '@deepagents/experimental/coding-agent-reminders';

// PostToolBatch entries carry no structured error marker: the CLI drops the
// tool_result `is_error` flag when assembling the payload, so the only
// failure signal that survives is its message convention — failed results are
// the string `Error: <message>`, denials/interrupts are fixed sentences.
// Match those CLI-authored prefixes anchored at the start of each individual
// result; a word-grep over the joined batch text fires on any successful read
// of a file that merely mentions "error" or "failed".
const FAILED_RESULT_PREFIX =
  /^(?:Error: |The user doesn't want to proceed with this tool use|Permission to use |Permission for this )/;

const resultTexts = (response: unknown): string[] => {
  if (typeof response === 'string') return [response];
  if (Array.isArray(response)) {
    return response.flatMap((block) =>
      typeof block === 'object' &&
      block !== null &&
      'text' in block &&
      typeof block.text === 'string'
        ? [block.text]
        : [],
    );
  }
  return [];
};

const batchHasFailedCall: HookPredicate = (ctx: ClaudeHookInput) =>
  (ctx.tool_calls ?? []).some((call) =>
    resultTexts(call.tool_response).some((text) =>
      FAILED_RESULT_PREFIX.test(text),
    ),
  );

export const failuresRules: ReminderRule[] = [
  {
    id: 'tool-failure-root-cause',
    target: 'tool-result',
    events: ['PostToolUseFailure'],
    when: always,
    message:
      'A tool failed. Use the exact failing command, error text, and current working directory as evidence before changing code. Do not paper over the failure.',
  },
  {
    id: 'bash-error-root-cause',
    target: 'tool-result',
    events: ['PostToolUse'],
    when: toolCall({
      name: 'Bash',
      output: (output) =>
        /\b(error|failed|exception|traceback|not found|permission denied)\b/i.test(
          typeof output === 'string' ? output : JSON.stringify(output),
        ),
    }),
    message:
      'The Bash output contains a failure signal. Identify the concrete root cause from the output before proposing or applying a fix.',
  },
  {
    id: 'tool-batch-reconcile',
    target: 'tool-batch',
    events: ['PostToolBatch'],
    when: batchHasFailedCall,
    message:
      'One or more tool results in this batch appear to have failed. Reconcile the actual outputs before taking the next model step.',
  },
];
