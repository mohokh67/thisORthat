import type { Priority } from './types'

const CYCLE: readonly Priority[] = ['none', 'low', 'medium', 'high']

/** The next priority in the none -> low -> medium -> high -> none cycle. */
export function nextPriority(current: Priority): Priority {
  const index = CYCLE.indexOf(current)
  return CYCLE[(index + 1) % CYCLE.length]
}
