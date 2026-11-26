#!/bin/sh
# The session ledger's one hook (README.md). git 2.54 runs it as a config hook
# and appends the hook's own arguments:
#   sh hook.sh post-commit
#   sh hook.sh reference-transaction <state>   (stdin: "<old> <new> <ref>" lines)
# It starts node only when there is something to record: a node start costs
# 100 to 200 ms under load, this script about 10 ms. git ignores the exit of
# post-commit and of reference-transaction in state "committed" (githooks(5)).

# A human commit or push.
[ -n "$CLAUDE_CODE_SESSION_ID" ] || exit 0

# A test suite's fixture repo. git runs a non-bare repo's hook in its top level
# and a bare repo's in its git dir; both compare as real paths, so a TMPDIR of
# /var/folders/... matches a repo in /private/var/folders/...
here=$(pwd -P)
for temp in "${TMPDIR:-/tmp}" /tmp; do
	real=$(cd "$temp" 2>/dev/null && pwd -P) || continue
	case "$here/" in "$real"/*) exit 0 ;; esac
done

ledger="$(dirname "$0")/ledger.ts"
case "$1" in
post-commit)
	exec node "$ledger" post-commit
	;;
reference-transaction)
	# git runs this hook in states preparing, prepared and committed (or aborted)
	# for every ref update; only a committed update of a tracking ref is a fact.
	[ "$2" = committed ] || exit 0
	input=$(cat)
	case "$input" in *' refs/remotes/'*) ;; *) exit 0 ;; esac
	printf '%s\n' "$input" | exec node "$ledger" reference-transaction
	;;
esac
