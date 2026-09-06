import { useCallback, useEffect, useMemo, useState, type ReactElement } from 'react'
import { addColumn, fetchBoard, renameBoard } from '../lib/boards'
import { createIdentity, loadIdentity, normalizeName, saveIdentity, type Identity } from '../lib/identity'
import { createNote, deleteNote, updateNoteText } from '../lib/notes'
import { joinBoard } from '../lib/participants'
import type { Board, Column, Note } from '../lib/types'
import { navigate } from '../routing/useHashRoute'
import { NotFoundPage } from './NotFoundPage'
import { EditableTitle } from '../components/EditableTitle'
import { IdentityBadge } from '../components/IdentityBadge'
import { NameModal } from '../components/NameModal'
import { BoardColumn } from '../components/BoardColumn'

type LoadState =
  | { status: 'loading' }
  | { status: 'not-found' }
  | { status: 'error' }
  | { status: 'ready'; board: Board; columns: Column[]; notes: Note[] }

type ReadyState = Extract<LoadState, { status: 'ready' }>

const NO_NOTES: Note[] = []

function byPosition(a: { position: number }, b: { position: number }): number {
  return a.position - b.position
}

function groupByColumn(notes: Note[]): Map<string, Note[]> {
  const grouped = new Map<string, Note[]>()
  for (const note of [...notes].sort(byPosition)) {
    const bucket = grouped.get(note.columnId)
    if (bucket) {
      bucket.push(note)
    } else {
      grouped.set(note.columnId, [note])
    }
  }
  return grouped
}

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
            ? {
                status: 'ready',
                board: result.board,
                columns: result.columns,
                notes: result.notes,
              }
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

  useEffect(() => {
    if (state.status === 'ready' && identity) {
      joinBoard(boardId, identity).catch(console.error)
    }
  }, [state.status, identity, boardId])

  const patchReady = useCallback((patch: (ready: ReadyState) => ReadyState) => {
    setState((current) => (current.status === 'ready' ? patch(current) : current))
  }, [])

  const notes = state.status === 'ready' ? state.notes : NO_NOTES
  const notesByColumn = useMemo(() => groupByColumn(notes), [notes])

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

  const handleBoardRename = useCallback(
    async (nextTitle: string) => {
      patchReady((ready) => ({ ...ready, board: { ...ready.board, title: nextTitle } }))
      try {
        await renameBoard(boardId, nextTitle)
      } catch (cause) {
        console.error(cause)
      }
    },
    [boardId, patchReady],
  )

  const handleAddColumn = useCallback(async () => {
    try {
      const column = await addColumn(boardId)
      patchReady((ready) => ({ ...ready, columns: [...ready.columns, column] }))
    } catch (cause) {
      console.error(cause)
    }
  }, [boardId, patchReady])

  const handleAddNote = useCallback(
    async (columnId: string, text: string) => {
      if (!identity) {
        return
      }
      try {
        const note = await createNote({
          boardId,
          columnId,
          text,
          author: { id: identity.id, name: identity.name },
        })
        patchReady((ready) => ({ ...ready, notes: [...ready.notes, note] }))
      } catch (cause) {
        console.error(cause)
      }
    },
    [boardId, identity, patchReady],
  )

  const handleEditNote = useCallback(
    async (noteId: string, text: string) => {
      patchReady((ready) => ({
        ...ready,
        notes: ready.notes.map((note) => (note.id === noteId ? { ...note, text } : note)),
      }))
      try {
        await updateNoteText(noteId, text)
      } catch (cause) {
        console.error(cause)
      }
    },
    [patchReady],
  )

  const handleDeleteNote = useCallback(
    async (noteId: string) => {
      patchReady((ready) => ({
        ...ready,
        notes: ready.notes.filter((note) => note.id !== noteId),
      }))
      try {
        await deleteNote(noteId)
      } catch (cause) {
        console.error(cause)
      }
    },
    [patchReady],
  )

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

  // No name yet: nothing on the board is reachable until the prompt is answered
  // (CONTEXT.md: there is no anonymous viewing).
  if (!identity) {
    return (
      <div className="board">
        <header className="board-header">
          <h1 className="editable-title">{state.board.title}</h1>
        </header>
        <NameModal onSubmit={handleNameSubmit} />
      </div>
    )
  }

  return (
    <div className="board">
      <header className="board-header">
        <EditableTitle value={state.board.title} onCommit={handleBoardRename} />
        <IdentityBadge name={identity.name} onRename={handleIdentityRename} />
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
            <BoardColumn
              key={column.id}
              column={column}
              notes={notesByColumn.get(column.id) ?? []}
              onAddNote={handleAddNote}
              onEditNote={handleEditNote}
              onDeleteNote={handleDeleteNote}
            />
          ))}
          <button type="button" className="column-add" onClick={handleAddColumn}>
            + Add column
          </button>
        </div>
      )}
    </div>
  )
}
