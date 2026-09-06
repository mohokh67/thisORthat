export type Route =
  | { name: 'landing' }
  | { name: 'board'; boardId: string }

/**
 * Maps `window.location.hash` to a Route. Unrecognised hashes fall back to the
 * landing page. `#/b/<id>` is the only board pattern; the id is whatever sits
 * between the slashes, validated (as a real Board) only once it is fetched.
 */
export function parseHash(hash: string): Route {
  const path = hash.replace(/^#/, '')
  const match = /^\/b\/([^/]+)\/?$/.exec(path)
  if (match) {
    return { name: 'board', boardId: safeDecode(match[1]) }
  }
  return { name: 'landing' }
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export function boardHash(boardId: string): string {
  return `#/b/${encodeURIComponent(boardId)}`
}
