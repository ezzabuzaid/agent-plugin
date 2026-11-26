---
name: housekeeping
description: Session housekeeping. Asks the user, in one AskUserQuestion round, every decision, permission or manual step that only the user can give for the rest of the work, and acts on the answers; brings every record the session's work made stale up to date (repo docs, memory, backlog items, plan status); files each problem noticed into agent-backlog; stops and deletes what the session started; checks every push's CI and every claim before "done"; finishes the session's own work; and ends with what remains and whether the session is safe to close. Use when a Stop reminder says housekeeping is due (call this skill; a sweep from memory does not count); when the user asks "what are you waiting for?", "what are you waiting on?", "do you need anything from me?", "what's left?", "what remains?", "what now?", "use ask user question for any input you need", "take the time to update anything", "file any problems", "clean up", "wrap up", "I need to close this session", "anything remaining?" or "can I close this session?"; while waiting on subagents, CI, a deploy, a peer session or a long shell command; and before reporting a task as done.
---

# Housekeeping

This skill brings the session to one of two states:

- **Finished:** the work is done and proven, every record matches it, and nothing waits on the user.
- **Parked:** work that will wake the session runs (a subagent, a workflow, a background shell, a watch the user can see), each remaining item waits on it as checked now, and the user has answered everything the rest of the work needs.

A turn never ends to wait on the user: AskUserQuestion returns his answer inside the turn. The chat explains; the dialog only asks. A handoff, or a rollover to a fresh context, is the `coding:rollover` skill's job. The evidence for each rule (the user's words, the incidents, the numbers) is in [references/RULINGS.md](references/RULINGS.md).

## Scripts

Each script's header comment holds its full contract.

| Script | Prints |
|---|---|
| `scripts/close-check.mjs` | Each commit this session pushed, with the state of its CI, Release and deploy runs; this session's unpushed commits; the backlog items this session filed or updated that `agent-backlog ready` lists. Running work is not in it: take that from `ListAgents` and the Stop reminder. |
| `scripts/records-check.mjs` | The paths and names this session's commits renamed or removed, and each doc, memory and open backlog line that still names them. |

## Modes

Every mode has the same jobs. The mode sets their order.

| Mode | When | Order |
|---|---|---|
| Asked | The user asks what you wait for, what you need or what remains | Ask first, act on the answers, then continue the work. |
| Idle | Background work runs | Ask, then the jobs that do not touch what the running work uses, then start every item it does not block. A test run, CI run, push, deploy or a peer's optional result never holds the queue. |
| Before done | You are about to report a task as done | Every job, for this task, before you write the report. |
| Close-out | The user closes the session or leaves | Every job. |

When the turn answered a question from the user, the sweep adds nothing after the answer: no dialog and no report. The answer is the last thing he sees.

## Jobs

Each job is an outcome. Reach it the shortest way.

- **Ask:** every decision, permission or manual step that only the user can give for the rest of the work, from the session's first message to now, is in one AskUserQuestion round (at most 4 questions per call, more calls in the same round). You act on the answers in the same turn.
- **Look back:** you know what you changed, committed, pushed, filed, started and promised (in your messages and in your own dialogs), the corrections the user gave, and the problems you saw in passing. Your diff holds no leftovers.
- **Update:** each record that names what you changed matches the code as it is now: repo docs, AGENTS.md, memory, backlog items, conditions this session settled, and the plan's STATUS. The item that tracks the work says what is done (with commits), what is in progress and where, and the exact next step with its check. `records-check.mjs` output backs the claim.
- **File:** each problem you did not fix is an agent-backlog item that a new agent can act on without this transcript, in the repo that owns the fix, with no duplicate. A problem in the user's own hooks and skills goes to agent-plugin; a third-party tool's problem is mentioned once.
- **Clean up:** nothing you started and no longer need still runs or takes space: processes, watches, disk, containers, volumes, and the rows and accounts your checks created.
- **Finish:** `close-check.mjs` output shows every push's runs read, each running run with one bounded watch as its receiver, each ready item of yours started, and your commits pushed where the repo's settings allow. Each claim in the report was proven after your last edit; each Verification line and each user request has its evidence; each skill the user invoked has its closing report.

## Gotchas

**Ask**

- **Idle is no reason to hold questions.** While work runs, the decisions that the rest of the work needs are already known. Ask them now.
- **A task for the user is a question:** "Do X, then pick Done". A `!` command is the exception: it is the last line of the chat, and the turn ends on it with no dialog.
- **A list of open items is a list of unasked questions.** A table row that says "needs a design choice", a "still to do: Phase 3, then Phase 4" line, or "needs your decision", "waits on your go", "yours when you choose" in prose stops the session. Make each choice a question, with the options you would choose between.
- **Remaining phases hide decisions.** Scope edges and steps only the user can take come up later in the work. Find them now, not when the phase starts.
- **Ask only what is the user's, and drop nothing without a record.** Drop a question only when a record already decides it (a memory, an ADR, the ticket's decided line, `agent-backlog decisions`), and name that record in the reply. A change to a package's API or to which package owns a step is his. "Filed today" or "not urgent" is no reason to hold a question. A topic he opened stays in the chat until he asks for decisions; a question he deferred or rejected is not asked again until he raises it.
- **The chat explains, the dialog only asks.** Write the context and your recommendation in the chat, in the wait-what style. The dialog holds a one-line question and short labels that name the real alternatives (not a bare yes/no), each with its cost in a few words, your pick first.

**Running work**

- **"Everything waits on X" is a claim to check now.** Split each queued item into the part X blocks and the part it does not (reads, designs, scripts, other packages), and start the second part. A wait reason from an earlier sweep is stale.
- **A wait needs a watch the user can see.** A peer's promise or "the next wake" receives nothing. Check the awaited fact now, then arm one bounded watch on it.
- **A job past its expected time is a problem, not a wait.** Read its age and last output, and act.
- **A `/clear` or a handoff stops nothing.** Count running work from `ListAgents`, the Stop reminder and `git status`, never from memory.

**Records**

- When you file "update the docs" instead of editing the doc, the doc stays stale. Edit it in the sweep.
- "Nothing to file" without what you checked reads as if you did not check. Name what you checked.
- In a shared checkout, other sessions' files, commits and processes are not yours. If they block you, ask their owner.
- The next agent starts from the backlog item and the tracking record, not from this transcript. Keep the record outside the scratchpad, current at each step boundary.

## Done when

The jobs for the mode are done, every question went through AskUserQuestion, and the reply opens with one or two plain sentences on what changed for the user. Then, leaving out empty sections:

- **Updated:** each record, what changed in it, and the check that found it.
- **Filed:** `#id` and repo, one line each.
- **Closed:** `#id`, and what settled it.
- **Cleaned up:** what you stopped or deleted.
- **Remaining** (always in idle and before done): what runs and who gets its result; each queued item with what it waits on; what is the user's, asked in the dialog.

In close-out, end with "Safe to close." only when `close-check.mjs` output in this turn shows nothing open; else "Not safe to close: <reason>".
