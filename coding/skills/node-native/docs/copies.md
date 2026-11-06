# Copies inside node-native

Code that does the same thing in two places stays copied until a third place
needs it (Rule of Three). Each copy is listed here. Until the third consumer
comes, a fix to one copy is made in both, and the commit names both files.

| Knowledge | Source | Copy | What differs, and why |
| --- | --- | --- | --- |
| Refuse to run unless the running Node is the one the surface snapshot was built on | `scripts/probe.mjs` `refuseOffSurface(path)` | `scripts/inventory.mjs` `refuseOffSurface(surface, path)` | The probe reads the snapshot only for this check, so it reads the file itself and says how to build a missing one. The inventory reads the snapshot anyway (deprecations, e18e checks), so it takes the parsed snapshot. |
| A local port that refuses connections, for a probe of a failed connect | `catalog/fetch.mjs` `refused(call)` | `catalog/websocket.mjs` `refused(call)` | Same knowledge; a third entry that probes a refused connection moves it into `catalog/support/server.mjs` beside `served`. |
| A self-signed P-256 key and certificate for 127.0.0.1 and localhost (valid to 2036) | `catalog/http2-client.mjs` | `catalog/ca-certificates.mjs` | Same fixture; a third entry that needs TLS moves it into `catalog/support/` as a TLS fixture. |
| What a `Console` prints, captured from a `Writable` instead of stdout | `catalog/console-table.mjs` `printed(print)` | `catalog/console-time.mjs` `logged(run)` | `logged` awaits `run` and replaces every number with `N`, because its lines carry durations. A third entry that captures a Console moves the capture into `catalog/support/`. |
| A recursive directory walk that calls `stat` on each entry | `catalog/fs-readdir-recursive.mjs` `walker` row, inline `async function walk` | `catalog/fs-readdir-recursive.mjs` `walkWithStat` | The `walker` seed must match the text of its own `idiom()`, so that walker is written inline; the symlink row needs the same walker and cannot reach a function declared inside another row. A third walker in the catalog moves it into `catalog/support/`. |

Extracted into `scripts/catalog.mjs` at the third consumer:

- `readCatalog`: copies were in surface.mjs, probe.mjs and catalog.test.mjs.
- `parseSpec` and `memberOf`: the `<package>@<version>[/<subpath>]` grammar was
  known to probe.mjs (`nameOf`), inventory.mjs (a copy of it) and
  catalog.test.mjs (a validation pattern).

Extracted into `catalog/support/` at the third consumer:

- `inScratch` (scratch.mjs): a temp-tree helper copied into 9 fs entries.
- `served` (server.mjs): a local-server helper copied into 4 entries.
- `runTestFile` (node-test.mjs): a node:test runner copied into 6 entries.
- `run`, `output`, `esm` (child.mjs): child-process runners in 9 entries.
- `outcome`, `settled`, `failure` (outcome.mjs): a throw turned into a
  comparable value, about 34 copies; which part of the error a copy recorded
  became the `record` parameter. Helpers that also do something else (a
  timeout race, a disposal log, a child runner) stay in their entries.
- `verdict` (assertion.mjs): the assertion harness copied into the 5
  `assert-*` entries (AssertionError → `'fail'`).
