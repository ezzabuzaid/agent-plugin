#!/usr/bin/env node
// records-check.mjs: the records that still name a path or an identifier this session's commits renamed or removed.
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
//   The stale identifiers: for each JavaScript or TypeScript file a commit changed, the identifiers its parent's
//   version declares and the commit's version (the new side of a rename, nothing for a delete) does not:
//     - export: `export function|const|let|var|class|type|interface|enum|namespace X` (also default, declare,
//       abstract, async), each exported name of `export { a, b as c }`, `exports.X =`, `module.exports.X =` and
//       each key of `module.exports = { … }`;
//     - rule id: `id: '<id>'` in a rules file (a path with a `rule` or `rules` segment, as `rules/stop.ts` or
//       `stop.rules.mjs`);
//     - flag: in a CLI (a file with a `#!` line, `parseArgs`, `process.argv`, `.option(` or `yargs`), a parseArgs
//       option key (`name: { type: 'string' }`) as `--name`, and each `--name` on a usage line: a comment, a line
//       that says usage or options, an `.option(` call or an argv comparison (`case '--x'`, `=== '--x'`).
//   An identifier that any file but Markdown still names at HEAD (`git grep -F`, then the word match below) moved or
//   stayed, so it is not stale.
//   The records searched, per repo:
//     - its tracked Markdown files (`git ls-files '*.md'`) and its AGENTS.md and CLAUDE.md, as they are on disk;
//     - its project memory, ~/.claude/projects/<slug>/memory/*.md, where <slug> is the repo's absolute path with
//       each character other than a letter or digit turned into `-` (Claude Code's own project folder name);
//     - open backlog items, title and description, from `agent-backlog list --all-repos --status open --json`.
//
// Matches a path as the full repo-relative path only, at path boundaries: `src/a.ts` does not match `a.ts` alone,
// `packages/x/src/a.ts` or `src/a.tsx`. A basename match is noise (42 basenames measured, mostly generic).
// Matches an identifier as a whole word: no letter, digit, `_`, `$` or `-` touches it, so a removed `stop` does not
// match `stopRules`, `stop_all` or `stop-hook`, and `--since` does not match `--since-tag`.
// A name that reads as a plain word (letters, at most a first capital: `stop`, `Rerank`) matches only inside a code span
// (between backticks on one line): a README heading "Rerank the results" is prose (seen on the mutex history).
//
// Prints each stale path, or each stale identifier as `<kind> <name> (<file it was removed from>)`, as a heading,
// then `  <file>:<line>` or `  #<id> <title|description> (<repo name>)` for each mention outside an ADR.
// A mention inside an ADR (a `docs/adr/*.md` file) is not stale: an accepted ADR's text is history and is kept, and a
// changed decision gets a new ADR and a status paragraph on the old one (zukhruf docs/writing-package-docs.md, after
// Nygard). So ADR mentions go under their own heading `In decisions (history: keep the text; add a status paragraph
// only if the decision changed)`, one line per ADR file, `  <file>: <name>, <name>` (a path, or `<kind> <name>`),
// and they do not count. Then a last line `No stale mention.` or `Stale mentions: <n>`, where <n> counts the
// mentions outside ADRs. A failed agent-backlog call is printed and counts as one: the backlog was not read.
//
// Exit codes: 0 no stale mention outside ADRs, 1 a stale mention outside ADRs (or an unread backlog), 2 usage or read
// error.
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
  const decisions = new Map(); // ADR file → the names it mentions, in order
  for (const [repo, shas] of commitsByRepo) {
    const stale = new Map(); // heading → what matches a mention (`test(text)`)
    const seen = new Set();
    for (const sha of shas) {
      for (const line of gitOrUsage(repo, ['show', '--format=', '--name-status', '--diff-filter=DR', sha]).split('\n')) {
        const [status, path] = line.split('\t');
        if (status && path) stale.set(path, new RegExp(String.raw`(?<![\w-]|[\w-][/.])${RegExp.escape(path)}(?![\w/-]|\.\w)`));
      }
      for (const { kind, name, file } of removedIdentifiers(repo, sha)) {
        if (seen.has(`${kind} ${name}`)) continue;
        seen.add(`${kind} ${name}`);
        if (namedAtHead(repo, name)) continue;
        stale.set(`${kind} ${name} (${file})`, mentionOf(name));
      }
    }
    if (stale.size === 0) continue;
    backlog ??= openBacklog();
    const records = [...repoDocs(repo), ...memoryFiles(repo)].map((file) => ({ file, lines: readFileSync(file, 'utf8').split('\n') }));
    for (const [heading, pattern] of stale) {
      const name = headingName(heading);
      const hits = [];
      for (const { file, lines } of records) {
        const adr = ADR_FILE.test(file);
        lines.forEach((text, i) => {
          if (!pattern.test(text)) return;
          if (!adr) hits.push(`${file}:${i + 1}`);
          else if (!decisions.get(file)?.includes(name)) decisions.set(file, [...(decisions.get(file) ?? []), name]);
        });
      }
      for (const item of backlog.items) {
        for (const field of ['title', 'description']) if (pattern.test(item[field] ?? '')) hits.push(`#${item.id} ${field} (${item.repositoryName})`);
      }
      if (hits.length === 0) continue;
      console.log(`${repo}: ${heading}`);
      for (const hit of hits) console.log(`  ${hit}`);
      count += hits.length;
    }
  }
  if (decisions.size > 0) {
    console.log(DECISIONS_HEADING);
    for (const [file, names] of decisions) console.log(`  ${file}: ${names.join(', ')}`);
  }
  if (backlog?.error) {
    console.log(`could not read open backlog items: ${backlog.error}`);
    count++;
  }
  console.log(count === 0 ? 'No stale mention.' : `Stale mentions: ${count}`);
  return count === 0 ? 0 : 1;
}

// An ADR in a docs/adr folder: its text is history, kept as written (zukhruf docs/writing-package-docs.md, after Nygard).
const ADR_FILE = /(?:^|\/)docs\/adr\/[^/]+\.md$/;
const DECISIONS_HEADING = 'In decisions (history: keep the text; add a status paragraph only if the decision changed)';
// The name of a heading: the path, or `<kind> <name>` without the file it was removed from.
const headingName = (heading) => heading.replace(/ \([^()]*\)$/, '');

function gitOrUsage(repo, args) {
  try {
    return git(repo, args);
  } catch (error) {
    throw new UsageError(`git ${args.join(' ')} in ${repo}: ${firstLine(error)}`);
  }
}

const wordPattern = (name) => new RegExp(String.raw`(?<![\w$-])${RegExp.escape(name)}(?![\w$-])`);

// A name that reads as a plain word (`stop`, `Rerank`) is a mention only inside a code span, as a heading
// "Rerank the results" is prose; any other name (`warehouseLogin`, `--since`, `kept-rule`) is a mention anywhere.
function mentionOf(name) {
  const word = wordPattern(name);
  if (!/^[A-Za-z][a-z]*$/.test(name)) return word;
  return { test: (text) => text.split('`').some((part, i) => i % 2 === 1 && word.test(part)) };
}

const CODE_FILE = /\.[cm]?[jt]sx?$/;
const RULES_FILE = /(?:^|[/._-])rules?(?:[/._-]|$)/i;
const CLI_FILE = /^#!|\bparseArgs\b|\bprocess\.argv\b|\.option\(|\byargs\b/m;
const USAGE_LINE = /^\s*(?:\/\/|\/?\*|#)|usage|options?\s*:|\.(?:required)?option\(|case\s+['"`]--|===\s*['"`]--/i;
const IDENTIFIER = String.raw`[A-Za-z_$][\w$]*`;

// The identifiers each changed code file of the commit declares before it and no longer declares after it.
function removedIdentifiers(repo, sha) {
  const parent = `${sha}^`;
  try {
    git(repo, ['rev-parse', '--verify', '--quiet', `${parent}^{commit}`]);
  } catch {
    return []; // a root commit removes nothing
  }
  const removed = [];
  for (const line of gitOrUsage(repo, ['diff-tree', '-r', '-M', '--no-commit-id', '--name-status', sha]).split('\n')) {
    const [status, oldPath, newPath] = line.split('\t');
    if (!status || status === 'A' || !CODE_FILE.test(oldPath)) continue;
    const before = declarations(oldPath, gitOrUsage(repo, ['show', `${parent}:${oldPath}`]));
    const after = status === 'D' ? new Set() : declarations(newPath ?? oldPath, gitOrUsage(repo, ['show', `${sha}:${newPath ?? oldPath}`]));
    for (const key of before) {
      if (after.has(key)) continue;
      const [kind, name] = key.split('\0');
      removed.push({ kind, name, file: oldPath });
    }
  }
  return removed;
}

// `<kind>\0<name>` for each export, rule id and CLI flag that the file's text declares.
function declarations(path, text) {
  const found = new Set();
  const add = (kind, name) => found.add(`${kind}\0${name}`);
  for (const m of text.matchAll(new RegExp(String.raw`\bexport\s+(?:default\s+)?(?:declare\s+)?(?:abstract\s+)?(?:async\s+)?(?:function\s*\*?|const|let|var|class|type|interface|enum|namespace)\s+(${IDENTIFIER})`, 'g'))) add('export', m[1]);
  for (const m of text.matchAll(/\bexport\s+(?:type\s+)?\{([^}]*)\}/g)) {
    for (const part of m[1].split(',')) {
      const name = part.trim().replace(/^type\s+/, '').split(/\s+as\s+/).at(-1).trim();
      if (name && name !== 'default') add('export', name);
    }
  }
  for (const m of text.matchAll(new RegExp(String.raw`(?<![\w$.])(?:module\.)?exports\.(${IDENTIFIER})\s*=`, 'g'))) add('export', m[1]);
  for (const m of text.matchAll(/\bmodule\.exports\s*=\s*\{/g)) {
    for (const part of topLevelParts(text, m.index + m[0].length)) {
      const key = part.match(new RegExp(String.raw`^\s*(?:async\s+)?\*?\s*(?:(['"])([^'"]+)\1|(${IDENTIFIER}))\s*(?:[:(]|$)`));
      if (key && !part.trim().startsWith('...')) add('export', key[2] ?? key[3]);
    }
  }
  if (RULES_FILE.test(path)) {
    for (const m of text.matchAll(/(?<![\w$])id\s*:\s*(['"`])([^'"`\s]+)\1/g)) add('rule id', m[2]);
  }
  if (CLI_FILE.test(text)) {
    for (const m of text.matchAll(/(['"]?)([A-Za-z][\w-]*)\1\s*:\s*\{\s*type\s*:\s*['"](?:string|boolean)['"]/g)) add('flag', `--${m[2]}`);
    for (const line of text.split('\n')) {
      if (USAGE_LINE.test(line)) for (const m of line.matchAll(/(?<![\w-])--[A-Za-z][\w-]*/g)) add('flag', m[0]);
    }
  }
  return found;
}

// The comma-separated parts of the object literal whose body starts at `from`, split at its own depth only.
function topLevelParts(text, from) {
  const parts = [];
  let depth = 0;
  let start = from;
  for (let i = from; i < text.length; i++) {
    const c = text[i];
    if ('{[('.includes(c)) depth++;
    else if ('}])'.includes(c)) {
      if (depth === 0) {
        parts.push(text.slice(start, i));
        break;
      }
      depth--;
    } else if (c === ',' && depth === 0) {
      parts.push(text.slice(start, i));
      start = i + 1;
    }
  }
  return parts;
}

// Whether a file other than Markdown names the identifier at HEAD, as a whole word.
function namedAtHead(repo, name) {
  const pattern = wordPattern(name);
  const lines = (fixed) => {
    try {
      return git(repo, ['grep', '-h', '-F', '-e', fixed, 'HEAD', '--', '.', ':(exclude)*.md']).split('\n');
    } catch (error) {
      if (error.status === 1) return []; // git grep: no line matched
      throw new UsageError(`git grep ${fixed} in ${repo}: ${firstLine(error)}`);
    }
  };
  if (lines(name).some((line) => pattern.test(line))) return true;
  // A flag can live on as a parseArgs key alone (`since: { type: 'string' }`), which never spells `--since`.
  if (!name.startsWith('--')) return false;
  const key = new RegExp(String.raw`(['"]?)${RegExp.escape(name.slice(2))}\1\s*:\s*\{\s*type\s*:`);
  return lines(name.slice(2)).some((line) => key.test(line));
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
