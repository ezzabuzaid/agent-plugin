import type { ModelApiError, On, PromptOrigin } from 'claude-code'
import { type Engine, describe, expect, mock, test } from 'claude-code/testing'

type Session = {
  surfaces: ('terminal' | 'desktop')[]
  log: string[]
}

type Ending = 'answer' | 'error'

function newSession(overrides: Partial<Session> = {}): Session {
  return { surfaces: ['terminal'], log: [], ...overrides }
}

// What the engine answers beneath the plugin. The rollover mod shares the module, so
// the usage stays low and it never asks for a continuation.
function engineBeneath(on: On, session: Session): void {
  on('session.usage', () => ({
    value: { startedAt: 0, context: { window: 1_000_000, tokens: 10_000, percent: 1 }, rateLimits: [] },
  }))
  on('session.surfaces', () => ({ value: session.surfaces }))
  on('prompt.submit', (_, e) => {
    session.log.push(`prompt (${e.origin.kind}): ${e.text}`)
    return { text: e.text }
  })
  on('ui.toast', (_, e) => {
    session.log.push(`toast: ${e.text}`)
    return { value: undefined }
  })
  on('turn.start', (_, e) => ({ turnId: e.turnId }))
  on('turn.complete', (_, e) => ({ text: e.answer }))
  on('classic.StopFailure', () => ({}))
}

async function failTurn($: Engine, error: ModelApiError, agentId?: string): Promise<void> {
  await $.classic.StopFailure(agentId === undefined ? { error } : { error, agent_id: agentId })
}

async function runTurn($: Engine, turnId: string, ending: Ending, agentId?: string): Promise<void> {
  const agent = agentId === undefined ? {} : { agentId }
  await $.turn.start({ text: 'work', turnId, ...agent })
  await $.turn.complete({ answer: 'ok', durationMs: 1, isAborted: false, turnId, reason: ending, ...agent })
}

async function typePrompt($: Engine, text: string, origin: PromptOrigin): Promise<void> {
  await $.prompt.submit({ text, wait: false, origin })
}

function resumes(session: Session): string[] {
  return session.log.filter(line => line.startsWith('prompt (plugin): '))
}

function toasts(session: Session): string[] {
  return session.log.filter(line => line.startsWith('toast: '))
}

// Three resumes in a row, each resumed turn dying on a server error again.
async function resumeThreeTimes($: Engine, clock: { advance: (ms: number) => Promise<void> }): Promise<void> {
  for (const [index, delay] of [30_000, 120_000, 300_000].entries()) {
    await failTurn($, 'server_error')
    await clock.advance(delay)
    await runTurn($, `resumed-${index}`, 'error')
  }
}

const TEN_MINUTES = 600_000

describe('a main-loop turn that dies on a transient API error is resumed', () => {
  for (const error of ['server_error', 'overloaded'] as const) {
    test(`${error}: one prompt naming the error, 30 s later and not before`, async ($, on) => {
      const session = newSession()
      engineBeneath(on, session)
      const clock = mock.clock(on, { now: 0 })

      await failTurn($, error)
      await clock.advance(29_999)
      const early = resumes(session).length
      await clock.advance(1)

      expect(early).toBe(0)
      expect(resumes(session)).toHaveLength(1)
      expect(resumes(session)[0]).toContain(`API error (${error})`)
    })
  }
})

describe('only a transient error in an interactive main loop is resumed', () => {
  const untouched: ModelApiError[] = [
    'rate_limit',
    'invalid_request',
    'authentication_failed',
    'oauth_org_not_allowed',
    'account_on_hold',
    'verification_required',
    'billing_error',
    'model_not_found',
    'unknown',
    'max_output_tokens',
    'cloud_credential_error',
  ]
  for (const error of untouched) {
    test(`${error} is left to the person`, async ($, on) => {
      const session = newSession()
      engineBeneath(on, session)
      const clock = mock.clock(on, { now: 0 })

      await failTurn($, error)
      await clock.advance(TEN_MINUTES)

      expect(session.log).toEqual([])
    })
  }

  test("a subagent's server error is left to its caller", async ($, on) => {
    const session = newSession()
    engineBeneath(on, session)
    const clock = mock.clock(on, { now: 0 })

    await failTurn($, 'server_error', 'agent-1')
    await clock.advance(TEN_MINUTES)

    expect(session.log).toEqual([])
  })

  test('a headless run (no surfaces) is never resumed', async ($, on) => {
    const session = newSession({ surfaces: [] })
    engineBeneath(on, session)
    const clock = mock.clock(on, { now: 0 })

    await failTurn($, 'server_error')
    await clock.advance(TEN_MINUTES)

    expect(session.log).toEqual([])
  })
})

describe('consecutive failures back off, then give up', () => {
  test('the second resume waits 2 min and the third 5 min', async ($, on) => {
    const session = newSession()
    engineBeneath(on, session)
    const clock = mock.clock(on, { now: 0 })

    await failTurn($, 'server_error')
    await clock.advance(30_000)
    await runTurn($, 'resumed-1', 'error')
    await failTurn($, 'overloaded')
    await clock.advance(119_999)
    const beforeSecond = resumes(session).length
    await clock.advance(1)
    const afterSecond = resumes(session).length
    await runTurn($, 'resumed-2', 'error')
    await failTurn($, 'server_error')
    await clock.advance(299_999)
    const beforeThird = resumes(session).length
    await clock.advance(1)

    expect([beforeSecond, afterSecond, beforeThird]).toEqual([1, 2, 2])
    expect(resumes(session)).toHaveLength(3)
  })

  test('a fourth failure in a row gets a toast and no resume', async ($, on) => {
    const session = newSession()
    engineBeneath(on, session)
    const clock = mock.clock(on, { now: 0 })

    await resumeThreeTimes($, clock)
    await failTurn($, 'server_error')
    await clock.advance(TEN_MINUTES)

    expect(resumes(session)).toHaveLength(3)
    expect(toasts(session)).toHaveLength(1)
    expect(toasts(session)[0]).toContain('gave up')
  })

  test('a main-loop answer starts the count again at 30 s', async ($, on) => {
    const session = newSession()
    engineBeneath(on, session)
    const clock = mock.clock(on, { now: 0 })

    await resumeThreeTimes($, clock)
    await runTurn($, 'answered', 'answer')
    await failTurn($, 'server_error')
    await clock.advance(30_000)

    expect(resumes(session)).toHaveLength(4)
    expect(toasts(session)).toEqual([])
  })

  test("a subagent's answer does not reset the count", async ($, on) => {
    const session = newSession()
    engineBeneath(on, session)
    const clock = mock.clock(on, { now: 0 })

    await resumeThreeTimes($, clock)
    await runTurn($, 'subagent-turn', 'answer', 'agent-1')
    await failTurn($, 'server_error')
    await clock.advance(TEN_MINUTES)

    expect(resumes(session)).toHaveLength(3)
    expect(toasts(session)).toHaveLength(1)
  })
})

describe('the person typing first wins', () => {
  for (const kind of ['composer', 'bridge'] as const) {
    test(`a ${kind} prompt before the wait ends cancels the resume`, async ($, on) => {
      const session = newSession()
      engineBeneath(on, session)
      const clock = mock.clock(on, { now: 0 })

      await failTurn($, 'server_error')
      await clock.advance(10_000)
      await typePrompt($, 'continue', { kind })
      await clock.advance(TEN_MINUTES)

      expect(resumes(session)).toEqual([])
      expect(session.log).toEqual([`prompt (${kind}): continue`])
    })
  }
})
