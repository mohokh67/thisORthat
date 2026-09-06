import type { Board, Column, Note } from './types'

export interface BoardEntities {
  board: Board
  columns: Column[]
  notes: Note[]
}

/** A normalized row change, produced by the realtime adapter from a Supabase payload. */
export type ChangeEvent =
  | { table: 'board'; type: 'upsert'; row: Board }
  | { table: 'columns'; type: 'upsert'; row: Column }
  | { table: 'columns'; type: 'delete'; id: string }
  | { table: 'notes'; type: 'upsert'; row: Note }
  | { table: 'notes'; type: 'delete'; id: string }

function upsertById<T extends { id: string }>(list: T[], row: T): T[] {
  const index = list.findIndex((item) => item.id === row.id)
  if (index === -1) {
    return [...list, row]
  }
  const next = list.slice()
  next[index] = row
  return next
}

function removeById<T extends { id: string }>(list: T[], id: string): T[] {
  return list.filter((item) => item.id !== id)
}

/**
 * Applies one row change to the board's entities. Upserts are keyed by id, so an
 * optimistic local change and its own echoed realtime event converge without
 * duplicating (last write wins). Deleting a column also drops its notes, keeping
 * the view consistent even if the per-note DELETE events lag or are missed.
 */
export function reconcile(entities: BoardEntities, event: ChangeEvent): BoardEntities {
  switch (event.table) {
    case 'board':
      return { ...entities, board: event.row }
    case 'columns':
      if (event.type === 'upsert') {
        return { ...entities, columns: upsertById(entities.columns, event.row) }
      }
      return {
        ...entities,
        columns: removeById(entities.columns, event.id),
        notes: entities.notes.filter((note) => note.columnId !== event.id),
      }
    case 'notes':
      if (event.type === 'upsert') {
        return { ...entities, notes: upsertById(entities.notes, event.row) }
      }
      return { ...entities, notes: removeById(entities.notes, event.id) }
  }
}
