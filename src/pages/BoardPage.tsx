import { useCallback, useEffect, useState, type ReactElement } from 'react'
import { addColumn, fetchBoard, renameBoard } from '../lib/boards'
import { createIdentity, loadIdentity, normalizeName, saveIdentity, type Identity } from '../lib/identity'
import { joinBoard } from '../lib/participants'
import type { Board, Column } from '../lib/types'
import { navigate } from '../routing/useHashRoute'
import { NotFoundPage } from './NotFoundPage'
import { EditableTitle } from '../components/EditableTitle'
import { IdentityBadge } from '../components/IdentityBadge'
import { NameModal } from '../components/NameModal'

type LoadState =
  | { status: 'loading' }
  | { status: 'not-found' }
  | { status: 'error' }
  | { status: 'ready'; board: Board; columns: Column[] }

export function BoardPage({ boardId }: { boardId: string }): ReactElement {
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [identity, setIdentity] = useState<Identity | null>(() => loadIdentity())

  useEffect(() => {
    let active = true
    setState({ status: 'loading' })
    fetchBoard(boardId)
      .then((result) => {
        if (!active) {
          return
        }
        setState(
          result
            ? { status: 'ready', board: result.board, columns: result.columns }
            : { status: 'not-found' },
        )
      })
      .catch((cause) => {
        console.error(cause)
        if (active) {
          setState({ status: 'error' })
        }
      })
    return () => {
      active = false
    }
  }, [boardId])

  // Record presence once the board exists and we know who we are.
  useEffect(() => {
    if (state.status === 'ready' && identity) {
      joinBoard(boardId, identity).catch(console.error)
    }
  }, [state.status, identity, boardId])

  const handleNameSubmit = useCallback((name: string) => {
    const next = createIdentity(name)
    saveIdentity(next)
    setIdentity(next)
  }, [])

  const handleIdentityRename = useCallback(
    (nextName: string) => {
      setIdentity((current) => {
        if (!current) {
          return current
        }
        const next = { ...current, name: normalizeName(nextName) }
        saveIdentity(next)
        return next
      })
    },
    [],
  )

  const handleBoardRename = useCallback(
    async (nextTitle: string) => {
      setState((current) =>
        current.status === 'ready'
          ? { ...current, board: { ...current.board, title: nextTitle } }
          : current,
      )
      try {
        await renameBoard(boardId, nextTitle)
      } catch (cause) {
        console.error(cause)
      }
    },
    [boardId],
  )

  const handleAddColumn = useCallback(async () => {
    try {
      const column = await addColumn(boardId)
      setState((current) =>
        current.status === 'ready'
          ? { ...current, columns: [...current.columns, column] }
          : current,
      )
    } catch (cause) {
      console.error(cause)
    }
  }, [boardId])

  if (state.status === 'loading') {
    return <main className="app-shell">Loading…</main>
  }
  if (state.status === 'not-found') {
    return <NotFoundPage />
  }
  if (state.status === 'error') {
    return (
      <main className="app-shell">
        <p className="error">Could not load this board.</p>
        <button type="button" onClick={() => navigate('#/')}>
          Back to start
        </button>
      </main>
    )
  }

  return (
    <div className="board">
      <header className="board-header">
        <EditableTitle value={state.board.title} onCommit={handleBoardRename} />
        {identity && <IdentityBadge name={identity.name} onRename={handleIdentityRename} />}
      </header>

      {state.columns.length === 0 ? (
        <div className="board-empty">
          <p>This board has no columns yet.</p>
          <button type="button" onClick={handleAddColumn}>
            Add your first column
          </button>
        </div>
      ) : (
        <div className="columns-row">
          {state.columns.map((column) => (
            <section key={column.id} className="column" data-color={column.color ?? undefined}>
              <header className="column-header">{column.title}</header>
            </section>
          ))}
          <button type="button" className="column-add" onClick={handleAddColumn}>
            + Add column
          </button>
        </div>
      )}

      {!identity && <NameModal onSubmit={handleNameSubmit} />}
    </div>
  )
}
