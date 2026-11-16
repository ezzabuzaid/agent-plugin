#!/usr/bin/env bash
# Stages the text2sql workspace that the prompt names: three identical copies of a fixed-window limiter.
set -euo pipefail

cat > package.json <<'JSON'
{"name":"text2sql","private":true,"workspaces":["apps/*","packages/*"]}
JSON

for app in apps/backend apps/v2/backend apps/desktop/backend; do
  mkdir -p "$app/src/routes"
  cat > "$app/src/routes/logs.route.ts" <<'TS'
import { Hono } from 'hono';

const WINDOW_MS = 60_000;
const MAX_EVENTS = 500;

const budget = { count: 0, resetAt: 0 };

export const logs = new Hono();

logs.post('/logs', async (c) => {
  const now = Date.now();
  if (now >= budget.resetAt) {
    budget.count = 0;
    budget.resetAt = now + WINDOW_MS;
  }
  if (budget.count >= MAX_EVENTS) {
    return c.json({ error: 'too many log events' }, 429);
  }
  budget.count += 1;
  console.log(await c.req.json());
  return c.body(null, 204);
});
TS
done
