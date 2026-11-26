import type {
  GuardRule,
  ReminderHookConfig,
  ReminderRule,
} from '@deepagents/experimental/coding-agent-reminders';

// Each rule module loads on its own (#5777). A module that throws while it
// loads is named on stderr and gives no rules; the other modules' rules keep
// working. With static imports one broken file failed the whole hook, and
// Claude Code then ran every call with no rule of this package.
async function load<M>(
  file: string,
  importModule: () => Promise<M>,
): Promise<M | undefined> {
  try {
    return await importModule();
  } catch (error) {
    process.stderr.write(
      `ezzs-way-of-coding: rules/${file} failed to load, its rules are off: ${error instanceof Error ? error.message : String(error)}\n`,
    );
    return undefined;
  }
}

const [
  changeSafety,
  collaboration,
  defaults,
  dialog,
  evidence,
  failures,
  frontend,
  infra,
  memory,
  records,
  scope,
  stop,
  subagents,
  testing,
  verification,
] = await Promise.all([
  load('change-safety.ts', () => import('./change-safety.ts')),
  load('collaboration.ts', () => import('./collaboration.ts')),
  load('defaults.ts', () => import('./defaults.ts')),
  load('dialog.ts', () => import('./dialog.ts')),
  load('evidence.ts', () => import('./evidence.ts')),
  load('failures.ts', () => import('./failures.ts')),
  load('frontend.ts', () => import('./frontend.ts')),
  load('infra.ts', () => import('./infra.ts')),
  load('memory.ts', () => import('./memory.ts')),
  load('records.ts', () => import('./records.ts')),
  load('scope.ts', () => import('./scope.ts')),
  load('stop.ts', () => import('./stop.ts')),
  load('subagents.ts', () => import('./subagents.ts')),
  load('testing.ts', () => import('./testing.ts')),
  load('verification.ts', () => import('./verification.ts')),
]);

export const reminderRules: ReminderRule[] = [
  ...(defaults?.defaultsRules ?? []),
  ...(evidence?.evidenceRules ?? []),
  ...(changeSafety?.changeSafetyRules ?? []),
  ...(testing?.testingRules ?? []),
  ...(collaboration?.collaborationRules ?? []),
  ...(scope?.scopeRules ?? []),
  ...(frontend?.frontendRules ?? []),
  ...(infra?.infraRules ?? []),
  ...(failures?.failuresRules ?? []),
  ...(verification?.verificationRules ?? []),
  ...(stop?.stopRules ?? []),
];

// A refusal that ends the call's purpose comes before one that only fixes how
// it is made: a compaction brief is refused before its missing effort.
export const guardRules: GuardRule[] = [
  ...(verification?.verificationGuards ?? []),
  ...(memory?.memoryGuards ?? []),
  ...(subagents?.subagentGuards ?? []),
  ...(dialog?.dialogGuards ?? []),
  ...(records?.recordGuards ?? []),
];

export const ezzsWayOfCodingConfig: ReminderHookConfig = {
  reminders: reminderRules,
  guards: guardRules,
};
