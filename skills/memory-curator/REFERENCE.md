# Memory Curator — Reference

## Reading the corpus (the only entry point)

`~/.claude/skills/memory-curator/memory/cli.ts` (run via `node`, no build, works from any cwd — the CLI and its deps are bundled with this skill). Relevant commands:

| Command | Use |
|---|---|
| `export` | full corpus, **compact** (no bodies) — feed to the clustering agents (already JSON; no `--json` flag) |
| `export --print` | corpus **with bodies** — only if you need everything at once |
| `show <slug>` | one memory in full (frontmatter + body) — per-cluster body fetch. A slug in several projects takes `Project/file.md`, as its ambiguous-match list prints |
| `recall "<q>" --json` | semantic top-K — Insight mode + verifying a cluster theme |
| `search "<regex>"` | literal matches — find every memory mentioning a term |
| `issues` | drift / malformed / missing-index — feeds `obsolete`/cleanup |

Filters compose: `--project <id>`, `--type user|feedback|project|reference`, `--stale <days>`.

## Classification rubric (per cluster)

- **`guardrail`** — a cluster whose rules pass `coding:guardrail`'s `## The test`.
- **`skill`** — 3+ memories describing one coherent multi-step workflow or domain that an agent could follow as a procedure (e.g. a deploy runbook, a content pipeline). The skill replaces the scattered memories with one procedure.
- **`merge`** — near-duplicates (often cross-project, e.g. two "no git stash"): same rule stated N times. Collapse to one canonical memory.
- **`obsolete`** — contradicts current code, names a deleted file/flag, or is superseded by a newer memory. Requires code verification.
- **`keep`** — atomic, contextual, or load-bearing. **The default.** Identity (`user`) and one-off corrections usually stay.

## Artifact templates

**guardrail** — follow `coding:guardrail`. Write the check where its Output's `home` says.

**skill** — `.claude/skills/<kebab-name>/SKILL.md` with the write-a-skill frontmatter (`name`, `description` with "Use when…"), under 100 lines, references one level deep. The body distills the source memories into a procedure.

**merge** — pick the richest memory as canonical; fold unique detail from the others into its body; rewrite its `description`; prune the rest. Repoint any `[[wikilinks]]` that targeted a pruned slug to the canonical one.

## Memory mechanics + pruning

Each memory is one `<type>_<slug>.md` under `~/.claude/projects/<encoded>/memory/`, linked from the folder's `MEMORY.md` index (some folders split it into more `MEMORY-*.md` files, and one index line can link several memories). Canonical frontmatter is `name` / `description` / `metadata:{node_type, type, …}` (the reader tolerates the older flat shape).

Prune with the helper. It deletes the file, removes its link from every `MEMORY*.md` index in the folder (a line that linked only that memory goes; a line that links others keeps them), and prints each edited index line and each `[[wikilink]]` to it that now dangles in the folder's other memories:
```
node ~/.claude/skills/memory-curator/scripts/prune-memory.ts <abs-path-to-memory.md>
```
Never hand-edit an index for deletions (you'll desync it). Repoint each dangling `[[wikilink]]` the helper prints: to the canonical's slug when it is in the same folder, else to a plain-text pointer `<slug> (<project> memory)`, because a `[[wikilink]]` resolves only in its own folder. The helper refuses to prune an index file itself.

The encoded folder names start with `-` (`-Users-…`). From `~/.claude/projects`, a glob such as `grep -rl <text> */memory/*.md` hands them to grep as options, and the search finds nothing and prints no error. Write `./*/memory/*.md`, or put `--` before the paths.

## Apply protocol (Mode A, after the single approval)

1. Write all artifacts first (guardrails, skills, merged canonical memories). Prove each check with the proof that its `coding:guardrail` Output names.
2. Only then prune subsumed memories, one `prune-memory.ts` call each.
3. **Preserve residual value:** before pruning a memory, confirm the artifact captures *everything* the memory carried. If a check covers only part of a memory (the `remainder` in its `coding:guardrail` Output), keep a slimmed memory for the remainder; only remove the part the check now enforces.
4. Log every file written and every memory pruned (path + which cluster/artifact subsumed it).
5. Never prune `user`/identity memories. Treat `merge` across projects carefully — the canonical memory lives in one project; note the others are gone.

## Subagent orchestration

Two kinds of subagent:
- **`memory-analyst`** (read-only, `~/.claude/agents/memory-analyst.md`) — does the data collection (clustering and insight). Spawned once PER PROMPT VARIANT (below), in parallel, single message.
- **Drafting** subagents (general-purpose, can write) — one per actionable cluster in Mode A step 3: body-fetch → verify → draft artifact → subsumed-list. The cluster is the unit of work; keeps the main context clean.

You (the orchestrator) merge the analysts' structured returns. For a large corpus, cap the first pass at the highest-confidence clusters and report what was deferred.

## Prompt-variance fan-out (collect proper data)

A single prompt has blind spots. For each data-collection step, spawn ONE `memory-analyst` per variant below, in parallel, then MERGE: union findings, dedupe by member slug, reconcile conflicting tags. Add variants for more coverage; report which ran and what each contributed.

**Clustering variants (Mode A step 2)** — each runs over the compact `export` dump:
- *Mechanism* — paste `coding:guardrail`'s `## The test`, then: "Group memories whose rule passes the test vs memories whose rule does not. Tag the passing clusters `guardrail`, and quote the violation a machine would see."
- *Topic/domain* — "Group by domain (testing, git, UI, infra, data, prompts…). A domain with 3+ procedural memories is a `skill` candidate."
- *Duplication* — "Find sets stating the SAME rule, especially across projects. Tag `merge`; name the canonical one."
- *Obsolescence* — "Find memories naming a specific file/flag/API/version (drift-prone) or superseded by a newer one. Tag `obsolete` (to be code-verified)."

**Insight variants (Mode B)**:
- *Process* — "How does the user prefer work conducted — planning, questions, communication, decisions?"
- *Frictions* — "What does the user correct or push back on repeatedly — anti-patterns, pet peeves, mistakes I keep making?"
- *Stack* — "What tech / tools / libraries / testing styles does the user prefer vs reject?"
- *Identity / constraints* — "Hard constraints + identity — role, expertise, personal (schedule, diet), non-negotiables."
- For "would tool X help": also run — "what frictions would X remove?", "what does the user already do that overlaps X?", "what would the user dislike about X given their preferences?"

**Merge rule:** a memory surfacing under multiple lenses is signal — reconcile it (a duplicate that is also a `guardrail` → prefer the guardrail, note the duplication). Triangulate insight findings; flag where variants disagree rather than averaging them away.

## Insight mode — where the signals live

- `feedback` memories = how the user wants work done → working style, corrections, anti-patterns, recurring frictions.
- `user` memories = identity, expertise, preferences, constraints (diet, schedule, role).
- `project` memories = what they're building and why.
- For "would tool X help": recall the friction memories, map them to what the tool removes, and answer with the specific memories as evidence (cite `project/file`). Honest fit assessment — say when it wouldn't help.
