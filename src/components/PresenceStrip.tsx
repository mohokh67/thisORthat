import type { ReactElement } from 'react'
import type { PresenceParticipant } from '../lib/presence'
import { initials } from '../lib/initials'

const MAX_SHOWN = 5

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
