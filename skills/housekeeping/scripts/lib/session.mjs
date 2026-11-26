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

// Every tool call with its input, result text, the result's structured detail (toolUseResult), working directory,
// time (ms since the epoch, NaN when the entry has none) and whether it is in the main transcript, in transcript order.
export function toolCalls(files) {
  const calls = [];
  files.forEach((file, index) => {
    const pending = new Map();
    for (const entry of entries(file)) {
      const content = entry.message?.content;
      if (!Array.isArray(content)) continue;
      if (entry.type === 'assistant') {
        for (const b of content) if (b.type === 'tool_use') {
          pending.set(b.id, { name: b.name, input: b.input ?? {}, cwd: entry.cwd, at: Date.parse(entry.timestamp), main: index === 0 });
        }
      } else if (entry.type === 'user') {
        for (const r of content) if (r.type === 'tool_result' && pending.has(r.tool_use_id)) {
          const call = pending.get(r.tool_use_id);
          calls.push({ ...call, cwd: call.cwd ?? entry.cwd, result: resultText(r), detail: entry.toolUseResult });
        }
      }
    }
  });
  return calls;
}

// Every Bash call with its result text and working directory, in transcript order.
export function bashCalls(files) {
  return toolCalls(files)
    .filter((call) => call.name === 'Bash' && typeof call.input.command === 'string')
    .map(({ input, cwd, at, main, result }) => ({ command: input.command, cwd, at, main, result }));
}

// The parsed JSONL entries of one transcript; a line that is not JSON is skipped.
export function* entries(file) {
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try { yield JSON.parse(line); } catch { /* a torn last line */ }
  }
}

// The text of a user or assistant entry: a string content, or its text blocks; null when it has a block of another kind.
export function entryText(entry) {
  const content = entry.message?.content;
  if (typeof content === 'string') return content;
  if (!Array.isArray(content) || !content.every((b) => b.type === 'text')) return null;
  return content.map((b) => b.text).join('');
}

// Where `text` next occurs at or after `from`, or the end of the line when it does not (an unclosed quote runs to the end).
const indexOrEnd = (line, text, from) => {
  const at = line.indexOf(text, from);
  return at < 0 ? line.length : at;
};

export const expand = (p, cwd) => (p === '~' ? homedir() : resolve(cwd ?? process.cwd(), p.startsWith('~/') ? join(homedir(), p.slice(2)) : p));

// The simple commands of a shell command line, in the order bash runs them. Each is its words, quotes removed, with
// redirections dropped, plus `link`: the operator before it (';' for a newline, '&&', '||', '|', '|&', '&'), null for
// the first. Heredoc bodies, comments, and quoted, $( ) and backtick text are never commands, so `grep 'git push'`,
// `node -e '…git push…'` and `cat <<EOF … git push … EOF` run no git.
export function simpleCommands(line) {
  const commands = [];
  const heredocs = [];
  let words = [];
  let word = null;
  let link = null;
  let target = null; // null, 'file' (the next word is a redirection target) or a heredoc kind ('<<' or '<<-')
  let i = 0;
  const endWord = () => {
    if (word === null) return;
    if (target === null) words.push(word);
    else if (target !== 'file') heredocs.push({ delimiter: word, tabs: target === '<<-' });
    target = null;
    word = null;
  };
  const endCommand = (next) => {
    endWord();
    if (words.length) commands.push({ words, link });
    words = [];
    link = next;
  };
  while (i < line.length) {
    const c = line[i];
    if (c === '\n') {
      endCommand(';');
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
      const op = operator[0];
      endCommand(op === '(' || op === ')' || op === ';;' ? ';' : op);
      i += op.length;
      continue;
    }
    word = (word ?? '') + c;
    i++;
  }
  endCommand(null);
  return commands;
}

const LEADING = new Set(['if', 'then', 'else', 'elif', 'do', 'while', 'until', '!', '{', '}', 'time', 'fi', 'done', 'command', 'nohup', 'env']);

// A simple command's words from the program on: reserved words, `env`-like wrappers and `NAME=value` dropped.
export function commandWords(words) {
  let k = 0;
  while (k < words.length && (LEADING.has(words[k]) || /^[A-Za-z_]\w*=/.test(words[k]))) k++;
  return words.slice(k);
}

// The simple commands of a line (words from the program on, see commandWords), each with the directory it runs in:
// the call's cwd, changed by each `cd <path>` before it (`cd -` is not followed).
export function commandsIn(command, cwd) {
  let dir = cwd;
  const commands = [];
  for (const { words, link } of simpleCommands(command)) {
    const program = commandWords(words);
    if (program[0] === 'cd' && program[1] !== '-') dir = expand(program[1] ?? '~', dir);
    commands.push({ words: program, link, dir });
  }
  return commands;
}

// The directory a git subcommand ran in, or null when no simple command of the line runs `git <subcommand>`:
// its `git -C <path>`, else the last `cd <path>` before it, else the call's cwd.
export function gitDirectory(command, subcommand, cwd) {
  for (const { words: [name, ...args], dir } of commandsIn(command, cwd)) {
    if (name === undefined || basename(name) !== 'git') continue;
    let at = dir;
    let k = 0;
    for (; k < args.length && args[k].startsWith('-'); k++) {
      if (args[k] === '-C') at = expand(args[++k] ?? '.', at);
      else if (args[k] === '-c') k++;
    }
    if (args[k] === subcommand) return at;
  }
  return null;
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
