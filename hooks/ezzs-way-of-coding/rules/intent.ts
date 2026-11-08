import {
  contentPattern,
  not,
} from '@deepagents/experimental/coding-agent-reminders';

/**
 * Claude Code runs UserPromptSubmit for each turn it starts, also for a turn
 * that a subagent hand-back, a message from another Claude session or a
 * background-task notification starts. The hook payload has no field that
 * tells these apart (Claude Code 2.1.319 sends session_id, transcript_path,
 * cwd, prompt_id, permission_mode, agent_id, agent_type, effort, prompt and
 * session_title). Claude Code frames each of these prompts, and the frame is
 * the start of `prompt`: `<agent-message …>` or `<cross-session-message …>`,
 * with or without the line `Another Claude session sent a message:` in front,
 * and `<task-notification>`. When a usage limit resets, Claude Code continues
 * the task by itself with a fixed prompt: `Your claude.ai usage limit has
 * reset.`, `Your claude.ai usage is available again before the usage-limit
 * reset.` or `You can continue now.`, then `Continue the task you were working
 * on when the …limit was reached`. The transcript records the origin of these
 * entries as `origin.kind` `peer`, `task-notification` and
 * `auto-continuation`; no prompt whose origin is `human` starts with a frame
 * or a continuation prompt. A relayed report talks about pages, packages and
 * failures in its own words, so a prompt rule reads only what the user typed.
 */
export const typedByUser = not(
  contentPattern(
    /^(?:Another Claude session sent a message:\n)?<(?:agent-message|cross-session-message) |^<task-notification>\n|^(?:Your claude\.ai usage limit has reset|Your claude\.ai usage is available again before the usage-limit reset|You can continue now)\. Continue the task you were working on when the (?:usage )?limit was reached;/,
  ),
);

/**
 * The prompt asks the agent to build or change behavior. These are the verbs
 * that package-api-first and source-before-new-implementation share; each rule
 * adds its own extra verbs with `or`.
 */
export const asksToBuild = contentPattern(
  /\b(implement|build|add|create|change)\b/i,
);
