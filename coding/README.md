# coding

The **Progressive Guardrails** output style, shipped as a native `/output-style`
component. Installing this plugin adds the style to the `/output-style` picker,
selectable like any built-in style. It layers three behaviors on top of the base coding
instructions (`keep-coding-instructions: true`):

- **Insights** — brief, codebase-specific educational notes before/after writing code.
- **Term checks** — flags when a word in your request conflicts with what the rest of
  the request describes, and proceeds on the likely intended term (or asks if ambiguous).
- **Guardrail blocks** — turns recurring pitfalls and your corrections into concrete,
  enforceable ESLint / TypeScript / Git hook / CI / Agent hook / Permission rule /
  Agent-Guidance recommendations. The guardrail skill picks the tool and confirms the check
  exists.

## How it works

Output styles are a first-class plugin component. The `.md` lives at
[`output-styles/progressive-guardrails.md`](./output-styles/progressive-guardrails.md)
(the default location — no `outputStyles` path needed in `plugin.json`). When the plugin
is enabled, Claude Code resolves the chosen style into the system prompt natively — not a
`SessionStart` hook injecting context. A native style is **selectable** via `/output-style`
and can fully replace the base coding instructions with `keep-coding-instructions: false`
(this one keeps it `true`, so the guardrails are additive).

## write-test skill

[`skills/write-test`](./skills/write-test/SKILL.md) decides which tests are worth writing
and how to write them black-box. Each test is gated on the break it catches, its claim is
checked against the request, and it is trusted only after a mutation proves it. Four agents
in [`agents/`](./agents) do the reading and the judging:

- **test-discoverer**: maps the repo's runner, surface, seams, and a precedent test.
- **test-claim-comparator**: checks the claim ledger against the request and the ticket,
  which it finds and fetches itself. It never reads the tests.
- **test-mutation-prover**: breaks the source in the memory of the test processes (or, for a
  claim only the type checker sees, in the memory of the project's own TypeScript), never in
  a copy of the tree, and reports CAUGHT or SURVIVED per test, using the skill's `scripts/`.
- **test-gotcha-reviewer**: checks the diff against the skill's gotchas.

The scripts have their own tests: `node --test skills/write-test/scripts/*.test.mjs`.

## remove-code skill

[`skills/remove-code`](./skills/remove-code/SKILL.md) stops you from owning code a
dependency already owns: it deletes hand-written workarounds, wrappers, and glue that the
tool provides officially, and reaches new goals through the tool's official API or config.

## guardrail skill

[`skills/guardrail`](./skills/guardrail/SKILL.md) turns a rule stated in words into a
check that a machine runs, or says why no machine can run one. It writes the violation that
a machine would see, picks the highest exact rung (eliminate, block, catch late, remind),
prefers a check that already exists, and proves that the check fires.
[`REFERENCE.md`](./skills/guardrail/REFERENCE.md) maps each place where a violation lives to
its tool.

## node-native skill

[`skills/node-native`](./skills/node-native/SKILL.md) reads a repo and reports what the
current Node LTS already does for it: dependencies with a native replacement (chalk →
`util.styleText`), hand-written code that re-implements a native API (a `deferred()` helper →
`Promise.withResolvers`), and calls to APIs that Node deprecated. The current LTS is the only
yardstick; the repo's declared Node version is ignored. Every claim comes from a probe that
ran: each module in [`catalog/`](./skills/node-native/catalog) runs a package and Node on the
same input and compares the results, row by row. The scan is read-only; `remove-code` applies
its findings.

[`skills/node-native-refresh`](./skills/node-native-refresh/SKILL.md) runs only when you
start it, after a new LTS ships. It rebuilds the surface snapshot (every API the LTS ships)
and runs every probe again, so a gap that Node has closed shows up as `gap-closed`.

The scripts have their own tests: `node --test skills/node-native/scripts/*.test.mjs`.

## lib-creator skill

[`skills/lib-creator`](./skills/lib-creator/SKILL.md) creates a library package from the
first question to the last consumer. It decides whether the library should exist (own
packages, native Node, npm, the Rule of Three) and where, takes the scope and the name from
the standard libraries of Go and .NET, puts the API on paper for review before any code,
scaffolds the package from the repo's newest package commit, tests it with `write-test`,
releases it the way the repo releases, and moves each consumer off its copy with
`remove-code`. [`references/RULINGS.md`](./skills/lib-creator/references/RULINGS.md) gives
the decision behind each step and how conflicting rulings were settled.

## update-docs skill

[`skills/update-docs`](./skills/update-docs/SKILL.md) keeps the docs of each library project
of a repository current from evidence: the project's commits, its consumers' call sites, Claude
Code transcripts and memories. The `docs-analyst` agent finds the gaps, one `docs-writer` agent
writes each picked file, and the blind `docs-judge` agent approves or rejects each draft before
the lead commits it. A tool in [`scripts/`](./skills/update-docs/scripts) owns every change to
git and to the ledger: a run claims its paths, stamps each draft, and commits only what the
stamps prove is its own, so peer sessions in the same checkout keep their edits. A repository
opts in with `.claude/update-docs.json`, which names its docs guide, its map file and the paths
no run may claim. `/coding:update-docs all` runs one lead subagent per due project.

## automations skill

[`skills/automations`](./skills/automations/SKILL.md) makes, changes, pauses, runs and lists
Claude Code prompts that run headless on a schedule on a Mac, through launchd and `claude -p`
on the usage of the Claude plan, with no open session. An automation is a folder under
`~/.claude/automations/` with an RFC 5545 schedule. The script ships as
[`scripts/dist/automations.mjs`](./skills/automations/scripts/dist/automations.mjs), the
source and its packages bundled by `npm run build`, so it runs from the plugin with no install;
a test fails while the bundle does not match the source. `sync` copies the bundle to
`~/.claude/automations/runner.mjs`, which the launchd jobs run, so a plugin update reaches
them at the next `sync`. macOS and Claude Code only.

The script has its own tests: `npm test` in `skills/automations/scripts`.

## Install

```
/plugin marketplace add ezzabuzaid/agent-plugin
/plugin install coding@ezzabuzaid
```

Run `/reload-plugins` (or restart) to load it.

### Codex

Codex reads the same `.claude-plugin` manifests:

```
codex plugin marketplace add ezzabuzaid/agent-plugin
codex plugin add coding@ezzabuzaid
```

Update with `codex plugin marketplace upgrade ezzabuzaid`. All the skills load. Codex plugins
can't ship agents, so write-test starts a general subagent with each agent's file as its
brief. The output style is Claude Code only; Codex ignores it.

## Selecting the style

Output styles are switched with the `/output-style` command:

1. Type `/output-style` and press Enter — a picker lists every installed style.
2. Choose **Progressive Guardrails**.

The choice persists per project (in `.claude/settings.local.json`) and stays active until you switch. Run `/output-style` again anytime to change it or return to `default`.
