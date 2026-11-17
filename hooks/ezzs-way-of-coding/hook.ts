import {
  type ClaudeHookInput,
  evaluateReminderHook,
  readStdin,
  writeOutput,
} from '@deepagents/experimental/coding-agent-reminders';

import { ezzsWayOfCodingConfig } from './rules/index.ts';

const raw = await readStdin();
if (raw.trim().length !== 0) {
  // Claude Code names how it started (terminal or `claude -p`) only in its
  // environment; the rules read it from the input, so a test can state it.
  const input = {
    ...(JSON.parse(raw) as ClaudeHookInput),
    claude_code_entrypoint: process.env['CLAUDE_CODE_ENTRYPOINT'],
  };
  const output = await evaluateReminderHook(input, ezzsWayOfCodingConfig);
  if (output) writeOutput(output);
}
