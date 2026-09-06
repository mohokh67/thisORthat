import type { ReactElement } from 'react'
import { COLUMN_COLORS, type ColumnColor } from '../lib/types'

interface ColorPickerProps {
  value: ColumnColor | null
  onChange: (color: ColumnColor | null) => void
}

const OPTIONS: readonly (ColumnColor | null)[] = [null, ...COLUMN_COLORS]

/** A row of accent-colour swatches; the first option clears the colour. */
export function ColorPicker({ value, onChange }: ColorPickerProps): ReactElement {
  return (
    <div className="color-picker" role="group" aria-label="Column colour">
      {OPTIONS.map((color) => (
        <button
          key={color ?? 'none'}
          type="button"
          className={color ? 'swatch' : 'swatch swatch-none'}
          data-color={color ?? undefined}
          aria-label={color ?? 'No colour'}
          aria-pressed={value === color}
          data-selected={value === color || undefined}
          onClick={() => onChange(color)}
        />
      ))}
    </div>
  )
}
