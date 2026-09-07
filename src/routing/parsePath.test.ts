import { describe, expect, it } from 'vitest'
import { boardPath, parsePath } from './parsePath'

describe('parsePath', () => {
  it('treats the root path as the landing page', () => {
    expect(parsePath('/')).toEqual({ name: 'landing' })
  })

  it('reads a board id from "/b/<id>"', () => {
    expect(parsePath('/b/abc-123')).toEqual({ name: 'board', boardId: 'abc-123' })
  })

  it('tolerates a trailing slash on a board route', () => {
    expect(parsePath('/b/abc-123/')).toEqual({ name: 'board', boardId: 'abc-123' })
  })

  it('decodes a percent-encoded board id', () => {
    expect(parsePath('/b/a%20b')).toEqual({ name: 'board', boardId: 'a b' })
  })

  it('passes a malformed percent-escape through instead of throwing', () => {
    expect(parsePath('/b/a%E0%A4b')).toEqual({ name: 'board', boardId: 'a%E0%A4b' })
  })

  it('falls back to landing for an unknown path', () => {
    expect(parsePath('/nonsense/here')).toEqual({ name: 'landing' })
  })

  it('does not match a nested path under a board id', () => {
    expect(parsePath('/b/abc/extra')).toEqual({ name: 'landing' })
  })
})

describe('boardPath', () => {
  it('builds the path for a board id', () => {
    expect(boardPath('abc-123')).toBe('/b/abc-123')
  })

  it('round-trips through parsePath', () => {
    expect(parsePath(boardPath('a b'))).toEqual({ name: 'board', boardId: 'a b' })
  })
})
