# Runs before each Bash and Monitor command of a Claude Code session, through
# CLAUDE_ENV_FILE in the Claude Code settings. An interactive shell is untouched.
#
# SH_WORD_SPLIT: an unquoted $VAR splits as in bash. Agents write bash; about 15
# memories recorded the failure, where a list reached a command as one argument.
# NO_NOMATCH: an unmatched glob stays as text instead of failing the word. 92% of
# 5,382 "no matches found" results in 45 days ended with exit 0.
# NO_EQUALS: `=word` stays text, instead of becoming the path of a command. Only 1 real
# command in 45 days named a command this way, and 1,314 were separators such as `echo =====`.
#
# Proof, 2026-11-09: 2,087 real commands that reach rm, replayed in a sandbox under the old
# and the new shell. None of them changed target, except one the old shell got wrong.
setopt SH_WORD_SPLIT NO_NOMATCH NO_EQUALS
