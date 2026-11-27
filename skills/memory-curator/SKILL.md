---
name: memory-curator
description: >-
  Audit and consolidate the Claude Code auto-memory corpus, and answer questions about how the user works. Reads the corpus via the bundled memory CLI (export, recall, show) and fans out subagents to cluster memories and turn redundant clusters into guardrails (checks a machine runs: lint rules, hooks, CI checks…), skills, or merges, flag obsolete memories, and surface working-pattern insights. Use when asked to consolidate, distill, curate, or clean up memories; turn memories into an eslint rule, hook or other check, or a skill; find redundant, duplicate, or obsolete memories; or analyze how I work, my recurring patterns/pain points, or whether a tool would fit my workflow.
---

# Memory Curator

Operates on the Claude Code auto-memory corpus (**every project by default**). Read it ONLY through `node ~/.claude/skills/memory-curator/memory/cli.ts` — never hand-scan `~/.claude`. The corpus is multi-writer; re-dump fresh every run. Pick the mode from the request.

## Mode A — Consolidate
*(distill / clean up / curate / "turn memories into X" / find redundant|duplicate|obsolete)*

1. **Dump (compact, no bodies):** `node ~/.claude/skills/memory-curator/memory/cli.ts export` → JSON `[{id, label, dir, hasIndex, memories:[{file,project,projectLabel,name,description,bodyType,…}]}]`. Narrow with `--project <id>` / `--type <t>` only if the user scoped it. (`export` is already JSON — there is no `--json` flag; add `--print` for bodies.)
2. **Cluster + classify (variance fan-out):** spawn one `memory-analyst` agent per *clustering variant* (REFERENCE → "Prompt-variance fan-out") in parallel — each pursues one lens (mechanism / topic / duplication / obsolescence). Then MERGE their clusters: union, dedupe by member slug, reconcile tags. Load `coding:guardrail` first and paste its `## The test` into the *Mechanism* prompt. Each cluster lands tagged `guardrail` | `skill` | `merge` | `obsolete` | `keep` per the rubric in [REFERENCE.md](REFERENCE.md). Default to `keep` when unsure.
3. **Draft:** fan out ONE subagent per *actionable* cluster (Agent tool, in parallel). Each fetches member bodies (`node ~/.claude/skills/memory-curator/memory/cli.ts show <slug>`), re-confirms the tag, drafts the artifact, and lists the exact memory files it subsumes:
   - `guardrail` → the drafter follows `coding:guardrail` and returns its `## Output` block, plus the exact memory files it subsumes. The drafter may not write, so its Output says `proof: not run`; step 5 writes the check and runs that proof.
   - `skill` → a new `.claude/skills/<name>/SKILL.md` (follow the write-a-skill structure).
   - `merge` → one canonical memory (keep the richest, fold in the rest, relink `[[wikilinks]]`).
   - `obsolete` → a deletion rationale, **verified against current code**, not just the memory text.
4. **Present the plan:** a prioritized table — cluster → action → artifact preview → memories it removes. Rank `guardrail` rows by how often the mistake recurs × what one miss costs. Read both from the memory bodies (incident dates, repeated corrections, outages). Call out anything touching `user`/identity memories explicitly.
5. **Apply on ONE approval** (AskUserQuestion). Per item: write the artifact, then prune each subsumed memory with `node ~/.claude/skills/memory-curator/scripts/prune-memory.ts <path>` (removes the file and its links from every `MEMORY*.md` index, and prints the `[[wikilinks]]` that now dangle). Log every change. NEVER prune value the artifact doesn't fully capture (see REFERENCE → "preserve residual value").
6. **Prove a check before you trust it:**
   - **Blind judge:** before a block goes live, have an agent that did not write it judge a random sample of its hits, with no access to the reasoning. An author's own sample scored a check 0 of 40 where a judge scored it 29 of 30, and that check was removed.
   - **Other checks:** after a shell or tool setting changes, replay all existing checks. A new setting can make an old block refuse commands that now work.
   - **Failure modes:** run the hook with each of its files broken on purpose. A hook that exits with anything but 2 lets the command run.
   - **Real commands:** replay them in `sandbox-exec` (no writes, network or signals). Drop any under `~/Desktop/mo`.
   - **After install:** read the real denials in peer sessions.
7. **Leave no trace in memory:** when a check or setting removes a trap, delete the text about it in the same step. Keep no dated "used to" note. Rename a memory whose name no longer says what it holds. Check that a memory's claims still hold against the code it names.

## Mode B — Insight (read-only)
*("how do I work" / "my patterns / pain points" / "would tool X fit my workflow")*

1. Pull memories: `node ~/.claude/skills/memory-curator/memory/cli.ts recall "<the question>" --json` (semantic) and/or `export` for breadth; add `--type feedback`/`user` for working-style signals.
2. **Variance fan-out:** spawn one `memory-analyst` agent per *insight variant* (REFERENCE → "Prompt-variance fan-out") in parallel, then synthesize across them. One framing has blind spots; the variants triangulate.
3. Answer grounded in specific memories (cite `project/file`). Make NO corpus changes.

## Safety (both modes)
- High-confidence only; a wrong consolidation permanently loses real context.
- Never delete `user`/identity memories, or anything not fully subsumed by its artifact.
- Exactly one human approval gate before any write or delete.

See [REFERENCE.md](REFERENCE.md) for the classification rubric, artifact templates, apply protocol, and insight-mode signal map.
