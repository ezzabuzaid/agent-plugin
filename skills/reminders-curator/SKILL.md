---
name: reminders-curator
description: Mine every AGENTS.md and CLAUDE.md across local repos for guidance that repeats, then encode each repeated rule as an event-triggered reminder in the ezzs-way-of-coding hook so it stops being copy-pasted into every repo. Use whenever the user wants to curate or consolidate reminders, deduplicate AGENTS.md/CLAUDE.md guidance, "remove repetitiveness" across agent files, turn agent-file rules into hooks, or asks why the same instruction lives in several AGENTS.md files — even if they only say "my agent files keep repeating themselves".
---

# Reminders Curator

Guidance duplicated across AGENTS.md/CLAUDE.md files costs context in every
session of every repo, drifts as copies get edited independently, and still
misses new repos. A hook reminder fires once, event-scoped, everywhere — the
right home for any rule that has proven it generalizes by appearing in two or
more places.

## Locations

- Hook + rules: `~/Desktop/January/agent-plugin/hooks/ezzs-way-of-coding/`
  (`rules.ts` holds `reminderRules`; `rules.test.ts` is the black-box suite;
  both Claude and Codex execute `hook.ts` on their hook events)
- Explorer CLI: `cli.ts` in the same folder
- Predicate reference: the package types at
  `node_modules/@deepagents/experimental/dist/coding-agent-reminders/types.d.ts`
  and `predicates/*.d.ts` in that folder — read them before writing a `when`

## Workflow

### 1. Inventory

```sh
node ~/Desktop/January/agent-plugin/hooks/ezzs-way-of-coding/cli.ts --json
```

Returns every folder holding a CLAUDE.md/AGENTS.md with paths, sizes, and
modified dates. Narrow with repeatable `--root <dir>` when the user scopes the
sweep.

### 2. Read and extract

Read each discovered file. With more than ~10 files, fan out subagents —
each reads a subset and returns candidate rules as
`{ rule: <one-sentence normalized statement>, file, quote }`. Normalize
aggressively: "never use jest" and "we strictly use the node test runner" are
the same rule.

### 3. Cluster

A rule qualifies for migration only when ALL of these hold:

- It appears (semantically, not verbatim) in **2+ files**.
- It is a **behavior** rule — how to work — not a repo fact. Repo-specific
  paths, commands, ports, schema names, and domain glossaries stay in their
  files; a reminder that fires in every repo must be true in every repo.
- It is **not safety-critical**. "Never push to main" style prohibitions must
  stay always-loaded in the files; reminders are contextual and may not fire
  when it matters.

Report the clusters to the user before encoding: rule, where it appears,
proposed trigger.

### 4. Encode

Add one `ReminderRule` per cluster to `reminderRules` in `rules.ts`:

- **target/events** — prompt rules (`UserPromptSubmit`) for "when asked to X"
  guidance; tool rules (`PostToolUse`/`PostToolUseFailure`) for "when Y
  happens" guidance; session defaults only for the rare rule that applies to
  every turn.
- **when** — compose the package predicates (`contentPattern`, `toolCall`,
  `and`/`or`/`not`). Patterns must be precise enough that the reminder feels
  earned when it fires: require two independent signals (verb AND object) the
  way the existing `package-api-first` rule does.
- **False-positive discipline** — never grep free content for failure-ish or
  topic-ish words alone; a successful file read that merely *mentions* the
  topic will trigger it. Anchor on structured signals (event names, tool
  names, `toolCall({ state })`) or CLI-authored prefixes, the way
  `batchHasFailedCall` in rules.ts matches `^Error: ` per result instead of
  grepping the joined batch text. That predicate exists because the word-grep
  version fired on every file that discussed errors.
- **message** — short, imperative, and carrying the *why*, so the agent can
  apply the rule to situations the pattern authors never saw.

### 5. Test

Every new rule gets black-box tests in `rules.test.ts` through
`evaluateReminderHook` (no lifecycle hooks; self-contained AAA): one prompt
that must fire it, and one near-miss that must not — the near-miss is what
keeps patterns honest. Then:

```sh
npm test --prefix ~/Desktop/January/agent-plugin/hooks/ezzs-way-of-coding
```

### 6. Trim the sources

For each migrated rule, propose — never auto-apply — removing the
now-redundant lines from each source AGENTS.md/CLAUDE.md, quoting every
removal verbatim so the user can judge and restore. Checked-in files are the
user's to approve per repo; apply only what they confirm, as ordinary
working-tree edits they review in `git diff`.

## Output

End with a table: rule → files it was mined from → rule id in rules.ts →
trigger summary → sources trimmed or pending. Remind the user that running
sessions snapshot hook config at startup, so new reminders appear from the
next session.
