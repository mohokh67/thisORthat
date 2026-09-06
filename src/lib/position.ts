export const POSITION_GAP = 1

/** Position for a new item placed before every existing one (or the first item). */
export function positionAtStart(firstPosition: number | null): number {
  return firstPosition === null ? 0 : firstPosition - POSITION_GAP
}

/** Position for a new item placed after every existing one (or the first item). */
export function positionAtEnd(lastPosition: number | null): number {
  return lastPosition === null ? 0 : lastPosition + POSITION_GAP
}

/** Position for a new item dropped between two neighbours. */
export function positionBetween(before: number, after: number): number {
  return (before + after) / 2
}

/**
 * True when `positionBetween` can no longer produce a value strictly between the
 * neighbours (floating-point gap exhausted) and the column must be reindexed.
 */
export function isPrecisionExhausted(before: number, after: number): boolean {
  const mid = positionBetween(before, after)
  return mid <= before || mid >= after
}

/** Fresh, evenly-spaced positions for a column of `count` items, in order. */
export function reindexed(count: number): number[] {
  return Array.from({ length: count }, (_, index) => index * POSITION_GAP)
}
