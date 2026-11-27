---
name: test-speed
description: Finds what makes a test suite slow and fixes it one test case at a time, measuring on the host where the tests run with community tools (the Nx profile in Perfetto, JUnit times, hyperfine, psrecord, docker events). Use when a suite or CI run is slow, a test sits at its timeout, a test passes alone but fails in the full run, a remote Docker engine (DOCKER_CONTEXT) makes tests slower, or someone asks to make tests faster or to find the bottleneck. Not for one test that gives a wrong result: that is mattpocock-skills:diagnosing-bugs.
---

# Test Speed

Outcome: the suite is faster by a change that a measurement proved, every gap you saw is filed, and the numbers are in a record, not only in the chat. The commands are in [references/TOOLS.md](references/TOOLS.md), the traps in [references/PITFALLS.md](references/PITFALLS.md), and Ezz's words behind each rule in [references/RULINGS.md](references/RULINGS.md).

## Rules

- **Measure on the host where the tests run.** The engine (a remote Docker host) is seen only through the Docker CLI from that host, and only when host data points at it. Install nothing on the engine host to measure.
- **A cause is a hypothesis until a measurement of that component confirms it.** Name the component, watch it, then claim it.
- **A time that equals a limit is a symptom.** 300.0 s means "never finished"; the cost is unknown until the hang is gone.
- **Wall time minus CPU time is waiting.** When the gap is large, more cores cannot help; only shorter waits can.
- **Alone versus together.** A case that passes alone and fails in the full run points at something shared.
- **Record the conditions of every run:** commit, engine, link (`ping`), machine load (`sysctl -n vm.loadavg`). Other sessions on the same machine change the numbers.
- **One change, the same case, measure again.** Then run the full suite.
- **Community tools first.** Write a script only for a step that no tool does, and say which.

## The loop

Copy this into your response and tick it off:

```
- [ ] 1. Baseline: the full run on the host, hyperfine + NX_PROFILE + each run's JUnit kept, conditions recorded
- [ ] 2. Which suite holds the run (Perfetto SQL on the Nx profile)
- [ ] 3. Which file, which case (JUnit; a file runs its tests in sequence, so the slowest file is the suite's floor)
- [ ] 4. What kind of wait: CPU (time_cpu vs wall), network (ping, a timed copy), a limit (time = timeout), contention (alone vs together)
- [ ] 5. Which component: watch it (psrecord, docker events/stats, the tool's own debug log)
- [ ] 6. One change to that case; the case alone, then the full run; numbers in the record
- [ ] 7. Each gap filed where its fix belongs; the next case picked from the new data
```

## Floors

Two numbers bound how fast the suite can get without changing what it does:

- **The CPU floor:** the run's CPU time divided by the cores that run the tests. 28 CPU-minutes on 14 cores cannot finish in under 2 minutes.
- **The file floor:** the slowest test file, since its tests run one after another unless the file asks for concurrency.

Say both when a target (such as "one minute") is below them: then the tests must do less work, run concurrently inside files, or run on more cores.

## Next

A case that fails for a reason other than time goes to mattpocock-skills:diagnosing-bugs. A change to a test goes through coding:write-test's gate.
