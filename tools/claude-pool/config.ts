import { readFile, rename, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

import { z } from 'zod';

const alias = z.string().min(1);

const NativeAccount = z.strictObject({ alias, source: z.literal('native') });

const KeychainAccount = z.strictObject({
  alias,
  source: z.literal('keychain'),
  service: z.string().min(1),
  account: z.string().min(1),
});

export const AccountEntry = z.discriminatedUnion('source', [NativeAccount, KeychainAccount]);
export type AccountEntry = z.infer<typeof AccountEntry>;
export type NativeAccount = z.infer<typeof NativeAccount>;
export type KeychainAccount = z.infer<typeof KeychainAccount>;

export const PoolConfig = z
  .strictObject({
    port: z.int().min(0).max(65_535),
    /** Absent means https://api.anthropic.com. */
    upstream: z.url({ protocol: /^https?$/ }).optional(),
    rotation: z.array(AccountEntry),
    excluded: z.array(AccountEntry),
  })
  .superRefine((config, context) => {
    const seen = new Set<string>();
    for (const entry of [...config.rotation, ...config.excluded]) {
      if (seen.has(entry.alias)) {
        context.addIssue({ code: 'custom', message: `alias "${entry.alias}" appears more than once` });
      }
      seen.add(entry.alias);
    }
    if (config.rotation.filter((entry) => entry.source === 'native').length > 1) {
      context.addIssue({ code: 'custom', message: 'only one native account can be in the rotation' });
    }
  });
export type PoolConfig = z.infer<typeof PoolConfig>;

export const defaultUpstream = 'https://api.anthropic.com';

export function configPath(): string {
  return process.env.CLAUDE_POOL_CONFIG ?? join(homedir(), '.config', 'claude-pool', 'accounts.json');
}

export async function readConfig(path: string): Promise<PoolConfig> {
  const text = await readFile(path, 'utf8');
  const parsed = PoolConfig.safeParse(JSON.parse(text));
  if (!parsed.success) {
    throw new Error(`${path}: ${z.prettifyError(parsed.error)}`);
  }
  return parsed.data;
}

/** Readers of the file never see half of it: the new content replaces the file by a rename. */
export async function writeConfig(path: string, config: PoolConfig): Promise<void> {
  const temporary = `${path}.${process.pid}.tmp`;
  await writeFile(temporary, `${JSON.stringify(PoolConfig.parse(config), null, 2)}\n`);
  await rename(temporary, path);
}
