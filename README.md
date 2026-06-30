# agent-plugin

A Claude Code plugin marketplace by [@ezzabuzaid](https://github.com/ezzabuzaid).

## Install

```
/plugin marketplace add ezzabuzaid/agent-plugin
/plugin install coding@ezzabuzaid
```

(Private clone? Use `git@github.com:ezzabuzaid/agent-plugin.git` in place of the shorthand.)

## Plugins

### coding

The **Progressive Guardrails** output style, shipped as a native `/output-style`
component. Three layers on top of normal coding work:

- **Insights** — brief, codebase-specific educational notes as you work.
- **Term checks** — flags when a word in your request conflicts with what the rest of
  the request describes.
- **Guardrail blocks** — turns recurring pitfalls and your corrections into concrete,
  enforceable ESLint / TypeScript / CI / Agent-Guidance recommendations, researching the
  real rule before naming it.

After install: `/output-style` → **Progressive Guardrails**.
