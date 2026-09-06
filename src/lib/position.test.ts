import { describe, expect, it } from 'vitest'
import {
  isPrecisionExhausted,
  positionAtEnd,
  positionAtStart,
  positionBetween,
  positionForIndex,
  reindexed,
} from './position'

describe('positionAtStart', () => {
  it('is 0 for an empty column', () => {
    expect(positionAtStart(null)).toBe(0)
  })

  it('is one gap below the current first position', () => {
    expect(positionAtStart(0)).toBe(-1)
    expect(positionAtStart(5)).toBe(4)
  })
})

describe('positionAtEnd', () => {
  it('is 0 for an empty column', () => {
    expect(positionAtEnd(null)).toBe(0)
  })

  it('is one gap above the current last position', () => {
    expect(positionAtEnd(3)).toBe(4)
  })
})

describe('positionBetween', () => {
  it('is the midpoint of two neighbours', () => {
    expect(positionBetween(0, 1)).toBe(0.5)
    expect(positionBetween(0, 0.5)).toBe(0.25)
    expect(positionBetween(2, 8)).toBe(5)
  })
})

describe('isPrecisionExhausted', () => {
  it('is false when a midpoint fits between the neighbours', () => {
    expect(isPrecisionExhausted(0, 1)).toBe(false)
    expect(isPrecisionExhausted(0, Number.EPSILON * 4)).toBe(false)
  })

  it('is true when the neighbours are one ULP apart', () => {
    expect(isPrecisionExhausted(1, 1 + Number.EPSILON)).toBe(true)
  })

  it('is true when the neighbours are equal', () => {
    expect(isPrecisionExhausted(2, 2)).toBe(true)
  })
})

describe('reindexed', () => {
  it('returns nothing for an empty column', () => {
    expect(reindexed(0)).toEqual([])
  })

  it('returns evenly-spaced ordered positions', () => {
    expect(reindexed(4)).toEqual([0, 1, 2, 3])
  })
})

describe('positionForIndex', () => {
  it('is 0 when there are no other items', () => {
    expect(positionForIndex([], 0)).toBe(0)
  })

  it('goes before the first item when dropped at the start', () => {
    expect(positionForIndex([0, 1, 2], 0)).toBe(-1)
  })

  it('goes after the last item when dropped at the end', () => {
    expect(positionForIndex([0, 1, 2], 3)).toBe(3)
  })

  it('is the midpoint of the flanking items for a middle drop', () => {
    expect(positionForIndex([0, 2, 4], 1)).toBe(1)
    expect(positionForIndex([0, 2, 4], 2)).toBe(3)
  })

  it('clamps a negative or oversized index to the ends', () => {
    expect(positionForIndex([0, 1], -3)).toBe(-1)
    expect(positionForIndex([0, 1], 9)).toBe(2)
  })
})
