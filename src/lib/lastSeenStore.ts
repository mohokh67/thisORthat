/**
 * When this device last looked at a board's Activity log, as epoch milliseconds,
 * kept per board in `localStorage` so the "new activity" dot survives a reload.
 */
const KEY_PREFIX = 'thisorthat.log-seen.'

function keyFor(boardId: string): string {
  return `${KEY_PREFIX}${boardId}`
}

/** Parses a stored last-seen value; 0 (the epoch) for anything missing or bad. */
export function parseLastSeen(raw: string | null): number {
  if (raw === null || raw.trim() === '') {
    return 0
  }
  const value = Number(raw)
  return Number.isFinite(value) && value > 0 ? value : 0
}

/** Reads this device's last-seen time for a board. Never throws. */
export function loadLastSeen(boardId: string): number {
  try {
    return parseLastSeen(localStorage.getItem(keyFor(boardId)))
  } catch {
    return 0
  }
}

/** Records that this device has now seen the board's log up to `at`. */
export function saveLastSeen(boardId: string, at: number): void {
  try {
    localStorage.setItem(keyFor(boardId), String(at))
  } catch {
    // Storage disabled: the dot just won't persist across reloads.
  }
}
