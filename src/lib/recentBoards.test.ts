import { describe, expect, it } from 'vitest'
import { parseRecent, recordOpen, RECENT_LIMIT, type RecentBoard } from './recentBoards'

describe('parseRecent', () => {
  it('is empty for anything missing or malformed', () => {
    expect(parseRecent(null)).toEqual([])
    expect(parseRecent('not json')).toEqual([])
    expect(parseRecent('{"not":"an array"}')).toEqual([])
  })

  it('drops entries missing an id or title', () => {
    const raw = JSON.stringify([
      { id: 'b1', title: 'Keep', lastOpened: 5 },
      { id: 'b2', lastOpened: 9 },
      { title: 'No id', lastOpened: 9 },
    ])
    expect(parseRecent(raw).map((b) => b.id)).toEqual(['b1'])
  })

  it('drops entries whose lastOpened is negative or outside the valid Date range', () => {
    const raw = JSON.stringify([
      { id: 'ok', title: 'Ok', lastOpened: 1_000 },
      { id: 'neg', title: 'Neg', lastOpened: -1 },
      { id: 'huge', title: 'Huge', lastOpened: 1e30 },
    ])
    expect(parseRecent(raw).map((b) => b.id)).toEqual(['ok'])
  })

  it('returns entries newest-first', () => {
    const raw = JSON.stringify([
      { id: 'old', title: 'Old', lastOpened: 1 },
      { id: 'new', title: 'New', lastOpened: 3 },
      { id: 'mid', title: 'Mid', lastOpened: 2 },
    ])
    expect(parseRecent(raw).map((b) => b.id)).toEqual(['new', 'mid', 'old'])
  })
})

describe('recordOpen', () => {
  const seed: RecentBoard[] = [
    { id: 'b1', title: 'First', lastOpened: 100 },
    { id: 'b2', title: 'Second', lastOpened: 200 },
  ]

  it('adds a newly opened board at the front', () => {
    const next = recordOpen(seed, { id: 'b3', title: 'Third' }, 300)
    expect(next[0]).toEqual({ id: 'b3', title: 'Third', lastOpened: 300 })
  })

  it('moves an already-known board to the front and refreshes its time and title', () => {
    const next = recordOpen(seed, { id: 'b1', title: 'First renamed' }, 300)
    expect(next[0]).toEqual({ id: 'b1', title: 'First renamed', lastOpened: 300 })
    expect(next).toHaveLength(2)
  })

  it('caps the list at RECENT_LIMIT, dropping the oldest', () => {
    let list: RecentBoard[] = []
    for (let i = 0; i < RECENT_LIMIT + 3; i += 1) {
      list = recordOpen(list, { id: `b${i}`, title: `Board ${i}` }, i)
    }
    expect(list).toHaveLength(RECENT_LIMIT)
    expect(list[0].id).toBe(`b${RECENT_LIMIT + 2}`)
    expect(list.some((b) => b.id === 'b0')).toBe(false)
  })

  it('does not mutate the input list', () => {
    const copy = [...seed]
    recordOpen(seed, { id: 'b9', title: 'Nine' }, 999)
    expect(seed).toEqual(copy)
  })
})
