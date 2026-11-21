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

Claude Code runs `UserPromptSubmit` also for a turn that a subagent hand-back,
a message from another Claude session or a background-task notification
starts. The payload has no field for the origin, but Claude Code frames each of
these prompts (`<agent-message …>`, `<cross-session-message …>`,
`<task-notification>`). When a usage limit resets, Claude Code also starts a
turn by itself with a fixed prompt, such as "Your claude.ai usage limit has
reset. Continue the task you were working on…". The prompt rules and the
session harvest read only a prompt that the user typed. The `/wait-what` register does not read the prompt
text, so it stays on for every turn. The UI and dependency reminders fire on a
phrase, such as "build a dashboard page" or "update the packages", not on two
words anywhere in a long prompt.

```sh
printf '%s' '{"hook_event_name":"UserPromptSubmit","prompt":"Build a custom executor."}' \
  | node hook.ts

npm test
npm run typecheck
```

Node strips the types when it runs `hook.ts` and the tests, and checks none of them. `npm run typecheck` is the only type check: run it with `npm test` after each change.

The AGENTS.md/CLAUDE.md explorer CLI lives at `../../tools/explore-agents-md/`
(bin: `explore-agents-md`); the `reminders-curator` skill
(../../skills/reminders-curator) runs it to mine repeated guidance out of
those files and encode it here as rules.

Out-of-scope follow-up capture works in every repository with no configuration:
the global `agent-backlog` command stores all repositories' items in one
database at `~/.agent-backlog/backlog.sqlite`. Subagent findings are left for
the root agent to store. Upstream bug reports and dev-tooling audit items
(agent hooks, agent settings, test tooling) do not go to the backlog. The agent mentions each one once in its reply. Items are
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

Two Stop rules (root sessions only) keep a turn from ending on the user. The
user reads only AskUserQuestion, and AskUserQuestion answers inside the turn,
so a turn ends only finished, or parked: machine work that will wake the
session still runs and every decision for the user has been asked. A choice
that needs an explanation is asked there too, with the explanation inside the
question and its options, because an open dialog hides the chat.
`ask-in-the-tool` fires when the final message asks the user something, gives
him a task or waits on him in prose, also after an earlier AskUserQuestion,
including a message that explains a choice, gives its own pick, and ends on an
answer format ("Reply **"A"** or **"B"**").
`housekeeping-due` reads a Claude Code transcript: it fires once the agent
called a tool after the first stop (`stop_hook_summary`) that follows the last
`housekeeping` skill call, or called any tool when no sweep ran yet. With
`background_tasks` running it asks for the skill's idle mode, names each task
by kind, id and description, and sends the agent on to every queued item that
does not depend on that work; otherwise it asks for its before-done mode.
It is off in a Codex transcript and without one.
Both rules are off in a headless run (`claude -p`, the Agent SDKs), which has
no AskUserQuestion and no person to sweep for: `hook.ts` copies Claude Code's
`CLAUDE_CODE_ENTRYPOINT` (`cli` in a terminal, `sdk-cli` under `-p`) into the
input as `claude_code_entrypoint`.
