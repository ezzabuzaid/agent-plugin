# Rulings behind automations

Each rule in [SKILL.md](../SKILL.md) and each choice in [scripts/automations.ts](../scripts/automations.ts) comes from a decision Ezz made or from a fact that a probe showed. Each entry gives his words (profanity edited out), what happened, and the source. All entries come from the session of 2026-11-16 that built the skill (session `8bb77e31`, plan `~/.claude/plans/recursive-seeking-swing.md`), unless the entry names another source. A memory is cited as `project/file` under `~/.claude/projects/-Users-ezzabuzaid-Desktop-<project>/memory/`.

## Why a local runner on launchd

**Local, with no open session.** _"not cloud but local? not [...] schedule and cron tools"_. Claude Code had three schedulers, and none did the job: `/schedule` runs in the cloud and cannot see the files of this Mac; `/loop` and the Cron tools stop with their session; the scheduled tasks of Claude Desktop run only while the app is open.

**launchd through @zukhruf/launchd, with `claude -p`.** Ezz chose "@zukhruf/launchd + claude -p" over Desktop's tasks and a community plugin. launchd keeps the timer, so no app must be open. @zukhruf/launchd already installs a job as a reconcile and waits until a bootout is done. `experiments-mutex/immediate-launchd-package.md`

**`claude -p` uses the plan, not API credit.** Ezz's premise was _"claude -p incur usage credit cost and not sub credit"_. The Help Center says the opposite: "Update June 15, 2026: We've paused the previously-announced changes to Claude Agent SDK usage. [...] `claude -p` [...] still draw[s] from your subscription limits" (support.claude.com, article 15036540). A probe agent under launchd, with only `HOME` and `PATH` in its environment, showed `apiKeySource: "none"`: the claude.ai login of the Max plan.

**The run waits for the Mac; it does not wake it.** Ezz answered "No, run on wake". launchd starts a `StartCalendarInterval` job one time after a wake for all the times that the Mac slept through (launchd.plist(5), lines 372-375). A `StartInterval` time in a sleep is lost (lines 357-362), so the script uses only calendar intervals.

## The schedule

**RFC 5545, DTSTART and RRULE.** A cron expression cannot say "every 3 days" or "every 2 weeks", and the first consumer wanted docs updated _"like every few days"_ (`experiments-mutex/update-docs.md`). rrule-temporal parses the rule on the native `Temporal` of Node 26; the `rrule` package had no release after 2023.

**The rule is the only source of truth.** launchd checks each automation every hour at the minutes of its rule (every minute for a finer rule), and `run --if-due` asks the rule whether a time came after the last run. So one code path covers "every 3 days", "every 2 weeks" and `COUNT=1`, which a launchd calendar cannot express. A `DTSTART` in another time zone moves the minute of the check to the clock of the Mac.

## Each run

**`$HOME/.local/bin/claude`, never the `claude` on PATH.** In a cmux terminal, `command -v claude` gave a shim in a temporary folder under `/var/folders`. The native installer's link at `~/.local/bin/claude` moves to each new version.

**The node of the installer comes first on the job's PATH.** Every hook of Ezz's settings runs a bare `node`, which lives in the nvm folder. Under launchd's default PATH, the hooks could not start, and a hook that cannot start blocks nothing: the shell guard would be off in each run. The probe showed SessionStart, UserPromptSubmit and Stop hooks with exit 0 after the fix.

**No API key, no `--bare`.** The Help Center: "If you have an ANTHROPIC_API_KEY environment variable set on your system, Claude Code will use this API key [...] resulting in API usage charges" (article 11145838). `--bare` skips the OAuth login. The script removes the key from the environment of each run.

**No permission prompts, the Mac awake, a time limit.** Ezz approved "No-prompt + keep-awake + timeout" for every run: `--permission-prompts none`, because no person can answer; `caffeinate -is` for the whole run, after his rule for long runs (`experiments-mutex/long-runs-need-caffeinate.md`); and a per-task ISO 8601 `timeout`. For the default he chose _"2 hours"_: room for runs with many agents, and a hung run ends the same day. A hung run must end, because launchd never starts a second process of a job that runs.

**The unattended end-of-turn text, from the first request.** Ezz approved "Unattended end-of-turn prompt". The Opus 5.5 prompting guide gives a system-prompt addition for unattended agentic runs, and says: "Add it at the end of your system prompt from the first request of the session: adding it partway through changes the `system` prompt and invalidates the conversation's earlier thinking blocks". The script appends it word for word, with the memory note, and sends the same text on each resume. `experiments-mutex/opus-5-5-prompting-guide.md`

**A bounded resume.** Ezz approved "Bounded resume loop". The guide: a reply with no tool call is "a report rather than [...] proof the task is done", and "stop after two or three automatic continuations on the same task rather than repeating them indefinitely, so that a run that is genuinely stuck ends and can be reviewed". `--resume` keeps the session id: a resume of a scheduled run came back with the same `session_id`.

**AC power, when the task asks for it.** Ezz approved "Skip on battery". On battery the check skips the run and leaves `lastRunAt` as it was, so the next hourly check on AC power runs it. `experiments-mutex/long-runs-need-caffeinate.md`

**No `ProcessType: Background`.** launchd limits the resources of a Background job, which would slow the builds and tests that a run starts. The job has no `ProcessType`, as the context-compiler job has none.

**A failure is the exit code or `is_error`, never `subtype`.** A captured reply of claude 2.1.325 to an unknown model had exit 1, `is_error: true` and `subtype: "success"`.

## What the user sees

**A notification after every run.** Ezz chose "Notify every run": the first line of the reply, and a click that shows the session. terminal-notifier runs the click command with `/bin/sh`. The command is `cmux workspace create`, because Ezz's terminal is cmux (`experiments-mutex/terminal-is-cmux.md`) and cmux calls `new-workspace` a legacy alias. A click opened the resumed session of a scheduled run, with its history.

## Where the skill lives

**One skill folder, with its script inside.** _"use proper folder structure for this skills and the structure the skill itself to how I like to create skills"_. The script and its test moved from `tools/automations/` into `scripts/`, as `write-test` keeps `mutate.mjs` and its test, and the rules went into this file, as `lib-creator` and `write-test` keep theirs.

**The skill describes this runner only.** Ezz asked to take out every mention of the tools that the design learned from: _"there is no need to put it in the skill"_.
