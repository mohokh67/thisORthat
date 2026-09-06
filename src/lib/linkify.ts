export type TextSegment =
  | { type: 'text'; value: string }
  | { type: 'link'; value: string; href: string }

const URL_PATTERN = /\bhttps?:\/\/[^\s<>]+/gi
const TRAILING_SENTENCE_PUNCTUATION = /[.,;:!?'"]+$/

function splitTrailing(raw: string): { href: string; trailing: string } {
  let href = raw
  let trailing = ''

  const punctuation = TRAILING_SENTENCE_PUNCTUATION.exec(href)
  if (punctuation) {
    trailing = punctuation[0]
    href = href.slice(0, -punctuation[0].length)
  }

  // A closing paren is part of the URL only if it has a matching opening one
  // (e.g. Wikipedia article URLs); otherwise it closes surrounding prose.
  while (href.endsWith(')') && !href.includes('(')) {
    trailing = `)${trailing}`
    href = href.slice(0, -1)
  }

  return { href, trailing }
}

/**
 * Splits text into plain and link segments, recognising bare http(s) URLs only.
 * Line breaks in the plain segments are preserved by the caller; no markdown or
 * other markup is interpreted.
 */
export function linkify(text: string): TextSegment[] {
  const segments: TextSegment[] = []
  let cursor = 0

  for (const match of text.matchAll(URL_PATTERN)) {
    const start = match.index ?? 0
    const { href, trailing } = splitTrailing(match[0])

    if (!/^https?:\/\/\S/.test(href)) {
      continue
    }

    if (start > cursor) {
      segments.push({ type: 'text', value: text.slice(cursor, start) })
    }
    segments.push({ type: 'link', value: href, href })
    if (trailing) {
      segments.push({ type: 'text', value: trailing })
    }
    cursor = start + match[0].length
  }

  if (cursor < text.length) {
    segments.push({ type: 'text', value: text.slice(cursor) })
  }

  return segments
}
