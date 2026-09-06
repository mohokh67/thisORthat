import type { VoteValue } from './types'

export type VoteResolution = { action: 'set'; value: VoteValue } | { action: 'clear' }

/**
 * What clicking `clicked` does given the participant's `current` vote on a note:
 * clicking the arrow you already have clears it; anything else sets that arrow
 * (a fresh vote, or a switch from the opposite one).
 */
export function resolveVote(current: VoteValue | null, clicked: VoteValue): VoteResolution {
  return current === clicked ? { action: 'clear' } : { action: 'set', value: clicked }
}

/** Net points for a note: up votes (+1) minus down votes (-1); may be negative. */
export function points(votes: readonly { value: number }[]): number {
  return votes.reduce((total, vote) => total + vote.value, 0)
}
