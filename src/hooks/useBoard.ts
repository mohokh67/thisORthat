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

/** Runs a write, retrying once. Returns whether it ultimately succeeded. */
async function withRetry(write: () => Promise<unknown>): Promise<boolean> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      await write()
      return true
    } catch (cause) {
      console.error(cause)
    }
  }
  return false
}

/**
 * Owns one board's live state: initial load, the Realtime subscription and its
 * reconciliation, connection status with refetch-on-reconnect, presence, and the
 * optimistic mutations (each rolls back and toasts if the write fails twice).
 */
export function useBoard(boardId: string, identity: Identity | null): UseBoard {
  const [state, setState] = useState<State>({ status: 'loading', entities: null })
  const [connection, setConnection] = useState<ConnectionStatus>('connecting')
  const { toasts, pushToast } = useToasts()

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

  /** Applies an optimistic change, writes it (retrying once), and on a final
   *  failure rolls the change back and shows a toast. */
  const optimisticMutate = useCallback(
    (
      apply: (entities: BoardEntities) => BoardEntities,
      rollback: (entities: BoardEntities) => BoardEntities,
      write: () => Promise<unknown>,
    ) => {
      patch(apply)
      void withRetry(write).then((ok) => {
        if (!ok) {
          patch(rollback)
          pushToast(SAVE_FAILED)
        }
      })
    },
    [patch, pushToast],
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
      (current) => ({ ...current, columns: current.columns.filter((c) => c.id !== id) }),
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
      const previous = entities.board.title
      optimisticMutate(
        (current) => ({ ...current, board: { ...current.board, title: trimmed } }),
        (current) => ({ ...current, board: { ...current.board, title: previous } }),
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
        (current) => ({ ...current, notes: current.notes.filter((n) => n.id !== id) }),
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
      const setText = (value: string) => (current: BoardEntities) => ({
        ...current,
        notes: current.notes.map((note) =>
          note.id === noteId ? { ...note, text: value } : note,
        ),
      })
      optimisticMutate(setText(trimmed), setText(existing.text), () =>
        updateNoteText(noteId, trimmed),
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
        (current) => ({ ...current, notes: [...current.notes, removed] }),
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
