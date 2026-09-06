import { describe, expect, it } from 'vitest'
import { TEMPLATE_CHOICES, templateColumns } from './templates'

describe('templateColumns', () => {
  it('seeds Positive / Negative in order with accent colours', () => {
    expect(templateColumns('positive-negative')).toEqual([
      { title: 'Positive', color: 'green' },
      { title: 'Negative', color: 'red' },
    ])
  })

  it('seeds Start / Stop / Continue in order', () => {
    expect(templateColumns('start-stop-continue').map((column) => column.title)).toEqual([
      'Start',
      'Stop',
      'Continue',
    ])
  })

  it('seeds no columns for the blank template', () => {
    expect(templateColumns('blank')).toEqual([])
  })

  it('returns a fresh array each call so callers cannot mutate the template', () => {
    const first = templateColumns('positive-negative')
    first[0].title = 'Mutated'
    first.push({ title: 'Extra', color: null })

    expect(templateColumns('positive-negative')).toEqual([
      { title: 'Positive', color: 'green' },
      { title: 'Negative', color: 'red' },
    ])
  })

  it('throws on an unknown template name', () => {
    expect(() => templateColumns('retro' as never)).toThrowError(/Unknown template/)
  })
})

describe('TEMPLATE_CHOICES', () => {
  it('offers the three built-in templates with human labels', () => {
    expect(TEMPLATE_CHOICES).toEqual([
      { name: 'positive-negative', label: 'Positive / Negative' },
      { name: 'start-stop-continue', label: 'Start / Stop / Continue' },
      { name: 'blank', label: 'Blank' },
    ])
  })
})
