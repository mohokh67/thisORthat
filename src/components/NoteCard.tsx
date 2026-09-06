import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
} from 'react'
import type { Note } from '../lib/types'
import { LinkifiedText } from './LinkifiedText'

interface NoteCardProps {
  note: Note
  onEdit: (text: string) => void
  onDelete: () => void
}

export function NoteCard({ note, onEdit, onDelete }: NoteCardProps): ReactElement {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(note.text)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (editing) {
      const node = textareaRef.current
      node?.focus()
      node?.setSelectionRange(node.value.length, node.value.length)
    }
  }, [editing])

  function startEditing(): void {
    setDraft(note.text)
    setEditing(true)
  }

  function commit(): void {
    setEditing(false)
    const next = draft.trim()
    if (next && next !== note.text) {
      onEdit(next)
    } else {
      setDraft(note.text)
    }
  }

  function handleTextareaKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      commit()
    } else if (event.key === 'Escape') {
      event.preventDefault()
      setEditing(false)
      setDraft(note.text)
    }
  }

  // Clicking a link inside the note should follow the link, not open the editor.
  function handleBodyClick(event: MouseEvent<HTMLDivElement>): void {
    if (!(event.target as HTMLElement).closest('a')) {
      startEditing()
    }
  }

  function handleBodyKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      startEditing()
    }
  }

  if (editing) {
    return (
      <div className="note note-editing">
        <textarea
          ref={textareaRef}
          className="note-textarea"
          value={draft}
          rows={3}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={handleTextareaKeyDown}
        />
      </div>
    )
  }

  return (
    <div className="note">
      <button
        type="button"
        className="note-delete"
        aria-label="Delete note"
        onClick={onDelete}
      >
        ×
      </button>
      <div
        className="note-body"
        role="button"
        tabIndex={0}
        onClick={handleBodyClick}
        onKeyDown={handleBodyKeyDown}
      >
        <LinkifiedText text={note.text} />
      </div>
      <p className="note-author">{note.authorName}</p>
    </div>
  )
}
