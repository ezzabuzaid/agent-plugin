---
name: lib-creator
description: Creates a library package from the first question to the last consumer. Decides whether the library should exist and where (own packages, native Node, npm, the Rule of Three), takes its scope and name from the standard libraries of Go and .NET, puts its API on paper for review before any code, scaffolds it from the repo's newest package of the same kind, tests it black-box, releases it the way the repo releases, and moves every consumer off its copy. Use when someone asks for a new package, library, module or stdlib area; when a third copy of the same knowledge appears (strike 3); when code moves into a shared or stdlib repo such as zukhruf; when hosts keep deriving a fact that a package should own; and before you add a package.json under packages/.
---

# Lib Creator

A library is a promise to each consumer it will ever have. Thus a library must earn its place. Its scope, name and API come from its domain and from the leading tools, not from its first caller. Its API is reviewed on paper before any code. It ships whole before a consumer depends on it. The evidence for each step (the user's words, the incident, the source memory) and the settled conflicts between rulings are in [references/RULINGS.md](references/RULINGS.md).

Most rules that this skill applies have a home elsewhere. The skill points to them and does not copy them:

- The user's CLAUDE.md: the Rule of Three, the Stable Dependencies Principle, Make Illegal States Unrepresentable, EAFP, the testing rules.
- Skills: `coding:node-native`, `coding:write-test`, `coding:remove-code`, `coding:guardrail`.
- The target repo: its README, GLOSSARY-MAP, ADRs and CI workflow. Its ADRs win over this skill. In zukhruf, root ADR 0001 gives the layers and the rules for what enters a package (tiny helpers and test helpers stay copied), ADRs 0002 and 0003 the package families, ADR 0004 the clock, and the README the `@zukhruf/source` condition and the release.

Copy this checklist into your response and tick it off as you go:

```
- [ ] 1 Decide: verdicts for own packages, Node and npm; strike; owner table; home (or the exit: adopt)
- [ ] 2 Name: Go and .NET survey; name with a precedent; now/later/never map
- [ ] 3 Paper: leaders table; README, GLOSSARY.md and ADRs committed alone; user ruled on each change
- [ ] 4 Visibility: user said public or private
- [ ] 5 Scaffold: copied from the newest package of the same kind; lockfile and root reference in the same commit
- [ ] 6 Build: write-test; every CI step green, the workspace-wide ones too
- [ ] 7 Release: the repo's own flow; version proved on the registry
- [ ] 8 Consumers: the published version installed in each; each copy deleted; ledger and backlog item closed, when they exist
```

Before you count places or plan a migration, drop the repos that the user has ruled out of rollouts (their memory names them), and say so in the plan.

## 1. Decide whether the library should exist, and where

Do this step before the first design message.

1. **Inventory first.** List each package of the user's own package repos (zukhruf, deepagents, sdk-it, elt; the user's memory names their checkouts) and of this repo. Grep their `src` by concept and read the README of each hit, because most package.json descriptions are empty. Add the third-party packages already in the repos' lockfiles. Map each job of the request to a package or to a named gap. Read the docs in the source checkout, because a published tarball often has no README.
2. **Ask Node.** Use `coding:node-native` to learn whether the current Node LTS does the job. Search the exports of every built-in module for the concept's words, not the module names: a function such as `util.throttle` lives inside a module whose name says nothing (`node -e "for (const m of require('node:module').builtinModules) { let x; try { x = require(m) } catch { continue } for (const k of Object.keys(x)) if (/throttle|debounce/i.test(k)) console.log(m + '.' + k) }"`, with the words of your concept). Probe each hit side by side with the requirement (or the copy) on the same input, on each runtime that a consumer runs: CI's version, a Docker base image, the Node inside Electron.
3. **Ask npm.** Search the `@stdlib` scope of stdlib-js first (`curl -s 'https://registry.npmjs.org/-/v1/search?text=keywords:stdlib%20<term>'`; a workspace scope of the same name does not count), then npm, then the APIs of popular projects of the field, and list the terms you searched. Write the requirements as checks. For each candidate, read its source and probe it live in an empty scratch folder, never in the shared workspace root. Make a table: last release, weekly downloads (`curl -s https://api.npmjs.org/downloads/point/last-week/<pkg>`) and the install footprint (`npm install --dry-run`, in the scratch folder). The footprint is a fact for the user, not a veto. Write down why each candidate fails; the README carries that table.
4. **Exit when Node or a package does the job:** adopt it. Each requirement it misses (no clock input, no `AbortSignal`, one runtime without it) is a named gap for the user to rule on, not a silent rejection. Then do items 5 and 6 for the places and the owner table, and go to step 8: the copies move onto what you adopted, and the host keeps the jobs that the owner table gives it. Steps 2 to 7 do not apply.
5. **Count the places** that hold the same knowledge, in every repo that could hold a copy, and say the strike (CLAUDE.md: count knowledge, not lines). A clone of an upstream project is not a place. Search by concept: several synonyms, the backlog (`agent-backlog list --all-repos --search <word>`, one word for each search), and code that makes the same decision under other names.
   - Code you found, not a request: strike 1 stays inline; strike 2 is a copy with a ledger and a backlog item that waits for a third consumer; strike 3 is a library (after an exit, the adopted package).
   - A package the user asks for by name: report the strike and the callers, and continue when the user confirms. A domain-free package that the user calls stdlib and wants on npm moves at strike one.
   - A host that must decide something a package's concept implies is a gap of that package, at any strike.
6. **Split the request into jobs.** Trace each real caller. Make an owner table: job → who can know it → owner. The library takes only the jobs that a stranger who installs it from npm needs. Host words, wiring, storage and display stay in the host.
7. **Pick the home.** Domain-free code goes to the user's stdlib repo, and the origin keeps no copy beyond what the repo's ADRs keep copied. A concept of one product stays in that product's repo. In a layered repo, the layer comes from its ADR, before the first import. Name each rejected home and why; the size of the work never decides a home or a design. When code moves out of an origin repo, first sweep that repo for code of the same concept and fold it in while the package is still local.
8. **Read the history** of what the library replaces: the backlog items and their links (each item's own fix direction too), `git log --all -S <term>`, the ADRs, GLOSSARY.md, the user's memory and past session transcripts. Each earlier decision that the library reverses goes on the paper.

**Done when** the plan opens with these verdicts: package / Node / npm (or the adoption), the strike, the owner table and the home.

A verdict comes from a check that ran, never from memory. When a check cannot run here (no shell, the registry is blocked), write that verdict as open, in three parts: what is open, the exact command that settles it, and what each result decides (for example: a package that does the job means adopt it, none means a library). A name you remember is not a candidate until the command has run. Then stop at step 1: a name, a map or an API before every verdict is settled can be undone by an adoption.

## 2. Take the scope and the name from the standard libraries

- Draw the now/later/never map of the domain first. The name covers the whole map. The "now" column is the first release.
- Find what Go and .NET offer for the same need: their standard libraries, `golang.org/x`, and their most used packages. Check whether they put it inside a bigger package (Polly, failsafe-go). Walk each place that needs it and the scenarios that each place goes through. A need that they do not cover takes the textbook term of its domain, with a source.
- Name the package after its concept, not after its first tool, first member or first caller: `@zukhruf/nx` with `./format`, not `@zukhruf/prettier`. When Go and .NET disagree, propose one name with both sources; the user rules on it in step 3.
- A family follows the repo's precedent: separate packages in one folder (zukhruf ADRs 0002 and 0003) or one package with a subpath for each member (`@zukhruf/evals`).
- A class or module name is plural only for a collection. No `xOf` functions: the type that owns the data gets the behavior (`TokenUsage.from(usage)`).
- Say at once when a word is your own. Never name code after the reference that you port; cite the reference only in comments.

**Done when** the name has a cited precedent and the map is in the plan.

## 3. Put the API on paper and get it reviewed

1. **Survey the leaders.** For each design choice, read the source of the leading tools and show a table: tool → choice → link. Use what they ship. Use your own judgment only where no leader covers the case, and say that it is yours. When the choice is push or pull, put a real push option in the table and measure it beside the pull ones.
2. **Ports copy the upstream exactly:** names, defaults, errors and the upstream's own types, without its legacy aliases. Each divergence is a decision on the paper. A missing upstream feature goes to the user; do not port it unasked.
3. **Design from the domain, at full strength.** Design the API as classes; name the GoF, Fowler or Evans pattern each responsibility follows. Consumers follow the package (Stable Dependencies). A call site is evidence, never the source of an API. Apply Make Illegal States Unrepresentable to each type.
   - The clock, env and paths are required inputs with no default (zukhruf ADR 0004). A port keeps its upstream's signature.
   - The package exports and throws its own error classes, with a class only where the caller's next step differs. It never takes a host's error class.
   - The package exports mechanism (classes, functions), never instances or `configure*` slots. A thing that owns a resource over time is a class with `[Symbol.asyncDispose]`.
4. **Write the paper** in the doc shape of the repo; read a sibling's README, GLOSSARY.md and `docs/adr` first. The README has task sections, the signature block, a call → what happens underneath table, the errors, "the same concepts in other systems", why each npm candidate failed, and who uses what. GLOSSARY.md holds the glossary. Each decision gets an ADR whose name is a sentence. A port keeps `docs/ported-from-<upstream>.md`.
5. **Commit the paper alone,** in a folder with no package.json and no tsconfig, with a "design for review" banner: `docs(<pkg>): the API on paper of …, for review before any code`.
6. **Review it in chat,** not as a path. Show the now/later/never map, the layer diagram, and each decision with its precedent. Show each change that a caller can see (export, signature, option, default, error) as before/after with its cost. Say what you decided and why. Then get the user's ruling on each change with AskUserQuestion in the same turn.

**Done when** the user has ruled on the paper. No code comes before that.

## 4. Ask public or private

Before the first code commit, ask the user whether the package is public or private, and make it `"private": true` until they answer. In a repo that releases on push, any session's next push publishes each package that is not private. After step 5, confirm the release tag (`npm:public` or `npm:private` in zukhruf) with `nx show project <name> --json`.

## 5. Scaffold from the newest package of the same kind

1. **Find the template:** the newest package of the same kind (folder depth, layer, visibility). List the package commits with `git log --diff-filter=A --format='%h %ad %s' --date=short -- 'packages/**/package.json'`, and read the template commit's file list with `git show --stat <sha>`. Copy the shape of those files as they are at HEAD, not as the commit added them.
2. **Keep what the repo decided:** the export map (each entry lists the `@<scope>/source` condition first, pointing at `src`; never `development`), `files`, the tsconfig files, the license and the current version of a fixed release group. Keep the kinds of project tags, but take the layer from step 1, item 7.
3. **Dependencies:** the latest stable version (`npm view <pkg> dist-tags`) as `^<latest>`. Workspace siblings and peers follow the siblings and the ADRs (zukhruf: a private package takes its siblings as `"*"`; a UI extension keeps its UI package as a peer). Run `npm config get legacy-peer-deps` in each consumer: where it is true, npm installs no peers, so the package lists each peer that its dependencies need as its own dependency. No `engines`.
4. **The first code commit carries the wiring:** the lockfile that `npm install` writes at the root, and the root tsconfig reference, added by hand in the same form as the template's. `nx sync:check` checks the reference. Never run `nx sync` in a tree that other sessions share; when you create the package folder there, tell the peer sessions at once and commit soon.
5. **Read the inferred targets** with `nx show project <name> --json` before you add one. A target that several projects run the same way goes in nx.json `targetDefaults` with a tag filter.

**Done when** `nx show project <name> --json` shows the targets and tags that the siblings have.

## 6. Build and test it

- Load `coding:write-test` before the first test, and follow it.
- Build the units of the paper in dependency order. When the user wants to learn the package, build one unit at a time: teach it, test it, commit it, pause.
- A port proves itself with one scenario suite that runs against the real upstream and against the port.
- Each rule that a machine can see goes into a check (`coding:guardrail`), not into the README.
- Before you call it green, run each step that the CI workflow runs: the project's targets (`nx show project <name> --json`) and the workspace-wide steps that a new package trips, such as `nx sync:check`, the format check and the lint of package.json and the lockfile.

## 7. Release it the way the repo releases

In a shared checkout, a commit on main ships with the next push of any session. Thus the gate (step 6) runs before the commit. Commit verified work without asking. Push when the repo's own `.claude/settings.json` allows `git push`; otherwise ask the user, because step 8 waits for that push. Never write `type!:` or a `BREAKING CHANGE:` footer; describe a break in plain words.

Before a push, run `git fetch origin` and list `git log --format='%h %ar %s' origin/main..HEAD`: every session commits as the same author, so only the subject and time tell whose a commit is. Message the owner of each commit that is not yours and push only on its yes; silence is not a yes. Push the whole of main (`git push origin main`), never a chosen commit.

Read the repo's release section and workflow before the first push, and follow them:

- zukhruf: the README's `## Release`. Never run `nx release` or make tags.
- deepagents: push main and wait for green CI; the user runs `nx release`.
- A repo with no workflow releases nothing on push: run each check locally and name what ran.

Prove the publish on the registry (`npm view <pkg> version --prefer-online`), not only from the log.

## 8. Move every consumer onto it

Load `coding:remove-code` when you plan the migration, before the first `mv`, `rm` or rewrite.

1. **The package leads.** The "now" part of the map is built and proved by the package's own tests before any migration starts, so that each consumer moves once. File one migration backlog item for each consumer repo, with a map from old names to new names.
2. **Release, then install the published version.** Push the package as step 7 says (in a repo that releases on push, a push to main releases it). When `npm view <pkg> version --prefer-online` shows the version, run `npm install <pkg>@<version>` in each consumer, and commit the migration with that pin and the lockfile. Never consume an unreleased package from another checkout: no `npm link`, no symlink, no `npm install` of a path or a `file:` spec. Through a link, each side loads its own copy of a shared dependency, so the consumer's tests prove a tree that never ships. The package's own tests prove it before the push, and the consumer's tests prove the consumer after the install. A red consumer is fixed forward with the next push of the package.
3. **Test the copy before the swap.** Write a black-box test of the copy with golden values. It passes on the old code and passes unchanged after the swap. Where the swap fixes an old quirk on purpose, change that golden value in the swap commit and name the change to the user. Behavior that the copy cannot show without a test seam (it reads the time itself) is named as untested on the old side; the package's own tests cover it.
4. **One slice at a time** (Strangler Fig): extractions and design fixes first, the swap last. Keep the best behavior, not the old quirks.
5. **Delete the copies.** Leave no re-export at the old path. Close the copy ledger and its backlog item, when they exist.
6. **A gap stops the step.** When a consumer finds a gap in the package, report it with evidence (file:line or a probe) and file it. Stop before the step that would copy the gap or depend on it. Never work around a gap in the consumer.

## Traps

- A new package folder must match a root `workspaces` glob, or npm does not link it and consumers get TS2307.
- A consumer with no source condition type checks against the package's `dist` declarations. Build the package before you check that consumer.
- `nx sync` with a stale project graph deletes valid tsconfig references. Run `NX_DAEMON=false npx nx reset` first, and diff the tsconfig files after.
- A TS2307 under nx typecheck for a workspace package that exists and is linked comes from a stale `.tsbuildinfo`. Run `nx reset`; do not add paths or references.
- Each esbuild `additionalEntryPoints` entry is its own bundle, so a class that two subpaths share gets two identities and `instanceof` fails.
- A consumer that loads a shared dependency (React, pg, `ai`) twice gets two identities, and `instanceof` fails. Fix the resolution in the consumer, not in the library.
