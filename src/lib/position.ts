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

/**
 * The position for an item inserted at `targetIndex` among `others` (the sorted
 * positions of the *other* items). Callers should reindex the list when
 * `isPrecisionExhausted` reports the flanking positions are too close.
 */
export function positionForIndex(others: number[], targetIndex: number): number {
  if (targetIndex <= 0) {
    return positionAtStart(others[0] ?? null)
  }
  if (targetIndex >= others.length) {
    return positionAtEnd(others[others.length - 1] ?? null)
  }
  return positionBetween(others[targetIndex - 1], others[targetIndex])
}

export type ReorderPlan =
  | null
  | { kind: 'move'; position: number }
  | { kind: 'reindex'; order: { id: string; position: number }[] }

/**
 * Decides how to move `itemId` to `targetIndex` within `sorted` (a
 * position-ascending list): a single fractional-position update, or — when the
 * flanking positions can no longer fit a value between them — fresh positions
 * for the whole reordered list. `null` when the move is a no-op.
 */
export function planReorder(
  sorted: readonly { id: string; position: number }[],
  itemId: string,
  targetIndex: number,
): ReorderPlan {
  const from = sorted.findIndex((item) => item.id === itemId)
  if (from === -1 || from === targetIndex) {
    return null
  }

  const others = sorted.filter((item) => item.id !== itemId)
  const clamped = Math.max(0, Math.min(targetIndex, others.length))
  const before = others[clamped - 1]?.position
  const after = others[clamped]?.position

  if (before !== undefined && after !== undefined && isPrecisionExhausted(before, after)) {
    const reordered = [...others]
    reordered.splice(clamped, 0, sorted[from])
    const positions = reindexed(reordered.length)
    return {
      kind: 'reindex',
      order: reordered.map((item, index) => ({ id: item.id, position: positions[index] })),
    }
  }

  return {
    kind: 'move',
    position: positionForIndex(
      others.map((item) => item.position),
      clamped,
    ),
  }
}
