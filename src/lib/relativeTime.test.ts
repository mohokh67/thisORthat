import { describe, expect, it } from 'vitest'
import { relativeTime } from './relativeTime'

const now = Date.parse('2026-09-07T12:00:00.000Z')
const ago = (ms: number) => new Date(now - ms).toISOString()

const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

describe('relativeTime', () => {
  it('says "just now" under 45 seconds', () => {
    expect(relativeTime(ago(0), now)).toBe('just now')
    expect(relativeTime(ago(44 * SECOND), now)).toBe('just now')
  })

  it('rounds to whole minutes under an hour', () => {
    expect(relativeTime(ago(45 * SECOND), now)).toBe('1m ago')
    expect(relativeTime(ago(90 * SECOND), now)).toBe('2m ago')
    expect(relativeTime(ago(59 * MINUTE), now)).toBe('59m ago')
  })

  it('rounds to whole hours under a day', () => {
    expect(relativeTime(ago(60 * MINUTE), now)).toBe('1h ago')
    expect(relativeTime(ago(5 * HOUR), now)).toBe('5h ago')
    expect(relativeTime(ago(23 * HOUR), now)).toBe('23h ago')
  })

  it('rounds to whole days beyond that', () => {
    expect(relativeTime(ago(24 * HOUR), now)).toBe('1d ago')
    expect(relativeTime(ago(10 * DAY), now)).toBe('10d ago')
  })

  it('treats a future timestamp (clock skew) as "just now"', () => {
    expect(relativeTime(ago(-5 * MINUTE), now)).toBe('just now')
  })

  it('is "just now" for an unparseable timestamp', () => {
    expect(relativeTime('not a date', now)).toBe('just now')
  })
})
