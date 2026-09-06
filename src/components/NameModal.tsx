import { useState, type FormEvent, type ReactElement } from 'react'
import { MAX_NAME_LENGTH } from '../lib/identity'

interface NameModalProps {
  onSubmit: (name: string) => void
}

/** Blocking prompt for a display name. Cannot be dismissed without submitting. */
export function NameModal({ onSubmit }: NameModalProps): ReactElement {
  const [name, setName] = useState('')
  const trimmed = name.trim()

  function handleSubmit(event: FormEvent): void {
    event.preventDefault()
    if (trimmed) {
      onSubmit(trimmed)
    }
  }

  return (
    <div className="modal-backdrop">
      <form
        className="modal stack"
        role="dialog"
        aria-modal="true"
        aria-labelledby="name-modal-title"
        onSubmit={handleSubmit}
      >
        <h2 id="name-modal-title">What&rsquo;s your name?</h2>
        <p className="muted">Shown next to the notes and votes you add on this board.</p>
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Sam"
          maxLength={MAX_NAME_LENGTH}
          autoFocus
        />
        <button type="submit" disabled={!trimmed}>
          Join board
        </button>
      </form>
    </div>
  )
}
