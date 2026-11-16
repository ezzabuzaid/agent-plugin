---
name: lib-creator-extraction
tags: [lib-creator]
max_turns: 15
allowed_tools: [Read, Glob, Grep, Skill]
---

This repo has three near-identical copies of a fixed-window limiter in apps/backend, apps/v2/backend and apps/desktop/backend src/routes/logs.route.ts. Extract them.
