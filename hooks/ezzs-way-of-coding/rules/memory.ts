import type { GuardRule } from '@deepagents/experimental/coding-agent-reminders';
import { readFile } from 'node:fs/promises';

// Claude Code's own notice ("Rewrite it to under 17.1KB now") is not the
// user's consent: he answers a compaction offer with "Leave it"
// (memory-compaction-needs-consent). The notice is built into Claude Code, so
// the guard sits on what an agent does after it: a brief that orders the
// compaction, or a Write that drops index lines.

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
// A Write may drop one index line, or at most this share of the index lines on
// disk: removing a stale entry passes, a compaction does not.
const MAX_DROPPED_SHARE = 0.1;

function indexLines(text: string): string[] {
  return text.split('\n').filter((line) => INDEX_LINE.test(line));
}

async function dropsIndexLines(filePath: string, content: string): Promise<boolean> {
  let before: string;
  try {
    before = await readFile(filePath, 'utf8');
  } catch {
    return false;
  }
  const old = indexLines(before);
  if (old.length === 0) return false;
  const kept = new Set(indexLines(content));
  const dropped = old.filter((line) => !kept.has(line)).length;
  return dropped > Math.max(1, old.length * MAX_DROPPED_SHARE);
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
            (await dropsIndexLines(filePath, content))
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
