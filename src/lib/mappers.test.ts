import { describe, expect, it } from 'vitest'
import { toVote, voteId } from './mappers'

describe('voteId', () => {
  it('joins note and participant ids', () => {
    expect(voteId('n1', 'p1')).toBe('n1:p1')
  })
})

describe('toVote', () => {
  it('maps a row and derives the id from note + participant', () => {
    expect(
      toVote({ board_id: 'b1', note_id: 'n1', participant_id: 'p1', value: -1 }),
    ).toEqual({
      id: 'n1:p1',
      boardId: 'b1',
      noteId: 'n1',
      participantId: 'p1',
      value: -1,
    })
  })
})
