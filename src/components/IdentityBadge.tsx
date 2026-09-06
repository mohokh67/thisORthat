import { useEffect, useRef, useState, type KeyboardEvent, type ReactElement } from 'react'
import { MAX_NAME_LENGTH } from '../lib/identity'

interface IdentityBadgeProps {
  name: string
  onRename: (next: string) => void
}

/** "You: <name>" in the board header; click to rename yourself inline. */
export function IdentityBadge({ name, onRename }: IdentityBadgeProps): ReactElement {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(name)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) {
      inputRef.current?.select()
    }
  }, [editing])

  function commit(): void {
    setEditing(false)
    const next = draft.trim()
    if (next && next !== name) {
      onRename(next)
    } else {
      setDraft(name)
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key === 'Enter') {
      event.preventDefault()
      commit()
    } else if (event.key === 'Escape') {
      event.preventDefault()
      setEditing(false)
      setDraft(name)
    }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        className="identity-badge-input"
        type="text"
        value={draft}
        maxLength={MAX_NAME_LENGTH}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
      />
    )
  }

  return (
    <button
      type="button"
      className="identity-badge"
      title="Rename yourself"
      onClick={() => {
        setDraft(name)
        setEditing(true)
      }}
    >
      You: {name}
    </button>
  )
}
