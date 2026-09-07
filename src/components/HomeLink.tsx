import type { ReactElement } from 'react'

/**
 * Board-header link back to the landing page. A plain anchor to the home hash so
 * cmd/ctrl-click and middle-click open a new tab; `parseHash` treats any
 * non-board hash as the landing route.
 */
export function HomeLink(): ReactElement {
  return (
    <a className="home-link" href="#/" aria-label="Home" title="Home">
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path
          d="M3 11.5 12 4l9 7.5M5 10v9a1 1 0 0 0 1 1h4v-5h4v5h4a1 1 0 0 0 1-1v-9"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </a>
  )
}
