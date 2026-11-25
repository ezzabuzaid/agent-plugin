import type { GuardRule } from '@deepagents/experimental/coding-agent-reminders';
import { basename } from 'node:path';

// A tracking record (a plan, a STATUS or HANDOFF file, a memory) is read by a
// later session; the session's own folder under /tmp/claude-<uid>/ (its
// scratchpad, its task output) dies with the session or a reboot. A path into
// one session's folder names its project folder and its session id; a mention
// of /tmp/claude-501 alone, or of a glob such as */scratchpad, names no file.
const SESSION_FOLDER_PATH =
  /(?:\/private)?\/tmp\/claude-\d+\/[^/\s]+\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//;

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
        return SESSION_FOLDER_PATH.test(filePath) || SESSION_FOLDER_PATH.test(text);
      } catch {
        return false;
      }
    },
    deny: 'A tracking record must outlive the session: move the file to ~/.claude/scratch/ or ~/.claude/plans/ and point there.',
  },
];
