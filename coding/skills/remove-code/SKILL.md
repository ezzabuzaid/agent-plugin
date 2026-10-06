---
name: remove-code
description: >
  Stop owning code the tool already owns. Delete hand-written workarounds, wrappers,
  monkey-patches, forks, and glue that a dependency provides officially — and reach new
  goals through a tool's official API or config seam instead of writing code. Applies to
  additive work, not only deletion: if the change adds a wrapper around a package's API,
  restates its defaults, or hand-writes constants it exports, this skill is the subject.
  Also applies to code written moments ago in this same session.
---

## Contract

Behavior preservation is the contract. A change you cannot prove equivalent is a **finding
you hand to the developer**, not a change you accept quietly.

Three precedence rules, because these clauses collide in practice:

1. **Hand it over _before_ applying it.** A behavior change disclosed in the closing report
   is not consent. If the only way to complete a removal is to change observable behavior,
   stop and ask first.
2. **Rewriting a line puts it in scope.** A forbidden default or optional that already
   existed is yours the moment your diff touches its line. Remove it or raise it as an
   explicit decision. "Pre-existing, so I carried it through" is not an answer.
3. **Preserve the constraint, replace the mechanism.** When archaeology (step 4) shows a
   guard encodes a live constraint, the *mechanism* is legacy, the *constraint* is not.
   Replace the mechanism and cite the commit. This is the one licensed exception to
   "legacy code must be removed" — take it deliberately, never by drifting into it.

## Why this exists

Fixing things by removing code works because most of our code is not ours to write. A tool
already does it, and we hand-rolled it because we never looked. The target is not fewer
lines — it is **less surface we maintain**. Trading twenty of our lines for a new dependency
is usually a bad deal; trading twenty of our lines for a flag the installed package already
exposes is always a good one.

## Procedure

Every step has a **completion criterion**. A step is not done because you thought about it;
it is done when its artifact exists in your report. Steps are ordered — later steps
routinely delete the output of earlier ones, and that is the point.

### 1. Scope — enumerate before you edit

List the removal candidates and state which you are acting on. On a bare invocation with no
target, this is the whole first move: sweep the session's diff and the surrounding module,
and name every candidate you can see.

**Done when:** the candidate list is written down and the chosen scope is stated, before the
first edit.

*Why:* a bare invocation with no enumeration step produces nothing. In one session the run
answered a follow-up question and removed zero lines, while the module in context held a
function whose own comment declared it a copy of the SDK's built-in transport. In another,
the target was picked from working memory and the actual changed set — 23 files — was
discovered only after all edits were written.

### 2. Discover — search the tool for the capability, don't explain the tool

"Read the source" is satisfied by reading almost anything, which is why it keeps failing.
Read for **capability**, not behavior, and search these surfaces in order:

- the package's **export map** (`exports` in its `package.json`) and public entry — a symbol
  reachable only from an internal `.d.ts` is not public API
- its **options/config type** — the flag you want is usually already a field
- its **exported constants and enums** — never hand-write a literal the package standardizes
- the **shipped runtime** (`dist/*.js|mjs` when only built output ships) — declarations prove
  an option exists but never how two options *interact*
- **env vars and debug hooks** — grep for `TRACE`, `DEBUG`, `VERBOSE`, `process.env.` before
  building any observation, timing, or reproduction harness
- if the integration layer has no hook, **search one layer down** — the package that actually
  produces the behavior

**Done when:** your report lists the official APIs you found and, for each one you rejected,
the reason. A search that finds nothing is recorded as *searched and absent*, never as
silence.

*Why:* every failure in the corpus was a run that did read source — the wrong surface. One
read a detector's implementation and then hand-wrote four constants the sibling package
exports. One read `.d.mts`, configured two options, and learned from `dist/*.mjs` that they
are mutually exclusive, having already shipped a dead callback. One deeply enumerated a
packager's four tree walks and still designed a ~200-line bespoke probe, when
`ELECTRON_FORGE_TRACE_FILE` was one grep away. One concluded "no upstream provider exists"
from a **first-party** `versions.tf` — reading what we declared, not what upstream ships.

### 3. Radius — measure before you ask

Grep every consumer of what you are removing. Include consumers no compiler and no import
graph can see: **literal strings** in shell scripts, CI harnesses, and log assertions;
config-named entries; dynamic or slug-resolved paths. When a symbol has moved or been
renamed, search history across the rename, not the current path alone.

**Done when:** you have a count and a list, and any question you put to the developer quotes
that measured count.

*Why:* one run asked the developer to approve "the two postgres + one sqlserver sites",
then found nine the moment approval landed. Another nearly renamed a log string that the
repo's only auto-update E2E greps for verbatim. A third concluded a symbol was never called
because `git log -S` on the current path does not follow renames — the caller was there all
along.

### 4. Boundary — check against what is not removable

Before deleting anything, run it past the list below. If it matches, it is reported as
**retained surface with a reason**, not deleted, and not offered as a recommended deletion.

### 5. Prove — name the observation, then edit

Name the observable that would differ if you broke something, *before* you make the change.
Verify **per removal**, not once at the end of a batch.

A compiler, a linter, and a formatter prove the code parses. They are a precondition, never
the proof. Reading a dependency's types or source is **discovery** — it proves what the tool
offers, never that your removal is safe.

- Capture the **baseline first** — run the repo's checks before touching anything and note
  what already fails, so a pre-existing or concurrent failure cannot be mistaken for yours.
- Prefer an executable assertion the repo already owns over reasoning from source.
- After a bulk edit, **grep the old shape to zero**. A patch that reports success is not
  evidence the sites are gone.
- Name the proof boundary honestly: if two of seventeen touched projects were executed, say
  "2 executed, 15 covered only by identical-edit verification."

This skill names no repo-specific tooling on purpose. Get the exact commands —
typecheck, isolating the real compiler from the linter, running tests, and the
repo-wide grep after a rename — from the repo's own agent instructions
(`AGENTS.md` / `CLAUDE.md`) before you need them, not while reporting. A repo that
documents none is itself a finding worth handing back.

**Done when:** every removal has a named, executed observation, or is listed as *unproven*
at the top of the report — not as a closing caveat.

*Why:* one run closed with "build ✓, eslint ✓, prettier ✓, `fmt -check` ✓" having just
shipped staging logs stamped `environment: "production"` into the production stream. One
batched eleven edits across four files before its first verification and had to unwind the
first edit from a fourteen-error pile. One spent five turns proving a red build belonged to
another agent because no baseline was taken.

### 6. Self-audit — apply all of the above to what the change ADDED

Re-read your own diff and run steps 2–5 against it. Grep it for `??`, `||`, `?:` fallbacks,
new optional markers, defaults, and compat branches added to satisfy a type checker. Ask
what the adoption you just made has rendered dead — comments, guards, branches, tests, and
premises inherited from the mechanism you replaced.

**Done when:** the audit result is written down, including "nothing found".

*Why:* this is the single most-repeated correction in the corpus. In one session the
developer had to re-invoke the skill on the agent's own diff; the second pass found a
six-hour timer and a platform branch the first had missed. In another, the skill's rules
were tightened mid-session and re-invocation immediately surfaced five more violations. A
run that adds a wrapper around a tool it never searched has broken step 2 in the opposite
direction — the capability search applies to code you write, not only code you delete.

### 7. Report

Lead with the verdict. Then, in this order:

- **Removed** — each construct, and the observation that proved it safe
- **Net delta** — lines added vs. deleted, counting files you created. If the run is
  net-additive, say so and justify it
- **Retained** — everything inspected and deliberately kept, with the reason. Include the
  container: the file the removed code lived in, its docs, its tickets, and any scaffolding
  you created. A probe script's value is spent once it answers — delete it and keep the answer
- **Rejected** — candidates you evaluated and ruled out, each labelled REJECTED with why.
  Never list alternatives without verdicts attached; a bare list reads as a proposal
- **Unproven** — anything whose equivalence is reasoned rather than observed
- **Unresolved** — anything you asked about and got no answer on. It does not silently ship;
  it gets a durable tracked record

"Keep it — verified irreducible" and "nothing was removable" are legitimate, **required**
outcomes. State them explicitly; an omission is not an answer.

## What is not removable

The absence of a consumer is not evidence of death. Establish *why* something is unused
before proposing its deletion.

- **Outward-facing surface** — response headers, public exports, emitted telemetry fields.
  Their consumers are outside the repo, so an in-repo count proves nothing.
- **Deliberately provided surface** — exported symbols, injected context variables,
  extension points, type augmentations. Zero current consumers is the normal state.
- **Code unreachable for a static reason** — type narrowing, a lint ban, or a compiler
  requirement. A type annotation on an exported value can be required by declaration emit
  even when the checker calls it redundant.
- **Code that is unreachable by accident** — a missing caller is a defect to fix, not dead
  weight to delete. Diagnose *why* it is unreachable and hand that classification over.
- **A guard whose commit message encodes a live constraint** — see Contract rule 3.
- **A safety or security control** — never dropped unilaterally as part of a cleanup.
- **Our code that a new dependency would replace** — fewer lines is not the goal, and adding
  a tool unasked is not a removal.
- **Code the developer asked for by name** — a new premise invalidating its rationale is a
  reason to raise it, not to delete it silently.

## What is not allowed

- **Defaults** are forbidden unless you cannot physically avoid declaring one. Before
  writing a fallback for a value a dependency produces, cite the line in that dependency's
  source where the value can be absent. No citation, no fallback.
- **Optional values as an escape hatch** to get work done quickly. An optional that makes an
  honest type honest is fine; one that lets you skip a decision is not.
- **Backward-compatibility code.** Legacy is a liability — subject only to Contract rule 3.
- **Suppression directives** — a lint disable you add is an escape hatch too. Prove it still
  suppresses a live diagnostic, under the config that owns the rule, or delete it.
- **Filtering a dependency's payload** — an ignore rule, prune glob, or packaging exclusion
  is never an alternative to deleting the dependency. If it cannot be deleted now, say so
  and stop.
- **Substitution disguised as removal.** Swapping call X for call Y removes nothing. If a
  value is being flattened or stringified, ask whether that conversion belongs at this layer
  at all — usually the right removal is the call, not its options.
- **Changing a site because the pattern matched.** Every changed site needs a named consumer
  that observes the difference. Sites without one are listed as unproven, not shipped.

## Asking the developer

When the blast radius is genuinely large, ask — but ask well:

- Measure the radius first (step 3) and quote the number.
- Name what is at risk by **identifier**, not by count.
- Recommend the option that **removes more**, unless you can name the behavior it breaks.
- Never ask about a tool's own defaults. Adopt the native behavior and move on.
- Do not spend a question on code this session introduced that violates the rules above.
  Delete it. The escape hatch is for pre-existing code with real radius.

## Delegation

If any part of this work goes to a subagent, the delegation prompt carries this skill's
constraints **verbatim** — the same way repo conventions are transplanted. A delegate's
verification is not proof: independently re-run the equivalence check before relaying it as
established fact.

*Why:* a delegating agent copied four repo conventions into its subagent prompt and zero
skill constraints. The subagent wrote forty lines of custom code, then self-invoked this
skill hundreds of messages later to delete its own work. It survived by luck.
