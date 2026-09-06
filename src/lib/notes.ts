import { supabase } from './supabase'
import { positionAtStart } from './position'
import type { Note, Priority } from './types'

export interface NoteRow {
  id: string
  board_id: string
  column_id: string
  text: string
  priority: string
  author_id: string
  author_name: string
  position: number
  created_at: string
}

export function toNote(row: NoteRow): Note {
  return {
    id: row.id,
    boardId: row.board_id,
    columnId: row.column_id,
    text: row.text,
    priority: row.priority as Priority,
    authorId: row.author_id,
    authorName: row.author_name,
    position: row.position,
    createdAt: row.created_at,
  }
}

/**
 * Adds a Note at the top of its Column. The author name is snapshotted onto the
 * row so later renames of the participant leave existing notes untouched.
 */
export async function createNote(input: {
  boardId: string
  columnId: string
  text: string
  author: { id: string; name: string }
}): Promise<Note> {
  const { data: first, error: firstError } = await supabase
    .from('notes')
    .select('position')
    .eq('column_id', input.columnId)
    .order('position', { ascending: true })
    .limit(1)
    .maybeSingle()
  if (firstError) throw firstError

  const { data, error } = await supabase
    .from('notes')
    .insert({
      id: crypto.randomUUID(),
      board_id: input.boardId,
      column_id: input.columnId,
      text: input.text.trim(),
      author_id: input.author.id,
      author_name: input.author.name,
      position: positionAtStart(first?.position ?? null),
    })
    .select()
    .single()
  if (error) throw error

  return toNote(data as NoteRow)
}

export async function updateNoteText(id: string, text: string): Promise<void> {
  const { error } = await supabase.from('notes').update({ text: text.trim() }).eq('id', id)
  if (error) throw error
}

export async function deleteNote(id: string): Promise<void> {
  const { error } = await supabase.from('notes').delete().eq('id', id)
  if (error) throw error
}
