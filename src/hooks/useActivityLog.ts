import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { EVENT_PAGE_SIZE, fetchEventsBefore, fetchRecentEvents } from '../lib/events'
import { loadLastSeen, saveLastSeen } from '../lib/lastSeenStore'
import { subscribeToEvents } from '../lib/realtime'
import type { Identity } from '../lib/identity'
import type { ActivityEvent } from '../lib/types'

export interface ActivityLog {
  /** Newest first. */
  events: ActivityEvent[]
  /** Events from other participants since this device last opened the drawer. */
  unseenCount: number
  /** Marks the log seen as of now (call when the drawer is open). */
  markSeen: () => void
  /** Whether an older page may still exist to load. */
  hasMore: boolean
  /** Whether a "load more" fetch is in flight. */
  loadingMore: boolean
  /** Fetches the next page of older entries and appends them. */
  loadMore: () => void
}

/**
 * One board's Activity log: the first page fetched on load, live-appended from
 * Realtime, older pages pulled in on demand, plus an unseen count (other
 * people's events since this device last looked) that drives the header dot and
 * persists across reloads.
 */
export function useActivityLog(boardId: string, identity: Identity | null): ActivityLog {
  const [events, setEvents] = useState<ActivityEvent[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [lastSeen, setLastSeen] = useState(() => loadLastSeen(boardId))

  // Read by loadMore without making it a dependency of the mount effect.
  const eventsRef = useRef<ActivityEvent[]>([])
  eventsRef.current = events

  useEffect(() => {
    let active = true
    setEvents([])
    setHasMore(false)
    setLoadingMore(false)
    setLastSeen(loadLastSeen(boardId))

    const refresh = () => {
      fetchRecentEvents(boardId, EVENT_PAGE_SIZE)
        .then((rows) => {
          if (active) {
            setEvents(rows)
            setHasMore(rows.length === EVENT_PAGE_SIZE)
          }
        })
        .catch(console.error)
    }
    refresh()

    const unsubscribe = subscribeToEvents(boardId, {
      onInsert: (event) => {
        setEvents((current) =>
          current.some((existing) => existing.id === event.id) ? current : [event, ...current],
        )
      },
      // Postgres Changes has no replay: on every (re)connect, refetch to pick up
      // anything inserted while the channel was down.
      onStatus: (status) => {
        if (status === 'live') {
          refresh()
        }
      },
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [boardId])

  const loadMore = useCallback(() => {
    const oldest = eventsRef.current[eventsRef.current.length - 1]
    if (!oldest) {
      return
    }
    setLoadingMore(true)
    fetchEventsBefore(boardId, oldest.createdAt, EVENT_PAGE_SIZE)
      .then((rows) => {
        setEvents((current) => {
          const seen = new Set(current.map((event) => event.id))
          return [...current, ...rows.filter((event) => !seen.has(event.id))]
        })
        setHasMore(rows.length === EVENT_PAGE_SIZE)
      })
      .catch(console.error)
      .finally(() => setLoadingMore(false))
  }, [boardId])

  const unseenCount = useMemo(() => {
    if (!identity) {
      return 0
    }
    return events.filter(
      (event) => event.actorId !== identity.id && Date.parse(event.createdAt) > lastSeen,
    ).length
  }, [events, lastSeen, identity])

  const markSeen = useCallback(() => {
    const now = Date.now()
    setLastSeen(now)
    saveLastSeen(boardId, now)
  }, [boardId])

  return useMemo(
    () => ({ events, unseenCount, markSeen, hasMore, loadingMore, loadMore }),
    [events, unseenCount, markSeen, hasMore, loadingMore, loadMore],
  )
}
