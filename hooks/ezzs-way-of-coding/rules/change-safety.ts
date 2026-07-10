import {
  and,
  contentPattern,
  type ReminderRule,
} from '@deepagents/experimental/coding-agent-reminders';

import { promptEvents } from './events.ts';

export const changeSafetyRules: ReminderRule[] = [
  // Mined from 7+ AGENTS.md files (reminders-curator, 2026-07-10).
  {
    id: 'preserve-existing-surface',
    target: 'prompt',
    events: promptEvents,
    when: and(
      contentPattern(
        /\b(refactor|redesign|rework|simplify|clean ?up|migrate|rebuild|replace|consolidate|streamline|remove|rename)\b/i,
      ),
      contentPattern(
        /\b(features?|ui|ux|screens?|pages?|components?|options?|settings?|buttons?|menus?|flows?|routes?|surface)\b/i,
      ),
    ),
    message:
      'Do not remove, hide, or rename existing features or UI surface unless explicitly asked — keep the surface intact and stub or annotate what is not wired yet, and do not silently change existing behavior beyond the ask.',
  },
  {
    id: 'guard-destructive-mutations',
    target: 'prompt',
    events: promptEvents,
    when: and(
      contentPattern(
        /\b(delete|remove|drop|truncate|prune|purge|wipe|destroy|cleanup|clean up)\b/i,
      ),
      contentPattern(
        /\b(database|data|records?|rows?|table|schema|volume|bucket|files?|directory|account|users?|resource|deployment|environment)\b/i,
      ),
    ),
    message:
      'Before destructive mutation, confirm the exact target and scope, preserve unrelated persistent data, prefer a reversible or transactional path where possible, and verify the post-state before reporting success.',
  },
  {
    id: 'dependency-upgrade-discipline',
    target: 'prompt',
    events: promptEvents,
    when: and(
      contentPattern(/\b(dependency|dependencies|package|packages|library|SDK)\b/i),
      contentPattern(/\b(upgrade|update|outdated|bump|latest|version|sweep)\b/i),
    ),
    message:
      'Read the current manifests, lockfile, and installed versions before changing dependencies. Prefer the smallest viable safe upgrade lane and separate breaking or migration work explicitly.',
  },
];
