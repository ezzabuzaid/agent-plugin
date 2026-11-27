# Rollover rulings

The evidence behind each rule of the rollover skill and the coding plugin's rollover mod.

**The standing request (2026-10-27 to 2026-11-26).** Before nearly every `/clear`, Ezz typed one request: _"you are almost out of context. give me handoff prompt that makes new session continue as if it was you with knowledge of running subagents and shells/tasks. but keep doing the task at hand tho. don't cancel anything but the handoff should be aware"_. That text came 11 times word for word in 30 days, out of about 45 handoff requests in all; variants add "run housekeeping", "close-out" and "store it in a file". Then he ran `/clear` in the same terminal (144 `/clear` against 2 `/compact` in those 30 days) and pasted the prompt, or typed "Read <file> and continue". One case, moved here from housekeeping's 2026-11-26 forensics round: _"give me handoff prompt … but keep doing the task at hand tho. don't cancel anything"_ (916521be line 6018).

**A session that misses it dies.** Auto-compact is off (`autoCompactEnabled: false`, Ezz's choice on 2026-11-10 after a token audit), so at the limit a session ends with "Prompt is too long". On 2026-11-22 session e760f78f died at 12:59, 30 s after it launched three subagents, and Ezz's queued "give me handoff prompt" was never answered.

**Never stop the work for the threshold.** An 80% context-meter hook (UserPromptSubmit) was removed on 2026-11-17 because it made the agent stop and ask him to `/clear`: _"Break away, remove any memory or rule that says that you should not continue after 80%. Okay, I hate this."_ The rollover ends one turn and resets the context by itself; it never asks him.

**Names (2026-11-26).** The act is a rollover, as in log rollover: at a size limit the file closes, a new one starts, and nothing is lost. The note is a continuation. Ezz chose these over "handoff", which stays for a transfer to another session or agent, because his own words ask for the new context to _"continue as if it was you"_.

**No summary (2026-11-26).** _"is there point of compaction? like how is it helping us if the agent already will keep the progress stored properly"_. A summary repeats the records and costs one model call over the whole context. The window still has to be emptied, so the mod runs `/clear` and submits one prompt, which is his manual flow without him.

**A short continuation, written by the old context (2026-11-26).** The handoff turns measured on 2026-11-26 wrote 6 to 9 KB each (meddit 9,321, deepagents 7,059, elt-s9 6,420, HANDOFF.md 7,657 characters). The records were already current: housekeeping sweeps at each commit, push or close claim. What no record held was the live state (running subagents and shells, their output files, how to check them, uncommitted files) and the step in flight with its next action. That is what the continuation holds.

**Subagents survive a `/clear`.** The process stays, so running subagents and shells report to the fresh context: _"Running subagents survive a /clear and keep reporting to this same session"_ (mutex, 2026-11-24). On 2026-11-20 a handoff said _"Nothing of mine is running or uncommitted"_ while a subagent it had started (deepagents #3369) was still editing 20 files. Count running work from the harness.

**Housekeeping no longer hands off (2026-11-26).** _"I suppose housekeeping should no longer do this job, no?"_ Its "Handoff, keep working" mode and "Hand off" job moved here. Housekeeping's Update keeps one line: the item that tracks the work names the exact next step.

**Why a mod (Claude Code 2.1.332).** No settings hook can run `/clear` or `/compact`, and the model cannot run either (the Skill tool refuses a built-in command). A plugin hooks module can: `$.session.usage()` reads the percent the status line shows, `$.prompt.submit` queues a prompt, and `$.command.run({ command: 'clear' })` queues `/clear`. A mod's `turn.complete` hook fires for every turn end, a subagent's too, so the mod acts only on the main loop's answers, and `$.session.surfaces()` is empty in a `claude -p` run, which it skips.
