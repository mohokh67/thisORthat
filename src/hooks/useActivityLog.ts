import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchRecentEvents } from '../lib/events'
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
}

/**
 * One board's Activity log: the recent history fetched on load, live-appended
 * from Realtime, plus an unseen count (other people's events since this device
 * last looked) that drives the header dot and persists across reloads.
 */
export function useActivityLog(boardId: string, identity: Identity | null): ActivityLog {
  const [events, setEvents] = useState<ActivityEvent[]>([])
  const [lastSeen, setLastSeen] = useState(() => loadLastSeen(boardId))

  useEffect(() => {
    let active = true
    setEvents([])
    setLastSeen(loadLastSeen(boardId))

    const refresh = () => {
      fetchRecentEvents(boardId)
        .then((rows) => {
          if (active) {
            setEvents(rows)
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

  return useMemo(() => ({ events, unseenCount, markSeen }), [events, unseenCount, markSeen])
}
