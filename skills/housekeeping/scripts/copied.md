# Copies in these scripts (Rule of Three, strike 2)

Two pieces are copied between `close-check.mjs` and `records-check.mjs` on purpose. A third script that needs either one extracts it into `lib/` and switches all three; until then, mirror every fix in both copies and name both files in the commit.

| Piece | Source | Copy | What differs |
|---|---|---|---|
| `agent-backlog` call (`execFileSync('agent-backlog', …, { maxBuffer })`, the ENOENT message as an open item) | `close-check.mjs` | `records-check.mjs` | the subcommand and its arguments |
| Start and end: `parseArgs` + `UsageError`, the exit-code wrapper (0 nothing open, 1 open, 2 usage or read error) | `close-check.mjs` | `records-check.mjs` | the option names |

The transcript reading both scripts share is not copied: it lives once in `lib/session.mjs`.
