export type TemplateName = 'positive-negative' | 'start-stop-continue' | 'blank'

export type ColumnColor =
  | 'gray'
  | 'red'
  | 'orange'
  | 'green'
  | 'blue'
  | 'purple'

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

export interface BoardWithColumns {
  board: Board
  columns: Column[]
}
