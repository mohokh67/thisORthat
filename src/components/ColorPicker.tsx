import type { ReactElement } from 'react'
import { COLUMN_COLORS, type ColumnColor } from '../lib/types'

interface ColorPickerProps {
  value: ColumnColor | null
  onChange: (color: ColumnColor | null) => void
}

/** A row of accent-colour swatches plus a "no colour" option. */
export function ColorPicker({ value, onChange }: ColorPickerProps): ReactElement {
  return (
    <div className="color-picker" role="group" aria-label="Column colour">
      <button
        type="button"
        className="swatch swatch-none"
        aria-label="No colour"
        aria-pressed={value === null}
        data-selected={value === null || undefined}
        onClick={() => onChange(null)}
      />
      {COLUMN_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          className="swatch"
          data-color={color}
          aria-label={color}
          aria-pressed={value === color}
          data-selected={value === color || undefined}
          onClick={() => onChange(color)}
        />
      ))}
    </div>
  )
}
