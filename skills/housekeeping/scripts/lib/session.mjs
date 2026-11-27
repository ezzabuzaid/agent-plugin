// Reads what this session did from its Claude Code transcripts and its session ledger. Shared by close-check.mjs and
// records-check.mjs; their header comments hold the contract. The transcripts are read through @deepagents/trajectory
// (its README maps each Claude Code entry to an ATIF step), pinned in ../../package.json.
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ClaudeCodeAdapter, ClaudeCodeSession, ClaudeCodeStore, SessionReadError } from '@deepagents/trajectory';

export class UsageError extends Error {}

// The session: its own id plus every id it was derived from. After a /clear, Claude Code starts a new transcript whose
// `derived-from` entry names the old id, and the new context gets a new CLAUDE_CODE_SESSION_ID, while subagents started
// before the clear keep the old one; ClaudeCodeStore.chain follows those entries, to `<id>.jsonl` beside the transcript
// that names an id, else under ~/.claude/projects/*/. Returns the ids (the session's own first, then each older one),
// the ATIF trajectory of each id found, oldest session first, each with its subagents' trajectories
// (<id>/subagents/agent-*.jsonl) when `subagents` is true, the ids whose transcript is not found, and when each found id
// began: the time of its first step that has one (NaN when none has). A transcript that cannot be read throws
// SessionReadError, a subagent's too: its calls are the session's work.
export async function sessionChain(transcriptOption, { subagents }) {
  const store = new ClaudeCodeStore({ root: join(homedir(), '.claude') });
  let session;
  if (transcriptOption) {
    session = ClaudeCodeSession.fromTranscriptPath(transcriptOption);
  } else {
    const id = process.env.CLAUDE_CODE_SESSION_ID;
    if (!id) throw new UsageError('no session: CLAUDE_CODE_SESSION_ID is not set and no --transcript was given');
    session = await store.session(id);
    if (!session) throw new UsageError(`no transcript for session ${id} under ${join(homedir(), '.claude', 'projects')}`);
  }
  const { sessions, missing } = await store.chain(session);
  const adapter = new ClaudeCodeAdapter();
  const trajectories = [];
  for (const segment of sessions) {
    const { trajectory, diagnostics } = await adapter.read(segment, { subagents });
    const unreadable = diagnostics.find((diagnostic) => diagnostic.code === 'unreadable_subagent');
    if (unreadable) throw new SessionReadError(unreadable.path, 'could not read the subagent transcript');
    trajectories.push(trajectory);
  }
  const started = new Map(sessions.map(({ sessionId }, k) => [sessionId, Date.parse(trajectories[k].steps.find((step) => step.timestamp)?.timestamp)]));
  return { ids: [...sessions.map(({ sessionId }) => sessionId).toReversed(), ...missing], trajectories, missing, started };
}

// Every tool call that has its result, in transcript order: its name, input, the result's structured detail
// (toolUseResult), working directory, whether it is in a main transcript, and two times in ms since the epoch (NaN
// when the entry has none): `at`, when the agent's message that holds it began, and `done`, when its result came back.
// The calls of one message share `at`; Claude Code runs them one after another, so `done` orders them.
export function toolCalls(trajectories) {
  const calls = [];
  for (const trajectory of trajectories) {
    const transcripts = [{ steps: trajectory.steps, main: true }, ...(trajectory.subagent_trajectories ?? []).map(({ steps }) => ({ steps, main: false }))];
    for (const { steps, main } of transcripts) {
      for (const step of steps) {
        for (const call of step.tool_calls ?? []) {
          const result = step.observation?.results.find((r) => r.source_call_id === call.tool_call_id);
          if (!result) continue;
          const back = result.extra.claude_code;
          calls.push({ name: call.function_name, input: call.arguments, cwd: step.extra.claude_code.cwd, at: Date.parse(step.timestamp), done: Date.parse(back.timestamp), main, detail: back.tool_use_result });
        }
      }
    }
  }
  return calls;
}

// Every Bash call of `calls` (a toolCalls result) with its working directory and times, in transcript order.
export function bashCalls(calls) {
  return calls
    .filter((call) => call.name === 'Bash' && typeof call.input.command === 'string')
    .map(({ input, cwd, at, done }) => ({ command: input.command, cwd, at, done }));
}

// Where `text` next occurs at or after `from`, or the end of the line when it does not (an unclosed quote runs to the end).
const indexOrEnd = (line, text, from) => {
  const at = line.indexOf(text, from);
  return at < 0 ? line.length : at;
};

export const expand = (p, cwd) => (p === '~' ? homedir() : resolve(cwd ?? process.cwd(), p.startsWith('~/') ? join(homedir(), p.slice(2)) : p));

// The simple commands of a shell command line, in the order bash runs them. Each is its words, quotes removed, with
// redirections dropped. Heredoc bodies, comments, and quoted, $( ) and backtick text are never commands, so
// `grep 'npm test'`, `node -e '…mkdir…'` and `cat <<EOF … mkdir … EOF` run nothing.
function simpleCommands(line) {
  const commands = [];
  const heredocs = [];
  let words = [];
  let word = null;
  let target = null; // null, 'file' (the next word is a redirection target) or a heredoc kind ('<<' or '<<-')
  let i = 0;
  const endWord = () => {
    if (word === null) return;
    if (target === null) words.push(word);
    else if (target !== 'file') heredocs.push({ delimiter: word, tabs: target === '<<-' });
    target = null;
    word = null;
  };
  const endCommand = () => {
    endWord();
    if (words.length) commands.push(words);
    words = [];
  };
  while (i < line.length) {
    const c = line[i];
    if (c === '\n') {
      endCommand();
      i++;
      for (const { delimiter, tabs } of heredocs.splice(0)) {
        while (i < line.length) {
          const end = indexOrEnd(line, '\n', i);
          const body = line.slice(i, end);
          i = end + 1;
          if ((tabs ? body.replace(/^\t+/, '') : body) === delimiter) break;
        }
      }
      continue;
    }
    if (c === ' ' || c === '\t') { endWord(); i++; continue; }
    if (c === '#' && word === null) { while (i < line.length && line[i] !== '\n') i++; continue; }
    if (c === '\\') {
      if (line[i + 1] !== '\n') word = (word ?? '') + (line[i + 1] ?? '');
      i += 2;
      continue;
    }
    if (c === "'") {
      const end = indexOrEnd(line, "'", i + 1);
      word = (word ?? '') + line.slice(i + 1, end);
      i = end + 1;
      continue;
    }
    if (c === '"') {
      let text = '';
      for (i++; i < line.length && line[i] !== '"'; i++) {
        if (line[i] === '\\' && '"\\$`\n'.includes(line[i + 1] ?? '')) { if (line[i + 1] !== '\n') text += line[i + 1]; i++; }
        else text += line[i];
      }
      word = (word ?? '') + text;
      i++;
      continue;
    }
    if (c === '$' && line[i + 1] === '(') {
      let depth = 0;
      let j = i + 1;
      for (; j < line.length; j++) {
        if (line[j] === '(') depth++;
        else if (line[j] === ')' && --depth === 0) break;
      }
      word = (word ?? '') + line.slice(i, j + 1);
      i = j + 1;
      continue;
    }
    if (c === '`') {
      const end = indexOrEnd(line, '`', i + 1);
      word = (word ?? '') + line.slice(i, end + 1);
      i = end + 1;
      continue;
    }
    const redirect = line.slice(i).match(/^(?:&>>?|<<<|<<-|<<|>>|[<>]&[0-9-]|>\||<>|<|>)/);
    if (redirect) {
      if (word !== null && /^\d+$/.test(word)) word = null; // the fd of `2>`
      else endWord();
      const op = redirect[0];
      target = /^[<>]&[0-9-]$/.test(op) ? null : op === '<<' || op === '<<-' ? op : 'file';
      i += op.length;
      continue;
    }
    const operator = line.slice(i).match(/^(?:&&|\|\||\|&|;;|[|;&()])/);
    if (operator) {
      endCommand();
      i += operator[0].length;
      continue;
    }
    word = (word ?? '') + c;
    i++;
  }
  endCommand();
  return commands;
}

const LEADING = new Set(['if', 'then', 'else', 'elif', 'do', 'while', 'until', '!', '{', '}', 'time', 'fi', 'done', 'command', 'nohup', 'env']);

// A simple command's words from the program on: reserved words, `env`-like wrappers and `NAME=value` dropped.
function commandWords(words) {
  let k = 0;
  while (k < words.length && (LEADING.has(words[k]) || /^[A-Za-z_]\w*=/.test(words[k]))) k++;
  return words.slice(k);
}

// The simple commands of a line (words from the program on, see commandWords), each with the directory it runs in:
// the call's cwd, changed by each `cd <path>` before it (`cd -` is not followed).
export function commandsIn(command, cwd) {
  let dir = cwd;
  const commands = [];
  for (const words of simpleCommands(command)) {
    const program = commandWords(words);
    if (program[0] === 'cd' && program[1] !== '-') dir = expand(program[1] ?? '~', dir);
    commands.push({ words: program, dir });
  }
  return commands;
}

// The top of the repo that holds dir, or null when dir is no repo (or is gone).
export function repoRoot(dir) {
  try {
    return execFileSync('git', ['-C', dir, 'rev-parse', '--show-toplevel'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
}

export function git(dir, args) {
  return execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

export const firstLine = (error) => String(error.stderr || error.message).trim().split('\n')[0];

// The commits and pushes of the session (a sessionChain result), from the session ledger that git's own hooks write
// when they happen (agent-plugin hooks/session-ledger/README.md): `~/.claude/ledger/<id>.jsonl`, one JSON line per fact.
// Commits are the `kind: "commit"` lines ({ repo, sha, ref }, ref null on a detached HEAD); pushes are the `kind: "ref"`
// lines with `by: "push"` ({ repo, remote and branch of refs/remotes/<remote>/<branch>, sha: new }), each once per repo
// and sha, in ledger order.
// Coverage comes from the ledger's own record. The ledger records every commit and push of a session that began after
// `~/.claude/ledger/installed-at` (one ISO 8601 UTC line, written by its install.sh), while both of its hooks stay
// registered. Without that line (or with one that is no time), or without either hook, nothing says what was recorded:
// null. Else `uncovered` holds each found id of the chain that began before installed-at, or at no known time, as
// { id, started }: its commits and pushes before installed-at were not read. An id whose transcript is not found is
// not judged here (the caller already reports it). Any other id with no ledger file made no commit and no push.
export function sessionLedger({ ids, missing, started }) {
  const installedAt = ledgerInstalledAt();
  if (installedAt === null) return null;
  const lines = [];
  for (const id of ids) {
    let text;
    try {
      text = readFileSync(join(homedir(), '.claude', 'ledger', `${id}.jsonl`), 'utf8');
    } catch (error) {
      if (error.code === 'ENOENT') continue;
      throw error;
    }
    for (const line of text.split('\n')) {
      if (!line.trim()) continue;
      try { lines.push(JSON.parse(line)); } catch { /* a torn last line */ }
    }
  }
  const once = (list, key) => [...new Map(list.map((fact) => [key(fact), fact])).values()];
  const commits = once(lines.filter((l) => l.kind === 'commit').map(({ repo, sha, ref }) => ({ repo, sha, ref })), (c) => `${c.repo}\0${c.sha}`);
  const pushes = once(
    lines.filter((l) => l.kind === 'ref' && l.by === 'push').map(({ repo, ref, new: sha }) => ({ repo, remote: ref.split('/')[2], branch: ref.split('/').slice(3).join('/'), sha })),
    (p) => `${p.repo}\0${p.sha}`,
  );
  const uncovered = ids.filter((id) => !missing.includes(id) && !(started.get(id) >= installedAt)).map((id) => ({ id, started: started.get(id) }));
  return { commits, pushes, uncovered, installedAt };
}

// installed-at as ms since the epoch, or null when the marker is missing or is no time, or a hook key is missing.
function ledgerInstalledAt() {
  let marker;
  try {
    marker = readFileSync(join(homedir(), '.claude', 'ledger', 'installed-at'), 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
  const at = Date.parse(marker.trim());
  if (Number.isNaN(at)) return null;
  // A predicting check: whether git runs the hooks can be learned only from a commit or a push the session makes, and
  // a check must not make one. So this reads git's config: the two keys the ledger's install.sh registers.
  const registered = ['hook.session-ledger-commit.command', 'hook.session-ledger-ref.command'].every((key) => {
    try {
      execFileSync('git', ['config', '--global', '--get', key], { stdio: 'ignore' });
      return true;
    } catch (error) {
      if (error.status === 1) return false; // git config: the key is not set
      throw error;
    }
  });
  return registered ? at : null;
}

const INSTALL = fileURLToPath(new URL('../../../../hooks/session-ledger/install.sh', import.meta.url));
export const NO_LEDGER = `session ledger not installed (no ~/.claude/ledger/installed-at, or hook.session-ledger-commit.command or hook.session-ledger-ref.command not in git's global config): the commits and pushes of this session were not read; install it: sh ${INSTALL}`;
const iso = (ms) => (Number.isNaN(ms) ? 'at no known time' : new Date(ms).toISOString());
// The line names the step it owes: with no ledger lines to list them, the agent lists those commits itself.
export const uncoveredLine = ({ id, started }, installedAt) => {
  const since = Number.isNaN(started) ? '' : ` --since=${iso(started)}`;
  return `${id} began ${iso(started)}, before the session ledger was installed (${iso(installedAt)}): its commits and pushes before then were not read; list them with git log${since} in each repo it worked in, check each is pushed and its CI read, and review each (SKILL.md Finish)`;
};
