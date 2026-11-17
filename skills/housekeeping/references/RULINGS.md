# Rulings behind housekeeping

Each entry gives the rule, the user's words with their date, what happened, and the source.

## The two stops

**A turn never ends to wait on the user.** _"Keep in mind, I don't read your response, so you must use the tool to ask me any questions or to take any decisions from me."_ (2026-11-17). AskUserQuestion returns the answer inside the turn, so "waiting on the user" is not a reason to stop. A turn stops only when it is Finished or Parked. `experiments-mutex/ask-all-needed-inputs-at-once.md`

**Ask everything at once, from the session's first message.** _"use ask user question for any input you need from me from the begining of this session to finish everything. if nothing more to do run housekeeping."_ (2026-11-16, typed four times that day). Earlier forms: _"Like anything that we have forgot this whole session and the stuff that we need"_ (2026-11-12), _"when you need things from me use ask user question to have my input. don't wait"_ (2026-11-13).

## Ask

**The week of nudges.** Between 2026-11-07 and 2026-11-17 the user typed a form of "what are you waiting for? / do you need anything from me? / use ask user question for any input you need" about 17 times in 14 sessions. The replies just before 8 of those nudges:

- 2 gave the user a task in prose: _"Still waiting on you at the mini: the four System Settings toggles … One run in Terminal"_; _"Cleanup that's yours, through Mole"_.
- 4 waited on background work or a peer, with the user's decisions not asked: _"The study lockfile retry and commit B's test gate are both running in the background. I'll pick up each one when it finishes."_; _"Commit B hasn't landed. … It will message me when B is on HEAD."_; _"The tool commit is waiting on Docker Desktop."_
- 2 ended on open items: _"Still to do after commit B lands: Phase 3 …, then Phase 4"_; a table whose rows said _"needs a design choice"_.

These are the four Ask gotchas: idle, a task is a question, open items are questions, remaining phases hide decisions.

**Tried and dropped: "a next step with an open design choice is a question now".** In the Mac mini session the reply ended _"After that I'll install the always-on phone server"_. After the nudge, the user's first decision was _"How should the CLI Remote Control cover all repos on the mini?"_ Neither the old skill nor this one asked it in the 2026-11-17 replay. The user chose "iterate now". A gotcha for it was added and replayed on the same three cases: it made the agent ask more design choices (cut-over, memory home, backlog on the mini), but still not the Remote Control one, and the total stayed at 7 of 9 checks (old skill: 5 and 4 of 9). By the rule set before the run, it was removed. Workspace: `~/.claude/scratch/housekeeping-workspace/iteration-2/`.

**Ask only what is the user's.** The agent decides what the design decides, and asks only on a real split. A question already answered costs the user a second read. `experiments-mutex/decide-correct-design-not-preference.md`, `experiments-mutex/dont-reask-pending-decision.md`

## Why a Stop gate sends the agent here

**This skill did not run itself.** Its earlier description said "use it without being asked while waiting on subagents, CI, a deploy or a long shell command". The idle stalls above happened anyway.

**The hooks before the gate (week to 2026-11-17, 2876 stops).** A Haiku prompt Stop hook blocked 114 times, 107 of them on running work that its own rule allowed, 28 in a row in one session. It let "waits for the user" end a turn, which is the stall the user nudged about. The every-third-prompt backlog audit added 303 turns, and 4 of them led to an agent-backlog call. The regex hook for prose questions blocked 102 times and had no phrase for a task or a wait on the user.

**One gate, judgement in the main agent.** _"I think we need to rethink out stop hooks altogether to achvie those. we need to decombse and think form first princple"_ (2026-11-17). The user chose "One gate + housekeeping" and "After new work". Code checks what a machine can see (a prose ask in the final message, new tool calls since the last sweep, running background tasks). The main agent, which has the whole context, does the judgement here. The rules are `ask-in-the-tool` and `housekeeping-due` in agent-plugin `hooks/ezzs-way-of-coding`.

## Shape

**Outcomes and gotchas, not how-to.** _"you don't really need that much of skill text in there. opus is prtty good when you give it an outcome. we need to focus on gotchas more than "how-to""_ (2026-11-17). The jobs are outcomes. How to use agent-backlog (condition flags, `ask`, `decide`, `met`) is in the SessionStart reminder `capture-out-of-scope-followups`, so this skill does not repeat it. `experiments-mutex/agent-knowledge-has-one-home.md`

**A folder, not one crammed file.** _"make sure we use proper skill file/folder structure so we don't cram the main skill file"_ (2026-11-17). The skill moved from an untracked `~/.agents/skills/housekeeping` into agent-plugin `skills/housekeeping`, as `automations` and `reminders-curator` did. `experiments-mutex/skill-shape.md`

**Records gotchas.** "Edit the doc, do not file it" and "name what you checked" come from the first version (2026-11-10). The source of those two was not recorded.
