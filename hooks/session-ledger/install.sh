#!/bin/sh
# Registers the session ledger (README.md "Install") as two user-level git 2.54
# config hooks and marks the time from which it records.
# Undo:
#   git config --global --remove-section hook.session-ledger-commit
#   git config --global --remove-section hook.session-ledger-ref
#   rm ~/.claude/ledger/installed-at
set -e
package=$(cd "$(dirname "$0")" && pwd -P)
git config --global --replace-all hook.session-ledger-commit.event post-commit
git config --global --replace-all hook.session-ledger-commit.command "sh '$package/hook.sh' post-commit"
git config --global --replace-all hook.session-ledger-ref.event reference-transaction
git config --global --replace-all hook.session-ledger-ref.command "sh '$package/hook.sh' reference-transaction"
mkdir -p "$HOME/.claude/ledger"
date -u +%Y-%m-%dT%H:%M:%SZ > "$HOME/.claude/ledger/installed-at"
git config --global --get-regexp '^hook\.session-ledger'
