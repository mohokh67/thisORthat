import { createClient } from '@supabase/supabase-js'
import { readSupabaseConfig } from './config'

export const supabaseConfig = readSupabaseConfig(import.meta.env)

/**
 * Shared browser Supabase client. The anon key is public by design
 * (see docs/adr/0001-link-is-the-only-access-control): access to a Board is
 * gated only by knowing its link.
 */
export const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey)
