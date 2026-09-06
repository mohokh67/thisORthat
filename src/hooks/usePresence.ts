import { useEffect, useState } from 'react'
import { subscribeToPresence, type PresenceParticipant } from '../lib/presence'
import type { Identity } from '../lib/identity'

const NONE: PresenceParticipant[] = []

/** The participants currently viewing the board (empty until a name is set). */
export function usePresence(boardId: string, identity: Identity | null): PresenceParticipant[] {
  const [participants, setParticipants] = useState<PresenceParticipant[]>(NONE)

  useEffect(() => {
    if (!identity) {
      setParticipants(NONE)
      return
    }
    return subscribeToPresence(boardId, identity, setParticipants)
  }, [boardId, identity])

  return participants
}
