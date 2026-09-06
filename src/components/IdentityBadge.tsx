import type { ReactElement } from 'react'
import { MAX_NAME_LENGTH } from '../lib/identity'
import { useInlineEditText } from './useInlineEditText'

interface IdentityBadgeProps {
  name: string
  onRename: (next: string) => void
}

/** "You: <name>" in the board header; click to rename yourself inline. */
export function IdentityBadge({ name, onRename }: IdentityBadgeProps): ReactElement {
  const edit = useInlineEditText(name, onRename)

  if (edit.editing) {
    return (
      <input
        ref={edit.inputRef}
        className="identity-badge-input"
        type="text"
        maxLength={MAX_NAME_LENGTH}
        {...edit.inputProps}
      />
    )
  }

  return (
    <button
      type="button"
      className="identity-badge"
      title="Rename yourself"
      onClick={edit.start}
    >
      You: {name}
    </button>
  )
}
