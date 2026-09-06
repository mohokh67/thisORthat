import { describe, expect, it } from 'vitest'
import { toChangeEvent, toConnectionStatus, type RawPayload } from './realtimeEvents'

function payload(over: Partial<RawPayload>): RawPayload {
  return { eventType: 'INSERT', new: {}, old: {}, ...over }
}

const noteRow = {
  id: 'n1',
  board_id: 'b1',
  column_id: 'c1',
  text: 'hi',
  priority: 'none',
  author_id: 'a1',
  author_name: 'Sam',
  position: 0,
  created_at: '2026-01-01T00:00:00Z',
}

describe('toChangeEvent', () => {
  it('maps a note INSERT to an upsert with the domain shape', () => {
    expect(toChangeEvent('notes', payload({ eventType: 'INSERT', new: noteRow }))).toEqual({
      table: 'notes',
      type: 'upsert',
      row: expect.objectContaining({ id: 'n1', columnId: 'c1', text: 'hi', priority: 'none' }),
    })
  })

  it('maps a note UPDATE to an upsert too', () => {
    expect(
      toChangeEvent('notes', payload({ eventType: 'UPDATE', new: { ...noteRow, text: 'edited' } })),
    ).toMatchObject({ table: 'notes', type: 'upsert', row: { text: 'edited' } })
  })

  it('maps a note DELETE with an id to a delete event', () => {
    expect(toChangeEvent('notes', payload({ eventType: 'DELETE', old: { id: 'n1' } }))).toEqual({
      table: 'notes',
      type: 'delete',
      id: 'n1',
    })
  })

  it('returns null for a DELETE whose payload has no id', () => {
    expect(toChangeEvent('notes', payload({ eventType: 'DELETE', old: {} }))).toBeNull()
  })

  it('maps a column DELETE to a column delete event', () => {
    expect(toChangeEvent('columns', payload({ eventType: 'DELETE', old: { id: 'c9' } }))).toEqual({
      table: 'columns',
      type: 'delete',
      id: 'c9',
    })
  })

  it('maps a board UPDATE to a board upsert', () => {
    expect(
      toChangeEvent(
        'boards',
        payload({
          eventType: 'UPDATE',
          new: { id: 'b1', title: 'Renamed', template: 'blank', created_at: '2026-01-01T00:00:00Z' },
        }),
      ),
    ).toMatchObject({ table: 'board', type: 'upsert', row: { title: 'Renamed' } })
  })

  it('returns null for a board DELETE', () => {
    expect(toChangeEvent('boards', payload({ eventType: 'DELETE', old: { id: 'b1' } }))).toBeNull()
  })
})

describe('toConnectionStatus', () => {
  it('maps SUBSCRIBED to live', () => {
    expect(toConnectionStatus('SUBSCRIBED')).toBe('live')
  })

  it('maps error/timeout/closed to reconnecting', () => {
    expect(toConnectionStatus('CHANNEL_ERROR')).toBe('reconnecting')
    expect(toConnectionStatus('TIMED_OUT')).toBe('reconnecting')
    expect(toConnectionStatus('CLOSED')).toBe('reconnecting')
  })

  it('returns null for statuses that should not change the UI', () => {
    expect(toConnectionStatus('JOINING')).toBeNull()
  })
})
