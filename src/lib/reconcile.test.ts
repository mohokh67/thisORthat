import { describe, expect, it } from 'vitest'
import { reconcile, type BoardEntities } from './reconcile'
import type { Board, Column, Note } from './types'

const board: Board = {
  id: 'b1',
  title: 'Retro',
  template: 'blank',
  createdAt: '2026-01-01T00:00:00Z',
}

function column(id: string, position = 0): Column {
  return { id, boardId: 'b1', title: id, color: null, position, createdAt: '2026-01-01T00:00:00Z' }
}

function note(id: string, columnId: string, text = id): Note {
  return {
    id,
    boardId: 'b1',
    columnId,
    text,
    priority: 'none',
    authorId: 'a1',
    authorName: 'Sam',
    position: 0,
    createdAt: '2026-01-01T00:00:00Z',
  }
}

const base: BoardEntities = {
  board,
  columns: [column('c1'), column('c2', 1)],
  notes: [note('n1', 'c1'), note('n2', 'c1')],
}

describe('reconcile', () => {
  it('adds a note on a first upsert', () => {
    const next = reconcile(base, { table: 'notes', type: 'upsert', row: note('n3', 'c2') })
    expect(next.notes.map((n) => n.id)).toEqual(['n1', 'n2', 'n3'])
  })

  it('replaces in place on an upsert for an existing id (no duplicate)', () => {
    const next = reconcile(base, {
      table: 'notes',
      type: 'upsert',
      row: note('n1', 'c1', 'edited'),
    })
    expect(next.notes).toHaveLength(2)
    expect(next.notes.find((n) => n.id === 'n1')?.text).toBe('edited')
  })

  it('removes a note on delete', () => {
    const next = reconcile(base, { table: 'notes', type: 'delete', id: 'n1' })
    expect(next.notes.map((n) => n.id)).toEqual(['n2'])
  })

  it('ignores a delete for an unknown note id', () => {
    const next = reconcile(base, { table: 'notes', type: 'delete', id: 'nope' })
    expect(next.notes).toEqual(base.notes)
  })

  it('deleting a column also drops that column’s notes', () => {
    const next = reconcile(base, { table: 'columns', type: 'delete', id: 'c1' })
    expect(next.columns.map((c) => c.id)).toEqual(['c2'])
    expect(next.notes).toEqual([])
  })

  it('upserts a column without touching notes', () => {
    const next = reconcile(base, {
      table: 'columns',
      type: 'upsert',
      row: { ...column('c1'), title: 'Renamed' },
    })
    expect(next.columns.find((c) => c.id === 'c1')?.title).toBe('Renamed')
    expect(next.notes).toBe(base.notes)
  })

  it('replaces the board on a board upsert', () => {
    const next = reconcile(base, {
      table: 'board',
      type: 'upsert',
      row: { ...board, title: 'New title' },
    })
    expect(next.board.title).toBe('New title')
  })

  it('does not mutate the input entities', () => {
    const snapshot = structuredClone(base)
    reconcile(base, { table: 'notes', type: 'delete', id: 'n1' })
    expect(base).toEqual(snapshot)
  })
})
