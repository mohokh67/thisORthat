import { supabase } from './supabase'
import { toNote, type NoteRow } from './mappers'
import type { Note, Priority } from './types'

/**
 * Inserts a Note. The caller supplies the id and position (computed from local
 * state) so the card can render optimistically before the round-trip completes.
 * The author name is snapshotted onto the row so later participant renames leave
 * existing notes untouched.
 */
export async function createNote(input: {
  id: string
  boardId: string
  columnId: string
  text: string
  authorId: string
  authorName: string
  position: number
}): Promise<Note> {
  const { data, error } = await supabase
    .from('notes')
    .insert({
      id: input.id,
      board_id: input.boardId,
      column_id: input.columnId,
      text: input.text.trim(),
      author_id: input.authorId,
      author_name: input.authorName,
      position: input.position,
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

export async function updateNotePriority(id: string, priority: Priority): Promise<void> {
  const { error } = await supabase.from('notes').update({ priority }).eq('id', id)
  if (error) throw error
}

export async function deleteNote(id: string): Promise<void> {
  const { error } = await supabase.from('notes').delete().eq('id', id)
  if (error) throw error
}
