import type { GuardRule } from '@deepagents/experimental/coding-agent-reminders';
import { readFile } from 'node:fs/promises';

// Claude Code's own notice ("Rewrite it to under 17.1KB now") is not the
// user's consent: he answers a compaction offer with "Leave it"
// (memory-compaction-needs-consent). The notice is built into Claude Code, so
// the guard sits on what an agent does after it: a brief that orders the
// compaction, or a Write or Edit that drops index lines.

// A brief that asks to make MEMORY.md smaller than a size: "Rewrite it to under
// 17.1KB", "compact MEMORY.md to about 15 KB", "trim the index below 200 lines".
// The verb and the size share one sentence, so "never rewrite history" and a
// report "under 30 lines" in the same brief are not an order.
const SHRINK_VERB = /\b(?:compact|compress|condense|shorten|shrink|trim|rewrite|consolidate)\w*\b/i;
const SIZE_TARGET = /\b(?:under|below|to|within|at most|about|~)\s*~?\d+(?:\.\d+)?\s*(?:KB|kB|K|KiB|bytes|lines|chars|characters)\b/i;

function briefsACompaction(prompt: string): boolean {
  return (
    /\bMEMORY\.md\b/.test(prompt) &&
    prompt.split(/(?<=[.!?])\s+|\n/).some((sentence) => SHRINK_VERB.test(sentence) && SIZE_TARGET.test(sentence))
  );
}

// The index of an auto-memory folder: ~/.claude/projects/<project>/memory/MEMORY.md.
const MEMORY_INDEX = /\/\.claude\/projects\/[^/]+\/memory\/MEMORY\.md$/;
// An index entry is a list line: "- [Title](file.md) — hook".
const INDEX_LINE = /^\s*[-*] \[/;
// A Write or Edit may drop one index line, or at most this share of the index lines on
// disk: removing a stale entry passes, a compaction does not.
const MAX_DROPPED_SHARE = 0.1;

function indexLines(text: string): string[] {
  return text.split('\n').filter((line) => INDEX_LINE.test(line));
}

function dropsIndexLines(before: string, after: string): boolean {
  const old = indexLines(before);
  if (old.length === 0) return false;
  const kept = new Set(indexLines(after));
  const dropped = old.filter((line) => !kept.has(line)).length;
  return dropped > Math.max(1, old.length * MAX_DROPPED_SHARE);
}

// The index on disk against the file the call leaves. A missing file is a new
// index, which drops nothing.
async function dropsIndexLinesOnDisk(filePath: string, after: (before: string) => string): Promise<boolean> {
  let before: string;
  try {
    before = await readFile(filePath, 'utf8');
  } catch {
    return false;
  }
  return dropsIndexLines(before, after(before));
}

// The file an Edit leaves. The replacement is a function, so a `$&` in
// new_string is inserted as written, as the Edit tool does; an old_string that
// is not in the file leaves it unchanged (the Edit tool then fails on its own).
function edited(before: string, oldString: string, newString: string, replaceAll: unknown): string {
  return replaceAll === true ? before.replaceAll(oldString, () => newString) : before.replace(oldString, () => newString);
}

export const memoryGuards: GuardRule[] = [
  {
    id: 'memory-compaction-is-the-users',
    // The library denies when a guard throws; this guard must fail open.
    when: async (input) => {
      try {
        const tool = input.tool_input;
        if (input.tool_name === 'Agent') {
          return typeof tool?.prompt === 'string' && briefsACompaction(tool.prompt);
        }
        if (input.tool_name === 'Write') {
          const { file_path: filePath, content } = tool ?? {};
          return (
            typeof filePath === 'string' &&
            typeof content === 'string' &&
            MEMORY_INDEX.test(filePath) &&
            (await dropsIndexLinesOnDisk(filePath, () => content))
          );
        }
        if (input.tool_name === 'Edit') {
          const { file_path: filePath, old_string: oldString, new_string: newString, replace_all: replaceAll } = tool ?? {};
          return (
            typeof filePath === 'string' &&
            typeof oldString === 'string' &&
            typeof newString === 'string' &&
            MEMORY_INDEX.test(filePath) &&
            (await dropsIndexLinesOnDisk(filePath, (before) => edited(before, oldString, newString, replaceAll)))
          );
        }
        return false;
      } catch {
        return false;
      }
    },
    deny: "A MEMORY.md compaction is the user's to start (memory-compaction-needs-consent). Add your line above line ~190 and leave the rest.",
  },
];
