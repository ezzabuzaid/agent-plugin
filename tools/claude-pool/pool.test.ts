import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { request as httpRequest } from 'node:http';
import { readFile, rename, stat, writeFile } from 'node:fs/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { join } from 'node:path';
import { test } from 'node:test';
import { promisify } from 'node:util';

import { TemporaryFiles } from '@zukhruf/fs';
import { waitFor } from '@zukhruf/testing/async';
import { HttpServer } from '@zukhruf/testing/http';

import { add } from './accounts.ts';
import type { AccountEntry, KeychainAccount } from './config.ts';
import { type Credential, type PoolStatus, startPool } from './pool.ts';

const hour = 60 * 60 * 1000;
const day = 24 * hour;
const forever = Number.POSITIVE_INFINITY;

interface Seen {
  method: string;
  path: string;
  headers: IncomingMessage['headers'];
  authorization: string | undefined;
  body: string;
}

type Answer = (seen: Seen, response: ServerResponse) => void | Promise<void>;

/** Stands in for api.anthropic.com: a real HTTP server that records each request it receives. */
async function fakeAnthropic(answer: Answer) {
  const seen: Seen[] = [];
  const server = await new HttpServer().start(async (request: IncomingMessage, response) => {
    const body = Buffer.concat(await request.toArray()).toString();
    const record: Seen = {
      method: request.method ?? '',
      path: request.url ?? '',
      headers: request.headers,
      authorization: request.headers.authorization,
      body,
    };
    seen.push(record);
    await answer(record, response);
  });
  return Object.assign(server, { seen, tokens: () => seen.map((record) => record.authorization) });
}

const unix = (time: number) => String(Math.floor(time / 1000));

/** A success as Anthropic sends it to a subscription: the unified rate-limit headers and an SSE body. */
function allowed(response: ServerResponse, body: string, resets: { sevenDay: number; fiveHour: number }) {
  response.writeHead(200, {
    'content-type': 'text/event-stream',
    'anthropic-ratelimit-unified-status': 'allowed',
    'anthropic-ratelimit-unified-7d-status': 'allowed',
    'anthropic-ratelimit-unified-7d-reset': unix(resets.sevenDay),
    'anthropic-ratelimit-unified-5h-reset': unix(resets.fiveHour),
  });
  response.end(body);
}

/** The 429 of an exhausted subscription, with the header set measured from a rejected account. */
function rejected(response: ServerResponse, body: string, limit: { claim: 'seven_day' | 'five_hour'; reset: number; sevenDay: number }) {
  response.writeHead(429, {
    'content-type': 'application/json',
    'anthropic-ratelimit-unified-status': 'rejected',
    'anthropic-ratelimit-unified-representative-claim': limit.claim,
    'anthropic-ratelimit-unified-reset': unix(limit.reset),
    'anthropic-ratelimit-unified-7d-status': limit.claim === 'seven_day' ? 'rejected' : 'allowed',
    'anthropic-ratelimit-unified-7d-utilization': limit.claim === 'seven_day' ? '1.0' : '0.4',
    'anthropic-ratelimit-unified-7d-reset': unix(limit.sevenDay),
    'anthropic-ratelimit-unified-overage-status': 'rejected',
  });
  response.end(body);
}

function unauthorized(response: ServerResponse) {
  response.writeHead(401, { 'content-type': 'application/json' });
  response.end('{"type":"error","error":{"type":"authentication_error","message":"OAuth token has expired."}}');
}

const keychainEntry = (alias: string): AccountEntry => ({
  alias,
  source: 'keychain',
  service: `${alias}-oauth-token`,
  account: `${alias}@example.com`,
});

const nativeEntry = (alias: string): AccountEntry => ({ alias, source: 'native' });

const setupToken = (token: string): Credential => ({ token, expiresAt: forever });

/** Starts the pool on port 0 over a config file in a temp directory, with tokens from `tokens` in place of the Keychain. */
async function startTestPool(setup: {
  upstream: string;
  rotation: AccountEntry[];
  excluded?: AccountEntry[];
  tokens: Map<string, Credential>;
  now: () => number;
  /** Records the alias of each token read: each one is a Keychain access in production. */
  reads?: string[];
}) {
  await using resources = new AsyncDisposableStack();
  const directory = resources.use(await new TemporaryFiles().directory('claude-pool-'));
  const configPath = join(directory.path, 'accounts.json');
  const config = { port: 0, upstream: setup.upstream, rotation: setup.rotation, excluded: setup.excluded ?? [] };
  await writeFile(configPath, JSON.stringify(config));
  const pool = resources.use(
    await startPool({
      configPath,
      now: setup.now,
      tokens: {
        async read(entry) {
          setup.reads?.push(entry.alias);
          const credential = setup.tokens.get(entry.alias);
          if (!credential) throw new Error(`no token for ${entry.alias}`);
          return credential;
        },
      },
    }),
  );
  const owned = resources.move();
  const cleanup = () => owned.disposeAsync();
  return { origin: pool.origin, configPath, cleanup, [Symbol.asyncDispose]: cleanup };
}

/** A Messages request shaped as Claude Code 2.1.332 sends it through ANTHROPIC_BASE_URL. */
function message(origin: string, token: string, session: string, body = '{"model":"claude-haiku-4-5","max_tokens":1}', signal?: AbortSignal) {
  return fetch(`${origin}/v1/messages?beta=true`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'anthropic-beta': 'claude-code-20250219,oauth-2025-04-20',
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'x-claude-code-session-id': session,
    },
    body,
    signal,
  });
}

async function poolStatus(origin: string): Promise<PoolStatus> {
  return (await fetch(`${origin}/_pool/status`)).json() as Promise<PoolStatus>;
}

const accountIn = (status: PoolStatus, alias: string) => status.accounts.find((account) => account.alias === alias);

async function rewriteConfig(configPath: string, upstream: string, rotation: AccountEntry[], excluded: AccountEntry[] = []) {
  const temporary = `${configPath}.test.tmp`;
  await writeFile(temporary, JSON.stringify({ port: 0, upstream, rotation, excluded }));
  await rename(temporary, configPath);
}

const session1 = '4bd965a1-0000-4000-8000-000000000001';
const session2 = '7c1e22b0-0000-4000-8000-000000000002';
const session3 = '9a0f3c4d-0000-4000-8000-000000000003';

test('a weekly-limit 429 is resent on the next account, and the client sees only that answer', async () => {
  const now = Date.now();
  await using upstream = await fakeAnthropic((seen, response) => {
    if (seen.authorization === 'Bearer token-a') {
      rejected(response, '{"error":"a is out"}', { claim: 'seven_day', reset: now + 2 * day, sevenDay: now + 2 * day });
    } else {
      allowed(response, 'event: message_start\ndata: {"from":"b"}\n\n', { sevenDay: now + 5 * day, fiveHour: now + hour });
    }
  });
  await using pool = await startTestPool({
    upstream: upstream.origin,
    rotation: [keychainEntry('a'), keychainEntry('b')],
    tokens: new Map([['a', setupToken('token-a')], ['b', setupToken('token-b')]]),
    now: () => now,
  });

  const response = await message(pool.origin, 'token-a', session1, '{"model":"claude-haiku-4-5","max_tokens":7}');

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('anthropic-ratelimit-unified-status'), 'allowed');
  assert.equal(await response.text(), 'event: message_start\ndata: {"from":"b"}\n\n');
  assert.deepEqual(upstream.tokens(), ['Bearer token-a', 'Bearer token-b']);
  assert.deepEqual(upstream.seen.map((seen) => seen.body), [
    '{"model":"claude-haiku-4-5","max_tokens":7}',
    '{"model":"claude-haiku-4-5","max_tokens":7}',
  ]);
});

test('a per-minute 429 reaches the client and moves no account', async () => {
  const now = Date.now();
  await using upstream = await fakeAnthropic((seen, response) => {
    if (seen.body.includes('"first"')) {
      response.writeHead(429, { 'retry-after': '3', 'anthropic-ratelimit-unified-status': 'allowed' });
      response.end('{"type":"error","error":{"type":"rate_limit_error"}}');
    } else {
      allowed(response, 'ok', { sevenDay: now + day, fiveHour: now + hour });
    }
  });
  await using pool = await startTestPool({
    upstream: upstream.origin,
    rotation: [keychainEntry('a'), keychainEntry('b')],
    tokens: new Map([['a', setupToken('token-a')], ['b', setupToken('token-b')]]),
    now: () => now,
  });

  const limited = await message(pool.origin, 'token-a', session1, '{"first":true}');
  const next = await message(pool.origin, 'token-a', session1, '{"second":true}');

  assert.equal(limited.status, 429);
  assert.equal(limited.headers.get('retry-after'), '3');
  assert.equal(await limited.text(), '{"type":"error","error":{"type":"rate_limit_error"}}');
  assert.equal(next.status, 200);
  await next.text();
  assert.deepEqual(upstream.tokens(), ['Bearer token-a', 'Bearer token-a']);
});

test('a 401 on a swapped-in account marks it broken and resends on the next account', async () => {
  const now = Date.now();
  await using upstream = await fakeAnthropic((seen, response) => {
    if (seen.authorization === 'Bearer token-a') unauthorized(response);
    else allowed(response, 'from b', { sevenDay: now + day, fiveHour: now + hour });
  });
  await using pool = await startTestPool({
    upstream: upstream.origin,
    rotation: [keychainEntry('a'), keychainEntry('b')],
    tokens: new Map([['a', setupToken('token-a')], ['b', setupToken('token-b')]]),
    now: () => now,
  });

  const response = await message(pool.origin, 'token-b', session1);

  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'from b');
  assert.deepEqual(upstream.tokens(), ['Bearer token-a', 'Bearer token-b']);
  assert.equal(accountIn(await poolStatus(pool.origin), 'a')?.state, 'broken');
});

test("a 401 on the caller's own token reaches the client, so Claude Code refreshes its login", async () => {
  const now = Date.now();
  await using upstream = await fakeAnthropic((_seen, response) => unauthorized(response));
  await using pool = await startTestPool({
    upstream: upstream.origin,
    rotation: [keychainEntry('a'), keychainEntry('b')],
    tokens: new Map([['a', setupToken('token-a')], ['b', setupToken('token-b')]]),
    now: () => now,
  });

  const response = await message(pool.origin, 'token-a', session1);

  assert.equal(response.status, 401);
  assert.match(await response.text(), /authentication_error/);
  assert.deepEqual(upstream.tokens(), ['Bearer token-a']);
});

test('an excluded or unknown token goes upstream untouched and is never rotated', async () => {
  const now = Date.now();
  await using upstream = await fakeAnthropic((seen, response) => {
    if (seen.authorization === 'Bearer token-a') allowed(response, 'a', { sevenDay: now + day, fiveHour: now + hour });
    else rejected(response, '{"error":"out"}', { claim: 'seven_day', reset: now + day, sevenDay: now + day });
  });
  await using pool = await startTestPool({
    upstream: upstream.origin,
    rotation: [keychainEntry('a')],
    excluded: [keychainEntry('d')],
    tokens: new Map([['a', setupToken('token-a')], ['d', setupToken('token-d')]]),
    now: () => now,
  });

  const excluded = await message(pool.origin, 'token-d', session1);
  const unknown = await message(pool.origin, 'token-x', session2);

  assert.equal(excluded.status, 429);
  assert.equal(await excluded.text(), '{"error":"out"}');
  assert.equal(unknown.status, 429);
  await unknown.text();
  assert.deepEqual(upstream.tokens(), ['Bearer token-d', 'Bearer token-x']);
});

test("a pool member's non-inference request keeps the caller's own token", async () => {
  const now = Date.now();
  await using upstream = await fakeAnthropic((_seen, response) => allowed(response, '{}', { sevenDay: now + day, fiveHour: now + hour }));
  await using pool = await startTestPool({
    upstream: upstream.origin,
    rotation: [keychainEntry('a'), keychainEntry('b')],
    tokens: new Map([['a', setupToken('token-a')], ['b', setupToken('token-b')]]),
    now: () => now,
  });

  await (await message(pool.origin, 'token-b', session1)).text();
  const profile = await fetch(`${pool.origin}/api/oauth/profile`, {
    headers: { authorization: 'Bearer token-b', 'x-claude-code-session-id': session1 },
  });
  await profile.text();

  assert.deepEqual(
    upstream.seen.map((seen) => [seen.method, seen.path, seen.authorization]),
    [
      ['POST', '/v1/messages?beta=true', 'Bearer token-a'],
      ['GET', '/api/oauth/profile', 'Bearer token-b'],
    ],
  );
});

test('the connectivity check HEAD /api/hello passes through without auth', async () => {
  await using upstream = await fakeAnthropic((_seen, response) => {
    response.writeHead(200);
    response.end();
  });
  await using pool = await startTestPool({
    upstream: upstream.origin,
    rotation: [keychainEntry('a')],
    tokens: new Map([['a', setupToken('token-a')]]),
    now: Date.now,
  });

  const response = await fetch(`${pool.origin}/api/hello`, { method: 'HEAD' });

  assert.equal(response.status, 200);
  assert.deepEqual(upstream.seen.map((seen) => [seen.method, seen.path, seen.authorization]), [['HEAD', '/api/hello', undefined]]);
});

test('with every account parked, the account that comes back soonest answers with its own response', async () => {
  const now = Date.now();
  const resets = new Map([['token-a', now + 3 * hour], ['token-b', now + hour], ['token-c', now + 2 * hour]]);
  await using upstream = await fakeAnthropic((seen, response) => {
    const reset = resets.get(seen.authorization!.slice('Bearer '.length))!;
    if (seen.body.includes('"later"') && seen.authorization === 'Bearer token-b') {
      allowed(response, 'b is back', { sevenDay: now + day, fiveHour: now + hour });
      return;
    }
    rejected(response, `{"out":"${seen.authorization}"}`, { claim: 'five_hour', reset, sevenDay: now + day });
  });
  await using pool = await startTestPool({
    upstream: upstream.origin,
    rotation: [keychainEntry('a'), keychainEntry('b'), keychainEntry('c')],
    tokens: new Map([['a', setupToken('token-a')], ['b', setupToken('token-b')], ['c', setupToken('token-c')]]),
    now: () => now,
  });

  const first = await message(pool.origin, 'token-a', session1, '{"first":true}');
  const firstBody = await first.text();
  const later = await message(pool.origin, 'token-a', session1, '{"later":true}');

  assert.equal(first.status, 429);
  assert.equal(firstBody, '{"out":"Bearer token-b"}');
  assert.equal(first.headers.get('anthropic-ratelimit-unified-reset'), unix(now + hour));
  assert.equal(later.status, 200);
  assert.equal(await later.text(), 'b is back');
  assert.deepEqual(upstream.tokens(), ['Bearer token-a', 'Bearer token-b', 'Bearer token-c', 'Bearer token-b']);
});

/**
 * Arranges, through requests only: session 1 served by `a` (weekly reset in 6 days); `a` hits its 5-hour limit on
 * session 2, so `b` (weekly reset in 2 days) serves it; then the clock passes `a`'s 5-hour reset.
 */
async function arrangeTwoKnownResets() {
  let now = Date.now();
  const start = now;
  let aFiveHourOut = false;
  await using resources = new AsyncDisposableStack();
  const upstream = resources.use(await fakeAnthropic((seen, response) => {
    if (seen.authorization === 'Bearer token-a') {
      if (aFiveHourOut && seen.body.includes('"limit-a"')) {
        rejected(response, '{}', { claim: 'five_hour', reset: start + hour, sevenDay: start + 6 * day });
      } else {
        allowed(response, 'from a', { sevenDay: start + 6 * day, fiveHour: start + hour });
      }
    } else {
      allowed(response, 'from b', { sevenDay: start + 2 * day, fiveHour: start + hour });
    }
  }));
  const pool = resources.use(await startTestPool({
    upstream: upstream.origin,
    rotation: [keychainEntry('a'), keychainEntry('b')],
    tokens: new Map([['a', setupToken('token-a')], ['b', setupToken('token-b')]]),
    now: () => now,
  }));
  await (await message(pool.origin, 'token-a', session1)).text();
  aFiveHourOut = true;
  await (await message(pool.origin, 'token-a', session2, '{"limit-a":true}')).text();
  now += hour + 60_000;
  upstream.seen.length = 0;
  const owned = resources.move();
  return {
    upstream,
    pool,
    advance: (ms: number) => {
      now += ms;
    },
    [Symbol.asyncDispose]: () => owned.disposeAsync(),
  };
}

test('a new session goes to the account whose weekly quota resets soonest', async () => {
  await using arranged = await arrangeTwoKnownResets();

  const response = await message(arranged.pool.origin, 'token-a', session3);

  assert.equal(await response.text(), 'from b');
  assert.deepEqual(arranged.upstream.tokens(), ['Bearer token-b']);
});

test('a session stays on its pinned account while that account works', async () => {
  await using arranged = await arrangeTwoKnownResets();

  const response = await message(arranged.pool.origin, 'token-a', session1);

  assert.equal(await response.text(), 'from a');
  assert.deepEqual(arranged.upstream.tokens(), ['Bearer token-a']);
});

test('a session pin is forgotten after 24 hours idle', async () => {
  await using arranged = await arrangeTwoKnownResets();
  arranged.advance(day + 60_000);

  const status = await poolStatus(arranged.pool.origin);
  const response = await message(arranged.pool.origin, 'token-a', session1);

  assert.equal(status.pinnedSessions, 0);
  assert.equal(await response.text(), 'from b');
});

test('a streamed answer reaches the client event by event, intact and in order', async () => {
  const now = Date.now();
  const release = Promise.withResolvers<void>();
  const events = [
    'event: message_start\ndata: {"type":"message_start"}\n\n',
    'event: content_block_delta\ndata: {"delta":{"text":"Hel"}}\n\n',
    'event: content_block_delta\ndata: {"delta":{"text":"lo"}}\n\n',
    'event: message_stop\ndata: {"type":"message_stop"}\n\n',
  ];
  await using upstream = await fakeAnthropic(async (_seen, response) => {
    response.writeHead(200, {
      'content-type': 'text/event-stream',
      'anthropic-ratelimit-unified-7d-reset': unix(now + day),
    });
    response.write(events[0]);
    await release.promise;
    for (const event of events.slice(1)) {
      response.write(event);
      await new Promise((resolve) => setTimeout(resolve, 5));
    }
    response.end();
  });
  await using pool = await startTestPool({
    upstream: upstream.origin,
    rotation: [keychainEntry('a')],
    tokens: new Map([['a', setupToken('token-a')]]),
    now: () => now,
  });

  // A proxy that buffers would hold the headers until the upstream ends, which waits for the first event to arrive.
  const response = await message(pool.origin, 'token-a', session1, undefined, AbortSignal.timeout(3000));
  const reader = response.body!.pipeThrough(new TextDecoderStream()).getReader();
  const first = await reader.read();
  release.resolve();
  let rest = '';
  for (let chunk = await reader.read(); !chunk.done; chunk = await reader.read()) rest += chunk.value;

  assert.equal(first.value, events[0]);
  assert.equal(first.value + rest, events.join(''));
});

test('a client that disconnects mid-stream ends the upstream request', async () => {
  const upstreamClosed = Promise.withResolvers<void>();
  await using upstream = await fakeAnthropic((_seen, response) => {
    response.writeHead(200, { 'content-type': 'text/event-stream' });
    response.write('event: ping\ndata: {}\n\n');
    response.on('close', () => upstreamClosed.resolve());
  });
  await using pool = await startTestPool({
    upstream: upstream.origin,
    rotation: [keychainEntry('a')],
    tokens: new Map([['a', setupToken('token-a')]]),
    now: Date.now,
  });
  const abort = new AbortController();

  const response = await message(pool.origin, 'token-a', session1, undefined, abort.signal);
  await response.body!.getReader().read();
  abort.abort();

  await waitFor(() => upstreamClosed.promise, { signal: AbortSignal.timeout(3000) });
});

test('/_pool/status shows a parked account with its reset and claim, and no token', async () => {
  const now = Date.now();
  await using upstream = await fakeAnthropic((seen, response) => {
    if (seen.authorization === 'Bearer token-a') {
      rejected(response, '{}', { claim: 'seven_day', reset: now + 3 * day, sevenDay: now + 3 * day });
    } else {
      allowed(response, 'b', { sevenDay: now + 5 * day, fiveHour: now + 2 * hour });
    }
  });
  await using pool = await startTestPool({
    upstream: upstream.origin,
    rotation: [keychainEntry('a'), keychainEntry('b')],
    excluded: [keychainEntry('d')],
    tokens: new Map([['a', setupToken('token-a')], ['b', setupToken('token-b')], ['d', setupToken('token-d')]]),
    now: () => now,
  });
  await (await message(pool.origin, 'token-a', session1)).text();

  const raw = await (await fetch(`${pool.origin}/_pool/status`)).text();
  const status = JSON.parse(raw) as PoolStatus;

  const iso = (time: number) => new Date(Math.floor(time / 1000) * 1000).toISOString();
  assert.deepEqual(status, {
    accounts: [
      { alias: 'a', list: 'rotation', state: 'parked', parkedUntil: iso(now + 3 * day), claim: 'seven_day', sevenDayReset: iso(now + 3 * day), fiveHourReset: null },
      { alias: 'b', list: 'rotation', state: 'ok', sevenDayReset: iso(now + 5 * day), fiveHourReset: iso(now + 2 * hour) },
      { alias: 'd', list: 'excluded', state: 'ok', sevenDayReset: null, fiveHourReset: null },
    ],
    pinnedSessions: 1,
  });
  assert.doesNotMatch(raw, /token-/);
});

test('a config reload keeps a parked account parked', async () => {
  const now = Date.now();
  await using upstream = await fakeAnthropic((seen, response) => {
    if (seen.authorization === 'Bearer token-a') {
      rejected(response, '{}', { claim: 'seven_day', reset: now + day, sevenDay: now + day });
    } else {
      allowed(response, 'not a', { sevenDay: now + 5 * day, fiveHour: now + hour });
    }
  });
  await using pool = await startTestPool({
    upstream: upstream.origin,
    rotation: [keychainEntry('a'), keychainEntry('b')],
    tokens: new Map([['a', setupToken('token-a')], ['b', setupToken('token-b')], ['c', setupToken('token-c')]]),
    now: () => now,
  });
  await (await message(pool.origin, 'token-a', session1)).text();

  await rewriteConfig(pool.configPath, upstream.origin, [keychainEntry('a'), keychainEntry('b'), keychainEntry('c')]);
  await waitFor(async () => assert.ok(accountIn(await poolStatus(pool.origin), 'c')), { signal: AbortSignal.timeout(3000) });
  upstream.seen.length = 0;
  await (await message(pool.origin, 'token-a', session2)).text();

  assert.equal(accountIn(await poolStatus(pool.origin), 'a')?.state, 'parked');
  assert.equal(upstream.tokens().includes('Bearer token-a'), false);
});

test('a broken setup-token account comes back once its Keychain item holds a new token', async () => {
  let now = Date.now();
  const start = now;
  await using upstream = await fakeAnthropic((seen, response) => {
    if (seen.authorization === 'Bearer token-a-old') unauthorized(response);
    else if (seen.authorization === 'Bearer token-b' && seen.body.includes('"second"')) {
      rejected(response, '{}', { claim: 'seven_day', reset: start + day, sevenDay: start + day });
    } else allowed(response, seen.authorization!, { sevenDay: start + day, fiveHour: start + hour });
  });
  const tokens = new Map([['a', setupToken('token-a-old')], ['b', setupToken('token-b')]]);
  await using pool = await startTestPool({
    upstream: upstream.origin,
    rotation: [keychainEntry('a'), keychainEntry('b')],
    tokens,
    now: () => now,
  });
  await (await message(pool.origin, 'token-b', session1)).text();
  const broken = accountIn(await poolStatus(pool.origin), 'a')?.state;

  tokens.set('a', setupToken('token-a-new'));
  now += 61_000;
  const response = await message(pool.origin, 'token-b', session2, '{"second":true}');

  assert.equal(broken, 'broken');
  assert.equal(await response.text(), 'Bearer token-a-new');
  assert.equal(accountIn(await poolStatus(pool.origin), 'a')?.state, 'ok');
});

test('an expired native token is skipped as stale until Claude Code stores a fresh one', async () => {
  let now = Date.now();
  const start = now;
  await using upstream = await fakeAnthropic((seen, response) => {
    if (seen.authorization === 'Bearer token-b' && seen.body.includes('"second"')) {
      rejected(response, '{}', { claim: 'seven_day', reset: start + day, sevenDay: start + day });
    } else allowed(response, seen.authorization!, { sevenDay: start + day, fiveHour: start + hour });
  });
  const tokens = new Map([['claude', { token: 'native-old', expiresAt: now - 1000 }], ['b', setupToken('token-b')]]);
  await using pool = await startTestPool({
    upstream: upstream.origin,
    rotation: [nativeEntry('claude'), keychainEntry('b')],
    tokens,
    now: () => now,
  });

  const whileStale = await (await message(pool.origin, 'token-b', session1)).text();
  const stale = accountIn(await poolStatus(pool.origin), 'claude')?.state;
  tokens.set('claude', { token: 'native-new', expiresAt: now + 8 * hour });
  now += 31_000;
  const afterRefresh = await (await message(pool.origin, 'token-b', session2, '{"second":true}')).text();

  assert.equal(whileStale, 'Bearer token-b');
  assert.equal(stale, 'stale');
  assert.equal(afterRefresh, 'Bearer native-new');
  assert.equal(upstream.tokens().includes('Bearer native-old'), false);
});

test('a 401 on a swapped-in native token makes it stale, never broken', async () => {
  const now = Date.now();
  await using upstream = await fakeAnthropic((seen, response) => {
    if (seen.authorization === 'Bearer native') unauthorized(response);
    else allowed(response, 'b', { sevenDay: now + day, fiveHour: now + hour });
  });
  await using pool = await startTestPool({
    upstream: upstream.origin,
    rotation: [nativeEntry('claude'), keychainEntry('b')],
    tokens: new Map([['claude', { token: 'native', expiresAt: now + hour }], ['b', setupToken('token-b')]]),
    now: () => now,
  });

  const response = await message(pool.origin, 'token-b', session1);

  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'b');
  assert.equal(accountIn(await poolStatus(pool.origin), 'claude')?.state, 'stale');
});

test('a native login that Claude Code refreshed is still recognised as a pool member', async () => {
  const now = Date.now();
  await using upstream = await fakeAnthropic((seen, response) => {
    if (seen.authorization === 'Bearer native-new') {
      rejected(response, '{}', { claim: 'seven_day', reset: now + day, sevenDay: now + day });
    } else {
      allowed(response, 'b', { sevenDay: now + 2 * day, fiveHour: now + hour });
    }
  });
  const tokens = new Map([['claude', { token: 'native-old', expiresAt: now + hour }], ['b', setupToken('token-b')]]);
  await using pool = await startTestPool({
    upstream: upstream.origin,
    rotation: [nativeEntry('claude'), keychainEntry('b')],
    tokens,
    now: () => now,
  });
  tokens.set('claude', { token: 'native-new', expiresAt: now + 8 * hour });

  const response = await message(pool.origin, 'native-new', session1);

  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'b');
});

const cli = new URL('./cli.ts', import.meta.url).pathname;

/** Runs the real CLI against the test's config file. */
async function claudePool(configPath: string, ...args: string[]) {
  try {
    const { stdout, stderr } = await promisify(execFile)(process.execPath, [cli, ...args], {
      env: { ...process.env, CLAUDE_POOL_CONFIG: configPath },
    });
    return { code: 0, stdout, stderr };
  } catch (error) {
    const failed = error as { code: number; stdout: string; stderr: string };
    return { code: failed.code, stdout: failed.stdout, stderr: failed.stderr };
  }
}

const reloaded = (origin: string, check: (status: PoolStatus) => boolean) =>
  waitFor(async () => assert.ok(check(await poolStatus(origin))), { signal: AbortSignal.timeout(3000) });

test('claude-pool exclude and include move an account out of and back into the routing', async () => {
  const now = Date.now();
  await using upstream = await fakeAnthropic((seen, response) => {
    if (seen.authorization === 'Bearer token-a') {
      rejected(response, '{"out":"a"}', { claim: 'seven_day', reset: now + day, sevenDay: now + day });
    } else {
      allowed(response, 'from b', { sevenDay: now + 2 * day, fiveHour: now + hour });
    }
  });
  await using pool = await startTestPool({
    upstream: upstream.origin,
    rotation: [keychainEntry('a'), keychainEntry('b')],
    tokens: new Map([['a', setupToken('token-a')], ['b', setupToken('token-b')]]),
    now: () => now,
  });

  const excluded = await claudePool(pool.configPath, 'exclude', 'b');
  await reloaded(pool.origin, (status) => accountIn(status, 'b')?.list === 'excluded');
  const whileExcluded = await message(pool.origin, 'token-a', session1);
  const whileExcludedBody = await whileExcluded.text();
  const included = await claudePool(pool.configPath, 'include', 'b');
  await reloaded(pool.origin, (status) => accountIn(status, 'b')?.list === 'rotation');
  const afterInclude = await message(pool.origin, 'token-a', session1);

  assert.equal(excluded.code, 0, excluded.stderr);
  assert.equal(included.code, 0, included.stderr);
  assert.equal(whileExcluded.status, 429);
  assert.equal(whileExcludedBody, '{"out":"a"}');
  assert.equal(await afterInclude.text(), 'from b');
  assert.deepEqual(upstream.tokens(), ['Bearer token-a', 'Bearer token-b']);
});

test('claude-pool exclude of an unknown alias fails and leaves the config as it was', async () => {
  await using directory = await new TemporaryFiles().directory('claude-pool-');
  const configPath = join(directory.path, 'accounts.json');
  const config = `${JSON.stringify({ port: 0, rotation: [keychainEntry('a')], excluded: [] })}\n`;
  await writeFile(configPath, config);

  const result = await claudePool(configPath, 'exclude', 'nobody');

  assert.equal(result.code, 1);
  assert.match(result.stderr, /unknown alias: nobody/);
  assert.equal(await readFile(configPath, 'utf8'), config);
});

test('a config the CLI writes stays readable by its owner only, since it names each account email', async () => {
  await using directory = await new TemporaryFiles().directory('claude-pool-');
  const configPath = join(directory.path, 'accounts.json');
  await writeFile(configPath, JSON.stringify({ port: 0, rotation: [keychainEntry('a'), keychainEntry('b')], excluded: [] }), {
    mode: 0o644,
  });

  const result = await claudePool(configPath, 'exclude', 'b');

  assert.equal(result.code, 0, result.stderr);
  assert.equal((await stat(configPath)).mode & 0o777, 0o600);
});

/** A token store in memory in place of the Keychain: `add` stores the token the user would type at `security`'s prompt, and the pool reads from it. */
function memoryStore(tokens: Map<string, Credential>, outcome: 'typed' | 'cancelled' = 'typed') {
  const written: Array<{ service: string; account: string }> = [];
  return {
    written,
    async read(entry: AccountEntry) {
      const credential = tokens.get(entry.alias);
      if (!credential) throw new Error(`no token for ${entry.alias}`);
      return credential;
    },
    async add(entry: KeychainAccount) {
      written.push({ service: entry.service, account: entry.account });
      if (outcome === 'cancelled') throw new Error('security add-generic-password failed (exit 128)');
      tokens.set(entry.alias, setupToken(`token-${entry.alias}`));
    },
  };
}

test('an added account joins the rotation and serves once the pool reloads', async () => {
  const now = Date.now();
  await using upstream = await fakeAnthropic((seen, response) => {
    if (seen.authorization === 'Bearer token-a') {
      rejected(response, '{}', { claim: 'seven_day', reset: now + day, sevenDay: now + day });
    } else {
      allowed(response, seen.authorization!, { sevenDay: now + 2 * day, fiveHour: now + hour });
    }
  });
  const tokens = new Map([['a', setupToken('token-a')]]);
  const store = memoryStore(tokens);
  await using pool = await startTestPool({ upstream: upstream.origin, rotation: [keychainEntry('a')], tokens, now: () => now });

  await add(pool.configPath, { alias: 'p', email: 'p@example.com' }, store);
  await reloaded(pool.origin, (status) => accountIn(status, 'p')?.list === 'rotation');
  const response = await message(pool.origin, 'token-a', session1);

  assert.deepEqual(store.written, [{ service: 'p-oauth-token', account: 'p@example.com' }]);
  assert.equal(await response.text(), 'Bearer token-p');
  const saved = JSON.parse(await readFile(pool.configPath, 'utf8'));
  assert.deepEqual(saved.rotation.at(-1), { alias: 'p', source: 'keychain', service: 'p-oauth-token', account: 'p@example.com' });
  assert.equal(JSON.stringify(saved).includes('token-p'), false);
});

test('adding an alias that already exists fails and changes neither the config nor the Keychain', async () => {
  await using directory = await new TemporaryFiles().directory('claude-pool-');
  const configPath = join(directory.path, 'accounts.json');
  const config = `${JSON.stringify({ port: 0, rotation: [keychainEntry('a')], excluded: [keychainEntry('d')] })}\n`;
  await writeFile(configPath, config);
  const store = memoryStore(new Map());

  await assert.rejects(add(configPath, { alias: 'd', email: 'd2@example.com' }, store), /d already exists/);

  assert.equal(await readFile(configPath, 'utf8'), config);
  assert.deepEqual(store.written, []);
});

test('an add whose Keychain prompt fails leaves the config untouched', async () => {
  await using directory = await new TemporaryFiles().directory('claude-pool-');
  const configPath = join(directory.path, 'accounts.json');
  const config = `${JSON.stringify({ port: 0, rotation: [keychainEntry('a')], excluded: [] })}\n`;
  await writeFile(configPath, config);
  const store = memoryStore(new Map(), 'cancelled');

  await assert.rejects(add(configPath, { alias: 'p', email: 'p@example.com' }, store), /security add-generic-password failed/);

  assert.deepEqual(store.written, [{ service: 'p-oauth-token', account: 'p@example.com' }]);
  assert.equal(await readFile(configPath, 'utf8'), config);
});

test('claude-pool remove stops requests from going to that account', async () => {
  const now = Date.now();
  await using upstream = await fakeAnthropic((seen, response) => {
    if (seen.authorization === 'Bearer token-a') {
      rejected(response, '{"out":"a"}', { claim: 'seven_day', reset: now + day, sevenDay: now + day });
    } else {
      allowed(response, 'from b', { sevenDay: now + 2 * day, fiveHour: now + hour });
    }
  });
  await using pool = await startTestPool({
    upstream: upstream.origin,
    rotation: [keychainEntry('a'), keychainEntry('b')],
    tokens: new Map([['a', setupToken('token-a')], ['b', setupToken('token-b')]]),
    now: () => now,
  });
  const before = await (await message(pool.origin, 'token-a', session1)).text();

  const removed = await claudePool(pool.configPath, 'remove', 'b');
  await reloaded(pool.origin, (status) => accountIn(status, 'b') === undefined);
  upstream.seen.length = 0;
  const after = await message(pool.origin, 'token-a', session2);

  assert.equal(before, 'from b');
  assert.equal(removed.code, 0, removed.stderr);
  assert.equal(after.status, 429);
  assert.equal(await after.text(), '{"out":"a"}');
  assert.deepEqual(upstream.tokens(), ['Bearer token-a']);
});

test("Claude Code's headers reach upstream on a swapped request, and hop-by-hop headers do not", async () => {
  const now = Date.now();
  await using upstream = await fakeAnthropic((_seen, response) => allowed(response, 'ok', { sevenDay: now + day, fiveHour: now + hour }));
  await using pool = await startTestPool({
    upstream: upstream.origin,
    rotation: [keychainEntry('a'), keychainEntry('b')],
    tokens: new Map([['a', setupToken('token-a')], ['b', setupToken('token-b')]]),
    now: () => now,
  });
  const body = '{"model":"claude-haiku-4-5","max_tokens":1}';

  const status = await new Promise<number>((resolve, reject) => {
    const outgoing = httpRequest(`${pool.origin}/v1/messages?beta=true`, {
      method: 'POST',
      headers: {
        authorization: 'Bearer token-b',
        'anthropic-beta': 'claude-code-20250219,oauth-2025-04-20',
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'x-claude-code-session-id': session1,
        connection: 'keep-alive, x-pool-hop',
        'x-pool-hop': 'only for the next hop',
        'proxy-authorization': 'Basic c2VjcmV0',
      },
    }, (response) => {
      response.resume();
      response.on('end', () => resolve(response.statusCode!));
    });
    outgoing.on('error', reject);
    outgoing.end(body);
  });

  assert.equal(status, 200);
  const [seen] = upstream.seen;
  assert.equal(seen?.authorization, 'Bearer token-a');
  assert.equal(seen?.headers['anthropic-beta'], 'claude-code-20250219,oauth-2025-04-20');
  assert.equal(seen?.headers['anthropic-version'], '2023-06-01');
  assert.equal(seen?.headers['content-type'], 'application/json');
  assert.equal(seen?.headers['x-claude-code-session-id'], session1);
  assert.equal(seen?.headers['content-length'], String(Buffer.byteLength(body)));
  assert.equal(seen?.headers['x-pool-hop'], undefined);
  assert.equal(seen?.headers['proxy-authorization'], undefined);
  assert.equal(seen?.body, body);
});

test('a config file that stops parsing leaves the pool routing on the accounts it had', async () => {
  const now = Date.now();
  await using upstream = await fakeAnthropic((seen, response) => {
    if (seen.authorization === 'Bearer token-a') {
      rejected(response, '{}', { claim: 'seven_day', reset: now + day, sevenDay: now + day });
    } else {
      allowed(response, 'from b', { sevenDay: now + 2 * day, fiveHour: now + hour });
    }
  });
  await using pool = await startTestPool({
    upstream: upstream.origin,
    rotation: [keychainEntry('a'), keychainEntry('b')],
    tokens: new Map([['a', setupToken('token-a')], ['b', setupToken('token-b')]]),
    now: () => now,
  });

  await writeFile(pool.configPath, '{"port": 0, "rotation": [');
  // The reload reads the file 50 ms after the change; give it time to run and fail.
  await new Promise((resolve) => setTimeout(resolve, 300));
  const response = await message(pool.origin, 'token-a', session1);

  assert.equal(await response.text(), 'from b');
  assert.deepEqual(upstream.tokens(), ['Bearer token-a', 'Bearer token-b']);
});

test('an upstream that drops the connection before answering gives the client a 502', async () => {
  await using upstream = await fakeAnthropic((_seen, response) => {
    response.socket?.destroy();
  });
  await using pool = await startTestPool({
    upstream: upstream.origin,
    rotation: [keychainEntry('a')],
    tokens: new Map([['a', setupToken('token-a')]]),
    now: Date.now,
  });

  const response = await message(pool.origin, 'token-a', session1);

  assert.equal(response.status, 502);
  assert.match(await response.text(), /upstream unreachable/);
});

test('an account whose token cannot be read at start is broken, and the others serve', async () => {
  const now = Date.now();
  await using upstream = await fakeAnthropic((seen, response) => allowed(response, seen.authorization!, { sevenDay: now + day, fiveHour: now + hour }));
  await using pool = await startTestPool({
    upstream: upstream.origin,
    rotation: [keychainEntry('a'), keychainEntry('b')],
    tokens: new Map([['b', setupToken('token-b')]]),
    now: () => now,
  });

  const response = await message(pool.origin, 'token-b', session1);

  assert.equal(await response.text(), 'Bearer token-b');
  assert.equal(accountIn(await poolStatus(pool.origin), 'a')?.state, 'broken');
});

test('the same unknown bearer re-reads the native login at most once per 30 seconds', async () => {
  let now = Date.now();
  await using upstream = await fakeAnthropic((_seen, response) => allowed(response, 'ok', { sevenDay: now + day, fiveHour: now + hour }));
  const reads: string[] = [];
  const tokens = new Map([['claude', { token: 'native', expiresAt: now + hour }]]);
  await using pool = await startTestPool({
    upstream: upstream.origin,
    rotation: [nativeEntry('claude')],
    tokens,
    reads,
    now: () => now,
  });

  await (await message(pool.origin, 'stranger', session1)).text();
  now += 5_000;
  await (await message(pool.origin, 'stranger', session1)).text();
  const withinWindow = reads.length;
  now += 30_000;
  await (await message(pool.origin, 'stranger', session1)).text();

  // Each read is a Keychain access; the count is the only visible output of the throttle.
  assert.equal(withinWindow, 2);
  assert.equal(reads.length, 3);
});

test('foreign traffic never delays recognising a native login that Claude Code just refreshed', async () => {
  let now = Date.now();
  await using upstream = await fakeAnthropic((seen, response) => {
    if (seen.authorization === 'Bearer native-new') {
      rejected(response, '{}', { claim: 'seven_day', reset: now + day, sevenDay: now + day });
    } else {
      allowed(response, seen.authorization === 'Bearer token-b' ? 'b' : 'foreign', { sevenDay: now + 2 * day, fiveHour: now + hour });
    }
  });
  const tokens = new Map([['claude', { token: 'native-old', expiresAt: now + hour }], ['b', setupToken('token-b')]]);
  await using pool = await startTestPool({
    upstream: upstream.origin,
    rotation: [nativeEntry('claude'), keychainEntry('b')],
    tokens,
    now: () => now,
  });
  await (await message(pool.origin, 'dclaude-token', session1)).text();
  now += 5_000;
  tokens.set('claude', { token: 'native-new', expiresAt: now + 8 * hour });

  const response = await message(pool.origin, 'native-new', session2);

  // Passed through as foreign, the request would carry native-new upstream and the client would get its 429.
  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'b');
});

test('a client that leaves before the first byte ends the upstream request', async () => {
  const upstreamClosed = Promise.withResolvers<void>();
  const received = Promise.withResolvers<void>();
  await using upstream = await fakeAnthropic((_seen, response) => {
    response.on('close', () => upstreamClosed.resolve());
    received.resolve();
  });
  await using pool = await startTestPool({
    upstream: upstream.origin,
    rotation: [keychainEntry('a')],
    tokens: new Map([['a', setupToken('token-a')]]),
    now: Date.now,
  });
  const abort = new AbortController();

  const pending = message(pool.origin, 'token-a', session1, undefined, abort.signal).catch(() => undefined);
  await received.promise;
  abort.abort();
  await pending;

  await waitFor(() => upstreamClosed.promise, { signal: AbortSignal.timeout(3000) });
});
