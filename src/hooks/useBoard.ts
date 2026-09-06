import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  addColumn as insertColumn,
  fetchBoard,
  renameBoard as renameBoardRow,
} from '../lib/boards'
import {
  createNote as insertNote,
  deleteNote as deleteNoteRow,
  updateNoteText,
} from '../lib/notes'
import { joinBoard } from '../lib/participants'
import { positionAtEnd, positionAtStart } from '../lib/position'
import { reconcile, type BoardEntities } from '../lib/reconcile'
import { subscribeToBoard, type ConnectionStatus } from '../lib/realtime'
import type { Identity } from '../lib/identity'
import type { Board, Column, Note } from '../lib/types'
import { useToasts, type Toast } from '../components/useToasts'

type Status = 'loading' | 'not-found' | 'error' | 'ready'

interface State {
  status: Status
  entities: BoardEntities | null
}

export interface UseBoard {
  status: Status
  board: Board | null
  columns: Column[]
  notesByColumn: Map<string, Note[]>
  connection: ConnectionStatus
  toasts: Toast[]
  addColumn: () => void
  renameBoard: (title: string) => void
  addNote: (columnId: string, text: string) => void
  editNote: (noteId: string, text: string) => void
  deleteNote: (noteId: string) => void
}

const SAVE_FAILED = "Couldn't save that change. Please try again."
const EMPTY_COLUMNS: Column[] = []
const EMPTY_NOTES: Note[] = []

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

const RETRY_DELAY_MS = 400

/** Runs a write, retrying once after a short delay. Returns whether it succeeded. */
async function withRetry(write: () => Promise<unknown>): Promise<boolean> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      await write()
      return true
    } catch (cause) {
      console.error(cause)
      if (attempt === 0) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS))
      }
    }
  }
  return false
}

/**
 * Owns one board's live state: initial load, the Realtime subscription and its
 * reconciliation, connection status with refetch-on-reconnect, presence, and the
 * optimistic mutations (a write that fails twice resyncs from the database and
 * toasts, rather than guessing an inverse that could clobber a concurrent edit).
 */
export function useBoard(boardId: string, identity: Identity | null): UseBoard {
  const [state, setState] = useState<State>({ status: 'loading', entities: null })
  const [connection, setConnection] = useState<ConnectionStatus>('connecting')
  const { toasts, pushToast } = useToasts()

  // Latest entities for the mutation callbacks to read without listing `state`
  // as a dep (which would rebuild every handler on each change). Safe: the ref
  // is only read inside event handlers, after commit.
  const entitiesRef = useRef<BoardEntities | null>(null)
  entitiesRef.current = state.entities

  const load = useCallback(async () => {
    try {
      const data = await fetchBoard(boardId)
      setState(
        data
          ? { status: 'ready', entities: data }
          : { status: 'not-found', entities: null },
      )
    } catch (cause) {
      console.error(cause)
      setState({ status: 'error', entities: null })
    }
  }, [boardId])

  // Independent initial load so the board still appears if realtime is down.
  // A refetch on the first `live` (below) follows and reconciles any gap.
  useEffect(() => {
    let active = true
    setState({ status: 'loading', entities: null })
    fetchBoard(boardId)
      .then((data) => {
        if (!active) {
          return
        }
        setState(
          data
            ? { status: 'ready', entities: data }
            : { status: 'not-found', entities: null },
        )
      })
      .catch((cause) => {
        console.error(cause)
        if (active) {
          setState({ status: 'error', entities: null })
        }
      })
    return () => {
      active = false
    }
  }, [boardId])

  useEffect(() => {
    setConnection('connecting')
    return subscribeToBoard(boardId, {
      onChange: (event) => {
        setState((current) =>
          current.status === 'ready' && current.entities
            ? { status: 'ready', entities: reconcile(current.entities, event) }
            : current,
        )
      },
      onStatus: (status) => {
        setConnection(status)
        // Refetch once the replication bindings are actually live: on first
        // connect this closes the gap between SUBSCRIBED and bindings being
        // ready; on reconnect it catches anything missed during the outage.
        if (status === 'live') {
          void load()
        }
      },
    })
    // `load` only changes with `boardId` (already a dep); listed so a future
    // dep added to `load` doesn't silently stop recreating the channel.
  }, [boardId, load])

  useEffect(() => {
    if (state.status === 'ready' && identity) {
      joinBoard(boardId, identity).catch(console.error)
    }
  }, [state.status, identity, boardId])

  const patch = useCallback((update: (entities: BoardEntities) => BoardEntities) => {
    setState((current) =>
      current.status === 'ready' && current.entities
        ? { status: 'ready', entities: update(current.entities) }
        : current,
    )
  }, [])

  /** Applies an optimistic change and writes it (retrying once). If the write
   *  ultimately fails, toasts and resyncs from the database rather than applying
   *  a guessed inverse that could clobber a concurrent edit. */
  const optimisticMutate = useCallback(
    (apply: (entities: BoardEntities) => BoardEntities, write: () => Promise<unknown>) => {
      patch(apply)
      void withRetry(write).then((ok) => {
        if (!ok) {
          pushToast(SAVE_FAILED)
          void load()
        }
      })
    },
    [patch, pushToast, load],
  )

  const addColumn = useCallback(() => {
    const entities = entitiesRef.current
    if (!entities) {
      return
    }
    const id = crypto.randomUUID()
    const lastPosition = entities.columns.length
      ? Math.max(...entities.columns.map((column) => column.position))
      : null
    const optimistic: Column = {
      id,
      boardId,
      title: 'New column',
      color: null,
      position: positionAtEnd(lastPosition),
      createdAt: new Date().toISOString(),
    }
    optimisticMutate(
      (current) => ({ ...current, columns: [...current.columns, optimistic] }),
      () => insertColumn({ id, boardId, position: optimistic.position }),
    )
  }, [boardId, optimisticMutate])

  const renameBoard = useCallback(
    (title: string) => {
      const entities = entitiesRef.current
      if (!entities) {
        return
      }
      const trimmed = title.trim()
      if (!trimmed || trimmed === entities.board.title) {
        return
      }
      optimisticMutate(
        (current) => ({ ...current, board: { ...current.board, title: trimmed } }),
        () => renameBoardRow(boardId, trimmed),
      )
    },
    [boardId, optimisticMutate],
  )

  const addNote = useCallback(
    (columnId: string, text: string) => {
      const entities = entitiesRef.current
      if (!entities || !identity) {
        return
      }
      const trimmed = text.trim()
      if (!trimmed) {
        return
      }
      const id = crypto.randomUUID()
      const columnNotes = entities.notes.filter((note) => note.columnId === columnId)
      const firstPosition = columnNotes.length
        ? Math.min(...columnNotes.map((note) => note.position))
        : null
      const optimistic: Note = {
        id,
        boardId,
        columnId,
        text: trimmed,
        priority: 'none',
        authorId: identity.id,
        authorName: identity.name,
        position: positionAtStart(firstPosition),
        createdAt: new Date().toISOString(),
      }
      optimisticMutate(
        (current) => ({ ...current, notes: [...current.notes, optimistic] }),
        () =>
          insertNote({
            id,
            boardId,
            columnId,
            text: trimmed,
            authorId: identity.id,
            authorName: identity.name,
            position: optimistic.position,
          }),
      )
    },
    [boardId, identity, optimisticMutate],
  )

  const editNote = useCallback(
    (noteId: string, text: string) => {
      const existing = entitiesRef.current?.notes.find((note) => note.id === noteId)
      if (!existing) {
        return
      }
      const trimmed = text.trim()
      if (!trimmed || trimmed === existing.text) {
        return
      }
      optimisticMutate(
        (current) => ({
          ...current,
          notes: current.notes.map((note) =>
            note.id === noteId ? { ...note, text: trimmed } : note,
          ),
        }),
        () => updateNoteText(noteId, trimmed),
      )
    },
    [optimisticMutate],
  )

  const deleteNote = useCallback(
    (noteId: string) => {
      const removed = entitiesRef.current?.notes.find((note) => note.id === noteId)
      if (!removed) {
        return
      }
      optimisticMutate(
        (current) => ({ ...current, notes: current.notes.filter((n) => n.id !== noteId) }),
        () => deleteNoteRow(noteId),
      )
    },
    [optimisticMutate],
  )

  const columns = useMemo(
    () => (state.entities ? [...state.entities.columns].sort(byPosition) : EMPTY_COLUMNS),
    [state.entities],
  )
  const notesByColumn = useMemo(
    () => groupByColumn(state.entities ? state.entities.notes : EMPTY_NOTES),
    [state.entities],
  )

  return {
    status: state.status,
    board: state.entities?.board ?? null,
    columns,
    notesByColumn,
    connection,
    toasts,
    addColumn,
    renameBoard,
    addNote,
    editNote,
    deleteNote,
  }
}
