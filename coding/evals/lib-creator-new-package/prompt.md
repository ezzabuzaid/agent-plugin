---
name: lib-creator-new-package
tags: [lib-creator]
max_turns: 15
allowed_tools: [Read, Glob, Grep, Skill]
---

In the zukhruf repo, I want a rate limiter package: a token bucket that our job runners and HTTP clients can share.
