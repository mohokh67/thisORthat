import { describe, expect, it } from 'vitest'
import { categoryOf, filterEvents, LOG_CATEGORIES } from './logFilter'
import type { ActivityEvent } from './types'

function event(overrides: Partial<ActivityEvent>): ActivityEvent {
  return {
    id: crypto.randomUUID(),
    boardId: 'b1',
    actorId: 'a1',
    actorName: 'Ada',
    action: 'note.created',
    targetType: 'note',
    targetId: 'n1',
    detail: { text: 'ship the thing', column: 'To do' },
    createdAt: '2026-09-07T10:00:00.000Z',
    ...overrides,
  }
}

describe('categoryOf', () => {
  it('maps an action slug to its plural category', () => {
    expect(categoryOf('note.created')).toBe('notes')
    expect(categoryOf('column.recoloured')).toBe('columns')
    expect(categoryOf('vote.cast')).toBe('votes')
    expect(categoryOf('board.renamed')).toBe('board')
  })

  it('returns null for an unknown action', () => {
    expect(categoryOf('mystery.happened')).toBeNull()
  })
})

describe('LOG_CATEGORIES', () => {
  it('is the four selectable filter categories', () => {
    expect(LOG_CATEGORIES).toEqual(['notes', 'columns', 'votes', 'board'])
  })
})

describe('filterEvents', () => {
  const events = [
    event({ action: 'note.created', actorName: 'Ada', detail: { text: 'ship it', column: 'To do' } }),
    event({ action: 'column.added', actorName: 'Grace', detail: { title: 'Done' } }),
    event({ action: 'vote.cast', actorName: 'Ada', detail: { text: 'ship it', direction: 'up' } }),
    event({ action: 'board.renamed', actorName: 'Lin', detail: { from: 'Old', to: 'Q3 retro' } }),
  ]

  it('returns every event when no types and no query are given', () => {
    expect(filterEvents(events, { types: new Set(), query: '' })).toEqual(events)
  })

  it('keeps only events in the selected categories', () => {
    const result = filterEvents(events, { types: new Set(['notes', 'votes']), query: '' })
    expect(result.map((e) => e.action)).toEqual(['note.created', 'vote.cast'])
  })

  it('matches the query against the actor name, case-insensitively', () => {
    const result = filterEvents(events, { types: new Set(), query: 'grace' })
    expect(result.map((e) => e.action)).toEqual(['column.added'])
  })

  it('matches the query against the rendered entry detail', () => {
    const result = filterEvents(events, { types: new Set(), query: 'Q3 retro' })
    expect(result.map((e) => e.action)).toEqual(['board.renamed'])
  })

  it('applies type and query filters together', () => {
    const result = filterEvents(events, { types: new Set(['notes']), query: 'ship' })
    expect(result.map((e) => e.action)).toEqual(['note.created'])
  })

  it('ignores surrounding whitespace in the query', () => {
    expect(filterEvents(events, { types: new Set(), query: '   ' })).toEqual(events)
  })
})
