---
type: llm
---

The response works step 1 of the lib-creator skill before anything else: it checks (or says it must check) the user's own packages, what the current Node.js LTS ships, and npm candidates for a token-bucket rate limiter, and gives or plans a verdict for each of the three. It proposes no package name, API, file layout or code before those verdicts. Fail if it jumps to an API design, a package.json or source code first.
