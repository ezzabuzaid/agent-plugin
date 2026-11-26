import type { GuardRule } from '@deepagents/experimental/coding-agent-reminders';
import { basename } from 'node:path';

// A tracking record (a plan, a STATUS or HANDOFF file, a memory) is read by a
// later session; the session's own folder under /tmp/claude-<uid>/ (its
// scratchpad, its task output) dies with the session or a reboot. A path into
// one session's folder names its project folder and its session id; a mention
// of /tmp/claude-501 alone, or of a glob such as */scratchpad, names no file.
const SESSION_FOLDER_PATH =
  /(?:\/private)?\/tmp\/claude-\d+\/[^/\s]+\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//;
const SESSION_FOLDER_PATHS = new RegExp(SESSION_FOLDER_PATH.source, 'g');

// Words before a path that send a later reader to the file: "see", "log",
// "Repro … :", "Patches are in". A brief that tells a subagent to build
// throwaway work there ("Make a throwaway repo under …") points at nothing that
// must outlive the session (the blind judge, 2026-11-26: 259dc838:2260, 4245).
const POINTS_TO_READ =
  /\b(?:see|read|continue from|resume from|results?|outputs?|logs?|logging to|transcripts?|repro|patches|(?:is|are|lives?|sits?) in)\b|:\s*[`'"(]?$/i;
const POINTER_WINDOW = 80;

// The text sends a later reader to a file in a session folder: a task output
// (…/tasks/…), or a path that the words just before it point at.
function pointsIntoSessionFolder(text: string): boolean {
  for (const match of text.matchAll(SESSION_FOLDER_PATHS)) {
    if (text.startsWith('tasks/', match.index + match[0].length)) return true;
    const lineStart = text.lastIndexOf('\n', match.index) + 1;
    const before = text.slice(Math.max(lineStart, match.index - POINTER_WINDOW), match.index);
    if (POINTS_TO_READ.test(before)) return true;
  }
  return false;
}

function isTrackingRecord(filePath: string): boolean {
  return (
    /\/\.claude\/plans\/[^/]+\.md$/.test(filePath) ||
    /\/\.claude\/projects\/[^/]+\/memory\//.test(filePath) ||
    /^(?:HANDOFF|STATUS)/i.test(basename(filePath))
  );
}

function newText(toolName: unknown, toolInput: Record<string, unknown> | undefined): string | undefined {
  if (toolName === 'Write' && typeof toolInput?.content === 'string') return toolInput.content;
  if (toolName === 'Edit' && typeof toolInput?.new_string === 'string') return toolInput.new_string;
  return undefined;
}

export const recordGuards: GuardRule[] = [
  {
    id: 'tracking-record-outside-the-scratchpad',
    // The library denies when a guard throws; this guard must fail open.
    when: (input) => {
      try {
        const filePath = input.tool_input?.file_path;
        const text = newText(input.tool_name, input.tool_input);
        if (typeof filePath !== 'string' || text === undefined || !isTrackingRecord(filePath)) return false;
        return SESSION_FOLDER_PATH.test(filePath) || pointsIntoSessionFolder(text);
      } catch {
        return false;
      }
    },
    deny: 'A tracking record must outlive the session: move the file to ~/.claude/scratch/ or ~/.claude/plans/ and point there.',
  },
];
