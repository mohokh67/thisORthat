import type { ReactElement } from 'react'
import type { Column, Note } from '../lib/types'
import { NoteCard } from './NoteCard'
import { NoteComposer } from './NoteComposer'

interface BoardColumnProps {
  column: Column
  notes: Note[]
  onAddNote: (columnId: string, text: string) => void
  onEditNote: (noteId: string, text: string) => void
  onDeleteNote: (noteId: string) => void
}

export function BoardColumn({
  column,
  notes,
  onAddNote,
  onEditNote,
  onDeleteNote,
}: BoardColumnProps): ReactElement {
  return (
    <section className="column" data-color={column.color ?? undefined}>
      <header className="column-header">{column.title}</header>
      <div className="column-body">
        <NoteComposer onAdd={(text) => onAddNote(column.id, text)} />
        {notes.map((note) => (
          <NoteCard
            key={note.id}
            note={note}
            onEdit={(text) => onEditNote(note.id, text)}
            onDelete={() => onDeleteNote(note.id)}
          />
        ))}
      </div>
    </section>
  )
}
