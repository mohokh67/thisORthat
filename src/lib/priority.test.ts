import { describe, expect, it } from 'vitest'
import { nextPriority } from './priority'

describe('nextPriority', () => {
  it('steps none -> low -> medium -> high', () => {
    expect(nextPriority('none')).toBe('low')
    expect(nextPriority('low')).toBe('medium')
    expect(nextPriority('medium')).toBe('high')
  })

  it('wraps high back to none', () => {
    expect(nextPriority('high')).toBe('none')
  })

  it('completes a full cycle in four steps', () => {
    let priority = nextPriority('none')
    priority = nextPriority(priority)
    priority = nextPriority(priority)
    priority = nextPriority(priority)
    expect(priority).toBe('none')
  })
})
