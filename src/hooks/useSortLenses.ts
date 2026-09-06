import { useCallback, useEffect, useMemo, useState } from 'react'
import { loadLenses, saveLens } from '../lib/sortLensStore'
import type { SortLens } from '../lib/types'

export interface SortLenses {
  /** The lens for a column — `custom` when the Participant has chosen nothing. */
  lensFor: (columnId: string) => SortLens
  /** Sets (or, for `custom`, clears) a column's lens and persists it to this device. */
  setLens: (columnId: string, lens: SortLens) => void
}

/**
 * This device's per-column Sort lens choices for one board, backed by
 * `localStorage` so they survive a reload. Non-Custom lenses are a purely local
 * view concern — nothing here touches board data or other Participants.
 */
export function useSortLenses(boardId: string): SortLenses {
  const [lenses, setLenses] = useState(() => loadLenses(boardId))

  useEffect(() => {
    setLenses(loadLenses(boardId))
  }, [boardId])

  const lensFor = useCallback(
    (columnId: string): SortLens => lenses[columnId] ?? 'custom',
    [lenses],
  )

  const setLens = useCallback(
    (columnId: string, lens: SortLens) => {
      setLenses(saveLens(boardId, columnId, lens))
    },
    [boardId],
  )

  return useMemo(() => ({ lensFor, setLens }), [lensFor, setLens])
}
