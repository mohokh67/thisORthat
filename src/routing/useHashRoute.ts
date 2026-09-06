import { useSyncExternalStore } from 'react'
import { parseHash, type Route } from './parseHash'

function subscribe(onChange: () => void): () => void {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

function getSnapshot(): string {
  return window.location.hash
}

/** The current Route, re-rendering the caller whenever the hash changes. */
export function useHashRoute(): Route {
  const hash = useSyncExternalStore(subscribe, getSnapshot)
  return parseHash(hash)
}

export function navigate(hash: string): void {
  window.location.hash = hash
}
