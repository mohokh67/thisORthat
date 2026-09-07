import { useCallback, useState } from 'react'
import { applyTheme, loadTheme, saveTheme, type Theme } from '../lib/theme'

export interface ThemeControl {
  theme: Theme
  /** Flips between light and dark, persisting the new choice to this device. */
  toggle: () => void
}

/**
 * This device's light/dark theme. Seeded from `localStorage` (or the OS
 * preference); `index.html` has already applied that same value to `<html>`
 * before first paint, so mount does not need to re-apply it.
 */
export function useTheme(): ThemeControl {
  const [theme, setTheme] = useState<Theme>(loadTheme)

  const toggle = useCallback(() => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    saveTheme(next)
    applyTheme(next)
    setTheme(next)
  }, [theme])

  return { theme, toggle }
}
