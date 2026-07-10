import type { HookEventName } from '@deepagents/experimental/coding-agent-reminders';

export const sessionEvents: HookEventName[] = [
  'SessionStart',
  'Setup',
  'SubagentStart',
];

export const promptEvents: HookEventName[] = [
  'UserPromptSubmit',
  'UserPromptExpansion',
];

export const stopEvents: HookEventName[] = ['Stop', 'SubagentStop'];
