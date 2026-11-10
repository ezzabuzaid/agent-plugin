---
name: node-native-refresh
description: >
  Brings the node-native catalog up to the current Node LTS: rebuilds the
  surface snapshot, reviews every API that is new or changed since the last
  review, writes or updates catalog entries with their probes, and re-runs every
  probe so a gap the LTS closed turns into a mapping. Run inside the
  agent-plugin repository, on the LTS Node, when `node-native` reports that the
  catalog lags the LTS, or to build the catalog the first time.
disable-model-invocation: true
---

# node-native-refresh

The catalog is `../node-native/catalog/`, one module per entry; the snapshot is
`../node-native/surface.json`; the scripts are `../node-native/scripts/`. Each
script's header comment is its full contract. Work in the agent-plugin
repository, on the Node that `index.json` names as LTS.

## Procedure

### 1. Rebuild the snapshot

```
node scripts/surface.mjs --write
```

Exit 2 means this Node is not the LTS: switch, and run again. Exit 1 prints the
drift:

- `new`: APIs the last review did not see (all of them on the first build).
- `changedSinceReview`: doc changes that reached the LTS line after an entry's
  `reviewedAt`.
- `dangling`: entry `apis` the surface no longer has.
- `removed`: APIs gone from the LTS. A long `removed` list of one kind (ctor,
  flag, …) is a change in the docs JSON shape, not in Node: fix the walk in
  surface.mjs first (backlog: "check for a Node docs JSON shape change").

### 2. Review the drift

For every `new` API, decide whether userland code or a package does what it
does. Most APIs have no userland counterpart (`os.cpus`, `http2.*`, `v8.*`);
they need nothing: the committed snapshot is the record that they were
reviewed. For the rest, write or extend an entry. Group APIs that one capability
covers (`fs.glob`, `fsPromises.glob`, `fs.globSync`) into one entry.

For every `changedSinceReview` row, re-read the change and update the entry it
names: a new option may map a member that was a gap. Fix every `dangling` api.
Set `reviewedAt` to the LTS on every entry you reviewed.

On the first build, `new` is the whole surface: split it by module group and
give each group to one subagent, quoting this file and the entry format below.
Each subagent probes its own entries with `--entry`, so a file another agent is
still writing does not break its run.

### 3. Entry format

```js
// catalog/style-text.mjs
import { inspect, styleText } from 'node:util';
const plain = { validateStream: false };
const colors = Object.keys(inspect.colors);

export default {
  apis: ['util:util.styleText'],              // surface ids
  reviewedAt: 'v26.13.0',
  flags: [],                                  // CLI flags the native side needs
  replaces: {
    'chalk@5.6.0': {                          // one version per package, catalog-wide
      ...Object.fromEntries(colors.map((color) => [color, {
        native: () => styleText(color, 'x', plain),
        package: ({ Chalk }) => new Chalk({ level: 3 })[color]('x'),
      }])),
      ansi256: {
        gap: 'no 256-colour palette',         // a gap must have a probe that fails
        native: () => styleText('ansi256(208)', 'x', plain),
        package: ({ Chalk }) => new Chalk({ level: 3 }).ansi256(208)('x'),
      },
    },
  },
  idioms: {                                   // hand-written code, no package
    jsonClone: {
      seed: 'JSON\\.parse\\(JSON\\.stringify\\(', // where inventory looks; never coverage
      gap: 'a JSON round trip turns a Date into a string',
      native: () => structuredClone({ at: new Date(0) }),
      idiom: () => JSON.parse(JSON.stringify({ at: new Date(0) })),
    },
  },
  lint: {                                     // an existing rule that catches the pattern
    preferStructuredClone: {
      eslint: '10.12.0',
      plugin: 'eslint-plugin-unicorn@62.0.0',
      rule: 'unicorn/prefer-structured-clone',
      idiom: 'jsonClone',                     // what `code` is: idiom | dependency | api
      failed: '9 of 9 hits on good code: the code wants the JSON form of the value',
      code: 'const copy = JSON.parse(JSON.stringify(value));',
    },
  },
};
```

Rules:

- **Every row is its own probe.** A mapping row claims `native()` and the other
  side return deep-equal results; a `gap` row claims they differ or that
  `native()` throws, because the package does something Node does not. Unmapped
  members get no row: no claim, no probe.
- **When Node is the better side, the row `improves`, not `gap`.** An `improves`
  row makes the same claim as a gap (they differ, or `native()` throws), but the
  difference favours Node: AsyncLocalStorage keeps the context across `await`,
  where continuation-local-storage loses it. Use it only when no correct caller
  relies on the package's behaviour; when in doubt, it is a gap. A row has `gap`
  or `improves`, never both (catalog.test.mjs refuses both).
- **Key a row by the member it is about.** `'<member>'` for the member, and
  `'<member>: <case>'` for one case of it (`'cloneDeep: class instance'`,
  `'hex: background'`). Inventory counts a member as mapped only through a
  mapping row, and hands the judge every gap proven for it, so a member that
  maps except in some cases gets a mapping row plus a gap row per case. A
  default export called directly (`dayjs()`, `new Graphemer()`) is the member
  `default`.
- **A side that is expected to throw returns its outcome.** A thrown error
  means `probe-error` (the probe proves nothing). When the throw is the point
  (clone-deep throws RangeError on a cycle, native keeps the cycle), wrap that
  side with `outcome(run, record)` from `catalog/support/outcome.mjs`: it
  returns `run()`'s value or `threw ${record(error)}` (sync and async alike;
  `record` picks the part of the error the row compares, `error.name` by
  default). `settled(run, record)` returns `['resolved', value]` /
  `['rejected', record(error)]` instead, and `failure(run, record, success)`
  keeps only how a call failed (the value is dropped, so rows that compare
  failures cannot differ on what succeeded). An assertion library's check goes
  through `verdict(assertion)` from `catalog/support/assertion.mjs`: `'pass'`,
  `'fail'` on an AssertionError, or `threw <name>`.
- **Normalise, then record the raw difference.** When both sides agree on
  behaviour but not on shape (a null-prototype object, escaped text, a Date vs a
  Temporal.PlainDate), compare normalised values in the mapping row and record
  the raw difference as its own gap row.
- **A package named like a Node built-in** (`buffer`, `string_decoder`,
  `punycode`, `events`, `util`) is keyed by a file of the package
  (`string_decoder@1.3.0/lib/string_decoder.js`): its bare name resolves to the
  built-in, which would compare Node with itself. probe.mjs refuses such a key.
- **Subpaths:** a key can name one (`dequal@2.0.3/lite`, `es-toolkit@1.53.1/compat`);
  `package(module)` then gets that subpath's export. Every subpath of one
  version installs once.
- **Running the package in a child:** `package(module, { url })` also gets the
  URL the package was loaded from; a probe that spawns `process.execPath`
  imports the package there by that URL.
- **A member that needs another export:** `package(module, { load })` imports
  any other export of an installed package
  (`await load('@noble/hashes/sha2.js')` for the `sha256` that
  `@noble/hashes/hmac.js` takes).
- **Cite a current API.** An entry's `apis` never name something the surface
  marks deprecated or legacy (stability 0 or 3): cite what Node recommends
  instead (util.inherits → `js:syntax:class-extends`). catalog.test.mjs refuses
  it.
- **`flags` and `env`** are what the native side needs to run (a CLI flag, or an
  environment variable such as `NODE_DEBUG`). Add them only when a probe fails
  without them.
- **Probe the package's current version**, and only one version of a package in
  the whole catalog (probe.mjs refuses two). Check `catalog/` for a pin before
  choosing one.
- **Build rows in code** when a family maps the same way (every chalk colour).
- **Shared probe code** lives in `catalog/support/` and is imported by entries
  (`import { inScratch } from './support/scratch.mjs'`); it is never an entry.
  A probe that needs files runs inside `inScratch(files, run)`. Add a helper
  there only once three entries need the same code.
- **`await using` in a probe:** write `return await …`. A bare `return promise`
  disposes the resource before the promise settles.
- **Idioms and seeds:** write `idiom()` the way real code is written (rename a
  native import that clashes, rather than writing `globalThis.setTimeout`). Its
  `seed` matches the spellings people use (a named import and a namespace,
  any parameter names), matches `idiom()`'s own text, and does not match
  `native()`: catalog.test.mjs checks both. Keep it to the idiom's distinctive
  shape; before committing, run inventory.mjs on two or three real repos and
  open a few hits. Hundreds of hits, or hits that are not the idiom, mean the
  seed is too broad.
- **Lint rows** pin the ESLint version `@zukhruf/eslint` resolves (10.12.0 on
  2026-11-06; read it from `~/Desktop/experiments/mutex`) and a plugin version
  that runs on it. The probe proves the pair works.
- **A lint row says one thing about its rule:** `on` (the config that turns the
  rule on), `failed` (why the rule failed on real code), `off` (why the rule is
  off, though it did not fail) or `unmeasured` (why nothing judges it). Take it
  from ADR 0008 of `@zukhruf/eslint` and from `modern-node/plugin.ts`, not from
  memory. catalog.test.mjs refuses a row with none, a row with two, and two rows
  that say different things about one rule. The probe reports `config-mismatch`
  when the published configs in `catalog/support/lint-configs.mjs` disagree with
  the row. To move to a new `@zukhruf/eslint`, change the version there and in
  the rows that name it as their plugin. An optional `note` holds a limit of the
  rule.
- **A lint row names what its `code` is:** `idiom` (an idiom of the entry),
  `dependency` (a package the entry replaces) or `api` (a deprecated or legacy
  API, as the surface names it). The row is about that one thing. Two rules for
  one idiom are two rows. rules.mjs reads this to say which findings of a run
  have a rule. catalog.test.mjs refuses a row with none, a row with two, and a
  name that the entry or the surface does not have.
- An entry claims at least one `replaces` or `idioms` row.

### 4. Prove

```
node scripts/probe.mjs
node --test scripts/*.test.mjs
```

Every probe row must report `holds`:

- `gap-closed`: the native API caught up; turn the gap into a mapping.
- `improvement-lost`: Node no longer does better, or the package caught up;
  read both sides again, then make the row a mapping or a gap.
- `broken`: fix the mapping, or make it a gap whose probe shows the difference.
- `probe-error`: the probe itself is wrong; fix it.

`catalog.test.mjs` checks every entry against the snapshot.

### 5. Hand over

Show Ezz the `git diff` of `surface.json` and `catalog/`, with the probe and test
results. Commit and bump the plugin version only when Ezz says go.
