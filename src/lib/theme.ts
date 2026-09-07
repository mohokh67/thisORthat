/**
 * This device's light/dark choice, kept in `localStorage`. A purely local view
 * concern: nothing here touches board data or other Participants.
 *
 * The whole palette is built on the CSS system colours (`Canvas`, `CanvasText`,
 * `currentColor`), so switching themes is just a matter of forcing
 * `color-scheme` on `<html>` via a `data-theme` attribute (see `index.css`).
 */
const KEY = 'thisorthat.theme'

export type Theme = 'light' | 'dark'

/** Narrows a stored string to a {@link Theme}, or `null` if it is neither. */
export function parseTheme(raw: string | null): Theme | null {
  return raw === 'light' || raw === 'dark' ? raw : null
}

/** The OS-level preference, used as the default before the user picks one. */
function systemTheme(): Theme {
  return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

/** This device's theme: the stored choice, else whatever the OS prefers. */
export function loadTheme(): Theme {
  try {
    return parseTheme(localStorage.getItem(KEY)) ?? systemTheme()
  } catch {
    return systemTheme()
  }
}

/** Persists `theme` for next load. Never throws. */
export function saveTheme(theme: Theme): void {
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    // Storage disabled: the choice just won't survive a reload.
  }
}

/** Reflects `theme` onto `<html>` so the CSS `color-scheme` overrides kick in. */
export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme
}
