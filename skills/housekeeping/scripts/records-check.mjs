#!/usr/bin/env node
// records-check.mjs: the records that still name a path this session's commits renamed or deleted.
//
// Usage: node scripts/records-check.mjs [--transcript <path>]
//        node scripts/records-check.mjs --repo <path> --since <rev>
//
// Reads
//   The commits: each `[<branch> <sha>]` in a `git commit` result of the session's transcript
//   (~/.claude/projects/*/<CLAUDE_CODE_SESSION_ID>.jsonl, or --transcript <path>, plus <id>/subagents/*.jsonl), in the
//   repo of that call (`git -C <path>`, else its last `cd <path>`, else its working directory); or, with --repo and
//   --since, every commit of <since>..HEAD in <repo>.
//   The stale paths: `git show --name-status --diff-filter=DR` of each commit; a deleted path and the old side of a
//   rename.
//   The records searched, per repo:
//     - its tracked Markdown files (`git ls-files '*.md'`) and its AGENTS.md and CLAUDE.md, as they are on disk;
//     - its project memory, ~/.claude/projects/<slug>/memory/*.md, where <slug> is the repo's absolute path with
//       each character other than a letter or digit turned into `-` (Claude Code's own project folder name);
//     - open backlog items, title and description, from `agent-backlog list --all-repos --status open --json`.
//
// Matches the full repo-relative path only, at path boundaries: `src/a.ts` does not match `a.ts` alone,
// `packages/x/src/a.ts` or `src/a.tsx`. A basename match is noise (42 basenames measured, mostly generic).
//
// Prints each stale path as a heading, then `  <file>:<line>` or `  #<id> <title|description>` for each mention,
// then a last line `No stale mention.` or `Stale mentions: <n>`. A failed agent-backlog call is printed and counts
// as one: the backlog was not read.
//
// Exit codes: 0 no stale mention, 1 a stale mention (or an unread backlog), 2 usage or read error.
import { parseArgs } from 'node:util';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { UsageError, transcriptFiles, bashCalls, repoRoot, sessionCommits, git, firstLine } from './lib/session.mjs';

function main() {
  let options;
  try {
    ({ values: options } = parseArgs({ options: { transcript: { type: 'string' }, repo: { type: 'string' }, since: { type: 'string' } } }));
  } catch (error) {
    throw new UsageError(error.message);
  }
  if (Boolean(options.repo) !== Boolean(options.since)) throw new UsageError('--repo and --since go together');

  const commitsByRepo = new Map();
  if (options.repo) {
    const repo = repoRoot(resolve(options.repo));
    if (!repo) throw new UsageError(`not a git repo: ${options.repo}`);
    commitsByRepo.set(repo, gitOrUsage(repo, ['rev-list', `${options.since}..HEAD`]).split('\n').filter(Boolean));
  } else {
    for (const commit of sessionCommits(bashCalls(transcriptFiles(options.transcript)))) {
      const repo = repoRoot(commit.dir);
      if (repo) commitsByRepo.set(repo, [...(commitsByRepo.get(repo) ?? []), commit.sha]);
    }
  }

  let backlog;
  let count = 0;
  for (const [repo, shas] of commitsByRepo) {
    const stale = new Set();
    for (const sha of shas) {
      for (const line of gitOrUsage(repo, ['show', '--format=', '--name-status', '--diff-filter=DR', sha]).split('\n')) {
        const [status, path] = line.split('\t');
        if (status && path) stale.add(path);
      }
    }
    if (stale.size === 0) continue;
    backlog ??= openBacklog();
    const records = [...repoDocs(repo), ...memoryFiles(repo)];
    for (const path of stale) {
      const pattern = new RegExp(String.raw`(?<![\w-]|[\w-][/.])${RegExp.escape(path)}(?![\w/-]|\.\w)`);
      const hits = [];
      for (const file of records) {
        readFileSync(file, 'utf8').split('\n').forEach((text, i) => {
          if (pattern.test(text)) hits.push(`${file}:${i + 1}`);
        });
      }
      for (const item of backlog.items) {
        for (const field of ['title', 'description']) if (pattern.test(item[field] ?? '')) hits.push(`#${item.id} ${field} (${item.repositoryName})`);
      }
      if (hits.length === 0) continue;
      console.log(`${repo}: ${path}`);
      for (const hit of hits) console.log(`  ${hit}`);
      count += hits.length;
    }
  }
  if (backlog?.error) {
    console.log(`could not read open backlog items: ${backlog.error}`);
    count++;
  }
  console.log(count === 0 ? 'No stale mention.' : `Stale mentions: ${count}`);
  return count === 0 ? 0 : 1;
}

function gitOrUsage(repo, args) {
  try {
    return git(repo, args);
  } catch (error) {
    throw new UsageError(`git ${args.join(' ')} in ${repo}: ${firstLine(error)}`);
  }
}

function repoDocs(repo) {
  const tracked = git(repo, ['ls-files', '-z', '*.md']).split('\0').filter(Boolean).map((p) => join(repo, p));
  const agentFiles = ['AGENTS.md', 'CLAUDE.md'].map((p) => join(repo, p));
  return [...new Set([...tracked, ...agentFiles])].filter((f) => existsSync(f));
}

function memoryFiles(repo) {
  const dir = join(homedir(), '.claude', 'projects', repo.replace(/[^A-Za-z0-9]/g, '-'), 'memory');
  return existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.md')).map((f) => join(dir, f)) : [];
}

function openBacklog() {
  try {
    return { items: JSON.parse(execFileSync('agent-backlog', ['list', '--all-repos', '--status', 'open', '--json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 256 * 1024 * 1024 })) };
  } catch (error) {
    return { items: [], error: error.code === 'ENOENT' ? 'agent-backlog not found' : firstLine(error) };
  }
}

try {
  process.exitCode = main();
} catch (error) {
  if (!(error instanceof UsageError) && error.code !== 'ENOENT' && error.code !== 'EACCES') throw error;
  console.error(`records-check: ${error.message}`);
  process.exitCode = 2;
}
