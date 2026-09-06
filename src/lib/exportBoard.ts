import { describeEvent } from './activity'
import type { ActivityEvent, Board, Column, Note, Priority, Vote } from './types'

/** One note as it appears in the Markdown summary, already annotated by the caller. */
export interface MarkdownNote {
  text: string
  points: number
  priority: Priority
  author: string
}

export interface MarkdownSection {
  title: string
  notes: MarkdownNote[]
}

export interface MarkdownInput {
  title: string
  /** Columns in the order they should appear, each with its notes pre-ordered. */
  sections: MarkdownSection[]
}

function oneLine(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

function bullet(note: MarkdownNote): string {
  const count = `${note.points} ${Math.abs(note.points) === 1 ? 'point' : 'points'}`
  const priority = note.priority === 'none' ? '' : `priority: ${note.priority}, `
  return `- ${oneLine(note.text)} (${count}, ${priority}${note.author})`
}

/**
 * A readable Markdown summary of a Board: the title as an H1, each column as an
 * H2 in the supplied (on-screen) order, and every note as an annotated bullet.
 * Points are always shown, priority only when set. The Activity log is excluded.
 */
export function boardToMarkdown(input: MarkdownInput): string {
  const blocks = [`# ${input.title}`]
  for (const section of input.sections) {
    const body = section.notes.length
      ? section.notes.map(bullet).join('\n')
      : '_No notes._'
    blocks.push(`## ${section.title}\n\n${body}`)
  }
  return `${blocks.join('\n\n')}\n`
}

export interface JsonInput {
  board: Board
  columns: Column[]
  notes: Note[]
  votes: Vote[]
  events: ActivityEvent[]
}

/** The complete, machine-readable Board dump: metadata plus every row, events included. */
export function boardToJson({ board, columns, notes, votes, events }: JsonInput): JsonInput {
  return { board, columns, notes, votes, events }
}

const CSV_HEADER = ['Timestamp', 'Actor', 'Action', 'Detail']

/** Characters that make a spreadsheet treat a leading cell as a formula. */
const FORMULA_LEAD = /^[=+\-@\t\r]/

function csvCell(value: string): string {
  // Board content (actor names, note text, column titles) is fully untrusted;
  // prefix any formula-looking cell with a quote so Excel / Sheets treat it as
  // text, then apply RFC-4180 quoting on top.
  const safe = FORMULA_LEAD.test(value) ? `'${value}` : value
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

function csvRow(cells: string[]): string {
  return cells.map(csvCell).join(',')
}

/** The Activity log as CSV: a header row then one row per event, newest first. */
export function eventsToCsv(events: readonly ActivityEvent[]): string {
  const rows = [csvRow(CSV_HEADER)]
  for (const event of events) {
    rows.push(csvRow([event.createdAt, event.actorName, event.action, describeEvent(event)]))
  }
  return `${rows.join('\n')}\n`
}

function slugify(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || 'board'
}

/** `<board-title-slug>-YYYY-MM-DD.<ext>` for a downloaded export. */
export function exportFilename(title: string, date: Date, ext: string): string {
  return `${slugify(title)}-${date.toISOString().slice(0, 10)}.${ext}`
}
