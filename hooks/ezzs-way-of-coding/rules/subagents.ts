import type { GuardRule } from '@deepagents/experimental/coding-agent-reminders';

export const subagentGuards: GuardRule[] = [
  {
    id: 'subagent-effort-named',
    // The library denies when a guard throws; this guard must fail open, and
    // an input that is not an object is the tool's to reject, not this guard's.
    when: (input) => {
      try {
        const agent = input.tool_input;
        if (input.tool_name !== 'Agent' || typeof agent !== 'object' || agent === null) return false;
        // The Agent tool ignores effort for a fork and for a remote agent.
        if (agent.subagent_type === 'fork' || agent.isolation === 'remote') return false;
        return agent.effort == null || (typeof agent.effort === 'string' && agent.effort.trim() === '');
      } catch {
        return false;
      }
    },
    deny: [
      'This Agent call names no effort, so the subagent inherits the session\'s. Pick it from the brief, unless the user, CLAUDE.md, a skill or a memory names a level:',
      '- `low`: the brief names the target and the result can be checked against the brief alone (find call sites, grep and report, fetch a page, run a command and report, apply a spelled-out edit, simplify named files).',
      '- `medium`: the agent decides what matters (debug an unknown cause, review or verify adversarially, design, write tests).',
      'Call Agent again with `effort` set; "lower" and "higher" are the relative forms the tool also accepts.',
    ].join('\n'),
  },
];
