# Copies in this skill (Rule of Three, strike 2)

One piece is copied between the prune script and the corpus reader on purpose. A third place that needs it extracts it and switches all three; until then, mirror every fix in both copies and name both files in the commit.

| Piece | Source | Copy | What differs |
|---|---|---|---|
| What an index file is: `/^MEMORY.*\.md$/` (MEMORY.md and split indexes such as text2sql's MEMORY-feedback.md) | `scripts/prune-memory.ts` (the index list it edits, and its refusal to prune an index) | `memory/corpus/repository.ts` (`isIndex`, the files it skips when it reads memories) | nothing; `hasIndex` in the reader still means MEMORY.md itself, because Claude Code loads only that file |
