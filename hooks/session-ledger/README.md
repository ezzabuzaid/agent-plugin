# Session ledger

Housekeeping must know each commit and each push of a session. Before this folder, close-check found them in the output of the session's commands, and each new way to run git (a redirected push, a prefixed log line) needed a new parser. Here git itself records each commit and each tracking-ref update, at the moment it makes it, in a ledger of the session.

## What it records

git 2.54 runs `ledger.ts` as two user-level config hooks (`hook.<name>.command` and `hook.<name>.event`, git-hook(1)). When `CLAUDE_CODE_SESSION_ID` is set (subagents get the id of their parent session), the ledger appends one JSON line per fact to `~/.claude/ledger/<session id>.jsonl`, in one append write:

| Event | Line |
| --- | --- |
| `post-commit` | `{"session":"<id>","kind":"commit","repo":"<top level>","sha":"<HEAD>","ref":"refs/heads/main","at":"<ISO time>"}`; `ref` is `null` on a detached HEAD |
| `reference-transaction`, state `committed` | `{"session":"<id>","kind":"ref","repo":"<top level>","ref":"refs/remotes/origin/main","new":"<sha>","by":"push","at":"<ISO time>"}`, one line for each updated ref under `refs/remotes/` |

`by` is `push`, `fetch` or `unknown`. git gives the reason for a ref update only in the reflog entry, which it writes in the same transaction, before the `committed` hook runs. A push writes `update by push` (git `transport.c`, `update_tracking_ref`). A fetch writes `<action>: <fast-forward|storing head|...>` (git `builtin/fetch.c`), so a pull, a clone and a remote update are `fetch` too. A repo with `core.logAllRefUpdates=false` has no reflog entry, and its lines are `unknown`. `GIT_REFLOG_ACTION` does not help: git push and git fetch do not set it (only pull does).

The ledger writes nothing:

- when `CLAUDE_CODE_SESSION_ID` is not set (a human commit or push);
- for a repo under `~/Desktop/mo`;
- in a bare repository (the receive-pack of a local bare remote runs the same user-level hook);
- for a ref outside `refs/remotes/`, a symbolic ref (`refs/remotes/origin/HEAD`), or a deleted ref (all-zero new value);
- for a rejected push, because git moves no tracking ref.

Each hook exits 0, also on an error (it then writes `ledger: <message>` to stderr). git ignores the exit of `post-commit` and of `reference-transaction` in state `committed` (githooks(5)), so the ledger never blocks git.

## Install

Run these once:

```
git config --global hook.session-ledger-commit.event post-commit
git config --global hook.session-ledger-commit.command '[ -z "$CLAUDE_CODE_SESSION_ID" ] || exec node <repo>/hooks/session-ledger/ledger.ts post-commit'
git config --global hook.session-ledger-ref.event reference-transaction
git config --global hook.session-ledger-ref.command '[ -z "$CLAUDE_CODE_SESSION_ID" ] || [ "$1" != committed ] || exec node <repo>/hooks/session-ledger/ledger.ts reference-transaction'
```

git runs a config hook through the shell and appends the hook's arguments as `"$@"`, so `$1` is the transaction state. The shell test starts node only when there is something to record: a node start takes about 50 ms, and git runs `reference-transaction` three times (`preparing`, `prepared`, `committed`) for each ref update. A human commit starts no node. An agent commit starts it twice (`post-commit` and the `committed` update of its branch).

## Limits

- A ref update that a tool other than git push or git fetch makes under `refs/remotes/` (for example `git update-ref`) is labelled `fetch`, from its reflog message.
- When two processes update the same tracking ref at once, the reflog entry that the hook reads can be the other one's.
- A deleted remote branch is not recorded.

## Test

```
npm install --prefix hooks/session-ledger
npm test --prefix hooks/session-ledger
```

The tests run real git with a temporary `HOME` and `GIT_CONFIG_GLOBAL` that register the hooks as Install says, and a temporary bare remote. They do not read your git config or your session id.
