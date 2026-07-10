import {
  always,
  and,
  contentPattern,
  envFlag,
  not,
  or,
  toolCall,
  type ClaudeHookInput,
  type GuardRule,
  type HookEventName,
  type HookPredicate,
  type ReminderHookConfig,
  type ReminderRule,
} from '@deepagents/experimental/coding-agent-reminders';

const sessionEvents: HookEventName[] = [
  'SessionStart',
  'Setup',
  'SubagentStart',
];

const promptEvents: HookEventName[] = [
  'UserPromptSubmit',
  'UserPromptExpansion',
];

const stopEvents: HookEventName[] = ['Stop', 'SubagentStop'];

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

export const reminderRules: ReminderRule[] = [
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
  {
    id: 'bug-reproduce-first',
    target: 'prompt',
    events: promptEvents,
    when: contentPattern(
      /\b(bug|fix|failing|failure|error|regression|broken|crash|debug)\b/i,
    ),
    message:
      'Reproduce the failure live and trace the real data, render, or runtime boundary before patching the visible symptom. Preserve the fixture, command, or output that proved the diagnosis.',
  },
  {
    id: 'package-api-first',
    target: 'prompt',
    events: promptEvents,
    when: and(
      contentPattern(
        /\b(implement|build|add|change|refactor|wire|create|extend|integrate|introduce|replace|write)\b/i,
      ),
      or(
        contentPattern(
          /\b(package|dependency|library|SDK|client|plugin|provider|framework|module|API)\b/i,
        ),
        contentPattern(
          /\b(custom|wrapper|adapter|helper|watcher|executor|script|cache|storage|fetch)\b/i,
        ),
      ),
    ),
    message:
      'Before writing local machinery, inspect the repository’s established pattern and the package or tool’s exports, types, source, docs, and call sites. Prove the native surface with a targeted probe and introduce a new abstraction only when it cannot satisfy the contract.',
  },
  {
    id: 'evidence-before-claims',
    target: 'prompt',
    events: promptEvents,
    when: contentPattern(
      /\b(do we|does (?:it|this|the)|is (?:it|this|the)|are we|currently|current state|already|still|actually|in use|wired|connected|supported|exists?)\b/i,
    ),
    message:
      'Answer current-state questions from the real source of truth: runtime wiring, call sites, generated surfaces, installed resolution, or live state. Names and manifests alone are not evidence that behavior exists or is active.',
  },
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
  {
    id: 'guard-destructive-mutations',
    target: 'prompt',
    events: promptEvents,
    when: and(
      contentPattern(
        /\b(delete|remove|drop|truncate|prune|purge|wipe|destroy|cleanup|clean up)\b/i,
      ),
      contentPattern(
        /\b(database|data|records?|rows?|table|schema|volume|bucket|files?|directory|account|users?|resource|deployment|environment)\b/i,
      ),
    ),
    message:
      'Before destructive mutation, confirm the exact target and scope, preserve unrelated persistent data, prefer a reversible or transactional path where possible, and verify the post-state before reporting success.',
  },
  {
    id: 'dependency-upgrade-discipline',
    target: 'prompt',
    events: promptEvents,
    when: and(
      contentPattern(/\b(dependency|dependencies|package|packages|library|SDK)\b/i),
      contentPattern(/\b(upgrade|update|outdated|bump|latest|version|sweep)\b/i),
    ),
    message:
      'Read the current manifests, lockfile, and installed versions before changing dependencies. Prefer the smallest viable safe upgrade lane and separate breaking or migration work explicitly.',
  },
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
  {
    id: 'stop-verify-before-handoff',
    target: 'stop-feedback',
    events: stopEvents,
    when: and(
      envFlag('EZZ_HOOK_ENABLE_STOP_FEEDBACK'),
      not(contentPattern(/\b(status|pause|stop|only report)\b/i)),
    ),
    message:
      'Before stopping, verify the work that changed code or configuration, and report any command you could not run.',
  },
];

export const guardRules: GuardRule[] = [];

export const ezzsWayOfCodingConfig: ReminderHookConfig = {
  reminders: reminderRules,
  guards: guardRules,
};
