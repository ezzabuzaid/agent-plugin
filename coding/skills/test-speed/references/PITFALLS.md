# Pitfalls of test-speed

Each trap cost a wrong claim or a lost measurement on 2026-11-27 (zukhruf on Docker Desktop and on an SSH engine).

- **`$?` after a command substitution.** `echo "$(date +%T) exit=$?"` prints the status of `date`, not of the run before it. Save `rc=$?` on the line right after the command.
- **One saved log per task hash.** Nx keeps one terminal output per hash, so a later run of the same hash overwrites the earlier log. If the engine is not in the hash (zukhruf adds `DOCKER_CONTEXT` and `DOCKER_HOST` to its test inputs since 03315e21), runs on two engines share a log and a cached result. Keep each run's JUnit files instead (TOOLS step 1).
- **`test-results.xml` is overwritten by every run** of its package. Copy it after each run, in hyperfine's `--conclude`.
- **hyperfine 2.x JSON keys.** `summary.time_wall_clock`, `summary.time_cpu` and `measurements[]`; the 1.x keys read as `null`, which looks like a lost file but is not.
- **JUnit with a lone surrogate in a test name is invalid XML** (Node's JUnit reporter writes it as is). `xmllint --recover` then drops what follows the bad bytes: in mutex.xml 846 of 955 cases survived and both failures were lost. Check `xmllint --noout` and compare the parsed count with `grep -c '<testcase'` before trusting the file (TOOLS step 3).
- **Other sessions share the machine.** Load 42 on 14 cores made a 2 s case take 50 s and hit a 50 s timeout. Record `vm.loadavg` with every run, and repeat a surprising number.
- **The link moves.** The same suite on an SSH engine took 40.7 min from home (80 ms) and 14.3 min from the office (9 ms). Record `ping` with every run.
- **Killing a `docker run` client leaves its container running** on the engine. List and remove it: `docker --context <ctx> ps -a --filter ancestor=<image>`.
- **Code that connects without the environment ignores `DOCKER_CONTEXT`.** zukhruf's `Docker.connect({ clock })` read no `DOCKER_CONTEXT` and ran on Docker Desktop while the run was "on devbox". When a case is suspiciously fast on a remote engine, check where its containers appeared (`docker events` on each context).
- **A bind mount names a path on this machine.** A remote engine creates empty folders at that path instead, and the container finds no code (8 mutex tests at 300 s). Send the files in the command (a bundled script) or through the Engine API.
- **An IPv6 error is not always an IPv6 problem.** Docker Desktop's proxy reported `dial tcp [2603:…]:443: no route to host` once while the Mac had no IPv6 at all and IPv4 worked; every other connection succeeded. Count the errors in the proxy log before blaming the network.
- **A warm cache that a test cannot reach.** A test that makes its own empty cache per case pays the download every time (OpenTofu providers: 74.9 s cold, 0.09 s warm). Check what a case downloads (`TF_LOG=debug`, the bytes on the interface) before suspecting the network.
