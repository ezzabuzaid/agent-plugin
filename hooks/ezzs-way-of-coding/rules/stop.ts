import type {
  ClaudeHookInput,
  ReminderRule,
} from '@deepagents/experimental/coding-agent-reminders';

import { RELAYED_PROMPT } from './intent.ts';
import { readTranscriptEntries, type TranscriptEntry } from './transcript.ts';
import { finalAssistantText } from './verification.ts';

// The user reads only AskUserQuestion, never prose, and AskUserQuestion answers
// inside the turn. A turn ends only FINISHED, or PARKED: machine work that will
// wake the session still runs, and every decision for the user has been asked.
// The explanation goes in the chat in plain words; the dialog only asks, with a
// one-line question and short labels (the user's ruling, 2026-11-26). A turn
// that only answers the user's question ends on the answer: neither Stop rule
// fires there.

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

// "none", also "none of them" / "none of these" / "none of the items" (the blind
// judge, 2026-11-26: "none of them waits on you" is a report).
const NONE_OF = String.raw`none(?: of (?:them|these|those|the \w+))?`;

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
  // An answer format handed to the user: "Reply **\"A\"** or **\"B\"**.",
  // "Reply like \"1 A, 2 B\"", "Reply with something like …". Only a sentence that
  // starts with Reply; "the reply from the peer" describes.
  /(^|[.!?;:]\s+)(\*\*)?reply (with|like|\*\*|["“'`])/im,
  // Parking on the user: "Still waiting on you at the mini:", "blocked on you".
  new RegExp(String.raw`(?<!\b(?:nothing|no one|nobody|not|${NONE_OF})\s(?:is\s)?)\b(waiting|blocked) (on|for) you\b`, 'i'),
  // A task handed to the user: "**Cleanup that's yours, through Mole:**", "the next step is yours".
  /(?<!\b(?:nothing|none)\s)\b(that's|that is|those are|these are|is|are|stays|remains) (all )?yours\b/i,
  // The asks the patterns above missed (forensics 2026-11-26, K4: 126 more hits
  // on 4570 final messages, an independent judge found 16 of 20 real). A
  // heading that a negation answers ("Waits on you: nothing") and a go already
  // given ("Your go is recorded", "your go was already given") are reports.
  /\byours,? when you (choose|decide|want|are ready)\b/i,
  /(?<!\b(?:per|with|on|after|got|had|took|have|without|for|wait for)\s)\byour (go|go-ahead|direction)\b(?!\s+(to|from|on|is|was|has been)\b)/i,
  /\b(wait(s|ing)? for|needs?) your (go|go-ahead|direction)\b/i,
  new RegExp(
    String.raw`(?<!\b(?:nothing|no one|nobody|not|${NONE_OF}|no \w+|no \w+ \w+)\s(?:is\s)?)\bwait(s|ing)? (on|for) (you|your (answer|go|word|pick|reply|direction))\b(?![*_:\s]*(nothing|none|no one)\b)`,
    'i',
  ),
  /\b(both|it|they|the questions?|my questions?) (is|are) (above|in the chat|in chat)\b/i,
  /\bnext step is (yours|your)\b/i,
];

// A slash command handed to the user to type: "type `/housekeeping`". The
// prose filter drops code spans, so this one reads the raw final message.
const SLASH_COMMAND_TO_TYPE = /\btype `\/[\w:-]+/i;

const OFFER_LEAD_PATTERN =
  /\b(want me to|should I|do you want|would you (like|prefer)|which (one|approach|option|of these)|can you (clarify|confirm)|let me know (if|whether))\b/i;

function asksInProse(text: string, raw: string): boolean {
  if (SLASH_COMMAND_TO_TYPE.test(raw)) return true;
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

function field(value: unknown, key: string): unknown {
  if (typeof value !== 'object' || value === null) return undefined;
  return new Map(Object.entries(value)).get(key);
}

function stringField(value: unknown, key: string): string | undefined {
  const found = field(value, key);
  return typeof found === 'string' ? found : undefined;
}

function isHousekeepingSweep(block: ContentBlock): boolean {
  const skill = block.name === 'Skill' ? stringField(block.input, 'skill') : undefined;
  return skill !== undefined && (skill === 'housekeeping' || skill.endsWith(':housekeeping'));
}

function bashCommand(block: ContentBlock): string {
  return block.name === 'Bash' ? (stringField(block.input, 'command') ?? '') : '';
}

// A heredoc body, up to its delimiter line (or the end, when it has none); the
// rest of the line that opens it stays, since it is still shell code.
const HEREDOC_BODY =
  /<<-?[ \t]*(['"]?)([\w.-]+)\1([^\n]*)\n(?:(?:[\s\S]*?\n)?[ \t]*\2[ \t]*(?=\n|$)|[\s\S]*$)/g;
const QUOTED = /'[^']*'|"(?:[^"\\]|\\[\s\S])*"/g;
// The code a shell runs from its -c argument: `timeout 900 bash -c "git add … && git commit …"`.
const SHELL_DASH_C = /\b(?:ba|z)?sh\s+-\w*c\s+(?:"((?:[^"\\]|\\[\s\S])*)"|'([^']*)')/g;
// Commands and shell keywords that run the command after them: timeout 1500,
// gtimeout -s KILL 900, caffeinate -dimsu, nohup, time, env, sudo, exec, if, then, do.
const COMMAND_WRAPPERS = String.raw`(?:(?:if|then|else|elif|do|while|until|!)\s+|g?timeout(?:\s+-[sk]\s+\S+|\s+--?[\w-]+(?:=\S+)?)*\s+\d+[smhd]?\s+|caffeinate(?:\s+-\w+)*\s+|(?:nohup|time|sudo|exec|command)\s+|env(?:\s+\w+=\S*)*\s+)*`;
// A command segment that runs git commit or git push, after optional variable
// assignments, wrappers and git's own options (-C <dir>, -c <key=value>, --no-pager).
const GIT_COMMIT_OR_PUSH_COMMAND = new RegExp(
  String.raw`^[\s({]*(?:\w+=\S*\s+)*${COMMAND_WRAPPERS}git(?:\s+(?:-[Cc]\s+\S+|--[\w-]+(?:=\S+)?))*\s+(?:commit|push)\b`,
);

// The command runs git commit or git push where a command starts: at its start
// or after &&, ||, ;, |, & or a new line, also inside a shell's -c argument.
// Words in a heredoc body, in another quoted string or in another command's
// arguments are not a commit (the blind judge, 2026-11-26: a python heredoc and
// a backlog description).
function runsGitCommitOrPush(command: string): boolean {
  const code = command.replaceAll(HEREDOC_BODY, '<<$3');
  for (const [, doubleQuoted, singleQuoted] of code.matchAll(SHELL_DASH_C)) {
    if (runsGitCommitOrPush(singleQuoted ?? (doubleQuoted ?? '').replaceAll(/\\(["\\$`])/g, '$1'))) return true;
  }
  return code
    .replaceAll(QUOTED, "''")
    .split(/&&|\|\||[;|&\n]/)
    .some((segment) => GIT_COMMIT_OR_PUSH_COMMAND.test(segment));
}

// A launch or a stop of background work changes the task set the session owns.
function changesTasks(block: ContentBlock): boolean {
  if (block.name === 'Agent' || block.name === 'Monitor' || block.name === 'TaskStop') return true;
  return block.name === 'Bash' && field(block.input, 'run_in_background') === true;
}

// A real change since the last sweep: a commit or a push. Edits alone are not
// one (forensics 2026-11-26, K1), and neither is a task-set change: the agent
// that starts work is doing what idle mode asks (step 6c).
function changesState(block: ContentBlock): boolean {
  return runsGitCommitOrPush(bashCommand(block));
}

const BACKLOG_WRITE = /\bagent-backlog (add|update|close|done|decide|note|edit|start|block)\b/;
// A shell write into a record: memory, a plan, a STATUS or HANDOFF file.
const BASH_RECORD_WRITE =
  /(?:>>?|\btee\b|\bsed\s+-i|\bperl\s+-\w*i|\bmv\b|\bcp\b)[^\n;&|]*?(?:\/memory\/|\/\.claude\/plans\/|STATUS|HANDOFF|MEMORY\.md)/;

// Any write the turn made, so a turn with one is not an answer alone. A
// message to a subagent or a peer acts too (the blind judge, 2026-11-26).
function writes(block: ContentBlock): boolean {
  if (block.name === 'Edit' || block.name === 'Write' || block.name === 'NotebookEdit' || block.name === 'SendMessage') return true;
  const command = bashCommand(block);
  return changesState(block) || changesTasks(block) || BACKLOG_WRITE.test(command) || BASH_RECORD_WRITE.test(command);
}

// The final message claims the session can close: the claims an inline sweep
// or a close-out writes.
const CLOSE_CLAIM =
  /\bSafe to close\b|\bNothing new\b|\bnothing (of mine )?(is )?(still )?running\b|\b(all|everything) (is )?(done|finished)\b/i;

/**
 * Due when, since the last housekeeping sweep, the session committed or
 * pushed, or when the final message makes a close
 * claim. A change in the sweep's own turn, after the sweep, is the sweep's
 * close-out and counts only after a stop. Only a Skill call for housekeeping
 * resets it: a sweep written from memory leaves it due, so the next stop fires
 * again. Claude Code writes a `stop_hook_summary` entry each time a turn stops;
 * a Codex transcript (it has `turn_context` entries) has none, so the rule is
 * off there.
 */
async function housekeepingDue(input: ClaudeHookInput): Promise<boolean> {
  if (!input.transcript_path) return false;

  let sweptThisTurn = false;
  let changed = false;

  for await (const entry of readTranscriptEntries(input.transcript_path)) {
    if (entry.type === 'turn_context') return false;
    if (entry.type === 'system' && entry.subtype === 'stop_hook_summary') {
      sweptThisTurn = false;
    } else if (entry.type === 'assistant') {
      for (const block of toolUses(entry.message?.content)) {
        if (isHousekeepingSweep(block)) {
          sweptThisTurn = true;
          changed = false;
        } else if (changesState(block) && !sweptThisTurn) {
          changed = true;
        }
      }
    }
  }

  if (changed) return true;
  return !sweptThisTurn && CLOSE_CLAIM.test(await finalAssistantText(input));
}

type HumanInput = { text: string; startsTurn: boolean };

function textOf(content: unknown): string {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content
    .map((block: unknown) => (field(block, 'type') === 'text' ? (stringField(block, 'text') ?? '') : ''))
    .join('\n');
}

// The words the user typed into an AskUserQuestion dialog: an answer that is
// not a label of its question's options (a multi-select answer joins labels
// with ", "). A picked option is an answer, not a message.
function typedDialogAnswers(result: unknown): string {
  const answers = field(result, 'answers');
  const questions = field(result, 'questions');
  if (typeof answers !== 'object' || answers === null) return '';
  const labels = new Map<string, Set<string>>();
  for (const question of Array.isArray(questions) ? questions : []) {
    const options: unknown = field(question, 'options');
    const optionLabels = (Array.isArray(options) ? options : []).map((option: unknown) => stringField(option, 'label'));
    labels.set(stringField(question, 'question') ?? '', new Set(optionLabels.filter((label) => label !== undefined)));
  }
  return Object.entries(answers)
    .filter((pair): pair is [string, string] => typeof pair[1] === 'string')
    .filter(([question, answer]) => !answer.split(', ').every((part) => labels.get(question)?.has(part)))
    .map(([, answer]) => answer)
    .join('\n');
}

// What the user said, by its transcript entry: a typed prompt (it starts a
// turn), a message sent while the turn ran, or a dialog answer. A peer's
// message, a task notification and a usage-limit continuation are not his.
function humanInput(entry: TranscriptEntry): HumanInput | undefined {
  const { attachment } = entry;
  if (entry.type === 'attachment' && attachment?.type === 'queued_command') {
    return attachment.origin?.kind === 'human' && typeof attachment.prompt === 'string'
      ? { text: attachment.prompt, startsTurn: false }
      : undefined;
  }
  if (entry.type !== 'user' || entry.message?.role !== 'user' || entry.isMeta === true) return undefined;
  if (entry.origin?.kind !== undefined && entry.origin.kind !== 'human') return undefined;
  const { content } = entry.message;
  if (Array.isArray(content) && content.some((block: unknown) => field(block, 'type') === 'tool_result')) {
    return field(entry.toolUseResult, 'answers') === undefined
      ? undefined
      : { text: typedDialogAnswers(entry.toolUseResult), startsTurn: false };
  }
  const text = textOf(content);
  return text && !RELAYED_PROMPT.test(text) ? { text, startsTurn: true } : undefined;
}

// Read as a question: a question mark in its last line, an interrogative with
// no sentence end, a /wait-what, or a bare link.
function asksAQuestion(text: string): boolean {
  if (/<command-name>\/(?:[\w-]+:)?wait-what<\/command-name>/.test(text)) return true;
  const words = text.replaceAll(/<[^>]+>[^<]*<\/[^>]+>/g, ' ').trim();
  if (/^https?:\/\/\S+$/.test(words)) return true;
  const lastLine = words.split('\n').filter(Boolean).at(-1) ?? '';
  return (
    lastLine.includes('?') ||
    /^(what|why|how|is|are|can|do|does|did|where|which|who|should|could|would|will|have|has)\b[^.!]*$/i.test(words)
  );
}

// A question that asks for the sweep itself, so the rules still fire. "remain"
// matches loosely, so a typo such as "remiaining" is still a wrap-up (the blind
// judge, 2026-11-26), and "reminds" is not one.
const WRAP_UP_QUESTION =
  /\b(what(?:'|’)?s left|what is left|what(?:(?:'|’)?s| is)? rem[aeiou]{1,4}n(?:ing|s)?\b|anything (rem[aeiou]{1,4}ning|left)|can I close|are you sure|double[- ]check|what are you waiting (for|on)|what now|finished everything)\b/i;

type Turn = { lastHumanInput?: HumanInput; blocks: ContentBlock[]; lastText: string };

// The current turn, from the last prompt the user typed: his last input, every
// tool call since that prompt, and the last text the agent wrote.
async function currentTurn(transcriptPath: string): Promise<Turn> {
  let turn: Turn = { blocks: [], lastText: '' };
  for await (const entry of readTranscriptEntries(transcriptPath)) {
    const human = humanInput(entry);
    if (human?.startsTurn) turn = { lastHumanInput: human, blocks: [], lastText: '' };
    else if (human) turn.lastHumanInput = human;
    if (entry.type !== 'assistant') continue;
    turn.blocks.push(...toolUses(entry.message?.content));
    turn.lastText = textOf(entry.message?.content) || turn.lastText;
  }
  return turn;
}

// A line that hands the user a `!` command to run, also inside a code block;
// a markdown image (![alt](src)) is not one.
const HANDED_COMMAND = /^[ \t]*!(?!\[)[ \t]*\S/m;

/**
 * The turn only answers the user's question: his last input asks one, it is
 * no wrap-up question, the turn wrote nothing and its final message hands the
 * user no `!` command (forensics 2026-11-26, K2: 76 fires on such turns once
 * wrap-up questions are left out).
 */
async function questionOnlyTurn(input: ClaudeHookInput): Promise<boolean> {
  if (!input.transcript_path) return false;
  const { lastHumanInput, blocks, lastText } = await currentTurn(input.transcript_path);
  if (!lastHumanInput || !asksAQuestion(lastHumanInput.text)) return false;
  if (WRAP_UP_QUESTION.test(lastHumanInput.text)) return false;
  const finalText = typeof input.last_assistant_message === 'string' ? input.last_assistant_message : lastText;
  return !blocks.some(writes) && !HANDED_COMMAND.test(finalText);
}

// "Safe to close" as a verdict, not "Not safe to close (yet)": a negated
// verdict claims nothing (the blind judge, 2026-11-26).
const AFFIRMED_SAFE_TO_CLOSE = /(?<!\b(?:not|never)\s+|n't\s+)(?<!\b(?:not|never)\s+yet\s+)\bsafe to close\b/i;
// A sentence that opens with a condition: "Once both pass, the session is safe to close".
const CONDITION_OPENER = /^[\s*_>#-]*(?:once|when|after|if|until|unless|as soon as)\b/i;

// The final message claims the session can close now, in a sentence of its own.
function claimsSafeToClose(text: string): boolean {
  return text
    .split(/(?<=[.!?])\s+|\n/)
    .some((sentence) => AFFIRMED_SAFE_TO_CLOSE.test(sentence) && !CONDITION_OPENER.test(sentence));
}

const CLOSE_CHECK_SCRIPT = 'close-check.mjs';

async function closeCheckRanThisTurn(input: ClaudeHookInput): Promise<boolean> {
  if (!input.transcript_path) return false;
  const { blocks } = await currentTurn(input.transcript_path);
  return blocks.some((block) => bashCommand(block).includes(CLOSE_CHECK_SCRIPT));
}

// Each running task by kind, id and description, so the agent cannot report
// "nothing is running" while a subagent it no longer remembers (one started
// before a /clear) still edits the checkout.
function runningWork(input: ClaudeHookInput): string[] {
  const tasks: unknown = input.background_tasks;
  if (!Array.isArray(tasks)) return [];
  return tasks.map((task: unknown) => {
    const name =
      [stringField(task, 'type'), stringField(task, 'id')].filter(Boolean).join(' ') || 'a task';
    const description = stringField(task, 'description');
    return description ? `${name} (${description})` : name;
  });
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

const SWEEP_CALL = 'call the housekeeping skill';
const NOT_FROM_MEMORY = '(a sweep from memory does not count)';

export const stopRules: ReminderRule[] = [
  {
    id: 'ask-in-the-tool',
    target: 'stop-feedback',
    events: ['Stop'],
    continuedStops: 'once',
    when: async (input) => {
      if (runsHeadless(input)) return false;
      const raw = typeof input.last_assistant_message === 'string' ? input.last_assistant_message : '';
      return asksInProse(await finalAssistantText(input), raw) && !(await questionOnlyTurn(input));
    },
    message:
      "Your final message asks the user something, gives him a task, or waits on him in prose. He reads only AskUserQuestion. Explain in the chat in plain words, then ask in AskUserQuestion with a one-line question and short labels, your pick first, 2-4 options each. A task for him becomes a question: 'Do X, then pick Done'. A `!` command is the last line of the chat, with no dialog after it. Do not restate the asks as text.",
  },
  {
    id: 'housekeeping-due',
    target: 'stop-feedback',
    events: ['Stop'],
    when: async (input) =>
      !runsHeadless(input) && (await housekeepingDue(input)) && !(await questionOnlyTurn(input)),
    message: (input) => {
      const running = runningWork(input);
      return running.length > 0
        ? `Background work is still running: ${running.join('; ')}. Before this turn ends, ${SWEEP_CALL} in idle mode ${NOT_FROM_MEMORY}: ask the user every decision only he can make for the rest of the work, from the session's first message, in one AskUserQuestion round, then start every queued item that does not depend on that work. A test run, CI run, push or deploy never holds the queue: start every item it does not block. End the turn with what remains: what runs and who receives it, and each queued item with what it waits on.`
        : `Before this turn ends, ${SWEEP_CALL} in before-done mode ${NOT_FROM_MEMORY}.`;
    },
  },
  {
    id: 'close-check-before-safe-to-close',
    target: 'stop-feedback',
    events: ['Stop'],
    continuedStops: 'once',
    when: async (input) =>
      !runsHeadless(input) &&
      claimsSafeToClose(await finalAssistantText(input)) &&
      !(await closeCheckRanThisTurn(input)),
    message:
      "You wrote 'Safe to close' without running the housekeeping skill's scripts/close-check.mjs in this turn. Run it, and quote its output.",
  },
];
