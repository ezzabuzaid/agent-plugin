import {
  and,
  contentPattern,
  type ReminderRule,
} from '@deepagents/experimental/coding-agent-reminders';

import { promptEvents } from './events.ts';

export const infraRules: ReminderRule[] = [
  // Mined from virtual-care/infra + global CLAUDE.md (reminders-curator, 2026-07-10).
  {
    id: 'infra-as-code-only',
    target: 'prompt',
    events: promptEvents,
    when: and(
      contentPattern(/\b(infra|infrastructure|terraform|pulumi|provision|deploy(?:ment)?)\b/i),
      contentPattern(
        /\b(cloud|gcp|gcloud|aws|azure|resources?|buckets?|vms?|clusters?|iam|service accounts?)\b/i,
      ),
    ),
    message:
      'Infrastructure changes go through the IaC tool (terraform/pulumi) following the existing infra patterns — never mutate cloud resources directly via console or raw CLI; IaC owns everything, not CI/CD or manual edits.',
  },
];
