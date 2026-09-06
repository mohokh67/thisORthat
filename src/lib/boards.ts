import { supabase } from './supabase'
import { positionAtEnd } from './position'
import { templateColumns } from './templates'
import { toNote, type NoteRow } from './notes'
import type { Board, BoardData, Column, TemplateName } from './types'

interface BoardRow {
  id: string
  title: string
  template: string
  created_at: string
}

interface ColumnRow {
  id: string
  board_id: string
  title: string
  color: string | null
  position: number
  created_at: string
}

function toBoard(row: BoardRow): Board {
  return {
    id: row.id,
    title: row.title,
    template: row.template as TemplateName,
    createdAt: row.created_at,
  }
}

function toColumn(row: ColumnRow): Column {
  return {
    id: row.id,
    boardId: row.board_id,
    title: row.title,
    color: (row.color as Column['color']) ?? null,
    position: row.position,
    createdAt: row.created_at,
  }
}

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
 * Appends a bare Column to a Board (title placeholder, position after the last
 * one). Renaming, colouring, reordering, and deleting Columns arrive in #8.
 */
export async function addColumn(boardId: string, title = 'New column'): Promise<Column> {
  const { data: last, error: lastError } = await supabase
    .from('columns')
    .select('position')
    .eq('board_id', boardId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (lastError) throw lastError

  const position = positionAtEnd(last?.position ?? null)
  const { data, error } = await supabase
    .from('columns')
    .insert({ id: crypto.randomUUID(), board_id: boardId, title, position })
    .select()
    .single()
  if (error) throw error

  return toColumn(data as ColumnRow)
}
