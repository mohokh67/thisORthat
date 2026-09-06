import { supabase } from './supabase'
import { toActivityEvent, type BoardRow, type ColumnRow, type EventRow, type NoteRow, type VoteRow } from './mappers'
import {
  toChangeEvent,
  toConnectionStatus,
  type ConnectionStatus,
  type RawPayload,
  type RealtimeTable,
} from './realtimeEvents'
import type { ChangeEvent } from './reconcile'
import type { ActivityEvent } from './types'

export type { ConnectionStatus }

interface BoardChannelHandlers {
  onChange: (event: ChangeEvent) => void
  onStatus: (status: ConnectionStatus) => void
}

/**
 * Subscribes to every columns/notes row change for one board (plus the board row
 * itself) via Realtime Postgres Changes, and reports the channel's connection
 * status. Returns a function that tears the subscription down.
 *
 * The channel topic carries a random suffix: `removeChannel` is async and
 * realtime-js dedups channels by topic, so a same-board remount (StrictMode, or
 * navigating away and back) could otherwise reuse a half-torn-down channel and
 * pile up duplicate bindings.
 */
export function subscribeToBoard(
  boardId: string,
  handlers: BoardChannelHandlers,
): () => void {
  const forward =
    (table: RealtimeTable) =>
    (payload: { eventType: string; new: unknown; old: unknown }): void => {
      const event = toChangeEvent(table, payload as RawPayload)
      if (event) {
        handlers.onChange(event)
      }
    }

  const channel = supabase
    .channel(`board:${boardId}:${crypto.randomUUID()}`)
    .on<BoardRow>(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'boards', filter: `id=eq.${boardId}` },
      forward('boards'),
    )
    .on<ColumnRow>(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'columns', filter: `board_id=eq.${boardId}` },
      forward('columns'),
    )
    .on<NoteRow>(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'notes', filter: `board_id=eq.${boardId}` },
      forward('notes'),
    )
    .on<VoteRow>(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'votes', filter: `board_id=eq.${boardId}` },
      forward('votes'),
    )
    .subscribe((status) => {
      const mapped = toConnectionStatus(status)
      if (mapped) {
        handlers.onStatus(mapped)
      }
    })

  return () => {
    void supabase.removeChannel(channel)
  }
}

/**
 * Subscribes to new Activity log rows for one board. The log is append-only, so
 * only INSERTs are forwarded. Returns a teardown function; the topic carries a
 * random suffix for the same reason `subscribeToBoard` does.
 */
export function subscribeToEvents(
  boardId: string,
  onInsert: (event: ActivityEvent) => void,
): () => void {
  const channel = supabase
    .channel(`events:${boardId}:${crypto.randomUUID()}`)
    .on<EventRow>(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'events', filter: `board_id=eq.${boardId}` },
      (payload) => onInsert(toActivityEvent(payload.new as unknown as EventRow)),
    )
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}
