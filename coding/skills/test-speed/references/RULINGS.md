# Rulings behind test-speed

Each rule in [SKILL.md](../SKILL.md) comes from Ezz's words while making zukhruf's tests fast on an SSH Docker engine (devbox) on 2026-11-26 and 2026-11-27. Data: study repo `research/devbox-bench/RESULTS.md`; backlog #5913.

## The method

**One test case at a time.** _"the way to optimize tests is to focus on one test case, see what problems it has, we fix them, and then jump on completely different test case. one fix in a test case will fix many others and the feedback loop should be short since it is one test case."_ (2026-11-27)

**The target.** _"I believe we can get it to 1 minute the whole suite run."_ (2026-11-27) Hence the floors in SKILL.md: a target below the CPU floor or the file floor needs the tests to change, not the machine.

**Highlight every gap.** _"If you find any gaps, highlight them. It's very important. We are trying to fix everything all together."_ (2026-11-27)

**Community tools, not hand-rolled glue.** _"I want to use popular community tools as much as possible and stop handrolling code ourselves for this."_ (2026-11-27) The skill replaced a wrapper script, a `ps` sampling loop and two parsers with hyperfine's `--conclude`, psrecord, Perfetto and xmllint.

## Where to measure

**On the host, not in the box being measured.** _"we don't run the test cases inside the dev box. Rather, we use Docker to run the test cases in the box … if you want to measure, you would measure in the host, that benchmarking things, right? Not within the box that's being measured."_ (2026-11-27) An earlier plan to install iperf3 and sysstat on devbox was dropped.

**The Docker Offload model.** _"we are trying to benchmark test that would run from here not within the devbox"_ and _"again, we are following docker offload philosophy"_ (2026-11-26): the tests run on the Mac, only the engine is remote.

## Causes

**Find the root cause, do not route around it.** On Docker Desktop's IPv6 failure: _"no. that is wrong way to fix it. we should find out why ipv6 fails."_ (2026-11-27) The proxy log and macOS's network log showed that neither network had IPv6 and that the proxy dialed IPv6 once.

**Data before a design choice.** Asked whether databases should reach the engine over Tailscale instead of SSH, Ezz chose _"Show me the data first"_ (2026-11-27); the relay probe then showed the SSH relay at 6 % of a core, so the change was not needed.

**Ship only what the case needs.** _"Why are you copying the whole package? … rethink this test case. We should not be needing all this code."_ (2026-11-27) The mount tests went from an upload of the package to one bundled script per container.
