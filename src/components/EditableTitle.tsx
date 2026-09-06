import type { ReactElement } from 'react'
import { useInlineEditText } from './useInlineEditText'

interface EditableTitleProps {
  value: string
  onCommit: (next: string) => void
}

/** A level-1 heading whose text is a button that swaps to an input on activate. */
export function EditableTitle({ value, onCommit }: EditableTitleProps): ReactElement {
  const edit = useInlineEditText(value, onCommit)

  if (edit.editing) {
    return (
      <input
        ref={edit.inputRef}
        className="editable-title-input"
        type="text"
        maxLength={200}
        aria-label="Board title"
        {...edit.inputProps}
      />
    )
  }

  return (
    <h1 className="editable-title">
      <button type="button" className="editable-title-button" onClick={edit.start}>
        {value}
      </button>
    </h1>
  )
}
