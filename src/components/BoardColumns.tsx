import type { ReactElement } from 'react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import type { UseBoard } from '../hooks/useBoard'
import type { SortLenses } from '../hooks/useSortLenses'
import { BoardColumn } from './BoardColumn'

/** The horizontal, drag-reorderable row of columns (plus the add-column tile). */
export function BoardColumns({
  board,
  lenses,
}: {
  board: UseBoard
  lenses: SortLenses
}): ReactElement {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd(event: DragEndEvent): void {
    const { active, over } = event
    if (!over) {
      return
    }
    const activeType = active.data.current?.type
    const overColumnId = over.data.current?.columnId as string | undefined
    if (!overColumnId) {
      return
    }

    if (activeType === 'column') {
      if (over.data.current?.type === 'column' && active.id !== over.id) {
        board.moveColumn(
          String(active.id),
          board.columns.findIndex((column) => column.id === overColumnId),
        )
      }
      return
    }

    if (activeType !== 'note') {
      return
    }

    const fromColumnId = active.data.current?.columnId as string
    const sameColumn = overColumnId === fromColumnId
    const targetLens = lenses.lensFor(overColumnId)

    // A drop that stays in the column is a no-op when it lands on itself, or
    // whenever the column is under a non-Custom lens (in-column reorder is
    // meaningless there). Dragging the note out to another column still works.
    if (sameColumn && (active.id === over.id || targetLens !== 'custom')) {
      return
    }

    // Translate the drop into an index within the target column's shared
    // (Custom) order — the only order `moveNote` ever writes.
    const customIds = (board.notesByColumn.get(overColumnId) ?? []).map((note) => note.id)
    const overIsNote = over.data.current?.type === 'note'

    let targetIndex: number
    if (overIsNote && targetLens === 'custom') {
      const overIndex = customIds.indexOf(String(over.id))
      targetIndex = overIndex === -1 ? customIds.length : overIndex
    } else if (sameColumn || targetLens === 'custom') {
      // Dropped on the column body (not a note): append to the shared order.
      targetIndex = customIds.length
    } else {
      // Cross-column drop onto a lens-sorted column: land at the top of the
      // shared order, since there is no meaningful drop position.
      targetIndex = 0
    }

    board.moveNote(String(active.id), overColumnId, targetIndex)
  }

  if (board.columns.length === 0) {
    return (
      <div className="board-empty">
        <p>This board has no columns yet.</p>
        <button type="button" onClick={board.addColumn}>
          Add your first column
        </button>
      </div>
    )
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div className="columns-row">
        <SortableContext
          items={board.columns.map((column) => column.id)}
          strategy={horizontalListSortingStrategy}
        >
          {board.columns.map((column) => (
            <BoardColumn
              key={column.id}
              column={column}
              notes={board.notesByColumn.get(column.id) ?? []}
              voteState={board.voteState}
              lens={lenses.lensFor(column.id)}
              onLensChange={lenses.setLens}
              onRename={board.renameColumn}
              onRecolor={board.recolorColumn}
              onDeleteColumn={board.deleteColumn}
              onAddNote={board.addNote}
              onEditNote={board.editNote}
              onCyclePriority={board.cyclePriority}
              onDeleteNote={board.deleteNote}
              onVote={board.vote}
            />
          ))}
        </SortableContext>
        <button type="button" className="column-add" onClick={board.addColumn}>
          + Add column
        </button>
      </div>
    </DndContext>
  )
}
