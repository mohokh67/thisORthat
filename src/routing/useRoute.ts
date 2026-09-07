import { useSyncExternalStore } from 'react'
import { parsePath, type Route } from './parsePath'

function subscribe(onChange: () => void): () => void {
  window.addEventListener('popstate', onChange)
  return () => window.removeEventListener('popstate', onChange)
}

function getSnapshot(): string {
  return window.location.pathname
}

/** The current Route, re-rendering the caller whenever the path changes. */
export function useRoute(): Route {
  const pathname = useSyncExternalStore(subscribe, getSnapshot)
  return parsePath(pathname)
}

/**
 * Pushes a new path and notifies subscribers. `history.pushState` does not fire
 * `popstate`, so we dispatch it ourselves; back/forward and programmatic
 * navigation then flow through the same listener.
 */
export function navigate(path: string): void {
  if (path === window.location.pathname) {
    return
  }
  window.history.pushState(null, '', path)
  window.dispatchEvent(new Event('popstate'))
}
