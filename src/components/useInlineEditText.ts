import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type RefObject,
} from 'react'

interface InlineEditText {
  editing: boolean
  start: () => void
  inputRef: RefObject<HTMLInputElement>
  inputProps: {
    value: string
    onChange: (event: ChangeEvent<HTMLInputElement>) => void
    onBlur: () => void
    onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void
  }
}

/**
 * The click-to-edit state machine shared by single-line editable text controls:
 * a draft, focus-select on entry, Enter/blur commits a changed non-empty value,
 * Escape cancels. Callers own the display element and the input's styling.
 */
export function useInlineEditText(
  value: string,
  onCommit: (next: string) => void,
): InlineEditText {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) {
      inputRef.current?.select()
    }
  }, [editing])

  const start = useCallback(() => {
    setDraft(value)
    setEditing(true)
  }, [value])

  const commit = useCallback(() => {
    setEditing(false)
    const next = draft.trim()
    if (next && next !== value) {
      onCommit(next)
    } else {
      setDraft(value)
    }
  }, [draft, value, onCommit])

  const cancel = useCallback(() => {
    setEditing(false)
    setDraft(value)
  }, [value])

  return {
    editing,
    start,
    inputRef,
    inputProps: {
      value: draft,
      onChange: (event) => setDraft(event.target.value),
      onBlur: commit,
      onKeyDown: (event) => {
        if (event.key === 'Enter') {
          event.preventDefault()
          commit()
        } else if (event.key === 'Escape') {
          event.preventDefault()
          cancel()
        }
      },
    },
  }
}
