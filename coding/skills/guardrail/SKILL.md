---
name: guardrail
description: Turns a rule stated in words ("never use enums", "never git stash", "tests never override env") into a check that a machine runs, or says why no machine can run one. Picks the tool and the rung, confirms that the check exists, is exact and has a trigger, and names its home. Use when a user correction, a review finding, a memory audit or a skill audit names a rule that a check could enforce; when someone says "add a lint rule", "make this a hook", "enforce this" or "turn this memory into a rule"; and before you write a rule into AGENTS.md, CLAUDE.md, a memory or a skill.
---

# Guardrail

This skill applies _policy as code_. A check runs on every change. Prose works only when someone reads it and obeys it. Thus a rule goes into a check when a check can see it, and docs keep only what no check can see. The tool for each place is in [REFERENCE.md](REFERENCE.md).

Copy this checklist into your response and tick it off as you go:

```
- [ ] The test: violation written, place named, exactness measured
- [ ] The ladder: rung picked
- [ ] Tool: existing one found, or new one justified
- [ ] Home: named from the destination policy
- [ ] Trigger: something runs the check
- [ ] Proof: violating probe fails, good case passes
- [ ] Remainder returned to the caller
```

## The test

Use this section alone in a subagent prompt when the subagent does not load the skill.

1. **Write the violation.** Write one concrete example that a machine would see: a line of code, a command, a commit message, a file path or a CI state. If you cannot write an example, a machine cannot check the rule. Return the rule to the caller.
2. **Name where the violation lives.** Find the place in the tables of REFERENCE.md: in the code, around the code, or in the agent.
3. **Measure whether the check is exact.** An exact check fires on real violations and almost never on good code. Run the check on the real codebase or on its history, and count the hits. If more than about 1 hit in 10 is on good code, the check is not exact. This is the bar from Google's Tricorder static-analysis work (Sadowski et al.). A violation that a tool can see, but that depends on intent, is not exact. For example, `grep … | head` is correct as a preview and wrong as a count of callers, and no tool can see which use the author intended.

## The ladder

This ladder comes from the hierarchy of controls (NIOSH) and from poka-yoke (Shingo).

1. **Eliminate.** Nobody can write the mistake: a type, a removed API, a standard helper or a changed default.
2. **Block.** The tool refuses the mistake when someone makes it: a type error, a lint error in a gate, a permission `deny` rule, a PreToolUse hook or a commit-msg hook.
3. **Catch late.** A later run finds the mistake: a test, a CI step or a runtime schema.
4. **Remind.** Text tells the reader: a reminder, a memory, instructions or skill text.

Start at rung 1. Take the first rung where the check is exact. If two checks are equal, take the check that fires earlier: type check, then commit, then CI, then the remote repo.

## Steps

1. **Run the test.** Done when: you have the violation, its place and the measured hit count, or the rule went back to the caller.
2. **Pick the rung.** Done when: you named the highest rung with an exact check, and why each higher rung fails.
3. **Prefer what exists.** Look in this order: a check that the repo already configures; a built-in or core rule or option; a maintained package; custom code last. For a package, search the registry and read the plugin's rule list. Look at its maintenance and its last publish. If a broader existing rule can cover the case after a small change to the code, change the code before you write an exact custom rule. Never name a rule, flag, target or hook event from memory. Confirm in the tool's docs or source that it exists. Before you change an existing default, rule or config, find out why it is so: search the history (git log, ADRs, the backlog, memories). If it was a deliberate choice, return the change to the caller as a decision. Done when: each name you give has a source.
4. **Name the home.** Read the destination policy from the user's instructions (CLAUDE.md) or from the repo's AGENTS.md. For example, a rule that is true for every repo can have a different home than a rule for one repo. When a package owns the tool, follow the docs of that package. Never invent a home. If the policy names no home for this kind of tool, propose the narrowest home that covers every place where the rule applies, and mark it `proposed` for the caller. Done when: the home is a file or a package that the policy names, or a marked proposal.
5. **Confirm the trigger.** Find what runs the check: a CI step, a target that depends on lint, a pre-commit hook or a registered agent hook. If nothing runs it, the check is only a reminder. Done when: you named the gate and the event that starts it.
6. **Prove it.** Make a probe that violates the rule, and see the check fail. Run the good case, and see it pass. For a rule set in config, confirm the value that wins, for example with `eslint --print-config <file>`. ESLint flat config replaces the options of a rule by its key, and a later config object silently replaces an earlier one. Done when: you have the output of the failing probe and of the passing good case. If you cannot run the probe (for example, the task is read-only), write why and the exact command that runs it.
7. **Split the remainder.** The part of the rule that the check does not cover stays a reminder. Done when: you return the remainder in the output, or write `none`.

## Output

Return this block to the caller:

```
GUARDRAIL
rule:      <the rule in words>
violation: <one concrete example a machine would see>
lives in:  <types | code | workspace files | commit | commit message | push | CI | remote repo | agent command | agent edit | turn end | none>
rung:      <eliminate | block | catch late | remind>
tool:      existing: <name> | new: <name> — <why nothing existing fits>
home:      <file or package, per the destination policy> | proposed: <home>
exact:     <yes | no> — <hits on good code, measured: N of M>
trigger:   <what runs it>
proof:     <probe that failed; good case that passed> | not run: <why>; <command that runs it>
remainder: <what no check covers, returned to the caller> | none
```

## What stays with the caller

- A rule that no machine can check, and the remainder of each rule. The caller decides where it goes: a memory, docs or a skill.
- The order of many rules. To rank them, the caller multiplies how often the mistake comes back by the cost of one miss. This skill decides one rule at a time.
