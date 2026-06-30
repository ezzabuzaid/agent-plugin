# progressive-guardrails

Ships the **Progressive Guardrails** output style as a native, distributable plugin
component. Installing the plugin makes the style appear in the `/output-style` picker,
selectable like any built-in style. It layers three behaviors on top of the base coding
instructions (`keep-coding-instructions: true`):

- **Insights** — brief, codebase-specific educational notes before/after writing code.
- **Term checks** — flags when a word in your request conflicts with what the rest of
  the request describes, and proceeds on the likely intended term (or asks if ambiguous).
- **Guardrail blocks** — turns recurring coding pitfalls and your corrections into
  concrete, enforceable ESLint / TypeScript / CI / Agent-Guidance recommendations.

## How it works

Output styles are a first-class plugin component. The `.md` file lives at
[`output-styles/progressive-guardrails.md`](./output-styles/progressive-guardrails.md)
(the default location — no `outputStyles` path needed in `plugin.json`). When the plugin
is enabled, Claude Code resolves the chosen style into the system prompt natively — this
is **not** a `SessionStart` hook injecting context.

Unlike the always-on hook pattern, a native style is **selectable**: you switch to it via
`/output-style` and away from it the same way, and it can fully replace the base coding
instructions by setting `keep-coding-instructions: false` in the frontmatter (this plugin
keeps it `true` so the guardrails are additive).

## Install (for others)

This plugin lives in the `local-plugins` marketplace. To distribute it, publish the
marketplace directory (or a copy of this folder under its own
`.claude-plugin/marketplace.json`) to a git repo, then have people run:

```
/plugin marketplace add <owner>/<repo>
/plugin install progressive-guardrails@<marketplace-name>
```

Then `/output-style` → select **Progressive Guardrails**.

## Source of truth

The shipped style is a copy of the canonical file at
`text2sql/.claude/output-styles/progressive-guardrails.md`. When you edit the canonical
style, re-copy it here so the plugin stays in sync:

```sh
cp /path/to/text2sql/.claude/output-styles/progressive-guardrails.md output-styles/progressive-guardrails.md
```

Note: if you have both the project-level style file and this plugin enabled, `/output-style`
may list **Progressive Guardrails** twice (same name, two sources). Keep only one source
active to avoid the duplicate.
