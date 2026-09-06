import { describeEvent } from './activity'
import type { ActivityEvent } from './types'

/** The selectable type-filter buckets in the log drawer, in display order. */
export type LogCategory = 'notes' | 'columns' | 'votes' | 'board'

export const LOG_CATEGORIES: readonly LogCategory[] = ['notes', 'columns', 'votes', 'board']

const CATEGORY_BY_PREFIX: Record<string, LogCategory> = {
  note: 'notes',
  column: 'columns',
  vote: 'votes',
  board: 'board',
}

/** The filter category an event's `action` slug belongs to, or `null` if unknown. */
export function categoryOf(action: string): LogCategory | null {
  const prefix = action.split('.', 1)[0]
  return CATEGORY_BY_PREFIX[prefix] ?? null
}

export interface LogFilter {
  /** Selected categories; an empty set means "no type narrowing". */
  types: ReadonlySet<LogCategory>
  /** Free-text query over the actor name and the rendered entry detail. */
  query: string
}

/**
 * Narrows a newest-first event list by type and free-text query. An empty
 * `types` set or blank `query` simply doesn't narrow on that axis. The query is
 * matched case-insensitively against the actor's name and the entry's
 * plain-language sentence (which already folds in the `detail` text).
 */
export function filterEvents(events: readonly ActivityEvent[], filter: LogFilter): ActivityEvent[] {
  const query = filter.query.trim().toLowerCase()
  return events.filter((event) => {
    if (filter.types.size > 0) {
      const category = categoryOf(event.action)
      if (!category || !filter.types.has(category)) {
        return false
      }
    }
    if (query) {
      const haystack = `${event.actorName} ${describeEvent(event)}`.toLowerCase()
      if (!haystack.includes(query)) {
        return false
      }
    }
    return true
  })
}
