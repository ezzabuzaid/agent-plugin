---
name: housekeeping
description: Session housekeeping. Asks the user, in one AskUserQuestion round, every decision, permission or manual step that only the user can give for the rest of the work, and acts on the answers; brings every record the session's work made stale up to date (repo docs, memory, backlog items, plan status); files each problem noticed into agent-backlog; stops what the session started; finishes or hands off the session's own work; and says whether the session is safe to close. Use when a Stop reminder says housekeeping is due; when the user asks "what are you waiting for?", "what are you waiting on?", "do you need anything from me?", "use ask user question for any input you need", "take the time to update anything", "file any problems", "clean up", "wrap up", "I need to close this session", "anything remaining?" or "can I close this session?"; while waiting on subagents, CI, a deploy, a peer session or a long shell command; and before reporting a task as done.
---

# Housekeeping

This skill brings the session to one of two states:

- **Finished:** the work is done and proven, every record matches it, and nothing waits on the user.
- **Parked:** work that will wake the session is running (a subagent, a workflow, a background shell, a peer that will send a message), every remaining item waits on it, and the user has already answered everything the rest of the work needs.

A turn never ends to wait on the user. The user reads only AskUserQuestion, and AskUserQuestion returns the answer inside the turn. A choice that needs an explanation is asked there too: the explanation goes inside the question and its options, because an open dialog hides the chat. The evidence for each rule (the user's words, the incidents, the numbers) is in [references/RULINGS.md](references/RULINGS.md).

## Modes

Every mode has the same jobs. The mode sets their order.

| Mode | When | Order |
|---|---|---|
| Asked | The user asks what you wait for or what you need | Ask first, act on the answers, then continue the work. |
| Idle | Background work or a peer will wake the session | Ask, then the jobs that do not touch what the running work uses, then start every queued item that does not depend on it. Wait only when nothing else can start. |
| Before done | You are about to report a task as done | Every job, for this task. The result goes in the done report. |
| Close-out | The user closes the session or leaves | Every job, then hand off. |

## Jobs

Each job is an outcome. Reach it the shortest way.

- **Ask:** every decision, permission or manual step that only the user can give for the rest of the work, from the session's first message to now, is in one AskUserQuestion round (at most 4 questions per call, more calls in the same round). You act on the answers in the same turn.
- **Look back:** you know what you changed, committed, filed, started and promised, the corrections the user gave, and the problems you saw in passing. Your diff holds no leftovers.
- **Update:** each record that names what you changed matches the code as it is now: repo docs, AGENTS.md, memory, backlog items whose premise changed, conditions this session settled, and the plan's STATUS.
- **File:** each problem you did not fix is an agent-backlog item that a new agent can act on without this transcript, in the repo that owns the fix, with no duplicate.
- **Clean up:** nothing you started and no longer need still runs or takes disk.
- **Finish:** your files are committed or listed, unpushed commits are listed, peers know what you finished, and each running job has a named receiver for its result. The running jobs come from `ListAgents` and the Stop reminder's list, and your files from `git status`, not from what you remember starting. A step you can take now is taken, not reported.
- **Hand off** (close-out): the item that tracks the work says what is done (with commits), what is in progress and where, and the exact next step with its check.

## Gotchas

**Ask**

- **Idle is no reason to hold questions.** While a subagent, a test gate or a peer runs, the decisions that the rest of the work needs are already known. Ask them now.
- **A task for the user is a question.** "Toggle these four settings", "run this `!` command" and "trash this folder" go in AskUserQuestion as "Do X, then pick Done", with the command in the question text.
- **A list of open items is a list of unasked questions.** A table row that says "needs a design choice", a "still to do: Phase 3, then Phase 4" line, or "#id needs your decision" in prose stops the session. Make each choice a question, with the options you would choose between.
- **Remaining phases hide decisions.** Scope edges and steps only the user can take come up later in the work. Find them now, not when the phase starts.
- **Ask only what is the user's.** Drop what the transcript or `agent-backlog decisions` already answers, and decide what the design decides. Each question must stand alone: the user may see only the question dialog.
- **Prose never carries an ask.** A status line in prose is fine. A question, a choice, a "Reply A or B" or a request in prose is not seen, even right after a long explanation.
- **The explanation lives inside the dialog.** While a dialog is open the user sees only the dialog, so chat text written before it goes unread. Put the facts and the trade-off in the question, what each option costs in its description, your pick first with "(Recommended)", and code or a comparison in an option's preview.

**Records**

- When you file "update the docs" instead of editing the doc, the doc stays stale. Edit docs during the sweep. File only work that needs a design or does not fit in this session.
- "Nothing to file" without what you checked reads as if you did not check. Name what you checked.
- In a shared checkout, files, commits and processes of other sessions are not yours. Do not commit, revert, stop or delete them. If they block you, ask their owner.
- The next agent starts from the backlog item, not from this transcript. What is not in an item, a commit, a doc or memory is lost when the session closes.

**Running work**

- **A `/clear` or a handoff stops nothing.** A subagent started before it keeps running and editing the checkout, and the context after it never started it. Before you write "nothing is running" or "nothing of mine is uncommitted", read `ListAgents` and `git status`.
- **A Stop reminder that says background work runs names a real task.** Find each one it names before you report on running work.

## Done when

The jobs for the mode are done, every question for the user went through AskUserQuestion, and the reply uses this shape. Leave out empty sections. A sweep that finds nothing new is one line: "Nothing new."

- **Updated:** each record, and what changed in it.
- **Filed:** `#id` and repo, one line each.
- **Closed:** `#id`, and what settled it.
- **Cleaned up:** what you stopped or deleted.
- **Still running:** what `ListAgents` and the Stop reminder show running, and who gets its result.
- **Open around this work** (close-out, or when the user asks for completeness): the open items in groups, in the order you recommend.

In close-out, end with one line: "Safe to close." or "Not safe to close: <reason>".
