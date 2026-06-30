# coding

The **Progressive Guardrails** output style, shipped as a native `/output-style`
component. Installing this plugin adds the style to the `/output-style` picker,
selectable like any built-in style. It layers three behaviors on top of the base coding
instructions (`keep-coding-instructions: true`):

- **Insights** — brief, codebase-specific educational notes before/after writing code.
- **Term checks** — flags when a word in your request conflicts with what the rest of
  the request describes, and proceeds on the likely intended term (or asks if ambiguous).
- **Guardrail blocks** — turns recurring pitfalls and your corrections into concrete,
  enforceable ESLint / TypeScript / CI / Agent-Guidance recommendations, researching the
  real rule before naming it.

## How it works

Output styles are a first-class plugin component. The `.md` lives at
[`output-styles/progressive-guardrails.md`](./output-styles/progressive-guardrails.md)
(the default location — no `outputStyles` path needed in `plugin.json`). When the plugin
is enabled, Claude Code resolves the chosen style into the system prompt natively — not a
`SessionStart` hook injecting context. A native style is **selectable** via `/output-style`
and can fully replace the base coding instructions with `keep-coding-instructions: false`
(this one keeps it `true`, so the guardrails are additive).

## Install

```
/plugin marketplace add ezzabuzaid/agent-plugin
/plugin install coding@ezzabuzaid
```

Run `/reload-plugins` (or restart) to load it.

## Selecting the style

Output styles are switched with the `/output-style` command:

1. Type `/output-style` and press Enter — a picker lists every installed style.
2. Choose **Progressive Guardrails**.

The choice persists per project (in `.claude/settings.local.json`) and stays active until you switch. Run `/output-style` again anytime to change it or return to `default`.
