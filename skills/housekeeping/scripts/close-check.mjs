#!/usr/bin/env node
// close-check.mjs: what this session left open before it may say "Safe to close."
//
// Usage: node scripts/close-check.mjs [--transcript <path>]
//
// Reads
//   The session's transcript, ~/.claude/projects/*/<CLAUDE_CODE_SESSION_ID>.jsonl, or --transcript <path>,
//   plus every subagent transcript beside it (<id>/subagents/*.jsonl): a subagent's work is the session's work.
//   Only Bash calls and their results count. A command counts by the simple commands the shell runs (lib/session.mjs
//   simpleCommands): text in quotes, heredocs, comments or another command's output never makes one, so a session
//   that reads other sessions' transcripts (grep, node -e) does not take on their pushes or backlog items.
//
// Prints, under four headings, then a last line:
//   Pushes       for each Bash call that runs `git push` (or `git -C <path> push`), each range line
//                `<old>..<new>  <src> -> <dst>` in that call's own result; text in any other call's result never makes
//                a push. The repo is the call's `git -C <path>`, else its last `cd <path>`, else its working directory.
//                For each pushed head, the runs of `gh run list --commit <sha> --json name,status,conclusion,url` in
//                that repo. A run that is not completed + success is open. A head with no run yet is printed, not
//                open. A repo directory that no longer exists is open as "repo path not found: <path>", and gh is not
//                called. "gh not found" (gh is not on PATH) and gh's own error are open: CI was not read.
//   Unpushed     for each repo and branch where the session ran `git commit` (shas from `[<branch> <sha>]` in the
//                result), after `git fetch origin <branch>`, the session's own commits that
//                `origin/<branch>..<branch>` lists. Other sessions' commits in a shared checkout are not listed.
//                A failed fetch (no remote, offline) is open.
//   Ready items  the session's backlog items that it filed or set WITH a condition and that
//                `agent-backlog ready --all-repos --json` lists as ready: the condition is met, so each is a step to
//                take now, and open. An item has a condition when its `agent-backlog add` carries --after, --published,
//                --clean or --until, when the session ran `agent-backlog wait <id>`, or when the session's
//                `agent-backlog met` result names it. A failed agent-backlog call is open.
//   Filed (follow-ups, not open)
//                the session's backlog items with no condition (an add without one, an update) that `ready` lists:
//                work for a later session. Printed without OPEN and not counted.
//                The session's items: the id operand of `agent-backlog update|wait <id>`, and each `#<id> · ` card
//                header or JSON top-level "id" in the result of a call that runs `agent-backlog add|update|wait|met`
//                (no --help), runs no `agent-backlog show`, and runs no other command but cd, echo, other agent-backlog
//                reads and pipeline stages. The output of list, show, ready, decisions and any other command never
//                adds an id: list, ready and decisions print rows (`#<id>  <title>`), never a card header, so a dedup
//                `list` beside the `add` it guards still counts the add; show prints a card, so a call with show
//                counts no id from its result.
//   last line    `Nothing open.` or `Open: <n>`.
//
// Not printed: background work that still runs (subagents, background shells, watches). A script cannot see the
// harness's task list; the skill takes it from ListAgents and the Stop reminder.
//
// Exit codes: 0 nothing open, 1 something open, 2 usage or transcript read error.
// Commands it runs: git (rev-parse, fetch, rev-list, log), gh, agent-backlog. Fetch is its only write.
import { parseArgs } from 'node:util';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { basename } from 'node:path';
import { UsageError, transcriptFiles, bashCalls, simpleCommands, commandWords, gitDirectory, repoRoot, sessionCommits, git, firstLine } from './lib/session.mjs';

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
    if (!existsSync(push.repo)) {
      say(`  repo path not found: ${push.repo}`, true);
      continue;
    }
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
  const items = backlogItems(calls);
  let ready = [];
  if (items.size > 0) {
    try {
      ready = JSON.parse(execFileSync('agent-backlog', ['ready', '--all-repos', '--json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 256 * 1024 * 1024 }))
        .filter((item) => item.readiness === 'ready' && items.has(item.id));
    } catch (error) {
      say(`could not read ready items: ${error.code === 'ENOENT' ? 'agent-backlog not found' : firstLine(error)}`, true);
    }
  }
  const [steps, followUps] = [true, false].map((conditioned) => ready.filter((item) => items.get(item.id) === conditioned));
  if (steps.length === 0) say('none');
  for (const item of steps) say(`#${item.id} ${item.title} (${item.repositoryName})`, true);
  console.log('Filed (follow-ups, not open)');
  if (followUps.length === 0) say('none');
  for (const item of followUps) say(`#${item.id} ${item.title} (${item.repositoryName})`);

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

const BACKLOG_WRITES = new Set(['add', 'update', 'wait', 'met']);
const CONDITIONS = ['--after', '--published', '--clean', '--until'];
const QUIET = new Set(['cd', 'echo']);
const hasCondition = (words) => words.some((w) => CONDITIONS.some((c) => w === c || w.startsWith(`${c}=`)));
const itemId = (word) => (/^#?\d+$/.test(word ?? '') ? Number(word.replace('#', '')) : null);

// The backlog items the session filed or changed, each mapped to whether the session gave it a condition.
function backlogItems(calls) {
  const items = new Map();
  const note = (id, conditioned) => items.set(id, items.get(id) === true || conditioned);
  for (const call of calls) {
    const commands = simpleCommands(call.command).map((c) => ({ link: c.link, words: commandWords(c.words) }));
    const backlog = commands.filter(({ words }) => words.length > 0 && basename(words[0]) === 'agent-backlog');
    const writes = backlog.filter(({ words }) => BACKLOG_WRITES.has(words[1]) && !words.includes('--help') && !words.includes('-h'));
    if (writes.length === 0) continue;
    const operands = new Set();
    for (const { words } of writes) {
      const id = words[1] === 'update' || words[1] === 'wait' ? itemId(words[2]) : null;
      if (id === null) continue;
      operands.add(id);
      note(id, words[1] === 'wait');
    }
    const ownResult = !backlog.some(({ words }) => words[1] === 'show')
      && commands.every((c) => backlog.includes(c) || QUIET.has(c.words[0]) || c.link === '|' || c.link === '|&');
    if (!ownResult) continue;
    const adds = writes.filter(({ words }) => words[1] === 'add').map(({ words }) => words);
    const met = writes.some(({ words }) => words[1] === 'met');
    if (adds.length === 0 && !met) continue;
    const found = [...call.result.matchAll(/#(\d+) · |^ {2}"id": (\d+)/gm)].map((m) => Number(m[1] ?? m[2]));
    const filed = [...new Set(found)].filter((id) => !operands.has(id));
    // One id per add, in order; when the counts differ, an id has a condition if any add of the call has one.
    filed.forEach((id, n) => note(id, met || (filed.length === adds.length ? hasCondition(adds[n]) : adds.some(hasCondition))));
  }
  return items;
}

try {
  process.exitCode = main();
} catch (error) {
  if (!(error instanceof UsageError) && error.code !== 'ENOENT' && error.code !== 'EACCES') throw error;
  console.error(`close-check: ${error.message}`);
  process.exitCode = 2;
}
