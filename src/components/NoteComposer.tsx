import { useState, type KeyboardEvent, type ReactElement } from 'react'

interface NoteComposerProps {
  onAdd: (text: string) => void
}

/** "+ Add note" that expands into a textarea. Enter saves, Shift+Enter adds a
 *  newline, blur with empty text discards. */
export function NoteComposer({ onAdd }: NoteComposerProps): ReactElement {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')

  function close(): void {
    setOpen(false)
    setText('')
  }

  function submit(): void {
    const trimmed = text.trim()
    if (trimmed) {
      onAdd(trimmed)
    }
    close()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      submit()
    } else if (event.key === 'Escape') {
      event.preventDefault()
      close()
    }
  }

  if (!open) {
    return (
      <button type="button" className="note-composer-open" onClick={() => setOpen(true)}>
        + Add note
      </button>
    )
  }

  return (
    <textarea
      className="note-textarea"
      value={text}
      rows={3}
      autoFocus
      placeholder="Write a note…"
      onChange={(event) => setText(event.target.value)}
      onBlur={submit}
      onKeyDown={handleKeyDown}
    />
  )
}
