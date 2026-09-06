import { useState, type FormEvent, type ReactElement } from 'react'
import { createBoard } from '../lib/boards'
import { loadRecentBoards } from '../lib/recentBoards'
import { relativeTime } from '../lib/relativeTime'
import { TEMPLATE_CHOICES } from '../lib/templates'
import type { TemplateName } from '../lib/types'
import { boardHash } from '../routing/parseHash'
import { navigate } from '../routing/useHashRoute'

export function LandingPage(): ReactElement {
  const [title, setTitle] = useState('')
  const [template, setTemplate] = useState<TemplateName>('positive-negative')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recent] = useState(loadRecentBoards)
  const [now] = useState(() => Date.now())

  const trimmedTitle = title.trim()

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault()
    if (!trimmedTitle || submitting) {
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const board = await createBoard({ title: trimmedTitle, template })
      navigate(boardHash(board.id))
    } catch (cause) {
      setError('Could not create the board. Check your connection and try again.')
      setSubmitting(false)
      console.error(cause)
    }
  }

  return (
    <main className="app-shell">
      <h1>thisORthat</h1>
      <p className="muted">Create a board, share the link, collect and vote together.</p>

      <form className="stack" onSubmit={handleSubmit}>
        <label className="stack-tight">
          <span>Board title</span>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Sprint 14 retro"
            maxLength={200}
            autoFocus
          />
        </label>

        <fieldset className="stack-tight">
          <legend>Template</legend>
          {TEMPLATE_CHOICES.map((choice) => (
            <label key={choice.name} className="choice">
              <input
                type="radio"
                name="template"
                value={choice.name}
                checked={template === choice.name}
                onChange={() => setTemplate(choice.name)}
              />
              <span>{choice.label}</span>
            </label>
          ))}
        </fieldset>

        <button type="submit" disabled={!trimmedTitle || submitting}>
          {submitting ? 'Creating…' : 'Create board'}
        </button>

        {error && <p className="error">{error}</p>}
      </form>

      <section className="recent-boards">
        <h2>Recent boards</h2>
        {recent.length === 0 ? (
          <p className="muted">Boards you open on this device will show up here.</p>
        ) : (
          <ul className="recent-list">
            {recent.map((entry) => (
              <li key={entry.id}>
                <a href={boardHash(entry.id)}>{entry.title}</a>
                <span className="recent-time">
                  {relativeTime(new Date(entry.lastOpened).toISOString(), now)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
