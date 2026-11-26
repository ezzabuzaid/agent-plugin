# Session ledger

Housekeeping must know each commit and each push of a session. Before this folder, close-check found them in the output of the session's commands, and each new way to run git (a redirected push, a prefixed log line) needed a new parser. Here git itself records each commit and each tracking-ref update, at the moment it makes it, in a ledger of the session.

## What it records

git 2.54 runs `hook.sh` as two user-level config hooks (`hook.<name>.command` and `hook.<name>.event`, git-hook(1)), and `hook.sh` starts `node ledger.ts` when there is something to record. When `CLAUDE_CODE_SESSION_ID` is set (subagents get the id of their parent session), the ledger appends one JSON line per fact to `~/.claude/ledger/<session id>.jsonl`, in one append write:

| Event | Line |
| --- | --- |
| `post-commit` | `{"session":"<id>","kind":"commit","repo":"<top level>","sha":"<HEAD>","ref":"refs/heads/main","at":"<ISO time>"}`; `ref` is `null` on a detached HEAD |
| `reference-transaction`, state `committed` | `{"session":"<id>","kind":"ref","repo":"<top level>","ref":"refs/remotes/origin/main","new":"<sha>","by":"push","at":"<ISO time>"}`, one line for each updated ref under `refs/remotes/` |

`by` is `push`, `fetch` or `unknown`. git gives the reason for a ref update only in the reflog entry, which it writes in the same transaction, before the `committed` hook runs. A push writes `update by push` (git `transport.c`, `update_tracking_ref`). A fetch writes `<action>: <fast-forward|storing head|...>` (git `builtin/fetch.c`), so a pull, a clone and a remote update are `fetch` too. A repo with `core.logAllRefUpdates=false` has no reflog entry, and its lines are `unknown`. `GIT_REFLOG_ACTION` does not help: git push and git fetch do not set it (only pull does).

The ledger writes nothing:

- when `CLAUDE_CODE_SESSION_ID` is not set (a human commit or push);
- for a repo in the system temp folder: under the real path of `$TMPDIR` (default `/tmp`) or of `/tmp`. A test suite that an agent runs passes the agent's session id to git, and its fixture repos and bare remotes live there and are gone after the run;
- for a repo under `~/Desktop/mo`;
- in a bare repository (the receive-pack of a local bare remote runs the same user-level hook);
- for a ref outside `refs/remotes/`, a symbolic ref (`refs/remotes/origin/HEAD`), or a deleted ref (all-zero new value);
- for a rejected push, because git moves no tracking ref.

Each hook exits 0, also on an error (it then writes `ledger: <message>` to stderr). git ignores the exit of `post-commit` and of `reference-transaction` in state `committed` (githooks(5)), so the ledger never blocks git.

## Install

Run this once:

```
sh <repo>/hooks/session-ledger/install.sh
```

It registers the two hooks in your global git config, with the path of its own folder:

```
hook.session-ledger-commit.event post-commit
hook.session-ledger-commit.command sh '<repo>/hooks/session-ledger/hook.sh' post-commit
hook.session-ledger-ref.event reference-transaction
hook.session-ledger-ref.command sh '<repo>/hooks/session-ledger/hook.sh' reference-transaction
```

and writes the install time (ISO 8601, UTC, one line) to `~/.claude/ledger/installed-at`. Run again, it replaces the values of the same keys and writes a new time. The ledger records every commit and every push of each session that began after `installed-at`, while both hooks stay registered. For a session that began before it, a missing line does not mean that the session made no commit or push.

git runs a config hook through the shell and appends the hook's arguments as `"$@"`, so for `reference-transaction` the state is `$2` of `hook.sh`. A node start takes 100 to 200 ms under load; `hook.sh` starts node only for `post-commit`, and for `reference-transaction` only in state `committed` (git runs it also in `preparing` and `prepared`) with a stdin line under `refs/remotes/`, which it passes on to node unchanged. So a commit starts node once, and the update of its branch none. A human commit or a commit in the temp folder starts no node.

Undo:

```
git config --global --remove-section hook.session-ledger-commit
git config --global --remove-section hook.session-ledger-ref
rm ~/.claude/ledger/installed-at
```

## Limits

- A ref update that a tool other than git push or git fetch makes under `refs/remotes/` (for example `git update-ref`) is labelled `fetch`, from its reflog message.
- When two processes update the same tracking ref at once, the reflog entry that the hook reads can be the other one's.
- A deleted remote branch is not recorded.
- A repo that a session keeps in the temp folder (a scratch clone in `/tmp`, or in Claude Code's scratchpad under `/private/tmp`) is not recorded.

## Test

```
npm install --prefix hooks/session-ledger
npm test --prefix hooks/session-ledger
```

The tests run real git with a temporary `HOME` and `GIT_CONFIG_GLOBAL` in which `install.sh` registers the hooks, a `TMPDIR` of their own, a `node` on `PATH` that logs each start, and a temporary bare remote. They do not read your git config or your session id. The fixtures live in the runner's temp folder, so the tests need one outside `/tmp` (macOS gives `/var/folders/...`); on a runner whose temp folder is `/tmp` the hook skips every fixture.
