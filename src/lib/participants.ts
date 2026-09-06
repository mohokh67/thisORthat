import { supabase } from './supabase'
import type { Identity } from './identity'

/**
 * Records (or refreshes) this participant's presence row for a Board. Called on
 * entering a board and after a name change. Keyed by (participant_id, board_id),
 * so a participant has exactly one row per board.
 */
export async function joinBoard(boardId: string, identity: Identity): Promise<void> {
  const { error } = await supabase.from('participants').upsert(
    {
      participant_id: identity.id,
      board_id: boardId,
      name: identity.name,
      last_seen: new Date().toISOString(),
    },
    { onConflict: 'participant_id,board_id' },
  )
  if (error) {
    throw error
  }
}
