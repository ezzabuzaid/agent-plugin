/**
 * prune-memory.ts — remove a memory file AND its MEMORY.md index line, atomically.
 *
 * The auto-memory index (MEMORY.md) links each memory by basename, e.g.
 *   - [Title](feedback_foo.md) — hook
 * Deleting a memory means removing both the file and that line; hand-editing MEMORY.md
 * desyncs the index, so the curator skill always goes through here.
 *
 *   node ~/.claude/skills/memory-curator/scripts/prune-memory.ts <abs-path-to-memory.md>
 */

import { readFile, rm, writeFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';

const target = process.argv[2];
if (!target?.endsWith('.md')) {
  process.stderr.write('usage: prune-memory.ts <abs-path-to-memory.md>\n');
  process.exit(1);
}

const file = basename(target);
if (file === 'MEMORY.md') {
  process.stderr.write('refusing to prune MEMORY.md itself\n');
  process.exit(1);
}

await rm(target); // throws loudly if the file is missing — no silent no-op

const indexPath = join(dirname(target), 'MEMORY.md');
try {
  const lines = (await readFile(indexPath, 'utf8')).split('\n');
  const kept = lines.filter((line) => !line.includes(`(${file})`));
  await writeFile(indexPath, kept.join('\n'));
  process.stdout.write(`pruned ${file}  (removed ${lines.length - kept.length} index line)\n`);
} catch (err) {
  // File removed, but MEMORY.md was absent/unreadable — surface it, don't fail the prune.
  process.stdout.write(`pruned ${file}; MEMORY.md not updated (${err instanceof Error ? err.message : String(err)})\n`);
}
