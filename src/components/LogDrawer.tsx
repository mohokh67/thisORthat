import { useEffect, useMemo, useState, type ReactElement } from 'react'
import { describeEvent } from '../lib/activity'
import { filterEvents, LOG_CATEGORIES, type LogCategory } from '../lib/logFilter'
import { relativeTime } from '../lib/relativeTime'
import type { ActivityEvent } from '../lib/types'

const TICK_MS = 60_000

const CATEGORY_LABELS: Record<LogCategory, string> = {
  notes: 'Notes',
  columns: 'Columns',
  votes: 'Votes',
  board: 'Board',
}

interface LogDrawerProps {
  events: ActivityEvent[]
  open: boolean
  onClose: () => void
  hasMore: boolean
  loadingMore: boolean
  onLoadMore: () => void
  onExportCsv: () => void
}

/** Right-side, read-only Activity log: newest first, live while open, with a
 *  type filter, free-text search, and paged loading of older entries. */
export function LogDrawer({
  events,
  open,
  onClose,
  hasMore,
  loadingMore,
  onLoadMore,
  onExportCsv,
}: LogDrawerProps): ReactElement | null {
  const [now, setNow] = useState(() => Date.now())
  const [types, setTypes] = useState<Set<LogCategory>>(() => new Set())
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!open) {
      return
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    // Keep the relative timestamps fresh while the drawer sits open.
    setNow(Date.now())
    const tick = window.setInterval(() => setNow(Date.now()), TICK_MS)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.clearInterval(tick)
    }
  }, [open, onClose])

  const visible = useMemo(
    () => filterEvents(events, { types, query }),
    [events, types, query],
  )

  if (!open) {
    return null
  }

  const toggleType = (category: LogCategory) => {
    setTypes((current) => {
      const next = new Set(current)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }

  const filtering = types.size > 0 || query.trim() !== ''

  let entries: ReactElement
  if (events.length === 0) {
    entries = <p className="log-empty">Nothing has happened yet.</p>
  } else if (visible.length === 0) {
    entries = <p className="log-empty">No entries match your filter.</p>
  } else {
    entries = (
      <ol className="log-list">
        {visible.map((event) => (
          <li key={event.id} className="log-entry">
            <span className="log-text">{describeEvent(event)}</span>
            <time
              className="log-time"
              dateTime={event.createdAt}
              title={new Date(event.createdAt).toLocaleString()}
            >
              {relativeTime(event.createdAt, now)}
            </time>
          </li>
        ))}
      </ol>
    )
  }

  return (
    <>
      <div className="drawer-scrim" onClick={onClose} />
      <aside className="log-drawer" aria-label="Activity log">
        <header className="log-drawer-header">
          <h2>Activity log</h2>
          <button
            type="button"
            className="column-tool"
            aria-label="Close activity log"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <div className="log-filter">
          <div className="log-chips" role="group" aria-label="Filter by type">
            {LOG_CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                className="log-chip"
                aria-pressed={types.has(category)}
                onClick={() => toggleType(category)}
              >
                {CATEGORY_LABELS[category]}
              </button>
            ))}
          </div>
          <input
            type="text"
            className="log-search"
            placeholder="Search actor or detail"
            aria-label="Search the activity log"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        {entries}

        <footer className="log-drawer-footer">
          {hasMore && (
            <button
              type="button"
              className="log-loadmore"
              onClick={onLoadMore}
              disabled={loadingMore}
            >
              {loadingMore ? 'Loading…' : 'Load more'}
            </button>
          )}
          {filtering && hasMore && (
            <span className="log-hint">Filters apply to loaded entries only.</span>
          )}
          <button
            type="button"
            className="log-export"
            onClick={onExportCsv}
            disabled={events.length === 0}
          >
            Export log as CSV
          </button>
        </footer>
      </aside>
    </>
  )
}
