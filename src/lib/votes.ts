import { supabase } from './supabase'
import type { VoteValue } from './types'

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
