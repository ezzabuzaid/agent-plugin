---
name: automations
description: Makes, changes, pauses, runs and lists local automations, which are Claude Code prompts that run headless on this Mac on a schedule, through launchd and `claude -p` on the usage of the Claude plan, with no open session and no open app. Use when the user asks to run a prompt, a skill, a check or a report every day, every week, every N days, on weekdays or at a time; says "on a schedule", "recurring", "every morning" or "remind me weekly to check X"; asks to schedule an agent on this Mac; or asks what runs on a schedule here, or to pause, delete or run one now. Not for a run in the cloud (use the built-in `/schedule`) or a poll inside this session (use `/loop`).
---

# Automations

An automation is a prompt that Claude Code runs with no person present, on this Mac, at the times of a schedule. launchd starts each run, so no session and no app must be open. Each run uses the usage of the Claude plan, not API credit. The evidence for each rule below (Ezz's words, the incident, the source) is in [references/RULINGS.md](references/RULINGS.md).

## Script

`node ${CLAUDE_SKILL_DIR}/scripts/dist/automations.mjs <command>` does the work. It is `scripts/automations.ts` with its packages bundled in, so it runs with no install. `sync` copies it to `~/.claude/automations/runner.mjs`, and the launchd jobs run that copy. The header comment of `scripts/automations.ts` holds the full contract, and `scripts/automations.test.ts` proves it.

To change the script, edit `scripts/automations.ts`, then run `npm run build` and `npm test` in `scripts/`, and commit `dist/automations.mjs` with the change. A test fails while the bundle does not match the source. After the change ships, run `sync` once so the jobs run the new bundle.

| Command             | Does                                                                                                                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sync`              | Checks every automation. When one is wrong, prints each id with the reason, installs nothing and exits 1. Else installs a launchd job for each active automation and removes the job of each paused or deleted one. |
| `run <id>`          | Runs the automation now, also when it is paused.                                                                                                                                      |
| `run <id> --if-due` | What the launchd job runs: runs only when a time of the schedule came after the last run.                                                                                             |
| `list [--json]`     | Each automation: status, timeout, next run, last run, last exit code, and whether its job is installed.                                                                               |

## 1. Write the automation

An automation is a folder `~/.claude/automations/<id>/`. The `<id>` has only the characters `a-z`, `0-9` and `-`. You write `automation.md`: YAML frontmatter, then the prompt.

```markdown
---
name: Update docs
schedule: |
  DTSTART;TZID=Asia/Amman:20261117T100000
  RRULE:FREQ=WEEKLY;BYDAY=MO,TH;BYHOUR=10;BYMINUTE=0
cwd: /Users/ezzabuzaid/Desktop/experiments/mutex
status: active
effort: medium
timeout: PT75M
---

/update-docs next
```

| Key               | Required | Value                                                                                                   |
| ----------------- | -------- | ------------------------------------------------------------------------------------------------------- |
| `name`            | yes      | The title of the notification.                                                                          |
| `schedule`        | yes      | RFC 5545: a `DTSTART` line, then an `RRULE` line. See step 2.                                           |
| `cwd`             | yes      | An absolute folder. The session runs there.                                                             |
| `status`          | yes      | `active` or `paused`.                                                                                   |
| `model`           | no       | A `claude --model` value. With none, the settings give the model.                                       |
| `effort`          | no       | A `claude --effort` value.                                                                              |
| `timeout`         | no       | An ISO 8601 duration for the whole run, resumes included. The default is `PT2H`.                        |
| `requiresAcPower` | no       | `true`: on battery power the run waits, and the next hourly check on AC power runs it.                  |
| `resume`          | no       | `times`, `while`, `prompt`. See step 4.                                                                 |

The script writes `state.json` and `run.log` in the same folder. Do not edit them. `memory.md` belongs to the runs: each run reads it first and adds what the next run needs.

## 2. Write the schedule

`DTSTART` is the first run. Write it in the time zone of the Mac (`node -p 'Temporal.Now.timeZoneId()'`), at a time in the future: a `DTSTART` in the past runs at the next hourly check. `RRULE` gives the repeats.

| The user says       | RRULE                                                   |
| ------------------- | ------------------------------------------------------- |
| every day at 9:00   | `FREQ=DAILY;BYHOUR=9;BYMINUTE=0`                        |
| weekdays at 8:30    | `FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR;BYHOUR=8;BYMINUTE=30` |
| Monday and Thursday | `FREQ=WEEKLY;BYDAY=MO,TH;BYHOUR=10;BYMINUTE=0`          |
| every 3 days        | `FREQ=DAILY;INTERVAL=3` (at the time of `DTSTART`)      |
| every 2 weeks       | `FREQ=WEEKLY;INTERVAL=2` (on the day of `DTSTART`)      |
| once                | `FREQ=DAILY;COUNT=1`                                    |

launchd checks each automation every hour at the minutes of its rule, and every minute for a rule that repeats more often than each hour.

## 3. Write the prompt for a run with no person

No person answers the run. It cannot ask a question, and the script refuses each permission prompt (`--permission-prompts none`). The permission mode comes from the settings. So the prompt says what to do, what to produce and where to write it. A prompt can be a skill call, such as `/update-docs next`.

## 4. Continue a run that stops early

A headless run ends at the first reply that has no tool call, also when work is still open. When the work has a list of open items, give the automation `resume`:

```yaml
resume:
  times: 2
  while: node /abs/path/tool.ts open
  prompt: |
    Your ledger still has open items:
    {stdout}
    Continue with them. If one is blocked, record what blocks it in the ledger.
```

After a run that is not an error, the script runs `while` with `/bin/sh -c` in the `cwd`. Exit 0 means that work is open: the script resumes the same session with `prompt`, and `{stdout}` becomes the output of `while`. Any other exit ends the run. Keep `times` at 2 or 3, so that a run that cannot finish stops. The check is the user's: it prints the open items, and it exits 0 only while an item is open with no named blocker.

## 5. Install it and show the next run

1. Run `sync`. When it names an automation with a reason, fix that file and run `sync` again.
2. Run `list` and tell the user the next run and the timeout.
3. For a new prompt, offer `run <id>`: it shows the result now, before the first run on the schedule.

## Change, run now, pause, delete

- A change to the prompt, `cwd`, `model`, `effort`, `timeout`, `requiresAcPower` or `resume` applies at the next run. It needs no `sync`.
- A change to `schedule` or `status`, a new folder and a deleted folder need `sync`.
- **Run now:** `run <id>`.
- **Pause:** set `status: paused`, then `sync`.
- **Delete:** move the folder to the Trash, then `sync`.

## What the user sees

After each run, a macOS notification gives the `name`, `done`, `failed (exit N)` or `timed out`, and the first line of the reply. It comes from `terminal-notifier` when that is on the PATH, and else from the `osascript` of macOS. With `terminal-notifier` and cmux both installed, a click on it opens a cmux workspace in the `cwd` with `claude --resume <session>`. Each run is a saved session, so `claude --resume` in the `cwd` also finds it.

## Traps

- **The Mac sleeps.** A run starts only while the Mac is awake and the user is logged in. When the Mac sleeps through one or more times, the automation runs one time after the Mac wakes. The script does not wake the Mac.
- **A run failed with no clear reason.** Read `run.log` (one line when a run starts and one when it ends, with the session), `state.json` (the last exit code and session) and the session itself with `claude --resume <session>` in the `cwd`.
- **`sync` installs nothing** when one automation is wrong, also for the correct ones. Read its message, fix the file, run `sync` again.
- **A run ends as `timed out` although its reply came.** A Stop hook of the user's settings is still running: `claude -p` does not exit while a hook runs, also an `asyncRewake` one. In the session's transcript, the `stop_hook_summary` gives each hook's `durationMs`. A hook that waits for a person must return at once when `CLAUDE_CODE_ENTRYPOINT` is `sdk-cli`, the value in a `claude -p` session.
- **The jobs run the bundle of the last `sync`.** A plugin update does not reach them until `sync` runs again.
- **Billing.** An `ANTHROPIC_API_KEY` or `claude --bare` makes a run use API credit. The script removes the key from each run. Do not add `--bare` to a prompt or a wrapper.

## Done when

- `sync` exits 0, and `list` shows the automation `active` and installed, with the next run the user asked for.
- The user knows the next run, the timeout, and that a notification comes after each run.
