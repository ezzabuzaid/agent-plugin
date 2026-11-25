#!/usr/bin/env node
// close-check.mjs: what this session left open before it may say "Safe to close."
//
// Usage: node scripts/close-check.mjs [--transcript <path>]
//
// Reads
//   The session's transcript, ~/.claude/projects/*/<CLAUDE_CODE_SESSION_ID>.jsonl, or --transcript <path>,
//   plus every subagent transcript beside it (<id>/subagents/*.jsonl). Only Bash calls and their results count.
//
// Prints, under three headings, then a last line:
//   Pushes       each `git push` result line `<old>..<new>  <src> -> <dst>` (the repo is the call's `git -C <path>`,
//                else its last `cd <path>`, else its working directory), and for each pushed head the runs of
//                `gh run list --commit <sha> --json name,status,conclusion,url` in that repo. A run that is not
//                completed + success is open. A head with no run yet is printed, not open. A gh failure
//                ("gh not found", gh's own error) is open: CI was not read.
//   Unpushed     for each repo and branch where the session ran `git commit` (shas from `[<branch> <sha>]` in the
//                result), after `git fetch origin <branch>`, the session's own commits that
//                `origin/<branch>..<branch>` lists. Other sessions' commits in a shared checkout are not listed.
//                A failed fetch (no remote, offline) is open.
//   Ready items  the ids that the session's `agent-backlog add|update|wait|met` calls name (`#<id> · ` or a JSON
//                top-level "id" in the result, the id operand of update and wait), that
//                `agent-backlog ready --all-repos --json` lists as ready. Each is a step to take now, so it is open.
//                A failed agent-backlog call is open.
//   last line    `Nothing open.` or `Open: <n>`.
//
// Not printed: background work that still runs (subagents, background shells, watches). A script cannot see the
// harness's task list; the skill takes it from ListAgents and the Stop reminder.
//
// Exit codes: 0 nothing open, 1 something open, 2 usage or transcript read error.
// Commands it runs: git (rev-parse, fetch, rev-list, log), gh, agent-backlog. Fetch is its only write.
import { parseArgs } from 'node:util';
import { execFileSync } from 'node:child_process';
import { UsageError, transcriptFiles, bashCalls, gitDirectory, repoRoot, sessionCommits, git, firstLine } from './lib/session.mjs';

function main() {
  let options;
  try {
    ({ values: options } = parseArgs({ options: { transcript: { type: 'string' } } }));
  } catch (error) {
    throw new UsageError(error.message);
  }
  const calls = bashCalls(transcriptFiles(options.transcript));
  let open = 0;
  const say = (line, isOpen = false) => {
    if (isOpen) open++;
    const [, indent, text] = line.match(/^(\s*)(.*)$/s);
    console.log(`  ${indent}${isOpen ? 'OPEN ' : ''}${text}`);
  };

  console.log('Pushes');
  const pushes = pushedHeads(calls);
  if (pushes.length === 0) say('none');
  for (const push of pushes) {
    say(`${push.repo} ${push.ref} ${push.sha.slice(0, 12)}`);
    let runs;
    try {
      runs = JSON.parse(execFileSync('gh', ['run', 'list', '--commit', push.sha, '--json', 'name,status,conclusion,url'], { cwd: push.repo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
    } catch (error) {
      say(`could not read CI for ${push.sha.slice(0, 12)}: ${error.code === 'ENOENT' ? 'gh not found' : firstLine(error)}`, true);
      continue;
    }
    if (runs.length === 0) say('  no runs');
    for (const run of runs) {
      const green = run.status === 'completed' && run.conclusion === 'success';
      say(`  ${run.name}: ${run.status}${run.conclusion ? ` ${run.conclusion}` : ''} ${run.url}`, !green);
    }
  }

  console.log('Unpushed');
  const before = open;
  const commits = sessionCommits(calls).flatMap((commit) => {
    const repo = repoRoot(commit.dir);
    return repo ? [{ ...commit, repo }] : [];
  });
  for (const [key, group] of Map.groupBy(commits, (commit) => `${commit.repo}\0${commit.branch}`)) {
    const [repo, branch] = key.split('\0');
    let listed;
    try {
      git(repo, ['fetch', '--quiet', 'origin', branch]);
      listed = git(repo, ['log', '--format=%H %s', `refs/remotes/origin/${branch}..refs/heads/${branch}`]).split('\n').filter(Boolean);
    } catch (error) {
      say(`could not check ${repo} ${branch}: ${firstLine(error)}`, true);
      continue;
    }
    for (const line of listed) {
      if (group.some((c) => line.startsWith(c.sha))) say(`${repo} ${branch} ${line.slice(0, 12)}${line.slice(40)}`, true);
    }
  }
  if (open === before) say('none');

  console.log('Ready items');
  const ids = backlogIds(calls);
  if (ids.size === 0) say('none');
  else {
    try {
      const ready = JSON.parse(execFileSync('agent-backlog', ['ready', '--all-repos', '--json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 256 * 1024 * 1024 }))
        .filter((item) => item.readiness === 'ready' && ids.has(item.id));
      if (ready.length === 0) say('none');
      for (const item of ready) say(`#${item.id} ${item.title} (${item.repositoryName})`, true);
    } catch (error) {
      say(`could not read ready items: ${error.code === 'ENOENT' ? 'agent-backlog not found' : firstLine(error)}`, true);
    }
  }

  console.log(open === 0 ? 'Nothing open.' : `Open: ${open}`);
  return open === 0 ? 0 : 1;
}

// One entry per repo and pushed head, from `<old>..<new>  <src> -> <dst>` (or `...` for a forced update).
function pushedHeads(calls) {
  const heads = new Map();
  for (const call of calls) {
    const dir = gitDirectory(call.command, 'push', call.cwd);
    if (!dir) continue;
    const repo = repoRoot(dir) ?? dir;
    for (const m of call.result.matchAll(/^\s*[+ ]?\s*([0-9a-f]{7,40})\.\.\.?([0-9a-f]{7,40})\s+(\S+)\s+->\s+(\S+)/gm)) {
      let sha = m[2];
      try { sha = git(repo, ['rev-parse', `${m[2]}^{commit}`]).trim(); } catch { /* keep the short sha: gh takes it too */ }
      heads.set(`${repo}\0${sha}`, { repo, sha, ref: m[4] });
    }
  }
  return [...heads.values()];
}

function backlogIds(calls) {
  const ids = new Set();
  for (const call of calls) {
    if (!/\bagent-backlog\s+(add|update|wait|met)\b/.test(call.command)) continue;
    for (const m of call.command.matchAll(/\bagent-backlog\s+(?:update|wait)\s+#?(\d+)\b/g)) ids.add(Number(m[1]));
    for (const m of call.result.matchAll(/#(\d+) · /g)) ids.add(Number(m[1]));
    for (const m of call.result.matchAll(/^ {2}"id": (\d+)/gm)) ids.add(Number(m[1]));
  }
  return ids;
}

try {
  process.exitCode = main();
} catch (error) {
  if (!(error instanceof UsageError) && error.code !== 'ENOENT' && error.code !== 'EACCES') throw error;
  console.error(`close-check: ${error.message}`);
  process.exitCode = 2;
}
