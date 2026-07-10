# Ezz's Coding Reminders

This is Ezz's global Claude Code and Codex application of
`@deepagents/experimental/coding-agent-reminders`. Both agents execute
`hook.ts` directly with Node — wired by absolute path in
`~/.claude/settings.json` and `~/.codex/hooks.json` — backed by the pinned
`4.3.0` package installed in this directory. It has no runtime dependency on a
project checkout.

```sh
printf '%s' '{"hook_event_name":"UserPromptSubmit","prompt":"Build a custom executor."}' \
  | node hook.ts

npm test
```

`cli.ts` (bin: `explore-agents-md`) is a non-interactive explorer that lists
every CLAUDE.md/AGENTS.md across local project roots; `--json` emits machine
output. The `reminders-curator` skill (../../skills/reminders-curator) uses it
to mine repeated guidance out of those files and encode it here as rules.
