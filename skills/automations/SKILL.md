---
name: automations
description: Make, change, pause, run or list LOCAL automations, which are Claude Code prompts that run headless on this Mac on a schedule (launchd + `claude -p`, on the Claude plan's own usage). The Codex-automations equivalent for Claude. Use when the user asks to run something "every day/week/N days", "on a schedule", "recurring", "every morning", "remind me to check X weekly", or mentions automations, Codex schedules or local scheduled tasks, unless they ask for the cloud (then use the built-in `/schedule`) or for a poll inside this session only (then use `/loop`).
---

# Automations

An automation is a prompt that runs as a headless Claude Code session on this Mac at the times of a schedule. It does not need an open session or an open app. launchd starts it, and it uses the Claude plan's usage, not API credit. The CLI is:

```sh
node ~/Desktop/January/agent-plugin/tools/automations/cli.ts <sync | run <id> [--if-due] | list [--json]>
```

## The files of an automation

Each automation is a folder `~/.claude/automations/<id>/`. The `<id>` has only `a-z`, `0-9` and `-`.

- `automation.md`: you write it. YAML frontmatter, then the prompt as the body.
- `memory.md`: the run reads it first and adds what the next run needs. You can make it empty or leave it out.
- `state.json` and `run.log`: the runner writes them. Do not edit them.

```markdown
---
name: Update docs
schedule: |
  DTSTART;TZID=Asia/Amman:20261117T100000
  RRULE:FREQ=WEEKLY;BYDAY=MO,TH;BYHOUR=10;BYMINUTE=0
cwd: /Users/ezzabuzaid/Desktop/experiments/mutex
status: active
model: opus
effort: medium
timeout: PT75M
---

/update-docs next
```

| Key        | Required | Value                                                                                       |
| ---------- | -------- | ------------------------------------------------------------------------------------------- |
| `name`     | yes      | The title of the notification.                                                              |
| `schedule` | yes      | RFC 5545: a `DTSTART` line, then an `RRULE` line.                                           |
| `cwd`      | yes      | An absolute folder. The session runs there.                                                 |
| `status`   | yes      | `active` or `paused`.                                                                       |
| `model`    | no       | A `claude --model` value. With none, the settings give the model.                           |
| `effort`   | no       | A `claude --effort` value.                                                                  |
| `timeout`  | no       | An ISO 8601 duration for the whole run, resumes included. The runner stops a run that takes longer. The default is `PT2H`. |
| `requiresAcPower` | no | `true`: on battery power the run waits, and the next hourly check on AC power runs it.  |
| `resume`   | no       | `times`, `while`, `prompt`. See [Continue a run that stopped early](#continue-a-run-that-stopped-early). |

## Continue a run that stopped early

A headless run ends at the first reply with no tool call, also when work is still open. `resume` sends a continuation, at most `times` times (the Opus 5.5 prompting guide says two or three):

```yaml
resume:
  times: 2
  while: node /abs/path/tool.ts open
  prompt: |
    Your ledger still has open items:
    {stdout}
    Continue with them. If one is blocked, record what blocks it in the ledger.
```

After a run that is not an error, the runner runs `while` with `/bin/sh -c` in the `cwd`. Exit 0 means work is open: the runner resumes the same session with `prompt`, and `{stdout}` becomes the output of `while`. Any other exit ends the run. The check is yours to write: it names the open items, and it exits 0 only while some are open with no named blocker.

## Write the schedule

`DTSTART` is the first run. Write it in the time zone of the Mac (`node -p 'Temporal.Now.timeZoneId()'`) and at a time in the future. With a time in the past, the next hourly check runs it at once. `RRULE` gives the repeats:

| The user says        | RRULE                                                |
| -------------------- | ---------------------------------------------------- |
| every day at 9:00    | `FREQ=DAILY;BYHOUR=9;BYMINUTE=0`                     |
| weekdays at 8:30     | `FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR;BYHOUR=8;BYMINUTE=30` |
| Monday and Thursday  | `FREQ=WEEKLY;BYDAY=MO,TH;BYHOUR=10;BYMINUTE=0`       |
| every 3 days         | `FREQ=DAILY;INTERVAL=3` (at the time of `DTSTART`)   |
| every 2 weeks        | `FREQ=WEEKLY;INTERVAL=2` (on the day of `DTSTART`)   |
| once                 | `FREQ=DAILY;COUNT=1`                                 |

launchd checks each automation every hour at the minute of its rule. A rule more frequent than hourly is checked every minute.

## Write the prompt

The run has no person to answer it. It cannot ask a question, and a permission prompt is refused (`--permission-prompts none`); the permission mode comes from the settings. So the prompt says what to do, what to produce, and where to write it. The session is kept, so the user can open it later.

## Make, change and remove

1. Write `~/.claude/automations/<id>/automation.md`.
2. Run `cli.ts sync`. It checks every automation, and stops with the id and the reason when one is wrong. Then it installs a launchd job for each active automation and removes the job of each paused or deleted one.
3. Run `cli.ts list` and show the user the next run.

A change to the prompt, `cwd`, `model`, `effort` or `timeout` applies at the next run with no sync. A change to `schedule` or `status`, and a new or deleted folder, needs `sync`.

- **Run now:** `cli.ts run <id>`. It runs also when the automation is paused.
- **Pause:** set `status: paused`, then `sync`.
- **Delete:** remove the folder, then `sync`.

## What the user sees

After each run, a macOS notification gives the name, `done` or `failed`, and the first line of the reply. A click on it opens a cmux workspace in the `cwd` with `claude --resume <session>`.

## Limits

- A run starts only while the Mac is awake and the user is logged in. When the Mac sleeps through one or more runs, the automation runs once after the Mac wakes.
- The Mac stays awake while a run goes on.
- Two runs of one automation never overlap. launchd starts only one process of a job.
