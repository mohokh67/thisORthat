import { useMemo, useState, type ReactElement } from 'react'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Column, ColumnColor, Note, SortLens, VoteValue } from '../lib/types'
import { SORT_LENSES } from '../lib/types'
import type { NoteVoteState } from '../hooks/useBoard'
import { orderNotes } from '../lib/sortLens'
import { NoteCard } from './NoteCard'
import { NoteComposer } from './NoteComposer'
import { ColorPicker } from './ColorPicker'
import { ConfirmDialog } from './ConfirmDialog'
import { useInlineEditText } from './useInlineEditText'

const LENS_LABELS: Record<SortLens, string> = {
  custom: 'Custom',
  points: 'Points',
  priority: 'Priority',
  newest: 'Newest',
  oldest: 'Oldest',
}

const NO_VOTES: NoteVoteState = { points: 0, mine: null }

interface BoardColumnProps {
  column: Column
  notes: Note[]
  voteState: Map<string, NoteVoteState>
  lens: SortLens
  onLensChange: (columnId: string, lens: SortLens) => void
  onRename: (columnId: string, title: string) => void
  onRecolor: (columnId: string, color: ColumnColor | null) => void
  onDeleteColumn: (columnId: string) => void
  onAddNote: (columnId: string, text: string) => void
  onEditNote: (noteId: string, text: string) => void
  onCyclePriority: (noteId: string) => void
  onDeleteNote: (noteId: string) => void
  onVote: (noteId: string, arrow: VoteValue) => void
}

export function BoardColumn(props: BoardColumnProps): ReactElement {
  const { column, notes, lens } = props
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.id,
    data: { type: 'column', columnId: column.id },
  })

  const orderedNotes = useMemo(() => {
    const pointsByNote = new Map(
      [...props.voteState].map(([noteId, state]) => [noteId, state.points]),
    )
    return orderNotes(notes, lens, pointsByNote)
  }, [notes, lens, props.voteState])
  const title = useInlineEditText(column.title, (next) => props.onRename(column.id, next))
  const [showColors, setShowColors] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const noteCount = notes.length
  const deleteBody =
    noteCount === 0
      ? `Delete "${column.title}"? This can't be undone.`
      : `Delete "${column.title}" and its ${noteCount} note${noteCount === 1 ? '' : 's'}? This can't be undone.`

  return (
    <section
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : undefined,
      }}
      className="column"
      data-color={column.color ?? undefined}
    >
      <header className="column-header">
        <button
          type="button"
          className="column-drag"
          aria-label="Drag to reorder column"
          {...attributes}
          {...listeners}
        >
          ⠿
        </button>
        {title.editing ? (
          <input
            ref={title.inputRef}
            className="column-title-input"
            type="text"
            maxLength={200}
            aria-label="Column title"
            {...title.inputProps}
          />
        ) : (
          <button type="button" className="column-title" onClick={title.start}>
            {column.title}
          </button>
        )}
        <button
          type="button"
          className="column-tool"
          aria-label="Column colour"
          aria-expanded={showColors}
          onClick={() => setShowColors((open) => !open)}
        >
          ◑
        </button>
        <button
          type="button"
          className="column-tool"
          aria-label="Delete column"
          onClick={() => setConfirming(true)}
        >
          ×
        </button>
      </header>

      <div className="column-sort">
        <label className="column-sort-label">
          Sort
          <select
            className="column-sort-select"
            value={lens}
            onChange={(event) => props.onLensChange(column.id, event.target.value as SortLens)}
          >
            {SORT_LENSES.map((option) => (
              <option key={option} value={option}>
                {LENS_LABELS[option]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {showColors && (
        <div className="column-colors">
          <ColorPicker
            value={column.color}
            onChange={(color) => {
              props.onRecolor(column.id, color)
              setShowColors(false)
            }}
          />
        </div>
      )}

      <div className="column-body">
        <NoteComposer onAdd={(text) => props.onAddNote(column.id, text)} />
        {/* Notes stay sortable under every lens so a note can always be dragged
            out to another column; `handleDragEnd` drops in-column reorders while
            a non-Custom lens is active, so such a drag just animates back. */}
        <SortableContext
          items={orderedNotes.map((note) => note.id)}
          strategy={verticalListSortingStrategy}
        >
          {orderedNotes.map((note) => {
            const votes = props.voteState.get(note.id) ?? NO_VOTES
            return (
              <NoteCard
                key={note.id}
                note={note}
                points={votes.points}
                myVote={votes.mine}
                onEdit={(text) => props.onEditNote(note.id, text)}
                onCyclePriority={() => props.onCyclePriority(note.id)}
                onDelete={() => props.onDeleteNote(note.id)}
                onVote={(arrow) => props.onVote(note.id, arrow)}
              />
            )
          })}
        </SortableContext>
      </div>

      {confirming && (
        <ConfirmDialog
          title="Delete column"
          body={deleteBody}
          confirmLabel="Delete"
          onConfirm={() => {
            setConfirming(false)
            props.onDeleteColumn(column.id)
          }}
          onCancel={() => setConfirming(false)}
        />
      )}
    </section>
  )
}
