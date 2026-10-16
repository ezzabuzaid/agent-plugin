import {
  always,
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

// Claude Code reports a Bash command that exits non-zero as a tool failure
// (PostToolUseFailure, see tool-failure-root-cause), so a PostToolUse Bash
// result comes from a command that exited 0. The errors left to catch are the
// ones a successful command hides: a failing stage before `| head`, `|| true`,
// `; echo`. The result is {stdout, stderr, ...} with no exit code. A word-grep
// over it fires on every file, log or source text that mentions "error" (the
// same trap as FAILED_RESULT_PREFIX above), so only lines shaped like a
// diagnostic count. Claude Code usually writes the command's stderr into
// stdout, so stdout needs the anchored shapes; a separate stderr is the
// diagnostics stream, and a failure word on any of its lines counts.
const DIAGNOSTIC_LINE = [
  /^(?:error|fatal|panic)(?:\[\w+\])?: /i, // fatal: not a git repository
  /^[\w.-]+: (?:fatal error|error|fatal):/i, // ugrep: error: error at position 93
  /^Traceback \(most recent call last\):/,
  /^(?:[\w$]+\.)*(?:[A-Z]\w*)?(?:Error|Exception): /, // TypeError: x is not a function
  /^npm (?:ERR!|error) /,
  /(?:^|\): )error TS\d+: /, // rules.ts(4,2): error TS2345: ...
  /^(?:ba|z|k|da)?sh: /, // zsh: command not found: foo
];
const STDERR_FAILURE =
  /\b(?:error|fatal|failed|exception|traceback|not found|permission denied|no such file or directory|cannot)\b/i;

// Prefixes that run the next word as the program: `sudo rm`, `xargs grep`.
const COMMAND_PREFIXES = new Set([
  'sudo',
  'xargs',
  'time',
  'env',
  'command',
  'exec',
  'nohup',
  'then',
  'do',
  'else',
  '!',
]);

// Programs the command runs, by name. A Unix tool prefixes its diagnostics with
// its own name (`ls: cannot access 'x'`, `grep: maximum repetition exceeds
// 255`), and a line that starts with one of these names is such a diagnostic.
function programsOf(command: string): Set<string> {
  const programs = new Set<string>();
  for (const segment of command.split(/\|\|?|&&|;|\n|\$\(|`|\(/)) {
    const words = segment.trim().split(/\s+/);
    const program = words.find(
      (word) => !COMMAND_PREFIXES.has(word) && !/^\w+=/.test(word),
    );
    if (program) programs.add(program.split('/').at(-1) ?? program);
  }
  return programs;
}

const streamsOf = (response: unknown): { stdout: string; stderr: string } => {
  if (typeof response === 'string') return { stdout: response, stderr: '' };
  if (typeof response !== 'object' || response === null)
    return { stdout: '', stderr: '' };
  const { stdout, stderr } = response as Record<string, unknown>;
  return {
    stdout: typeof stdout === 'string' ? stdout : '',
    stderr: typeof stderr === 'string' ? stderr : '',
  };
};

const bashOutputHasDiagnostic: HookPredicate = (ctx: ClaudeHookInput) => {
  if (ctx.tool_name !== 'Bash') return false;
  const { stdout, stderr } = streamsOf(ctx.tool_output ?? ctx.tool_response);
  const command = ctx.tool_input?.command;
  const programs = programsOf(typeof command === 'string' ? command : '');
  const isDiagnostic = (line: string) =>
    DIAGNOSTIC_LINE.some((shape) => shape.test(line)) ||
    programs.has(/^([\w.-]+): /.exec(line)?.[1] ?? '');
  return (
    stdout.split('\n').some(isDiagnostic) ||
    stderr
      .split('\n')
      .some((line) => isDiagnostic(line) || STDERR_FAILURE.test(line))
  );
};

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
    when: bashOutputHasDiagnostic,
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
