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
copy is required. The session harvest names the memory paths of the agent that
runs it. A Codex transcript starts with a `session_meta` entry, so a Codex
session gets the Codex ad-hoc memory note path. Any other transcript gets the
Claude auto-memory and skill-reflection paths. Without a readable transcript,
the harvest names no paths.

The reminder to look for a similar implementation first fires only on a prompt
that asks to build or change behavior. A reply such as "yes" or "commit it"
does not get it.

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
assistant response, captures out-of-scope follow-ups, and closes backlog items
completed or explicitly closed by the conversation: a closing note, then
`agent-backlog done`. It never removes items, because a closed item and its
notes are the record later sessions search. Upstream bug reports and
dev-tooling audit items (agent hooks, agent settings, test tooling) do not go
to the backlog. The agent mentions each one once in its reply. Items are
classified on two axes: `--kind feature|defect|risk|debt` (Unicorn Project
investment categories — what the item is) and `--work-type
business|internal|change|unplanned` (Phoenix Project four types — how the
work entered the system).

The `/wait-what` register stays on for the rest of the session. The skill is
the user-level `~/.claude/skills/wait-what/SKILL.md`. The model can invoke it,
but only on a turn that matches its description. Without help, the register
reaches one reply only. The `wait-what-register` rule reads the session
transcript to keep it on. The rule arms when a user entry carries a
`<command-name>` tag for `/wait-what`, with or without a plugin prefix. A
command whose name only contains `wait-what`, such as `/wait-what-notes`, does
not arm it. Entries whose content is an array — tool results and injected skill
bodies — do not arm it either, so a transcript that only quotes the skill stays
quiet. After the rule arms, it tells the agent on every later
`UserPromptSubmit` to follow the wait-what skill. The rule does not repeat the
skill's terms or its `CONTEXT.md` guidance. The skill is the one place for them.
The register has no off switch. An off switch needs a command that does not
exist. The transcript is the session state, so a new session starts with the
register off and a resumed session keeps it on.
