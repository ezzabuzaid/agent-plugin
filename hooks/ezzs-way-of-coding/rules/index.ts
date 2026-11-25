import type {
  GuardRule,
  ReminderHookConfig,
  ReminderRule,
} from '@deepagents/experimental/coding-agent-reminders';

import { changeSafetyRules } from './change-safety.ts';
import { collaborationRules } from './collaboration.ts';
import { defaultsRules } from './defaults.ts';
import { dialogGuards } from './dialog.ts';
import { evidenceRules } from './evidence.ts';
import { failuresRules } from './failures.ts';
import { frontendRules } from './frontend.ts';
import { infraRules } from './infra.ts';
import { memoryGuards } from './memory.ts';
import { recordGuards } from './records.ts';
import { scopeRules } from './scope.ts';
import { stopRules } from './stop.ts';
import { subagentGuards } from './subagents.ts';
import { testingRules } from './testing.ts';
import { verificationGuards, verificationRules } from './verification.ts';

export const reminderRules: ReminderRule[] = [
  ...defaultsRules,
  ...evidenceRules,
  ...changeSafetyRules,
  ...testingRules,
  ...collaborationRules,
  ...scopeRules,
  ...frontendRules,
  ...infraRules,
  ...failuresRules,
  ...verificationRules,
  ...stopRules,
];

// A refusal that ends the call's purpose comes before one that only fixes how
// it is made: a compaction brief is refused before its missing effort.
export const guardRules: GuardRule[] = [
  ...verificationGuards,
  ...memoryGuards,
  ...subagentGuards,
  ...dialogGuards,
  ...recordGuards,
];

export const ezzsWayOfCodingConfig: ReminderHookConfig = {
  reminders: reminderRules,
  guards: guardRules,
};
