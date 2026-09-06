/**
 * The per-device "recent boards" list shown on the landing page: boards opened
 * from this browser, newest first. A personal convenience only — never shared,
 * never a directory (CONTEXT.md). Kept in `localStorage` as a JSON array.
 */
const KEY = 'thisorthat.recent-boards'

/** How many boards the list keeps before dropping the least recently opened. */
export const RECENT_LIMIT = 12

export interface RecentBoard {
  id: string
  title: string
  /** Epoch milliseconds this device last opened the board. */
  lastOpened: number
}

/** The largest epoch-ms a `Date` can represent (ECMA-262). */
const MAX_TIME = 8.64e15

function isRecentBoard(value: unknown): value is RecentBoard {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const entry = value as Record<string, unknown>
  return (
    typeof entry.id === 'string' &&
    typeof entry.title === 'string' &&
    typeof entry.lastOpened === 'number' &&
    entry.lastOpened >= 0 &&
    entry.lastOpened <= MAX_TIME
  )
}

/** Parses a stored list, discarding malformed entries and sorting newest-first. */
export function parseRecent(raw: string | null): RecentBoard[] {
  if (!raw) {
    return []
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return []
  }
  if (!Array.isArray(parsed)) {
    return []
  }
  return parsed.filter(isRecentBoard).sort((a, b) => b.lastOpened - a.lastOpened)
}

/**
 * Records that `entry` was just opened at `now`: moves it (or adds it) to the
 * front with a fresh title and time, then caps the list at `RECENT_LIMIT`.
 * Pure — returns a new array.
 */
export function recordOpen(
  list: readonly RecentBoard[],
  entry: { id: string; title: string },
  now: number,
): RecentBoard[] {
  const rest = list.filter((board) => board.id !== entry.id)
  return [{ id: entry.id, title: entry.title, lastOpened: now }, ...rest]
    .sort((a, b) => b.lastOpened - a.lastOpened)
    .slice(0, RECENT_LIMIT)
}

/** Reads this device's recent-boards list. Never throws. */
export function loadRecentBoards(): RecentBoard[] {
  try {
    return parseRecent(localStorage.getItem(KEY))
  } catch {
    return []
  }
}

/** Records a board open and persists the updated list. Never throws. */
export function touchRecentBoard(entry: { id: string; title: string }, now = Date.now()): void {
  try {
    const next = recordOpen(parseRecent(localStorage.getItem(KEY)), entry, now)
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // Storage disabled: the list just won't persist.
  }
}
