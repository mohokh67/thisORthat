import type { ReactElement } from 'react'
import { supabaseConfig } from './lib/supabase'

export default function App(): ReactElement {
  const host = URL.canParse(supabaseConfig.url)
    ? new URL(supabaseConfig.url).host
    : supabaseConfig.url

  return (
    <main className="app-shell">
      <h1>thisORthat</h1>
      <p>Scaffolding is live. Board features arrive in later tickets.</p>
      <p className="muted">Supabase project: {host}</p>
    </main>
  )
}
