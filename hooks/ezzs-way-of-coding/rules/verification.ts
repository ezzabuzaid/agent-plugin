import type {
  ClaudeHookInput,
  ReminderRule,
} from '@deepagents/experimental/coding-agent-reminders';

import { readFile } from 'node:fs/promises';

import { stopEvents } from './events.ts';

// A final message that hands a verification gap to the user instead of closing it.
// A bare "unverified" counts only as a standalone word: not inside a hyphenated
// name such as this rule's id, and not in talk about *calling* something unverified.
const unverifiedClaim =
  /(?:(?<![-\w])(?<!call(?:ed|ing)? (?:it |them |this |something |anything |behavior )?)unverified(?![-\w])|\b(?:not (?:yet )?(?:been )?(?:verified|confirmed|tested|exercised) live|not (?:yet )?(?:been )?verified|could(?:n't| not) (?:verify|confirm|test)|did(?:n't| not) (?:verify|probe|test)(?: (?:it|this|them))? live|(?:synthetic|mock(?:ed)?) (?:tests?|fixtures?) only|covered (?:only )?by (?:synthetic|mock(?:ed)?) (?:tests?|fixtures?)(?: only)?|untested live|without (?:a )?live (?:check|verification|probe))\b)/i;

function textOfContent(content: unknown): string {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content
    .filter(
      (block): block is { type: 'text'; text: string } =>
        typeof block === 'object' &&
        block !== null &&
        'type' in block &&
        block.type === 'text' &&
        'text' in block &&
        typeof block.text === 'string',
    )
    .map((block) => block.text)
    .join('\n');
}

// Code spans name things (rule ids, flags); they are not claims about the work.
function prose(text: string): string {
  return text.replaceAll(/`[^`]*`/g, ' ');
}

async function finalAssistantText(input: ClaudeHookInput): Promise<string> {
  if (typeof input.last_assistant_message === 'string')
    return prose(input.last_assistant_message);
  if (!input.transcript_path) return '';
  let transcript: string;
  try {
    transcript = await readFile(input.transcript_path, 'utf8');
  } catch {
    return '';
  }
  let last = '';
  for (const line of transcript.split('\n')) {
    let entry: unknown;
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }
    const message =
      entry !== null && typeof entry === 'object' && 'message' in entry
        ? entry.message
        : undefined;
    if (
      entry === null ||
      typeof entry !== 'object' ||
      !('type' in entry) ||
      entry.type !== 'assistant' ||
      message === null ||
      typeof message !== 'object' ||
      !('role' in message) ||
      message.role !== 'assistant' ||
      !('content' in message)
    )
      continue;
    const text = textOfContent(message.content);
    if (text) last = text;
  }
  return prose(last);
}

export const verificationRules: ReminderRule[] = [
  {
    id: 'live-verify-before-unverified',
    target: 'stop-feedback',
    events: stopEvents,
    when: async (input) => unverifiedClaim.test(await finalAssistantText(input)),
    message: [
      'Your final message reports something as unverified, untested live, or covered only by synthetic tests. Do not hand that gap to the user; close it before stopping.',
      '- Run the live check now: widen the probe to the full history instead of a sample window, create real objects in the real app (then delete them and confirm with a fresh read), and use earlier evidence that the data exists.',
      '- Leave it unverified only when the environment genuinely cannot produce it. Then name the exact blocker (missing permission, credential, account, hardware, or a user action) and what the user must do to unblock it. "I did not check" is not a blocker.',
    ].join('\n'),
  },
];
