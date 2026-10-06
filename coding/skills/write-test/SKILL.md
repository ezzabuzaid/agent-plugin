---
name: write-test
description: Decides which tests are worth writing and how to write them black-box. Gates each test on the break it catches, discovers the repo's real entry point and upstream seams, and checks the gotchas that turn tests into false positives. Use when writing, reviewing, extending, or refactoring tests; when a feature or bug fix adds or changes tests even if nobody said "test"; when resuming test work from an earlier session; or when a change seems to "need" a test seam, fixture, mock, or export.
---

# Write Test

A test earns its place by catching a real break through the surface a user or caller actually touches. This skill gives you the gate for that, how to discover each repo's real seams, and the gotchas that make tests lie. The evidence for each gotcha (Ezz's words, the incident, the source memory) is in [references/RULINGS.md](references/RULINGS.md).

Copy this checklist into your response and tick it off as you go:

```
- [ ] test-discoverer map in hand — <run | skipped: why>
- [ ] Claim ledger written from the requirement, failure modes first
- [ ] test-claim-comparator: nothing unclaimed or weakened — <run | skipped: why>
- [ ] One RED → GREEN at a time, in ledger order
- [ ] test-mutation-prover: every test CAUGHT — <run | skipped: why>
- [ ] test-gotcha-reviewer: every finding fixed or answered — <run | skipped: why>
- [ ] Done when
```

A tick names its evidence: the agent run behind it, or `skipped:` and why. A tick with neither claims a step that never happened.

Four subagents do the work that needs a lot of reading or an independent judge. Each one's procedure and gotchas live in its own agent file, so don't repeat them here.

| Agent                   | When                                                                                 | You pass                                                                                                 | You get back                                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `test-discoverer`       | Before the first test                                                                | Repo root, the behavior to test                                                                          | Runner, surface, seams, real in-process forms, precedent and non-precedents, state, isolation, each cited      |
| `test-claim-comparator` | After the ledger, before the first test body; again at the end if the ledger changed | Repo root, the user's request word for word, the ticket reference (id or link, not its text), the ledger | Requested behaviors no claim covers, claims weaker than asked, request/ticket conflicts                        |
| `test-mutation-prover`  | After the tests are green                                                            | Repo root, test target, the ledger rows verbatim                                                         | CAUGHT / SURVIVED / INVALID per test, from a scratch copy                                                      |
| `test-gotcha-reviewer`  | After the tests are green, in parallel with the prover                               | Repo root, the diff, this file's path, the ledger                                                        | Gate and gotcha hits with `file:line`; suspected false passes as named mutations, which you send to the prover |

Once you delegate a step, wait for its result rather than doing the same reading yourself. If an agent isn't offered in this session (it was installed after the session started, or you run in Codex, whose plugins can't ship agents), start a general subagent and give it the agent's file as its brief: `../../agents/<name>.md`, relative to this skill's directory. Those files name script paths from this plugin's root, two folders above this skill's directory; put that absolute path in the brief. Do the job inline only when no subagent tool exists, and say so in the report: an inline comparator or reviewer has already seen the tests, so it isn't independent.

## Scripts

Proving a test means copying the working tree, breaking the source, running one test, and restoring. Every prover used to build that by hand, and the hand-built versions failed the same ways each time (see _Scripts_ in RULINGS). Use these instead, from the prover or from any other agent: `node scripts/<name>`, with `scripts/` relative to this skill's directory. Each script's header comment holds its full contract.

| Script             | Takes                                                                                                                         | Returns                                                                                                                                       |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `scratch-copy.mjs` | `--repo <git root>`; optional `--dest`, `--min-free-gb`, `--include-ignored`/`--exclude-ignored <name>`; or `--remove <copy>` | JSON: the copy path, skipped entries, links that resolve outside the copy, missing builds, free disk                                          |
| `mutate.mjs`       | A JSON spec: the copy, the test command, and mutations as exact-once find/replace edits, each with its claim                  | One JSON line per baseline and mutation: CAUGHT / SURVIVED / INVALID / UNPARSED / TIMEOUT / APPLY-FAILED, test counts, excerpt, restore check |

## Gate: does this test earn its place?

1. **What breaks?** Name the behavior a user or caller would see go wrong. "The helper returns X" is not a break. "The exported dataset is missing the tool call" is.
2. **Reachable from outside?** If a caller can trigger it through the public surface (entry point, exported declaration, route, CLI), the test goes through that surface, even when setup is heavier.
3. **Does it fail halfway?** If the feature has a callback, a long-lived iterator, a subscription, a paged read, or a fail-closed guard, write the test that proves the failure is contained before the happy-path test.
4. **Change detector?** If it would fail on a harmless rename, inline or move, it tests how, not what. Rewrite it against output.

If the behavior can't be reached without changing production code, report that. Don't add a seam.

## Claim ledger

A checker proves a test against its claim. It never proves the claim is the right one. The ledger puts the claims where `test-claim-comparator` can compare them with what was asked, before any test exists.

Before the first test body, write the ledger in your response. Start from the requirement (the user's request, plus the ticket if one exists): it sets what must be claimed. Reading the code can add lines, such as a failure mode the request didn't name, but never replaces what was asked. One line per test, failure-mode claims first, and every line passes the Gate:

```
| # | test | what breaks | assumes | status |
```

- **assumes**: everything the test controls instead of running it for real: each stub and the seam it sits at, env overrides, platform setup that no operation exposes. The goal is `nothing`. Fill it in when the test goes GREEN.
- **status**: `todo`, then `green`, then the prover's `CAUGHT` or `SURVIVED`.

A ledger line has no test body, so the ledger doesn't break one RED → GREEN at a time. Take the next `todo` line, make it RED, make it GREEN, repeat. When a new claim turns up, add its line before you write its test.

## Use the discovery map

Nothing about a repo's test setup is fixed, so `test-discoverer` maps it fresh each time. Build on its map:

- If **Covered by** names a test, extend that test or fill the gap it reports. Don't write a duplicate.
- Enter through the **surface** it names. Stub only at a **seam** it lists. Prefer a **real in-process form** over any stub.
- Copy the **precedent**'s shape, minus the flaw it says to leave behind. Never copy a **non-precedent**, even a green one.
- Redirect every **isolation** path to a per-test temp copy. If **state** can't be reset, arrange through the app's operations.
- If something on the map is `unknown`, settle it by reading code before you write a test that depends on it.

## Gotchas

- **The test assembles its own inputs or wiring** → it can't detect the subject failing to provide them; an empty spread stays green. Drive the real entry point.
- **The test needs a factory, option, export, `?` on a type, or env branch in production code** → the test exercises a composition no user runs, and the impossible branch spreads to every consumer. Change the test. If it still can't reach the behavior, report that.
- **App wiring gets extracted so a test can reach it** → the one file that shows how the app is assembled gets harder to read. Keep it inline and verify by running the entry for real.
- **It asserts request shape, helper calls, or call counts between internal modules** → it fails on harmless refactors and misses real breaks. Assert what a consumer reads, or what crossed the boundary.
- **A boundary stub answers everything** → a dropped field still passes. Make the stub answer only what the request asked for.
- **A mock binds to a module path** → it goes inert when the module moves, and the test keeps passing while asserting nothing. Stub at the wire, and prove any mock is live by making it throw once.
- **A fake re-implements an interface** → it drifts from production and skips the real serializer. Use the real primitive. A double that only throws or counts cleanup calls is fine for failure-mode tests.
- **State gets seeded straight into the app's own storage** → false positive: green while the live flow fails. Arrange through the product's operations, in the order the app calls them. Platform setup that no operation exposes is the only exception; say so in the test. A store the app only reads (a third-party upstream's files) is the seam, not the app's storage. Write it the way that upstream would.
- **Test data lives in a shared fixtures module** → the test no longer reads top to bottom, and the data drifts. Inline it in each file. Shared infrastructure (boot the app, return a client and sign-in) is allowed only as its own project outside the app's source, exposing only the black-box surface. Data the product itself ships (a route's sample form) isn't a test fixture; it stays in source.
- **Setup or teardown sits in lifecycle hooks** → state hides between tests. Use Arrange-Act-Assert with teardown in `try`/`finally` or `await using`.
- **The assertion uses a payload you invented** → it passes against a shape production never sends. Capture the real one and assert that.
- **You remove an internal-state assert because the outcome asserts look equivalent** → a behaviour with no visible output (skipping unchanged work) loses its only guard. Ask `test-mutation-prover` to break the behaviour first; if the outcomes can't catch it, keep the internal read and say why in a comment.
- **A refactor changes assertions** → regressions hide. Keep assertions, scenarios and test count; any change to what is asserted needs sign-off.
- **The code moves to a different execution context** → don't delete its failure-mode tests. Move them to the new environment.
- **You change shared test infrastructure** → it breaks every suite. Get approval at each structural step, even inside an approved plan.

## Process gotchas

A diff can't show these, so `test-gotcha-reviewer` doesn't check them. They are yours.

- **All tests are written first, then all the code** → defects escape between the batch and the code. Write one RED test, make it GREEN, repeat.
- **A test was never seen failing** → its stub may be inert. `test-mutation-prover` breaks the source on purpose in a scratch copy; trust a test only after it is CAUGHT.
- **The claims come from the code, not from the request** → every test is CAUGHT and the suite is green, but the behavior the user asked for has no claim. The tests prove the wrong statement. Write the ledger from the requirement, and have `test-claim-comparator` check it before the first test body.
- **A probe reuses an id from a log** → it can delete real data. Create and touch only your own rows and temp roots.
- **You claim "existing tests stay green" from grep hits** → the claim is unverified. Read the test bodies.
- **Mutation proof runs outside `test-mutation-prover` or the scripts** (inside a phase agent, in the main thread, in the original tree) → it loses their safeguards. A phase agent once killed the user's own processes by name, and in-tree mutations landed while another session was editing the same files. Send proof to the prover; where there is no prover, run the scripts.
- **The prover brief lists mutations instead of claims** → the prover tests only the breaks you thought of, and a mutation that misses its claim comes back as a false SURVIVED. Paste the ledger rows verbatim; the prover builds each mutation from its claim.
- **A proven test, or a stub it uses, changes after the proof** → the old CAUGHT no longer covers it. Re-prove every claim the change touches, not a sample.
- **A box gets ticked with no run behind it** → the report claims a step that never happened. Name the run, or write `skipped:` and why.

## Done when

- Every test passes the Gate, and `test-mutation-prover` reports it CAUGHT. A SURVIVED test gets rewritten, not explained away.
- `test-claim-comparator` finds nothing unclaimed or weakened on the final ledger, and every requested behavior has a CAUGHT line, or the report names it as unproven.
- Every `test-gotcha-reviewer` finding is fixed or answered in the report with a reason.
- The report has a disposition table: one row per comparator and reviewer finding, reviewer-named mutation, prover Gap, and SURVIVED / INVALID / UNPARSED / TIMEOUT result, each marked `fixed`, `answered: <why>`, or `deferred: <backlog id>`. A finding with no row was dropped.
- The suite ran through the repo's own test target, not a hand-built command.
- The report is the final ledger: what each test proved, what it assumed instead of exercising, and what stays unproven. Green on the happy path is not "done".
