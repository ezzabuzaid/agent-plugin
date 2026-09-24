import type {
  GuardRule,
  ReminderHookConfig,
  ReminderRule,
} from '@deepagents/experimental/coding-agent-reminders';

import { changeSafetyRules } from './change-safety.ts';
import { collaborationRules } from './collaboration.ts';
import { defaultsRules } from './defaults.ts';
import { evidenceRules } from './evidence.ts';
import { failuresRules } from './failures.ts';
import { frontendRules } from './frontend.ts';
import { infraRules } from './infra.ts';
import { testingRules } from './testing.ts';
import { verificationRules } from './verification.ts';

export const reminderRules: ReminderRule[] = [
  ...defaultsRules,
  ...evidenceRules,
  ...changeSafetyRules,
  ...testingRules,
  ...collaborationRules,
  ...frontendRules,
  ...infraRules,
  ...failuresRules,
  ...verificationRules,
];

export const guardRules: GuardRule[] = [];

export const ezzsWayOfCodingConfig: ReminderHookConfig = {
  reminders: reminderRules,
  guards: guardRules,
};
