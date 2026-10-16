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
  assert.match(sessionContext, /delegates auxiliary work to an AI/);
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
    assert.match(thirdMessageContext, /agent-backlog remove <id> --yes/);
    assert.match(thirdMessageContext, /If storage or removal fails/);
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

test('auxiliary model defaults pin Sonnet and gpt-6.1-sol', async () => {
  const output = await evaluateReminderHook(
    { hook_event_name: 'SessionStart' },
    ezzsWayOfCodingConfig,
  );
  const context = output?.hookSpecificOutput?.additionalContext ?? '';
  assert.match(context, /Claude Sonnet 5 for Claude and gpt-6\.1-sol for OpenAI/);
  assert.doesNotMatch(context, /Terra|gpt-5\.6-terra/);
});
