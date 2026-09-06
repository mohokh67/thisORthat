import { SORT_LENSES, type SortLens } from './types'

/** Per-column Sort lens choices for one board, keyed by column id. `custom` is
 *  never stored — its absence is the default. */
export type StoredLenses = Record<string, SortLens>

const KEY_PREFIX = 'thisorthat.sortlens.'

function keyFor(boardId: string): string {
  return `${KEY_PREFIX}${boardId}`
}

function isLens(value: unknown): value is SortLens {
  return typeof value === 'string' && (SORT_LENSES as readonly string[]).includes(value)
}

/** Parses a stored lens map, discarding anything unrecognised or defaulted. */
export function parseStoredLenses(raw: string | null): StoredLenses {
  if (!raw) {
    return {}
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return {}
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return {}
  }
  const result: StoredLenses = {}
  for (const [columnId, value] of Object.entries(parsed)) {
    if (isLens(value) && value !== 'custom') {
      result[columnId] = value
    }
  }
  return result
}

/**
 * The lens map after one column's choice: `custom` clears the entry (its absence
 * is the default), anything else sets it. Returns a new object; `current` is
 * left untouched.
 */
export function applyLensChoice(
  current: StoredLenses,
  columnId: string,
  lens: SortLens,
): StoredLenses {
  const next = { ...current }
  if (lens === 'custom') {
    delete next[columnId]
  } else {
    next[columnId] = lens
  }
  return next
}

/** Reads this device's saved lens choices for a board. Never throws. */
export function loadLenses(boardId: string): StoredLenses {
  try {
    return parseStoredLenses(localStorage.getItem(keyFor(boardId)))
  } catch {
    return {}
  }
}

/**
 * Records one column's lens choice and returns the updated map. Persistence is
 * best-effort — a private-mode failure just means the choice will not survive a
 * reload.
 */
export function saveLens(boardId: string, columnId: string, lens: SortLens): StoredLenses {
  const next = applyLensChoice(loadLenses(boardId), columnId, lens)
  try {
    localStorage.setItem(keyFor(boardId), JSON.stringify(next))
  } catch {
    // Storage disabled: the returned map still drives this session.
  }
  return next
}
