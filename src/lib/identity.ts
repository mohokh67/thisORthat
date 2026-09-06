export interface Identity {
  id: string
  name: string
}

const STORAGE_KEY = 'thisorthat.participant'
export const MAX_NAME_LENGTH = 80

/** Trims and length-caps a raw name string. */
export function normalizeName(raw: string): string {
  return raw.trim().slice(0, MAX_NAME_LENGTH)
}

export function isIdentity(value: unknown): value is Identity {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.id === 'string' &&
    candidate.id.length > 0 &&
    typeof candidate.name === 'string' &&
    candidate.name.trim().length > 0
  )
}

/** Parses a stored identity string, returning null for absent or malformed data. */
export function parseStoredIdentity(raw: string | null): Identity | null {
  if (!raw) {
    return null
  }
  try {
    const parsed: unknown = JSON.parse(raw)
    return isIdentity(parsed) ? { id: parsed.id, name: normalizeName(parsed.name) } : null
  } catch {
    return null
  }
}

/** Mints a new device identity with a random participant id and a normalized name. */
export function createIdentity(name: string): Identity {
  return { id: crypto.randomUUID(), name: normalizeName(name) }
}

export function loadIdentity(): Identity | null {
  try {
    return parseStoredIdentity(localStorage.getItem(STORAGE_KEY))
  } catch {
    return null
  }
}

export function saveIdentity(identity: Identity): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(identity))
  } catch {
    // Private-mode or storage-disabled: identity simply won't persist.
  }
}
