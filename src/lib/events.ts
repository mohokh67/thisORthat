import { supabase } from './supabase'
import { toActivityEvent, type EventRow } from './mappers'
import type { BuiltEvent } from './activity'
import type { ActivityEvent } from './types'

/**
 * Appends one Activity log row. Called after a successful mutation (ADR-0002):
 * best-effort, so callers swallow the rejection rather than surfacing it.
 */
export async function logEvent(input: {
  boardId: string
  actorId: string
  actorName: string
  event: BuiltEvent
}): Promise<void> {
  const { error } = await supabase.from('events').insert({
    board_id: input.boardId,
    actor_id: input.actorId,
    actor_name: input.actorName,
    action: input.event.action,
    target_type: input.event.targetType,
    target_id: input.event.targetId,
    detail: input.event.detail,
  })
  if (error) throw error
}

/** The board's most recent Activity log entries, newest first. */
export async function fetchRecentEvents(boardId: string, limit = 100): Promise<ActivityEvent[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('board_id', boardId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data as EventRow[]).map(toActivityEvent)
}
