#!/Users/ezzabuzaid/.nvm/versions/node/v26.13.0/bin/node
// <swiftbar.title>claude-pool</swiftbar.title>
// <swiftbar.refreshOnOpen>true</swiftbar.refreshOnOpen>
// <swiftbar.hideRunInTerminal>true</swiftbar.hideRunInTerminal>
// <swiftbar.hideLastUpdated>true</swiftbar.hideLastUpdated>
// <swiftbar.hideDisablePlugin>true</swiftbar.hideDisablePlugin>
// A SwiftBar plugin: the menu shows the pool's accounts, and its items run this file again with an action.
// The shebang is the node that install.ts runs the pool on (it has Full Disk Access; this checkout is under ~/Desktop).
import { homedir } from 'node:os';
import { createInterface } from 'node:readline/promises';

import { add, exclude, include, remove } from '../accounts.ts';
import { configPath, readConfig } from '../config.ts';
import { keychain } from '../keychain.ts';
import type { PoolStatus } from '../pool.ts';

const [action, alias] = process.argv.slice(2);
const self = `bash="${process.execPath}" param1="${import.meta.filename}"`;
const when = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' }) : '-';
const openLog = `Open log | bash=/usr/bin/open param1=${homedir()}/Library/Logs/claude-pool.log terminal=false`;

async function status(): Promise<PoolStatus | undefined> {
  const { port } = await readConfig(configPath());
  try {
    return (await (await fetch(`http://127.0.0.1:${port}/_pool/status`)).json()) as PoolStatus;
  } catch {
    return undefined;
  }
}

async function addAccount(): Promise<void> {
  // Runs in Terminal (terminal=true): security asks for the setup token itself, so it never reaches this process.
  const prompt = createInterface({ input: process.stdin, output: process.stdout });
  const account = { alias: await prompt.question('alias: '), email: await prompt.question('email: ') };
  prompt.close();
  await add(configPath(), account, keychain);
  console.log(`added ${account.alias}`);
}

function printPoolDown(): void {
  console.log('pool down | sfimage=exclamationmark.triangle');
  console.log('---');
  console.log(openLog);
}

function printMenu(report: PoolStatus): void {
  const working = report.accounts.filter((account) => account.list === 'rotation' && account.state === 'ok');
  console.log(`${working.length} | sfimage=person.2`);
  console.log('---');
  for (const account of report.accounts) {
    const state = account.state === 'parked' ? `parked until ${when(account.parkedUntil)}` : account.state;
    console.log(`${account.alias}  ${account.list}  ${state}`);
    console.log(`--7d reset ${when(account.sevenDayReset)} · 5h reset ${when(account.fiveHourReset)}`);
    const toggle = account.list === 'rotation' ? 'exclude' : 'include';
    console.log(`--${toggle} | ${self} param2=${toggle} param3=${account.alias} terminal=false refresh=true`);
    console.log(`--remove | ${self} param2=remove param3=${account.alias} terminal=false refresh=true`);
  }
  console.log(`${report.pinnedSessions} pinned sessions`);
  console.log('---');
  console.log(`Add account… | ${self} param2=add terminal=true refresh=true`);
  console.log(openLog);
}

if (action === 'add') {
  await addAccount();
} else if (action === 'exclude' || action === 'include' || action === 'remove') {
  await { exclude, include, remove }[action](configPath(), alias!);
} else {
  const report = await status();
  if (report) {
    printMenu(report);
  } else {
    printPoolDown();
  }
}
