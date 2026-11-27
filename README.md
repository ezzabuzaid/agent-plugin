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
  enforceable ESLint / TypeScript / Git hook / CI / Agent hook / Permission rule /
  Agent-Guidance recommendations. The guardrail skill picks the tool and confirms the check
  exists.

It also ships the **write-test** skill and its four test agents (discoverer, claim
comparator, mutation prover, gotcha reviewer), the **remove-code** skill, the
**guardrail** skill, which turns a rule stated in words into a check that a machine runs,
the **node-native** skill, which reports what the current Node LTS already does for a
codebase, each claim proved by a probe, the **lib-creator** skill, which creates a library
package from the decision that it should exist to the last consumer that moves onto it, and the
**update-docs** skill and its three docs agents, which keep each library project's docs current
from evidence, the **automations** skill, which runs Claude Code prompts headless on a schedule on
a Mac, through launchd, and the **rollover** skill and mod, which give a session a fresh context at
93% context use: the agent writes a continuation, the mod runs `/clear` and the session resumes from
it. See
[coding/README.md](./coding/README.md).

## Selecting the style

After installing, run `/reload-plugins`, then switch styles with `/output-style`:

1. Type `/output-style` and press Enter to open the picker.
2. Choose **Progressive Guardrails**.

The choice persists per project and stays active until you pick another style.
