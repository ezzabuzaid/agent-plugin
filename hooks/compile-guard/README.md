# Compile guard

In a shared checkout, many sessions build from the same files on disk. A draft that does not compile breaks the build of every other session. This hook refuses the stop of an agent (a session or a subagent) while a TypeScript file that it wrote does not compile. The agent then makes the file compile, or moves the draft to a patch file outside the repo.

## What it checks

At `Stop` and `SubagentStop`, `compile-guard.ts`:

1. Reads the agent's own transcript through [`@deepagents/trajectory`](https://www.npmjs.com/package/@deepagents/trajectory) (pinned in `package.json`): `agent_transcript_path` for a subagent, `transcript_path` for a session. It collects the `.ts`, `.tsx`, `.mts` and `.cts` files of each `Edit`, `Write`, `MultiEdit` and `NotebookEdit` call of the agent's steps. A transcript that is not there yet, or that holds no step, names no file.
2. Keeps the files in a repo whose committed `.claude/settings.json` sets `"env": { "SHARED_CHECKOUT": "1" }`. The repo opts in by its own settings, so no shared file lists repos.
3. Keeps the files that `git status` shows as changed or new. A committed file is not a draft.
4. Runs the repo's own `node_modules/.bin/tsc --noEmit` on the package of each file: the nearest `tsconfig.json`, or each program that a solution-style `tsconfig.json` (`files: []`) references inside the package, such as `tsconfig.lib.json` and `tsconfig.spec.json`. The flags `--composite false --incremental false` keep tsc from reading or writing a `.tsbuildinfo` file.
5. Refuses the stop with `{"decision":"block"}` when an error is in one of the agent's own files. An error in a file that the agent did not write, such as a peer's draft, does not count.

The hook fails open: when it cannot run, it writes the error to stderr and lets the stop go on.

## Limits

- A file that an agent writes through Bash (`sed -i`, a heredoc) is not in the transcript as a write, so the hook does not see it.
- An error that the agent's change causes in a file that it did not write does not count.
- The hook checks only tsc. Lint and format stay with the repo's own hooks.

## Install

The hook reads transcripts through `@deepagents/trajectory`, pinned in `package.json`, so install it first, and again after a pin change; without it the hook cannot load and guards nothing:

```
npm install --prefix hooks/compile-guard
```

Then add this to `~/.claude/settings.json`, with your own path, once for `Stop` and once for `SubagentStop`:

```json
{ "hooks": [{ "type": "command", "command": "node <repo>/hooks/compile-guard/compile-guard.ts", "timeout": 60 }] }
```

Then mark each shared checkout in its own `.claude/settings.json`:

```json
{ "env": { "SHARED_CHECKOUT": "1" } }
```

A session reads its settings when it starts.

## Test

```
npm install --prefix hooks/compile-guard
npm test --prefix hooks/compile-guard
```

The tests use the `tsc` of this folder's `typescript` dev dependency. Set `COMPILE_GUARD_SCRIPT` to run the suite against a scratch copy of the hook.
