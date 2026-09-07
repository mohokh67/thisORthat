import type { ReactElement } from 'react'
import { Link } from './Link'

/**
 * Board-header link back to the landing page. Renders a real anchor (via `Link`)
 * so cmd/ctrl-click and middle-click open a new tab; a plain click routes in
 * place.
 */
export function HomeLink(): ReactElement {
  return (
    <Link className="home-link" to="/" aria-label="Home" title="Home">
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
    </Link>
  )
}
