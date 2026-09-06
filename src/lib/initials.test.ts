import { describe, expect, it } from 'vitest'
import { initials } from './initials'

describe('initials', () => {
  it('takes the first letter of a single-word name', () => {
    expect(initials('Sam')).toBe('S')
  })

  it('takes first and last initials of a multi-word name', () => {
    expect(initials('Ada Lovelace')).toBe('AL')
    expect(initials('  jean  luc  picard ')).toBe('JP')
  })

  it('falls back to "?" for a blank name', () => {
    expect(initials('   ')).toBe('?')
    expect(initials('')).toBe('?')
  })

  it('uppercases', () => {
    expect(initials('priya')).toBe('P')
  })
})
