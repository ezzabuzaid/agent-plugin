---
name: kickoff
description: Turns a one-line ask into a six-field brief (Goal, Why, Scope, Done when, Output, Autonomy). It drafts the fields the ask leaves open, asks them in one AskUserQuestion round, shows the brief and starts the work from it.
disable-model-invocation: true
argument-hint: '<goal, because why>'
---

# Kickoff

The ask: $ARGUMENTS

A **brief** is the contract for this task: six fields, each one line or two. It holds only what changes per task. Standing rules (no backward compatibility, prove it live, ask in the tool) already live in hooks, CLAUDE.md and memory, so the brief leaves them out.

| Field     | Says                                                                                                                          |
| --------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Goal      | The result, in one sentence.                                                                                                  |
| Why       | What the result is for. It decides the trade-offs.                                                                            |
| Scope     | What to read and touch, by repo, folder or item id. `Not now:` names what stays out.                                          |
| Done when | The checks that end the work, each one you can show: a command that passes, an item filed, a question answered.               |
| Output    | What comes back: a table, commits, filed items, a page, questions in the dialog.                                              |
| Autonomy  | `Decide:` what you settle alone. `Stop for:` what makes you ask. `Go:` the standing orders (commit, push, parallel work, subagents). |

Example:

```
Goal: find what Meddit's agent setup misses against text2sql, the deepagents UI and my other agent repos.
Why: I want the standard wiring before we add features.
Scope: read only; Meddit plus those three sources. Not now: evals and prompt changes.
Done when: every gap is filed or asked about.
Output: a ranked table; technical gaps filed; product calls asked in the dialog.
Autonomy: Decide: technical calls. Stop for: product, cost or legal calls. Go: parallel where files don't overlap.
```

## Steps

1. **Read the ask.** Map each part of the ask to a field. A field counts as given when the ask states it, with or without its label. With an empty ask, reply with one line, "Give me the goal and why in one line.", and end the turn. Done when every field is marked given or open.
2. **Learn what the drafts need.** Read what bears on the open fields: the repo's agent files, `git log -15`, the open items of `agent-backlog list`, and the memories the ask touches. Facts are your job; the dialog carries only decisions. Done when each open field has the concrete names it needs (paths, item ids, commands).
3. **Draft.** Write the brief in the chat with every field filled: the given ones in the user's words, the open ones as your recommended draft marked _(draft)_. For each open field except Why, write two or three options that differ in a real way (narrow or wide scope, report or filed items), the recommended one first. Done when every open field has its options.
4. **Ask once.** One AskUserQuestion round, one question per open field in table order, at most four. Why is never a question: its draft stands until the user corrects it. Keep each question and option short and put the detail in the chat draft. An answer that starts with an option's label keeps that option and adds what follows. An answer that matches no label replaces the draft.
5. **Show the brief and start.** Print the final brief as one block with the six labels, then start the work in the same turn. Done when the brief is printed and the first step of the work has run.

## Working from the brief

- Scope bounds the work. A `Not now:` item that comes up goes to `agent-backlog`.
- Autonomy decides when to stop: ask only for what `Stop for:` names, and act on `Go:` without asking.
- Before you report the work done, check each `Done when` line and give its evidence.
