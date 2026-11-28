import { execFile, spawn } from 'node:child_process';
import { once } from 'node:events';
import { userInfo } from 'node:os';
import { promisify } from 'node:util';

import { z } from 'zod';

import type { AccountEntry, KeychainAccount } from './config.ts';
import type { Credential, TokenSource } from './pool.ts';

const run = promisify(execFile);
const security = '/usr/bin/security';

export interface TokenStore extends TokenSource {
  /** Stores a new setup token for `entry`; resolves only once it is stored. */
  add(entry: KeychainAccount): Promise<void>;
}

/** Claude Code's own login item: JSON whose `claudeAiOauth` holds the access token and its expiry in ms. */
const NativeCredentials = z.object({
  claudeAiOauth: z.object({ accessToken: z.string().min(1), expiresAt: z.number() }),
});

async function findPassword(service: string, account: string): Promise<string> {
  const { stdout } = await run(security, ['find-generic-password', '-s', service, '-a', account, '-w']);
  return stdout.trim();
}

export const keychain: TokenStore = {
  async read(entry: AccountEntry): Promise<Credential> {
    if (entry.source === 'keychain') {
      return { token: await findPassword(entry.service, entry.account), expiresAt: Number.POSITIVE_INFINITY };
    }
    const stored = NativeCredentials.parse(
      JSON.parse(await findPassword('Claude Code-credentials', userInfo().username)),
    );
    return { token: stored.claudeAiOauth.accessToken, expiresAt: stored.claudeAiOauth.expiresAt };
  },

  /**
   * `-w` last and without a value: `security` itself asks for the token on the terminal, so the token never enters
   * an argv, this process, a log or a file.
   */
  async add(entry: KeychainAccount): Promise<void> {
    if (!process.stdin.isTTY) {
      throw new Error('add needs a terminal: security asks for the setup token there (piped input is not supported)');
    }
    const child = spawn(security, ['add-generic-password', '-a', entry.account, '-s', entry.service, '-U', '-w'], {
      stdio: 'inherit',
    });
    const [code, signal] = (await once(child, 'exit')) as [number | null, NodeJS.Signals | null];
    if (code !== 0) {
      throw new Error(`security add-generic-password failed (${signal ?? `exit ${code}`}); the config is unchanged`);
    }
  },
};
