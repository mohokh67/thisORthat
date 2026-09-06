import { describe, expect, it } from 'vitest'
import { parseStoredLenses, type StoredLenses } from './sortLensStore'

describe('parseStoredLenses', () => {
  it('returns an empty map for absent data', () => {
    expect(parseStoredLenses(null)).toEqual({})
  })

  it('returns an empty map for malformed JSON', () => {
    expect(parseStoredLenses('{not json')).toEqual({})
  })

  it('keeps only recognised lens values', () => {
    const raw = JSON.stringify({ c1: 'points', c2: 'bogus', c3: 'oldest', c4: 42 })
    expect(parseStoredLenses(raw)).toEqual({ c1: 'points', c3: 'oldest' })
  })

  it('drops a stored "custom" entry (it is the default)', () => {
    const raw = JSON.stringify({ c1: 'custom', c2: 'priority' })
    expect(parseStoredLenses(raw)).toEqual({ c2: 'priority' })
  })

  it('ignores a non-object payload', () => {
    expect(parseStoredLenses(JSON.stringify(['points']))).toEqual({})
    expect(parseStoredLenses(JSON.stringify('points'))).toEqual({})
  })

  it('round-trips a real selection map', () => {
    const lenses: StoredLenses = { c1: 'newest', c2: 'points' }
    expect(parseStoredLenses(JSON.stringify(lenses))).toEqual(lenses)
  })
})
