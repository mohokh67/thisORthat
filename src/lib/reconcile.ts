import type { Board, Column, Note, Vote } from './types'

export interface BoardEntities {
  board: Board
  columns: Column[]
  notes: Note[]
  votes: Vote[]
}

/** A normalized row change, produced by the realtime adapter from a Supabase payload. */
export type ChangeEvent =
  | { table: 'board'; type: 'upsert'; row: Board }
  | { table: 'columns'; type: 'upsert'; row: Column }
  | { table: 'columns'; type: 'delete'; id: string }
  | { table: 'notes'; type: 'upsert'; row: Note }
  | { table: 'notes'; type: 'delete'; id: string }
  | { table: 'votes'; type: 'upsert'; row: Vote }
  | { table: 'votes'; type: 'delete'; id: string }

function upsertById<T extends { id: string }>(list: T[], row: T): T[] {
  const index = list.findIndex((item) => item.id === row.id)
  if (index === -1) {
    return [...list, row]
  }
  const next = list.slice()
  next[index] = row
  return next
}

/** Returns the same array reference when `id` is absent, so callers can skip work. */
function removeById<T extends { id: string }>(list: T[], id: string): T[] {
  return list.some((item) => item.id === id)
    ? list.filter((item) => item.id !== id)
    : list
}

/**
 * Applies one row change to the board's entities. Upserts are keyed by id, so an
 * optimistic local change and its own echoed realtime event converge without
 * duplicating (last write wins). Deleting a column also drops its notes, keeping
 * the view consistent even if the per-note DELETE events lag or are missed. An
 * event that changes nothing returns the input entities unchanged.
 */
export function reconcile(entities: BoardEntities, event: ChangeEvent): BoardEntities {
  switch (event.table) {
    case 'board':
      return { ...entities, board: event.row }
    case 'columns': {
      if (event.type === 'upsert') {
        return { ...entities, columns: upsertById(entities.columns, event.row) }
      }
      const columns = removeById(entities.columns, event.id)
      if (columns === entities.columns) {
        return entities
      }
      return {
        ...entities,
        columns,
        notes: entities.notes.filter((note) => note.columnId !== event.id),
      }
    }
    case 'notes': {
      if (event.type === 'upsert') {
        return { ...entities, notes: upsertById(entities.notes, event.row) }
      }
      const notes = removeById(entities.notes, event.id)
      return notes === entities.notes ? entities : { ...entities, notes }
    }
    case 'votes': {
      if (event.type === 'upsert') {
        return { ...entities, votes: upsertById(entities.votes, event.row) }
      }
      const votes = removeById(entities.votes, event.id)
      return votes === entities.votes ? entities : { ...entities, votes }
    }
  }
}
