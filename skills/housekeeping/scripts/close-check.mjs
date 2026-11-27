#!/usr/bin/env node
// close-check.mjs: the duty list of this session, from its own record, before it may say "done" or "Safe to close."
//
// Usage: node scripts/close-check.mjs [--transcript <path>]
//
// Reads
//   The session: its id (CLAUDE_CODE_SESSION_ID, or the name of --transcript <path> without .jsonl) plus every id it
//   was derived from through a `derived-from` entry of its transcripts, recursively, as Claude Code writes one after a
//   /clear (lib/session.mjs sessionChain). Each section reads the whole chain.
//   The transcripts of every id of the chain, ~/.claude/projects/*/<id>.jsonl (--transcript <path> for the first),
//   plus every subagent transcript beside each (<id>/subagents/*.jsonl): a subagent's work is the session's work.
//   A command counts by the simple commands the shell runs (lib/session.mjs commandsIn): text in quotes, heredocs,
//   comments or another command's output never makes one, so a session that reads other sessions' transcripts
//   (grep, node -e) does not take on their test runs or the folders they made.
//   The session ledger of every id, ~/.claude/ledger/<id>.jsonl, which git's own hooks write when a commit or a
//   tracking-ref update happens (agent-plugin hooks/session-ledger/README.md): the session's commits and pushes come
//   from it alone, never from the text of a command or its output.
//   The backlog items each id wrote, from `agent-backlog list --session <id> --all-repos --json`, merged by item id:
//   agent-backlog records each write of a session when it happens.
//
// Each line is one of three kinds. `OPEN <text>`: a machine sees that it is not done. `CHECK <text>`: only the agent
// can say whether it is done, so it marks the line (done, with evidence; or open, with an item or a reason). A line
// with neither is a fact that needs no mark.
//
// Prints, under these headings, then a last line:
//   Session      each id of the chain, the session's own first. An id whose transcript is not found is open as
//                "<id>: no transcript found, its calls not read"; its ledger and backlog items are still read.
//   Pushes       each `kind: "ref"` line of the chain's ledger with `by: "push"`: the repo, the branch of its
//                `refs/remotes/<remote>/<branch>` and the pushed head (`new`), once per repo and head.
//                For each pushed head, the runs of `gh run list --commit <sha> --json name,status,conclusion,url` in
//                that repo. A run that is not completed + success is open. A head with no run yet is printed, not
//                open. A repo directory that no longer exists is open as "repo path not found: <path>", and gh is not
//                called. "gh not found" (gh is not on PATH) and gh's own error are open: CI was not read, unless the
//                remote's URL (`git remote get-url <remote>`) is a folder on disk (a path or file://): such a push has
//                no CI and prints "no CI: <remote> is a local repository (<url>)", not open.
//                Coverage, from the ledger's own record (lib/session.mjs sessionLedger): the ledger records every
//                commit and push of a session that began after ~/.claude/ledger/installed-at (one ISO 8601 UTC line
//                that its install.sh writes), while both hook keys stay registered (git config --global
//                hook.session-ledger-commit.command and hook.session-ledger-ref.command). Without the marker or
//                either key, one open line says the ledger is not installed, the commits and pushes were not read,
//                and the install command (`sh <agent-plugin>/hooks/session-ledger/install.sh`); there is no other
//                source of them. Else each chain id whose transcript's first dated entry is older than installed-at
//                (or that has none) is open: "<id> began <start>, before the session ledger was installed
//                (<installed-at>): its commits and pushes before then were not read; list them with git log
//                --since=<start> in each repo it worked in, check each is pushed and its CI read, and review each
//                (SKILL.md Finish)" (no --since when there is no start). Any other id with no ledger
//                file made no commit and no push. An id whose transcript is not found is open under Session only.
//   Unpushed     for each repo (that still exists) and branch of the ledger's `kind: "commit"` lines (`ref`
//                refs/heads/<branch>; a commit on a detached HEAD has no branch), after `git fetch origin <branch>`,
//                the session's own commits that `origin/<branch>..<branch>` lists. Other sessions' commits in a
//                shared checkout are not listed. A failed fetch (no remote, offline) is open. With no ledger read:
//                "not read: no session ledger".
//   Ready items  the session's backlog items whose `readiness` is "ready" and that have a condition (`conditions` of
//                `agent-backlog show <id> --json` not empty): the condition is met, so each is a step to take now,
//                and open. A failed agent-backlog call is open.
//   Filed (yours: do it now, or say why it waits)
//                the session's ready backlog items with no condition: CHECK each: done now when it is small and in
//                this session's scope, else open with the check that shows why it waits. A filed item is not a reason
//                by itself (the replay of 448389f7: #5629 was filed instead of a two-word fix). An item that is done
//                or waits is in neither section.
//   Docs of changed packages
//                for each repo (that still exists) of the ledger's commits, each package that its commits touched
//                (the nearest folder with package.json or project.json above each file of `git show --name-only`,
//                inside the repo), the package's README.md, AGENTS.md, CLAUDE.md, CONTEXT.md, GLOSSARY.md, plus the
//                repo's own AGENTS.md and CLAUDE.md, that exist and that no session commit changed: CHECK, one line
//                each, as repo-relative paths. The package's docs/adr folder, when it holds a .md file, is ONE CHECK
//                line, never a line per ADR: `<pkg>/docs/adr (<n> decisions[, <m> changed by this session]): a decision this change overturns
//                gets a status paragraph`. An accepted ADR's text is history and is kept; a changed decision gets a
//                new ADR and a status paragraph on the old one (zukhruf docs/writing-package-docs.md, after Nygard).
//                The line stays when a session commit changed some of its ADRs, and says how many. A commit that git
//                cannot show is open.
//   Stale records
//                for each commit of the chain's ledger whose repo still exists, the review that the record reviewer
//                (references/record-reviewer.md, launched by SKILL.md Finish) wrote to
//                ~/.claude/housekeeping/reviews/<full sha>.md: its first line is `REVIEW <full sha>`, then
//                `STALE: <text>` lines or `none`. Each STALE line is a CHECK line `<repo> <sha8>: <text>`; a `none`
//                review prints nothing. No file is open: "<repo> <full sha>: not reviewed for stale records (run the
//                record reviewer for this full sha, SKILL.md Finish)". The full sha is the name the review must have:
//                a Finish job that launched reviewers with an abbreviation got reviews this script never found
//                (#5896). A file that does not start with `REVIEW <full sha>`, or has neither a STALE line nor `none`,
//                is open as an unreadable review.
//   Tests of touched packages
//                for each package (as above, in a git repo) that holds a file the session's Edit, Write or
//                NotebookEdit calls changed: OPEN when no test command ran for it after the last such change, by
//                transcript time (main and subagent transcripts). A test command: nx with a `test` target
//                (`nx test`, `nx run <p>:test`, `-t test`, `--targets=lint,test`), npm, pnpm, yarn or bun with a word
//                `test`, node with --test or a `*.test.*` file, vitest, jest, mocha. It is for the package when it runs
//                inside the package, names the package (its package.json or project.json name, or its folder name,
//                alone or as `<name>:<target>`), names a path inside it, or is `nx affected` or `nx run-many` in its repo.
//   Created outside repos
//                what the session's Write calls, `mkdir` and `git clone <src> <dest>` created outside any git repo and
//                outside ~/.claude (but inside ~/.claude/scratch), that still exists: CHECK, clean it up or keep it
//                with a reason. A path inside another listed path is not listed again. One line per folder two levels
//                under the first of ~/.claude/scratch, /tmp, /private/tmp, /var/folders, ~ or / that holds the path
//                (one level for a path one level deep), with the paths under it.
//   Left by test runs
//                for each repo where the session ran a test command (as above), each untracked folder that
//                `git ls-files --others --directory --exclude-standard` lists (empty folders too, which git status
//                hides) and that was born at or after the session's first call: CHECK, clean it up or keep it with
//                a reason. A test runner is a child process, so no tool call names what it leaves (#5833). The system
//                temp folder is not read: other processes made about 190 folders there in 3 hours (2026-11-26).
//   Plans        for each ~/.claude/plans/*.md the session wrote or edited, as it is on disk: each numbered step
//                (`<n>. ` at the start of a line) CHECK, each ticked box `- [x]` CHECK, each empty box `- [ ]` OPEN.
//                A plan that is gone is printed without a mark.
//   Requests     each prompt the user typed (main transcripts of the chain, origin human, not a slash command),
//                first 160 characters: CHECK.
//   Skills       each skill the user ran as a `/command` and each skill the agent loaded with the Skill tool (main
//                transcripts of the chain), once by name, but housekeeping itself: CHECK (its closing report given).
//   Promises     each sentence with "I'll", "I will", "I promise" or "next I" in the agent's closing text of a turn
//                (main transcripts of the chain, text after the turn's last tool call, before the next prompt that is
//                not a tool result), and each answer the user gave to the agent's AskUserQuestion: CHECK. Text before
//                a tool call is narration of that call, not a promise.
//   Run log      only when the run log cannot be written: one open line naming its path (see below).
//   last line    `Nothing open.` or `Open: <n>`, then ` To mark: <m>` when there are CHECK lines.
//
// Each run appends what it prints to ~/.claude/housekeeping/runs/<id>.log, <id> the chain's first id (the
// transcript's own), as one block: a header line `=== <ISO time> close-check <chain ids, comma-separated>`, then the
// printed lines unchanged. A written log changes neither the output nor the exit code; a failed write adds the open
// Run log line above (counted), and the block is not written.
//
// Not printed: background work that still runs (subagents, background shells, watches). A script cannot see the
// harness's task list; the skill takes it from ListAgents and the Stop reminder.
//
// Exit codes: 0 nothing open, 1 something open, 2 usage or transcript read error.
// Commands it runs: git (config, rev-parse, fetch, log, show, ls-files), gh, agent-backlog (list, show). Fetch and the
// run log are its only writes.
import { parseArgs } from 'node:util';
import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, join, relative, sep } from 'node:path';
import { UsageError, NO_LEDGER, uncoveredLine, sessionChain, sessionLedger, toolCalls, bashCalls, entries, entryText, commandsIn, repoRoot, git, firstLine, expand } from './lib/session.mjs';

function main() {
  let options;
  try {
    ({ values: options } = parseArgs({ options: { transcript: { type: 'string' } } }));
  } catch (error) {
    throw new UsageError(error.message);
  }
  const chain = sessionChain(options.transcript);
  const { ids, files, missing } = chain;
  const tools = toolCalls(files);
  const calls = bashCalls(files);
  let open = 0;
  let toMark = 0;
  const out = [];
  const print = (line) => out.push(line);
  // mark: true or 'open' → OPEN, 'check' → CHECK, false → a fact.
  const say = (line, mark = false) => {
    const kind = mark === true || mark === 'open' ? 'OPEN ' : mark === 'check' ? 'CHECK ' : '';
    if (kind === 'OPEN ') open++;
    if (kind === 'CHECK ') toMark++;
    const [, indent, text] = line.match(/^(\s*)(.*)$/s);
    print(`  ${indent}${kind}${text}`);
  };
  const none = (list) => { if (list.length === 0) say('none'); };
  // A section of `{ text, mark }` lines, or `none`.
  const sayLines = (lines) => {
    none(lines);
    for (const line of lines) say(line.text, line.mark);
  };
  // A section of lines that are each a CHECK, or `none`.
  const sayChecks = (texts) => {
    none(texts);
    for (const text of texts) say(text, 'check');
  };

  print('Session');
  for (const id of ids) say(missing.includes(id) ? `${id}: no transcript found, its calls not read` : id, missing.includes(id));

  print('Pushes');
  const ledger = sessionLedger(chain);
  if (ledger === null) say(NO_LEDGER, true);
  for (const gap of ledger?.uncovered ?? []) say(uncoveredLine(gap, ledger.installedAt), true);
  const pushes = ledger?.pushes ?? [];
  if (ledger !== null) none(pushes);
  for (const push of pushes) {
    say(`${push.repo} ${push.branch} ${push.sha.slice(0, 12)}`);
    if (!existsSync(push.repo)) {
      say(`  repo path not found: ${push.repo}`, true);
      continue;
    }
    let runs;
    try {
      runs = JSON.parse(execFileSync('gh', ['run', 'list', '--commit', push.sha, '--json', 'name,status,conclusion,url'], { cwd: push.repo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
    } catch (error) {
      // gh failed: a remote that is a folder on disk has no CI at all, so that push owes no run.
      const url = remoteUrl(push);
      if (url !== null && isLocalPath(url)) {
        say(`  no CI: ${push.remote} is a local repository (${url})`);
        continue;
      }
      say(`could not read CI for ${push.sha.slice(0, 12)}: ${error.code === 'ENOENT' ? 'gh not found' : firstLine(error)}`, true);
      continue;
    }
    if (runs.length === 0) say('  no runs');
    for (const run of runs) {
      const green = run.status === 'completed' && run.conclusion === 'success';
      say(`  ${run.name}: ${run.status}${run.conclusion ? ` ${run.conclusion}` : ''} ${run.url}`, !green);
    }
  }

  print('Unpushed');
  const commits = (ledger?.commits ?? []).filter((commit) => existsSync(commit.repo));
  const before = open;
  const onBranch = commits.filter((commit) => commit.ref?.startsWith('refs/heads/'));
  for (const [key, group] of Map.groupBy(onBranch, (commit) => `${commit.repo}\0${commit.ref.slice('refs/heads/'.length)}`)) {
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
  if (ledger === null) say('not read: no session ledger');
  else if (open === before) say('none');

  print('Ready items');
  const items = new Map();
  for (const id of ids) {
    try {
      for (const item of backlog(['list', '--session', id, '--all-repos', '--json'])) items.set(item.id, item);
    } catch (error) {
      say(`could not read the backlog items of session ${id}: ${backlogFailure(error)}`, true);
    }
  }
  const steps = [];
  const followUps = [];
  for (const item of [...items.values()].filter((i) => i.readiness === 'ready')) {
    try {
      (backlog(['show', String(item.id), '--json']).conditions.length > 0 ? steps : followUps).push(item);
    } catch (error) {
      say(`could not read the conditions of #${item.id}: ${backlogFailure(error)}`, true);
    }
  }
  if (steps.length === 0) say('none');
  for (const item of steps) say(`#${item.id} ${item.title} (${item.repositoryName})`, true);
  print('Filed (yours: do it now, or say why it waits)');
  if (followUps.length === 0) say('none');
  for (const item of followUps) say(`#${item.id} ${item.title} (${item.repositoryName})`, 'check');

  print('Docs of changed packages');
  sayLines(changedPackageDocs(commits));

  print('Stale records');
  sayLines(staleRecords(commits));

  print('Tests of touched packages');
  sayLines(untestedPackages(tools, calls));

  print('Created outside repos');
  sayChecks(createdOutsideRepos(tools, calls));

  print('Left by test runs');
  sayLines(leftByTestRuns(tools, calls));

  print('Plans');
  sayLines(planLines(tools));

  const main = files.filter((f) => f.main).flatMap(({ file }) => [...entries(file)]);
  print('Requests');
  sayChecks(typedPrompts(main));

  print('Skills');
  sayChecks(invokedSkills(main, tools));

  print('Promises');
  sayChecks([...ownPromises(main), ...dialogAnswers(tools)]);

  const last = () => `${open === 0 ? 'Nothing open.' : `Open: ${open}`}${toMark > 0 ? ` To mark: ${toMark}` : ''}`;
  const log = join(homedir(), '.claude', 'housekeeping', 'runs', `${ids[0]}.log`);
  try {
    mkdirSync(dirname(log), { recursive: true });
    appendFileSync(log, `${[`=== ${new Date().toISOString()} close-check ${ids.join(',')}`, ...out, last()].join('\n')}\n`);
  } catch (error) {
    if (typeof error.code !== 'string') throw error; // only a file system failure is a failed write
    print('Run log');
    say(`could not append to ${log}: ${error.message}`, true);
  }
  print(last());
  console.log(out.join('\n'));
  return open === 0 ? 0 : 1;
}

const backlog = (args) => JSON.parse(execFileSync('agent-backlog', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 256 * 1024 * 1024 }));
const backlogFailure = (error) => (error.code === 'ENOENT' ? 'agent-backlog not found' : firstLine(error));

const clip = (text) => {
  const line = text.replace(/\s+/g, ' ').trim();
  return line.length > 160 ? `${line.slice(0, 159)}…` : line;
};
const inside = (path, dir) => path === dir || path.startsWith(dir.endsWith(sep) ? dir : dir + sep);

// The URL that the push's remote has in its repo now; null when git cannot read it.
function remoteUrl(push) {
  try {
    return git(push.repo, ['remote', 'get-url', push.remote]).trim();
  } catch {
    return null;
  }
}

// A git URL that names a folder on disk: file://, or a path (git's scp form `host:path` and any `scheme://` are not).
function isLocalPath(url) {
  if (url.startsWith('file://') || /^[A-Za-z]:[\\/]/.test(url)) return true;
  return !url.includes('://') && !/^[^/\\]+:/.test(url);
}

// The nearest folder at or above `dir`, inside `repo`, with package.json or project.json; null when none.
function packageOf(dir, repo) {
  for (let at = dir; inside(at, repo); at = dirname(at)) {
    if (existsSync(join(at, 'package.json')) || existsSync(join(at, 'project.json'))) return at;
    if (at === repo) break;
  }
  return null;
}

const PACKAGE_DOCS = ['README.md', 'AGENTS.md', 'CLAUDE.md', 'CONTEXT.md', 'GLOSSARY.md'];
const REPO_DOCS = ['AGENTS.md', 'CLAUDE.md'];

function changedPackageDocs(commits) {
  const lines = [];
  for (const [repo, group] of Map.groupBy(commits, (commit) => commit.repo)) {
    const changed = new Set();
    for (const { sha } of group) {
      try {
        for (const file of git(repo, ['show', '--name-only', '--format=', sha]).split('\n').filter(Boolean)) changed.add(file);
      } catch (error) {
        lines.push({ text: `could not read commit ${sha} in ${repo}: ${firstLine(error)}`, mark: 'open' });
      }
    }
    const packages = new Set();
    for (const file of changed) {
      let dir = dirname(join(repo, file));
      while (!existsSync(dir) && inside(dir, repo)) dir = dirname(dir);
      const pkg = packageOf(dir, repo);
      if (pkg) packages.add(pkg);
    }
    if (packages.size === 0) continue;
    const unchanged = (doc) => existsSync(doc) && !changed.has(relative(repo, doc));
    const marks = [];
    for (const pkg of [...packages].sort()) {
      for (const name of PACKAGE_DOCS) if (unchanged(join(pkg, name))) marks.push(relative(repo, join(pkg, name)));
      // An accepted ADR is history: one line for the folder, not one per decision (docs guide, after Nygard).
      const adr = join(pkg, 'docs', 'adr');
      const decisions = existsSync(adr) ? readdirSync(adr).filter((name) => name.endsWith('.md')) : [];
      if (decisions.length === 0) continue;
      const edited = decisions.filter((name) => changed.has(relative(repo, join(adr, name)))).length;
      const count = `${decisions.length} decision${decisions.length === 1 ? '' : 's'}${edited > 0 ? `, ${edited} changed by this session` : ''}`;
      marks.push(`${relative(repo, adr)} (${count}): a decision this change overturns gets a status paragraph`);
    }
    for (const name of REPO_DOCS) if (unchanged(join(repo, name))) marks.push(name);
    if (marks.length === 0) continue;
    lines.push({ text: repo, mark: false });
    for (const text of marks) lines.push({ text: `  ${text}`, mark: 'check' });
  }
  return lines;
}

// The review of each commit, as the record reviewer writes it (references/record-reviewer.md, Write).
function staleRecords(commits) {
  const lines = [];
  for (const { repo, sha } of commits) {
    const name = `${repo} ${sha.slice(0, 8)}`;
    const file = join(homedir(), '.claude', 'housekeeping', 'reviews', `${sha}.md`);
    let text;
    try {
      text = readFileSync(file, 'utf8');
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      lines.push({ text: `${repo} ${sha}: not reviewed for stale records (run the record reviewer for this full sha, SKILL.md Finish)`, mark: 'open' });
      continue;
    }
    const [first, ...body] = text.split('\n').map((line) => line.trimEnd());
    const stale = body.filter((line) => line.startsWith('STALE:'));
    if (first !== `REVIEW ${sha}` || (stale.length === 0 && body.find(Boolean) !== 'none')) {
      lines.push({ text: `${name}: unreadable review ${file}: it must start with "REVIEW ${sha}", then STALE lines or none`, mark: 'open' });
      continue;
    }
    for (const line of stale) lines.push({ text: `${name}: ${line.slice('STALE:'.length).trim()}`, mark: 'check' });
  }
  return lines;
}

const EDIT_TOOLS = new Set(['Edit', 'Write', 'NotebookEdit', 'MultiEdit']);
const editedPath = (call) => call.input.file_path ?? call.input.notebook_path;

function isTestCommand(words) {
  const [first, ...rest] = words[0] && basename(words[0]) === 'npx' ? words.slice(1) : words;
  if (!first) return false;
  const program = basename(first);
  if (['vitest', 'jest', 'mocha'].includes(program)) return true;
  if (program === 'nx') return rest.some((w) => /(^|:)test(:|$)/.test(w) || /^--targets?=(.*,)?test(,|$)/.test(w));
  if (['npm', 'pnpm', 'yarn', 'bun'].includes(program)) return rest.includes('test');
  if (program === 'node') return rest.some((w) => w === '--test' || w.startsWith('--test-') || /\.test\.[cm]?[jt]sx?$/.test(w));
  return false;
}

function packageNames(pkg) {
  const names = new Set([basename(pkg)]);
  for (const file of ['package.json', 'project.json']) {
    try {
      const { name } = JSON.parse(readFileSync(join(pkg, file), 'utf8'));
      if (typeof name === 'string') names.add(name);
    } catch { /* no such file, or not JSON */ }
  }
  return names;
}

// A test command run in `dir` with `words` is for the package `pkg` of `repo`.
function testsPackage(words, dir, pkg, repo) {
  if (dir && inside(dir, pkg)) return true;
  const program = words.map((w) => basename(w));
  if (dir && inside(dir, repo) && program.includes('nx') && (words.includes('affected') || words.includes('run-many'))) return true;
  const names = packageNames(pkg);
  return words.slice(1).some((w) => names.has(w) || names.has(w.split(':')[0]) || (!w.startsWith('-') && dir && inside(expand(w, dir), pkg)));
}

function untestedPackages(tools, calls) {
  const touched = new Map(); // package → { repo, at, file }
  for (const call of tools) {
    if (!EDIT_TOOLS.has(call.name) || typeof editedPath(call) !== 'string') continue;
    const file = expand(editedPath(call), call.cwd);
    let dir = dirname(file);
    while (!existsSync(dir) && dir !== dirname(dir)) dir = dirname(dir);
    const repo = repoRoot(dir);
    const pkg = repo && packageOf(dir, repo);
    if (!pkg) continue;
    const last = touched.get(pkg);
    if (!last || !(last.at > call.at)) touched.set(pkg, { repo, at: call.at, file });
  }
  const runs = calls.flatMap((call) => commandsIn(call.command, call.cwd).filter((c) => isTestCommand(c.words)).map((c) => ({ ...c, at: call.at })));
  const lines = [];
  for (const [pkg, { repo, at, file }] of [...touched].sort(([a], [b]) => a.localeCompare(b))) {
    const ran = runs.some((run) => run.at > at && testsPackage(run.words, run.dir, pkg, repo));
    lines.push(ran
      ? { text: `${pkg}: a test ran after the last edit`, mark: false }
      : { text: `${pkg}: no test ran after the last edit (${relative(pkg, file)})`, mark: 'open' });
  }
  return lines;
}

function leftByTestRuns(tools, calls) {
  const start = Math.min(...[...tools, ...calls].map((call) => call.at).filter(Number.isFinite));
  const repos = new Set();
  for (const call of calls) {
    for (const { words, dir } of commandsIn(call.command, call.cwd)) {
      const repo = isTestCommand(words) && dir ? repoRoot(dir) : null;
      if (repo) repos.add(repo);
    }
  }
  const lines = [];
  for (const repo of [...repos].sort()) {
    let untracked;
    try { untracked = git(repo, ['ls-files', '--others', '--directory', '--exclude-standard']).split('\n'); } catch { continue; }
    const born = untracked.filter((path) => path.endsWith('/') && bornSince(join(repo, path), start));
    if (born.length === 0) continue;
    lines.push({ text: repo, mark: false });
    for (const path of born) lines.push({ text: `  ${path}`, mark: 'check' });
  }
  return lines;
}

// Birth time where the file system keeps one (APFS, ext4 with statx), else the change time.
function bornSince(path, start) {
  try {
    const { birthtimeMs, ctimeMs } = statSync(path);
    return (birthtimeMs > 0 ? birthtimeMs : ctimeMs) >= start;
  } catch {
    return false;
  }
}

// Under ~/.claude only scratch is clean-up; the rest (plans, memory, settings) are records.
function outsideRepos(path) {
  const claude = join(homedir(), '.claude');
  if (inside(path, claude) && !inside(path, join(claude, 'scratch'))) return false;
  if (!existsSync(path)) return false;
  return repoRoot(dirname(path)) === null;
}

function createdOutsideRepos(tools, calls) {
  const made = new Set();
  for (const call of tools) if (call.name === 'Write' && typeof call.input.file_path === 'string') made.add(expand(call.input.file_path, call.cwd));
  for (const call of calls) {
    for (const { words: [name, ...args], dir } of commandsIn(call.command, call.cwd)) {
      if (name === undefined) continue;
      const operands = (list) => list.filter((w, k) => !w.startsWith('-') && !['-m', '--mode'].includes(list[k - 1]));
      if (basename(name) === 'mkdir') for (const w of operands(args)) made.add(expand(w, dir));
      if (basename(name) === 'git' && args[0] === 'clone') {
        const rest = operands(args.slice(1));
        if (rest.length >= 2) made.add(expand(rest.at(-1), dir));
      }
    }
  }
  const kept = [...made].filter(outsideRepos);
  const tops = kept.filter((path) => !kept.some((other) => other !== path && inside(path, other))).sort();
  const home = homedir();
  const bases = [join(home, '.claude', 'scratch'), '/private/tmp', '/tmp', '/private/var/folders', '/var/folders', home, sep];
  // One line per folder two levels under the first base that holds the path (one level for a path one level deep).
  const folderOf = (path) => {
    const base = bases.find((b) => inside(path, b) && path !== b);
    const parts = relative(base, path).split(sep);
    return join(base, ...parts.slice(0, Math.min(2, parts.length - 1)));
  };
  return [...Map.groupBy(tops, folderOf)].map(([folder, group]) => clip(`${folder}/: ${group.map((path) => relative(folder, path)).join(', ')}`));
}

function planLines(tools) {
  const plansDir = join(homedir(), '.claude', 'plans');
  const plans = new Set();
  for (const call of tools) {
    if (!EDIT_TOOLS.has(call.name) || typeof call.input.file_path !== 'string') continue;
    const file = expand(call.input.file_path, call.cwd);
    if (dirname(file) === plansDir && file.endsWith('.md')) plans.add(file);
  }
  const lines = [];
  for (const plan of plans) {
    if (!existsSync(plan)) {
      lines.push({ text: `${plan} (gone)`, mark: false });
      continue;
    }
    lines.push({ text: plan, mark: false });
    for (const line of readFileSync(plan, 'utf8').split('\n')) {
      const step = line.match(/^(\d+)\.\s+(.*)$/);
      const box = line.match(/^\s*[-*] \[([ xX])\]\s+(.*)$/);
      const plain = (text) => text.replaceAll('**', '');
      if (step) lines.push({ text: `  ${clip(`${step[1]}. ${plain(step[2])}`)}`, mark: 'check' });
      else if (box) lines.push({ text: `  ${clip(`[${box[1] === ' ' ? ' ' : 'x'}] ${plain(box[2])}`)}`, mark: box[1] === ' ' ? 'open' : 'check' });
    }
  }
  return lines;
}

const isCommand = (text) => /^\s*<command-(name|message)>/.test(text);

function typedPrompts(main) {
  return main.filter((e) => e.type === 'user' && e.origin?.kind === 'human')
    .map(entryText).filter((text) => text !== null && !isCommand(text)).map(clip);
}

function invokedSkills(main, tools) {
  const skills = new Map();
  main.forEach((entry, k) => {
    if (entry.type !== 'user' || entry.isMeta) return;
    const name = entryText(entry)?.match(/<command-name>\/?([^<\s]+)<\/command-name>/)?.[1];
    if (!name) return;
    const next = main.slice(k + 1).find((e) => e.type === 'user');
    if (next?.isMeta && /^Base directory for this skill:/.test(entryText(next) ?? '')) skills.set(name, `/${name} (you ran it)`);
  });
  for (const call of tools) {
    if (call.main && call.name === 'Skill' && typeof call.input.skill === 'string' && !skills.has(call.input.skill)) skills.set(call.input.skill, `${call.input.skill} (loaded)`);
  }
  return [...skills].filter(([name]) => name.split(':').at(-1) !== 'housekeeping').map(([, line]) => line);
}

const PROMISE = /\b(I['’]ll|I will|I promise)\b|\bnext,? I\b/i;

// Text the agent wrote after its turn's last tool call: what the user reads at the end of a turn. Narration before a
// tool call ("Next I'll read X") is kept by that call; a promise in the closing text has no call to keep it.
function ownPromises(main) {
  const found = new Set();
  let closing = [];
  const flush = () => {
    for (const text of closing) for (const sentence of text.split(/(?<=[.!?])\s+|\n+/)) if (PROMISE.test(sentence)) found.add(clip(sentence));
    closing = [];
  };
  for (const entry of main) {
    const content = entry.message?.content;
    if (entry.type === 'user' && !(Array.isArray(content) && content.some((b) => b.type === 'tool_result'))) flush();
    if (entry.type !== 'assistant' || !Array.isArray(content)) continue;
    for (const block of content) {
      if (block.type === 'tool_use') closing = [];
      else if (block.type === 'text') closing.push(block.text);
    }
  }
  flush();
  return [...found];
}

function dialogAnswers(tools) {
  return tools.filter((call) => call.main && call.name === 'AskUserQuestion' && call.detail?.answers)
    .flatMap((call) => Object.entries(call.detail.answers).map(([question, answer]) => clip(`answer: ${question} → ${answer}`)));
}

try {
  process.exitCode = main();
} catch (error) {
  if (!(error instanceof UsageError) && error.code !== 'ENOENT' && error.code !== 'EACCES') throw error;
  console.error(`close-check: ${error.message}`);
  process.exitCode = 2;
}
