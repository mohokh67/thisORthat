import { describe, expect, it } from 'vitest'
import { points, resolveVote } from './voteMath'

describe('resolveVote', () => {
  it('sets the arrow when there is no current vote', () => {
    expect(resolveVote(null, 1)).toEqual({ action: 'set', value: 1 })
    expect(resolveVote(null, -1)).toEqual({ action: 'set', value: -1 })
  })

  it('clears the vote when the same arrow is clicked again', () => {
    expect(resolveVote(1, 1)).toEqual({ action: 'clear' })
    expect(resolveVote(-1, -1)).toEqual({ action: 'clear' })
  })

  it('switches to the opposite arrow', () => {
    expect(resolveVote(-1, 1)).toEqual({ action: 'set', value: 1 })
    expect(resolveVote(1, -1)).toEqual({ action: 'set', value: -1 })
  })
})

describe('points', () => {
  it('is 0 for no votes', () => {
    expect(points([])).toBe(0)
  })

  it('sums up votes', () => {
    expect(points([{ value: 1 }, { value: 1 }, { value: 1 }])).toBe(3)
  })

  it('nets ups against downs', () => {
    expect(points([{ value: 1 }, { value: -1 }])).toBe(0)
  })

  it('can be negative', () => {
    expect(points([{ value: -1 }, { value: -1 }, { value: 1 }])).toBe(-1)
  })
})
