import type {
  ClaudeHookInput,
  GuardRule,
  ReminderRule,
} from '@deepagents/experimental/coding-agent-reminders';
import { ClaudeCodeSession, ClaudeCodeSubagent, type Step } from '@deepagents/trajectory';
import { join } from 'node:path';

import { stopEvents } from './events.ts';
import {
  claudeCode,
  transcriptSteps,
  wholeTranscriptSteps,
} from './transcript.ts';

// A final message that hands a verification gap to the user instead of closing it.
// A bare "unverified" counts only as a standalone word: not inside a hyphenated
// name such as this rule's id, and not in talk about *calling* something unverified.
const unverifiedClaim =
  /(?:(?<![-\w])(?<!call(?:ed|ing)? (?:it |them |this |something |anything |behavior )?)unverified(?![-\w])|\b(?:not (?:yet )?(?:been )?(?:verified|confirmed|tested|exercised) live|not (?:yet )?(?:been )?verified|could(?:n't| not) (?:verify|confirm|test)|did(?:n't| not) (?:verify|probe|test)(?: (?:it|this|them))? live|(?:synthetic|mock(?:ed)?) (?:tests?|fixtures?) only|covered (?:only )?by (?:synthetic|mock(?:ed)?) (?:tests?|fixtures?)(?: only)?|untested live|without (?:a )?live (?:check|verification|probe))\b)/i;

// Text that mentions a word does not claim it (the use–mention distinction).
// Fenced code blocks quote output or messages, code spans name things (rule
// ids, flags), and quotes cite a word ("unverified", 'unverified') rather than
// say it. A quote stays on one line, so a stray quote mark cannot hide the rest.
// A single quote counts only at word edges, so apostrophes ("couldn't",
// "user's") never open or close one.
export function prose(text: string): string {
  return text
    .replaceAll(
      /^ {0,3}(`{3,}|~{3,})[^\n]*\n[\s\S]*?(?:^ {0,3}\1[^\n]*$|(?![\s\S]))/gm,
      ' ',
    )
    .replaceAll(/`[^`]*`/g, ' ')
    .replaceAll(/"[^"\n]*"|“[^”\n]*”|‘[^’\n]*’|(?<![\w'])'[^'\n]+'(?![\w'])/g, ' ');
}

export async function finalAssistantText(
  input: ClaudeHookInput,
): Promise<string> {
  if (typeof input.last_assistant_message === 'string')
    return prose(input.last_assistant_message);
  // On SubagentStop, transcript_path is the parent session's; the subagent's own
  // transcript is agent_transcript_path.
  const subagentStop = input.hook_event_name === 'SubagentStop';
  const path = subagentStop ? input.agent_transcript_path : input.transcript_path;
  if (typeof path !== 'string' || !path) return '';
  const session = subagentStop
    ? ClaudeCodeSubagent.fromTranscriptPath(path)
    : ClaudeCodeSession.fromTranscriptPath(path);
  let last = '';
  for (const step of await transcriptSteps(session)) {
    if (step.source === 'agent' && typeof step.message === 'string' && step.message)
      last = step.message;
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
function startsAgentTurn(step: Step): boolean {
  if (step.source !== 'user' || typeof step.message !== 'string') return false;
  const { is_meta: isMeta, origin } = claudeCode(step.extra);
  return isMeta === true ? origin === 'coordinator' : step.message.length > 0;
}

function handbackIds(step: Step): string[] {
  if (step.source !== 'agent') return [];
  return (step.tool_calls ?? [])
    .filter((call) => call.function_name === 'SubagentHandback')
    .map((call) => call.tool_call_id);
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
  const steps = await wholeTranscriptSteps(
    ClaudeCodeSubagent.fromTranscriptPath(agentPath),
  );
  if (!steps) return true;
  let earlier = false;
  for (const step of steps) {
    if (startsAgentTurn(step)) earlier = false;
    else if (handbackIds(step).some((id) => id !== input.tool_use_id))
      earlier = true;
  }
  return earlier;
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
