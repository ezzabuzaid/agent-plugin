# Ezz's Coding Reminders

This is Ezz's global Claude Code and Codex application of
`@deepagents/experimental/coding-agent-reminders`. Both agents execute
`hook.ts` directly with Node — wired by absolute path in
`~/.claude/settings.json` and `~/.codex/hooks.json` — backed by the pinned
`7.38.1` package installed in this directory. It has no runtime dependency on a
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

Every session on the machine runs `hook.ts`, so one broken rule file must not
turn off the others. `rules/index.ts` loads each rule module with its own
`import()`. When a module throws while it loads, stderr gets one line that
names the module and the error, that module gives no rules, and the rules of
the other modules stay on. When `rules/index.ts` itself cannot load, `hook.ts`
writes one line to stderr and exits 0 with no output. A module that another
module imports (for example `verification.ts`, which `stop.ts` imports) also
turns off the modules that import it. Keep the order of the guards in
`rules/index.ts`: the first guard that refuses a call gives the reason.

Node strips the types when it runs `hook.ts` and the tests, and checks none of them. `npm run typecheck` is the only type check: run it with `npm test` after each change.

The AGENTS.md/CLAUDE.md explorer CLI lives at `../../tools/explore-agents-md/`
(bin: `explore-agents-md`); the `reminders-curator` skill
(../../skills/reminders-curator) runs it to mine repeated guidance out of
those files and encode it here as rules.

Out-of-scope follow-up capture works in every repository with no configuration:
the global `agent-backlog` command stores all repositories' items in one
database at `~/.agent-backlog/backlog.sqlite`. Subagent findings are left for
the root agent to store. A problem in the user's own hooks, skills or plugins
(agent-plugin, `~/.claude/hooks`, `~/.agents/skills`) is filed in agent-plugin
like any other defect; only a third-party tool's problem stays out of the
backlog, mentioned once in the reply. Items are
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

Three Stop rules (root sessions only) keep a turn from ending on the user or on
an unproven claim. The user reads only AskUserQuestion, and AskUserQuestion
answers inside the turn, so a turn ends only finished, or parked: machine work
that will wake the session still runs and every decision for the user has been
asked. The chat explains, in plain words; the dialog holds only a one-line
question and short labels (the user, 2026-11-24).
`ask-in-the-tool` fires when the final message asks the user something, gives
him a task or waits on him in prose, also after an earlier AskUserQuestion,
including an answer format ("Reply **"A"** or **"B"**") and phrasings such as
"yours, when you choose", "your go" or "type `/x`"; a negation such as "none
of them waits on you" or "no item waits on you" is a report. A "yours" line is
a report too when it names a later or conditional ask ("**Yours, later:**",
"the push is yours once CI is green", "When they pass, … the push is yours")
or what the user holds without asking for it now ("stays yours", "is yours to
read"), or when a relative clause only describes a noun ("drop decisions that
are yours"); "that one is yours", "the next step is yours" and a heading over a
task list ("**Next, two things that are yours:**") still fire. "Before I
start" after a wait on the agent's own work ("I wait for those five before I
start the graders") orders its steps and is a report; "I'll wait for your
answer before I start" still fires. A `!` command is the last chat line, with
no dialog after it.
`housekeeping-due` reads a Claude Code transcript: since the last `housekeeping`
Skill call, it fires on a commit, a push or a close claim in the final message
("Safe to close", "Nothing new", "nothing running", "all done"); edits, reads,
messages and task launches alone do not fire it, and only a Skill call for
`housekeeping` answers it (a sweep written from memory leaves it due). A
commit or push counts only where a shell command starts `git commit` or
`git push` (also `git -C <dir>`, after `&&`, `||`, `;`, `|` or a new line,
under `timeout`, `caffeinate`, `nohup`, `if` and the like, or inside `bash -c`),
never the words in a heredoc body, a quoted string or another command's
arguments. With
`background_tasks` running it asks for the skill's idle mode and names each
task by kind, id and description; otherwise its before-done mode.
`close-check-before-safe-to-close` sends a final message that claims "Safe to
close" back unless the same turn ran both scripts of the housekeeping skill's
duty list, `scripts/close-check.mjs` and `scripts/records-check.mjs`, and asks
for every line they print to be marked; a negated verdict ("Not safe to close
yet: …") or a condition ("Once both pass, the session is safe to close") claims
nothing. It fires only on "Safe to close": a blind judge of all 73 other
done-claim sentences in the transcripts ("everything is done", a "Done"
heading, "all done") found at most 17 of 22 real claims, below the 9 of 10 a
Stop rule needs.
Neither `housekeeping-due` nor `ask-in-the-tool` fires after a turn that only
answered a question from the user (a typed, queued or dialog-typed question, no
write or `SendMessage` in the turn, and no `!` command handed to the user in
the final message); a wrap-up question (what's left, what remains, also
misspelt, can I close, double check) still fires them.
`ask-in-the-tool` and `close-check-before-safe-to-close` also run on a stop that
a stop hook already continued (`stop_hook_active`), at most once per chain
(`continuedStops: 'once'` of `@deepagents/experimental` 7.38+): agents wrote
about half of their "Safe to close" claims in that reply. Every other Stop rule
skips such a stop. `housekeeping-due` is off in a Codex transcript and without
one. All Stop rules are off in a headless run (`claude -p`, the Agent SDKs),
which has no AskUserQuestion and no person to sweep for: `hook.ts` copies
Claude Code's `CLAUDE_CODE_ENTRYPOINT` (`cli` in a terminal, `sdk-cli` under
`-p`) into the input as `claude_code_entrypoint`.

Three PreToolUse guards refuse a call before it runs:
`dialog-only-asks` refuses an AskUserQuestion whose question is over 150
characters or whose option description is over 100;
`memory-compaction-is-the-users` refuses an Agent brief that asks to shrink a
`MEMORY.md` under a size, and a Write or Edit that drops more than max(1, 10%)
of a `MEMORY.md`'s index lines, comparing the index on disk with the file the
call leaves (an Edit's `old_string` → `new_string`, or every match under
`replace_all`), line by line;
`tracking-record-outside-the-scratchpad` refuses a plan, memory, HANDOFF or
STATUS record written into a session's folder, or whose text sends a later
reader to a file there: a task output (`…/tasks/…`), or a path that words such
as "see", "log", "repro", "continue from" or a label colon point at. A brief
that tells a subagent to build throwaway work in the scratchpad goes through.
The evidence for these rules is in `skills/housekeeping/references/RULINGS.md`
("The 2026-11-26 forensics round").
