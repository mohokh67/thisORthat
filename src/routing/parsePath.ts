export type Route =
  | { name: 'landing' }
  | { name: 'board'; boardId: string }

/**
 * Maps `window.location.pathname` to a Route. Unrecognised paths fall back to
 * the landing page. `/b/<id>` is the only board pattern; the id is whatever sits
 * between the slashes, validated (as a real Board) only once it is fetched.
 */
export function parsePath(pathname: string): Route {
  const match = /^\/b\/([^/]+)\/?$/.exec(pathname)
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

export function boardPath(boardId: string): string {
  return `/b/${encodeURIComponent(boardId)}`
}
