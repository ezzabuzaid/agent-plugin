import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { evaluateReminderHook } from '@deepagents/experimental/coding-agent-reminders';

import { ezzsWayOfCodingConfig } from './rules/index.ts';

test('session harvest stays generic instead of injecting project-specific memory', async () => {
  const output = await evaluateReminderHook(
    {
      hook_event_name: 'UserPromptSubmit',
      cwd: '/Users/ezzabuzaid/Desktop/January/text2sql',
      prompt: 'Update the desktop AuthX OAuth flow',
    },
    ezzsWayOfCodingConfig,
  );

  const context = output?.hookSpecificOutput?.additionalContext ?? '';
  assert.match(context, /\[prompt:session-harvest\]/);
  assert.doesNotMatch(context, /AuthX|OAuth|text2sql/);
});

test('coding reminders trigger from behavior, not repository path', async () => {
  const cases = [
    ['package-api-first', 'Build a custom executor for this workflow.'],
    [
      'evidence-before-claims',
      'Does this feature already exist and is it currently wired?',
    ],
    [
      'tests-before-risky-migration',
      'Refactor the existing checkout interaction flow.',
    ],
    ['guard-destructive-mutations', 'Delete the stale database records.'],
    [
      'dependency-upgrade-discipline',
      'Upgrade the outdated SDK package versions.',
    ],
    [
      'concrete-critical-design',
      'Let us discuss whether this architecture proposal makes sense.',
    ],
  ] as const;

  for (const [id, prompt] of cases) {
    const output = await evaluateReminderHook(
      {
        hook_event_name: 'UserPromptSubmit',
        cwd: '/tmp/unrelated-project',
        prompt,
      },
      ezzsWayOfCodingConfig,
    );

    assert.match(
      output?.hookSpecificOutput?.additionalContext ?? '',
      new RegExp(`\\[prompt:${id}\\]`),
    );
  }
});

test('package API reminder prefers primitive composition over a new abstraction', async () => {
  const matchingOutput = await evaluateReminderHook(
    {
      hook_event_name: 'UserPromptSubmit',
      prompt: 'Propose a new abstraction for composing this SDK API.',
    },
    ezzsWayOfCodingConfig,
  );
  const matchingContext =
    matchingOutput?.hookSpecificOutput?.additionalContext ?? '';

  assert.match(matchingContext, /\[prompt:package-api-first\]/);
  assert.match(matchingContext, /existing primitives and compositions/);
  assert.match(matchingContext, /concrete capability gap/);

  const nearMissOutput = await evaluateReminderHook(
    {
      hook_event_name: 'UserPromptSubmit',
      prompt: 'Propose a release plan for this project.',
    },
    ezzsWayOfCodingConfig,
  );

  assert.doesNotMatch(
    nearMissOutput?.hookSpecificOutput?.additionalContext ?? '',
    /\[prompt:package-api-first\]/,
  );
});

test('repo-owned rules preserve the migrated Claude and Codex guidance', async () => {
  const sessionOutput = await evaluateReminderHook(
    { hook_event_name: 'SessionStart' },
    ezzsWayOfCodingConfig,
  );
  const sessionContext =
    sessionOutput?.hookSpecificOutput?.additionalContext ?? '';

  assert.match(sessionContext, /latest Node\.js and JavaScript\/TypeScript features/);
  assert.match(sessionContext, /Challenge contradictions and weak premises directly/);
  assert.match(sessionContext, /prioritize truth over agreement/);
  assert.match(sessionContext, /code or config you build calls an AI/);
  assert.match(sessionContext, /Claude Sonnet 5/);
  assert.match(sessionContext, /gpt-6\.1-sol/);
  assert.match(sessionContext, /concrete capability gap/);

  const testPromptOutput = await evaluateReminderHook(
    {
      hook_event_name: 'UserPromptSubmit',
      prompt: 'Write tests for the package integration.',
    },
    ezzsWayOfCodingConfig,
  );
  const testPromptContext =
    testPromptOutput?.hookSpecificOutput?.additionalContext ?? '';

  assert.match(testPromptContext, /integration and black-box tests/);
  assert.match(testPromptContext, /public contract/);
  assert.match(testPromptContext, /private or protected internals/);

  const expansionOutput = await evaluateReminderHook(
    { hook_event_name: 'UserPromptExpansion', prompt: 'Continue.' },
    ezzsWayOfCodingConfig,
  );

  assert.doesNotMatch(
    expansionOutput?.hookSpecificOutput?.additionalContext ?? '',
    /\[prompt:session-harvest\]/,
  );
});

test('batch reconciler ignores successful results that merely mention failures', async () => {
  const output = await evaluateReminderHook(
    {
      hook_event_name: 'PostToolBatch',
      tool_calls: [
        {
          tool_name: 'Read',
          tool_input: { file_path: '/repo/AGENTS.md' },
          tool_use_id: 'toolu_01',
          tool_response:
            'A red typecheck does not imply type errors. A lint failure makes the task bail, so the reported failure is a lint failure. error TSxxxx lines come from the compiler. not found.',
        },
        {
          tool_name: 'Bash',
          tool_input: { command: 'jq empty settings.json' },
          tool_use_id: 'toolu_02',
          tool_response: 'file still parses: yes',
        },
      ],
    },
    ezzsWayOfCodingConfig,
  );

  assert.equal(output, undefined);
});

test('batch reconciler fires on a CLI-authored Error: result string', async () => {
  const output = await evaluateReminderHook(
    {
      hook_event_name: 'PostToolBatch',
      tool_calls: [
        {
          tool_name: 'Read',
          tool_input: { file_path: '/repo/ok.ts' },
          tool_use_id: 'toolu_01',
          tool_response: 'export const ok = true;',
        },
        {
          tool_name: 'Bash',
          tool_input: { command: 'ls /missing' },
          tool_use_id: 'toolu_02',
          tool_response: 'Error: ENOENT: no such file or directory',
        },
      ],
    },
    ezzsWayOfCodingConfig,
  );

  assert.match(
    output?.hookSpecificOutput?.additionalContext ?? '',
    /\[tool-batch:tool-batch-reconcile\]/,
  );
});

test('batch reconciler fires on failed content-block results and denials', async () => {
  const cases = [
    [{ type: 'text', text: 'Error: Tool timed out after 120s' }],
    "The user doesn't want to proceed with this tool use. The tool use was rejected.",
  ];

  for (const toolResponse of cases) {
    const output = await evaluateReminderHook(
      {
        hook_event_name: 'PostToolBatch',
        tool_calls: [
          {
            tool_name: 'Bash',
            tool_input: { command: 'true' },
            tool_use_id: 'toolu_01',
            tool_response: toolResponse,
          },
        ],
      },
      ezzsWayOfCodingConfig,
    );

    assert.match(
      output?.hookSpecificOutput?.additionalContext ?? '',
      /\[tool-batch:tool-batch-reconcile\]/,
    );
  }
});

test('mined reminders fire on matching prompts', async () => {
  const cases = [
    [
      'preserve-existing-surface',
      'Refactor the settings page and clean up the options we no longer need.',
    ],
    ['builtin-test-runner-discipline', 'Write integration tests for the checkout flow.'],
    ['ascii-before-ui', 'Build a new dashboard page for usage metrics.'],
    ['ascii-before-ui', 'Redesign the settings screen.'],
    ['ascii-before-ui', "I'll create a simple page from which I will list all the links."],
    ['ascii-before-ui', 'Add a confirmation modal before the delete.'],
    ['dependency-upgrade-discipline', 'Update openai frameworks and related packages to see if the tickets still stand.'],
    ['dependency-upgrade-discipline', 'Bump zod to the latest version.'],
    ['dependency-upgrade-discipline', 'Which dependencies are outdated?'],
    ['infra-as-code-only', 'Provision a new GCS bucket for artifacts via terraform.'],
  ];

  for (const [id, prompt] of cases) {
    const output = await evaluateReminderHook(
      { hook_event_name: 'UserPromptSubmit', prompt },
      ezzsWayOfCodingConfig,
    );

    assert.match(
      output?.hookSpecificOutput?.additionalContext ?? '',
      new RegExp(`\\[prompt:${id}\\]`),
    );
  }
});

test('mined reminders stay quiet on near-miss prompts', async () => {
  const cases = [
    ['preserve-existing-surface', 'Refactor the date parsing helper for clarity.'],
    ['builtin-test-runner-discipline', 'Investigate why the production build is failing.'],
    ['ascii-before-ui', 'Add pagination support to the list endpoint.'],
    // A UI word and a build word far apart in one prompt, from prompts that
    // got the reminder for no UI work.
    ['ascii-before-ui', 'Change the retry count, then check that the docs site still has the same page.'],
    ['ascii-before-ui', 'Build the package and send me the error from the last page of the log.'],
    ['ascii-before-ui', "what is this\n\n    if (createHash('sha256').update(page.text).digest('hex') !== sha256)"],
    ['ascii-before-ui', 'Make sure the release notes mention the new page.'],
    // A package word and a version word far apart in one prompt.
    ['dependency-upgrade-discipline', 'Pull the latest main and run the SDK tests.'],
    ['dependency-upgrade-discipline', 'Package the CLI and print its version.'],
    ['dependency-upgrade-discipline', 'Update the plan file, then publish the package.'],
    ['infra-as-code-only', 'Deploy the preview build to the static docs host.'],
  ];

  for (const [id, prompt] of cases) {
    const output = await evaluateReminderHook(
      { hook_event_name: 'UserPromptSubmit', prompt },
      ezzsWayOfCodingConfig,
    );

    assert.doesNotMatch(
      output?.hookSpecificOutput?.additionalContext ?? '',
      new RegExp(`\\[prompt:${id}\\]`),
    );
  }
});

test('source reminder fires on user message submit', async () => {
  const output = await evaluateReminderHook(
    { hook_event_name: 'UserPromptSubmit', prompt: 'Implement the requested change.' },
    ezzsWayOfCodingConfig,
  );

  const context = output?.hookSpecificOutput?.additionalContext ?? '';
  assert.match(context, /\[prompt:source-before-new-implementation\]/);
  assert.match(context, /similar implementation/);
  assert.match(context, /probe the relevant behavior and read its source code/);
});

test('source reminder stays scoped to user message submit', async () => {
  const output = await evaluateReminderHook(
    { hook_event_name: 'UserPromptExpansion', prompt: 'Continue.' },
    ezzsWayOfCodingConfig,
  );

  assert.doesNotMatch(
    output?.hookSpecificOutput?.additionalContext ?? '',
    /\[prompt:source-before-new-implementation\]/,
  );
});

test('source reminder stays quiet on a prompt that asks for no implementation', async () => {
  for (const prompt of ['yes', 'commit it', 'What does this hook do?']) {
    const output = await evaluateReminderHook(
      { hook_event_name: 'UserPromptSubmit', prompt },
      ezzsWayOfCodingConfig,
    );

    assert.doesNotMatch(
      output?.hookSpecificOutput?.additionalContext ?? '',
      /\[prompt:source-before-new-implementation\]/,
      prompt,
    );
  }
});

test('root sessions receive out-of-scope capture guidance', async () => {
  for (const hookEventName of ['SessionStart', 'Setup']) {
    const output = await evaluateReminderHook(
      { hook_event_name: hookEventName },
      ezzsWayOfCodingConfig,
    );

    const context = output?.hookSpecificOutput?.additionalContext ?? '';
    assert.match(context, /\[session:capture-out-of-scope-followups\]/);
    assert.match(context, /agent-backlog/);
    assert.match(context, /Do not file upstream bug reports or dev-tooling audit items[^\n]*mention each one once in your reply/i);
    assert.doesNotMatch(context, /deduplicat|duplicate|equivalent open item/i);
  }
});

test('subagents leave out-of-scope backlog writes to the root agent', async () => {
  for (const hookEventName of ['SubagentStart', 'SubagentStop']) {
    const output = await evaluateReminderHook(
      { hook_event_name: hookEventName },
      ezzsWayOfCodingConfig,
    );

    assert.doesNotMatch(
      output?.hookSpecificOutput?.additionalContext ?? '',
      /(?:capture|audit)-out-of-scope-followups/,
    );
  }
});

test('root stop audits out-of-scope follow-ups every third Codex assistant message', async () => {
  const transcriptDirectory = await mkdtemp(
    join(tmpdir(), 'ezzs-way-of-coding-codex-'),
  );

  try {
    const transcriptPath = join(transcriptDirectory, 'transcript.jsonl');

    const evaluateStop = async () => {
      const output = await evaluateReminderHook(
        { hook_event_name: 'Stop', transcript_path: transcriptPath },
        ezzsWayOfCodingConfig,
      );
      return output?.hookSpecificOutput?.additionalContext ?? '';
    };
    const writeTurns = async (turnIds: string[]) => {
      const entries = turnIds.map((turnId) => ({
        type: 'turn_context',
        payload: { turn_id: turnId },
      }));
      await writeFile(
        transcriptPath,
        `${entries.map((entry) => JSON.stringify(entry)).join('\n')}\n`,
      );
    };

    await writeTurns(['turn-1']);
    assert.doesNotMatch(await evaluateStop(), /audit-out-of-scope-followups/);

    await writeTurns(['turn-1', 'turn-2']);
    assert.doesNotMatch(await evaluateStop(), /audit-out-of-scope-followups/);

    await writeTurns(['turn-1', 'turn-2', 'turn-3', 'turn-3']);
    const thirdMessageContext = await evaluateStop();
    assert.match(
      thirdMessageContext,
      /\[stop-feedback:audit-out-of-scope-followups\]/,
    );
    assert.match(thirdMessageContext, /Do not invent work/);
    assert.match(thirdMessageContext, /agent-backlog done <id>/);
    assert.match(thirdMessageContext, /Never run `agent-backlog remove`/);
    assert.doesNotMatch(thirdMessageContext, /agent-backlog remove <id>/);
    assert.match(thirdMessageContext, /Do not file upstream bug reports or dev-tooling audit items[^\n]*mention each one once in your reply/i);
    assert.match(thirdMessageContext, /If storing or closing fails/);
    assert.doesNotMatch(
      thirdMessageContext,
      /deduplicat|duplicate|equivalent open item/i,
    );

    await writeTurns(['turn-1', 'turn-2', 'turn-3', 'turn-4']);
    assert.doesNotMatch(await evaluateStop(), /audit-out-of-scope-followups/);

    await writeTurns([
      'turn-1',
      'turn-2',
      'turn-3',
      'turn-4',
      'turn-5',
      'turn-6',
    ]);
    assert.match(await evaluateStop(), /audit-out-of-scope-followups/);
  } finally {
    await rm(transcriptDirectory, { recursive: true, force: true });
  }
});

test('root stop cadence counts Claude turns without counting tool results or meta messages', async () => {
  const transcriptDirectory = await mkdtemp(
    join(tmpdir(), 'ezzs-way-of-coding-claude-'),
  );

  try {
    const transcriptPath = join(transcriptDirectory, 'transcript.jsonl');

    const entries = [
      { type: 'user', message: { role: 'user', content: 'First request' } },
      {
        type: 'user',
        sourceToolAssistantUUID: 'assistant-1',
        message: { role: 'user', content: [{ type: 'tool_result' }] },
      },
      { type: 'user', message: { role: 'user', content: 'Second request' } },
      {
        type: 'user',
        isMeta: true,
        message: { role: 'user', content: [{ type: 'text', text: 'Skill context' }] },
      },
      { type: 'user', message: { role: 'user', content: 'Third request' } },
    ];
    await writeFile(
      transcriptPath,
      `${entries.map((entry) => JSON.stringify(entry)).join('\n')}\n`,
    );

    const output = await evaluateReminderHook(
      { hook_event_name: 'Stop', transcript_path: transcriptPath },
      ezzsWayOfCodingConfig,
    );

    assert.match(
      output?.hookSpecificOutput?.additionalContext ?? '',
      /\[stop-feedback:audit-out-of-scope-followups\]/,
    );
  } finally {
    await rm(transcriptDirectory, { recursive: true, force: true });
  }
});

// Claude Code sends the work still in flight on Stop as `background_tasks`,
// with the task type as a display name.
async function stopOnThirdTurn(backgroundTasks: unknown[]) {
  const transcriptDirectory = await mkdtemp(
    join(tmpdir(), 'ezzs-way-of-coding-claude-'),
  );

  try {
    const transcriptPath = join(transcriptDirectory, 'transcript.jsonl');
    const entries = ['First request', 'Second request', 'Third request'].map(
      (content) => ({ type: 'user', message: { role: 'user', content } }),
    );
    await writeFile(
      transcriptPath,
      `${entries.map((entry) => JSON.stringify(entry)).join('\n')}\n`,
    );

    const output = await evaluateReminderHook(
      {
        hook_event_name: 'Stop',
        transcript_path: transcriptPath,
        background_tasks: backgroundTasks,
      },
      ezzsWayOfCodingConfig,
    );
    return output?.hookSpecificOutput?.additionalContext ?? '';
  } finally {
    await rm(transcriptDirectory, { recursive: true, force: true });
  }
}

test('root stop audit waits while a subagent or a workflow it started still runs', async () => {
  for (const task of [
    { id: 'a3a963ff468395a67', type: 'subagent', status: 'running', description: 'Group C: #3958', agent_type: 'general-purpose' },
    { id: 'w1', type: 'workflow', status: 'pending', description: 'Fix tickets', name: 'fix-tickets' },
  ]) {
    assert.doesNotMatch(
      await stopOnThirdTurn([task]),
      /audit-out-of-scope-followups/,
      task.type,
    );
  }
});

test('root stop audit runs when no delegated work is in flight', async () => {
  for (const backgroundTasks of [
    [],
    // A dev server or a watcher can run all session; it is not work the turn waits on.
    [{ id: 'b9i2ob8yk', type: 'shell', status: 'running', description: 'npm run dev', command: 'npm run dev' }],
    [{ id: 'm1', type: 'monitor', status: 'running', description: 'CI run', server: 'github', tool: 'watch' }],
  ]) {
    assert.match(
      await stopOnThirdTurn(backgroundTasks),
      /\[stop-feedback:audit-out-of-scope-followups\]/,
      JSON.stringify(backgroundTasks),
    );
  }
});

// Claude Code records the context a Stop hook adds as a transcript attachment.
const AUDIT_FIRE = {
  type: 'attachment',
  attachment: {
    type: 'hook_additional_context',
    content: [
      '[stop-feedback:audit-out-of-scope-followups]\nBefore stopping, capture each concrete, actionable follow-up outside the active request with `agent-backlog`.',
    ],
  },
};

async function stopAfter(entries: object[]) {
  const transcriptDirectory = await mkdtemp(
    join(tmpdir(), 'ezzs-way-of-coding-claude-'),
  );

  try {
    const transcriptPath = join(transcriptDirectory, 'transcript.jsonl');
    await writeFile(
      transcriptPath,
      `${entries.map((entry) => JSON.stringify(entry)).join('\n')}\n`,
    );

    const output = await evaluateReminderHook(
      {
        hook_event_name: 'Stop',
        transcript_path: transcriptPath,
        background_tasks: [],
      },
      ezzsWayOfCodingConfig,
    );
    return output?.hookSpecificOutput?.additionalContext ?? '';
  } finally {
    await rm(transcriptDirectory, { recursive: true, force: true });
  }
}

const userTurn = (content: string) => ({
  type: 'user',
  message: { role: 'user', content },
});

// User entries that Claude Code writes for work the user did not ask the
// agent for, in the shapes the session transcripts hold them.
const NOT_PROMPTS = [
  {
    type: 'user',
    origin: { kind: 'task-notification' },
    message: {
      role: 'user',
      content:
        '<task-notification>\n<task-id>b0sht8ykj</task-id>\n<status>completed</status>\n<summary>Background command finished</summary>\n</task-notification>',
    },
  },
  userTurn('<bash-input>git status</bash-input>'),
  userTurn(
    '<bash-stdout>On branch main</bash-stdout><bash-stderr></bash-stderr>',
  ),
  userTurn(
    '<command-name>/effort</command-name>\n            <command-message>effort</command-message>\n            <command-args>xhigh</command-args>',
  ),
  userTurn(
    '<local-command-stdout>Set effort level to xhigh</local-command-stdout>',
  ),
  // The 2.1.319 binary writes these tags too; no transcript starts with one yet.
  userTurn('<bash-stderr>fatal: not a git repository</bash-stderr>'),
  userTurn('<local-command-stderr>Unknown model</local-command-stderr>'),
  {
    type: 'user',
    message: {
      role: 'user',
      content: [{ type: 'text', text: '[Request interrupted by user]' }],
    },
  },
  {
    type: 'user',
    message: {
      role: 'user',
      content: [
        { type: 'text', text: '[Request interrupted by user for tool use]' },
      ],
    },
  },
  {
    type: 'user',
    isMeta: true,
    origin: { kind: 'peer' },
    message: {
      role: 'user',
      content:
        'Another Claude session sent a message:\n<agent-message from="a24c8559dff70a569">\n[Subagent hand-back] The report follows.\n</agent-message>',
    },
  },
  {
    type: 'user',
    isMeta: true,
    origin: { kind: 'auto-continuation' },
    message: {
      role: 'user',
      content:
        'Your claude.ai usage limit has reset. Continue the task you were working on when the limit was reached; do not repeat work that is already complete.',
    },
  },
];

test('root stop audit counts only prompts the user typed', async () => {
  assert.doesNotMatch(
    await stopAfter([
      userTurn('First request'),
      ...NOT_PROMPTS,
      userTurn('Second request'),
      ...NOT_PROMPTS,
    ]),
    /audit-out-of-scope-followups/,
  );
});

test('root stop audit held back by delegated work runs on the first stop after that work ends', async () => {
  // The third prompt's turn ended while a subagent ran, so no audit was
  // recorded; the hand-back's turn ends with nothing in flight.
  assert.match(
    await stopAfter([
      userTurn('First request'),
      userTurn('Second request'),
      userTurn('Third request'),
      ...NOT_PROMPTS,
    ]),
    /\[stop-feedback:audit-out-of-scope-followups\]/,
  );
});

test('root stop audit waits for three prompts after the audit it last ran', async () => {
  // An audit made up on the fourth prompt's turn; the sixth prompt is not the
  // third after it.
  const sinceAudit = [
    userTurn('First request'),
    userTurn('Second request'),
    userTurn('Third request'),
    userTurn('Fourth request'),
    AUDIT_FIRE,
    userTurn('Fifth request'),
    userTurn('Sixth request'),
  ];
  assert.doesNotMatch(
    await stopAfter(sinceAudit),
    /audit-out-of-scope-followups/,
  );
  assert.match(
    await stopAfter([...sinceAudit, userTurn('Seventh request')]),
    /\[stop-feedback:audit-out-of-scope-followups\]/,
  );
});

test('root stop audit stays quiet without a readable transcript', async () => {
  for (const transcriptPath of [undefined, '/missing/transcript.jsonl']) {
    const output = await evaluateReminderHook(
      { hook_event_name: 'Stop', transcript_path: transcriptPath },
      ezzsWayOfCodingConfig,
    );

    assert.doesNotMatch(
      output?.hookSpecificOutput?.additionalContext ?? '',
      /audit-out-of-scope-followups/,
    );
  }
});

test('core reminders fire on their events', async () => {
  const cases = [
    ['session:session-ezzs-way', { hook_event_name: 'SessionStart' }],
    [
      'prompt:bug-reproduce-first',
      { hook_event_name: 'UserPromptSubmit', prompt: 'Fix the crash when uploading large files.' },
    ],
    [
      'tool-result:tool-failure-root-cause',
      { hook_event_name: 'PostToolUseFailure', tool_name: 'Read', error: 'ENOENT: no such file' },
    ],
    [
      'tool-result:bash-error-root-cause',
      {
        hook_event_name: 'PostToolUse',
        tool_name: 'Bash',
        tool_input: { command: 'rm /tmp/x' },
        tool_output: 'rm: cannot remove /tmp/x: Permission denied',
      },
    ],
  ];

  for (const [tag, input] of cases) {
    const output = await evaluateReminderHook(input, ezzsWayOfCodingConfig);

    assert.match(
      output?.hookSpecificOutput?.additionalContext ?? '',
      new RegExp(`\\[${tag}\\]`),
    );
  }
});

test('core reminders stay quiet off their events', async () => {
  const cases = [
    [
      'session:session-ezzs-way',
      { hook_event_name: 'UserPromptSubmit', prompt: 'Fix the crash when uploading large files.' },
    ],
    [
      'prompt:bug-reproduce-first',
      { hook_event_name: 'UserPromptSubmit', prompt: 'Rename the upload helper for clarity.' },
    ],
    [
      'tool-result:tool-failure-root-cause',
      { hook_event_name: 'PostToolUse', tool_name: 'Read', tool_output: 'file contents' },
    ],
    [
      'tool-result:bash-error-root-cause',
      {
        hook_event_name: 'PostToolUse',
        tool_name: 'Bash',
        tool_input: { command: 'ls' },
        tool_output: 'README.md package.json src',
      },
    ],
  ];

  for (const [tag, input] of cases) {
    const output = await evaluateReminderHook(input, ezzsWayOfCodingConfig);

    assert.doesNotMatch(
      output?.hookSpecificOutput?.additionalContext ?? '',
      new RegExp(`\\[${tag}\\]`),
    );
  }
});

async function bashReminder(command: string, stdout: string, stderr = '') {
  const output = await evaluateReminderHook(
    {
      hook_event_name: 'PostToolUse',
      tool_name: 'Bash',
      tool_input: { command },
      tool_response: { stdout, stderr, interrupted: false, isImage: false, noOutputExpected: false },
    },
    ezzsWayOfCodingConfig,
  );
  return output?.hookSpecificOutput?.additionalContext ?? '';
}

// Each stdout below is an excerpt of a real Bash result that exited 0 and got
// this reminder, from a Claude Code session transcript.
test('bash error reminder ignores successful output that mentions failure words', async () => {
  const cases = [
    ['grep -nE "events:|id:" rules/*.ts', "rules/failures.ts:50:  {\nrules/failures.ts:51:    id: 'bash-error-root-cause',"],
    ['node --test rules.test.ts', 'ℹ tests 44\nℹ pass 44\nℹ fail 0\nℹ cancelled 0'],
    ["sed -n '1,80p' rules/failures.ts", '// PostToolBatch entries carry no structured error marker: the CLI drops the\n// of a file that merely mentions "error" or "failed".'],
    ['python3 -I scan.py', 'transcript lines mentioning bash-error-root-cause: 39'],
    ['python3 -I results.py', 'RESULT     is_error=True PreToolUse:SubagentHandback hook error: Your report hands an unverified gap to your caller.'],
    ['grep -n "failed" dist/index.js', '33:        errorReason: `Guard "${rule.id}" failed to evaluate; denying by default.`\n    } catch (error) {\n      console.error(`Reminder "${rule.id}" evaluation failed`, error);'],
    ['git log -1 --format=%B', 'not start one. A missing or unreadable transcript, or any error, allows'],
    ["agent-backlog remove 104 --yes 2>&1 | tail -3; agent-backlog show 104 2>&1 | tail -3", '■  Backlog item #104 was not found.'],
    ['file README.md', 'README.md: ASCII text'],
    ["node -e 'const a = 1;\n// prints a\nconsole.log(a)'", '1'],
    ["python3 - <<'EOF'\nstatus = 'ok'\nprint(f'status: {status}')\nEOF", 'status: ok'],
    // Text that quotes a tsc diagnostic is not a diagnostic.
    ["sed -n '50,60p' rules/failures.ts", "  /(?:^|\\): )error TS\\d+: /, // rules.ts(4,2): error TS2345: ..."],
    ['node --test readme.test.ts | tail -4', '    actual: "readme-api.mts(42,10): error TS2304: Cannot find name \'WallClock\'.\\n",'],
    ['grep -n "error TS" rules.test.ts', `rules.test.ts:565:    ['npx tsc --noEmit | head -5', "rules.test.ts(497,47): error TS2345: Argument of type 'string' is not assignable."],`],
  ];

  for (const [command, stdout] of cases) {
    assert.doesNotMatch(await bashReminder(command, stdout), /bash-error-root-cause/, stdout);
  }
});

test('bash error reminder fires on error lines a successful command hides', async () => {
  const cases = [
    // Real results from the same transcript: the stage failed, `| head` and `; echo` exited 0.
    ["grep -oE '.{0,400}subagentEffort:.{0,300}' \"$s\" | head -3; echo", 'ugrep: error: error at position 93\n^\\n\\x80-\\xbf][\\x80-\\xbf]*){0,300}\n    exceeds complexity limits___/'],
    ["grep -oE '.{0,300}iy.{0,300}' \"$s\" | head -2; echo '== next =='", 'grep: maximum repetition exceeds 255\n\n== next =='],
    ['git status || true', 'fatal: not a git repository (or any of the parent directories): .git'],
    ['python3 -I job.py; echo done', 'Traceback (most recent call last):\n  File "job.py", line 1, in <module>\ndone'],
    ['node build.js; echo done', 'TypeError: x is not a function\n    at build.js:1:1\ndone'],
    ['npm install || true', 'npm ERR! code ERESOLVE'],
    ['foo; echo done', 'zsh: command not found: foo\ndone'],
    ['npx tsc --noEmit | head -5', "rules.test.ts(497,47): error TS2345: Argument of type 'string' is not assignable."],
    ['npx tsc --noEmit | head -5', "error TS5083: Cannot read file '/repo/tsconfig.json'."],
    // Nx's stream output style puts the project name in front of each line.
    ['npx nx run elt:build | tail -3', "semantic-layer-elt: src/pipeline.ts(71,29): error TS2345: Argument of type '{ history: SQLiteSyncHistory; }' is not assignable."],
    // tsc --pretty colors the location and the word error.
    ['npx tsc --noEmit --pretty | head -5', "\x1b[96ma.ts\x1b[0m:\x1b[93m1\x1b[0m:\x1b[93m7\x1b[0m - \x1b[91merror\x1b[0m\x1b[90m TS2322: \x1b[0mType 'string' is not assignable to type 'number'."],
    ['ls x 2>&1 | cat', "ls: cannot access 'x': No such file or directory"],
  ];

  for (const [command, stdout] of cases) {
    assert.match(await bashReminder(command, stdout), /\[tool-result:bash-error-root-cause\]/, stdout);
  }
});

test('bash error reminder fires on a failure word in a separate stderr', async () => {
  const context = await bashReminder('make all', 'built 3 targets', 'warning: step lint failed, continuing');

  assert.match(context, /\[tool-result:bash-error-root-cause\]/);
});

test('destructive reminder ignores harmless remove wording', async () => {
  const output = await evaluateReminderHook(
    {
      hook_event_name: 'UserPromptSubmit',
      prompt: 'Remove the unused import.',
    },
    ezzsWayOfCodingConfig,
  );

  assert.doesNotMatch(
    output?.hookSpecificOutput?.additionalContext ?? '',
    /\[prompt:guard-destructive-mutations\]/,
  );
});

async function evaluateWithTranscript(entries: object[], prompt: string) {
  const transcriptDirectory = await mkdtemp(
    join(tmpdir(), 'ezzs-way-of-coding-register-'),
  );

  try {
    const transcriptPath = join(transcriptDirectory, 'transcript.jsonl');
    await writeFile(
      transcriptPath,
      `${entries.map((entry) => JSON.stringify(entry)).join('\n')}\n`,
    );

    const output = await evaluateReminderHook(
      {
        hook_event_name: 'UserPromptSubmit',
        transcript_path: transcriptPath,
        prompt,
      },
      ezzsWayOfCodingConfig,
    );
    return output?.hookSpecificOutput?.additionalContext ?? '';
  } finally {
    await rm(transcriptDirectory, { recursive: true, force: true });
  }
}

const commandEntry = (commandName: string) => ({
  type: 'user',
  message: {
    role: 'user',
    content: `<command-message>${commandName.slice(1)}</command-message>\n<command-name>${commandName}</command-name>`,
  },
});

test('the /wait-what register stays active on every turn after it was invoked', async () => {
  for (const commandName of ['/wait-what', '/some-plugin:wait-what']) {
    const context = await evaluateWithTranscript(
      [
        { type: 'user', message: { role: 'user', content: 'First request' } },
        commandEntry(commandName),
        { type: 'user', message: { role: 'user', content: 'Second request' } },
      ],
      'Now build the connector',
    );

    assert.match(context, /\[prompt:wait-what-register\]/, commandName);
    assert.match(context, /wait-what skill/);
    assert.doesNotMatch(context, /Limerence|text2sql|Space/);
  }
});

test('the /wait-what register ignores a command whose name only contains wait-what', async () => {
  for (const commandName of ['/wait-what-notes', '/not-wait-what']) {
    const context = await evaluateWithTranscript(
      [commandEntry(commandName)],
      'Carry on',
    );

    assert.doesNotMatch(context, /wait-what-register/, commandName);
  }
});

test('the /wait-what register ignores a transcript that only quotes the skill', async () => {
  const transcriptDirectory = await mkdtemp(
    join(tmpdir(), 'ezzs-way-of-coding-register-quote-'),
  );

  try {
    const transcriptPath = join(transcriptDirectory, 'transcript.jsonl');
    const entries = [
      { type: 'user', message: { role: 'user', content: 'Read that skill' } },
      {
        type: 'user',
        message: {
          role: 'user',
          content: [
            {
              type: 'tool_result',
              tool_use_id: 'toolu_1',
              content:
                'grep hit: <command-name>/mattpocock-skills:wait-what</command-name>',
            },
          ],
        },
      },
      {
        type: 'assistant',
        message: {
          role: 'assistant',
          content: [{ type: 'text', text: 'The wait-what skill sets it.' }],
        },
      },
    ];
    await writeFile(
      transcriptPath,
      `${entries.map((entry) => JSON.stringify(entry)).join('\n')}\n`,
    );

    const output = await evaluateReminderHook(
      {
        hook_event_name: 'UserPromptSubmit',
        transcript_path: transcriptPath,
        prompt: 'Carry on',
      },
      ezzsWayOfCodingConfig,
    );

    assert.doesNotMatch(
      output?.hookSpecificOutput?.additionalContext ?? '',
      /wait-what-register/,
    );
  } finally {
    await rm(transcriptDirectory, { recursive: true, force: true });
  }
});

// A body that asks for UI, dependency, test and fix work, so that the prompt
// rules fire on it when the user types it.
const RELAYED_BODY =
  'Build a new dashboard page, upgrade the outdated SDK package versions, write tests for the checkout flow and fix the failing build.';

// Claude Code runs UserPromptSubmit for each turn, also for a turn that a
// subagent hand-back, a peer session or a background task starts. These are the
// prompts it sends for them, from session transcripts.
const RELAYED_PROMPTS = [
  `Another Claude session sent a message:\n<agent-message from="a648d7e2a36a348d0">\n[Subagent hand-back] The report follows:\n  ${RELAYED_BODY}\n</agent-message>`,
  `<agent-message from="a1a5defabbab40d16">\n[Subagent hand-back] The report follows:\n  ${RELAYED_BODY}\n</agent-message>`,
  `Another Claude session sent a message:\n<cross-session-message from="uds:/tmp/cc-socks/84391.sock" from-name="evals-design" from-mode="prompting">\n${RELAYED_BODY}\n</cross-session-message>`,
  `<cross-session-message from="uds:/tmp/cc-socks/84391.sock" from-name="evals-design" from-mode="prompting">\n${RELAYED_BODY}\n</cross-session-message>`,
  `<task-notification>\n<task-id>b9i2ob8yk</task-id>\n<status>completed</status>\n<summary>${RELAYED_BODY}</summary>\n</task-notification>`,
];

test('prompt reminders fire on what the user typed', async () => {
  const output = await evaluateReminderHook(
    { hook_event_name: 'UserPromptSubmit', prompt: RELAYED_BODY },
    ezzsWayOfCodingConfig,
  );

  const context = output?.hookSpecificOutput?.additionalContext ?? '';
  for (const id of [
    'ascii-before-ui',
    'dependency-upgrade-discipline',
    'builtin-test-runner-discipline',
    'bug-reproduce-first',
    'session-harvest',
  ]) {
    assert.match(context, new RegExp(`\\[prompt:${id}\\]`));
  }
});

test('prompt reminders stay quiet on a turn that a hand-back, a peer message or a task notification starts', async () => {
  for (const prompt of RELAYED_PROMPTS) {
    const output = await evaluateReminderHook(
      { hook_event_name: 'UserPromptSubmit', prompt },
      ezzsWayOfCodingConfig,
    );

    assert.doesNotMatch(
      output?.hookSpecificOutput?.additionalContext ?? '',
      /\[prompt:/,
      prompt,
    );
  }
});

// Claude Code starts a turn by itself when a usage limit resets, with one of
// these fixed prompts (`origin.kind` `auto-continuation`). The first is in
// session transcripts from 2.1.239 to 2.1.318; the other two are in the
// 2.1.319 binary.
const AUTO_CONTINUATION_PROMPTS = [
  'Your claude.ai usage limit has reset. Continue the task you were working on when the limit was reached; do not repeat work that is already complete.',
  'Your claude.ai usage is available again before the usage-limit reset. Continue the task you were working on when the limit was reached; do not repeat work that is already complete.',
  'You can continue now. Continue the task you were working on when the usage limit was reached; do not repeat work that is already complete.',
];

test('prompt reminders stay quiet on a turn that Claude Code continues after a usage limit resets', async () => {
  for (const prompt of AUTO_CONTINUATION_PROMPTS) {
    const output = await evaluateReminderHook(
      { hook_event_name: 'UserPromptSubmit', prompt },
      ezzsWayOfCodingConfig,
    );

    assert.doesNotMatch(
      output?.hookSpecificOutput?.additionalContext ?? '',
      /\[prompt:/,
      prompt,
    );
  }
});

test('session harvest names Codex memory paths in a Codex session', async () => {
  const context = await evaluateWithTranscript(
    [
      { type: 'session_meta', payload: { id: 'session-1', originator: 'codex_cli_rs' } },
      { type: 'response_item', payload: { type: 'message', role: 'user' } },
    ],
    'yes',
  );

  assert.match(context, /\[prompt:session-harvest\]/);
  assert.match(context, /~\/\.codex\/memories\/extensions\/ad_hoc\/notes\//);
  assert.doesNotMatch(context, /~\/\.claude|auto-memory/);
});

test('session harvest names Claude memory paths in a Claude session', async () => {
  const context = await evaluateWithTranscript(
    [{ type: 'user', message: { role: 'user', content: 'First request' } }],
    'yes',
  );

  assert.match(context, /\[prompt:session-harvest\]/);
  assert.match(context, /~\/\.claude\/skills-reflections\//);
  assert.doesNotMatch(context, /~\/\.codex/);
});

test('session harvest sends a correction a machine could check to the guardrail skill in every agent', async () => {
  const codexContext = await evaluateWithTranscript(
    [
      { type: 'session_meta', payload: { id: 'session-1', originator: 'codex_cli_rs' } },
      { type: 'response_item', payload: { type: 'message', role: 'user' } },
    ],
    'yes',
  );
  const claudeContext = await evaluateWithTranscript(
    [{ type: 'user', message: { role: 'user', content: 'First request' } }],
    'yes',
  );
  const noTranscriptOutput = await evaluateReminderHook(
    { hook_event_name: 'UserPromptSubmit', prompt: 'yes' },
    ezzsWayOfCodingConfig,
  );
  const noTranscriptContext =
    noTranscriptOutput?.hookSpecificOutput?.additionalContext ?? '';

  for (const context of [codexContext, claudeContext, noTranscriptContext]) {
    assert.match(context, /\[prompt:session-harvest\]/);
    assert.match(context, /follow the guardrail skill/);
  }
});

test('session harvest names no agent paths without a readable transcript', async () => {
  for (const transcriptPath of [undefined, '/missing/transcript.jsonl']) {
    const output = await evaluateReminderHook(
      { hook_event_name: 'UserPromptSubmit', transcript_path: transcriptPath, prompt: 'yes' },
      ezzsWayOfCodingConfig,
    );

    const context = output?.hookSpecificOutput?.additionalContext ?? '';
    assert.equal(context.match(/\[prompt:session-harvest\]/g)?.length, 1);
    assert.doesNotMatch(context, /~\/\.claude|~\/\.codex/);
  }
});

test('the /wait-what register stays quiet without a readable transcript', async () => {
  for (const transcriptPath of [undefined, '/missing/transcript.jsonl']) {
    const output = await evaluateReminderHook(
      {
        hook_event_name: 'UserPromptSubmit',
        transcript_path: transcriptPath,
        prompt: 'Carry on',
      },
      ezzsWayOfCodingConfig,
    );

    assert.doesNotMatch(
      output?.hookSpecificOutput?.additionalContext ?? '',
      /wait-what-register/,
    );
  }
});

test('stop pushes back on a final message that hands over an unverified gap', async () => {
  for (const message of [
    'Caveat: no real ATTACH property appeared in the live probes. Attachment rows are covered by synthetic tests only.',
    'The permission prompt on macOS 14 remains unverified.',
    "I couldn't verify the export against real events.",
    'This path was not tested live.',
  ]) {
    const output = await evaluateReminderHook(
      { hook_event_name: 'Stop', last_assistant_message: message },
      ezzsWayOfCodingConfig,
    );
    assert.match(
      output?.hookSpecificOutput?.additionalContext ?? '',
      /\[stop-feedback:live-verify-before-unverified\]/,
      message,
    );
  }
});

test('stop stays quiet when the final message reports completed live checks', async () => {
  for (const message of [
    'Verified live against 960 real events; the second run wrote nothing.',
    'All tests pass and the probe confirmed the deletion with a fresh read.',
  ]) {
    const output = await evaluateReminderHook(
      { hook_event_name: 'Stop', last_assistant_message: message },
      ezzsWayOfCodingConfig,
    );
    assert.doesNotMatch(
      output?.hookSpecificOutput?.additionalContext ?? '',
      /live-verify-before-unverified/,
      message,
    );
  }
});

test('stop reads the final assistant message from the transcript when the hook omits it', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'ezzs-way-of-coding-verify-'));
  try {
    const transcriptPath = join(directory, 'transcript.jsonl');
    const entries = [
      { type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: 'Earlier, everything was checked.' }] } },
      { type: 'user', message: { role: 'user', content: 'Ship it?' } },
      {
        type: 'assistant',
        message: {
          role: 'assistant',
          content: [
            { type: 'tool_use', name: 'Bash' },
            { type: 'text', text: 'Done, but the OAuth consent path remains unverified.' },
          ],
        },
      },
    ];
    await writeFile(transcriptPath, `${entries.map((entry) => JSON.stringify(entry)).join('\n')}\n`);

    const output = await evaluateReminderHook(
      { hook_event_name: 'Stop', transcript_path: transcriptPath },
      ezzsWayOfCodingConfig,
    );

    assert.match(
      output?.hookSpecificOutput?.additionalContext ?? '',
      /\[stop-feedback:live-verify-before-unverified\]/,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('subagent stop ignores an unverified gap in the parent session transcript', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'ezzs-way-of-coding-verify-'));
  try {
    const parentTranscriptPath = join(directory, 'parent.jsonl');
    const agentTranscriptPath = join(directory, 'agent.jsonl');
    await writeFile(
      parentTranscriptPath,
      `${JSON.stringify({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: 'The OAuth consent path remains unverified.' }] } })}\n`,
    );
    const agentEntries = [
      { type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: 'The export is still unverified; probing now.' }] } },
      { type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: 'Verified live against 960 real events.' }] } },
    ];
    await writeFile(
      agentTranscriptPath,
      `${agentEntries.map((entry) => JSON.stringify(entry)).join('\n')}\n`,
    );

    const output = await evaluateReminderHook(
      {
        hook_event_name: 'SubagentStop',
        transcript_path: parentTranscriptPath,
        agent_transcript_path: agentTranscriptPath,
      },
      ezzsWayOfCodingConfig,
    );

    assert.doesNotMatch(
      output?.hookSpecificOutput?.additionalContext ?? '',
      /live-verify-before-unverified/,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('subagent stop pushes back on an unverified gap in its own transcript', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'ezzs-way-of-coding-verify-'));
  try {
    const parentTranscriptPath = join(directory, 'parent.jsonl');
    const agentTranscriptPath = join(directory, 'agent.jsonl');
    await writeFile(
      parentTranscriptPath,
      `${JSON.stringify({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: 'Verified live against 960 real events.' }] } })}\n`,
    );
    await writeFile(
      agentTranscriptPath,
      `${JSON.stringify({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: 'Done, but the OAuth consent path remains unverified.' }] } })}\n`,
    );

    const output = await evaluateReminderHook(
      {
        hook_event_name: 'SubagentStop',
        transcript_path: parentTranscriptPath,
        agent_transcript_path: agentTranscriptPath,
      },
      ezzsWayOfCodingConfig,
    );

    assert.match(
      output?.hookSpecificOutput?.additionalContext ?? '',
      /\[stop-feedback:live-verify-before-unverified\]/,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('subagent stop without its own transcript never judges the parent session transcript', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'ezzs-way-of-coding-verify-'));
  try {
    const parentTranscriptPath = join(directory, 'parent.jsonl');
    await writeFile(
      parentTranscriptPath,
      `${JSON.stringify({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: 'The OAuth consent path remains unverified.' }] } })}\n`,
    );

    for (const agentTranscriptPath of [undefined, '']) {
      const output = await evaluateReminderHook(
        {
          hook_event_name: 'SubagentStop',
          transcript_path: parentTranscriptPath,
          agent_transcript_path: agentTranscriptPath,
        },
        ezzsWayOfCodingConfig,
      );

      assert.doesNotMatch(
        output?.hookSpecificOutput?.additionalContext ?? '',
        /live-verify-before-unverified/,
        String(agentTranscriptPath),
      );
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('subagent stop judges its final message over its own transcript', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'ezzs-way-of-coding-verify-'));
  try {
    const agentTranscriptPath = join(directory, 'agent.jsonl');
    await writeFile(
      agentTranscriptPath,
      `${JSON.stringify({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: 'Done, but the OAuth consent path remains unverified.' }] } })}\n`,
    );

    const output = await evaluateReminderHook(
      {
        hook_event_name: 'SubagentStop',
        agent_transcript_path: agentTranscriptPath,
        last_assistant_message: 'Verified live against 960 real events.',
      },
      ezzsWayOfCodingConfig,
    );

    assert.doesNotMatch(
      output?.hookSpecificOutput?.additionalContext ?? '',
      /live-verify-before-unverified/,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('stop ignores talk about the verification rule itself', async () => {
  for (const message of [
    'Live-check hook: `live-verify-before-unverified` is active and fired for real.',
    'The rule id live-verify-before-unverified lives in rules/verification.ts.',
    'Saved preference: widen a live check before ever calling something unverified.',
    'Only call it unverified when the environment cannot produce it.',
  ]) {
    const output = await evaluateReminderHook(
      { hook_event_name: 'Stop', last_assistant_message: message },
      ezzsWayOfCodingConfig,
    );
    assert.doesNotMatch(
      output?.hookSpecificOutput?.additionalContext ?? '',
      /live-verify-before-unverified/,
      message,
    );
  }
});


// Claude Code keeps a subagent's transcript next to the parent session's:
// <session>.jsonl -> <session>/subagents/agent-<agent_id>.jsonl.
// A word inside a fenced block or double quotes is mentioned, not claimed.
const mentionsOfUnverified = [
  'The probe now reports "unverified" when the export has no live row, and it found one.',
  'The probe now reports “unverified” when the export has no live row, and it found one.',
  [
    'The guard refused my first hand-back with this text:',
    '```',
    'Your report hands an unverified gap to your caller.',
    '```',
    'I ran the live check and it passed.',
  ].join('\n'),
  ['The deny text reads:', '~~~', 'The permission prompt remains unverified.', '~~~', 'All checks ran live.'].join('\n'),
];

test('stop ignores a verification word that the final message only quotes', async () => {
  for (const message of mentionsOfUnverified) {
    const output = await evaluateReminderHook(
      { hook_event_name: 'Stop', last_assistant_message: message },
      ezzsWayOfCodingConfig,
    );
    assert.doesNotMatch(output?.hookSpecificOutput?.additionalContext ?? '', /live-verify-before-unverified/, message);
  }

  const claim = await evaluateReminderHook(
    { hook_event_name: 'Stop', last_assistant_message: 'The probe reports the export as unverified.' },
    ezzsWayOfCodingConfig,
  );
  assert.match(claim?.hookSpecificOutput?.additionalContext ?? '', /\[stop-feedback:live-verify-before-unverified\]/);
});

async function preHandback(
  agentEntries: unknown[],
  input: Record<string, unknown>,
) {
  const directory = await mkdtemp(join(tmpdir(), 'ezzs-way-of-coding-handback-'));
  try {
    const transcriptPath = join(directory, 'session.jsonl');
    await writeFile(transcriptPath, `${JSON.stringify({ type: 'user', message: { role: 'user', content: 'Delegate the probe.' } })}\n`);
    await mkdir(join(directory, 'session', 'subagents'), { recursive: true });
    await writeFile(
      join(directory, 'session', 'subagents', 'agent-a1.jsonl'),
      `${agentEntries.map((entry) => JSON.stringify(entry)).join('\n')}\n`,
    );
    return await evaluateReminderHook(
      {
        hook_event_name: 'PreToolUse',
        transcript_path: transcriptPath,
        agent_id: 'a1',
        agent_type: 'general-purpose',
        tool_use_id: 'toolu_current',
        ...input,
      },
      ezzsWayOfCodingConfig,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

const brief = { type: 'user', message: { role: 'user', content: 'Probe the export and report.' } };
const handback = (id: string, message: string) => ({
  type: 'assistant',
  message: { role: 'assistant', content: [{ type: 'tool_use', id, name: 'SubagentHandback', input: { message } }] },
});
// A subagent's work before it hands back: a tool call, its result, an attachment.
const work = [
  { type: 'assistant', message: { role: 'assistant', content: [{ type: 'tool_use', id: 'toolu_bash', name: 'Bash', input: { command: 'npm test' } }] } },
  { type: 'user', message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'toolu_bash', content: 'pass 12' }] } },
  { type: 'attachment' },
];
const refused = (id: string) => ({
  type: 'user',
  message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: id, is_error: true, content: 'Your report hands an unverified gap to your caller.' }] },
});
const delivered = (id: string) => ({
  type: 'user',
  message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: id, content: [{ type: 'text', text: '{"success":true,"message":"Report delivered to your caller."}' }] }] },
});
const unverifiedReport = 'Done. The OAuth consent path remains unverified.';

test('a subagent hand-back that reports an unverified gap is refused the first time', async () => {
  const output = await preHandback([brief, ...work], {
    tool_name: 'SubagentHandback',
    tool_input: { message: unverifiedReport },
  });

  assert.equal(output?.hookSpecificOutput?.permissionDecision, 'deny');
  assert.match(
    output?.hookSpecificOutput?.permissionDecisionReason ?? '',
    /hands an unverified gap to your caller[\s\S]*run the live check[\s\S]*exact blocker[\s\S]*call SubagentHandback again; that call goes through/,
  );
});

test('a first hand-back is refused even when the transcript already holds that same call', async () => {
  const output = await preHandback([brief, ...work, handback('toolu_current', unverifiedReport)], {
    tool_name: 'SubagentHandback',
    tool_input: { message: unverifiedReport },
  });

  assert.equal(output?.hookSpecificOutput?.permissionDecision, 'deny');
});

test('a second hand-back in the same turn goes through, so a subagent that cannot verify is not stuck', async () => {
  for (const between of [
    [],
    [{ type: 'user', isMeta: true, message: { role: 'user', content: '[handback-send-enforce] Your report has not been delivered. Call SubagentHandback({message: <your full report>}) now; the call ends your run.' } }],
    [{ type: 'user', isMeta: true, origin: { kind: 'task-notification' }, message: { role: 'user', content: '[SYSTEM NOTIFICATION - NOT USER INPUT]\nA background task finished.' } }],
    [{ type: 'user', isMeta: true, origin: { kind: 'peer' }, message: { role: 'user', content: 'Another Claude session sent a message while you were working:\nThe prover finished.' } }],
    [{ type: 'user', isMeta: true, message: { role: 'user', content: '<system-reminder>\nYour final report is delivered through SubagentHandback.\n</system-reminder>' } }],
  ]) {
    const output = await preHandback(
      [brief, ...work, handback('toolu_first', unverifiedReport), refused('toolu_first'), ...between],
      {
        tool_name: 'SubagentHandback',
        tool_input: { message: `${unverifiedReport} Blocker: the consent screen needs the user's Google account.` },
      },
    );

    assert.equal(output?.hookSpecificOutput?.permissionDecision, undefined, JSON.stringify(between));
  }
});

test('a resumed subagent is refused again on its first unverified hand-back of the new task', async () => {
  for (const resume of [
    { type: 'user', isMeta: true, origin: { kind: 'coordinator' }, message: { role: 'user', content: 'The coordinator sent a message while you were working:\nNow probe the import path.' } },
    { type: 'user', message: { role: 'user', content: [{ type: 'text', text: '[Request interrupted by user]' }] } },
  ]) {
    const output = await preHandback(
      [brief, ...work, handback('toolu_first', 'Verified live against 960 real events.'), delivered('toolu_first'), resume, ...work],
      { tool_name: 'SubagentHandback', tool_input: { message: unverifiedReport } },
    );

    assert.equal(output?.hookSpecificOutput?.permissionDecision, 'deny', JSON.stringify(resume));
  }
});

test('a hand-back that only quotes a verification word goes through', async () => {
  for (const message of mentionsOfUnverified) {
    const output = await preHandback([brief, ...work], {
      tool_name: 'SubagentHandback',
      tool_input: { message },
    });

    assert.notEqual(output?.hookSpecificOutput?.permissionDecision, 'deny', message);
  }
});

test('a hand-back that reports completed live checks goes through', async () => {
  for (const message of [
    'Verified live against 960 real events; the second run wrote nothing.',
    'Added the `live-verify-before-unverified` guard; the live probe denied the first call.',
    'Set the status to `unverified` after the probe passed.',
  ]) {
    const output = await preHandback([brief], {
      tool_name: 'SubagentHandback',
      tool_input: { message },
    });

    assert.equal(output?.hookSpecificOutput?.permissionDecision, undefined, message);
  }
});

test('an unverified hand-back goes through when the subagent transcript cannot be read', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'ezzs-way-of-coding-handback-'));
  try {
    const transcriptPath = join(directory, 'session.jsonl');
    const agentsPath = join(directory, 'session', 'subagents');
    await writeFile(transcriptPath, `${JSON.stringify(brief)}\n`);
    await mkdir(join(agentsPath, 'agent-a-directory.jsonl'), { recursive: true });
    await writeFile(join(agentsPath, 'agent-a-garbled.jsonl'), '{"type":"user","message":{"ro\n');
    await writeFile(join(agentsPath, 'agent-a-null.jsonl'), `${JSON.stringify(brief)}\nnull\n`);
    await writeFile(join(agentsPath, 'agent-a-readable.jsonl'), `${JSON.stringify(brief)}\n`);

    for (const input of [
      { transcript_path: transcriptPath, agent_id: 'a-missing' },
      { transcript_path: transcriptPath, agent_id: 'a-directory' },
      { transcript_path: transcriptPath, agent_id: 'a-garbled' },
      { transcript_path: transcriptPath, agent_id: 'a-null' },
      { transcript_path: transcriptPath },
      { agent_id: 'a-readable' },
      { transcript_path: join(directory, 'session.jsonX'), agent_id: 'a-readable' },
    ]) {
      const output = await evaluateReminderHook(
        {
          hook_event_name: 'PreToolUse',
          tool_name: 'SubagentHandback',
          tool_use_id: 'toolu_current',
          tool_input: { message: unverifiedReport },
          ...input,
        },
        ezzsWayOfCodingConfig,
      );

      assert.equal(output?.hookSpecificOutput?.permissionDecision, undefined, JSON.stringify(input));
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('a hand-back without a text report goes through', async () => {
  for (const toolInput of [{}, { message: ['remains unverified'] }, undefined]) {
    const output = await preHandback([brief], {
      tool_name: 'SubagentHandback',
      tool_input: toolInput,
    });

    assert.equal(output?.hookSpecificOutput?.permissionDecision, undefined, String(JSON.stringify(toolInput)));
  }
});

test('another tool whose message reports an unverified gap goes through', async () => {
  const output = await preHandback([brief, ...work], {
    tool_name: 'SendMessage',
    tool_input: { to: 'lead', message: unverifiedReport },
  });

  assert.equal(output?.hookSpecificOutput?.permissionDecision, undefined);
});

test('auxiliary model defaults pin Sonnet and gpt-6.1-sol for code the user builds, and subagents run Opus 5.5', async () => {
  const output = await evaluateReminderHook(
    { hook_event_name: 'SessionStart' },
    ezzsWayOfCodingConfig,
  );
  const context = output?.hookSpecificOutput?.additionalContext ?? '';
  assert.match(context, /Claude Sonnet 5 for Claude and gpt-6\.1-sol for OpenAI/);
  assert.match(context, /Claude Code subagents[^\n]*run Opus 5\.5[^\n]*CLAUDE_CODE_SUBAGENT_MODEL_FORCE/);
  assert.doesNotMatch(context, /Terra|gpt-5\.6-terra/);
});
