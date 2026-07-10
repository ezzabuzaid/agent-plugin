#!/usr/bin/env node
// Non-interactive explorer for CLAUDE.md / AGENTS.md files across project roots.
// Ported from text2sql tools/playground/claude-agents-explorer (discovery core only).
//
//   node cli.ts                 pretty report
//   node cli.ts --json          machine output (no chrome), for agents/skills
//   node cli.ts --root <dir>    override search roots (repeatable)

import * as clack from '@clack/prompts';
import { readdir, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import { basename, join, relative, resolve } from 'node:path';
import { parseArgs } from 'node:util';

const HOME = homedir();

const DEFAULT_ROOTS = [
  join(HOME, '.claude'),
  join(HOME, 'Desktop'),
  join(HOME, 'Documents'),
  join(HOME, 'Projects'),
  join(HOME, 'repos'),
  join(HOME, 'code'),
  join(HOME, 'dev'),
  join(HOME, 'work'),
  join(HOME, 'src'),
];

const SKIP_DIRS = new Set([
  'node_modules',
  '.nx',
  '.git',
  '.next',
  '.nuxt',
  '.cache',
  '.turbo',
  'dist',
  'build',
  '.output',
  'coverage',
  '.venv',
  'venv',
  '__pycache__',
  '.terraform',
  '.pulumi',
]);

interface FoundFolder {
  path: string;
  relativePath: string;
  root: string;
  hasClaude: boolean;
  hasAgents: boolean;
  claudeSize?: number;
  agentsSize?: number;
  claudeModified?: string;
  agentsModified?: string;
}

async function fileStat(path: string): Promise<{ size: number; mtime: Date } | null> {
  try {
    const s = await stat(path);
    return { size: s.size, mtime: s.mtime };
  } catch {
    return null;
  }
}

async function searchDirectory(
  dir: string,
  root: string,
  results: FoundFolder[],
  maxDepth = 6,
): Promise<void> {
  if (maxDepth <= 0) return;
  try {
    const entries = await readdir(dir, { withFileTypes: true });

    const names = new Set(entries.filter((e) => e.isFile()).map((e) => e.name));
    const claudeStat = names.has('CLAUDE.md') ? await fileStat(join(dir, 'CLAUDE.md')) : null;
    const agentsStat = names.has('AGENTS.md') ? await fileStat(join(dir, 'AGENTS.md')) : null;

    if (names.has('CLAUDE.md') || names.has('AGENTS.md')) {
      results.push({
        path: dir,
        relativePath: relative(root, dir) || basename(dir),
        root,
        hasClaude: names.has('CLAUDE.md'),
        hasAgents: names.has('AGENTS.md'),
        claudeSize: claudeStat?.size,
        agentsSize: agentsStat?.size,
        claudeModified: claudeStat?.mtime.toISOString(),
        agentsModified: agentsStat?.mtime.toISOString(),
      });
    }

    for (const entry of entries) {
      if (
        entry.isDirectory() &&
        !SKIP_DIRS.has(entry.name) &&
        (entry.name === '.claude' || !entry.name.startsWith('.'))
      ) {
        await searchDirectory(join(dir, entry.name), root, results, maxDepth - 1);
      }
    }
  } catch {
    // Permission denied or inaccessible
  }
}

async function indexFolders(roots: string[]): Promise<FoundFolder[]> {
  const results: FoundFolder[] = [];
  const visited = new Set<string>();

  for (const root of roots) {
    try {
      const resolved = resolve(root);
      if (visited.has(resolved)) continue;
      visited.add(resolved);
      await stat(resolved);
      await searchDirectory(resolved, resolved, results);
    } catch {
      // Root doesn't exist, skip
    }
  }

  const seen = new Set<string>();
  return results
    .filter((r) => {
      const key = resolve(r.path);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => a.path.localeCompare(b.path));
}

function formatSize(bytes?: number): string {
  if (bytes === undefined) return '';
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function shortenHome(path: string): string {
  return path.startsWith(HOME) ? `~${path.slice(HOME.length)}` : path;
}

function describe(folder: FoundFolder): string {
  const parts: string[] = [];
  if (folder.hasClaude) {
    parts.push(`CLAUDE.md ${formatSize(folder.claudeSize)} (${folder.claudeModified?.slice(0, 10) ?? '?'})`);
  }
  if (folder.hasAgents) {
    parts.push(`AGENTS.md ${formatSize(folder.agentsSize)} (${folder.agentsModified?.slice(0, 10) ?? '?'})`);
  }
  return `${shortenHome(folder.path)}\n  ${parts.join(' · ')}`;
}

const USAGE = `explore-agents-md — list every folder holding a CLAUDE.md or AGENTS.md

Usage:
  explore-agents-md [--json] [--root <dir>]...

Options:
  --json         machine output: raw JSON array, no chrome
  --root <dir>   override the default search roots (repeatable)
  --help         show this help
`;

const parseCliArgs = () => {
  try {
    return parseArgs({
      options: {
        json: { type: 'boolean', default: false },
        root: { type: 'string', multiple: true },
        help: { type: 'boolean', default: false },
      },
    }).values;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    console.error(`\n${USAGE}`);
    return process.exit(2);
  }
};

const values = parseCliArgs();

if (values.help) {
  console.log(USAGE);
  process.exit(0);
}

const roots = values.root && values.root.length > 0 ? values.root : DEFAULT_ROOTS;

if (values.json) {
  console.log(JSON.stringify(await indexFolders(roots), null, 2));
} else {
  clack.intro('explore-agents-md');
  const spin = clack.spinner();
  spin.start(`Scanning ${roots.length} root(s) for CLAUDE.md / AGENTS.md`);
  const folders = await indexFolders(roots);
  spin.stop(`Scanned ${roots.length} root(s)`);

  for (const folder of folders) {
    clack.log.message(describe(folder));
  }

  const claudeCount = folders.filter((f) => f.hasClaude).length;
  const agentsCount = folders.filter((f) => f.hasAgents).length;
  clack.outro(`${folders.length} folders — ${claudeCount} CLAUDE.md, ${agentsCount} AGENTS.md`);
}
