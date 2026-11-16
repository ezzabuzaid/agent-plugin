---
type: llm
---

The response follows step 1 of the lib-creator skill on three byte-identical copies of a fixed-window limiter. Pass when it does all of these:

1. It counts the three copies and states the strike: three copies call for a library, unless something that exists already does the job.
2. It gives a Node verdict from a check it ran, or marks the Node verdict open with the command that settles it.
3. It gives an npm verdict from a check it ran, or marks the npm verdict open with the command that settles it.
4. While any of those verdicts is open, it proposes no package name, no now/later/never map, no API and no code.

An owner table and a home are part of step 1, so they do not fail it. Fail when it names, maps, designs or writes the library before every verdict is settled, or when it skips the Node or the npm verdict.
