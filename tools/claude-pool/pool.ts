import { createHash } from 'node:crypto';
import { once } from 'node:events';
import { type FSWatcher, watch } from 'node:fs';
import {
  type IncomingHttpHeaders,
  type IncomingMessage,
  type OutgoingHttpHeaders,
  type ServerResponse,
  createServer,
  request as httpRequest,
} from 'node:http';
import { request as httpsRequest } from 'node:https';
import { basename, dirname } from 'node:path';
import { pipeline } from 'node:stream/promises';

import {
  type AccountEntry,
  type KeychainAccount,
  type NativeAccount,
  type PoolConfig,
  defaultUpstream,
  readConfig,
} from './config.ts';

/** `expiresAt` is in ms since the epoch; a setup token from the Keychain never expires (`Infinity`). */
export interface Credential {
  token: string;
  expiresAt: number;
}

/** Where account tokens live. `serve` wires it to the macOS Keychain. */
export interface TokenSource {
  read(entry: AccountEntry): Promise<Credential>;
}

export interface PoolOptions {
  configPath: string;
  tokens: TokenSource;
  /** The pool parks accounts until a reset time and throttles Keychain reads, so it takes the clock as an input. */
  now: () => number;
}

export interface PoolHandle extends AsyncDisposable {
  origin: string;
  close: () => Promise<void>;
}

/** A Keychain account stays broken until its Keychain item holds another token; a native account is never broken, only stale until Claude Code refreshes it. */
type Health =
  | { state: 'ok' }
  | { state: 'parked'; until: number; claim: string }
  | { state: 'broken'; failedToken: string | null; checkedAt: number }
  | { state: 'stale'; failedToken: string | null };

interface Knowledge {
  health: Health;
  sevenDayReset: number | undefined;
  fiveHourReset: number | undefined;
}

type Member =
  | { entry: KeychainAccount; credential: Credential | null }
  | { entry: NativeAccount; credential: Credential | null };

interface Pin {
  alias: string;
  lastUsed: number;
}

interface BufferedResponse {
  status: number;
  headers: IncomingHttpHeaders;
  body: Buffer;
}

const nativeRereadInterval = 30_000;
/** A bearer found foreign (dclaude, an unknown login) is checked against the native login again after this long. */
const foreignRecheckInterval = 30_000;
const brokenRecheckInterval = 60_000;
const pinIdleLimit = 24 * 60 * 60 * 1000;
/** A quota 429 without a reset header parks the account this long. */
const unknownResetPark = 5 * 60 * 1000;

const hopByHop = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'proxy-connection',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'host',
  'content-length',
]);

const localTime = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

const log = (line: string) => console.log(line);

function forwardableHeaders(headers: IncomingHttpHeaders): OutgoingHttpHeaders {
  const listed = new Set(
    String(headers.connection ?? '')
      .split(',')
      .map((name) => name.trim().toLowerCase())
      .filter(Boolean),
  );
  const kept: OutgoingHttpHeaders = {};
  for (const [name, value] of Object.entries(headers)) {
    if (value !== undefined && !hopByHop.has(name) && !listed.has(name)) {
      kept[name] = value;
    }
  }
  return kept;
}

function bearerOf(headers: IncomingHttpHeaders): string | null {
  const match = /^Bearer\s+(.+)$/i.exec(headers.authorization ?? '');
  return match?.[1]?.trim() ?? null;
}

function isInference(request: IncomingMessage): boolean {
  const path = new URL(request.url ?? '/', 'http://pool').pathname;
  return request.method === 'POST' && (path === '/v1/messages' || path === '/v1/messages/count_tokens');
}

function header(headers: IncomingHttpHeaders, name: string): string | undefined {
  const value = headers[name];
  return Array.isArray(value) ? value[0] : value;
}

function unixHeader(headers: IncomingHttpHeaders, name: string): number | undefined {
  const value = Number(header(headers, name));
  return Number.isFinite(value) && value > 0 ? value * 1000 : undefined;
}

function isQuotaRejection(response: IncomingMessage): boolean {
  return (
    response.statusCode === 429 &&
    header(response.headers, 'anthropic-ratelimit-unified-status') === 'rejected'
  );
}

async function buffer(response: IncomingMessage): Promise<BufferedResponse> {
  const chunks = await response.toArray();
  return { status: response.statusCode ?? 502, headers: response.headers, body: Buffer.concat(chunks) };
}

class Pool {
  readonly #options: PoolOptions;
  #config: PoolConfig;
  #members: Member[] = [];
  readonly #knowledge = new Map<string, Knowledge>();
  readonly #pins = new Map<string, Pin>();
  #nativeRereadAt = Number.NEGATIVE_INFINITY;
  #nativeReread: Promise<void> | null = null;
  /** SHA-256 of each bearer found foreign → when it was last checked; the pool never keeps a foreign token itself. */
  readonly #foreignCheckedAt = new Map<string, number>();
  readonly #brokenRechecks = new Map<string, Promise<void>>();

  constructor(options: PoolOptions, config: PoolConfig) {
    this.#options = options;
    this.#config = config;
  }

  get port(): number {
    return this.#config.port;
  }

  async load(config: PoolConfig): Promise<void> {
    const members = await Promise.all(
      config.rotation.map(async (entry): Promise<Member> => {
        try {
          return { entry, credential: await this.#options.tokens.read(entry) } as Member;
        } catch (error) {
          log(`account ${entry.alias}: token unavailable (${(error as Error).message})`);
          return { entry, credential: null } as Member;
        }
      }),
    );
    const now = this.#options.now();
    for (const { entry, credential } of members) {
      const known = this.#knowledgeOf(entry.alias);
      // A reload re-reads every token, so only a park survives it.
      if (known.health.state === 'parked') {
        continue;
      }
      if (credential === null) {
        known.health =
          entry.source === 'native'
            ? { state: 'stale', failedToken: null }
            : { state: 'broken', failedToken: null, checkedAt: now };
      } else if (entry.source === 'native' && credential.expiresAt <= now) {
        known.health = { state: 'stale', failedToken: credential.token };
      } else {
        known.health = { state: 'ok' };
      }
    }
    if (config.port !== this.#config.port) {
      log(`config: port ${config.port} takes effect after a restart`);
    }
    this.#config = { ...config, port: this.#config.port };
    this.#members = members;
  }

  #knowledgeOf(alias: string): Knowledge {
    let known = this.#knowledge.get(alias);
    if (!known) {
      known = { health: { state: 'ok' }, sevenDayReset: undefined, fiveHourReset: undefined };
      this.#knowledge.set(alias, known);
    }
    return known;
  }

  /** The health at this moment: a park ends by itself when its reset time passes. */
  #healthOf(alias: string): Health {
    const known = this.#knowledgeOf(alias);
    if (known.health.state === 'parked' && known.health.until <= this.#options.now()) {
      known.health = { state: 'ok' };
    }
    return known.health;
  }

  #nativeMember(): Extract<Member, { entry: NativeAccount }> | undefined {
    return this.#members.find(
      (member): member is Extract<Member, { entry: NativeAccount }> => member.entry.source === 'native',
    );
  }

  /** Claude Code owns the native login and refreshes it; to recover a stale login the pool reads it again at most once per 30 s. */
  async #rereadNative(): Promise<void> {
    if (this.#options.now() - this.#nativeRereadAt < nativeRereadInterval) {
      return this.#nativeReread ?? undefined;
    }
    return this.#readNative();
  }

  async #readNative(): Promise<void> {
    if (this.#nativeReread) {
      return this.#nativeReread;
    }
    const native = this.#nativeMember();
    if (!native) {
      return;
    }
    this.#nativeRereadAt = this.#options.now();
    this.#nativeReread = (async () => {
      try {
        native.credential = await this.#options.tokens.read(native.entry);
      } catch (error) {
        log(`account ${native.entry.alias}: token unavailable (${(error as Error).message})`);
        return;
      } finally {
        this.#nativeReread = null;
      }
      const known = this.#knowledgeOf(native.entry.alias);
      const { credential } = native;
      if (
        known.health.state === 'stale' &&
        credential.token !== known.health.failedToken &&
        credential.expiresAt > this.#options.now()
      ) {
        known.health = { state: 'ok' };
        log(`account ${native.entry.alias} recovered: new token`);
      }
    })();
    return this.#nativeReread;
  }

  /** A broken Keychain account is read again at most once per 60 s; a new token in its item brings it back. */
  async #recheckBroken(member: Extract<Member, { entry: KeychainAccount }>): Promise<void> {
    const { alias } = member.entry;
    const running = this.#brokenRechecks.get(alias);
    if (running) {
      return running;
    }
    const known = this.#knowledgeOf(alias);
    if (known.health.state !== 'broken' || this.#options.now() - known.health.checkedAt < brokenRecheckInterval) {
      return;
    }
    const failedToken = known.health.failedToken;
    known.health = { state: 'broken', failedToken, checkedAt: this.#options.now() };
    const recheck = (async () => {
      try {
        const credential = await this.#options.tokens.read(member.entry);
        if (credential.token !== failedToken && this.#members.includes(member)) {
          member.credential = credential;
          known.health = { state: 'ok' };
          log(`account ${alias} recovered: new token`);
        }
      } catch (error) {
        log(`account ${alias}: token unavailable (${(error as Error).message})`);
      } finally {
        this.#brokenRechecks.delete(alias);
      }
    })();
    this.#brokenRechecks.set(alias, recheck);
    return recheck;
  }

  /** Brings stale and broken accounts back when their token source holds a usable token again. */
  async #recover(member: Member): Promise<void> {
    if (member.entry.source === 'native') {
      const health = this.#healthOf(member.entry.alias);
      const expired = member.credential !== null && member.credential.expiresAt <= this.#options.now();
      if (health.state === 'stale' || (health.state === 'ok' && expired)) {
        await this.#rereadNative();
        const after = this.#knowledgeOf(member.entry.alias);
        if (member.credential !== null && member.credential.expiresAt <= this.#options.now() && after.health.state === 'ok') {
          after.health = { state: 'stale', failedToken: member.credential.token };
          log(`account ${member.entry.alias}: stale (token expired; waiting for Claude Code to refresh it)`);
        }
      }
    } else if (this.#healthOf(member.entry.alias).state === 'broken') {
      await this.#recheckBroken(member as Extract<Member, { entry: KeychainAccount }>);
    }
  }

  async #callerOf(bearer: string | null): Promise<Member | undefined> {
    if (bearer === null) {
      return undefined;
    }
    const match = () => this.#members.find((member) => member.credential?.token === bearer);
    const found = match();
    if (found || !this.#nativeMember()) {
      return found;
    }
    // An unknown bearer may be the native login that Claude Code just refreshed. The throttle is per bearer: other
    // foreign traffic (dclaude) must never delay recognising a refreshed native token, or that session's request
    // would go upstream on the native account alone and hit its limit.
    const now = this.#options.now();
    const digest = createHash('sha256').update(bearer).digest('base64url');
    const checkedAt = this.#foreignCheckedAt.get(digest);
    if (checkedAt !== undefined && now - checkedAt < foreignRecheckInterval) {
      return undefined;
    }
    await this.#readNative();
    const member = match();
    if (member) {
      this.#foreignCheckedAt.delete(digest);
      return member;
    }
    if (checkedAt === undefined) {
      log('a token outside the rotation passes through untouched');
    }
    this.#foreignCheckedAt.set(digest, now);
    for (const [seen, at] of this.#foreignCheckedAt) {
      if (now - at > pinIdleLimit) this.#foreignCheckedAt.delete(seen);
    }
    return undefined;
  }

  #prunePins(): void {
    const now = this.#options.now();
    for (const [session, pin] of this.#pins) {
      if (now - pin.lastUsed > pinIdleLimit) {
        this.#pins.delete(session);
      }
    }
  }

  async #choose(session: string | undefined, attempted: ReadonlySet<string>): Promise<Member | undefined> {
    const open = this.#members.filter((member) => !attempted.has(member.entry.alias));
    await Promise.all(open.map((member) => this.#recover(member)));
    const usable = open.filter(
      (member) => member.credential !== null && this.#healthOf(member.entry.alias).state === 'ok',
    );
    const pinned = session === undefined ? undefined : this.#pins.get(session);
    const stay = usable.find((member) => member.entry.alias === pinned?.alias);
    if (stay) {
      return stay;
    }
    // The quota that resets soonest is spent first; accounts with no known reset follow in config order.
    const reset = (member: Member) => this.#knowledgeOf(member.entry.alias).sevenDayReset ?? Number.POSITIVE_INFINITY;
    return usable.toSorted((left, right) => reset(left) - reset(right))[0];
  }

  #why(alias: string): string {
    if (!this.#members.some((member) => member.entry.alias === alias)) {
      return 'excluded';
    }
    const health = this.#healthOf(alias);
    if (health.state === 'parked') {
      return `${health.claim}, resets ${localTime.format(health.until)}`;
    }
    return health.state;
  }

  #observe(alias: string, response: IncomingMessage): void {
    const known = this.#knowledgeOf(alias);
    known.sevenDayReset = unixHeader(response.headers, 'anthropic-ratelimit-unified-7d-reset') ?? known.sevenDayReset;
    known.fiveHourReset = unixHeader(response.headers, 'anthropic-ratelimit-unified-5h-reset') ?? known.fiveHourReset;
    const status = response.statusCode ?? 0;
    if (known.health.state === 'parked' && status >= 200 && status < 300) {
      known.health = { state: 'ok' };
    }
  }

  #park(alias: string, response: IncomingMessage): void {
    const claim = header(response.headers, 'anthropic-ratelimit-unified-representative-claim') ?? 'unknown';
    const until =
      unixHeader(response.headers, 'anthropic-ratelimit-unified-reset') ?? this.#options.now() + unknownResetPark;
    this.#knowledgeOf(alias).health = { state: 'parked', until, claim };
    log(`parked ${alias} until ${localTime.format(until)} (${claim})`);
  }

  #forward(
    request: IncomingMessage,
    body: Buffer,
    authorization: string | undefined,
    signal: AbortSignal,
  ): Promise<IncomingMessage> {
    const url = new URL(request.url ?? '/', this.#config.upstream ?? defaultUpstream);
    const headers = forwardableHeaders(request.headers);
    if (authorization === undefined) {
      delete headers.authorization;
    } else {
      headers.authorization = authorization;
    }
    if (body.length > 0 || request.headers['content-length'] !== undefined) {
      headers['content-length'] = body.length;
    }
    const send = url.protocol === 'https:' ? httpsRequest : httpRequest;
    // No timeout: an answer streams for as long as the model writes. The signal ends it when the client leaves.
    const { promise, resolve, reject } = Promise.withResolvers<IncomingMessage>();
    const outgoing = send(url, { method: request.method, headers, signal }, resolve);
    outgoing.on('error', reject);
    outgoing.end(body);
    return promise;
  }

  async #relay(response: IncomingMessage, client: ServerResponse): Promise<void> {
    client.writeHead(response.statusCode ?? 502, forwardableHeaders(response.headers));
    await pipeline(response, client);
  }

  #replay(response: BufferedResponse, client: ServerResponse): void {
    client.writeHead(response.status, forwardableHeaders(response.headers));
    client.end(response.body);
  }

  async handle(request: IncomingMessage, client: ServerResponse): Promise<void> {
    if (request.method === 'GET' && new URL(request.url ?? '/', 'http://pool').pathname === '/_pool/status') {
      const status = await this.status();
      client.writeHead(200, { 'content-type': 'application/json' });
      client.end(JSON.stringify(status));
      return;
    }
    const body = Buffer.concat(await request.toArray());
    const abort = new AbortController();
    client.on('close', () => {
      if (!client.writableFinished) {
        abort.abort();
      }
    });
    const caller = await this.#callerOf(bearerOf(request.headers));
    if (!caller || !isInference(request)) {
      await this.#relay(await this.#forward(request, body, request.headers.authorization, abort.signal), client);
      return;
    }
    this.#prunePins();
    const session = header(request.headers, 'x-claude-code-session-id');
    const pinned = session === undefined ? undefined : this.#pins.get(session)?.alias;
    const attempted = new Set<string>();
    // The account this session was on: its pin, or else the account of its own login.
    const movedFrom = pinned ?? caller.entry.alias;
    const rejections = new Map<string, BufferedResponse>();
    for (;;) {
      const target = await this.#choose(session, attempted);
      if (!target?.credential) {
        await this.#answerWhenNoneIsOpen(request, body, client, rejections, abort.signal);
        return;
      }
      const alias = target.entry.alias;
      attempted.add(alias);
      const response = await this.#forward(request, body, `Bearer ${target.credential.token}`, abort.signal);
      this.#observe(alias, response);
      if (isQuotaRejection(response)) {
        this.#park(alias, response);
        rejections.set(alias, await buffer(response));
        continue;
      }
      if (response.statusCode === 401 && target !== caller) {
        response.resume();
        const failedToken = target.credential.token;
        if (target.entry.source === 'native') {
          this.#knowledgeOf(alias).health = { state: 'stale', failedToken };
          log(`account ${alias}: stale (401 on its cached token)`);
          void this.#rereadNative();
        } else {
          this.#knowledgeOf(alias).health = { state: 'broken', failedToken, checkedAt: Number.NEGATIVE_INFINITY };
          log(`account ${alias}: broken (401)`);
        }
        continue;
      }
      if (movedFrom !== alias) {
        log(`session ${session?.slice(0, 8) ?? '(none)'} ${movedFrom} → ${alias} (${this.#why(movedFrom)})`);
      }
      if (session !== undefined) {
        this.#pins.set(session, { alias, lastUsed: this.#options.now() });
      }
      await this.#relay(response, client);
      return;
    }
  }

  /**
   * Every account is parked, broken or stale. The client gets Anthropic's own answer from the parked account that
   * comes back first: the 429 it gave this request, or a fresh answer when it was parked before (its park may be over).
   * With no parked account, the caller's own token gets the real answer.
   */
  async #answerWhenNoneIsOpen(
    request: IncomingMessage,
    body: Buffer,
    client: ServerResponse,
    rejections: ReadonlyMap<string, BufferedResponse>,
    signal: AbortSignal,
  ): Promise<void> {
    const until = (member: Member) => {
      const health = this.#healthOf(member.entry.alias);
      return health.state === 'parked' ? health.until : Number.POSITIVE_INFINITY;
    };
    const soonest = this.#members
      .filter((member) => member.credential !== null && until(member) !== Number.POSITIVE_INFINITY)
      .toSorted((left, right) => until(left) - until(right))[0];
    if (!soonest?.credential) {
      await this.#relay(await this.#forward(request, body, request.headers.authorization, signal), client);
      return;
    }
    const rejection = rejections.get(soonest.entry.alias);
    if (rejection) {
      this.#replay(rejection, client);
      return;
    }
    const response = await this.#forward(request, body, `Bearer ${soonest.credential.token}`, signal);
    this.#observe(soonest.entry.alias, response);
    if (isQuotaRejection(response)) {
      this.#park(soonest.entry.alias, response);
    }
    await this.#relay(response, client);
  }

  async status() {
    await Promise.all(this.#members.map((member) => this.#recover(member)));
    this.#prunePins();
    const iso = (time: number | undefined) => (time === undefined ? null : new Date(time).toISOString());
    const view = (entry: AccountEntry, list: 'rotation' | 'excluded') => {
      const known = this.#knowledgeOf(entry.alias);
      const health = this.#healthOf(entry.alias);
      return {
        alias: entry.alias,
        list,
        state: health.state,
        ...(health.state === 'parked' ? { parkedUntil: iso(health.until), claim: health.claim } : {}),
        sevenDayReset: iso(known.sevenDayReset),
        fiveHourReset: iso(known.fiveHourReset),
      };
    };
    return {
      accounts: [
        ...this.#config.rotation.map((entry) => view(entry, 'rotation')),
        ...this.#config.excluded.map((entry) => view(entry, 'excluded')),
      ],
      pinnedSessions: this.#pins.size,
    };
  }
}

export type PoolStatus = Awaited<ReturnType<Pool['status']>>;

export async function startPool(options: PoolOptions): Promise<PoolHandle> {
  await using resources = new AsyncDisposableStack();
  const config = await readConfig(options.configPath);
  const pool = new Pool(options, config);
  await pool.load(config);

  let reloading = Promise.resolve();
  let debounce: NodeJS.Timeout | undefined;
  const reload = () => {
    reloading = reloading.then(async () => {
      try {
        await pool.load(await readConfig(options.configPath));
        log('config: reloaded');
      } catch (error) {
        log(`config: kept the previous accounts (${(error as Error).message})`);
      }
    });
  };
  // The directory, not the file: an atomic write replaces the file, and a watch on the old file sees nothing after it.
  const watcher: FSWatcher = watch(dirname(options.configPath), (_event, file) => {
    if (file === basename(options.configPath)) {
      clearTimeout(debounce);
      debounce = setTimeout(reload, 50);
    }
  });
  resources.defer(async () => {
    watcher.close();
    clearTimeout(debounce);
    await reloading;
  });

  const server = createServer((request, response) => {
    pool.handle(request, response).catch((error: unknown) => {
      if (response.headersSent) {
        response.destroy();
        return;
      }
      response.writeHead(502, { 'content-type': 'text/plain' });
      response.end(`claude-pool: upstream unreachable (${(error as Error).message})\n`);
    });
  });
  const listening = once(server, 'listening');
  server.listen(pool.port, '127.0.0.1');
  await listening;
  resources.defer(async () => {
    const closed = server[Symbol.asyncDispose]();
    server.closeAllConnections();
    await closed;
  });
  const address = server.address();
  if (address === null || typeof address === 'string') {
    throw new Error('claude-pool: the server has no TCP address');
  }

  const owned = resources.move();
  const close = () => owned.disposeAsync();
  return { origin: `http://127.0.0.1:${address.port}`, close, [Symbol.asyncDispose]: close };
}
