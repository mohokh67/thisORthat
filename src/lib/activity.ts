import type { ColumnColor, Priority } from './types'

export type VoteDirection = 'up' | 'down'

/**
 * A mutation that just happened, described with plain primitives the call site
 * already has to hand — no Note or Column objects, so `buildEvent` stays pure
 * and the resulting `detail` cannot smuggle in a live row.
 */
export type ActivityInput =
  | { kind: 'board-renamed'; boardId: string; from: string; to: string }
  | { kind: 'column-added'; columnId: string; title: string }
  | { kind: 'column-renamed'; columnId: string; from: string; to: string }
  | { kind: 'column-recoloured'; columnId: string; title: string; to: ColumnColor | null }
  | { kind: 'column-reordered'; columnId: string; title: string }
  | { kind: 'column-deleted'; columnId: string; title: string; noteCount: number }
  | { kind: 'note-created'; noteId: string; text: string; columnTitle: string }
  | { kind: 'note-edited'; noteId: string; text: string }
  | { kind: 'note-moved'; noteId: string; text: string; fromColumn: string; toColumn: string }
  | { kind: 'note-reprioritised'; noteId: string; text: string; from: Priority; to: Priority }
  | { kind: 'note-deleted'; noteId: string; text: string; columnTitle: string }
  | { kind: 'vote-cast'; noteId: string; text: string; direction: VoteDirection }
  | { kind: 'vote-changed'; noteId: string; text: string; direction: VoteDirection }
  | { kind: 'vote-cleared'; noteId: string; text: string }

export interface BuiltEvent {
  action: string
  targetType: 'board' | 'column' | 'note'
  targetId: string
  detail: Record<string, unknown>
}

const SNIPPET_MAX = 80

/** A short, single-line preview of note text for a log entry's `detail`. */
export function snippet(text: string): string {
  const collapsed = text.replace(/\s+/g, ' ').trim()
  return collapsed.length <= SNIPPET_MAX
    ? collapsed
    : `${collapsed.slice(0, SNIPPET_MAX - 1)}…`
}

/**
 * Turns a just-happened mutation into the stored shape of an Event: an `action`
 * slug, what it acted on, and a `detail` payload that holds every value the log
 * needs to render the entry later — even after the note or column is deleted.
 */
export function buildEvent(input: ActivityInput): BuiltEvent {
  switch (input.kind) {
    case 'board-renamed':
      return entry('board.renamed', 'board', input.boardId, { from: input.from, to: input.to })
    case 'column-added':
      return entry('column.added', 'column', input.columnId, { title: input.title })
    case 'column-renamed':
      return entry('column.renamed', 'column', input.columnId, { from: input.from, to: input.to })
    case 'column-recoloured':
      return entry('column.recoloured', 'column', input.columnId, {
        title: input.title,
        color: input.to,
      })
    case 'column-reordered':
      return entry('column.reordered', 'column', input.columnId, { title: input.title })
    case 'column-deleted':
      return entry('column.deleted', 'column', input.columnId, {
        title: input.title,
        noteCount: input.noteCount,
      })
    case 'note-created':
      return entry('note.created', 'note', input.noteId, {
        text: snippet(input.text),
        column: input.columnTitle,
      })
    case 'note-edited':
      return entry('note.edited', 'note', input.noteId, { text: snippet(input.text) })
    case 'note-moved':
      return entry('note.moved', 'note', input.noteId, {
        text: snippet(input.text),
        from: input.fromColumn,
        to: input.toColumn,
      })
    case 'note-reprioritised':
      return entry('note.reprioritised', 'note', input.noteId, {
        text: snippet(input.text),
        from: input.from,
        to: input.to,
      })
    case 'note-deleted':
      return entry('note.deleted', 'note', input.noteId, {
        text: snippet(input.text),
        column: input.columnTitle,
      })
    case 'vote-cast':
      return entry('vote.cast', 'note', input.noteId, {
        text: snippet(input.text),
        direction: input.direction,
      })
    case 'vote-changed':
      return entry('vote.changed', 'note', input.noteId, {
        text: snippet(input.text),
        direction: input.direction,
      })
    case 'vote-cleared':
      return entry('vote.cleared', 'note', input.noteId, { text: snippet(input.text) })
  }
}

function entry(
  action: string,
  targetType: BuiltEvent['targetType'],
  targetId: string,
  detail: Record<string, unknown>,
): BuiltEvent {
  return { action, targetType, targetId, detail }
}

export interface DescribableEvent {
  actorName: string
  action: string
  detail: Record<string, unknown>
}

/**
 * A stored Event as one plain-language sentence, built only from the actor's
 * name and the self-contained `detail` — never from the live board, so an entry
 * stays readable after its target is gone.
 */
export function describeEvent(event: DescribableEvent): string {
  const who = event.actorName
  const d = event.detail
  const field = (key: string): string => String(d[key] ?? '')

  switch (event.action) {
    case 'board.renamed':
      return `${who} renamed the board from "${field('from')}" to "${field('to')}"`
    case 'column.added':
      return `${who} added column "${field('title')}"`
    case 'column.renamed':
      return `${who} renamed column "${field('from')}" to "${field('to')}"`
    case 'column.recoloured':
      return d.color
        ? `${who} recoloured column "${field('title')}" ${field('color')}`
        : `${who} cleared the colour of column "${field('title')}"`
    case 'column.reordered':
      return `${who} reordered column "${field('title')}"`
    case 'column.deleted': {
      const count = Number(d.noteCount ?? 0)
      const tail = count > 0 ? ` and its ${count} note${count === 1 ? '' : 's'}` : ''
      return `${who} deleted column "${field('title')}"${tail}`
    }
    case 'note.created':
      return `${who} added a note to "${field('column')}": "${field('text')}"`
    case 'note.edited':
      return `${who} edited a note: "${field('text')}"`
    case 'note.moved':
      return `${who} moved a note from "${field('from')}" to "${field('to')}": "${field('text')}"`
    case 'note.reprioritised':
      return `${who} changed a note's priority from ${field('from')} to ${field('to')}: "${field('text')}"`
    case 'note.deleted':
      return `${who} deleted a note from "${field('column')}": "${field('text')}"`
    case 'vote.cast':
      return `${who} ${d.direction === 'down' ? 'downvoted' : 'upvoted'} a note: "${field('text')}"`
    case 'vote.changed':
      return `${who} changed their vote to ${field('direction')} on a note: "${field('text')}"`
    case 'vote.cleared':
      return `${who} cleared their vote on a note: "${field('text')}"`
    default:
      return `${who} changed something`
  }
}
