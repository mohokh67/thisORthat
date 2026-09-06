import { describe, expect, it } from 'vitest'
import { boardToJson, boardToMarkdown, eventsToCsv, exportFilename } from './exportBoard'
import type { ActivityEvent, Board, Column, Note, Vote } from './types'

describe('boardToMarkdown', () => {
  const base = {
    title: 'Q3 Retro',
    sections: [
      {
        title: 'Went well',
        notes: [
          { text: 'shipped export', points: 3, priority: 'high' as const, author: 'Ada' },
          { text: 'calm week', points: 0, priority: 'none' as const, author: 'Lin' },
        ],
      },
      { title: 'To improve', notes: [] },
    ],
  }

  it('renders the board title as a top-level heading', () => {
    expect(boardToMarkdown(base)).toMatch(/^# Q3 Retro\n/)
  })

  it('renders each column as a second-level heading in the given order', () => {
    const md = boardToMarkdown(base)
    expect(md.indexOf('## Went well')).toBeLessThan(md.indexOf('## To improve'))
  })

  it('annotates a note bullet with points and author, and priority only when set', () => {
    const md = boardToMarkdown(base)
    expect(md).toContain('- shipped export (3 points, priority: high, Ada)')
    expect(md).toContain('- calm week (0 points, Lin)')
  })

  it('pluralises the points count', () => {
    const md = boardToMarkdown({
      title: 'B',
      sections: [{ title: 'C', notes: [{ text: 'x', points: 1, priority: 'none', author: 'A' }] }],
    })
    expect(md).toContain('- x (1 point, A)')
  })

  it('collapses whitespace in note text onto one line', () => {
    const md = boardToMarkdown({
      title: 'B',
      sections: [
        { title: 'C', notes: [{ text: 'line one\n\nline  two', points: 0, priority: 'none', author: 'A' }] },
      ],
    })
    expect(md).toContain('- line one line two (0 points, A)')
  })

  it('marks an empty column instead of leaving a bare heading', () => {
    expect(boardToMarkdown(base)).toContain('## To improve\n\n_No notes._')
  })

  it('never includes activity events', () => {
    expect(boardToMarkdown(base)).not.toMatch(/renamed|added a note|event/i)
  })
})

describe('boardToJson', () => {
  const board = { id: 'b1', title: 'B', template: 'blank', createdAt: 't' } as Board
  const columns = [{ id: 'c1' }] as Column[]
  const notes = [{ id: 'n1' }] as Note[]
  const votes = [{ id: 'v1' }] as Vote[]
  const events = [{ id: 'e1' }] as ActivityEvent[]

  it('includes board metadata, columns, notes, votes, and the full events array', () => {
    expect(boardToJson({ board, columns, notes, votes, events })).toEqual({
      board,
      columns,
      notes,
      votes,
      events,
    })
  })
})

describe('eventsToCsv', () => {
  function event(overrides: Partial<ActivityEvent>): ActivityEvent {
    return {
      id: 'e1',
      boardId: 'b1',
      actorId: 'a1',
      actorName: 'Ada',
      action: 'note.created',
      targetType: 'note',
      targetId: 'n1',
      detail: { text: 'ship it', column: 'To do' },
      createdAt: '2026-09-07T10:00:00.000Z',
      ...overrides,
    }
  }

  it('starts with a header row', () => {
    expect(eventsToCsv([]).trim()).toBe('Timestamp,Actor,Action,Detail')
  })

  it('writes one row per event with the rendered detail sentence', () => {
    const csv = eventsToCsv([event({})])
    expect(csv.split('\n')[1]).toBe(
      '2026-09-07T10:00:00.000Z,Ada,note.created,"Ada added a note to ""To do"": ""ship it"""',
    )
  })

  it('quotes and escapes fields containing commas, quotes, or newlines', () => {
    const csv = eventsToCsv([event({ actorName: 'Smith, Jr. "The Boss"' })])
    expect(csv.split('\n')[1]).toContain('"Smith, Jr. ""The Boss"""')
  })

  it('neutralises a cell that a spreadsheet would parse as a formula', () => {
    const csv = eventsToCsv([event({ actorName: '=HYPERLINK("http://evil.example")' })])
    expect(csv.split('\n')[1]).toContain('"\'=HYPERLINK(""http://evil.example"")"')
  })

  it('neutralises the +, -, @, and tab formula lead-ins too', () => {
    for (const lead of ['+1', '-1+2', '@SUM(A1)', '\tcmd']) {
      const csv = eventsToCsv([event({ actorName: lead })])
      expect(csv.split('\n')[1].split(',')[1].replace(/^"|"$/g, '')).toBe(`'${lead}`)
    }
  })
})

describe('exportFilename', () => {
  it('slugifies the board title and appends the date and extension', () => {
    expect(exportFilename('Q3 Retro!', new Date('2026-09-07T12:00:00Z'), 'md')).toBe(
      'q3-retro-2026-09-07.md',
    )
  })

  it('falls back to "board" when the title has no usable characters', () => {
    expect(exportFilename('   ', new Date('2026-09-07T12:00:00Z'), 'json')).toBe(
      'board-2026-09-07.json',
    )
  })
})
