import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';

import { type ClaudeHookInput, evaluateReminderHook } from '@deepagents/experimental/coding-agent-reminders';
import { TemporaryFiles } from '@zukhruf/fs';

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
    assert.match(context, /A problem in the user's own hooks, skills or plugins \(agent-plugin, `~\/\.claude\/hooks`, `~\/\.agents\/skills`\) is filed in agent-plugin: `agent-backlog add --repo agent-plugin`\./);
    assert.match(context, /A problem in a third-party tool[^\n]*is not filed: mention it once in your reply instead\./);
    assert.doesNotMatch(context, /Do not file upstream bug reports or dev-tooling audit items/);
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
      /capture-out-of-scope-followups/,
    );
  }
});

test('core reminders fire on their events', async () => {
  const cases: [tag: string, input: ClaudeHookInput][] = [
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
  const cases: [tag: string, input: ClaudeHookInput][] = [
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
  const cases: [command: string, stdout: string][] = [
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
  const cases: [command: string, stdout: string][] = [
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
  await using folder = await new TemporaryFiles().directory('ezzs-way-of-coding-register-');
  const transcriptDirectory = folder.path;
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
  await using folder = await new TemporaryFiles().directory('ezzs-way-of-coding-register-quote-');
  const transcriptDirectory = folder.path;
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
  await using folder = await new TemporaryFiles().directory('ezzs-way-of-coding-verify-');
  const directory = folder.path;
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
});

test('subagent stop ignores an unverified gap in the parent session transcript', async () => {
  await using folder = await new TemporaryFiles().directory('ezzs-way-of-coding-verify-');
  const directory = folder.path;
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
});

test('subagent stop pushes back on an unverified gap in its own transcript', async () => {
  await using folder = await new TemporaryFiles().directory('ezzs-way-of-coding-verify-');
  const directory = folder.path;
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
});

test('subagent stop without its own transcript never judges the parent session transcript', async () => {
  await using folder = await new TemporaryFiles().directory('ezzs-way-of-coding-verify-');
  const directory = folder.path;
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
});

test('subagent stop judges its final message over its own transcript', async () => {
  await using folder = await new TemporaryFiles().directory('ezzs-way-of-coding-verify-');
  const directory = folder.path;
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
// A word inside a fenced block or quotes is mentioned, not claimed.
const mentionsOfUnverified = [
  'The probe now reports "unverified" when the export has no live row, and it found one.',
  'The probe now reports “unverified” when the export has no live row, and it found one.',
  "The hook flagged my report because the word 'unverified' appears in it.",
  'The hook flagged my report because the word ‘unverified’ appears in it.',
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

  for (const message of [
    'The probe reports the export as unverified.',
    // Apostrophes inside words are not quotes, so the claim between them still counts.
    "I couldn't reach the store, so the user's export is unverified and it's still open.",
  ]) {
    const claim = await evaluateReminderHook(
      { hook_event_name: 'Stop', last_assistant_message: message },
      ezzsWayOfCodingConfig,
    );
    assert.match(claim?.hookSpecificOutput?.additionalContext ?? '', /\[stop-feedback:live-verify-before-unverified\]/, message);
  }
});

async function preHandback(
  agentEntries: unknown[],
  input: Record<string, unknown>,
) {
  await using folder = await new TemporaryFiles().directory('ezzs-way-of-coding-handback-');
  const directory = folder.path;
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
  await using folder = await new TemporaryFiles().directory('ezzs-way-of-coding-handback-');
  const directory = folder.path;
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

test('auxiliary model defaults pin Sonnet and gpt-6.1-sol for code the user builds', async () => {
  const output = await evaluateReminderHook(
    { hook_event_name: 'SessionStart' },
    ezzsWayOfCodingConfig,
  );
  const context = output?.hookSpecificOutput?.additionalContext ?? '';
  assert.match(context, /Claude Sonnet 5 for Claude and gpt-6\.1-sol for OpenAI/);
  assert.doesNotMatch(context, /Terra|gpt-5\.6-terra/);
});

const preAgent = (tool_input: unknown) =>
  evaluateReminderHook(
    { hook_event_name: 'PreToolUse', tool_name: 'Agent', tool_input } as Parameters<typeof evaluateReminderHook>[0],
    ezzsWayOfCodingConfig,
  );

test('an Agent call that names no effort is refused with the rule for picking one', async () => {
  for (const tool_input of [
    { description: 'Find call sites', prompt: 'grep for foo' },
    { description: 'Find call sites', prompt: 'grep for foo', effort: '' },
  ]) {
    const output = await preAgent(tool_input);
    assert.equal(output?.hookSpecificOutput?.permissionDecision, 'deny', JSON.stringify(tool_input));
    assert.match(
      output?.hookSpecificOutput?.permissionDecisionReason ?? '',
      /user, CLAUDE\.md, a skill or a memory[\s\S]*`low`[\s\S]*checked against the brief alone[\s\S]*`medium`[\s\S]*decides what matters[\s\S]*again with `effort` set; "lower" and "higher"/,
    );
  }
});

test('an Agent call that names an effort, or cannot take one, goes through', async () => {
  for (const tool_input of [
    { prompt: 'grep for foo', effort: 'low' },
    { prompt: 'debug the flake', effort: 'medium' },
    { prompt: 'grep for foo', effort: 'lower' },
    { prompt: 'continue', subagent_type: 'fork' },
    { prompt: 'run the suite', isolation: 'remote' },
  ]) {
    const output = await preAgent(tool_input);
    assert.notEqual(output?.hookSpecificOutput?.permissionDecision, 'deny', JSON.stringify(tool_input));
  }
});

test('the effort guard fails open on a malformed Agent input and leaves other tools alone', async () => {
  for (const tool_input of ['grep for foo', null]) {
    const output = await preAgent(tool_input);
    assert.notEqual(output?.hookSpecificOutput?.permissionDecision, 'deny', JSON.stringify(tool_input));
  }
  const bash = await evaluateReminderHook(
    { hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command: 'ls' } },
    ezzsWayOfCodingConfig,
  );
  assert.notEqual(bash?.hookSpecificOutput?.permissionDecision, 'deny');
});

// A Stop whose transcript, when given, is written as JSONL the way Claude Code
// writes it.
async function stopContext(input: Record<string, unknown>, entries?: object[]) {
  await using folder = await new TemporaryFiles().directory('ezzs-way-of-coding-stop-');
  const directory = folder.path;
  const transcriptPath = join(directory, 'transcript.jsonl');
  if (entries) {
    await writeFile(transcriptPath, `${entries.map((entry) => JSON.stringify(entry)).join('\n')}\n`);
  }
  const output = await evaluateReminderHook(
    { hook_event_name: 'Stop', ...(entries ? { transcript_path: transcriptPath } : {}), ...input },
    ezzsWayOfCodingConfig,
  );
  return output?.hookSpecificOutput?.additionalContext ?? '';
}

const ASK_IN_THE_TOOL = /\[stop-feedback:ask-in-the-tool\]\nYour final message asks the user something, gives him a task, or waits on him in prose\. He reads only AskUserQuestion\./;

test('stop sends a prose ask to AskUserQuestion when the final message waits on the user', async () => {
  for (const message of [
    // Real stalls that ended a turn with work for the user in prose.
    'Still waiting on you at the mini:\n- **The four System Settings toggles:** Privacy, Login Items, Full Disk Access, Accessibility.\n- **One run in Terminal** of the setup script.',
    "**Cleanup that's yours, through Mole:**\n- The 50 untracked files under `~/Desktop`.",
    '| Gap | State |\n| --- | --- |\n| Restart storm | launchd has no restart limit; needs a design choice |',
    '#3966 (the restart storm) is filed and needs your decision.',
  ]) {
    assert.match(await stopContext({ last_assistant_message: message }), ASK_IN_THE_TOOL, message);
  }
});

test('stop sends a prose question, offer or request for input to AskUserQuestion', async () => {
  for (const message of [
    'Two questions before I proceed:\n1. Postgres or SQLite?\n2. Soft deletes?',
    'Sure. A few questions first: which env? which db?',
    'I have two questions.\n1. Postgres or SQLite?\n2. Soft deletes?',
    'To clarify: do you mean staging or prod?',
    'Just to confirm — are you on UAT or prod?',
    'Clarifying questions before I propose a fix:\n1. Which env?\n2. Which DB?',
    'Done.\n\nWant me to schedule an agent in 2 weeks to clean up the flag?',
    'Migration is ready.\n\nShould I run it now?',
    // The offer sits mid-message; the closing question has no offer phrase.
    'Here is where we left off.\n\nSo the question is — what do you want to do next? A few directions:\n\n1. Explore\n2. Prototype\n\nWhat feels right?',
    '**Decisions to confirm before I touch code:**\n\n1. **Storage** — postgres or sqlite?',
    '**Decisions to confirm:**\n1. Postgres or sqlite\n2. Email-link or magic-token',
    'Quick sanity check before I touch code. Want postgres or sqlite.',
    'Done.\n\n- `sdk-it init` now refuses a nameless root manifest. Confirm the refusal, or say if you want a `--package-name` flag instead.',
    'The release is ready and awaiting your approval.',
    'Pushing main is your call.',
    'Both options work. Tell me which one you prefer.',
    // A quoted word is stripped before the check; the request around it stays.
    'Say "go" to start with step 0, or tell me which steps to change or drop.',
    'Nothing is committed yet, so either way is a small move. Say if you want it.',
    // A wait on the user's answer before the agent starts is still an ask (#5799's control).
    "I'll wait for your answer before I start the migration.",
  ]) {
    assert.match(await stopContext({ last_assistant_message: message }), ASK_IN_THE_TOOL, message);
  }
});

test('stop stays quiet on a final message that reports, finishes or only mentions an ask', async () => {
  for (const message of [
    'You chose X, so I did Y.',
    'Nothing needs your decision.',
    'My last message only reported that U12 is committed. Nothing is waiting for your answer.',
    'Nothing needs a decision right now; the prover is still running.',
    'I sent the same two questions to the peer session.',
    '| Whole-library quiz | 5 questions, all from collection book **176286**; the chat references are `COLLECTION` |',
    'Is it complete is one of the three questions in the Dataiku agent: is there enough information to proceed.',
    'All tests pass. The two rules are registered and the old audit rule is gone.',
    'Per your decision on 2026-11-06, the client reads the declared body.',
    'Every decision went through AskUserQuestion this round.',
    'I am reading the memory to see whether it needs your approval first.',
    "A Comparison can't say which stated items went unpaired.",
    'There are some decisions to confirm with legal next week.',
    'We should run the migration before we ship 1.0.',
    'I want to read the spec before I code-review the diff with you.',
    'Docs are at https://example.com/x?utm=foo&ref=bar. Done.',
    'What changed? The migration now runs in two phases instead of one.',
    // An offer phrase with no question mark in its paragraph describes.
    'The CLI asks which option you want and stores it.',
    '**Defect 2: the "two questions" pattern matched a report**',
    // A wait on the agent's own work before its next step is a status line (#5799: c2896527, 2026-11-26).
    '79 of 84 results are in, all with the three required sections. R70, R78, R82, R83 and R84 still run. Anonymizing must happen once over all 84 so the grading key stays whole, so I wait for those five before I start the 7 blind graders (3 cases each).',
    'The gate still runs, so I am waiting on its result before I start the commit.',
  ]) {
    assert.doesNotMatch(await stopContext({ last_assistant_message: message }), /ask-in-the-tool/, message);
  }
});

test('stop sends an explained choice to AskUserQuestion too, also with the agent\'s own pick and a reply format', async () => {
  for (const message of [
    // 2026-11-20: "From now on, you must use ask user question to ask me, not fucking replay and stuff."
    'Four decisions still need your answer. Each has my pick:\n\n1. **Q2, a test starting a second program:** drop the rule.\n2. **Q3:** keep it as a written note.\n\nReply with something like **"2 drop, 3 note"**, or change any of them.',
    'Cleanup can fail loudly or quietly:\n\n| Form | Test fails too |\n|---|---|\n| `try/finally` | the real failure is lost |\n| `await using` | both errors show |\n\n**My pick: A.** It keeps both errors.\n\nReply **"A"**, **"B"** or **"C"**.',
    '**My pick: B.** It reports loudly enough.\n\nReply like **"1 A, 2 B, 3 yes"**, or change any of them.',
  ]) {
    assert.match(await stopContext({ last_assistant_message: message }), ASK_IN_THE_TOOL, message);
  }
  // A reply that is described, not asked for, stays quiet.
  assert.doesNotMatch(
    await stopContext({ last_assistant_message: 'The reply from mutex-2b says the pool work is committed.' }),
    /ask-in-the-tool/,
  );
});

test('stop sends a prose ask to AskUserQuestion even when the same turn already used AskUserQuestion', async () => {
  const context = await stopContext({}, [
    { type: 'user', message: { role: 'user', content: 'Set up the mini.' } },
    {
      type: 'assistant',
      message: {
        role: 'assistant',
        content: [
          { type: 'tool_use', id: 'q1', name: 'AskUserQuestion', input: { questions: [] } },
          { type: 'text', text: 'Thanks. Still waiting on you for the Full Disk Access toggle.' },
        ],
      },
    },
  ]);
  assert.match(context, ASK_IN_THE_TOOL);
});

const toolCall = (name: string, input: object = {}) => ({
  type: 'assistant',
  message: { role: 'assistant', content: [{ type: 'tool_use', id: `toolu_${name}`, name, input }] },
});
const bash = (command: string, options: object = {}) => toolCall('Bash', { command, ...options });
const said = (text: string) => ({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text }] } });
const sweep = toolCall('Skill', { skill: 'housekeeping', args: 'Before the done report.' });
// Claude Code writes this entry each time a turn stops.
const stopped = { type: 'system', subtype: 'stop_hook_summary', hookCount: 6, hookInfos: [] };
// A prompt the user typed: Claude Code records its origin as human.
const userSays = (content: string) => ({ type: 'user', origin: { kind: 'human' }, message: { role: 'user', content } });
// A message the user sent while the turn ran (Claude Code 2.1.332's transcript shape).
const queued = (prompt: string, kind = 'human') => ({
  type: 'attachment',
  attachment: { type: 'queued_command', prompt, commandMode: 'prompt', origin: { kind }, humanTurn: true },
});
// The answer to an AskUserQuestion: the tool_result and the toolUseResult Claude Code writes beside it.
const dialogAnswer = (question: string, labels: string[], answer: string) => ({
  type: 'user',
  message: {
    role: 'user',
    content: [
      {
        type: 'tool_result',
        tool_use_id: 'toolu_AskUserQuestion',
        content: `Your questions have been answered: "${question}"="${answer}". You can now continue with these answers in mind.`,
      },
    ],
  },
  toolUseResult: {
    questions: [{ question, header: 'Push', options: labels.map((label) => ({ label, description: '' })), multiSelect: false }],
    answers: { [question]: answer },
  },
});
const request = userSays('Fix the reaper.');
const reply = said('Fixed.');
const commit = bash('git commit --only -m "fix: the reaper" src/reaper.ts');
const BEFORE_DONE =
  '[stop-feedback:housekeeping-due]\nBefore this turn ends, call the housekeeping skill in before-done mode (a sweep from memory does not count).';

// housekeeping-due fires on a real change since the last sweep: a commit or a
// push, or a close claim in the final message. Edits, reads and a change of the
// background task set (Agent, background Bash, Monitor, TaskStop) alone do not:
// the agent that starts work is doing what idle mode asks. Measured on the 2520
// organic stops of 59 sessions (forensics 2026-11-26,
// guardrail-scratch/segments.jsonl), on the agents' real behavior there (they
// rarely called the skill, so a due rule stayed due): the old "any tool since
// the last sweep" trigger fired at 2297 (91 %), this trigger at 1882 (75 %)
// (blind judge, judge-result.md). Counting only the stops where a trigger
// happens, as if each fire were answered by a housekeeping Skill call, it fires
// at 493 (19.6 %): git 354, close claim 126, a change not yet swept 37
// (hooks-6c-scratch/k1-6c-set.mjs). The 19.6 % is not comparable with the 91 %.
test('stop asks for a housekeeping sweep after a commit, a push or a close claim', async () => {
  for (const [label, entries] of [
    ['a commit', [request, commit, reply]],
    ['a push', [request, bash('git -C ~/Desktop/x push origin main'), reply]],
    ['sweep, stop, then a commit', [request, commit, sweep, reply, stopped, request, commit, reply]],
  ] as const) {
    assert.ok((await stopContext({}, [...entries])).includes(BEFORE_DONE), label);
  }
  for (const claim of ['Safe to close.', 'Nothing new.', 'Nothing of mine is running.', 'All done.']) {
    assert.ok((await stopContext({}, [request, said(claim)])).includes(BEFORE_DONE), claim);
  }
});

test('stop stays quiet on housekeeping after edits, reads, messages and background launches alone', async () => {
  for (const [label, entries] of [
    ['no tool call at all', [request, reply]],
    ['a background command', [request, bash('npm test', { run_in_background: true }), reply]],
    ['a subagent launch', [request, toolCall('Agent', { prompt: 'Probe.' }), reply]],
    ['a stopped task', [request, toolCall('TaskStop', { task_id: 'b1' }), reply]],
    ['an armed watch', [request, toolCall('Monitor', { command: 'gh run watch' }), reply]],
    ['edits', [request, toolCall('Edit', { file_path: '/x/a.ts' }), toolCall('Write', { file_path: '/x/b.ts' }), reply]],
    ['reads', [request, bash('git status --short && git log --oneline -3'), toolCall('Read', { file_path: '/x/a.ts' }), reply]],
    ['a message to a peer', [request, toolCall('SendMessage', { to: 'a1', message: 'Go on.' }), reply]],
    ['a commit swept in the same turn', [request, commit, sweep, commit, reply]],
    ['a plugin-prefixed sweep after the commit', [request, commit, toolCall('Skill', { skill: 'ezzabuzaid:housekeeping' }), reply]],
    ['a commit, a sweep, a stop, then only edits', [request, commit, sweep, reply, stopped, request, toolCall('Edit'), reply]],
    ['a close claim in the turn of the sweep', [request, commit, sweep, said('Safe to close.')]],
  ] as const) {
    assert.doesNotMatch(await stopContext({}, [...entries]), /housekeeping-due/, label);
  }
});

// The blind judge of 2026-11-26 found 3 of 10 sampled fires false: the words
// "commit" and "push" inside a heredoc body or another command's quoted
// argument, in sessions that never committed or pushed (judge-result.md).
test('housekeeping counts a git commit or push only where a shell command starts, never words in a heredoc or a quoted argument', async () => {
  for (const [label, command] of [
    ['a commit with a message', 'git commit -m "fix: the reaper"'],
    ['a push after cd', 'cd ~/Desktop/x && git push origin main'],
    ['a commit in another checkout', 'git -C /repo commit --only -F f -- a b'],
    ['a commit after a semicolon', 'npx prettier --write a.ts; git commit --only -m x a.ts'],
    ['a commit on a new line', 'git add a.ts\ngit commit -m x'],
    ['a commit after a heredoc', "cat > msg.txt <<'EOF'\nfix: the reaper\nEOF\ngit commit -F msg.txt"],
    ['a commit whose message is a heredoc', "git commit -m \"$(cat <<'EOF'\nfix: the reaper\n\nIt stops at once.\nEOF\n)\""],
    // Real pushes and commits of the corpus run under a wrapper or a shell -c.
    ['a push under timeout', 'timeout 1500 git push origin main > push.log 2>&1'],
    ['a push under gtimeout -s KILL', 'gtimeout -s KILL 900 git push origin main'],
    ['a push under caffeinate', 'log=/x/push.log && caffeinate -dimsu git push origin main > "$log" 2>&1'],
    ['a push after a test', '[ "$(git log --format=%h origin/main..main)" = "d418442" ] && nohup git push origin main'],
    ['a commit as an if condition', 'if git commit --only -F msg.txt -- a.ts > commit.log 2>&1; then echo ok; fi'],
    ['a commit inside bash -c', 'F="a.ts b.ts"; timeout 900 bash -c "git add -- $F && git commit -q -m \\"fix: x\\" -- $F"'],
  ] as const) {
    assert.ok((await stopContext({}, [request, bash(command), reply])).includes(BEFORE_DONE), label);
  }
  for (const [label, command] of [
    [
      'a python heredoc that writes a plan line',
      "python3 - <<'EOF'\nimport re\np = '/Users/x/.claude/plans/p.md'\ns = open(p).read()\ns = s.replace('STATUS:', 'STATUS: LAUNCHED C1 apply: git apply, agent-backlog typecheck+test, copy-check, commit, push')\nopen(p, 'w').write(s)\nEOF",
    ],
    [
      'a backlog description that names git',
      'agent-backlog update 5410 --description "Track the file: .gitignore + git rm --cached src/gen.ts, then commit the regenerated file"',
    ],
    ['a single-quoted argument', "echo 'next: git push origin main'"],
    ['a quoted argument that holds a whole command', 'agent-backlog add "Push: run the gate && git push origin main once it passes" --repo mutex'],
    ['a heredoc body line that names a command', "cat >> ~/.claude/plans/p.md <<'EOF'\nNext, after the gate:\ngit push origin main\nEOF"],
  ] as const) {
    assert.doesNotMatch(await stopContext({}, [request, bash(command), reply]), /housekeeping-due/, label);
  }
});

test('only a housekeeping Skill call answers a housekeeping fire; an inline sweep or another skill does not', async () => {
  const fired = [request, commit, reply, stopped];
  for (const [label, entries] of [
    ['an inline sweep from memory', [...fired, userSays('Go on with the docs.'), said('**Swept:** Nothing new. Records are current.')]],
    ['another skill', [...fired, userSays('Go on with the docs.'), toolCall('Skill', { skill: 'write-test' }), reply]],
    ['a stop with no tool call', [...fired, userSays('Go on with the docs.'), reply]],
  ] as const) {
    assert.ok((await stopContext({}, [...entries])).includes(BEFORE_DONE), label);
  }
  assert.doesNotMatch(await stopContext({}, [...fired, userSays('Go on with the docs.'), sweep, reply]), /housekeeping-due/);
});

test('stop asks for an idle housekeeping round while any background work still runs', async () => {
  for (const [task, named] of [
    [{ id: 'a3a963ff468395a67', type: 'subagent', status: 'running', description: 'Group C: #3958', agent_type: 'general-purpose' }, 'subagent a3a963ff468395a67 (Group C: #3958)'],
    [{ id: 'w1', type: 'workflow', status: 'pending', description: 'Fix tickets', name: 'fix-tickets' }, 'workflow w1 (Fix tickets)'],
    [{ id: 'b9i2ob8yk', type: 'shell', status: 'running', description: 'npm run dev', command: 'npm run dev' }, 'shell b9i2ob8yk (npm run dev)'],
    [{ id: 'm1', type: 'monitor', status: 'running', description: 'CI run', server: 'github', tool: 'watch' }, 'monitor m1 (CI run)'],
    [{ status: 'running' }, 'a task'],
  ] as const) {
    const context = await stopContext({ background_tasks: [task] }, [request, commit, reply]);
    assert.ok(
      context.includes(
        `[stop-feedback:housekeeping-due]\nBackground work is still running: ${named}. Before this turn ends, call the housekeeping skill in idle mode (a sweep from memory does not count)`,
      ),
      context,
    );
    assert.doesNotMatch(context, /before-done mode/, named);
    // Running work is no reason to stop: the reminder sends the agent on to the work that does not wait on it.
    assert.match(context, /then start every queued item that does not depend on that work/, named);
    assert.match(context, /A test run, CI run, push or deploy never holds the queue: start every item it does not block\./, named);
    assert.match(context, /End the turn with what remains: what runs and who receives it, and each queued item with what it waits on\./, named);
    assert.doesNotMatch(context, /keep waiting|End the turn only when every remaining item waits on it/, named);
  }
  // A /clear keeps a subagent running; the reminder names every task, so none is reported as gone.
  const both = await stopContext(
    {
      background_tasks: [
        { id: 'a791e34a38c02e610', type: 'subagent', status: 'running', description: 'deepagents #3369 tests pass db.pool()' },
        { id: 'b1', type: 'shell', status: 'running', description: 'race proof' },
      ],
    },
    [request, commit, reply],
  );
  assert.ok(both.includes('running: subagent a791e34a38c02e610 (deepagents #3369 tests pass db.pool()); shell b1 (race proof).'), both);
  assert.ok((await stopContext({ background_tasks: [] }, [request, commit, reply])).includes(BEFORE_DONE));
});

test('a headless run gets neither Stop rule: it has no AskUserQuestion and no person to sweep for', async () => {
  const ask = 'Two questions for you:\n1. A?\n2. B?';
  const worked = [request, commit, reply];
  // hook.ts copies Claude Code's CLAUDE_CODE_ENTRYPOINT into the input: `claude -p` and the SDKs.
  for (const entrypoint of ['sdk-cli', 'sdk-ts', 'sdk-py']) {
    const context = await stopContext({ claude_code_entrypoint: entrypoint, last_assistant_message: ask }, worked);
    assert.doesNotMatch(context, /ask-in-the-tool|housekeeping-due/, entrypoint);
  }
  // An interactive session, and a host that sends no entrypoint (Codex), keep both rules.
  for (const input of [{ claude_code_entrypoint: 'cli' }, {}]) {
    const context = await stopContext({ ...input, last_assistant_message: ask }, worked);
    assert.match(context, ASK_IN_THE_TOOL, JSON.stringify(input));
    assert.ok(context.includes(BEFORE_DONE), JSON.stringify(input));
  }
});

test('stop stays quiet on housekeeping in a Codex session and without a transcript', async () => {
  const codex = [
    { type: 'turn_context', payload: { turn_id: 'turn-1' } },
    toolCall('shell', { command: 'git commit -m x' }),
    reply,
  ];
  assert.doesNotMatch(await stopContext({}, codex), /housekeeping-due/);
  assert.doesNotMatch(await stopContext({ last_assistant_message: 'Done.' }), /housekeeping-due/);
});

// K2: a turn that only answers the user's question ends on the answer. Both
// Stop rules would fire here: a commit earlier in the session is not swept,
// and the answer ends in a prose offer.
const unswept = [request, commit, reply, stopped];
const answer = 'Six items are open: #5401 to #5406.\n\nWant me to start on #5401?';

test('neither Stop rule fires after a turn that only answers a question from the user', async () => {
  for (const [label, entries] of [
    ['a typed question', [userSays('how many items open?'), bash('agent-backlog list --json'), said(answer)]],
    ['a question with no question mark', [userSays('which of them is the oldest'), said(answer)]],
    ['a question sent while the turn ran', [userSays('Fix the reaper.'), bash('git status'), queued('wait, how many items are open?'), said(answer)]],
    ['a question typed into the dialog', [userSays('Fix the reaper.'), toolCall('AskUserQuestion'), dialogAnswer('Push main now?', ['Push', 'Hold'], 'what does the push release?'), said(answer)]],
    // The loose match of "remaining" catches no other rem…n word.
    ['a question with a word like remain', [userSays('what reminds the agent of the remote?'), said(answer)]],
    ['an answer that shows a markdown image', [userSays('how does the chart look?'), said(`![chart](chart.png)\n\n${answer}`)]],
  ] as const) {
    const context = await stopContext({}, [...unswept, ...entries]);
    assert.doesNotMatch(context, /housekeeping-due|ask-in-the-tool/, label);
  }
});

test('the Stop rules still fire after a question when the turn wrote, or the question asks for the wrap-up', async () => {
  for (const [label, turn] of [
    ['an edit', [userSays('how many items open?'), toolCall('Edit', { file_path: '/x/a.ts' }), said(answer)]],
    ['a commit', [userSays('how many items open?'), commit, said(answer)]],
    ['a backlog write', [userSays('how many items open?'), bash('agent-backlog add "x" --repo mutex'), said(answer)]],
    ['a subagent launch', [userSays('how many items open?'), toolCall('Agent', { prompt: 'Count.' }), said(answer)]],
    ['a background command', [userSays('how many items open?'), bash('npm test', { run_in_background: true }), said(answer)]],
    ['a Bash write into memory', [userSays('how many items open?'), bash("printf '%s' x >> ~/.claude/projects/p/memory/MEMORY.md"), said(answer)]],
    ['a Bash write into a plan', [userSays('how many items open?'), bash("sed -i '' 's/a/b/' ~/.claude/plans/x.md"), said(answer)]],
    // The blind judge of 2026-11-26: a turn that messaged a subagent (5aa5f72e:2780), or handed the user `!` commands (7e65b385:7610), acted.
    ['a message to a subagent', [userSays('why does the agent host live in startup.ts?'), toolCall('SendMessage', { to: 'a1', message: 'Use the Docker host.' }), said(answer)]],
    ['a `!` command for the user', [userSays('are we using gpt tokenizer'), bash('node probe.mjs'), said(`${answer}\n\n\`\`\`\n! /Applications/Tailscale.app/Contents/MacOS/Tailscale set --exit-node=\n\`\`\``)]],
    ['a statement, not a question', [userSays('Count the open items.'), said(answer)]],
    ['a peer asks, not the user', [userSays('Fix the reaper.'), queued('can you release the lock on mutex?', 'peer'), said(answer)]],
    // The tool_result quotes each question, so only the typed words are read; a picked label is an answer even when it ends in a question mark.
    ['a dialog answer that picks an option', [userSays('Fix the reaper.'), toolCall('AskUserQuestion'), dialogAnswer('Push main now?', ['Push when green?', 'Hold'], 'Push when green?'), said(answer)]],
  ] as const) {
    const context = await stopContext({}, [...unswept, ...turn]);
    assert.match(context, ASK_IN_THE_TOOL, label);
    assert.ok(context.includes(BEFORE_DONE), label);
  }
  for (const wrapUp of [
    "what's left?",
    'what remains?',
    // A typo the judge found (7e65b385:8351).
    'what is remiaining?',
    "what's remaining?",
    'anything remaining?',
    'can I close this session?',
    'you finished everything? are you sure?',
    'double check it, is it all pushed?',
    'what are you waiting for?',
  ]) {
    const context = await stopContext({}, [...unswept, userSays(wrapUp), bash('git status'), said(answer)]);
    assert.ok(context.includes(BEFORE_DONE), wrapUp);
    assert.match(context, ASK_IN_THE_TOOL, wrapUp);
  }
});

// K5: "Safe to close" is the housekeeping skill's verdict phrase (89 of 89
// final messages that wrote it were close claims, forensics 2026-11-26), and
// both scripts of the duty list (close-check and records-check) must run in the same turn.
const CLOSE_CHECK =
  "[stop-feedback:close-check-before-safe-to-close]\nYou wrote 'Safe to close' without running the housekeeping skill's scripts/close-check.mjs and scripts/records-check.mjs in this turn. Run both, mark every line they print (done with its evidence, or open with its item or reason), and give the Duty list.";
const closeCheck = bash('node ~/agent-plugin/skills/housekeeping/scripts/close-check.mjs --session x');
const recordsCheck = bash('node ~/agent-plugin/skills/housekeeping/scripts/records-check.mjs');

test('stop sends a Safe to close claim back unless both duty-list scripts ran in the same turn', async () => {
  for (const [label, entries] of [
    ['no script', [request, sweep, said('Nothing new.\n\nSafe to close.')]],
    ['both scripts ran in an earlier turn', [request, closeCheck, recordsCheck, reply, stopped, userSays('Close?'), sweep, said('Safe to close.')]],
    ['only close-check ran', [request, sweep, closeCheck, said('Safe to close.')]],
    ['only records-check ran', [request, sweep, recordsCheck, said('Safe to close.')]],
  ] as const) {
    assert.ok((await stopContext({}, [...entries])).includes(CLOSE_CHECK), label);
  }
  assert.doesNotMatch(
    await stopContext({}, [request, sweep, closeCheck, recordsCheck, said('Safe to close.')]),
    /close-check-before-safe-to-close/,
  );
  // Only the verdict phrase: other done words are often descriptions ("Reader B finished").
  for (const message of ['Nothing of mine is running.', 'Reader B finished.', 'All done.', 'The skill writes "Safe to close" as its verdict.']) {
    assert.doesNotMatch(await stopContext({}, [request, sweep, said(message)]), /close-check-before-safe-to-close/, message);
  }
});

// The blind judge of 2026-11-26 found 4 of 10 sampled fires false: a negated
// verdict or a condition, which claims nothing (judge-result.md).
test('stop leaves a Not safe to close verdict or a condition alone and still sends back a Safe to close claim', async () => {
  for (const message of [
    'Not safe to close: both are still open.',
    '**Not safe to close:** CI is the last open check.',
    'Not safe to close yet: 9f07a59 is unpushed',
    'The session is not yet safe to close: CI still runs.',
    'Once both pass, the session is safe to close.',
  ]) {
    assert.doesNotMatch(await stopContext({}, [request, sweep, said(message)]), /close-check-before-safe-to-close/, message);
  }
  for (const message of ['Safe to close.', 'Once CI passed, I pushed 9f07a59; nothing of mine runs. Safe to close.']) {
    assert.ok((await stopContext({}, [request, sweep, said(message)])).includes(CLOSE_CHECK), message);
  }
});

// A stop that a stop hook already continued (stop_hook_active) gets a Stop rule
// again only when the rule opts in with continuedStops: 'once', and only while
// the transcript holds none of the rule's own feedback since the last human
// turn. Claude Code writes that feedback as a hook_additional_context
// attachment whose content starts with the rule's marker line.
const hookFeedback = (...content: string[]) => ({
  type: 'attachment',
  attachment: { type: 'hook_additional_context', content },
});
const PROSE_ASK = 'Two questions for you:\n1. A?\n2. B?';
const pushed = bash('git push origin main');

test('a subagent stop and a continued stop never get a Stop rule that is not opted in', async () => {
  for (const input of [
    { hook_event_name: 'SubagentStop', last_assistant_message: PROSE_ASK },
    { stop_hook_active: true, last_assistant_message: PROSE_ASK },
  ]) {
    assert.doesNotMatch(await stopContext(input, [request, pushed, said(PROSE_ASK)]), /housekeeping-due/, JSON.stringify(input));
  }
  assert.doesNotMatch(
    await stopContext({ hook_event_name: 'SubagentStop', last_assistant_message: PROSE_ASK }, [request, pushed, said(PROSE_ASK)]),
    /ask-in-the-tool/,
  );
});

test('a continued stop sends a Safe to close claim back once per human turn', async () => {
  const earlierTurn = [userSays('Close?'), said('Safe to close.'), hookFeedback(CLOSE_CHECK), said('Ran it.')];
  assert.ok(
    (await stopContext({ stop_hook_active: true }, [...earlierTurn, userSays('Close now?'), sweep, said('Safe to close.')])).includes(CLOSE_CHECK),
    'no feedback of its own since the last human turn',
  );
  assert.doesNotMatch(
    await stopContext({ stop_hook_active: true }, [userSays('Close?'), sweep, said('Safe to close.'), hookFeedback(CLOSE_CHECK), said('Safe to close.')]),
    /close-check-before-safe-to-close/,
  );
});

test('a continued stop sends a prose ask to AskUserQuestion once per human turn', async () => {
  const askFeedback = `[stop-feedback:ask-in-the-tool]\nYour final message asks the user something.`;
  const earlierTurn = [userSays('Plan it.'), said(PROSE_ASK), hookFeedback(askFeedback), said('Asked in the dialog.')];
  assert.match(
    await stopContext({ stop_hook_active: true, last_assistant_message: PROSE_ASK }, [...earlierTurn, userSays('Go on.'), said(PROSE_ASK)]),
    ASK_IN_THE_TOOL,
  );
  assert.doesNotMatch(
    await stopContext({ stop_hook_active: true, last_assistant_message: PROSE_ASK }, [userSays('Go on.'), said(PROSE_ASK), hookFeedback(askFeedback), said(PROSE_ASK)]),
    /ask-in-the-tool/,
  );
});

test('stop sends the asks it used to miss to AskUserQuestion: your go, waits on you, asks in the chat, a slash command to type', async () => {
  for (const message of [
    '**Yours, when you choose**\n- **mac-mini back** (#5048).',
    'The deploy needs your go when they are committed.',
    'The writer question waits on your direction.',
    '**Still waits on you:** a yes to the zukhruf push for #5682.',
    '#5463 waits on you.',
    'Waiting on you: the zukhruf push for #5682.',
    'The questions are above.',
    'To resume, type `/housekeeping` when you are back.',
    'The next step is your review of the paper.',
  ]) {
    assert.match(await stopContext({ last_assistant_message: message }), ASK_IN_THE_TOOL, message);
  }
});

test('stop stays quiet on a report that only mentions the user\'s go or a wait that is not on him', async () => {
  for (const message of [
    '- **Waits on you:** nothing.',
    '**Waits on you:** none.',
    'Your go is recorded on #5723. The spelling step pushes once its fixes pass the gates.',
    'Your go was already given on #5645, so the push runs when green.',
    'Per your direction, the push waits for CI.',
    'No decision waits on you.',
    'I pushed it without your go-ahead to the staging branch only.',
    // The blind judge of 2026-11-26 (881553d1:5507): a negation through "none of them".
    'Three things are running now, and none of them waits on you.',
    'None of these wait on you.',
    'none of them is waiting on you',
    'No item waits on you.',
  ]) {
    assert.doesNotMatch(await stopContext({ last_assistant_message: message }), /ask-in-the-tool/, message);
  }
});

// #5758: a "yours" line that names a later or conditional ask, or what the
// user holds without asking for it now, is a status line. The first three are
// real final messages the rule fired on (7e65b385:4959; c2896527:6304; the
// Remaining line of c2896527:4143), the fourth is a49f8e8d:5222.
test('stop stays quiet on a status line that names a later ask or what the user holds', async () => {
  for (const message of [
    "I'm verifying `37ee3898` on dev, as you chose. Its deploy is still running.\n\nOnce dev answers with that version and the writer holds the warehouse and connects without stopping, I'll give you the v3.1.0 tag command for `37ee3898`.\n\nThat command stays yours to run, because the repo's git guardrail hook blocks me from creating tags.",
    '**Remaining:** the root cause from the 5 whys above is yours to read: "done" is checked by the worker, from the worker\'s memory, against past failures, not against the duties this work created, recorded as they appear. I propose no fix until you agree with it.',
    '- **Waits on deepagents-ca\'s "clear":** the nx gate for the reminder package.\n- **Yours, later:** one approval for the memory cleanup.',
    "When they pass, I'll commit locally, and the push is yours.",
    'The push is yours once CI is green.',
    'The tag is yours after the deploy lands.',
  ]) {
    assert.doesNotMatch(await stopContext({ last_assistant_message: message }), /ask-in-the-tool/, message);
  }
});

// #5788: a "yours" in a relative clause describes a noun ("decisions that are
// yours"); it hands over no task. Real final messages the rule fired on:
// c2896527:4143, fd967b74:1074, e760f78f:6697.
test('stop stays quiet on a sentence that only describes what is yours', async () => {
  for (const message of [
    'It still loses on one case (case 2), where you have a table of open decisions. In that case the new text let the agent drop decisions that are yours. One run skipped #4455 because it was "filed today".',
    'Nothing new. The only decision that is yours (the push rule) is asked in the chat, as you wanted.',
    "Housekeeping (idle): the one decision that's yours, whether a shared agent hook may refuse `npm link`, depends on what the guard explorer finds.",
  ]) {
    assert.doesNotMatch(await stopContext({ last_assistant_message: message }), /ask-in-the-tool/, message);
  }
});

test('stop still sends a task handed over now to AskUserQuestion', async () => {
  for (const message of [
    // A heading over a task list is a label, not a description (881553d1:5780).
    '**Next, two things that are yours:**\n- **A production tag** for this fix: v3.2.1.',
    // "that" after a conjunction points at a task; it starts no relative clause.
    'Step 3 is the push, and that is yours.',
    'That one is yours.',
    'The push is yours.',
    'The next step is yours.',
    'Not pushed; pushes are yours.',
    'The tag itself is yours to cut.',
    // A later word before the clause that is not a condition on it.
    'Pushing it, running the migration after deploy (#5533) and the plugin upload (#5506) are yours.',
    'The release is ready. Your go?',
  ]) {
    assert.match(await stopContext({ last_assistant_message: message }), ASK_IN_THE_TOOL, message);
  }
});

test('ask-in-the-tool says to explain in the chat and ask briefly in the dialog', async () => {
  const context = await stopContext({ last_assistant_message: 'Pushing main is your call.' });
  assert.match(context, /Explain in the chat in plain words, then ask in AskUserQuestion with a one-line question and short labels, your pick first, 2-4 options each\./);
  assert.match(context, /A task for him becomes a question: 'Do X, then pick Done'\./);
  assert.match(context, /A `!` command is the last line of the chat, with no dialog after it\./);
  assert.doesNotMatch(context, /explanation inside the question|an open dialog hides the chat/);
});

const preToolUse = (tool_name: string, tool_input: unknown) =>
  evaluateReminderHook(
    { hook_event_name: 'PreToolUse', tool_name, tool_input } as Parameters<typeof evaluateReminderHook>[0],
    ezzsWayOfCodingConfig,
  );
const refusal = async (tool_name: string, tool_input: unknown) => {
  const output = await preToolUse(tool_name, tool_input);
  return output?.hookSpecificOutput?.permissionDecision === 'deny' ? (output.hookSpecificOutput.permissionDecisionReason ?? '') : undefined;
};

// The dialog only asks (the user's ruling, 2026-11-26): a question of at most
// 150 characters, an option description of at most 100. Measured on the 746
// real dialogs of the forensics corpus (guardrail-scratch/asks.jsonl, through
// this guard: hooks-6c-scratch/measure.mts): the longest question per call has
// a median of 493 characters among accepted dialogs and 412 among the 42
// rejected ones, so length does not predict a rejection; the dialogs were
// written to the old rule, which put the explanation inside the question.
// These limits refuse 696 of 746 (38 of the 42 rejected): 682 have a question
// over 150, 654 an option description over 100. Of the 50 that pass, the questions read like
// "Battery is at 39% (about 28 min). Plug the Mac in, or stop the Docker work
// for now?".
const DIALOG_ONLY_ASKS =
  /^The dialog only asks: put the explanation in the chat, in plain words, then ask a one-line question with short labels \(your pick first\)\./;
const dialog = (question: string, descriptions: string[] = ['Push it.', 'Leave it unpushed.']) => ({
  questions: [
    {
      question,
      header: 'Push',
      options: descriptions.map((description, index) => ({ label: `Option ${index + 1}`, description })),
      multiSelect: false,
    },
  ],
});

test('an AskUserQuestion whose question or any option description is over its limit is refused', async () => {
  for (const [label, input] of [
    [
      'a question with its explanation inside (178 characters, a real dialog)',
      dialog(
        'The websets API server still runs at http://localhost:4340 (PID 78754). It holds two demo datasets (Node.js releases) in ~/.local/share/websets. What do I do with the server now?',
      ),
    ],
    ['a question one character over', dialog(`${'x'.repeat(150)}?`)],
    [
      'a short question with one long option description (a real one, 120 characters)',
      dialog('Who writes the Slack reply?', [
        'You do.',
        "I write a Slack reply for you to paste yourself. I'll leave a blank for your hourly rate and anything else I can't find.",
      ]),
    ],
    ['a description one character over', dialog('Push #5408 now?', ['y'.repeat(101)])],
    [
      'a second question over the limit',
      { questions: [...dialog('Push #5408 now?').questions, ...dialog(`${'x'.repeat(151)}`).questions] },
    ],
  ] as const) {
    assert.match((await refusal('AskUserQuestion', input)) ?? '', DIALOG_ONLY_ASKS, label);
  }
});

test('a one-line question with short labels goes through, and a malformed dialog is the tool\'s to reject', async () => {
  for (const [label, input] of [
    ['a bare question', dialog('Push #5408 now?')],
    ['a question and a description at their limits', dialog('x'.repeat(150), ['y'.repeat(100)])],
    ['options with no description', { questions: [{ question: 'Push #5408 now?', options: [{ label: 'Push' }, { label: 'Wait' }] }] }],
    ['no questions array', { questions: 'Push #5408 now?' }],
    ['a null input', null],
  ] as const) {
    assert.equal(await refusal('AskUserQuestion', input), undefined, label);
  }
  assert.equal(await refusal('Bash', { command: 'x'.repeat(500) }), undefined, 'another tool');
});

// A MEMORY.md compaction is the user's to start. Measured on every Agent call
// of this machine whose prompt names MEMORY.md (48, hooks-6c-scratch/measure.mts):
// the guard refuses 4, and all 4 are compaction briefs (the 2 the forensics
// found, 9a40fd6b:376 and 610b54f9:1388, plus ecfe9d8e:282 and 250c5307:3900);
// the 44 it lets through read, audit or name the index. Of the 2 Writes of an
// auto-memory MEMORY.md on this machine, it refuses neither (one adds lines,
// one drops the only entry of a one-entry index).
const COMPACTION_IS_THE_USERS =
  "A MEMORY.md compaction is the user's to start (memory-compaction-needs-consent). Add your line above line ~190 and leave the rest.";
const MUTEX_MEMORY = '/Users/ezzabuzaid/.claude/projects/-Users-ezzabuzaid-Desktop-experiments-mutex/memory/MEMORY.md';

test('an Agent brief that orders a MEMORY.md compaction under a size is refused', async () => {
  for (const prompt of [
    `Fix one file: \`${MUTEX_MEMORY}\`, the index of an auto-memory directory. It is 34.2KB (about 250 lines). Only the first 24.4KB loads into each session, so its last 62 lines are never read. Rewrite it to under 17.1KB, with about 15KB as the target.`,
    'Compact the Claude Code auto-memory index /Users/ezzabuzaid/.claude/projects/-Users-ezzabuzaid-Desktop-January-deepagents/memory/MEMORY.md from ~194 lines to UNDER 140 lines. It is loaded into every session and truncated past 200 lines.',
    'MEMORY.md is too long.\nTrim the index below 200 lines.',
  ]) {
    assert.equal(await refusal('Agent', { prompt, effort: 'low' }), COMPACTION_IS_THE_USERS, prompt);
  }
});

test('an Agent brief that reads MEMORY.md, or asks for a shrink and a size in different sentences, goes through', async () => {
  for (const prompt of [
    `Read ${MUTEX_MEMORY} and list the entries about Docker.`,
    'Never rewrite history. Fix the hook; the session-harvest rule names auto-memory/MEMORY.md. Report under 30 lines.',
    'Rewrite the README intro to under 100 lines.',
    `Lens: DUPLICATION. Corpus: the index at ${MUTEX_MEMORY}. Compact dump (no bodies) is attached. Goal context: the index must drop from 168 to under 140 lines.`,
  ]) {
    assert.equal(await refusal('Agent', { prompt, effort: 'low' }), undefined, prompt);
  }
});

// An auto-memory folder under a temporary home, so the guard reads the index on disk.
async function memoryIndex(entries: number) {
  const folder = await new TemporaryFiles().directory('ezzs-way-of-coding-memory-');
  const memory = join(folder.path, '.claude', 'projects', '-Users-x-repo', 'memory');
  await mkdir(memory, { recursive: true });
  const lines = Array.from({ length: entries }, (_, index) => `- [Memory ${index}](memory-${index}.md) — when ${index} matters`);
  const filePath = join(memory, 'MEMORY.md');
  await writeFile(filePath, `${lines.join('\n')}\n`);
  return { folder, filePath, lines, [Symbol.asyncDispose]: () => folder[Symbol.asyncDispose]() };
}

test('a Write of a MEMORY.md that drops more than one index line and more than a tenth of them is refused', async () => {
  await using index = await memoryIndex(20);
  const { filePath, lines } = index;
  for (const [label, kept] of [
    ['3 of 20 dropped', lines.slice(3)],
    ['every line shortened', lines.map((line) => line.replace(/ — .*/, ''))],
    ['an index cut in half with a new line added', [...lines.slice(10), '- [New](new.md) — new']],
  ] as const) {
    assert.equal(await refusal('Write', { file_path: filePath, content: `${kept.join('\n')}\n` }), COMPACTION_IS_THE_USERS, label);
  }
});

test('a Write of a MEMORY.md that adds a line or drops one or two of twenty goes through, and so does another MEMORY.md', async () => {
  await using index = await memoryIndex(20);
  const { folder, filePath, lines } = index;
  for (const [label, kept] of [
    ['a line added above the rest', ['- [New](new.md) — new', ...lines]],
    ['one stale entry dropped', lines.slice(1)],
    ['two of twenty dropped (a tenth)', lines.slice(2)],
  ] as const) {
    assert.equal(await refusal('Write', { file_path: filePath, content: `${kept.join('\n')}\n` }), undefined, label);
  }
  await using single = await memoryIndex(1);
  assert.equal(await refusal('Write', { file_path: single.filePath, content: '# Memory index\n' }), undefined, 'the only entry of a one-entry index dropped');
  const elsewhere = join(folder.path, 'catalog', 'agent', 'MEMORY.md');
  await mkdir(join(folder.path, 'catalog', 'agent'), { recursive: true });
  await writeFile(elsewhere, `${lines.join('\n')}\n`);
  assert.equal(await refusal('Write', { file_path: elsewhere, content: '# Memory\n' }), undefined, 'a MEMORY.md outside an auto-memory folder');
  const missing = join(folder.path, '.claude', 'projects', '-Users-x-new', 'memory', 'MEMORY.md');
  assert.equal(await refusal('Write', { file_path: missing, content: '- [A](a.md) — a\n' }), undefined, 'a new index');
});

// #5756: an Edit is judged by the index it leaves on disk, as a Write is.
test('an Edit of a MEMORY.md that drops more than one index line and more than a tenth of them is refused', async () => {
  await using index = await memoryIndex(20);
  const { filePath, lines } = index;
  for (const [label, edit] of [
    ['17 of 20 lines merged into one', { old_string: lines.slice(3).join('\n'), new_string: '- [Merged](merged.md) — all of it' }],
    ['3 of 20 lines removed', { old_string: `${lines.slice(0, 3).join('\n')}\n`, new_string: '' }],
    ['every hook cut with replace_all', { old_string: ' matters', new_string: '', replace_all: true }],
  ] as const) {
    assert.equal(await refusal('Edit', { file_path: filePath, ...edit }), COMPACTION_IS_THE_USERS, label);
  }
});

test('an Edit of a MEMORY.md that changes, removes or adds one index line goes through', async () => {
  await using index = await memoryIndex(20);
  const { filePath, lines } = index;
  for (const [label, edit] of [
    ['a description changed in place', { old_string: lines[4], new_string: '- [Memory 4](memory-4.md) — a new hook' }],
    ['one line removed', { old_string: `${lines[7]}\n`, new_string: '' }],
    ['one line added', { old_string: lines[9], new_string: `${lines[9]}\n- [New](new.md) — new` }],
    ['two of twenty removed (a tenth)', { old_string: `${lines[0]}\n${lines[1]}\n`, new_string: '' }],
    ['an old_string that is not in the file', { old_string: '- [Gone](gone.md) — gone', new_string: '' }],
  ] as const) {
    assert.equal(await refusal('Edit', { file_path: filePath, ...edit }), undefined, label);
  }
});

// A tracking record never points into one session's folder. Measured on the
// 1973 Write and Edit calls of the 59 corpus sessions
// (hooks-6d-scratch/dump9.mts): the guard refuses 5: 69df537a:9037 writes a
// HANDOFF into its scratchpad; 7bb55ec4:4890 and 6b29866e:955 put a scratchpad
// log or repro path into a plan; b6b06c50:9584 names a live task output in a
// HANDOFF; 9a40fd6b:9608 sends a later session to a dead session's task
// outputs. The blind judge of 2026-11-26 found the 2 briefs that place a
// throwaway workspace in the scratchpad (259dc838:2260 and 4245) false; they
// now go through.
const RECORD_OUTLIVES_SESSION =
  'A tracking record must outlive the session: move the file to ~/.claude/scratch/ or ~/.claude/plans/ and point there.';
const SCRATCHPAD = '/private/tmp/claude-501/-Users-ezzabuzaid-Desktop-experiments-mutex/7bb55ec4-a068-4516-a90b-a25762fde657/scratchpad';

test('a Write or Edit of a plan, STATUS, HANDOFF or memory that names a path in a session folder is refused', async () => {
  for (const [label, tool, input] of [
    ['a plan edit naming a scratchpad log', 'Edit', { file_path: '/Users/ezzabuzaid/.claude/plans/retrieval-text-search-api.md', old_string: 'gate:', new_string: `gate: log ${SCRATCHPAD}/gate.log` }],
    ['a HANDOFF naming a task output', 'Write', { file_path: '/Users/ezzabuzaid/.agent-backlog/handoff/x/HANDOFF.md', content: 'Its output: `/private/tmp/claude-501/-Users-ezzabuzaid-Desktop-mo-meddit/b6b06c50-b547-4c9d-956f-85507d3d836a/tasks/bqmatpyve.output`' }],
    ['a STATUS file', 'Write', { file_path: '/Users/x/repo/STATUS-step-4.md', content: `Repro in ${SCRATCHPAD}/repro.mjs` }],
    ['a memory', 'Edit', { file_path: '/Users/ezzabuzaid/.claude/projects/-Users-x/memory/steps.md', old_string: 'a', new_string: `Patches are in \`${SCRATCHPAD}/steps/\`.` }],
    ['a /tmp path without /private', 'Write', { file_path: '/Users/ezzabuzaid/.claude/plans/p.md', content: `See ${SCRATCHPAD.replace('/private', '')}/x.md` }],
    ['a HANDOFF written into the scratchpad', 'Write', { file_path: `${SCRATCHPAD}/HANDOFF-deepagents-e7-2.md`, content: '# Handoff\nResume at step 3.' }],
    // The corpus's pointers, word for word around the path.
    ['a plan that sends a later session to task outputs (9a40fd6b:9608)', 'Write', { file_path: '/Users/ezzabuzaid/.claude/plans/elt-s9-handoff.md', content: `How to see their results if 9a40fd6b is gone: their transcripts are \`${SCRATCHPAD.replace('/scratchpad', '/tasks')}/<agent-id>.output\` (JSONL, huge).` }],
    ['a plan STATUS that names a gate log (7bb55ec4:4890)', 'Edit', { file_path: '/Users/ezzabuzaid/.claude/plans/retrieval-text-search-api.md', old_string: 'a', new_string: `SQL Server crashed in the gdb crash dump under gate load (log ${SCRATCHPAD}/gate-5424.log). BUG FIRST.` }],
    ['a plan that names a repro (6b29866e:955)', 'Write', { file_path: '/Users/ezzabuzaid/.claude/plans/msw-bugs-2026-11-24.md', content: `- Repro hangs 3/3, source and dist: ${SCRATCHPAD}/repro/repro.mjs (run it from packages/testing).` }],
    ['a plan to continue from a scratchpad file', 'Write', { file_path: '/Users/ezzabuzaid/.claude/plans/p.md', content: `Continue from ${SCRATCHPAD}/step-3.md` }],
    ['a plan that names a task output alone', 'Write', { file_path: '/Users/ezzabuzaid/.claude/plans/p.md', content: `Shell b1 writes ${SCRATCHPAD.replace('/scratchpad', '/tasks')}/b1.output until the deploy lands.` }],
    ['a plan that labels a path', 'Write', { file_path: '/Users/ezzabuzaid/.claude/plans/p.md', content: `Fixture for step 2: \`${SCRATCHPAD}/fx.json\`` }],
  ] as const) {
    assert.equal(await refusal(tool, input), RECORD_OUTLIVES_SESSION, label);
  }
});

test('a record that points to ~/.claude/scratch or only mentions /tmp/claude-501, and any other file, goes through', async () => {
  for (const [label, tool, input] of [
    ['a plan naming ~/.claude/scratch', 'Write', { file_path: '/Users/ezzabuzaid/.claude/plans/p.md', content: 'Logs: ~/.claude/scratch/housekeeping-workspace/gate.log' }],
    ['a memory that mentions the folder, not a file', 'Edit', { file_path: '/Users/ezzabuzaid/.claude/projects/-Users-x/memory/delete-exact-paths-only.md', old_string: 'a', new_string: '~/.claude/projects, /tmp/claude-501 and the scratchpads hold every session\'s files.' }],
    ['a memory naming a glob over session folders', 'Edit', { file_path: '/Users/ezzabuzaid/.claude/projects/-Users-x/memory/scratchpad-is-ephemeral.md', old_string: 'a', new_string: 'A restart cleared all `/private/tmp/claude-501/-Users-ezzabuzaid-Desktop-mo-meddit/*/scratchpad` folders.' }],
    ['a source file naming a scratchpad path', 'Write', { file_path: '/Users/x/repo/src/probe.ts', content: `const out = '${SCRATCHPAD}/out.json';` }],
    ['a scratch note in the scratchpad', 'Write', { file_path: `${SCRATCHPAD}/notes.md`, content: `See ${SCRATCHPAD}/x.md` }],
    ['a read of a plan', 'Read', { file_path: '/Users/ezzabuzaid/.claude/plans/p.md' }],
    ['a plan edit with no new text', 'Edit', { file_path: '/Users/ezzabuzaid/.claude/plans/p.md', old_string: SCRATCHPAD }],
    // The blind judge of 2026-11-26: a brief that tells a subagent to build throwaway work in the scratchpad (259dc838:2260 and 4245).
    ['a brief that makes a throwaway repo there', 'Write', { file_path: '/Users/ezzabuzaid/.claude/plans/stop-npm-link-r1-brief-2026-11-22.md', content: `Read the plan first.\nMake a throwaway repo under ${SCRATCHPAD}/r1/ (git init + a bare remote there; tags are allowed only in that throwaway repo).` }],
    ['a brief that runs in a throwaway workspace there', 'Write', { file_path: '/Users/ezzabuzaid/.claude/plans/4985-u1-brief.md', content: `- Run version.mjs for real in a throwaway workspace under ${SCRATCHPAD}/u1/ for cases (a)-(c).` }],
  ] as const) {
    assert.equal(await refusal(tool, input), undefined, label);
  }
});

// #5782: a pointer word counts only within the 80 characters before the path,
// on the same line.
test('a pointer word 79 characters before a scratchpad path is refused; 81 characters before, or on the line before, goes through', async () => {
  const plan = '/Users/ezzabuzaid/.claude/plans/p.md';
  const pointerAt = (distance: number) => `see ${'x'.repeat(distance - 5)} ${SCRATCHPAD}/out.txt`;
  assert.equal(pointerAt(79).indexOf(SCRATCHPAD), 79);
  assert.equal(await refusal('Write', { file_path: plan, content: pointerAt(79) }), RECORD_OUTLIVES_SESSION, '79 characters before');
  assert.equal(await refusal('Write', { file_path: plan, content: pointerAt(81) }), undefined, '81 characters before');
  assert.equal(await refusal('Write', { file_path: plan, content: `see\n${SCRATCHPAD}/out.txt` }), undefined, 'on the line before');
});

// #5777: each rule module loads on its own, so one module that throws while it
// loads turns off only its own rules. These run hook.ts as Claude Code does, a
// child process with the input on stdin, and break a module in the child's
// memory with a loader hook; the files on disk stay as they are.
const BREAK_ONE_MODULE = `data:text/javascript,${encodeURIComponent(`
import { registerHooks } from 'node:module';
registerHooks({
  load(url, context, nextLoad) {
    const target = process.env.BREAK;
    if (target && url.endsWith('/rules/' + target)) {
      return { format: 'module', shortCircuit: true, source: 'throw new Error("broken on purpose: ' + target + '");' };
    }
    return nextLoad(url, context);
  },
});
`)}`;

async function runHook(input: object, broken?: string) {
  const child = execFile(process.execPath, ['--import', BREAK_ONE_MODULE, join(import.meta.dirname, 'hook.ts')], {
    env: { ...process.env, BREAK: broken ?? '' },
  });
  child.stdin?.end(JSON.stringify(input));
  const [stdout, stderr, code] = await Promise.all([text(child.stdout), text(child.stderr), new Promise((resolve) => child.on('close', resolve))]);
  return { stdout, stderr, code };
}

async function text(stream: NodeJS.ReadableStream | null) {
  let all = '';
  for await (const chunk of stream ?? []) all += chunk;
  return all;
}

const LONG_QUESTION = {
  hook_event_name: 'PreToolUse',
  tool_name: 'AskUserQuestion',
  tool_input: {
    questions: [
      { question: 'x'.repeat(200), header: 'h', multiSelect: false, options: [{ label: 'a', description: 'b' }, { label: 'c', description: 'd' }] },
    ],
  },
};
const LONG_QUESTION_DENIED = JSON.stringify({
  hookSpecificOutput: {
    hookEventName: 'PreToolUse',
    permissionDecision: 'deny',
    permissionDecisionReason:
      'The dialog only asks: put the explanation in the chat, in plain words, then ask a one-line question with short labels (your pick first). Limits: a question of 150 characters, an option description of 100.',
  },
});
const SAFE_TO_CLOSE_SENT_BACK = JSON.stringify({ hookSpecificOutput: { hookEventName: 'Stop', additionalContext: CLOSE_CHECK } });

async function safeToCloseStop(broken?: string) {
  await using folder = await new TemporaryFiles().directory('ezzs-way-of-coding-broken-');
  const transcriptPath = join(folder.path, 'transcript.jsonl');
  await writeFile(transcriptPath, `${[request, sweep, said('Safe to close.')].map((entry) => JSON.stringify(entry)).join('\n')}\n`);
  return await runHook({ hook_event_name: 'Stop', transcript_path: transcriptPath }, broken);
}

test('with dialog.ts broken, a Safe to close claim with no close check is still sent back, and stderr names dialog.ts', async () => {
  const { stdout, stderr, code } = await safeToCloseStop('dialog.ts');

  assert.equal(code, 0);
  assert.equal(stdout.trim(), SAFE_TO_CLOSE_SENT_BACK);
  assert.match(stderr, /rules\/dialog\.ts failed to load.*broken on purpose: dialog\.ts/);
});

test('with stop.ts broken, a 200-character AskUserQuestion is still denied', async () => {
  const { stdout, stderr, code } = await runHook(LONG_QUESTION, 'stop.ts');

  assert.equal(code, 0);
  assert.equal(stdout.trim(), LONG_QUESTION_DENIED);
  assert.match(stderr, /rules\/stop\.ts failed to load/);
});

test('with no module broken, the hook gives the same output for both inputs and writes nothing to stderr', async () => {
  const stop = await safeToCloseStop();
  const question = await runHook(LONG_QUESTION);

  assert.deepEqual(stop, { stdout: `${SAFE_TO_CLOSE_SENT_BACK}\n`, stderr: '', code: 0 });
  assert.deepEqual(question, { stdout: `${LONG_QUESTION_DENIED}\n`, stderr: '', code: 0 });
});

test('with rules/index.ts broken, the hook exits 0 with no output and names index.ts on stderr', async () => {
  const { stdout, stderr, code } = await runHook(LONG_QUESTION, 'index.ts');

  assert.equal(code, 0);
  assert.equal(stdout, '');
  assert.match(stderr, /rules\/index\.ts failed to load, every rule is off: broken on purpose: index\.ts/);
});
