import {
  toBoard,
  toColumn,
  toNote,
  type BoardRow,
  type ColumnRow,
  type NoteRow,
} from './mappers'
import type { ChangeEvent } from './reconcile'

export type ConnectionStatus = 'connecting' | 'live' | 'reconnecting'

export type RealtimeTable = 'boards' | 'columns' | 'notes'

export interface RawPayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: Record<string, unknown>
  old: Record<string, unknown>
}

/**
 * Normalizes a Supabase Postgres Changes payload into a ChangeEvent, or null
 * when it carries nothing actionable: a board DELETE (the board is gone; the
 * caller navigates away by other means), or a row DELETE whose payload has no id
 * (a table missing REPLICA IDENTITY FULL).
 */
export function toChangeEvent(table: RealtimeTable, payload: RawPayload): ChangeEvent | null {
  if (table === 'boards') {
    if (payload.eventType === 'DELETE') {
      return null
    }
    return { table: 'board', type: 'upsert', row: toBoard(payload.new as unknown as BoardRow) }
  }

  if (payload.eventType === 'DELETE') {
    const id = payload.old.id
    return typeof id === 'string' ? { table, type: 'delete', id } : null
  }

  if (table === 'columns') {
    return { table: 'columns', type: 'upsert', row: toColumn(payload.new as unknown as ColumnRow) }
  }
  return { table: 'notes', type: 'upsert', row: toNote(payload.new as unknown as NoteRow) }
}

/**
 * Maps a Realtime channel status string to the three-state connection model, or
 * null for statuses that should not change what the user sees.
 */
export function toConnectionStatus(raw: string): ConnectionStatus | null {
  if (raw === 'SUBSCRIBED') {
    return 'live'
  }
  if (raw === 'CHANNEL_ERROR' || raw === 'TIMED_OUT' || raw === 'CLOSED') {
    return 'reconnecting'
  }
  return null
}
