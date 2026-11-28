#!/usr/bin/env node
import { parseArgs } from 'node:util';

import { Shutdown } from '@zukhruf/shutdown';

import { add, exclude, include, remove } from './accounts.ts';
import { configPath, readConfig } from './config.ts';
import { install, uninstall } from './install.ts';
import { keychain } from './keychain.ts';
import { type PoolStatus, startPool } from './pool.ts';

const usage = `usage: claude-pool <command>
  install                         run the pool under launchd, then point Claude Code's settings at it
  uninstall                       point Claude Code's settings back at Anthropic, then stop the pool
  serve                           run the pool on 127.0.0.1
  status                          show each account of the running pool
  exclude <alias>                 move an account out of the rotation
  include <alias>                 move an account back into the rotation
  add <alias> --account <email>   store a setup token (security asks for it) and add the account to the rotation
  remove <alias>                  drop an account from the config (its Keychain item stays)`;

const localTime = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

const when = (iso: string | null | undefined) => (iso ? localTime.format(new Date(iso)) : '-');

async function serve(): Promise<void> {
  using shutdown = new Shutdown();
  await using pool = await startPool({ configPath: configPath(), tokens: keychain, now: Date.now });
  console.log(`claude-pool listening on ${pool.origin}`);
  await new Promise((resolve) => shutdown.signal.addEventListener('abort', resolve, { once: true }));
}

async function status(): Promise<void> {
  const { port } = await readConfig(configPath());
  const response = await fetch(`http://127.0.0.1:${port}/_pool/status`);
  const report = (await response.json()) as PoolStatus;
  const rows = report.accounts.map((account) => [
    account.alias,
    account.list,
    account.state === 'parked' ? `parked until ${when(account.parkedUntil)} (${account.claim})` : account.state,
    when(account.sevenDayReset),
    when(account.fiveHourReset),
  ]);
  const table = [['ACCOUNT', 'LIST', 'STATE', '7D RESET', '5H RESET'], ...rows];
  const widths = table[0]!.map((_, column) => Math.max(...table.map((row) => row[column]!.length)));
  for (const row of table) {
    console.log(row.map((cell, column) => cell.padEnd(widths[column]!)).join('  ').trimEnd());
  }
  console.log(`\n${report.pinnedSessions} pinned session(s)`);
}

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: { account: { type: 'string' } },
});
const [command, alias] = positionals;

try {
  switch (command) {
    case 'install':
      console.log(`claude-pool runs under launchd; Claude Code sends model requests to ${await install()}`);
      break;
    case 'uninstall':
      await uninstall();
      console.log('claude-pool stopped; Claude Code talks to Anthropic directly again');
      break;
    case 'serve':
      await serve();
      break;
    case 'status':
      await status();
      break;
    case 'exclude':
    case 'include':
    case 'remove': {
      if (!alias) throw new Error(`usage: claude-pool ${command} <alias>`);
      await { exclude, include, remove }[command](configPath(), alias);
      console.log(`${command}d ${alias}`);
      break;
    }
    case 'add': {
      if (!alias || !values.account) throw new Error('usage: claude-pool add <alias> --account <email>');
      await add(configPath(), { alias, email: values.account }, keychain);
      console.log(`added ${alias}`);
      break;
    }
    default:
      console.error(usage);
      process.exitCode = 2;
  }
} catch (error) {
  console.error(`claude-pool: ${(error as Error).message}`);
  process.exitCode = 1;
}
