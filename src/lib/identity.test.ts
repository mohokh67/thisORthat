import { describe, expect, it } from 'vitest'
import {
  createIdentity,
  isIdentity,
  normalizeName,
  parseStoredIdentity,
} from './identity'

describe('normalizeName', () => {
  it('trims surrounding whitespace', () => {
    expect(normalizeName('  Sam  ')).toBe('Sam')
  })

  it('caps length at 80 characters', () => {
    expect(normalizeName('x'.repeat(200))).toHaveLength(80)
  })
})

describe('isIdentity', () => {
  it('accepts a well-formed identity', () => {
    expect(isIdentity({ id: 'abc', name: 'Sam' })).toBe(true)
  })

  it('rejects missing or blank fields', () => {
    expect(isIdentity({ id: '', name: 'Sam' })).toBe(false)
    expect(isIdentity({ id: 'abc', name: '   ' })).toBe(false)
    expect(isIdentity({ id: 'abc' })).toBe(false)
    expect(isIdentity(null)).toBe(false)
    expect(isIdentity('abc')).toBe(false)
  })
})

describe('parseStoredIdentity', () => {
  it('returns null for absent storage', () => {
    expect(parseStoredIdentity(null)).toBeNull()
  })

  it('returns null for malformed JSON', () => {
    expect(parseStoredIdentity('{not json')).toBeNull()
  })

  it('returns null when the shape is wrong', () => {
    expect(parseStoredIdentity(JSON.stringify({ id: 'abc' }))).toBeNull()
  })

  it('reads back a stored identity', () => {
    expect(parseStoredIdentity(JSON.stringify({ id: 'abc', name: 'Sam' }))).toEqual({
      id: 'abc',
      name: 'Sam',
    })
  })
})

describe('createIdentity', () => {
  it('mints a distinct id each call and normalizes the name', () => {
    const first = createIdentity('  Priya  ')
    const second = createIdentity('Priya')
    expect(first.name).toBe('Priya')
    expect(first.id).not.toBe(second.id)
    expect(isIdentity(first)).toBe(true)
  })
})
