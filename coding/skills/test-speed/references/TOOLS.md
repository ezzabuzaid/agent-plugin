# Tools for test-speed

Each command below ran on 2026-11-27 against zukhruf (Nx 24, `node --test` with the JUnit reporter, Docker Desktop and an SSH engine `DOCKER_CONTEXT=devbox`). Everything runs on the host where the tests run. Install the brew tools with `brew bundle --file <this skill>/Brewfile`; `uvx` (from uv) and `npx` run the rest on demand.

## 1. Baseline the run, keep each run's artifacts

hyperfine repeats the run and records wall and CPU time per run; `--conclude` runs after each timed run, so it keeps that run's JUnit files and the machine load.

```sh
hyperfine --runs 3 --shell=default --export-json run.json \
  --conclude 'd=junit/$(date +%s); mkdir -p $d; for f in packages/*/test-results.xml; do cp $f $d/$(basename $(dirname $f)).xml; done; sysctl -n vm.loadavg >> load.txt' \
  'NX_PROFILE=.nx/profile-$(date +%s).json npx nx run-many -t test --skip-nx-cache --exclude-task-dependencies --parallel=16'
```

- Read hyperfine 2.x JSON with its 2.x keys: `jq '.results[] | {wall: .summary.time_wall_clock.mean, cpu: .summary.time_cpu.mean, runs: [.measurements[].time_wall_clock.value]}' run.json`. The 1.x keys (`mean`, `user`, `system`) are gone and read as `null`.
- `--skip-nx-cache` measures the real run; without it Nx replays cached tasks.
- Nx resolves `NX_PROFILE` against the workspace root, even when the path is absolute: write it under `.nx/` (git-ignored) and move it after.

## 2. Which suite holds the run

The Nx profile is a Chrome trace. Perfetto's SQL engine reads it (`uvx` downloads its `trace_processor` once):

```sh
uvx --with perfetto python -c "
from perfetto.trace_processor import TraceProcessor
tp = TraceProcessor(trace='profile.json')
for r in tp.query(\"select name, round(dur/6e10, 1) as minutes from slice where name like '%:test' order by dur desc limit 10\"):
    print(r.minutes, 'min', r.name)"
```

For a picture, open the same file at https://ui.perfetto.dev or in Chrome DevTools (Performance, Load profile). The run summary that Nx prints also names the critical path.

## 3. Which file, which case

```sh
# First: is the file valid XML? Node's JUnit reporter writes a lone surrogate in a test name as is.
xmllint --noout junit/<run>/mutex.xml && echo valid
# Raw counts, which do not need a valid file; compare them with the parsed counts below
grep -c '<testcase' junit/<run>/mutex.xml; grep -c '<failure' junit/<run>/mutex.xml
grep -n '<failure' junit/<run>/mutex.xml      # the line of each failure; sed -n '<line>p' shows its case

# Cases over 60 s in one package, slowest first (Node's reporter writes name= before time=)
xmllint --recover --xpath '//testcase[@time > 60]' junit/<run>/nx.xml 2>/dev/null \
  | grep -oE 'name="[^"]*" time="[0-9.]+"' | sed -E 's/name="([^"]*)" time="([0-9.]+)"/\2s \1/' | sort -rn | head

# Failures in one package (keep stderr: an empty result exits 10 and prints nothing, as "no failures" would)
xmllint --recover --xpath '//testcase[failure]/@name' junit/<run>/mutex.xml
```

On an invalid file `--recover` drops what follows the bad bytes, so a parsed count lower than the `grep -c` count means records are missing: trust the raw counts and lines then (in suites-4's mutex.xml, 846 of 955 cases parsed and both failures were lost).

Run one case alone with the runner's own filter, on the engine you want: `DOCKER_CONTEXT=devbox npx nx run mutex:test --skip-nx-cache --exclude-task-dependencies --output-style=static -- '--test-name-pattern=<case name>'`.

## 4. What kind of wait

- **CPU against wall:** hyperfine's `time_cpu` against `time_wall_clock` (step 1), or `/usr/bin/time -l <command>` on macOS (`-v` on Linux) for one command. CPU per wall second is the cores kept busy.
- **The link to a remote engine:** `ping -c 20 -q <host>` for latency, jitter and loss; throughput through the SSH the engine uses, from the host: `hyperfine --runs 5 'head -c 4000000 /dev/urandom | ssh <host> "cat > /dev/null"'`.
- **A limit:** compare each slow case's time with the limits in play: the runner's `--test-timeout`, a driver's default (the mariadb driver's `connectTimeout` is 1000 ms), a `timeout:` or `waitAtMost` in the test.
- **Contention:** the case alone (step 3) against its time in the full run.

## 5. Which component

- **A process's CPU over time** (a relay, a test runner, a child the test spawns): `uvx psrecord <pid> --include-children --interval 2 --log cpu.txt --plot cpu.png`. 100 % is one core.
- **The engine's containers, from the host:** `docker --context <ctx> events --since <start> --until <end> --filter type=container --format '{{.Time}} {{.Action}} {{.Actor.Attributes.image}} {{.Actor.ID}}'` gives each container's create, start, die and destroy during a case (events are kept, so a past window replays); `docker --context <ctx> stats --no-stream` gives each container's CPU, memory and I/O now.
- **A tool's own log:** OpenTofu `TF_LOG=debug tofu init …` (timestamps show each registry and download step); Node `NODE_DEBUG=net,http`.
- **Docker Desktop's network on the Mac:** `~/Library/Containers/com.docker.docker/Data/log/host/httpproxy.log` (and its rotations) logs every connection Docker Desktop opens for a container, with errors.
- **macOS network history:** `log show --start '<YYYY-MM-DD HH:MM:SS>' --end '…' --style compact --predicate 'subsystem == "com.apple.network"'` (wrap in a time limit; it is slow).
- **CPU profile of the test code itself:** run the case with `NODE_OPTIONS=--cpu-prof` (one `.cpuprofile` per process) and open it in Chrome DevTools or `npx speedscope <file>`.

## 6. After a change

The case alone (step 3) on each engine it runs on, then the full run (step 1), then the repo's own gate before the commit.
