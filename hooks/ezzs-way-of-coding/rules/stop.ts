import type {
  ClaudeHookInput,
  ReminderRule,
} from '@deepagents/experimental/coding-agent-reminders';

import { readTranscriptEntries } from './transcript.ts';
import { finalAssistantText } from './verification.ts';

// The user reads only AskUserQuestion, never prose, and AskUserQuestion answers
// inside the turn. A turn ends only FINISHED, or PARKED: machine work that will
// wake the session still runs, and every decision for the user has been asked.

// Verbs that signal "I am about to do something the user might want to weigh in on first".
// Keep these strictly action-oriented and unambiguous; planning-statement verbs like
// `ship|land|commit|build` were removed because they collide with routine roadmap prose.
const PRE_QUESTION_VERBS = [
  'proceed',
  'continue',
  'start',
  'propose',
  'suggest',
  'recommend',
  'begin',
  'move forward',
  'touch',
  'edit',
  'write',
  'change',
  'modify',
  'implement',
  'refactor',
  'make changes',
  'do anything',
].join('|');

// Nouns that headline a list of items the assistant wants confirmed before proceeding.
const HEADING_NOUNS = ['decisions?', 'things', 'items', 'points', 'questions?', 'notes'].join('|');
const HEADING_VERBS = [
  'confirm',
  'clarify',
  'decide',
  'resolve',
  'nail down',
  'sort out',
  'pin down',
  'verify',
  'check',
].join('|');

// A report of nothing to ask, or a description of whether something would need asking:
// "Nothing needs your decision", "Nothing is waiting for your answer".
const NOT_AN_ASK = String.raw`(?<!\b(?:nothing|none|no one|nobody|whether it|if it)\s(?:is\s)?)`;

const MULTI_QUESTION_PATTERNS = [
  // A report verb earlier in the clause makes it a report of questions put to someone else:
  // "I sent the same two questions to build-classification-generic-core."
  // An opening quote or backtick makes it a mention of the phrase: 'the "two questions" pattern'.
  // "the" points back at questions that exist ("one of the three questions in the agent").
  // An ask puts the questions right after the count: a colon, "for you", "before I", or a list.
  // A count alone describes: "5 questions, all from collection book 176286".
  /(?<!\b(sent|asked|forwarded|relayed|passed|posted|answered)\b[^.!?\n]{0,30})(?<!["'`“‘]|\bthe\s)\b(a few|couple of|two|three|four|some|several|\d+)\s+(quick\s+)?questions?\b(?=[^.!?\n]{0,40}(:|\bfor you\b|\bbefore (I|we)\b)|[^\n]{0,40}\n\s*(\d+[.)]|[-*])\s)/i,
  /\bclarifying questions?\b/i,
  /\bjust to (confirm|check|make sure|clarify)\b/i,
  new RegExp(`\\bbefore (I|we) (${PRE_QUESTION_VERBS})\\b`, 'i'),
  /\b(need to clarify|to clarify)\b/i,
  // Heading-style framings without `?` or "questions" word: "Decisions to confirm:",
  // "Things to clarify:", "Points to nail down:". These appear above bullet lists where
  // the actual questions live, so the literal-`?` branch can't see them.
  // Trailing colon (with optional markdown close-markers `**`, `__`, `]`, `)`) is required —
  // otherwise mid-sentence prose like "some decisions to confirm with legal" misfires.
  new RegExp(`\\b(${HEADING_NOUNS})\\s+to\\s+(${HEADING_VERBS})\\b[*_)\\]]*:`, 'i'),
  // Imperative requests for input carry no `?`, so the offer-lead branch cannot see them:
  // "Confirm the refusal, or say if you want a flag instead.", "that one needs your decision",
  // "awaiting your approval", "Pushing main is your call.", "Tell me which one you prefer."
  // Reports of a decision already made ("You chose …", "per your decision …") stay silent.
  // Negated or descriptive uses ("Nothing needs your decision", "whether it needs your
  // approval") are reports, not requests.
  new RegExp(
    `${NOT_AN_ASK}\\b(needs?|requires?|awaiting|waiting (on|for)) your (decision|call|input|approval|confirmation|answer|go-ahead)\\b`,
    'i',
  ),
  // The same request without "your": "launchd has no restart limit; needs a design choice".
  new RegExp(
    `${NOT_AN_ASK}\\b(needs?|requires?|awaiting) (a|an|one) ((design|product|policy|scope) )?(decision|choice|call)\\b`,
    'i',
  ),
  /\b(is|stays|remains) your call\b/i,
  /\bconfirm\b[^.\n]*\bor (say|tell me|let me know)\b/i,
  // Only as an imperative: at the start of a sentence or line, or after "or"/"so"/"just".
  // Mid-sentence "can't say which items …" describes, it does not ask.
  /(^|[.!;:]\s+|\b(or|so|just)\s+)(tell me|let me know|say) (if|whether|which)\b/im,
  // Parking on the user: "Still waiting on you at the mini:", "blocked on you".
  /(?<!\b(?:nothing|no one|nobody|not)\s(?:is\s)?)\b(waiting|blocked) (on|for) you\b/i,
  // A task handed to the user: "**Cleanup that's yours, through Mole:**", "the next step is yours".
  /(?<!\b(?:nothing|none)\s)\b(that's|that is|those are|these are|is|are|stays|remains) (all )?yours\b/i,
];

const OFFER_LEAD_PATTERN =
  /\b(want me to|should I|do you want|would you (like|prefer)|which (one|approach|option|of these)|can you (clarify|confirm)|let me know (if|whether))\b/i;

function asksInProse(text: string): boolean {
  if (MULTI_QUESTION_PATTERNS.some((re) => re.test(text))) return true;
  // Offer-framing must coexist with a question mark in the SAME paragraph (otherwise an
  // "if you want me to … " mid-prose with a `?` later in an unrelated sentence would
  // fire). But scanning ANY paragraph — not just the last one — is required: real turns
  // often place the offer-lead question mid-message ("…what do you want to do next?")
  // followed by a numbered list of options and a short rhetorical closer
  // ("What feels right?") that doesn't itself contain an offer-lead phrase.
  return text
    .split(/\n\s*\n/)
    .some((para) => para.includes('?') && OFFER_LEAD_PATTERN.test(para));
}

type ContentBlock = { type?: unknown; name?: unknown; input?: unknown };

function toolUses(content: unknown): ContentBlock[] {
  if (!Array.isArray(content)) return [];
  return content.filter(
    (block): block is ContentBlock =>
      typeof block === 'object' && block !== null && block.type === 'tool_use',
  );
}

function isHousekeepingSweep(block: ContentBlock): boolean {
  const { input } = block;
  if (block.name !== 'Skill' || typeof input !== 'object' || input === null)
    return false;
  const skill = 'skill' in input ? input.skill : undefined;
  return (
    typeof skill === 'string' &&
    (skill === 'housekeeping' || skill.endsWith(':housekeeping'))
  );
}

/**
 * Due once the agent called a tool after the first stop that follows the last
 * housekeeping sweep, or, with no sweep yet, once it called any tool. A sweep
 * with no stop after it ran in the current turn. Claude Code writes a
 * `stop_hook_summary` entry each time a turn stops; a Codex transcript
 * (it has `turn_context` entries) has none, so the rule is off there.
 */
async function housekeepingDue(input: ClaudeHookInput): Promise<boolean> {
  if (!input.transcript_path) return false;

  let swept = false;
  let stoppedSinceSweep = false;
  let workedSinceStop = false;
  let worked = false;

  for await (const entry of readTranscriptEntries(input.transcript_path)) {
    if (entry.type === 'turn_context') return false;
    if (entry.type === 'system' && entry.subtype === 'stop_hook_summary') {
      if (swept) stoppedSinceSweep = true;
    } else if (entry.type === 'assistant') {
      for (const block of toolUses(entry.message?.content)) {
        if (isHousekeepingSweep(block)) {
          swept = true;
          stoppedSinceSweep = false;
          workedSinceStop = false;
        } else {
          worked = true;
          if (stoppedSinceSweep) workedSinceStop = true;
        }
      }
    }
  }

  return swept ? workedSinceStop : worked;
}

function backgroundWorkRuns(input: ClaudeHookInput): boolean {
  const tasks = input.background_tasks;
  return Array.isArray(tasks) && tasks.length > 0;
}

// A headless run (`claude -p`, the Agent SDKs) has no AskUserQuestion and no
// person to sweep for. Claude Code names how it started only in its
// environment (CLAUDE_CODE_ENTRYPOINT: 'cli' in a terminal, 'sdk-cli' under
// -p), so hook.ts copies it into the input. A host that sends none (Codex)
// counts as interactive.
function runsHeadless(input: ClaudeHookInput): boolean {
  const entrypoint = input['claude_code_entrypoint'];
  return typeof entrypoint === 'string' && entrypoint.startsWith('sdk-');
}

export const stopRules: ReminderRule[] = [
  {
    id: 'ask-in-the-tool',
    target: 'stop-feedback',
    events: ['Stop'],
    when: async (input) => !runsHeadless(input) && asksInProse(await finalAssistantText(input)),
    message:
      "Your final message asks the user something, gives him a task, or waits on him in prose. He reads only AskUserQuestion. Re-issue each ask in AskUserQuestion (2-4 options each). A task for him becomes a question: 'Do X, then pick Done'. Do not restate the asks as text.",
  },
  {
    id: 'housekeeping-due',
    target: 'stop-feedback',
    events: ['Stop'],
    when: async (input) => !runsHeadless(input) && (await housekeepingDue(input)),
    message: (input) =>
      backgroundWorkRuns(input)
        ? 'Background work is still running. Before this turn ends, run the housekeeping skill in idle mode: ask the user every decision only he can make for the rest of the work, from the session\'s first message, in one AskUserQuestion round, then keep waiting.'
        : 'Before this turn ends, run the housekeeping skill in before-done mode.',
  },
];
