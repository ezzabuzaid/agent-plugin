import type { Register } from 'claude-code'
import { register as resume } from './resume'
import { register as rollover } from './rollover'

// The engine loads one hooks module per plugin, so this one registers each mod's hooks.
export const register: Register = (on, options) => {
  rollover(on, options)
  resume(on, options)
}
