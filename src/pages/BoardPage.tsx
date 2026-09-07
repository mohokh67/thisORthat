import { useCallback, useEffect, useRef, useState, type ReactElement } from 'react'
import { createIdentity, loadIdentity, normalizeName, saveIdentity, type Identity } from '../lib/identity'
import { navigate } from '../routing/useRoute'
import { useBoard } from '../hooks/useBoard'
import { usePresence } from '../hooks/usePresence'
import { useSortLenses } from '../hooks/useSortLenses'
import { useActivityLog } from '../hooks/useActivityLog'
import { fetchAllEvents } from '../lib/events'
import { orderNotes } from '../lib/sortLens'
import {
  boardToJson,
  boardToMarkdown,
  eventsToCsv,
  exportFilename,
  type MarkdownSection,
} from '../lib/exportBoard'
import { triggerDownload } from '../lib/download'
import { touchRecentBoard } from '../lib/recentBoards'
import { NotFoundPage } from './NotFoundPage'
import { EditableTitle } from '../components/EditableTitle'
import { ExportMenu, type ExportFormat } from '../components/ExportMenu'
import { IdentityBadge } from '../components/IdentityBadge'
import { NameModal } from '../components/NameModal'
import { BoardColumns } from '../components/BoardColumns'
import { BoardTimestamps } from '../components/BoardTimestamps'
import { HomeLink } from '../components/HomeLink'
import { PresenceStrip } from '../components/PresenceStrip'
import { ThemeToggle } from '../components/ThemeToggle'
import { LogDrawer } from '../components/LogDrawer'
import { Toasts } from '../components/Toasts'

export function BoardPage({ boardId }: { boardId: string }): ReactElement {
  const [identity, setIdentity] = useState<Identity | null>(() => loadIdentity())
  const board = useBoard(boardId, identity)
  const presence = usePresence(boardId, identity)
  const lenses = useSortLenses(boardId)
  const { events, unseenCount, markSeen, hasMore, loadingMore, loadMore } = useActivityLog(
    boardId,
    identity,
  )
  const [logOpen, setLogOpen] = useState(false)
  // Snapshot on mount, matching how LandingPage renders relative times.
  const [now] = useState(() => Date.now())
  // "Updated" is the newest activity-log entry; null until the board has one.
  const lastActivityAt = events[0]?.createdAt ?? null
  const { pushToast } = board
  // Guards against overlapping whole-history export walks on rapid clicks.
  const exportingRef = useRef(false)

  // While the drawer is open, keep the log marked seen so the dot stays clear
  // as new entries stream in.
  useEffect(() => {
    if (logOpen) {
      markSeen()
    }
  }, [logOpen, events, markSeen])

  // Record this board in the device-local "recent boards" list on open and
  // whenever its title changes.
  const boardTitle = board.board?.title
  useEffect(() => {
    if (boardTitle) {
      touchRecentBoard({ id: boardId, title: boardTitle })
    }
  }, [boardId, boardTitle])

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

  const handleShare = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      pushToast('Link copied')
    } catch {
      pushToast('Could not copy the link')
    }
  }, [pushToast])

  // Passed to un-memoised children, so a plain async function is honest here —
  // a useCallback keyed on the fresh `board` object would rebuild every render.
  const handleExport = async (format: ExportFormat): Promise<void> => {
    const current = board.board
    if (!current || exportingRef.current) {
      return
    }
    exportingRef.current = true
    try {
      if (format === 'markdown') {
        const pointsByNoteId = new Map(
          [...board.voteState].map(([noteId, state]) => [noteId, state.points]),
        )
        const sections: MarkdownSection[] = board.columns.map((column) => {
          const notes = orderNotes(
            board.notesByColumn.get(column.id) ?? [],
            lenses.lensFor(column.id),
            pointsByNoteId,
          )
          return {
            title: column.title,
            notes: notes.map((note) => ({
              text: note.text,
              points: pointsByNoteId.get(note.id) ?? 0,
              priority: note.priority,
              author: note.authorName,
            })),
          }
        })
        triggerDownload(
          exportFilename(current.title, new Date(), 'md'),
          'text/markdown;charset=utf-8',
          boardToMarkdown({ title: current.title, sections }),
        )
        return
      }
      const allEvents = await fetchAllEvents(boardId)
      triggerDownload(
        exportFilename(current.title, new Date(), 'json'),
        'application/json;charset=utf-8',
        `${JSON.stringify(
          boardToJson({
            board: current,
            columns: board.columns,
            notes: board.notes,
            votes: board.votes,
            events: allEvents,
          }),
          null,
          2,
        )}\n`,
      )
    } catch {
      pushToast('Could not build the export')
    } finally {
      exportingRef.current = false
    }
  }

  const handleExportCsv = async (): Promise<void> => {
    const current = board.board
    if (!current || exportingRef.current) {
      return
    }
    exportingRef.current = true
    try {
      const allEvents = await fetchAllEvents(boardId)
      triggerDownload(
        exportFilename(current.title, new Date(), 'csv'),
        'text/csv;charset=utf-8',
        eventsToCsv(allEvents),
      )
    } catch {
      pushToast('Could not export the log')
    } finally {
      exportingRef.current = false
    }
  }

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
        <button type="button" onClick={() => navigate('/')}>
          Back to start
        </button>
      </main>
    )
  }

  if (!identity) {
    return (
      <div className="board">
        <header className="board-header">
          <div className="board-header-left">
            <HomeLink />
            <div className="board-heading">
              <h1 className="editable-title">{board.board.title}</h1>
              <BoardTimestamps
                createdAt={board.board.createdAt}
                updatedAt={lastActivityAt}
                now={now}
              />
            </div>
          </div>
        </header>
        <NameModal onSubmit={handleNameSubmit} />
      </div>
    )
  }

  return (
    <div className="board">
      <header className="board-header">
        <div className="board-header-left">
          <HomeLink />
          <div className="board-heading">
            <EditableTitle value={board.board.title} onCommit={board.renameBoard} />
            <BoardTimestamps
              createdAt={board.board.createdAt}
              updatedAt={lastActivityAt}
              now={now}
            />
          </div>
        </div>
        <div className="board-header-right">
          <ThemeToggle />
          <PresenceStrip participants={presence} />
          {board.connection === 'reconnecting' && (
            <span className="conn-chip">Reconnecting…</span>
          )}
          <button type="button" className="share-button" onClick={handleShare}>
            Share
          </button>
          <ExportMenu onExport={handleExport} />
          <button
            type="button"
            className="log-button"
            aria-label={
              unseenCount > 0 ? `Activity log, ${unseenCount} new` : 'Activity log'
            }
            aria-pressed={logOpen}
            onClick={() => setLogOpen((open) => !open)}
          >
            Log
            {unseenCount > 0 && <span className="log-dot" aria-hidden="true" />}
          </button>
          <IdentityBadge name={identity.name} onRename={handleIdentityRename} />
        </div>
      </header>

      <BoardColumns board={board} lenses={lenses} />

      <Toasts toasts={board.toasts} />
      <LogDrawer
        events={events}
        open={logOpen}
        onClose={() => setLogOpen(false)}
        hasMore={hasMore}
        loadingMore={loadingMore}
        onLoadMore={loadMore}
        onExportCsv={handleExportCsv}
      />
    </div>
  )
}
