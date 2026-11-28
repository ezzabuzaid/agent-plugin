import { type KeychainAccount, readConfig, writeConfig } from './config.ts';
import type { TokenStore } from './keychain.ts';

type List = 'rotation' | 'excluded';

async function move(configPath: string, alias: string, from: List, to: List): Promise<void> {
  const config = await readConfig(configPath);
  const index = config[from].findIndex((entry) => entry.alias === alias);
  if (index === -1) {
    const elsewhere = config[to].some((entry) => entry.alias === alias);
    throw new Error(elsewhere ? `${alias} is already in ${to}` : `unknown alias: ${alias}`);
  }
  const [entry] = config[from].splice(index, 1);
  config[to].push(entry!);
  await writeConfig(configPath, config);
}

export const exclude = (configPath: string, alias: string) => move(configPath, alias, 'rotation', 'excluded');

export const include = (configPath: string, alias: string) => move(configPath, alias, 'excluded', 'rotation');

/** Stores the setup token first, so the daemon never sees an entry whose Keychain item does not exist yet. */
export async function add(configPath: string, account: { alias: string; email: string }, store: TokenStore): Promise<void> {
  const config = await readConfig(configPath);
  if ([...config.rotation, ...config.excluded].some((entry) => entry.alias === account.alias)) {
    throw new Error(`${account.alias} already exists`);
  }
  const entry: KeychainAccount = {
    alias: account.alias,
    source: 'keychain',
    service: `${account.alias}-oauth-token`,
    account: account.email,
  };
  await store.add(entry);
  config.rotation.push(entry);
  await writeConfig(configPath, config);
}

/** Leaves the Keychain item where it is. */
export async function remove(configPath: string, alias: string): Promise<void> {
  const config = await readConfig(configPath);
  const kept = {
    ...config,
    rotation: config.rotation.filter((entry) => entry.alias !== alias),
    excluded: config.excluded.filter((entry) => entry.alias !== alias),
  };
  if (kept.rotation.length + kept.excluded.length === config.rotation.length + config.excluded.length) {
    throw new Error(`unknown alias: ${alias}`);
  }
  await writeConfig(configPath, kept);
}
