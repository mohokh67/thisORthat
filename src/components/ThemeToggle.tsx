import type { ReactElement } from 'react'
import { useTheme } from '../hooks/useTheme'

/** Header button that flips the board between light and dark on this device. */
export function ThemeToggle(): ReactElement {
  const { theme, toggle } = useTheme()
  const nextLabel = theme === 'dark' ? 'light' : 'dark'

  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={`Switch to ${nextLabel} theme`}
      title={`Switch to ${nextLabel} theme`}
      onClick={toggle}
    >
      {theme === 'dark' ? '☾' : '☀'}
    </button>
  )
}
