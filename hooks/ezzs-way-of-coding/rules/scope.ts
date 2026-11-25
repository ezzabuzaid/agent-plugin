import {
  always,
  type ReminderRule,
} from '@deepagents/experimental/coding-agent-reminders';

export const scopeRules: ReminderRule[] = [
  {
    id: 'capture-out-of-scope-followups',
    target: 'session',
    events: ['SessionStart', 'Setup'],
    when: always,
    message: [
      'Keep the active user request as the execution scope.',
      '- When the work exposes a concrete, actionable follow-up that is valuable but unnecessary to complete the active request, do not expand the task. Add it with `agent-backlog`, briefly report the captured item, then continue the active task.',
      '- Classify each stored item on both axes: `--kind feature|defect|risk|debt` (what the item is) and `--work-type business|internal|change|unplanned` (how the work entered: planned follow-ups are usually `internal` or `change`; incident-driven ones `unplanned`).',
      '- When an item can start only after something, give that as a condition flag on `add` (or later with `agent-backlog wait <id>`), never as "Trigger:" prose: `--after <id>` (another item is done), `--published <pkg@range>` (npm has a version in the range), `--clean <repo:glob>` (no uncommitted file there, such as paths a peer holds), `--until "<event>"` (an event or a judgement, such as a third consumer). A question for the user is `agent-backlog ask <id> "<question>"`; read `agent-backlog decisions` before you ask one again.',
      '- Required blockers and explicit user additions remain in scope. Do not capture vague suggestions, speculative cleanup, or completed work.',
      "- A problem in the user's own hooks, skills or plugins (agent-plugin, `~/.claude/hooks`, `~/.agents/skills`) is filed in agent-plugin: `agent-backlog add --repo agent-plugin`. A problem in a third-party tool (an upstream bug, Claude Code itself) is not filed: mention it once in your reply instead.",
      '- If `agent-backlog` fails, do not claim the item was stored; follow its configuration guidance or report the failure.',
    ].join('\n'),
  },
];
