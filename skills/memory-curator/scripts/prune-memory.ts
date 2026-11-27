/**
 * prune-memory.ts — remove a memory file and its links from every MEMORY*.md index in its folder.
 *
 * An index links each memory by basename, one per line or several in a list:
 *   - [Title](feedback_foo.md) — hook
 *   - Topic: [A](a.md) (note), [B](feedback_foo.md); [C](c.md)
 * A line that links only the pruned memory is deleted. A line that links others loses only the pruned link, the
 * note in parentheses right after it, and one separator. Hand-editing an index desyncs it, so the curator skill
 * always goes through here. Each [[wikilink]] to the pruned memory left in the folder's other memories is reported,
 * for the curator to repoint.
 *
 *   node ~/.claude/skills/memory-curator/scripts/prune-memory.ts <abs-path-to-memory.md>
 */

import { readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';

const target = process.argv[2];
if (!target?.endsWith('.md')) {
  process.stderr.write('usage: prune-memory.ts <abs-path-to-memory.md>\n');
  process.exit(1);
}

const file = basename(target);
const isIndex = (name: string) => /^MEMORY.*\.md$/.test(name);
if (isIndex(file)) {
  process.stderr.write(`refusing to prune the index ${file} itself\n`);
  process.exit(1);
}

const folder = dirname(target);
const name = /^name:\s*(.+)$/m.exec(await readFile(target, 'utf8'))?.[1]?.trim();
await rm(target);

const escaped = RegExp.escape(file);
const anyLink = /\[[^\]]*\]\([^)\s]+\.md\)/g;
const prunedLink = new RegExp(`\\[[^\\]]*\\]\\(${escaped}\\)(?: \\([^()]*\\))?`);
const separator = /^(?:, |; | — )/;
const trailingSeparator = /(?:, |; | — )$/;

function unlink(line: string): string | null {
  const links = line.match(anyLink) ?? [];
  if (links.every((link) => link.endsWith(`(${file})`))) return null;
  let rest = line;
  for (let match = prunedLink.exec(rest); match; match = prunedLink.exec(rest)) {
    const before = rest.slice(0, match.index);
    const after = rest.slice(match.index + match[0].length);
    rest = separator.test(after) ? before + after.replace(separator, '') : before.replace(trailingSeparator, '') + after;
  }
  return rest.replace(/ \(\)/g, '');
}

const names = await readdir(folder);
const report = [`pruned ${file}`];
for (const index of names.filter(isIndex)) {
  const path = join(folder, index);
  const lines = (await readFile(path, 'utf8')).split('\n');
  const changes: string[] = [];
  const kept = lines.flatMap((line, i) => {
    if (!line.includes(`](${file})`)) return [line];
    const edited = unlink(line);
    if (edited === null) {
      changes.push(`  ${index}:${i + 1} line removed`);
      return [];
    }
    changes.push(`  ${index}:${i + 1} link removed: ${edited}`);
    return [edited];
  });
  if (changes.length === 0) continue;
  await writeFile(path, kept.join('\n'));
  report.push(...changes);
}

const slugs = new Set([file, file.replace(/\.md$/, ''), ...(name ? [name] : [])]);
for (const other of names.filter((n) => n.endsWith('.md') && n !== file)) {
  const text = await readFile(join(folder, other), 'utf8').catch(() => '');
  for (const [wikilink, slug] of text.matchAll(/\[\[([^\]|#]+)(?:[|#][^\]]*)?\]\]/g)) {
    if (slugs.has(slug.trim())) report.push(`  dangling: ${other} links ${wikilink}`);
  }
}

process.stdout.write(`${report.join('\n')}\n`);
