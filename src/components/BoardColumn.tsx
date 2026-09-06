import { useState, type ReactElement } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Column, ColumnColor, Note, VoteValue } from '../lib/types'
import type { NoteVoteState } from '../hooks/useBoard'
import { NoteCard } from './NoteCard'
import { NoteComposer } from './NoteComposer'
import { ColorPicker } from './ColorPicker'
import { ConfirmDialog } from './ConfirmDialog'
import { useInlineEditText } from './useInlineEditText'

const NO_VOTES: NoteVoteState = { points: 0, mine: null }

interface BoardColumnProps {
  column: Column
  notes: Note[]
  voteState: Map<string, NoteVoteState>
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
  const { column, notes } = props
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.id,
  })
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
        {notes.map((note) => {
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
