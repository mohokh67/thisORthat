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

export type InsertPlan =
  | { kind: 'move'; position: number }
  | { kind: 'reindex'; order: { id: string; position: number }[] }

export type ReorderPlan = null | InsertPlan

/**
 * Decides how to place `itemId` at `targetIndex` among `others` (a
 * position-ascending list that does NOT contain the item): a single fractional
 * position, or — when the flanking positions can no longer fit a value between
 * them — fresh positions for the whole column with the item spliced in. Used
 * both for reordering within a column and for dropping a note in from another.
 */
export function planInsert(
  others: readonly { id: string; position: number }[],
  itemId: string,
  targetIndex: number,
): InsertPlan {
  const clamped = Math.max(0, Math.min(targetIndex, others.length))
  const before = others[clamped - 1]?.position
  const after = others[clamped]?.position

  if (before !== undefined && after !== undefined && isPrecisionExhausted(before, after)) {
    const ids = others.map((item) => item.id)
    ids.splice(clamped, 0, itemId)
    const positions = reindexed(ids.length)
    return {
      kind: 'reindex',
      order: ids.map((id, index) => ({ id, position: positions[index] })),
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
  return planInsert(
    sorted.filter((item) => item.id !== itemId),
    itemId,
    targetIndex,
  )
}
