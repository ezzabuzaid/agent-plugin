# Where a violation lives → tool

Each row gives a place where a violation lives, the tool that can see it there, how to find what the repo already configures, and how to prove that the check fires. Confirm every name in the tool's own docs before you use it.

## In the code

| Where it lives | Tool | How to find what is configured | How to prove it fires |
| --- | --- | --- | --- |
| Types | TypeScript types and `tsconfig` flags | `tsc --showConfig` prints the resolved config | A probe file that breaks the rule fails the typecheck |
| Code shape | ESLint rule: core, plugin or custom | The rule lists of the installed plugins; `eslint --print-config <file>` prints the rules that apply to a file | A probe file fails `eslint`; good code passes |
| Code shape that needs types | Typed ESLint rule (typescript-eslint with type information) | `eslint --print-config <file>`; the parser options that point at a tsconfig | Same as code shape |
| Formatting | Formatter, for example Prettier | The formatter config and its ignore file | `prettier --check` fails on a probe file |
| Imports between projects | Module-boundary rules: `@nx/enforce-module-boundaries`, `@nx/dependency-checks`, dependency-cruiser | The ESLint config, the project tags, the dependency-cruiser config | A probe import across a forbidden boundary fails lint |
| Workspace files (package.json, tsconfig references, lockfile) | ESLint on JSON files; Nx sync generators with `nx sync:check`; `npm ci` | The ESLint config for `*.json`; `nx.json` sync settings | A probe edit that breaks the rule fails the check |
| Behavior | A test. A test of structure is an architectural _fitness function_ (Ford, Parsons, Kua, _Building Evolutionary Architectures_) | The test target and the existing tests | The test fails when you break the behavior on purpose |
| Values at a boundary | Runtime schema, for example zod | The schemas at the boundary | A bad payload throws; a good payload parses |
| Prose | Vale, a prose linter with rules in YAML | `.vale.ini` and its styles folder | `vale` reports the probe sentence |
| Shell, CI workflows, Dockerfiles, infra | shellcheck, actionlint, hadolint; infra policy as code (Pulumi CrossGuard, OPA) | Each tool's config file; the policy packs | The tool reports a probe file |

## Around the code

| Where it lives | Tool | How to find what is configured | How to prove it fires |
| --- | --- | --- | --- |
| The commit that someone makes | pre-commit hook. It checks files. It never rewrites files that the commit does not own | `.husky/`, `git config core.hooksPath`, a hook manager config | A probe commit is refused |
| The commit message | commit-msg hook: commitlint or a repo script | The hook folder; the commitlint config | A probe message is refused |
| The push | pre-push hook | The hook folder | A probe push is refused |
| Every change | CI step | `.github/workflows/`; the task-runner targets and their `dependsOn` | The step runs on the event that matters (pull request, push to main) and fails on a probe |
| A check that reads the network or a registry | Its own uncached CI step. A cache hides a changed input | The cache settings of the task runner | The step runs again when only the remote input changes |
| The remote repo | Repository rulesets, branch and tag protection, secret-scanning push protection | The repo settings or the API for rulesets | A probe push or merge is refused |

## The agent

These rows are for Claude Code. Another agent has its own equivalents. To write hooks and permission rules in Claude Code settings, use the `update-config` skill. To measure whether an agent check is exact, replay past commands from the session transcripts (JSONL files under `~/.claude/projects/`) and count the hits on good commands.

| Where it lives | Tool | How to find what is configured | How to prove it fires |
| --- | --- | --- | --- |
| A command, by its first words | Permission `deny` rule, for example `Bash(git stash *)`, in `settings.json` (user, project or local scope) | `~/.claude/settings.json`, `.claude/settings.json`, `.claude/settings.local.json` | The agent cannot run a probe command |
| A command, by its content | PreToolUse hook. Exit code 2 blocks the call; so does exit 0 with JSON `hookSpecificOutput.permissionDecision: "deny"` (the top-level `decision: "block"` is deprecated for PreToolUse). Any other failure is a non-blocking error, so a guard that crashes or times out lets the call through. Catch errors and exit 2, or set `"onFailure": "block"` on the hook (fail closed) | The `hooks` key in each settings file; the hooks of installed plugins | A probe command is blocked; a command that crashes the guard is also blocked |
| A file that the agent edits | `deny` rule on `Edit(path)`. It covers every built-in tool that edits files, the file commands that Claude Code recognizes in Bash (`cat`, `head`, `tail`, `sed`, `tee`) and the targets of redirections. A `Write(path)` rule never matches. Paths use gitignore syntax: `//path` from the filesystem root, `~/path` from home. A single leading `/` anchors at the settings source (in user settings, at `~/.claude/`), not at the root. It does not cover a command that opens files without naming them, such as a script; that stays a remainder (or use the sandbox) | The `permissions` key in each settings file | A probe edit is refused |
| A step that must come before an action | PreToolUse hook that reads the session transcript (`transcript_path` in the hook input). The transcript can lag the current turn | The `hooks` key in each settings file | The action is blocked before the step and passes after it |
| The end of a turn | Stop hook | The `hooks` key in each settings file | The hook fires on a probe turn |
| What a subagent can use | The `tools:` list in the agent file | The frontmatter of the agent file | The subagent cannot call a tool that is not in the list |
| What the agent is told | SessionStart or UserPromptSubmit reminder. It gives the rule every time, but the model still decides. This is rung 4, not a check | The hooks that add context | — |
| Nothing a machine can see | Memory, instructions or a skill. Return the rule to the caller | — | — |
