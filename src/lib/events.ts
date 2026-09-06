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

/** How many log entries one page holds (initial load and each "load more"). */
export const EVENT_PAGE_SIZE = 50

/** Page size for the whole-history walk behind JSON / CSV export. */
const EXPORT_PAGE_SIZE = 1000

// `created_at` alone is not unique, so every keyset query also orders by `id`
// and the cursor is inclusive (`lte`) with the caller de-duping by id — a row
// that shares the boundary timestamp is re-seen, never skipped.
function orderedEventQuery(boardId: string, limit: number) {
  return supabase
    .from('events')
    .select('*')
    .eq('board_id', boardId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit)
}

/** The board's most recent Activity log entries, newest first. */
export async function fetchRecentEvents(
  boardId: string,
  limit = EVENT_PAGE_SIZE,
): Promise<ActivityEvent[]> {
  const { data, error } = await orderedEventQuery(boardId, limit)
  if (error) throw error
  return (data as EventRow[]).map(toActivityEvent)
}

/** The page of entries at or older than `before` (an ISO timestamp), newest
 *  first. Inclusive of the boundary timestamp; callers de-dupe by id. */
export async function fetchEventsBefore(
  boardId: string,
  before: string,
  limit = EVENT_PAGE_SIZE,
): Promise<ActivityEvent[]> {
  const { data, error } = await orderedEventQuery(boardId, limit).lte('created_at', before)
  if (error) throw error
  return (data as EventRow[]).map(toActivityEvent)
}

/** Every event for a board, newest first — walked in pages for exports. */
export async function fetchAllEvents(boardId: string): Promise<ActivityEvent[]> {
  const all: ActivityEvent[] = []
  const seen = new Set<string>()
  let before: string | undefined
  for (;;) {
    const page = before
      ? await fetchEventsBefore(boardId, before, EXPORT_PAGE_SIZE)
      : await fetchRecentEvents(boardId, EXPORT_PAGE_SIZE)
    let added = 0
    for (const event of page) {
      if (!seen.has(event.id)) {
        seen.add(event.id)
        all.push(event)
        added += 1
      }
    }
    // Short page, or a page that added nothing new (all shared the boundary
    // timestamp) — the walk is done.
    if (page.length < EXPORT_PAGE_SIZE || added === 0) {
      return all
    }
    before = page[page.length - 1].createdAt
  }
}
