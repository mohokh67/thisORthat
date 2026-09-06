export type TemplateName = 'positive-negative' | 'start-stop-continue' | 'blank'

export type ColumnColor =
  | 'gray'
  | 'red'
  | 'orange'
  | 'green'
  | 'blue'
  | 'purple'

/** The fixed accent-colour presets offered in the column colour picker. */
export const COLUMN_COLORS: readonly ColumnColor[] = [
  'gray',
  'red',
  'orange',
  'green',
  'blue',
  'purple',
]

export type Priority = 'none' | 'low' | 'medium' | 'high'

export interface ColumnSeed {
  title: string
  color: ColumnColor | null
}

export interface Board {
  id: string
  title: string
  template: TemplateName
  createdAt: string
}

export interface Column {
  id: string
  boardId: string
  title: string
  color: ColumnColor | null
  position: number
  createdAt: string
}

export interface Note {
  id: string
  boardId: string
  columnId: string
  text: string
  priority: Priority
  authorId: string
  authorName: string
  position: number
  createdAt: string
}

export type VoteValue = 1 | -1

export interface Vote {
  /** Derived `${noteId}:${participantId}` — votes have no surrogate id. */
  id: string
  boardId: string
  noteId: string
  participantId: string
  value: VoteValue
}

export interface BoardData {
  board: Board
  columns: Column[]
  notes: Note[]
  votes: Vote[]
}
