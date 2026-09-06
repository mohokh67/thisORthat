import { useEffect, useRef, useState, type KeyboardEvent, type ReactElement } from 'react'

interface EditableTitleProps {
  value: string
  onCommit: (next: string) => void
}

/** A heading that turns into a text input on click. Enter or blur commits a
 *  changed, non-empty value; Escape cancels. */
export function EditableTitle({ value, onCommit }: EditableTitleProps): ReactElement {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) {
      inputRef.current?.select()
    }
  }, [editing])

  function commit(): void {
    setEditing(false)
    const next = draft.trim()
    if (next && next !== value) {
      onCommit(next)
    } else {
      setDraft(value)
    }
  }

  function cancel(): void {
    setEditing(false)
    setDraft(value)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key === 'Enter') {
      event.preventDefault()
      commit()
    } else if (event.key === 'Escape') {
      event.preventDefault()
      cancel()
    }
  }

  if (!editing) {
    return (
      <h1
        className="editable-title"
        tabIndex={0}
        role="button"
        onClick={() => {
          setDraft(value)
          setEditing(true)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            setDraft(value)
            setEditing(true)
          }
        }}
      >
        {value}
      </h1>
    )
  }

  return (
    <input
      ref={inputRef}
      className="editable-title-input"
      type="text"
      value={draft}
      maxLength={200}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={handleKeyDown}
    />
  )
}
