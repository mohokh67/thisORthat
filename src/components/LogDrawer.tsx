import { useEffect, type ReactElement } from 'react'
import { describeEvent } from '../lib/activity'
import { relativeTime } from '../lib/relativeTime'
import type { ActivityEvent } from '../lib/types'

interface LogDrawerProps {
  events: ActivityEvent[]
  open: boolean
  onClose: () => void
}

/** Right-side, read-only Activity log. Newest first; updates live while open. */
export function LogDrawer({ events, open, onClose }: LogDrawerProps): ReactElement | null {
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
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) {
    return null
  }

  const now = Date.now()

  return (
    <>
      <div className="drawer-scrim" onClick={onClose} />
      <aside className="log-drawer" aria-label="Activity log">
        <header className="log-drawer-header">
          <h2>Activity</h2>
          <button
            type="button"
            className="column-tool"
            aria-label="Close activity log"
            onClick={onClose}
          >
            ×
          </button>
        </header>
        {events.length === 0 ? (
          <p className="log-empty">Nothing has happened yet.</p>
        ) : (
          <ol className="log-list">
            {events.map((event) => (
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
        )}
      </aside>
    </>
  )
}
