import type { KeyboardEvent, ReactElement } from 'react'
import { useInlineEditText } from './useInlineEditText'

interface EditableTitleProps {
  value: string
  onCommit: (next: string) => void
}

/** A heading that turns into a text input on click or Enter/Space. */
export function EditableTitle({ value, onCommit }: EditableTitleProps): ReactElement {
  const edit = useInlineEditText(value, onCommit)

  if (edit.editing) {
    return (
      <input
        ref={edit.inputRef}
        className="editable-title-input"
        type="text"
        maxLength={200}
        {...edit.inputProps}
      />
    )
  }

  function handleKeyDown(event: KeyboardEvent<HTMLHeadingElement>): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      edit.start()
    }
  }

  return (
    <h1
      className="editable-title"
      tabIndex={0}
      role="button"
      onClick={edit.start}
      onKeyDown={handleKeyDown}
    >
      {value}
    </h1>
  )
}
