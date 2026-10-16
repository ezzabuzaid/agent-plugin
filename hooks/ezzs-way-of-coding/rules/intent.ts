import { contentPattern } from '@deepagents/experimental/coding-agent-reminders';

/**
 * The prompt asks the agent to build or change behavior. These are the verbs
 * that package-api-first, ascii-before-ui and source-before-new-implementation
 * share; each rule adds its own extra verbs with `or`.
 */
export const asksToBuild = contentPattern(
  /\b(implement|build|add|create|change)\b/i,
);
