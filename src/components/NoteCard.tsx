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

  // Mouse convenience: click anywhere in the note (but not on a link) to edit.
  // Keyboard users use the explicit Edit button so links stay reachable.
  function handleBodyClick(event: MouseEvent<HTMLDivElement>): void {
    if (!(event.target as HTMLElement).closest('a')) {
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
      <div className="note-actions">
        <button type="button" className="note-action" aria-label="Edit note" onClick={startEditing}>
          ✎
        </button>
        <button type="button" className="note-action" aria-label="Delete note" onClick={onDelete}>
          ×
        </button>
      </div>
      <div className="note-body" onClick={handleBodyClick}>
        <LinkifiedText text={note.text} />
      </div>
      <p className="note-author">{note.authorName}</p>
    </div>
  )
}
