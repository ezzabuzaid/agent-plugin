import {
  type ClaudeHookInput,
  evaluateReminderHook,
  readStdin,
  type ReminderHookConfig,
  writeOutput,
} from '@deepagents/experimental/coding-agent-reminders';

// rules/index.ts loads each rule module on its own; this import is dynamic so
// that an index.ts that cannot load is named on stderr and the hook still
// exits 0, instead of crashing for every session on the machine (#5777).
async function rulesConfig(): Promise<ReminderHookConfig | undefined> {
  try {
    return (await import('./rules/index.ts')).ezzsWayOfCodingConfig;
  } catch (error) {
    process.stderr.write(
      `ezzs-way-of-coding: rules/index.ts failed to load, every rule is off: ${error instanceof Error ? error.message : String(error)}\n`,
    );
    return undefined;
  }
}

const raw = await readStdin();
const config = await rulesConfig();
if (raw.trim().length !== 0 && config) {
  // Claude Code names how it started (terminal or `claude -p`) only in its
  // environment; the rules read it from the input, so a test can state it.
  const input = {
    ...(JSON.parse(raw) as ClaudeHookInput),
    claude_code_entrypoint: process.env['CLAUDE_CODE_ENTRYPOINT'],
  };
  const output = await evaluateReminderHook(input, config);
  if (output) writeOutput(output);
}
