# Rulings behind write-test

Every gate question and gotcha in [SKILL.md](../SKILL.md) comes from a correction or a decision Ezz made. Each entry gives his words (profanity edited out, emphasis kept), what happened, and the source memory (`project/file` under `~/.claude/projects/-Users-ezzabuzaid-Desktop-<project>/memory/`) or the dated skill reflection (`~/.claude/skills-reflections/`).

## Gate: test only what actually breaks

**Definition of done includes useful tests.** _"done means: 1. all related agent backlog are closed. 2. tests are written in blackbox mindset and we are only testing what actually breaks."_ (2026-09-25). A connector test copied from a template asserted the auth header, pageSize, metric count and filter strings, called `PostmasterApi.historyWindow` directly, and regex-matched prose. Change detectors: they fail on harmless refactors and miss real breaks. Six sibling tests were rewritten, and 81 source mutations proved they catch breaks. `January-text2sql/feedback-definition-of-done.md`

**Don't bind tests to helper methods.** _"tests aren't protecting me because they bind to evaluateSteerReminders, which I want to refactor."_ Ask: could a consumer trigger this without the helper? If yes, test it that way. `January-deepagents/feedback_no_method_unit_tests.md`

**No unit tests. Test like a user.** _"we should strive not to write them and only stick practising test as blackbox like a user"_ (2026-09-25). Enter through public exports, run the real pipeline into a real destination in temp storage, and control only the outermost upstream seam. Cover a parser through the stream that uses it. `experiments-context-compiler/black-box-tests-only.md`

**"Integration" means a writing style, organized as scenarios.** _"by integration I meant the writing style to be black box behavioral. also the test should be defined with scenarios."_ `January-text2sql/feedback_integration_means_blackbox_scenarios.md`

**Failure modes first.** Four bugs slipped past 71 stream-manager tests because all of them were happy-path: a throwing callback, a subscribe failure, cleanup that was never awaited, and a pagination test that couldn't detect page size. Ask: _if this fails halfway, is there a test that proves the failure is contained?_ `January-deepagents/feedback_test_failure_modes_first.md`, `January-text2sql/feedback_no_premature_done_claim.md` (_"how on earth did you tell me you finished while the code is still buggy?"_)

## Production code is never shaped by the test

**No test seams.** _"this is useless createEventReels. no need for external functions for sake of tests. that means you are not testing blackbox. tests are driving and forced by the app. we do not code for tests"_ (2026-09-06). Factories with injectable `model`/`sandbox` were removed. Tests now import the real declaration and intercept the provider over HTTP. `January-deepagents/feedback_no_test_injection_seams.md`

**No carve-outs, not even as options.** _"are you changing public code for tests?"_ Covers lifting a `protected` helper, a `#zukhruf-internal` imports side door (_"we should always be testing as how a user would use it"_), and `initScripts?` added to the container harness (_"nope. I hate this initScripts."_). `January-deepagents/feedback_integration_first_no_test_carveouts.md`, `experiments-self-delegate/tests-are-black-box.md` (_"tests are black box, we should not change the code because of them."_)

**Tests never widen production types.** _"the test drove our code which created this problem."_ and _"test do what the user does and they never drive how the code is built."_ `window.limerenceDesktop?` became non-optional again, and `SignOutEscape` was un-exported. `January-text2sql/feedback-tests-never-shape-production-types.md`

**No test-only branches in app code.** A `SANDBOX_IMAGE_TAR` env hook that existed only for the e2e was removed. Fix the arrange step, not the app. `January-text2sql/feedback_no_test_hooks_in_app_code.md`

**Set env at invocation; don't reshape the module.** Keep `export default createX()` and run `FOO=bar node --test …`. Corollaries: _"tests should only interface blackbox. do not adjust the code to the test."_ Checks against private internals are temp probes that get deleted. `mo-datahub/feedback_dont_coerce_api_for_tests.md`

**Wiring stays inline.** _"inline exportAllStreams man"_ and, on extracting the error handler, _"I refuse. get the error handler back inline not in another file."_ If the entry loses its test seam, drop the entry-level test and run the entry for real. `experiments-context-compiler/entry-scripts-stay-inline.md`, `January-text2sql/feedback-app-plumbing-stays-inline-in-app-ts.md`

**Don't downgrade production to keep a mock green.** If `mock.timers` can't intercept `node:timers/promises`, the test is at the wrong layer. `January-deepagents/feedback_modern_apis_tests_test_public_behavior.md`

## Arrange with real things

**Exercise the real code.** _"our tests are lying. test should not concern itself of how things are built. they must exercise the real code."_ (2026-09-11, finetuning). The test had rebuilt the runtime's tool merge. When `declaration.tools` became `{}`, the empty spread type-checked and the test stayed green. `experiments-finetuning/tests-must-exercise-real-code.md`

**Stubs are a last resort.** _"stubs and mocks only for losers. they are last resort. we do black box testing."_ Run the real Better Auth server on its memory adapter over loopback. Integration tests that seeded rows straight into Prisma were green while the live flow failed with a 400: _"enough with tests that give false positives. do black box testing, man"_. `January-text2sql/feedback-black-box-tests-stubs-last-resort.md`

**No fakes, even if the task asks for one.** _"always real test no fake or in memory even if the task says so."_ If a branch can't be reproduced for real, give Ezz the choice: extend the API, write a test-local real helper, or accept the gap. `January-deepagents/feedback_no_fakes_in_tests.md`. Assert observable state, not `mock.fn()` counts: `January-text2sql/feedback_integration_tests_no_mocks.md`

**Intercept at the wire.** A fake exporter hid a real OpenAI Traces 400 because it skipped `JSON.stringify`. `nock` on the endpoint runs the real encoder. (That memory's `beforeEach(nock.cleanAll)` is overridden by the no-hooks rule. Clean up in `finally`.) `January-deepagents/feedback_no_fakes_use_nock.md`

**No module-path mocks.** A `vi.mock('@stdlib/ui')` went inert when the package moved, and two tests kept passing while asserting nothing: _"avoid those mocks and do the real path, it is creating a lot of problems."_ If a mock is unavoidable, make it throw once to prove it is live. `January-text2sql/feedback-no-module-path-mocks.md`

**A mock nobody asserted on was never load-bearing.** Before building a service to "properly" replace a deleted mock, check whether it was ever asserted, varied, or needed. `Kortext-klp-web/feedback_verify_before_refactor.md`

**E2E means the real screen and the real network.** _"should not this actualy be real e2e tests? like render the actual chat and stuff"_. `Kortext-klp-web/feedback_real_e2e_for_chat.md`

**No shared fixture modules.** _"the test fixture pattern is prohibited. inline the fixture in each test file. test files are isolated and collocate all they need"_ (2026-08-29) `experiments-factory/no-shared-test-fixture-modules.md`. _"I absolutely hate using fixtures."_ Spawned `*.fixture.ts` runners became in-process tests. "Needs a fixture" points to a seam defect to report. `January-text2sql/feedback-no-fixtures-test-in-process.md`. No `*.fixtures.ts` across specs, and no test-shaped `*.constants.ts`. `Kortext-klp-web/feedback_no_fixture_files_no_dollar_methods.md`

**Harness lives outside `src/` and exposes only the black box.** _"can we move testing stuff out of app logic? it is so conflicting now. we need to enforce and properly state the nature of black box testing"_ (2026-09-22). The harness is its own project that returns `client`/`signIn`/tokens, never prisma or queues. `January-text2sql/feedback-test-infra-outside-src-black-box-surface.md`. Classes inside a harness are deliberate; don't flatten them. `mo-virtual-care/feedback_keep_classes_in_test_harness.md`

> **Data vs infrastructure.** No memory states this split outright, but together they imply it: test _data_ is always inlined per file, and test _infrastructure_ may be shared, but only as a separate project exposing the black-box surface. An earlier text2sql note approved `src/testing/` helpers. The 2026-09-22 ruling supersedes it.

**Probes touch only their own rows.** A probe reused an id from a log line and deleted a real ticket and its `.scratch/` folder. `experiments-factory/probes-never-touch-real-rows.md`

**Raw SQL in tests drifts.** After a NOT NULL migration, search tests for raw `INSERT INTO "<Table>"`. Prisma paths update automatically; raw SQL fails like a flake. `mo-virtual-care/feedback_raw_sql_test_fixtures.md`

## Shape

**AAA, no lifecycle hooks.** Each test arranges its own state inline. `Projects-study/feedback_test_aaa.md`. That memory still allowed `before`/`after` for expensive resources; the global CLAUDE.md rule (no hooks, `try`/`finally` teardown) supersedes it.

## Prove it

**TDD is vertical slices.** Seven tests appended in one `cat >>` let a real defect escape (a retry reported `expired` instead of the cause). One RED, one GREEN, repeat. `January-text2sql/feedback-tdd-vertical-slices-only.md`. _"always probe … always /tdd"_: `January-text2sql/feedback-probe-reuse-tdd-standing-order.md`

**Refactors keep test semantics.** Same assertions, scenarios, and count. Only setup changes. `January-deepagents/feedback_refactor_preserve_test_semantics.md`

**Read test bodies before predicting them.** A plan claimed "existing suite stays green" from grep hits, and 8 tests failed across 5 dialects. `January-deepagents/feedback_verify_test_claims_before_planning.md`

**Move tests to the new environment; don't delete them.** When `selfTestStrace` became host-local, its failure-mode coverage moved into a real container. `January-deepagents/feedback_rehost_tests_on_context_change.md`

**Assert the real payload; delete speculative branches.** A guard test first asserted an invented `invalid_grant` body. The real one was different. `January-text2sql/feedback-no-speculative-error-handling.md`

**Bound your claims.** Say which failure mode was removed and which remain unproven. `Projects-theagentlab/feedback_scope_reliability_claims.md`

**Check the claims against the request, not only the tests against the claims.** The 71 stream-manager tests (_Failure modes first_, above) were green against their own claims, and no claim covered what was asked: a stream manager that contains failures. The prover can't see this gap, because it checks each test against the claim its author wrote. The Fermat's Last Theorem formalization (Anthropic, 2026-09-04) adds the same check after Lean accepts the proof: "a comparator confirmed that the theorem's statement matches Mathlib's own statement of FLT." Adopted 2026-10-05 as a sharper reading of `January-deepagents/feedback_test_failure_modes_first.md` and `January-text2sql/feedback_no_premature_done_claim.md`. `~/.claude/skills-reflections/2026-10-05-write-test.md`

**The comparator is its own agent, and it fetches the ticket itself.** It first lived inside `test-gotcha-reviewer`, which reads the test bodies (a convincing test anchors a judge toward its claim) and runs after green (its inputs exist before the first test, so each wrong claim cost a full RED → GREEN cycle). On where the ticket comes from: _"do not name where it should fetch from instead the skill should tell the agent to discover what connector/tool this tickets comes from and pull all relevant context to it"_ (2026-10-05). The agent inherits every tool except the editing ones, so any tracker's connector is in reach. `~/.claude/skills-reflections/2026-10-05-write-test.md`

**Process gotchas live apart from diff gotchas.** The reviewer was told to check every gotcha against the diff, and five can't be seen in one (batch writing, a test never seen failing, claims taken from code, a probe reusing a logged id, green claims from grep hits). They now sit in their own section that the reviewer skips. Ezz's decision, 2026-10-05.

**List what each test assumed.** This applies _Bound your claims_ to each test. Every stub, env override, and platform setup is a premise the test did not exercise, like an axiom a proof depends on. The same formalization reports that its proof "uses just Lean's three standard axioms." Adopted 2026-10-05.

**Claims before bodies.** Ezz chose a claim ledger on 2026-10-05, after the same post: its platform keeps a graph of theorem statements that agents used "to decide what proofs they should attempt next," which helped when agents "lost track of the project's state." Ezz chose it over the advice that it overlaps _TDD is vertical slices_. It doesn't conflict with that ruling, because a ledger line has no body.

**Shared test packages need a check-in at every structural step.** _"I clearly told you not to start refactoring until I'm okay with changes to the test package"_. `January-deepagents/feedback_pause_before_test_package_refactor.md`

## From the first week of use (forensics, 2026-10-05)

Ezz asked which problems the agents that ran this skill hit, and whether repeated work needed scripts. Ten sessions (2026-10-01 → 10-05) and their 55 subagent runs were mined. The full account is in `~/.claude/skills-reflections/2026-10-05-write-test.md`. Sessions are cited by id prefix and repo. Across all ten, a user corrected test content once (_Discoverer checks the repo's mock package_, below). The rules held; cost and process didn't.

**Scripts.** Every prover run (29 of 29) rebuilt the scratch copy by hand, and 22 of 29 wrote a throwaway mutate harness (`mut.py` alone was rewritten at least seven times). The hand-built versions failed the same ways:
- openrsync aborted on a tracked dangling symlink, in every prover in `4bda8a77`/`a6aad900` text2sql
- a BSD `sed -i` call never applied its edit, so the test "passed" (`1a3ed83b`)
- ignored `dist` was missing, giving `ERR_MODULE_NOT_FOUND` (`4bda8a77`)
- the disk filled and 1.2 GB was left behind (`a6aad900`)
- the original tree changed mid-run (4 of 11 runs in `a6aad900`)
- a test filter was silently dropped (`1a3ed83b`, `c55bb178`, `d2b9b92d`)
- a background run was polled with `sleep` for an hour: _"this subagnt been running for 1 hour. is this normal?"_ (`98942228` deepagents)

Ezz chose two bundled scripts on 2026-10-05: `scratch-copy.mjs` and `mutate.mjs`. Their tests were written with this skill, in the skill's own `scripts/`.

**Proof stays with the prover or the scripts.** Three sessions proved tests elsewhere:
- A general-purpose phase agent ran mutations inline and killed the user's ChatGPT `eventkit watch` helpers (`kill 34453 34454`, `1a3ed83b`).
- In-tree mutations landed while another session was refactoring the same files (`d2b9b92d`).
- Eleven slices were proven by implement agents that carried a hand-written harness in their prompts (`2e1080fc`).

**Briefs carry claims, not mutations.**
- A brief prescribed a mutation that didn't produce its own claim, so it came back SURVIVED and cost an extra build cycle (`d2b9b92d`).
- A brief listed mutations only, so the dedup and grace-window claims never got one (`fd86eac7`).

V3 already said to pass each test with its claim. The mechanism is pasting the ledger rows verbatim.

**Re-prove after a change.** After the stub layer of two suites was rewritten twice (`globalThis.fetch` → msw → nock), 6 of 35 mutations were re-run (`98942228`). Fixes were re-proved by hand in the original tree (`d2b9b92d`). Three sessions (`a6aad900`, `4bda8a77`, `fd86eac7`) re-proved their survivors without being asked, which is the codification signal.

**Ticks carry evidence; findings get a disposition.**
- "test-discoverer map in hand" was ticked with no discoverer run (`a6aad900`).
- "every finding fixed or answered" was ticked while two reviewer sub-points and a prover Gap were never mentioned (`d2b9b92d`).
- A reviewer-flagged missing test went unanswered (`98942228`).
- A final report had no test section at all, and agents installed mid-session were replaced inline without saying so (`573a64d0`).

**The skill loads with test work, not only test requests.** Three sessions wrote tests without loading it:
- inside "complete the file store", about 35 test-file edits (`fd86eac7`)
- inside fixes from a backlog review (`c55bb178`)
- when resuming a parity plan from an earlier transcript (`2e1080fc`)

**Discoverer checks the repo's mock package.** _"you seem to have used globalthis for sake of test, correct? why not dedicated and proper mock http package. don't we use one already?"_ (`98942228`). The plan named `t.mock.method(globalThis, 'fetch')` and the discoverer took it. Both suites were then proven, and rewritten twice.

**A plan document is a ticket.** In three sessions (`98942228`, `4bda8a77`, `a6aad900`) the requirement lived in a plan file, not a tracker. In `98942228`, six of the plan's Verification items were never tested, and no agent was given the plan. This is the gap the comparator closes. It must accept a path as well as an id.

**Reviewers name mutations; they don't run them.** Reviewers built their own copies and probes: 556 Bash calls over 23 runs, and one symlinked `node_modules` back to the original. Ezz chose on 2026-10-05: reviewers run tests read-only, name the mutation, and the prover runs it.

## Framework notes (not repo rules)

These matter only in vitest/React/Angular projects: RTL needs `cleanup()` inline in `finally` (`January-text2sql/feedback_rtl_explicit_cleanup.md`); call `userEvent.setup()` before mocking the clipboard (`feedback_userevent_clipboard_order.md`); wrap mounts in `<StrictMode>` when tests pass but the browser fails (`feedback_strictmode_repro.md`); use a real `HttpTestingController` over service stubs (`Kortext-klp-web/feedback_real_services_in_tests.md`).
