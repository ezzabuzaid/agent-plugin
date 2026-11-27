import {
  ClaudeCodeAdapter,
  type ClaudeCodeSession,
  type ClaudeCodeSubagent,
  SessionReadError,
  type Step,
} from '@deepagents/trajectory';

/**
 * The steps of a Claude Code transcript, read through @deepagents/trajectory
 * (agent-plugin #6100). A transcript that is missing, unreadable or holds no
 * step gives no steps, so a caller treats 'no transcript' and 'no match' the
 * same way.
 */
export async function transcriptSteps(
  session: ClaudeCodeSession | ClaudeCodeSubagent,
): Promise<Step[]> {
  try {
    const { trajectory } = await new ClaudeCodeAdapter().read(session, {
      subagents: false,
    });
    return trajectory.steps;
  } catch (error) {
    if (error instanceof SessionReadError) return [];
    throw error;
  }
}

/**
 * The steps of a transcript whose every complete line parses, or undefined
 * when it cannot be read or holds a malformed line. A half-written last line
 * is tolerated: the agent may still be writing it.
 */
export async function wholeTranscriptSteps(
  session: ClaudeCodeSession | ClaudeCodeSubagent,
): Promise<Step[] | undefined> {
  try {
    const { trajectory, diagnostics } = await new ClaudeCodeAdapter().read(
      session,
      { subagents: false },
    );
    return diagnostics.some(({ code }) => code === 'invalid_json_line')
      ? undefined
      : trajectory.steps;
  } catch (error) {
    if (error instanceof SessionReadError) return undefined;
    throw error;
  }
}

/** The `extra.claude_code` record the adapter writes on each step and result. */
export function claudeCode(
  extra: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  const value = extra?.claude_code;
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? Object.fromEntries(Object.entries(value))
    : {};
}
