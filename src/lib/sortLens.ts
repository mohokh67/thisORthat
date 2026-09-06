import type { Note, Priority, SortLens } from './types'

/** Priority rank for the `priority` lens: higher sorts first, `none` sorts last. */
const PRIORITY_RANK: Record<Priority, number> = {
  high: 3,
  medium: 2,
  low: 1,
  none: 0,
}

/** Ascending comparator on `position` — the universal tie-break and the
 *  `custom` lens itself, so ties always fall back to the shared manual order. */
function byPosition(a: Note, b: Note): number {
  return a.position - b.position
}

/**
 * Orders one Column's notes for a Sort lens without touching stored `position`.
 * `custom` is the shared manual order (`position` ascending); every other lens
 * sorts by its own key and breaks ties on `position` ascending, so equal-keyed
 * notes keep a stable, everyone-sees-the-same arrangement. `points` reads
 * `pointsByNoteId` (a missing entry counts as zero). Pure: the input array is
 * not mutated.
 */
export function orderNotes(
  notes: readonly Note[],
  lens: SortLens,
  pointsByNoteId: ReadonlyMap<string, number>,
): Note[] {
  const sorted = [...notes]
  switch (lens) {
    case 'custom':
      return sorted.sort(byPosition)
    case 'points':
      return sorted.sort(
        (a, b) =>
          (pointsByNoteId.get(b.id) ?? 0) - (pointsByNoteId.get(a.id) ?? 0) ||
          byPosition(a, b),
      )
    case 'priority':
      return sorted.sort(
        (a, b) => PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority] || byPosition(a, b),
      )
    case 'newest':
      return sorted.sort(
        (a, b) => b.createdAt.localeCompare(a.createdAt) || byPosition(a, b),
      )
    case 'oldest':
      return sorted.sort(
        (a, b) => a.createdAt.localeCompare(b.createdAt) || byPosition(a, b),
      )
  }
}
