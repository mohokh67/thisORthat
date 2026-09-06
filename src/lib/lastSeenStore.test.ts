import { describe, expect, it } from 'vitest'
import { parseLastSeen } from './lastSeenStore'

describe('parseLastSeen', () => {
  it('is 0 when nothing is stored', () => {
    expect(parseLastSeen(null)).toBe(0)
  })

  it('is 0 for a non-numeric value', () => {
    expect(parseLastSeen('yesterday')).toBe(0)
    expect(parseLastSeen('')).toBe(0)
  })

  it('is 0 for a negative or non-finite value', () => {
    expect(parseLastSeen('-1')).toBe(0)
    expect(parseLastSeen('Infinity')).toBe(0)
  })

  it('returns a stored epoch-millisecond timestamp', () => {
    expect(parseLastSeen('1757246400000')).toBe(1757246400000)
  })
})
