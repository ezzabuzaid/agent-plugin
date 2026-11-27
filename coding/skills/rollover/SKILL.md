---
name: rollover
description: Rolls a session over to a fresh context when its context window is nearly full. The old context writes a short continuation (the live state and pointers to the records), the context is cleared, and the fresh context resumes from it as the same session. Use when the coding plugin's rollover message says the context reached its threshold; when a prompt says "Continue session <id> as if you were it" and names a continuation; when the user names a session that died without one ("continue where <id> left off", "pick up that dead session"); and when the user asks for a handoff or a handoff prompt ("give me a handoff", "give me handoff prompt", "you are almost out of context", "store the handoff in a file and give me the path"). Not for session hygiene: that is housekeeping.
---

# Rollover

A rollover replaces the context of a session and keeps the session. The process, its subagents and its background shells stay, and they report to the fresh context. Only the messages go. The note that carries the work across is the **continuation**. A **handoff** is different: it gives work to another session or agent.

The coding plugin's mod runs the rollover by itself. At the end of a turn at 93% context use or more (the `rolloverPercent` option), it asks for the continuation. When the turn that the ask started ends and the file exists, the mod runs `/clear` and submits the resume prompt. The user can also ask for one: see Manual. The evidence for each rule is in [references/RULINGS.md](references/RULINGS.md).

## Write (the old context)

Outcome: the path that the message names holds a continuation that lets a fresh context continue as if it were you, and the turn ends.

1. Bring the step in hand to a safe point. Cancel nothing: subagents, shells and watches keep running.
2. Put each decision that lives only in this conversation into the record that owns it (the plan, the backlog item), not into the continuation.
3. Write the continuation, with these sections:
   - **Task:** the user's last requests in his words, the working directory and the other repos.
   - **Records:** the plan file and the backlog ids to read first. They hold the state up to the last commit.
   - **Running now:** each item that `ListAgents` and the background tasks show: kind, id, what it does, its output file, how to check it, and what to do with its result.
   - **Uncommitted:** for each repo, this session's files in `git status`. A peer's files are not yours.
   - **In flight:** the step you were on, its exact next action, and the check that proves it.
   - **Next:** the steps after it, or the plan section that lists them.
   - **Peers:** the sessions that share files with you, and what each holds.
4. End the turn. Ask nothing: the rollover runs unattended.

Leave out how the user works (CLAUDE.md and memory load in the fresh context), copies of records, and a recap of the conversation. Keep it under about 60 lines.

## Resume (the fresh context)

Outcome: the work goes on from the continuation's next action, and its claims are checked.

1. Read the continuation, then the records that it names.
2. Check the live claims now: `ListAgents`, the output files, `git status`. A subagent can finish during the clear, and its notice can already be in this context.
3. When a claim is unclear, read the old transcript, `<config root>/projects/<project>/<old session id>.jsonl`: the user's last typed requests (string user messages and `queued_command` attachments) and the last tool results.
4. Continue. No recap, no "I'll continue", and no question about what to do next. The decisions in the continuation and the records stay closed.

## Recover (a session that died without a continuation)

Outcome: the continuation that the dead session never wrote exists, built from its transcript, and Resume runs from it.

A session dies without one on an API error, a usage limit, a crash or a closed terminal. Its process is gone, so its subagents, shells and watches are gone too: only their output files remain.

1. Find its transcript: `<config root>/projects/*/<id>.jsonl` (the folder is its working directory with `/` as `-`). It may continue an earlier session: after a `/clear` its `{"type":"derived-from","sessions":[{"id":"<old id>","via":"clear"}]}` entry names it, and a session started from a pasted handoff or continuation names it in its first user message. Read that one too.
2. Read it in a subagent when it is long (more than about 2 MB; with no subagent tool, read it yourself with `jq`), and give the subagent this list. Collect state, not a story:
   - the user's typed requests in order (string user messages, `queued_command` attachments whose origin is human, and typed dialog answers), the last few in full;
   - each AskUserQuestion it asked, with the answers;
   - the plan files and backlog items it read or wrote. `agent-backlog list --session <id> --all-repos` records writes only since 2026-11-26; for an older session, take the `agent-backlog` commands from its Bash calls;
   - its commits and pushes: `<config root>/ledger/<id>.jsonl` for a session that began after the ledger install (`<config root>/ledger/installed-at`), else `git log` over its time span in each repo it worked in;
   - each subagent, background shell and watch it started, with its output file and how far that output got. Files under the temp folder can be gone after a reboot or a few days; then read the logs its commands wrote elsewhere (the paths in its commands);
   - its last tool calls and results, and how it ended (the last entries: an API error, a limit message, or nothing).
3. Check what is live now, and what changed after it died: `git status` and `git log --since=<its last entry>` in its working directory and in each repo it touched (another session may have finished its step), the current status of its backlog items, and the output files.
4. Write the continuation at `<config root>/continuations/<id>.md`, in the sections of Write, with **Running now** listing the dead work and what each output shows.
5. Follow Resume from step 2, as that session: no recap and no question about where it was.

## Manual

When the user asks for a handoff while work runs, write the continuation as in Write, at `<config root>/continuations/<session id>.md`, and keep working. Update it when the state changes. Give him one line to paste after his own `/clear`:

`Continue session <id> as if you were it: read <path> first, then follow the coding:rollover skill (Resume).`

## Gotchas

- **A `/clear` stops nothing.** Count running work from `ListAgents` and the background tasks, never from memory.
- **A continuation is not a summary.** A copy of the plan drifts from the plan. Point at the record.
- **Never write it in the session's scratchpad.** A reboot clears it, and the tracking-record guard refuses it.
- **Never stop the work for the threshold.** The rollover ends one turn; it never pauses dispatch, asks the user to `/clear`, or cancels a job.
- **The mod clears only when the file exists.** A missing file gets one more ask, then a toast and no clear, so the session keeps its context and can still reach its limit. Write the file before the turn ends.
