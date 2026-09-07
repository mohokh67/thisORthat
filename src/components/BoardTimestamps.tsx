import type { ReactElement } from 'react'
import { relativeTime } from '../lib/relativeTime'

function absolute(iso: string): string {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString()
}

/**
 * Sub-title under the board title: when the board was created, and — when the
 * activity log has at least one entry — when it last saw activity. `updatedAt`
 * is the newest activity-log event's timestamp; omit it (or pass one at or
 * before `createdAt`) and only "Created" shows.
 */
export function BoardTimestamps({
  createdAt,
  updatedAt,
  now,
}: {
  createdAt: string
  updatedAt?: string | null
  now: number
}): ReactElement {
  return (
    <p className="board-timestamps">
      <span title={absolute(createdAt)}>Created {relativeTime(createdAt, now)}</span>
      {updatedAt != null && Date.parse(updatedAt) > Date.parse(createdAt) && (
        <span title={absolute(updatedAt)}>Updated {relativeTime(updatedAt, now)}</span>
      )}
    </p>
  )
}
