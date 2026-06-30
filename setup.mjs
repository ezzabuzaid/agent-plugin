#!/usr/bin/env node
// Full setup for the agent-plugin marketplace repo: git init → commit → create GitHub
// repo → push. Idempotent: safe to re-run; skips steps already done.
//
// Usage:
//   node setup.mjs            # create a PUBLIC repo (default)
//   node setup.mjs --private  # create a PRIVATE repo
//
// Requires: git, and gh authenticated (`gh auth status`).

import { execFileSync } from 'node:child_process';

const repo = import.meta.dirname;
const SLUG = 'ezzabuzaid/agent-plugin';
const visibility = process.argv.includes('--private') ? '--private' : '--public';

const run = (cmd, args) => execFileSync(cmd, args, { cwd: repo, stdio: 'inherit' });
const out = (cmd, args) => execFileSync(cmd, args, { cwd: repo, encoding: 'utf8' }).trim();
const ok = (cmd, args) => {
  try {
    execFileSync(cmd, args, { cwd: repo, stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
};
const step = (msg) => console.log(`\n▶ ${msg}`);

// 0. Preconditions
if (!ok('git', ['--version'])) throw new Error('git not found on PATH');
if (!ok('gh', ['--version'])) throw new Error('gh (GitHub CLI) not found on PATH');
if (!ok('gh', ['auth', 'status'])) throw new Error('gh is not authenticated — run `gh auth login`');

// 1. git init
if (!ok('git', ['rev-parse', '--is-inside-work-tree'])) {
  step('git init (branch: main)');
  run('git', ['init', '-b', 'main']);
} else {
  step('git repo already initialized — skipping init');
}

// 2. stage + commit (only if there is nothing committed yet, or there are changes)
run('git', ['add', '-A']);
const hasHead = ok('git', ['rev-parse', '--verify', 'HEAD']);
const hasStaged = !ok('git', ['diff', '--cached', '--quiet']); // non-zero exit = staged changes exist
if (!hasHead || hasStaged) {
  step('commit');
  run('git', ['commit', '-m', 'feat: add progressive-guardrails plugin marketplace']);
} else {
  step('nothing to commit — skipping');
}

// 3. create the GitHub repo + push (skip if origin already wired)
if (ok('git', ['remote', 'get-url', 'origin'])) {
  step(`origin already set (${out('git', ['remote', 'get-url', 'origin'])}) — pushing`);
  run('git', ['push', '-u', 'origin', 'main']);
} else if (ok('gh', ['repo', 'view', SLUG])) {
  step(`GitHub repo ${SLUG} already exists — wiring origin + pushing`);
  run('git', ['remote', 'add', 'origin', `https://github.com/${SLUG}.git`]);
  run('git', ['push', '-u', 'origin', 'main']);
} else {
  step(`creating ${visibility.slice(2)} GitHub repo ${SLUG} + pushing`);
  run('gh', ['repo', 'create', SLUG, visibility, '--source=.', '--remote=origin', '--push']);
}

const isPrivate = visibility === '--private';
console.log(`
✓ Done. ${SLUG} is live.

Others install with:
  /plugin marketplace add ${isPrivate ? `git@github.com:${SLUG}.git` : SLUG}
  /plugin install coding@ezzabuzaid
  → /output-style → Progressive Guardrails
`);
