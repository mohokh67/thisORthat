import { describe, expect, it } from 'vitest'
import { orderNotes } from './sortLens'
import type { Note, Priority } from './types'

let seq = 0

function note(overrides: Partial<Note> = {}): Note {
  seq += 1
  return {
    id: `n${seq}`,
    boardId: 'b',
    columnId: 'c',
    text: `note ${seq}`,
    priority: 'none',
    authorId: 'a',
    authorName: 'A',
    position: seq,
    createdAt: `2026-01-01T00:00:${String(seq).padStart(2, '0')}.000Z`,
    ...overrides,
  }
}

function ids(notes: readonly Note[]): string[] {
  return notes.map((n) => n.id)
}

describe('orderNotes', () => {
  it('custom lens orders by position ascending', () => {
    const a = note({ id: 'a', position: 3 })
    const b = note({ id: 'b', position: 1 })
    const c = note({ id: 'c', position: 2 })
    expect(ids(orderNotes([a, b, c], 'custom', new Map()))).toEqual(['b', 'c', 'a'])
  })

  it('does not mutate the input array', () => {
    const input = [note({ id: 'a', position: 2 }), note({ id: 'b', position: 1 })]
    const snapshot = ids(input)
    orderNotes(input, 'custom', new Map())
    expect(ids(input)).toEqual(snapshot)
  })

  it('points lens orders high to low, including negatives', () => {
    const a = note({ id: 'a', position: 1 })
    const b = note({ id: 'b', position: 2 })
    const c = note({ id: 'c', position: 3 })
    const points = new Map([
      ['a', -2],
      ['b', 5],
      ['c', 0],
    ])
    expect(ids(orderNotes([a, b, c], 'points', points))).toEqual(['b', 'c', 'a'])
  })

  it('points lens treats a missing entry as zero', () => {
    const a = note({ id: 'a', position: 1 })
    const b = note({ id: 'b', position: 2 })
    const points = new Map([['a', -1]])
    expect(ids(orderNotes([a, b], 'points', points))).toEqual(['b', 'a'])
  })

  it('points lens breaks ties by position ascending', () => {
    const a = note({ id: 'a', position: 9 })
    const b = note({ id: 'b', position: 4 })
    const c = note({ id: 'c', position: 7 })
    const points = new Map([
      ['a', 2],
      ['b', 2],
      ['c', 2],
    ])
    expect(ids(orderNotes([a, b, c], 'points', points))).toEqual(['b', 'c', 'a'])
  })

  it('priority lens orders high -> medium -> low -> none', () => {
    const priorities: Priority[] = ['none', 'low', 'medium', 'high']
    const notes = priorities.map((priority, index) =>
      note({ id: priority, priority, position: index }),
    )
    expect(ids(orderNotes(notes, 'priority', new Map()))).toEqual([
      'high',
      'medium',
      'low',
      'none',
    ])
  })

  it('priority lens breaks ties by position ascending', () => {
    const a = note({ id: 'a', priority: 'high', position: 5 })
    const b = note({ id: 'b', priority: 'high', position: 2 })
    const c = note({ id: 'c', priority: 'low', position: 1 })
    expect(ids(orderNotes([a, b, c], 'priority', new Map()))).toEqual(['b', 'a', 'c'])
  })

  it('newest lens orders by createdAt descending', () => {
    const a = note({ id: 'a', createdAt: '2026-01-01T00:00:01.000Z', position: 3 })
    const b = note({ id: 'b', createdAt: '2026-01-01T00:00:03.000Z', position: 2 })
    const c = note({ id: 'c', createdAt: '2026-01-01T00:00:02.000Z', position: 1 })
    expect(ids(orderNotes([a, b, c], 'newest', new Map()))).toEqual(['b', 'c', 'a'])
  })

  it('oldest lens orders by createdAt ascending', () => {
    const a = note({ id: 'a', createdAt: '2026-01-01T00:00:01.000Z', position: 3 })
    const b = note({ id: 'b', createdAt: '2026-01-01T00:00:03.000Z', position: 2 })
    const c = note({ id: 'c', createdAt: '2026-01-01T00:00:02.000Z', position: 1 })
    expect(ids(orderNotes([a, b, c], 'oldest', new Map()))).toEqual(['a', 'c', 'b'])
  })

  it('newest/oldest lenses break createdAt ties by position ascending', () => {
    const stamp = '2026-01-01T00:00:05.000Z'
    const a = note({ id: 'a', createdAt: stamp, position: 8 })
    const b = note({ id: 'b', createdAt: stamp, position: 3 })
    expect(ids(orderNotes([a, b], 'newest', new Map()))).toEqual(['b', 'a'])
    expect(ids(orderNotes([a, b], 'oldest', new Map()))).toEqual(['b', 'a'])
  })

  it('returns a stable order when every key is equal', () => {
    const a = note({ id: 'a', priority: 'low', position: 1 })
    const b = note({ id: 'b', priority: 'low', position: 2 })
    const c = note({ id: 'c', priority: 'low', position: 3 })
    expect(ids(orderNotes([c, a, b], 'priority', new Map()))).toEqual(['a', 'b', 'c'])
  })
})
