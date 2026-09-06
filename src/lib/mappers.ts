import type { Board, Column, Note, Priority, TemplateName } from './types'

export interface BoardRow {
  id: string
  title: string
  template: string
  created_at: string
}

export interface ColumnRow {
  id: string
  board_id: string
  title: string
  color: string | null
  position: number
  created_at: string
}

export interface NoteRow {
  id: string
  board_id: string
  column_id: string
  text: string
  priority: string
  author_id: string
  author_name: string
  position: number
  created_at: string
}

export function toBoard(row: BoardRow): Board {
  return {
    id: row.id,
    title: row.title,
    template: row.template as TemplateName,
    createdAt: row.created_at,
  }
}

export function toColumn(row: ColumnRow): Column {
  return {
    id: row.id,
    boardId: row.board_id,
    title: row.title,
    color: (row.color as Column['color']) ?? null,
    position: row.position,
    createdAt: row.created_at,
  }
}

export function toNote(row: NoteRow): Note {
  return {
    id: row.id,
    boardId: row.board_id,
    columnId: row.column_id,
    text: row.text,
    priority: row.priority as Priority,
    authorId: row.author_id,
    authorName: row.author_name,
    position: row.position,
    createdAt: row.created_at,
  }
}
