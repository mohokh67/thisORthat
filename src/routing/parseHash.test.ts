import { describe, expect, it } from 'vitest'
import { boardHash, parseHash } from './parseHash'

describe('parseHash', () => {
  it('treats an empty hash as the landing page', () => {
    expect(parseHash('')).toEqual({ name: 'landing' })
  })

  it('treats "#/" as the landing page', () => {
    expect(parseHash('#/')).toEqual({ name: 'landing' })
  })

  it('reads a board id from "#/b/<id>"', () => {
    expect(parseHash('#/b/abc-123')).toEqual({ name: 'board', boardId: 'abc-123' })
  })

  it('tolerates a trailing slash on a board route', () => {
    expect(parseHash('#/b/abc-123/')).toEqual({ name: 'board', boardId: 'abc-123' })
  })

  it('decodes a percent-encoded board id', () => {
    expect(parseHash('#/b/a%20b')).toEqual({ name: 'board', boardId: 'a b' })
  })

  it('falls back to landing for an unknown hash', () => {
    expect(parseHash('#/nonsense/here')).toEqual({ name: 'landing' })
  })

  it('does not match a nested path under a board id', () => {
    expect(parseHash('#/b/abc/extra')).toEqual({ name: 'landing' })
  })
})

describe('boardHash', () => {
  it('builds the hash for a board id', () => {
    expect(boardHash('abc-123')).toBe('#/b/abc-123')
  })

  it('round-trips through parseHash', () => {
    expect(parseHash(boardHash('a b'))).toEqual({ name: 'board', boardId: 'a b' })
  })
})
