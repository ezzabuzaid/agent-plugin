import type { ModelApiError, Register, Timer } from 'claude-code'

// The kinds that clear on their own and that Claude Code does not retry itself: an
// overload (529) and a dropped connection both arrive as `server_error`. A usage limit
// (`rate_limit`) Claude Code resumes itself; the other kinds will not clear by waiting.
const TRANSIENT: ReadonlySet<ModelApiError> = new Set(['server_error', 'overloaded'])

// One wait per consecutive resume; past the last, the mod gives up.
const BACKOFF_MS = [30_000, 120_000, 300_000]

function resumeRequest(error: ModelApiError): string {
  return `Your last turn ended on an API error (${error}). Continue the task where it stopped.`
}

export const register: Register = (on) => {
  let resumes = 0
  let pending: Timer | undefined

  on('prompt.submit', { origin: [{ kind: 'composer' }, { kind: 'bridge' }] }, ($, e, next) => {
    pending?.cancel()
    pending = undefined
    return next(e)
  })

  on('turn.complete', { reason: 'answer' }, async ($, e, next) => {
    const answer = await next(e)
    if (e.agentId === undefined) resumes = 0
    return answer
  })

  on('classic.StopFailure', async ($, e, next) => {
    const result = await next(e)
    if (e.agent_id !== undefined || !TRANSIENT.has(e.error)) return result
    if ((await $.session.surfaces()).length === 0) return result

    const delay = BACKOFF_MS[resumes]
    if (delay === undefined) {
      $.ui.toast(`Auto-resume gave up: ${resumes} resumes in a row ended on an API error.`)
      return result
    }
    resumes += 1
    pending = $.clock.after(delay, () => {
      pending = undefined
      void $.prompt.submit({ text: resumeRequest(e.error) })
    })
    return result
  })
}
