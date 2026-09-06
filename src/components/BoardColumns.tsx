import type { ReactElement } from 'react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
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
import { BoardColumn } from './BoardColumn'

/** The horizontal, drag-reorderable row of columns (plus the add-column tile). */
export function BoardColumns({ board }: { board: UseBoard }): ReactElement {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd(event: DragEndEvent): void {
    const { active, over } = event
    if (over && active.id !== over.id) {
      board.moveColumn(
        String(active.id),
        board.columns.findIndex((column) => column.id === over.id),
      )
    }
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
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
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
