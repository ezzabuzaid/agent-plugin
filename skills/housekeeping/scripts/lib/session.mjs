// Reads what this session did from its Claude Code transcripts. Shared by close-check.mjs and records-check.mjs;
// their header comments hold the contract.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { homedir } from 'node:os';
import { join, dirname, basename, resolve } from 'node:path';

export class UsageError extends Error {}

// The session's transcript plus its subagents' transcripts (<id>/subagents/*.jsonl beside it).
export function transcriptFiles(transcriptOption) {
  let main = transcriptOption;
  if (!main) {
    const id = process.env.CLAUDE_CODE_SESSION_ID;
    if (!id) throw new UsageError('no session: CLAUDE_CODE_SESSION_ID is not set and no --transcript was given');
    const projects = join(homedir(), '.claude', 'projects');
    main = readdirSync(projects).map((p) => join(projects, p, `${id}.jsonl`)).find((f) => existsSync(f));
    if (!main) throw new UsageError(`no transcript for session ${id} under ${projects}`);
  }
  if (!existsSync(main)) throw new UsageError(`transcript not found: ${main}`);
  const subDir = join(dirname(main), basename(main, '.jsonl'), 'subagents');
  const subs = existsSync(subDir) ? readdirSync(subDir).filter((f) => f.endsWith('.jsonl')).map((f) => join(subDir, f)) : [];
  return [main, ...subs];
}

const resultText = (r) => (Array.isArray(r.content) ? r.content.map((x) => x.text ?? '').join('') : String(r.content ?? ''));

// Every Bash call with its result text and working directory, in transcript order.
export function bashCalls(files) {
  const calls = [];
  for (const file of files) {
    const pending = new Map();
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      if (!line.trim()) continue;
      let entry;
      try { entry = JSON.parse(line); } catch { continue; }
      const content = entry.message?.content;
      if (!Array.isArray(content)) continue;
      if (entry.type === 'assistant') {
        for (const b of content) if (b.type === 'tool_use' && b.name === 'Bash' && typeof b.input?.command === 'string') {
          pending.set(b.id, { command: b.input.command, cwd: entry.cwd });
        }
      } else if (entry.type === 'user') {
        for (const r of content) if (r.type === 'tool_result' && pending.has(r.tool_use_id)) {
          const call = pending.get(r.tool_use_id);
          calls.push({ ...call, cwd: call.cwd ?? entry.cwd, result: resultText(r) });
        }
      }
    }
  }
  return calls;
}

const unquote = (s) => s.replace(/^(['"])(.*)\1$/, '$2');
const expand = (p, cwd) => resolve(cwd ?? process.cwd(), p.startsWith('~/') ? join(homedir(), p.slice(2)) : p);
const PATH_ARG = String.raw`("[^"]+"|'[^']+'|\S+)`;

// The directory a git subcommand ran in: its `git -C <path>`, else the last `cd <path>` before it, else the call's cwd.
export function gitDirectory(command, subcommand, cwd) {
  const at = command.search(new RegExp(String.raw`\bgit\b(\s+-C\s+${PATH_ARG})?\s+${subcommand}\b`));
  if (at < 0) return null;
  const dashC = command.slice(at).match(new RegExp(String.raw`^git\s+-C\s+${PATH_ARG}`));
  if (dashC) return expand(unquote(dashC[1]), cwd);
  const cds = [...command.slice(0, at).matchAll(new RegExp(String.raw`(?:^|[;&|(]\s*)cd\s+${PATH_ARG}`, 'g'))];
  return cds.length ? expand(unquote(cds.at(-1)[1]), cwd) : cwd;
}

// The top of the repo that holds dir, or null when dir is no repo (or is gone).
export function repoRoot(dir) {
  try {
    return execFileSync('git', ['-C', dir, 'rev-parse', '--show-toplevel'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
}

// Commits the session made: `[<branch> <sha>]` (or `[<branch> (root-commit) <sha>]`) in a `git commit` result.
export function sessionCommits(calls) {
  const commits = [];
  for (const call of calls) {
    const dir = gitDirectory(call.command, 'commit', call.cwd);
    if (!dir) continue;
    for (const m of call.result.matchAll(/^\[(\S+)(?: \(root-commit\))? ([0-9a-f]{7,40})\]/gm)) {
      commits.push({ dir, branch: m[1], sha: m[2] });
    }
  }
  return commits;
}

export function git(dir, args) {
  return execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

export const firstLine = (error) => String(error.stderr || error.message).trim().split('\n')[0];
