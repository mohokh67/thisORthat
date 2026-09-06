import { supabase } from './supabase'
import { toColumn, type ColumnRow } from './mappers'
import type { Column, ColumnColor } from './types'

/**
 * Inserts a bare Column. The caller supplies the id and position (computed from
 * local state) so the new column can render optimistically with no pre-query.
 */
export async function addColumn(input: {
  id: string
  boardId: string
  title?: string
  color?: ColumnColor | null
  position: number
}): Promise<Column> {
  const { data, error } = await supabase
    .from('columns')
    .insert({
      id: input.id,
      board_id: input.boardId,
      title: input.title ?? 'New column',
      color: input.color ?? null,
      position: input.position,
    })
    .select()
    .single()
  if (error) throw error
  return toColumn(data as ColumnRow)
}

export async function renameColumn(id: string, title: string): Promise<void> {
  const { error } = await supabase.from('columns').update({ title: title.trim() }).eq('id', id)
  if (error) throw error
}

export async function recolorColumn(id: string, color: ColumnColor | null): Promise<void> {
  const { error } = await supabase.from('columns').update({ color }).eq('id', id)
  if (error) throw error
}

export async function moveColumn(id: string, position: number): Promise<void> {
  const { error } = await supabase.from('columns').update({ position }).eq('id', id)
  if (error) throw error
}

/** Deleting a column cascades to its notes and their votes at the database. */
export async function deleteColumn(id: string): Promise<void> {
  const { error } = await supabase.from('columns').delete().eq('id', id)
  if (error) throw error
}

/** Writes fresh positions for a whole column list (the reindex fallback). */
export async function reindexColumns(
  columns: readonly { id: string; position: number }[],
): Promise<void> {
  const results = await Promise.all(
    columns.map((column) =>
      supabase.from('columns').update({ position: column.position }).eq('id', column.id),
    ),
  )
  const failed = results.find((result) => result.error)
  if (failed?.error) throw failed.error
}
