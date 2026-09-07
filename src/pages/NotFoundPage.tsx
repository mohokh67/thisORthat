import type { ReactElement } from 'react'
import { navigate } from '../routing/useRoute'

export function NotFoundPage(): ReactElement {
  return (
    <main className="app-shell">
      <h1>Board not found</h1>
      <p className="muted">
        This link doesn&rsquo;t point at a board. It may have been mistyped.
      </p>
      <button type="button" onClick={() => navigate('/')}>
        Back to start
      </button>
    </main>
  )
}
