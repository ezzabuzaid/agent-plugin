import type {
  ClaudeHookInput,
  GuardRule,
  ReminderRule,
} from '@deepagents/experimental/coding-agent-reminders';
import { join } from 'node:path';

import { stopEvents } from './events.ts';
import { readTranscriptEntries, type TranscriptEntry } from './transcript.ts';

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
  // On SubagentStop, transcript_path is the parent session's; the subagent's own
  // transcript is agent_transcript_path.
  const transcriptPath =
    input.hook_event_name === 'SubagentStop'
      ? input.agent_transcript_path
      : input.transcript_path;
  if (typeof transcriptPath !== 'string' || !transcriptPath) return '';
  let last = '';
  for await (const entry of readTranscriptEntries(transcriptPath)) {
    if (entry.type !== 'assistant' || entry.message?.role !== 'assistant')
      continue;
    const text = textOfContent(entry.message.content);
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

// Where a turn of a subagent starts: its brief, or a message its caller sent to
// resume it. Claude Code also writes meta user entries in the middle of a turn
// (system reminders, task notifications, peer messages, the hand-back nudge
// after a stop), and those do not start a turn.
function startsAgentTurn(entry: TranscriptEntry): boolean {
  if (entry.type !== 'user' || entry.message?.role !== 'user') return false;
  if (entry.isMeta === true) return entry.origin?.kind === 'coordinator';
  const { content } = entry.message;
  if (typeof content === 'string') return content.length > 0;
  return (
    Array.isArray(content) &&
    content.some((block) => block?.type === 'text') &&
    !content.some((block) => block?.type === 'tool_result')
  );
}

function handbackIds(entry: TranscriptEntry): string[] {
  const content = entry.message?.content;
  if (entry.type !== 'assistant' || !Array.isArray(content)) return [];
  return content
    .filter(
      (block) => block?.type === 'tool_use' && block.name === 'SubagentHandback',
    )
    .map((block) => String(block.id));
}

// True when the subagent already tried to hand back earlier in its current turn.
// The call being judged is left out by its tool_use_id, because Claude Code may
// or may not have written it to the transcript yet. Unknown means "yes", so a
// missing or unreadable transcript never blocks a hand-back.
async function handedBackThisTurn(input: ClaudeHookInput): Promise<boolean> {
  const { transcript_path: sessionPath, agent_id: agentId } = input;
  if (
    typeof sessionPath !== 'string' ||
    !sessionPath.endsWith('.jsonl') ||
    typeof agentId !== 'string' ||
    !agentId
  )
    return true;
  const agentPath = join(
    sessionPath.slice(0, -'.jsonl'.length),
    'subagents',
    `agent-${agentId}.jsonl`,
  );
  let read = false;
  let earlier = false;
  for await (const entry of readTranscriptEntries(agentPath)) {
    read = true;
    if (startsAgentTurn(entry)) earlier = false;
    else if (handbackIds(entry).some((id) => id !== input.tool_use_id))
      earlier = true;
  }
  return !read || earlier;
}

export const verificationGuards: GuardRule[] = [
  {
    id: 'live-verify-before-handback',
    // The library denies when a guard throws; this guard must fail open.
    when: async (input) => {
      try {
        const message = input.tool_input?.message;
        return (
          input.tool_name === 'SubagentHandback' &&
          typeof message === 'string' &&
          unverifiedClaim.test(prose(message)) &&
          !(await handedBackThisTurn(input))
        );
      } catch {
        return false;
      }
    },
    deny: [
      'Your report hands an unverified gap to your caller. Close it before you hand back: run the live check now.',
      '- Leave it unverified only when the environment genuinely cannot produce it. Then name the exact blocker (missing permission, credential, account, hardware, or a user action) in the report and call SubagentHandback again; that call goes through.',
    ].join('\n'),
  },
];
