import type { ReactElement } from 'react'
import type { PresenceParticipant } from '../lib/presence'

const MAX_SHOWN = 5

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? '?'
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}

export function PresenceStrip({
  participants,
}: {
  participants: PresenceParticipant[]
}): ReactElement | null {
  if (participants.length === 0) {
    return null
  }
  const shown = participants.slice(0, MAX_SHOWN)
  const overflow = participants.length - shown.length

  return (
    <div
      className="presence-strip"
      aria-label={`${participants.length} viewing: ${participants.map((p) => p.name).join(', ')}`}
    >
      {shown.map((participant) => (
        <span key={participant.id} className="presence-avatar" title={participant.name}>
          {initials(participant.name)}
        </span>
      ))}
      {overflow > 0 && <span className="presence-more">+{overflow}</span>}
    </div>
  )
}
