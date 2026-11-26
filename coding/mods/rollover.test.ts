import type { On } from 'claude-code'
import { type Engine, describe, expect, test } from 'claude-code/testing'

const STANDING_REQUEST =
  "you are almost out of context. give me handoff prompt that makes new session continue as if it was you with knowledge of running subagents and shells/tasks. but keep doing the task at hand tho. don't cancel anything but the handoff should be aware"
const CONFIG_ROOT = '/Users/ezz/.claude'

type Session = {
  id: string
  percent: number
  surfaces: ('terminal' | 'desktop')[]
  files: Map<string, string>
  log: string[]
  isShellBroken?: boolean
  onSubmit?: ((text: string) => Promise<void>) | undefined
}

type Ending = 'answer' | 'aborted' | 'error' | 'refusal'

function continuationPath(sessionId: string): string {
  return `${CONFIG_ROOT}/continuations/${sessionId}.md`
}

function newSession(overrides: Partial<Session> = {}): Session {
  return { id: 'session-1', percent: 10, surfaces: ['terminal'], files: new Map(), log: [], ...overrides }
}

// What the engine answers beneath the plugin. `process.run` answers the shell's
// `test` primitive from `files` and refuses any other command.
function engineBeneath(on: On, session: Session): void {
  on('session.usage', () => ({
    value: {
      startedAt: 0,
      context: { window: 1_000_000, tokens: session.percent * 10_000, percent: session.percent },
      rateLimits: [],
    },
  }))
  on('session.id', () => ({ value: session.id }))
  on('session.info', () => ({
    value: { transcriptPath: `${CONFIG_ROOT}/projects/-repo/${session.id}.jsonl`, configRoot: CONFIG_ROOT },
  }))
  on('session.surfaces', () => ({ value: session.surfaces }))
  on('process.run', (_, e) => {
    if (session.isShellBroken === true) throw new Error('the shell did not start')
    const [command, flag, path = ''] = e.argv
    if (command !== 'test' || !['-s', '-e', '-f'].includes(flag ?? '')) {
      throw new Error(`unexpected command: ${e.argv.join(' ')}`)
    }
    const content = session.files.get(path)
    const holds = flag === '-s' ? (content ?? '').length > 0 : content !== undefined
    return {
      value: { exitCode: holds ? 0 : 1, stdout: '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false },
    }
  })
  on('prompt.submit', async (_, e) => {
    session.log.push(`prompt: ${e.text}`)
    await session.onSubmit?.(e.text)
    return { text: e.text }
  })
  on('command.run', (_, e) => {
    session.log.push(`/${e.command}`)
    return {}
  })
  on('ui.toast', (_, e) => {
    session.log.push(`toast: ${e.text}`)
    return { value: undefined }
  })
  on('turn.start', (_, e) => ({ turnId: e.turnId }))
  on('turn.complete', (_, e) => ({ text: e.answer }))
  on('session.end', (_, e) => ({ sessionId: e.sessionId }))
}

// One turn as the engine runs it: its prompt starts it, its answer ends it. The text
// of a turn the mod's prompt started is that prompt as submitted; a real engine may
// frame it ("The coding plugin sent a message: ..."), which the tmux run covers.
async function runTurn($: Engine, turnId: string, text: string, ending: Ending = 'answer', agentId?: string) {
  const agent = agentId === undefined ? {} : { agentId }
  await $.turn.start({ text, turnId, ...agent })
  const fields = { answer: 'ok', durationMs: 1, isAborted: ending === 'aborted', turnId, ...agent }
  await $.turn.complete(
    ending === 'refusal'
      ? { ...fields, reason: 'refusal', refusal: { category: null, explanation: null } }
      : { ...fields, reason: ending },
  )
}

function prompts(session: Session): string[] {
  return session.log.filter(line => line.startsWith('prompt: ')).map(line => line.slice('prompt: '.length))
}

function toasts(session: Session): string[] {
  return session.log.filter(line => line.startsWith('toast: '))
}

function lastPrompt(session: Session): string {
  return prompts(session).at(-1) ?? ''
}

describe('a rollover never clears without a continuation', () => {
  test('a missing file gets one more ask, then a toast, no clear, and silence for the session', async ($, on) => {
    const session = newSession({ percent: 95 })
    engineBeneath(on, session)

    await runTurn($, 't1', 'work')
    await runTurn($, 't2', lastPrompt(session))
    await runTurn($, 't3', lastPrompt(session))
    await runTurn($, 't4', 'more work')
    await runTurn($, 't5', 'still more work')

    expect(prompts(session)).toHaveLength(2)
    expect(session.log).not.toContain('/clear')
    expect(toasts(session)).toHaveLength(1)
  })

  test('an empty continuation file counts as missing', async ($, on) => {
    const session = newSession({ percent: 95 })
    engineBeneath(on, session)

    await runTurn($, 't1', 'work')
    session.files.set(continuationPath('session-1'), '')
    await runTurn($, 't2', lastPrompt(session))

    expect(session.log).not.toContain('/clear')
    expect(prompts(session)).toHaveLength(2)
  })

  test('a shell that fails stops the rollover: no clear, and a toast with the resume line', async ($, on) => {
    const session = newSession({ id: 'old-session', percent: 95 })
    engineBeneath(on, session)

    await runTurn($, 't1', 'work')
    session.files.set(continuationPath('old-session'), '# continuation')
    session.isShellBroken = true
    await runTurn($, 't2', lastPrompt(session))
    await runTurn($, 't3', 'more work')

    expect(session.log).not.toContain('/clear')
    expect(prompts(session)).toHaveLength(1)
    expect(toasts(session)).toHaveLength(1)
    expect(toasts(session)[0]).toContain(continuationPath('old-session'))
  })

  test('an interrupted rollover turn clears nothing, asks no more, and toasts once', async ($, on) => {
    const session = newSession({ percent: 95 })
    engineBeneath(on, session)

    await runTurn($, 't1', 'work')
    session.files.set(continuationPath('session-1'), '# continuation')
    await runTurn($, 't2', lastPrompt(session), 'aborted')
    await runTurn($, 't3', `next request, see ${continuationPath('session-1')}`)

    expect(session.log).not.toContain('/clear')
    expect(prompts(session)).toHaveLength(1)
    expect(toasts(session)).toHaveLength(1)
  })

  test('a turn the ask did not start ends while writing: no clear and no second ask', async ($, on) => {
    const session = newSession({ percent: 95 })
    engineBeneath(on, session)

    await runTurn($, 't1', 'work')
    session.files.set(continuationPath('session-1'), '# continuation')
    await runTurn($, 't2', 'Stop hook feedback: run the housekeeping skill')
    await runTurn($, 't3', 'a prompt Ezz queued')

    expect(session.log).not.toContain('/clear')
    expect(prompts(session)).toHaveLength(1)
  })
})

describe('only a main-loop answer in a terminal session can start a rollover', () => {
  test("a subagent's turn above the threshold does nothing", async ($, on) => {
    const session = newSession({ percent: 99 })
    engineBeneath(on, session)

    await runTurn($, 't1', 'subagent brief', 'answer', 'agent-7')

    expect(session.log).toEqual([])
  })

  test('a headless run (no surfaces) above the threshold does nothing', async ($, on) => {
    const session = newSession({ percent: 99, surfaces: [] })
    engineBeneath(on, session)

    await runTurn($, 't1', 'claude -p prompt')

    expect(session.log).toEqual([])
  })

  for (const ending of ['aborted', 'error', 'refusal'] as const) {
    test(`a main turn that ends as ${ending} above the threshold does nothing`, async ($, on) => {
      const session = newSession({ percent: 99 })
      engineBeneath(on, session)

      await runTurn($, 't1', 'work', ending)

      expect(session.log).toEqual([])
    })
  }
})

describe('the threshold', () => {
  test('by default 92% does nothing and 93% asks once, in Ezz words, for the continuation path', async ($, on) => {
    const session = newSession({ percent: 92 })
    engineBeneath(on, session)

    await runTurn($, 't1', 'work')
    expect(session.log).toEqual([])

    session.percent = 93
    await runTurn($, 't2', 'more work')

    expect(prompts(session)).toHaveLength(1)
    expect(lastPrompt(session)).toContain(STANDING_REQUEST)
    expect(lastPrompt(session)).toContain('coding:rollover')
    expect(lastPrompt(session)).toContain(continuationPath('session-1'))
  })

})

describe('a written continuation rolls the session over', () => {
  test('the asked turn is found even when it starts before the ask resolves', async ($, on) => {
    const session = newSession({ id: 'old-session', percent: 95 })
    engineBeneath(on, session)
    session.onSubmit = async text => {
      session.onSubmit = undefined
      session.files.set(continuationPath('old-session'), '# continuation')
      await $.turn.start({ text, turnId: 't2' })
    }

    await runTurn($, 't1', 'work')
    await $.turn.complete({ answer: 'ok', durationMs: 1, isAborted: false, turnId: 't2', reason: 'answer' })

    expect(session.log).toContain('/clear')
  })

  test('the session clears, then resumes from the continuation of the old session', async ($, on) => {
    const session = newSession({ id: 'old-session', percent: 95 })
    engineBeneath(on, session)

    await runTurn($, 't1', 'work')
    session.files.set(continuationPath('old-session'), '# continuation')
    await runTurn($, 't2', lastPrompt(session))

    const clearAt = session.log.indexOf('/clear')
    const resume = session.log.slice(clearAt + 1).find(line => line.startsWith('prompt: ')) ?? ''
    expect(clearAt).toBeGreaterThan(-1)
    expect(resume).toContain(continuationPath('old-session'))
    expect(resume.replace(continuationPath('old-session'), '')).toContain('old-session')
  })

  test('a rolled-over session watches again and rolls over to its own path', async ($, on) => {
    const session = newSession({ id: 'old-session', percent: 95 })
    engineBeneath(on, session)

    await runTurn($, 't1', 'work')
    session.files.set(continuationPath('old-session'), '# continuation')
    await runTurn($, 't2', lastPrompt(session))
    session.id = 'new-session'
    session.percent = 5
    await runTurn($, 't3', lastPrompt(session))
    session.percent = 94
    await runTurn($, 't4', 'later work')

    expect(lastPrompt(session)).toContain(continuationPath('new-session'))
  })

  test("Ezz's own /clear while a continuation is due starts the watch again", async ($, on) => {
    const session = newSession({ id: 'old-session', percent: 95 })
    engineBeneath(on, session)

    await runTurn($, 't1', 'work')
    await $.session.end({ reason: 'clear', sessionId: 'old-session', resume: { id: 'old-session' } })
    session.id = 'new-session'
    await runTurn($, 't2', 'Continue from my own notes')

    expect(prompts(session)).toHaveLength(2)
    expect(lastPrompt(session)).toContain(continuationPath('new-session'))
  })
})
