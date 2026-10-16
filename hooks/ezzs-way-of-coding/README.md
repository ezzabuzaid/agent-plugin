# Ezz's Coding Reminders

This is Ezz's global Claude Code and Codex application of
`@deepagents/experimental/coding-agent-reminders`. Both agents execute
`hook.ts` directly with Node — wired by absolute path in
`~/.claude/settings.json` and `~/.codex/hooks.json` — backed by the pinned
`4.3.0` package installed in this directory. It has no runtime dependency on a
project checkout.

Per-turn session harvesting and the shared Claude/Codex coding defaults also
live in this rule set. Both agents use this one repo-owned hook; no separate
`~/.claude/hooks/session-harvest.sh` or `~/.codex/hooks/session-harvest.sh`
copy is required.

```sh
printf '%s' '{"hook_event_name":"UserPromptSubmit","prompt":"Build a custom executor."}' \
  | node hook.ts

npm test
```

The AGENTS.md/CLAUDE.md explorer CLI lives at `../../tools/explore-agents-md/`
(bin: `explore-agents-md`); the `reminders-curator` skill
(../../skills/reminders-curator) runs it to mine repeated guidance out of
those files and encode it here as rules.

Out-of-scope follow-up capture works in every repository with no configuration:
the global `agent-backlog` command stores all repositories' items in one
database at `~/.agent-backlog/backlog.sqlite`. Subagent findings are left for
the root agent to store. The stop audit runs after every third completed
assistant response, captures out-of-scope follow-ups, and removes backlog items
completed or explicitly closed by the conversation. Items are
classified on two axes: `--kind feature|defect|risk|debt` (Unicorn Project
investment categories — what the item is) and `--work-type
business|internal|change|unplanned` (Phoenix Project four types — how the
work entered the system).

The `/wait-what` register outlives the turn that asked for it. The skill behind
that command sets `disable-model-invocation: true`, so no model turn can reload
it and its instruction would otherwise reach one reply only. The
`wait-what-register` rule reads the session transcript instead. It arms once a
user entry carries a `<command-name>` tag naming the command, then restates the
register on every later `UserPromptSubmit`. Entries whose content is an array —
tool results and injected skill bodies — never arm it, so a transcript that only
quotes the skill stays quiet. The transcript is the session state, so a new
session starts with the register off and a resumed session keeps it on.
