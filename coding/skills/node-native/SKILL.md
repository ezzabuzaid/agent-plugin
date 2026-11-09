---
name: node-native
description: >
  Finds what the current Node.js LTS already ships that a codebase still does by
  hand: dependencies with a native replacement (chalk → util.styleText, glob →
  fs.glob, dotenv → --env-file), hand-written code that re-implements a native
  API (a deferred() helper → Promise.withResolvers, a JSON clone →
  structuredClone), and calls to APIs Node itself deprecated or marked legacy
  (url.parse, legacy assert.equal). Every claim is backed by a probe that ran.
  Use when asked what can be replaced with native Node, to audit dependencies
  against Node built-ins, to find Node-deprecated API use, or when pointed at a
  repo with "what does Node do for us now". Read-only: it reports; applying a
  finding is coding:remove-code's job.
---

# node-native

## Contract

- **The yardstick is the current Node LTS, and nothing else.** A repo's declared
  floor (`engines.node`, `.nvmrc`, a Dockerfile, a CI matrix) is ignored: a low
  floor is a reason to upgrade, never a reason to skip a finding. Runtime pins
  are not reported. A file in a Node workspace that also ships elsewhere
  (inlined into a browser bundle, run on Bun, Deno or Workers) is judged by the
  same yardstick; the report's reader decides what applies there.
- **Stability does not matter.** An experimental API in the LTS counts like a
  stable one. When it needs a CLI flag, the finding names the flag (probe rows
  carry `flags`).
- **Everything Node ships counts:** `node:*` modules, globals, CLI flags and
  environment variables, and the JavaScript language features of its V8.
- **No probe, no claim.** A mapping or a gap is stated only when a probe ran and
  agreed. Anything believed but not probed goes under **Unproven**.
- **Read-only.** Nothing is written into the target repo. Scratch files go in
  the session scratchpad.
- **This skill finds candidates. ESLint enforces them.** A run finds code that
  Node can replace. Only a rule that a repo has on protects that code on each
  lint run.

All scripts live in `scripts/` next to this file; run them as
`node <this skill's directory>/scripts/<name>.mjs`. Each script's header comment
is its full contract. They run only on the Node the surface snapshot was built
on (`surface.json` → `node`). If the running Node differs, stop and say which
Node to use.

## Procedure

### 1. Check the catalog against the LTS

```
node scripts/surface.mjs --check
```

Exit 1 means the LTS moved past the snapshot: the catalog has not reviewed the
newest APIs. Continue, and put that lag at the top of the report with the
command that fixes it (the `node-native-refresh` skill, run in agent-plugin).

### 2. Read the repo's own rules

Read the target's `AGENTS.md` / `CLAUDE.md`. A rule there can ban a native API on
purpose; the lint check in step 4 finds bans that live in shared lint configs.

### 3. Inventory

```
node scripts/inventory.mjs <repo>
```

It lists, per workspace: covered dependencies with their import sites (`mapped`
/ `unmapped` names per site when a catalog entry covers the package),
deprecated and legacy calls, and idiom seed hits. Skip workspaces whose
`runtime` is `browser` and list them in the report. A workspace with both DOM
and node signals is mixed: judge only its Node-run files.

Above 40 sites or 5 workspaces with findings, judge one workspace per read-only
subagent, quoting steps 4–6 of this file and the Contract to each verbatim.

### 4. Judge each dependency site

For each site of a covered dependency, read the site (its `specifier` shows a
subpath import such as `lodash/groupBy`) and decide:

- **Replace**: every used name is `mapped`, no gap applies to the site, and
  the probes cover the rest. Deleting the dependency is the point: name the
  `package.json` entry that goes away (and the wrapper module, if one exists).
  A name with `improvements` still maps: there Node does better than the
  package (AsyncLocalStorage keeps the context across `await`). Name each one as
  a change the migration brings, and check that the site does not rely on the
  package's old behaviour.
- **Partial**: at least one used name can move to Node and something keeps the
  package for the rest: an `unmapped` name, a gap that applies, or an option
  the map does not cover (chalk `hex` maps, but `gaps.hex` says background hex
  does not). List exactly what moves and what keeps the package.
- **Keep**: nothing the site uses can move (every used name is unmapped or a
  gap applies to it), or the repo bans the native replacement. Give the reason.

**A gap applies when the site relies on what it names**: the site's inputs or
options reach that case, or the site's code, its tests or its users depend on
that behaviour. A gap that only changes what is printed and that nothing relies
on (debug → `util.debuglog`: the `NAMESPACE <pid>:` prefix, no colours, the
`NODE_DEBUG` switch) does not keep the package: put it on the Replace line as a
change ("Changes: switch `DEBUG=app` to `NODE_DEBUG=app`").

When the site's own inputs matter (patterns, encodings, options), prove it with
a **site probe**: a module shaped like a catalog entry's `replaces`, keyed by the
bare package name, using the repo's real inputs, written to the scratchpad:

```
node scripts/probe.mjs --site <scratchpad>/site-<name>.mjs --from <workspace dir>
```

It loads the package the way that workspace resolves it and writes nothing
there. `holds` is evidence; anything else is not.

A dependency covered only by e18e (`entries` empty) has no catalog probe: write
a site probe, or report it under **Unproven** with the e18e mapping.

A dependency with `removal` needs no replacement at all: e18e says Node always
has what it provides, and inventory has checked that Node ships it. Report it
under **Replace** as "delete <package>", with `removal` as the reason, after
reading its sites (a check such as `hasSymbols()` goes away with its branches).

**Lint before recommending.** If the repo has ESLint, lint the file with the
replacement applied in memory, from the repo root so its own config and
plugins load, and compare with the original file's own lint:

```
cd <repo> && npx eslint --format json --stdin --stdin-filename <file> < <replaced copy in scratchpad>
```

A new message from a rule that bans the native API (for example
`zukhruf/no-raw-temp-directory` refusing `fs.mkdtempDisposable`) turns the
finding into **Keep**, citing the rule. A new message from another rule (a
cast the replacement needs, refused by `consistent-type-assertions`) is a
reason too: give it. When lint cannot read the file at all (a typed config and
a file no tsconfig includes), say so on the finding.

This lint shows what this repo has on. A catalog `lint` row does not. When a
row has `failed` and the site is the case that its reason names, the finding is
**Keep**, citing the reason.

**Typecheck a TypeScript site.** Run the repo's own type check on the replaced
copy. A type error from a missing declaration of the native API itself (the
installed `@types/node` or TypeScript `lib` does not declare it yet) does not
keep the code: look up whether a released version declares it (`npm view
@types/node versions`, the TypeScript release that adds it to `lib`). If one
does, report Replace with "needs @types/node ≥ <version>"; if none does, report
it under Unproven as "types missing upstream". Any other new type error is a
reason, like a lint message.

### 5. Confirm deprecated calls

Read each `deprecated` hit, confirm the call is the deprecated API, and report
Node's own `guidance` as the replacement.

### 6. Sweep for hand-written equivalents

Seeds are places to look, never coverage. Read the seed hits, then the repo's
helper and utility modules. For each function that re-implements a native API,
write its contract, then prove it: a site probe whose `idioms` row imports the
repo's function by absolute path (`idiom`) and compares it with the native API
(`native`) on the inputs the repo actually passes. For an inline expression
rather than a function (`[...set].sort()`, a has-then-set block), the `idiom`
row reproduces the expression exactly as the site writes it. An `idioms` row
resolves no bare workspace specifiers: import the repo's modules by absolute
path. `holds` → **Replace**;
anything else → **Unproven** with what you saw. State which directories you
read; a directory you did not read is not "clean".

### 7. Report

```
# node-native: <repo> on Node <lts>
<lag line from step 1, if any>

## Replace
- <file:line> <package or helper> → <native API> [needs <flag>] — deletes <what>.
  Evidence: <entry>/<member> holds | site probe <name> holds.
  Mechanical: <plugin/rule> | Not extended: <plugin/rule>, on in <config> | Known bad fix: <plugin/rule>, <reason>.
  Changes: <each improvement the site's names carry, if any>.

## Partial
- <file:line> <package> → <native API> for <names>; keeps the package for <names>.

## Deprecated in Node
- <file:line> <api> → <Node's guidance>

## Keep
- <file:line> <package> — <reason: rule, confirmed gap>

## Unproven
- <file:line> <claim> — <what is missing to prove it>

Skipped (browser): <workspaces>. Read for hand-written code: <directories>.
Not read: <directories and workspaces, and why (a subagent that could not start)>.
```

Each line names `file:line`. A section with nothing in it says "none".

Each catalog `lint` row has one field that says what is true of its rule. Most
rules that the catalog names are not on anywhere, so read the field and report
what it says. The source of these facts is ADR 0008 of `@zukhruf/eslint`.

- `on`: the config that the field names turns the rule on. This is
  `modern-node/recommended`, or `zukhruf/base` for `zukhruf/no-collect-loop`.
  Only this row can give protection. A repo gets the protection only when it
  extends the config. To read this, run
  `cd <repo> && npx eslint --print-config <file>`. If the rule is on, write
  "Mechanical". If it is not on, write "Not extended".
- `failed`: the rule failed on real code. Write "Known bad fix", with the reason.
  Never write "Mechanical" for this row.
- `off`: the rule is off for the reason that the field gives. It gives no
  protection, so do not name it.
- `unmeasured`: nothing has judged the rule. It gives no protection, so do not
  name it.
- `note`: a limit of the rule, such as the files it reads. Write the note when
  it applies to the site.

A `lint` probe that holds shows that the rule fires on the row's own code, and
that the published config agrees with the field. It does not show that the rule covers each idiom of the entry, or that the rule
is exact on other code. To add a rule to `@zukhruf/eslint`, use
`coding:guardrail`.

End with the hand-off: the Replace lines are the input for `coding:remove-code`,
listed as deletions (the dependency, the wrapper), not as swapped calls.
