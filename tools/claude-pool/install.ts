import { readFile, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { poll } from '@zukhruf/async';
import { atomicWrite } from '@zukhruf/fs';
import { type AbsolutePath, Launchd, isAbsolutePath } from '@zukhruf/launchd';

import { configPath, readConfig } from './config.ts';

const label = 'com.ezzabuzaid.claude-pool';
/**
 * The checkout is under ~/Desktop, which macOS privacy control (TCC) closes to launchd jobs: any other node blocks in
 * open() at module load. This binary holds Full Disk Access; context-compiler's LaunchAgent runs on it for the same reason.
 */
const node = '/Users/ezzabuzaid/.nvm/versions/node/v26.13.0/bin/node';

function absolute(path: string): AbsolutePath {
  if (!isAbsolutePath(path)) throw new Error(`not an absolute path: ${path}`);
  return path;
}

/** Claude Code's user settings: every session reads `env` from here, and a running session picks up a change. */
function settingsPath(): string {
  return join(process.env.CLAUDE_CONFIG_DIR ?? join(homedir(), '.claude'), 'settings.json');
}

/** Sets or removes `env.ANTHROPIC_BASE_URL` and nothing else; the file round-trips byte for byte otherwise. */
async function setBaseUrl(url: string | undefined): Promise<void> {
  const path = settingsPath();
  const settings = JSON.parse(await readFile(path, 'utf8')) as { env?: Record<string, string> };
  if (url === undefined) {
    if (settings.env?.ANTHROPIC_BASE_URL === undefined) return;
    delete settings.env.ANTHROPIC_BASE_URL;
  } else {
    settings.env = { ...settings.env, ANTHROPIC_BASE_URL: url };
  }
  await atomicWrite(path, `${JSON.stringify(settings, null, 2)}\n`, {
    clock: globalThis,
    mode: (await stat(path)).mode & 0o777,
  });
}

/** True once the pool answers its status endpoint; a refused connection means it is still starting. */
async function answers(origin: string): Promise<true | undefined> {
  try {
    return (await fetch(`${origin}/_pool/status`)).ok || undefined;
  } catch {
    return undefined;
  }
}

/** Starts the pool under launchd, waits until it answers, and only then points Claude Code's settings at it. */
export async function install(): Promise<string> {
  const config = configPath();
  const { port } = await readConfig(config);
  const log = absolute(join(homedir(), 'Library', 'Logs', 'claude-pool.log'));
  await Launchd.agents({ clock: globalThis }).install({
    Label: label,
    ProgramArguments: [node, fileURLToPath(new URL('./cli.ts', import.meta.url)), 'serve'],
    EnvironmentVariables: { CLAUDE_POOL_CONFIG: config },
    WorkingDirectory: absolute(homedir()),
    KeepAlive: true,
    ProcessType: 'Interactive',
    StandardOutPath: log,
    StandardErrorPath: log,
  });
  const origin = `http://127.0.0.1:${port}`;
  const clock = globalThis;
  const ready = await poll(() => answers(origin), {
    interval: 250,
    signal: undefined,
    clock,
    deadline: clock.performance.now() + 15_000,
  });
  if (!ready) {
    throw new Error(`the pool did not answer on ${origin}; settings left unchanged (see ~/Library/Logs/claude-pool.log)`);
  }
  await setBaseUrl(origin);
  return origin;
}

/** The reverse order: sessions stop using the pool first, then the pool stops. */
export async function uninstall(): Promise<void> {
  await setBaseUrl(undefined);
  await Launchd.agents({ clock: globalThis }).service(label).uninstall({ signal: AbortSignal.timeout(30_000) });
}
