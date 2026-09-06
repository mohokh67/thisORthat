import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { fetchBoard, renameBoard as renameBoardRow } from '../lib/boards'
import {
  addColumn as insertColumn,
  deleteColumn as deleteColumnRow,
  moveColumn as moveColumnRow,
  recolorColumn as recolorColumnRow,
  reindexColumns,
  renameColumn as renameColumnRow,
} from '../lib/columns'
import {
  createNote as insertNote,
  deleteNote as deleteNoteRow,
  moveNoteToColumn,
  reindexNotes,
  updateNoteText,
  updateNotePriority,
  updateNotePosition,
} from '../lib/notes'
import { nextPriority } from '../lib/priority'
import { joinBoard } from '../lib/participants'
import { planInsert, planReorder, positionAtEnd, positionAtStart } from '../lib/position'
import { castVote, clearVote } from '../lib/votes'
import { points, resolveVote } from '../lib/voteMath'
import { voteId as makeVoteId } from '../lib/mappers'
import { buildEvent, type ActivityInput } from '../lib/activity'
import { logEvent } from '../lib/events'
import { reconcile, type BoardEntities } from '../lib/reconcile'
import { subscribeToBoard, type ConnectionStatus } from '../lib/realtime'
import type { Identity } from '../lib/identity'
import type { Board, Column, ColumnColor, Note, Vote, VoteValue } from '../lib/types'
import { useToasts, type Toast } from '../components/useToasts'

type Status = 'loading' | 'not-found' | 'error' | 'ready'

interface State {
  status: Status
  entities: BoardEntities | null
}

export interface NoteVoteState {
  points: number
  mine: VoteValue | null
}

export interface UseBoard {
  status: Status
  board: Board | null
  columns: Column[]
  notesByColumn: Map<string, Note[]>
  voteState: Map<string, NoteVoteState>
  connection: ConnectionStatus
  toasts: Toast[]
  addColumn: () => void
  renameColumn: (columnId: string, title: string) => void
  recolorColumn: (columnId: string, color: ColumnColor | null) => void
  moveColumn: (columnId: string, targetIndex: number) => void
  deleteColumn: (columnId: string) => void
  renameBoard: (title: string) => void
  addNote: (columnId: string, text: string) => void
  editNote: (noteId: string, text: string) => void
  cyclePriority: (noteId: string) => void
  deleteNote: (noteId: string) => void
  moveNote: (noteId: string, toColumnId: string, targetIndex: number) => void
  vote: (noteId: string, arrow: VoteValue) => void
}

const SAVE_FAILED = "Couldn't save that change. Please try again."
const EMPTY_COLUMNS: Column[] = []
const EMPTY_NOTES: Note[] = []
const EMPTY_VOTES: Vote[] = []

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
   *  a guessed inverse that could clobber a concurrent edit. On success, writes
   *  the Activity log `event` (best-effort — ADR-0002). */
  const optimisticMutate = useCallback(
    (
      apply: (entities: BoardEntities) => BoardEntities,
      write: () => Promise<unknown>,
      event?: ActivityInput,
    ) => {
      patch(apply)
      void withRetry(write).then((ok) => {
        if (!ok) {
          pushToast(SAVE_FAILED)
          void load()
          return
        }
        if (event && identity) {
          void logEvent({
            boardId,
            actorId: identity.id,
            actorName: identity.name,
            event: buildEvent(event),
          }).catch(console.error)
        }
      })
    },
    [patch, pushToast, load, boardId, identity],
  )

  /** Optimistically merges `changes` into one column and writes them. No-ops if
   *  the column is gone. */
  const patchColumn = useCallback(
    (
      columnId: string,
      changes: Partial<Column>,
      write: () => Promise<unknown>,
      event?: ActivityInput,
    ) => {
      if (!entitiesRef.current?.columns.some((column) => column.id === columnId)) {
        return
      }
      optimisticMutate(
        (current) => ({
          ...current,
          columns: current.columns.map((column) =>
            column.id === columnId ? { ...column, ...changes } : column,
          ),
        }),
        write,
        event,
      )
    },
    [optimisticMutate],
  )

  /** Optimistically merges `changes` into one note and writes them. No-ops if
   *  the note is gone. */
  const patchNote = useCallback(
    (
      noteId: string,
      changes: Partial<Note>,
      write: () => Promise<unknown>,
      event?: ActivityInput,
    ) => {
      if (!entitiesRef.current?.notes.some((note) => note.id === noteId)) {
        return
      }
      optimisticMutate(
        (current) => ({
          ...current,
          notes: current.notes.map((note) =>
            note.id === noteId ? { ...note, ...changes } : note,
          ),
        }),
        write,
        event,
      )
    },
    [optimisticMutate],
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
      { kind: 'column-added', columnId: id, title: optimistic.title },
    )
  }, [boardId, optimisticMutate])

  const renameColumn = useCallback(
    (columnId: string, title: string) => {
      const existing = entitiesRef.current?.columns.find((column) => column.id === columnId)
      const trimmed = title.trim()
      if (!existing || !trimmed || trimmed === existing.title) {
        return
      }
      patchColumn(columnId, { title: trimmed }, () => renameColumnRow(columnId, trimmed), {
        kind: 'column-renamed',
        columnId,
        from: existing.title,
        to: trimmed,
      })
    },
    [patchColumn],
  )

  const recolorColumn = useCallback(
    (columnId: string, color: ColumnColor | null) => {
      const existing = entitiesRef.current?.columns.find((column) => column.id === columnId)
      if (!existing || existing.color === color) {
        return
      }
      patchColumn(columnId, { color }, () => recolorColumnRow(columnId, color), {
        kind: 'column-recoloured',
        columnId,
        title: existing.title,
        to: color,
      })
    },
    [patchColumn],
  )

  const moveColumn = useCallback(
    (columnId: string, targetIndex: number) => {
      const entities = entitiesRef.current
      if (!entities) {
        return
      }
      const moved = entities.columns.find((column) => column.id === columnId)
      if (!moved) {
        return
      }
      const sorted = [...entities.columns]
        .sort(byPosition)
        .map((column) => ({ id: column.id, position: column.position }))
      const plan = planReorder(sorted, columnId, targetIndex)
      if (!plan) {
        return
      }
      const event: ActivityInput = {
        kind: 'column-reordered',
        columnId,
        title: moved.title,
      }
      if (plan.kind === 'move') {
        patchColumn(
          columnId,
          { position: plan.position },
          () => moveColumnRow(columnId, plan.position),
          event,
        )
        return
      }
      const positionById = new Map(plan.order.map((entry) => [entry.id, entry.position]))
      optimisticMutate(
        (current) => ({
          ...current,
          columns: current.columns.map((column) =>
            positionById.has(column.id)
              ? { ...column, position: positionById.get(column.id) as number }
              : column,
          ),
        }),
        () => reindexColumns(plan.order),
        event,
      )
    },
    [optimisticMutate, patchColumn],
  )

  const deleteColumn = useCallback(
    (columnId: string) => {
      const entities = entitiesRef.current
      const existing = entities?.columns.find((column) => column.id === columnId)
      if (!entities || !existing) {
        return
      }
      const noteCount = entities.notes.filter((note) => note.columnId === columnId).length
      optimisticMutate(
        (current) => ({
          ...current,
          columns: current.columns.filter((column) => column.id !== columnId),
          notes: current.notes.filter((note) => note.columnId !== columnId),
        }),
        () => deleteColumnRow(columnId),
        { kind: 'column-deleted', columnId, title: existing.title, noteCount },
      )
    },
    [optimisticMutate],
  )

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
        { kind: 'board-renamed', boardId, from: entities.board.title, to: trimmed },
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
      const columnTitle =
        entities.columns.find((column) => column.id === columnId)?.title ?? ''
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
        { kind: 'note-created', noteId: id, text: trimmed, columnTitle },
      )
    },
    [boardId, identity, optimisticMutate],
  )

  const editNote = useCallback(
    (noteId: string, text: string) => {
      const existing = entitiesRef.current?.notes.find((note) => note.id === noteId)
      const trimmed = text.trim()
      if (!existing || !trimmed || trimmed === existing.text) {
        return
      }
      patchNote(noteId, { text: trimmed }, () => updateNoteText(noteId, trimmed), {
        kind: 'note-edited',
        noteId,
        text: trimmed,
      })
    },
    [patchNote],
  )

  const cyclePriority = useCallback(
    (noteId: string) => {
      const existing = entitiesRef.current?.notes.find((note) => note.id === noteId)
      if (!existing) {
        return
      }
      const priority = nextPriority(existing.priority)
      patchNote(noteId, { priority }, () => updateNotePriority(noteId, priority), {
        kind: 'note-reprioritised',
        noteId,
        text: existing.text,
        from: existing.priority,
        to: priority,
      })
    },
    [patchNote],
  )

  const deleteNote = useCallback(
    (noteId: string) => {
      const entities = entitiesRef.current
      const removed = entities?.notes.find((note) => note.id === noteId)
      if (!entities || !removed) {
        return
      }
      const columnTitle =
        entities.columns.find((column) => column.id === removed.columnId)?.title ?? ''
      optimisticMutate(
        (current) => ({ ...current, notes: current.notes.filter((n) => n.id !== noteId) }),
        () => deleteNoteRow(noteId),
        { kind: 'note-deleted', noteId, text: removed.text, columnTitle },
      )
    },
    [optimisticMutate],
  )

  /**
   * Reorders a note within its column, or moves it into another column, placing
   * it at `targetIndex` in the target column's shared Custom (position) order —
   * a single fractional-position update, or a full column reindex when the
   * flanking positions can no longer fit a value between them.
   */
  const moveNote = useCallback(
    (noteId: string, toColumnId: string, targetIndex: number) => {
      const entities = entitiesRef.current
      if (!entities) {
        return
      }
      const note = entities.notes.find((n) => n.id === noteId)
      if (!note || !entities.columns.some((column) => column.id === toColumnId)) {
        return
      }
      const sameColumn = note.columnId === toColumnId

      // For a reorder this list holds the moved note; for a cross-column move it
      // is the destination column without it — the shape each planner expects.
      const columnNotes = [...entities.notes]
        .filter((n) => n.columnId === toColumnId)
        .sort(byPosition)
        .map((n) => ({ id: n.id, position: n.position }))
      const plan = sameColumn
        ? planReorder(columnNotes, noteId, targetIndex)
        : planInsert(columnNotes, noteId, targetIndex)
      if (!plan) {
        return
      }

      // A cross-column move also carries the note's new `columnId` and is the
      // only kind logged — a pure within-column nudge is not (ADR / #13).
      const relocate = sameColumn ? {} : { columnId: toColumnId }
      const titleOf = (columnId: string) =>
        entities.columns.find((column) => column.id === columnId)?.title ?? ''
      const event: ActivityInput | undefined = sameColumn
        ? undefined
        : {
            kind: 'note-moved',
            noteId,
            text: note.text,
            fromColumn: titleOf(note.columnId),
            toColumn: titleOf(toColumnId),
          }

      if (plan.kind === 'move') {
        patchNote(
          noteId,
          { ...relocate, position: plan.position },
          () =>
            sameColumn
              ? updateNotePosition(noteId, plan.position)
              : moveNoteToColumn(noteId, toColumnId, plan.position),
          event,
        )
        return
      }

      const positionById = new Map(plan.order.map((entry) => [entry.id, entry.position]))
      const movedPosition = positionById.get(noteId) as number
      optimisticMutate(
        (current) => ({
          ...current,
          notes: current.notes.map((n) => {
            if (n.id === noteId) {
              return { ...n, ...relocate, position: movedPosition }
            }
            return positionById.has(n.id)
              ? { ...n, position: positionById.get(n.id) as number }
              : n
          }),
        }),
        sameColumn
          ? () => reindexNotes(plan.order)
          : async () => {
              await moveNoteToColumn(noteId, toColumnId, movedPosition)
              await reindexNotes(plan.order.filter((entry) => entry.id !== noteId))
            },
        event,
      )
    },
    [optimisticMutate, patchNote],
  )

  const vote = useCallback(
    (noteId: string, arrow: VoteValue) => {
      const entities = entitiesRef.current
      if (!entities || !identity) {
        return
      }
      const id = makeVoteId(noteId, identity.id)
      const current = entities.votes.find((v) => v.id === id)
      const resolution = resolveVote(current?.value ?? null, arrow)
      const noteText = entities.notes.find((n) => n.id === noteId)?.text ?? ''

      if (resolution.action === 'clear') {
        optimisticMutate(
          (state) => ({ ...state, votes: state.votes.filter((v) => v.id !== id) }),
          () => clearVote(noteId, identity.id),
          { kind: 'vote-cleared', noteId, text: noteText },
        )
        return
      }

      const optimistic: Vote = {
        id,
        boardId,
        noteId,
        participantId: identity.id,
        value: resolution.value,
      }
      optimisticMutate(
        (state) => ({
          ...state,
          votes: [...state.votes.filter((v) => v.id !== id), optimistic],
        }),
        () =>
          castVote({
            boardId,
            noteId,
            participantId: identity.id,
            value: resolution.value,
          }),
        {
          kind: current ? 'vote-changed' : 'vote-cast',
          noteId,
          text: noteText,
          direction: resolution.value === 1 ? 'up' : 'down',
        },
      )
    },
    [boardId, identity, optimisticMutate],
  )

  const columns = useMemo(
    () => (state.entities ? [...state.entities.columns].sort(byPosition) : EMPTY_COLUMNS),
    [state.entities],
  )
  const notesByColumn = useMemo(
    () => groupByColumn(state.entities ? state.entities.notes : EMPTY_NOTES),
    [state.entities],
  )
  const voteState = useMemo(() => {
    const byNote = new Map<string, Vote[]>()
    for (const vote of state.entities?.votes ?? EMPTY_VOTES) {
      const list = byNote.get(vote.noteId)
      if (list) {
        list.push(vote)
      } else {
        byNote.set(vote.noteId, [vote])
      }
    }
    const result = new Map<string, NoteVoteState>()
    for (const [noteId, votes] of byNote) {
      result.set(noteId, {
        points: points(votes),
        mine: identity
          ? (votes.find((vote) => vote.participantId === identity.id)?.value ?? null)
          : null,
      })
    }
    return result
  }, [state.entities, identity])

  return {
    status: state.status,
    board: state.entities?.board ?? null,
    columns,
    notesByColumn,
    voteState,
    connection,
    toasts,
    addColumn,
    renameColumn,
    recolorColumn,
    moveColumn,
    deleteColumn,
    renameBoard,
    addNote,
    editNote,
    cyclePriority,
    deleteNote,
    moveNote,
    vote,
  }
}
