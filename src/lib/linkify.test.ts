import { describe, expect, it } from 'vitest'
import { linkify } from './linkify'

describe('linkify', () => {
  it('returns nothing for an empty string', () => {
    expect(linkify('')).toEqual([])
  })

  it('leaves plain text untouched', () => {
    expect(linkify('just some words, no links here')).toEqual([
      { type: 'text', value: 'just some words, no links here' },
    ])
  })

  it('splits a URL out of surrounding text', () => {
    expect(linkify('see https://example.com now')).toEqual([
      { type: 'text', value: 'see ' },
      { type: 'link', value: 'https://example.com', href: 'https://example.com' },
      { type: 'text', value: ' now' },
    ])
  })

  it('keeps trailing sentence punctuation out of the link', () => {
    expect(linkify('read https://example.com/page.')).toEqual([
      { type: 'text', value: 'read ' },
      {
        type: 'link',
        value: 'https://example.com/page',
        href: 'https://example.com/page',
      },
      { type: 'text', value: '.' },
    ])
  })

  it('excludes a bare closing paren but keeps balanced ones', () => {
    expect(linkify('(https://example.com)')).toEqual([
      { type: 'text', value: '(' },
      { type: 'link', value: 'https://example.com', href: 'https://example.com' },
      { type: 'text', value: ')' },
    ])

    expect(linkify('https://en.wikipedia.org/wiki/Foo_(bar)')).toEqual([
      {
        type: 'link',
        value: 'https://en.wikipedia.org/wiki/Foo_(bar)',
        href: 'https://en.wikipedia.org/wiki/Foo_(bar)',
      },
    ])
  })

  it('detects multiple URLs in one string', () => {
    const segments = linkify('a https://one.example b http://two.example c')
    expect(segments.filter((segment) => segment.type === 'link')).toEqual([
      { type: 'link', value: 'https://one.example', href: 'https://one.example' },
      { type: 'link', value: 'http://two.example', href: 'http://two.example' },
    ])
  })

  it('does not treat emails or other schemes as links', () => {
    expect(linkify('mail me at a@b.example or ftp://host/file')).toEqual([
      { type: 'text', value: 'mail me at a@b.example or ftp://host/file' },
    ])
  })

  it('preserves newlines in the text segments', () => {
    expect(linkify('line one\nline two')).toEqual([
      { type: 'text', value: 'line one\nline two' },
    ])
  })
})
