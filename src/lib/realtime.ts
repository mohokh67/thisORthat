import { supabase } from './supabase'
import { toBoard, toColumn, toNote, type BoardRow, type ColumnRow, type NoteRow } from './mappers'
import type { ChangeEvent } from './reconcile'

export type ConnectionStatus = 'connecting' | 'live' | 'reconnecting'

interface BoardChannelHandlers {
  onChange: (event: ChangeEvent) => void
  onStatus: (status: ConnectionStatus) => void
}

/**
 * Subscribes to every columns/notes row change for one board (plus the board row
 * itself) via Realtime Postgres Changes, and reports the channel's connection
 * status. Returns a function that tears the subscription down.
 */
export function subscribeToBoard(
  boardId: string,
  handlers: BoardChannelHandlers,
): () => void {
  const channel = supabase
    .channel(`board:${boardId}`)
    .on<BoardRow>(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'boards', filter: `id=eq.${boardId}` },
      (payload) => {
        if (payload.eventType !== 'DELETE') {
          handlers.onChange({ table: 'board', type: 'upsert', row: toBoard(payload.new) })
        }
      },
    )
    .on<ColumnRow>(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'columns', filter: `board_id=eq.${boardId}` },
      (payload) => {
        if (payload.eventType === 'DELETE') {
          handlers.onChange({ table: 'columns', type: 'delete', id: String(payload.old.id) })
        } else {
          handlers.onChange({ table: 'columns', type: 'upsert', row: toColumn(payload.new) })
        }
      },
    )
    .on<NoteRow>(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'notes', filter: `board_id=eq.${boardId}` },
      (payload) => {
        if (payload.eventType === 'DELETE') {
          handlers.onChange({ table: 'notes', type: 'delete', id: String(payload.old.id) })
        } else {
          handlers.onChange({ table: 'notes', type: 'upsert', row: toNote(payload.new) })
        }
      },
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        handlers.onStatus('live')
      } else if (
        status === 'CHANNEL_ERROR' ||
        status === 'TIMED_OUT' ||
        status === 'CLOSED'
      ) {
        handlers.onStatus('reconnecting')
      }
    })

  return () => {
    void supabase.removeChannel(channel)
  }
}
