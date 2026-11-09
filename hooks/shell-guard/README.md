# Shell guard

An agent runs its Bash and Monitor commands in zsh. This folder holds the rules for those commands as code. A rule that stays only in a note works only when an agent reads and obeys it.

| File | What it does |
|---|---|
| `agent-shell.zsh` | Sets zsh options before each command, through `CLAUDE_ENV_FILE`. These options remove three traps: word splitting, unmatched globs and `=word`. |
| `block-git-mutation.ts` | The PreToolUse hook. It refuses a git command that changes history, refs or the shared index, and it calls the shell checks. |
| `shell-traps.ts` | The shell checks. Each one refuses one type of bad command, and its message gives the fix. |
| `shell-lex.ts` | Reads shell text. The hook and the checks both use it. |

## Install

Add these to `~/.claude/settings.json`, with your own path:

```json
{
  "env": { "CLAUDE_ENV_FILE": "<repo>/hooks/shell-guard/agent-shell.zsh" },
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash|Monitor",
        "hooks": [{ "type": "command", "command": "node <repo>/hooks/shell-guard/block-git-mutation.ts", "timeout": 5 }]
      }
    ]
  }
}
```

A session reads these settings when it starts. A running session keeps its old hook path and its old options until it restarts. If you move this folder, leave a symlink at the old path until those sessions end. If the hook file is missing, the hook exits with a code other than 2, and the command runs with no guard.

## Failure modes

- If `shell-traps.ts` cannot load or run, the hook logs the error and continues. The git guard stays on.
- If `shell-lex.ts` cannot load, the hook exits with code 2, so it refuses every command. The git guard cannot read a command without this file.

## Add a check

1. Write the violation as a real command, and find it in your own transcripts.
2. Add the check to `shell-traps.ts`, and add its test to `shell-traps.test.ts`.
3. Have an agent that did not write the check judge a random sample of its hits. That agent must not see your reasoning.
4. Run the tests against a scratch copy with `GIT_GUARD_SCRIPT`, because every live session runs these files.

A check must see the violation in the command text. For example, a background run that does not keep its exit code has no check, because the agent can still see a failure in what the command prints.

## Test

```
node --test hooks/shell-guard/shell-traps.test.ts hooks/shell-guard/block-git-mutation.test.ts
```
