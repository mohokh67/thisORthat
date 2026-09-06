import { useCallback, useState, type ReactElement } from 'react'
import { createIdentity, loadIdentity, normalizeName, saveIdentity, type Identity } from '../lib/identity'
import { navigate } from '../routing/useHashRoute'
import { useBoard } from '../hooks/useBoard'
import { usePresence } from '../hooks/usePresence'
import { useSortLenses } from '../hooks/useSortLenses'
import { NotFoundPage } from './NotFoundPage'
import { EditableTitle } from '../components/EditableTitle'
import { IdentityBadge } from '../components/IdentityBadge'
import { NameModal } from '../components/NameModal'
import { BoardColumns } from '../components/BoardColumns'
import { PresenceStrip } from '../components/PresenceStrip'
import { Toasts } from '../components/Toasts'

export function BoardPage({ boardId }: { boardId: string }): ReactElement {
  const [identity, setIdentity] = useState<Identity | null>(() => loadIdentity())
  const board = useBoard(boardId, identity)
  const presence = usePresence(boardId, identity)
  const lenses = useSortLenses(boardId)

  const handleNameSubmit = useCallback((name: string) => {
    const next = createIdentity(name)
    saveIdentity(next)
    setIdentity(next)
  }, [])

  const handleIdentityRename = useCallback((nextName: string) => {
    setIdentity((current) => {
      if (!current) {
        return current
      }
      const next = { ...current, name: normalizeName(nextName) }
      saveIdentity(next)
      return next
    })
  }, [])

  if (board.status === 'loading') {
    return <main className="app-shell">Loading…</main>
  }
  if (board.status === 'not-found') {
    return <NotFoundPage />
  }
  if (board.status === 'error' || !board.board) {
    return (
      <main className="app-shell">
        <p className="error">Could not load this board.</p>
        <button type="button" onClick={() => navigate('#/')}>
          Back to start
        </button>
      </main>
    )
  }

  if (!identity) {
    return (
      <div className="board">
        <header className="board-header">
          <h1 className="editable-title">{board.board.title}</h1>
        </header>
        <NameModal onSubmit={handleNameSubmit} />
      </div>
    )
  }

  return (
    <div className="board">
      <header className="board-header">
        <EditableTitle value={board.board.title} onCommit={board.renameBoard} />
        <div className="board-header-right">
          <PresenceStrip participants={presence} />
          {board.connection === 'reconnecting' && (
            <span className="conn-chip">Reconnecting…</span>
          )}
          <IdentityBadge name={identity.name} onRename={handleIdentityRename} />
        </div>
      </header>

      <BoardColumns board={board} lenses={lenses} />

      <Toasts toasts={board.toasts} />
    </div>
  )
}
