import { describe, expect, it } from 'vitest'
import { readSupabaseConfig } from './config'

describe('readSupabaseConfig', () => {
  it('returns url and anonKey when both are present', () => {
    expect(
      readSupabaseConfig({
        VITE_SUPABASE_URL: 'https://example.supabase.co',
        VITE_SUPABASE_ANON_KEY: 'anon-key',
      }),
    ).toEqual({ url: 'https://example.supabase.co', anonKey: 'anon-key' })
  })

  it('trims surrounding whitespace', () => {
    expect(
      readSupabaseConfig({
        VITE_SUPABASE_URL: '  https://example.supabase.co  ',
        VITE_SUPABASE_ANON_KEY: '\tanon-key\n',
      }),
    ).toEqual({ url: 'https://example.supabase.co', anonKey: 'anon-key' })
  })

  it('throws naming every missing variable', () => {
    expect(() => readSupabaseConfig({})).toThrowError(
      /VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY/,
    )
  })

  it('throws when only the anon key is missing', () => {
    expect(() =>
      readSupabaseConfig({ VITE_SUPABASE_URL: 'https://example.supabase.co' }),
    ).toThrowError(/VITE_SUPABASE_ANON_KEY/)
  })

  it('treats a blank string as missing', () => {
    expect(() =>
      readSupabaseConfig({
        VITE_SUPABASE_URL: '   ',
        VITE_SUPABASE_ANON_KEY: 'anon-key',
      }),
    ).toThrowError(/VITE_SUPABASE_URL/)
  })
})
