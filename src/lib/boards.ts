import { supabase } from './supabase'
import {
  toBoard,
  toColumn,
  toNote,
  type BoardRow,
  type ColumnRow,
  type NoteRow,
} from './mappers'
import { templateColumns } from './templates'
import type { Board, BoardData, Column, TemplateName } from './types'

/**
 * Creates a Board with a client-generated id and inserts the Template's seeded
 * Columns. The id is generated here (not by the database) so the caller can
 * navigate to the new board without a round-trip.
 */
export async function createBoard(input: {
  title: string
  template: TemplateName
}): Promise<Board> {
  const id = crypto.randomUUID()
  const { data, error } = await supabase
    .from('boards')
    .insert({ id, title: input.title.trim(), template: input.template })
    .select()
    .single()
  if (error) throw error

  const seeds = templateColumns(input.template)
  if (seeds.length > 0) {
    const rows = seeds.map((seed, index) => ({
      id: crypto.randomUUID(),
      board_id: id,
      title: seed.title,
      color: seed.color,
      position: index,
    }))
    const { error: columnsError } = await supabase.from('columns').insert(rows)
    if (columnsError) throw columnsError
  }

  return toBoard(data as BoardRow)
}

/** A Board with its Columns and Notes (both ordered), or `null` if no board has that id. */
export async function fetchBoard(id: string): Promise<BoardData | null> {
  const { data: board, error } = await supabase
    .from('boards')
    .select()
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  if (!board) return null

  const [columnsResult, notesResult] = await Promise.all([
    supabase.from('columns').select().eq('board_id', id).order('position', { ascending: true }),
    supabase.from('notes').select().eq('board_id', id).order('position', { ascending: true }),
  ])
  if (columnsResult.error) throw columnsResult.error
  if (notesResult.error) throw notesResult.error

  return {
    board: toBoard(board as BoardRow),
    columns: (columnsResult.data as ColumnRow[]).map(toColumn),
    notes: (notesResult.data as NoteRow[]).map(toNote),
  }
}

export async function renameBoard(id: string, title: string): Promise<void> {
  const { error } = await supabase.from('boards').update({ title: title.trim() }).eq('id', id)
  if (error) throw error
}

/**
 * Inserts a bare Column. The caller supplies the id and position (computed from
 * local state) so the new column can render optimistically. Renaming, colouring,
 * reordering, and deleting Columns arrive in #8.
 */
export async function addColumn(input: {
  id: string
  boardId: string
  title?: string
  position: number
}): Promise<Column> {
  const { data, error } = await supabase
    .from('columns')
    .insert({
      id: input.id,
      board_id: input.boardId,
      title: input.title ?? 'New column',
      position: input.position,
    })
    .select()
    .single()
  if (error) throw error

  return toColumn(data as ColumnRow)
}
