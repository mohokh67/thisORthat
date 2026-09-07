import { describe, expect, it } from 'vitest'
import { parseTheme } from './theme'

describe('parseTheme', () => {
  it('accepts the two known themes', () => {
    expect(parseTheme('light')).toBe('light')
    expect(parseTheme('dark')).toBe('dark')
  })

  it('is null for anything missing or unrecognised', () => {
    expect(parseTheme(null)).toBeNull()
    expect(parseTheme('')).toBeNull()
    expect(parseTheme('Dark')).toBeNull()
    expect(parseTheme('system')).toBeNull()
  })
})
