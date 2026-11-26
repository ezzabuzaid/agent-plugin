import type { EngineInterface, Register } from 'claude-code'

// Ezz's words before nearly every /clear (11 times verbatim in 30 days, 2026-11).
const STANDING_REQUEST =
  "you are almost out of context. give me handoff prompt that makes new session continue as if it was you with knowledge of running subagents and shells/tasks. but keep doing the task at hand tho. don't cancel anything but the handoff should be aware"

const DEFAULT_PERCENT = 93
const MAX_ASKS = 2

type Continuation = { sessionId: string; path: string }

type Writing = Continuation & { phase: 'writing'; asks: number; turnId?: string }

type Rollover = { phase: 'watching' } | Writing | { phase: 'stopped' }

function writeRequest(percent: number, path: string): string {
  return [
    `Context is at ${percent}%. ${STANDING_REQUEST}`,
    `Use the coding:rollover skill (Write): finish the step in hand, cancel nothing, write the continuation to ${path}, then end your turn.`,
    'Once the file exists, the coding plugin runs /clear and the next context resumes from it.',
  ].join('\n\n')
}

function resumeRequest({ sessionId, path }: Continuation): string {
  return `Continue session ${sessionId} as if you were it: its context reached the rollover threshold and was cleared. Read ${path} first, then follow the coding:rollover skill (Resume).`
}

async function continuationOf($: EngineInterface): Promise<Continuation> {
  const [sessionId, { transcriptPath, configRoot }] = await Promise.all([
    $.session.id(),
    $.session.info(),
  ])
  const root = configRoot ?? transcriptPath.replace(/\/projects\/.*$/, '')
  return { sessionId, path: `${root}/continuations/${sessionId}.md` }
}

async function percentOf($: EngineInterface): Promise<number> {
  const { context } = await $.session.usage()
  return context.percent ?? 0
}

async function isWritten($: EngineInterface, path: string): Promise<boolean> {
  const { exitCode } = await $.process.run(['test', '-s', path])
  return exitCode === 0
}

export const register: Register = (on, options) => {
  const threshold =
    typeof options['rolloverPercent'] === 'number' ? options['rolloverPercent'] : DEFAULT_PERCENT
  let rollover: Rollover = { phase: 'watching' }

  on('session.end', ($, e, next) => {
    if (e.reason === 'clear') rollover = { phase: 'watching' }
    return next(e)
  })

  on('turn.start', ($, e, next) => {
    if (
      e.agentId === undefined &&
      rollover.phase === 'writing' &&
      rollover.turnId === undefined &&
      e.text.includes(rollover.path)
    ) {
      rollover = { ...rollover, turnId: e.turnId }
    }
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const answer = await next(e)
    if (e.agentId !== undefined || (await $.session.surfaces()).length === 0) return answer

    if (rollover.phase === 'watching' && e.reason === 'answer') {
      const percent = await percentOf($)
      if (percent < threshold) return answer
      const continuation = await continuationOf($)
      rollover = { phase: 'writing', ...continuation, asks: 1 }
      try {
        await $.prompt.submit({ text: writeRequest(percent, continuation.path) })
      } catch (error) {
        rollover = { phase: 'watching' }
        throw error
      }
      return answer
    }

    if (rollover.phase !== 'writing' || rollover.turnId !== e.turnId) return answer

    const writing = rollover
    try {
      if (e.reason !== 'answer') {
        rollover = { phase: 'stopped' }
        $.ui.toast('Rollover stopped: its turn was interrupted. It starts again after a /clear.')
      } else if (await isWritten($, writing.path)) {
        rollover = { phase: 'watching' }
        await $.command.run({ command: 'clear' })
        await $.prompt.submit({ text: resumeRequest(writing) })
      } else if (writing.asks < MAX_ASKS) {
        const { sessionId, path, asks } = writing
        rollover = { phase: 'writing', sessionId, path, asks: asks + 1 }
        await $.prompt.submit({ text: writeRequest(await percentOf($), path) })
      } else {
        rollover = { phase: 'stopped' }
        $.ui.toast(`Rollover stopped: no continuation at ${writing.path}, so the context was not cleared.`)
      }
    } catch (error) {
      rollover = { phase: 'stopped' }
      const why = error instanceof Error ? error.message : String(error)
      $.ui.toast(`Rollover stopped (${why}). After your own /clear, send: ${resumeRequest(writing)}`)
    }
    return answer
  })
}
