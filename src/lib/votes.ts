import { supabase } from './supabase'
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

export async function castVote(input: {
  boardId: string
  noteId: string
  participantId: string
  value: VoteValue
}): Promise<void> {
  const { error } = await supabase.from('votes').upsert(
    {
      board_id: input.boardId,
      note_id: input.noteId,
      participant_id: input.participantId,
      value: input.value,
    },
    { onConflict: 'note_id,participant_id' },
  )
  if (error) throw error
}

export async function clearVote(noteId: string, participantId: string): Promise<void> {
  const { error } = await supabase
    .from('votes')
    .delete()
    .eq('note_id', noteId)
    .eq('participant_id', participantId)
  if (error) throw error
}
