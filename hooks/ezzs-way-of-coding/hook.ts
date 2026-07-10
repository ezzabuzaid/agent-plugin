import {
  type ClaudeHookInput,
  evaluateReminderHook,
  readStdin,
  writeOutput,
} from '@deepagents/experimental/coding-agent-reminders';

import { ezzsWayOfCodingConfig } from './rules/index.ts';

const raw = await readStdin();
if (raw.trim().length !== 0) {
  const input = JSON.parse(raw) as ClaudeHookInput;
  const output = await evaluateReminderHook(input, ezzsWayOfCodingConfig);
  if (output) writeOutput(output);
}
