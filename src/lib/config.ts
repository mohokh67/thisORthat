export interface SupabaseConfig {
  url: string
  anonKey: string
}

interface RawEnv {
  VITE_SUPABASE_URL?: string
  VITE_SUPABASE_ANON_KEY?: string
}

/**
 * Reads and validates the Supabase connection settings from a Vite env object.
 * Throws a clear error naming every missing value so a misconfigured build fails
 * loudly instead of producing a client pointed at `undefined`.
 */
export function readSupabaseConfig(env: RawEnv): SupabaseConfig {
  const url = env.VITE_SUPABASE_URL?.trim()
  const anonKey = env.VITE_SUPABASE_ANON_KEY?.trim()

  if (!url || !anonKey) {
    const missing = [
      !url && 'VITE_SUPABASE_URL',
      !anonKey && 'VITE_SUPABASE_ANON_KEY',
    ].filter(Boolean)
    throw new Error(
      `Missing required environment variable(s): ${missing.join(', ')}. ` +
        `Set them in a local .env file (see .env.example) or as CI secrets.`,
    )
  }

  return { url, anonKey }
}
