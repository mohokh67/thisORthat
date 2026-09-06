import { describe, expect, it } from 'vitest'
import { buildEvent, describeEvent, snippet, type ActivityInput } from './activity'

describe('snippet', () => {
  it('collapses whitespace and trims', () => {
    expect(snippet('  a\n\n  b\tc  ')).toBe('a b c')
  })

  it('leaves short text intact', () => {
    expect(snippet('short enough')).toBe('short enough')
  })

  it('truncates long text with an ellipsis, to at most 80 chars', () => {
    const out = snippet('x'.repeat(200))
    expect(out.length).toBe(80)
    expect(out.endsWith('…')).toBe(true)
  })
})

describe('buildEvent', () => {
  const cases: Array<{ input: ActivityInput; action: string; targetType: string; targetId: string; detail: Record<string, unknown> }> = [
    {
      input: { kind: 'board-renamed', boardId: 'b1', from: 'Old', to: 'New' },
      action: 'board.renamed', targetType: 'board', targetId: 'b1',
      detail: { from: 'Old', to: 'New' },
    },
    {
      input: { kind: 'column-added', columnId: 'c1', title: 'New column' },
      action: 'column.added', targetType: 'column', targetId: 'c1',
      detail: { title: 'New column' },
    },
    {
      input: { kind: 'column-renamed', columnId: 'c1', from: 'A', to: 'B' },
      action: 'column.renamed', targetType: 'column', targetId: 'c1',
      detail: { from: 'A', to: 'B' },
    },
    {
      input: { kind: 'column-recoloured', columnId: 'c1', title: 'A', to: 'green' },
      action: 'column.recoloured', targetType: 'column', targetId: 'c1',
      detail: { title: 'A', color: 'green' },
    },
    {
      input: { kind: 'column-recoloured', columnId: 'c1', title: 'A', to: null },
      action: 'column.recoloured', targetType: 'column', targetId: 'c1',
      detail: { title: 'A', color: null },
    },
    {
      input: { kind: 'column-reordered', columnId: 'c1', title: 'A' },
      action: 'column.reordered', targetType: 'column', targetId: 'c1',
      detail: { title: 'A' },
    },
    {
      input: { kind: 'column-deleted', columnId: 'c1', title: 'A', noteCount: 3 },
      action: 'column.deleted', targetType: 'column', targetId: 'c1',
      detail: { title: 'A', noteCount: 3 },
    },
    {
      input: { kind: 'note-created', noteId: 'n1', text: '  hello  world ', columnTitle: 'Ideas' },
      action: 'note.created', targetType: 'note', targetId: 'n1',
      detail: { text: 'hello world', column: 'Ideas' },
    },
    {
      input: { kind: 'note-edited', noteId: 'n1', text: 'revised text' },
      action: 'note.edited', targetType: 'note', targetId: 'n1',
      detail: { text: 'revised text' },
    },
    {
      input: { kind: 'note-moved', noteId: 'n1', text: 'moved me', fromColumn: 'Ideas', toColumn: 'Done' },
      action: 'note.moved', targetType: 'note', targetId: 'n1',
      detail: { text: 'moved me', from: 'Ideas', to: 'Done' },
    },
    {
      input: { kind: 'note-reprioritised', noteId: 'n1', text: 'important', from: 'none', to: 'high' },
      action: 'note.reprioritised', targetType: 'note', targetId: 'n1',
      detail: { text: 'important', from: 'none', to: 'high' },
    },
    {
      input: { kind: 'note-deleted', noteId: 'n1', text: 'bye', columnTitle: 'Ideas' },
      action: 'note.deleted', targetType: 'note', targetId: 'n1',
      detail: { text: 'bye', column: 'Ideas' },
    },
    {
      input: { kind: 'vote-cast', noteId: 'n1', text: 'agree', direction: 'up' },
      action: 'vote.cast', targetType: 'note', targetId: 'n1',
      detail: { text: 'agree', direction: 'up' },
    },
    {
      input: { kind: 'vote-changed', noteId: 'n1', text: 'hmm', direction: 'down' },
      action: 'vote.changed', targetType: 'note', targetId: 'n1',
      detail: { text: 'hmm', direction: 'down' },
    },
    {
      input: { kind: 'vote-cleared', noteId: 'n1', text: 'never mind' },
      action: 'vote.cleared', targetType: 'note', targetId: 'n1',
      detail: { text: 'never mind' },
    },
  ]

  for (const { input, action, targetType, targetId, detail } of cases) {
    it(`builds ${action}`, () => {
      expect(buildEvent(input)).toEqual({ action, targetType, targetId, detail })
    })
  }

  it('snippets long note text in every note detail', () => {
    const long = 'y'.repeat(300)
    for (const kind of ['note-created', 'note-edited', 'note-moved', 'note-reprioritised', 'note-deleted', 'vote-cast', 'vote-changed', 'vote-cleared'] as const) {
      const base = { noteId: 'n1', text: long }
      const input = {
        'note-created': { ...base, kind, columnTitle: 'C' },
        'note-edited': { ...base, kind },
        'note-moved': { ...base, kind, fromColumn: 'A', toColumn: 'B' },
        'note-reprioritised': { ...base, kind, from: 'none', to: 'low' },
        'note-deleted': { ...base, kind, columnTitle: 'C' },
        'vote-cast': { ...base, kind, direction: 'up' },
        'vote-changed': { ...base, kind, direction: 'up' },
        'vote-cleared': { ...base, kind },
      }[kind] as ActivityInput
      expect(String(buildEvent(input).detail.text).length).toBe(80)
    }
  })

  it('produces a self-contained detail (only primitives or null) for every kind', () => {
    for (const { input } of cases) {
      for (const value of Object.values(buildEvent(input).detail)) {
        expect(['string', 'number', 'boolean', 'object']).toContain(typeof value)
        if (typeof value === 'object') {
          expect(value).toBeNull()
        }
      }
    }
  })
})

describe('describeEvent', () => {
  const sentence = (action: string, detail: Record<string, unknown>) =>
    describeEvent({ actorName: 'Alex', action, detail })

  it('renders each action as a plain-language sentence naming the actor', () => {
    expect(sentence('board.renamed', { from: 'Old', to: 'New' })).toBe(
      'Alex renamed the board from "Old" to "New"',
    )
    expect(sentence('column.added', { title: 'Ideas' })).toBe('Alex added column "Ideas"')
    expect(sentence('column.renamed', { from: 'A', to: 'B' })).toBe('Alex renamed column "A" to "B"')
    expect(sentence('column.recoloured', { title: 'A', color: 'green' })).toBe(
      'Alex recoloured column "A" green',
    )
    expect(sentence('column.recoloured', { title: 'A', color: null })).toBe(
      'Alex cleared the colour of column "A"',
    )
    expect(sentence('column.reordered', { title: 'A' })).toBe('Alex reordered column "A"')
    expect(sentence('column.deleted', { title: 'A', noteCount: 0 })).toBe('Alex deleted column "A"')
    expect(sentence('column.deleted', { title: 'A', noteCount: 1 })).toBe(
      'Alex deleted column "A" and its 1 note',
    )
    expect(sentence('column.deleted', { title: 'A', noteCount: 3 })).toBe(
      'Alex deleted column "A" and its 3 notes',
    )
    expect(sentence('note.created', { text: 'idea', column: 'Ideas' })).toBe(
      'Alex added a note to "Ideas": "idea"',
    )
    expect(sentence('note.edited', { text: 'new' })).toBe('Alex edited a note: "new"')
    expect(sentence('note.moved', { text: 't', from: 'A', to: 'B' })).toBe(
      'Alex moved a note from "A" to "B": "t"',
    )
    expect(sentence('note.reprioritised', { text: 't', from: 'none', to: 'high' })).toBe(
      'Alex changed a note\'s priority from none to high: "t"',
    )
    expect(sentence('note.deleted', { text: 't', column: 'Ideas' })).toBe(
      'Alex deleted a note from "Ideas": "t"',
    )
    expect(sentence('vote.cast', { text: 't', direction: 'up' })).toBe('Alex upvoted a note: "t"')
    expect(sentence('vote.cast', { text: 't', direction: 'down' })).toBe('Alex downvoted a note: "t"')
    expect(sentence('vote.changed', { text: 't', direction: 'down' })).toBe(
      'Alex changed their vote to down on a note: "t"',
    )
    expect(sentence('vote.cleared', { text: 't' })).toBe('Alex cleared their vote on a note: "t"')
  })

  it('falls back to a generic sentence for an unknown action', () => {
    expect(sentence('mystery.thing', {})).toBe('Alex changed something')
  })

  it('round-trips a built event', () => {
    const built = buildEvent({ kind: 'note-created', noteId: 'n1', text: 'hi', columnTitle: 'Ideas' })
    expect(describeEvent({ actorName: 'Sam', action: built.action, detail: built.detail })).toBe(
      'Sam added a note to "Ideas": "hi"',
    )
  })
})
