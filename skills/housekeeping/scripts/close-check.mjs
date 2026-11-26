#!/usr/bin/env node
// close-check.mjs: the duty list of this session, from its own record, before it may say "done" or "Safe to close."
//
// Usage: node scripts/close-check.mjs [--transcript <path>]
//
// Reads
//   The session's transcript, ~/.claude/projects/*/<CLAUDE_CODE_SESSION_ID>.jsonl, or --transcript <path>,
//   plus every subagent transcript beside it (<id>/subagents/*.jsonl): a subagent's work is the session's work.
//   A command counts by the simple commands the shell runs (lib/session.mjs simpleCommands): text in quotes, heredocs,
//   comments or another command's output never makes one, so a session that reads other sessions' transcripts
//   (grep, node -e) does not take on their pushes, backlog items or test runs.
//
// Each line is one of three kinds. `OPEN <text>`: a machine sees that it is not done. `CHECK <text>`: only the agent
// can say whether it is done, so it marks the line (done, with evidence; or open, with an item or a reason). A line
// with neither is a fact that needs no mark.
//
// Prints, under these headings, then a last line:
//   Pushes       for each Bash call that runs `git push` (or `git -C <path> push`), each range line
//                `<old>..<new>  <src> -> <dst>` in that call's own result; text in any other call's result never makes
//                a push. The repo is the call's `git -C <path>`, else its last `cd <path>`, else its working directory.
//                For each pushed head, the runs of `gh run list --commit <sha> --json name,status,conclusion,url` in
//                that repo. A run that is not completed + success is open. A head with no run yet is printed, not
//                open. A repo directory that no longer exists is open as "repo path not found: <path>", and gh is not
//                called. A head that `git rev-parse` cannot resolve to a commit is open as "cannot resolve <sha> to a
//                commit in <repo>: CI not read", and gh is not called: a short sha matches no run (#5823). "gh not
//                found" (gh is not on PATH) and gh's own error are open: CI was not read.
//   Unpushed     for each repo and branch where the session ran `git commit` (shas from `[<branch> <sha>]` in the
//                result), after `git fetch origin <branch>`, the session's own commits that
//                `origin/<branch>..<branch>` lists. Other sessions' commits in a shared checkout are not listed.
//                A failed fetch (no remote, offline) is open.
//   Ready items  the session's backlog items that it filed or set WITH a condition and that
//                `agent-backlog ready --all-repos --json` lists as ready: the condition is met, so each is a step to
//                take now, and open. An item has a condition when its `agent-backlog add` carries --after, --published,
//                --clean or --until, when the session ran `agent-backlog wait <id>`, or when the session's
//                `agent-backlog met` result names it. A failed agent-backlog call is open.
//   Filed (yours: do it now, or say why it waits)
//                the session's backlog items with no condition (an add without one, an update) that `ready` lists:
//                CHECK each: done now when it is small and in this session's scope, else open with the check that
//                shows why it waits. A filed item is not a reason by itself (the replay of 448389f7: #5629 was filed
//                instead of a two-word fix).
//                The session's items: the id operand of `agent-backlog update|wait <id>`, and each `#<id> · ` card
//                header or JSON top-level "id" (and, when the call runs no list, ready, decisions or explore, each
//                line that starts with `#<id>` or is only `<id>`, as a jq stage prints it; #5834) in the result
//                of a call that runs `agent-backlog add|update|wait|met`
//                (no --help), runs no `agent-backlog show`, and runs no other command but cd, echo, other agent-backlog
//                reads and pipeline stages. The output of list, show, ready, decisions and any other command never
//                adds an id: list, ready and decisions print rows (`#<id>  <title>`), never a card header, so a dedup
//                `list` beside the `add` it guards still counts the add; show prints a card, so a call with show
//                counts no id from its result.
//   Docs of changed packages
//                for each repo where the session committed, each package that its commits touched (the nearest folder
//                with package.json or project.json above each file of `git show --name-only`, inside the repo), the
//                package's README.md, AGENTS.md, CLAUDE.md, CONTEXT.md, GLOSSARY.md, plus the repo's own AGENTS.md
//                and CLAUDE.md, that exist and that no session commit changed: CHECK, one line each, as repo-relative
//                paths. The package's docs/adr folder, when it holds a .md file, is ONE CHECK line, never a line per
//                ADR: `<pkg>/docs/adr (<n> decisions[, <m> changed by this session]): a decision this change overturns
//                gets a status paragraph`. An accepted ADR's text is history and is kept; a changed decision gets a
//                new ADR and a status paragraph on the old one (zukhruf docs/writing-package-docs.md, after Nygard).
//                The line stays when a session commit changed some of its ADRs, and says how many. A commit that git
//                cannot show is open.
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
//   Requests     each prompt the user typed (main transcript, origin human, not a slash command), first 160
//                characters: CHECK.
//   Skills       each skill the user ran as a `/command` and each skill the agent loaded with the Skill tool (main
//                transcript), once by name, but housekeeping itself: CHECK (its closing report given).
//   Promises     each sentence with "I'll", "I will", "I promise" or "next I" in the agent's closing text of a turn
//                (main transcript, text after the turn's last tool call, before the next prompt that is not a tool
//                result), and each answer the user gave to the agent's AskUserQuestion: CHECK. Text before a tool call
//                is narration of that call, not a promise.
//   last line    `Nothing open.` or `Open: <n>`, then ` To mark: <m>` when there are CHECK lines.
//
// Not printed: background work that still runs (subagents, background shells, watches). A script cannot see the
// harness's task list; the skill takes it from ListAgents and the Stop reminder.
//
// Exit codes: 0 nothing open, 1 something open, 2 usage or transcript read error.
// Commands it runs: git (rev-parse, fetch, rev-list, log, show), gh, agent-backlog. Fetch is its only write.
import { parseArgs } from 'node:util';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, join, relative, sep } from 'node:path';
import { UsageError, transcriptFiles, toolCalls, bashCalls, entries, entryText, simpleCommands, commandWords, commandsIn, gitDirectory, repoRoot, sessionCommits, git, firstLine, expand } from './lib/session.mjs';

function main() {
  let options;
  try {
    ({ values: options } = parseArgs({ options: { transcript: { type: 'string' } } }));
  } catch (error) {
    throw new UsageError(error.message);
  }
  const files = transcriptFiles(options.transcript);
  const tools = toolCalls(files);
  const calls = bashCalls(files);
  let open = 0;
  let toMark = 0;
  // mark: true or 'open' → OPEN, 'check' → CHECK, false → a fact.
  const say = (line, mark = false) => {
    const kind = mark === true || mark === 'open' ? 'OPEN ' : mark === 'check' ? 'CHECK ' : '';
    if (kind === 'OPEN ') open++;
    if (kind === 'CHECK ') toMark++;
    const [, indent, text] = line.match(/^(\s*)(.*)$/s);
    console.log(`  ${indent}${kind}${text}`);
  };
  const none = (list) => { if (list.length === 0) say('none'); };

  console.log('Pushes');
  const pushes = pushedHeads(calls);
  if (pushes.length === 0) say('none');
  for (const push of pushes) {
    say(`${push.repo} ${push.ref} ${push.unresolved ?? push.sha.slice(0, 12)}`);
    if (!existsSync(push.repo)) {
      say(`  repo path not found: ${push.repo}`, true);
      continue;
    }
    if (push.unresolved) {
      say(`  cannot resolve ${push.unresolved} to a commit in ${push.repo}: CI not read`, true);
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
  const commits = sessionRepoCommits(calls);
  const before = open;
  for (const [key, group] of Map.groupBy(commits,(commit) => `${commit.repo}\0${commit.branch}`)) {
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
  console.log('Filed (yours: do it now, or say why it waits)');
  if (followUps.length === 0) say('none');
  for (const item of followUps) say(`#${item.id} ${item.title} (${item.repositoryName})`, 'check');

  console.log('Docs of changed packages');
  const docs = changedPackageDocs(commits);
  none(docs);
  for (const line of docs) say(line.text, line.mark);

  console.log('Tests of touched packages');
  const tested = untestedPackages(tools, calls);
  none(tested);
  for (const line of tested) say(line.text, line.mark);

  console.log('Created outside repos');
  const created = createdOutsideRepos(tools, calls);
  none(created);
  for (const line of created) say(line, 'check');

  console.log('Left by test runs');
  const left = leftByTestRuns(tools, calls);
  none(left);
  for (const line of left) say(line.text, line.mark);

  console.log('Plans');
  const plans = planLines(tools);
  none(plans);
  for (const line of plans) say(line.text, line.mark);

  const main = [...entries(files[0])];
  console.log('Requests');
  const requests = typedPrompts(main);
  none(requests);
  for (const text of requests) say(text, 'check');

  console.log('Skills');
  const skills = invokedSkills(main, tools);
  none(skills);
  for (const text of skills) say(text, 'check');

  console.log('Promises');
  const promises = [...ownPromises(main), ...dialogAnswers(tools)];
  none(promises);
  for (const text of promises) say(text, 'check');

  console.log(`${open === 0 ? 'Nothing open.' : `Open: ${open}`}${toMark > 0 ? ` To mark: ${toMark}` : ''}`);
  return open === 0 ? 0 : 1;
}

// The session's commits whose repo still exists, each with its repo top.
function sessionRepoCommits(calls) {
  return sessionCommits(calls).flatMap((commit) => {
    const repo = repoRoot(commit.dir);
    return repo ? [{ ...commit, repo }] : [];
  });
}

const clip = (text) => {
  const line = text.replace(/\s+/g, ' ').trim();
  return line.length > 160 ? `${line.slice(0, 159)}…` : line;
};
const inside = (path, dir) => path === dir || path.startsWith(dir.endsWith(sep) ? dir : dir + sep);

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

// One entry per repo and pushed head, from `<old>..<new>  <src> -> <dst>` (or `...` for a forced update).
function pushedHeads(calls) {
  const heads = new Map();
  for (const call of calls) {
    const dir = gitDirectory(call.command, 'push', call.cwd);
    if (!dir) continue;
    const repo = repoRoot(dir) ?? dir;
    for (const m of call.result.matchAll(/^\s*[+ ]?\s*([0-9a-f]{7,40})\.\.\.?([0-9a-f]{7,40})\s+(\S+)\s+->\s+(\S+)/gm)) {
      // An unresolved head keeps only its short sha: gh run list --commit <short sha> matches no run (#5823).
      let head;
      try { head = { repo, ref: m[4], sha: git(repo, ['rev-parse', `${m[2]}^{commit}`]).trim() }; } catch { head = { repo, ref: m[4], unresolved: m[2] }; }
      heads.set(`${repo}\0${head.sha ?? head.unresolved}`, head);
    }
  }
  return [...heads.values()];
}

const BACKLOG_WRITES = new Set(['add', 'update', 'wait', 'met']);
// Reads that print item rows (`#<id>  <title>`), which a reshaped add id must not be confused with.
const ROW_READS = new Set(['list', 'ready', 'decisions', 'explore']);
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
    // With no list read in the call, a line that a pipeline stage reshaped is the add's own id (#5834):
    // `#<id> <title>` from jq -r '"#\(.id) \(.title)"', or a bare `<id>` from jq -r .id.
    const readsRows = backlog.some(({ words }) => ROW_READS.has(words[1]));
    const ids = readsRows ? /#(\d+) · |^ {2}"id": (\d+)/gm : /#(\d+) · |^ {2}"id": (\d+)|^#(\d+)\b|^(\d+)$/gm;
    const found = [...call.result.matchAll(ids)].map((m) => Number(m[1] ?? m[2] ?? m[3] ?? m[4]));
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
