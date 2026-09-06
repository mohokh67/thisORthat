import { supabaseConfig } from './lib/supabase'

export default function App() {
  const host = safeHost(supabaseConfig.url)

  return (
    <main className="app-shell">
      <h1>thisORthat</h1>
      <p>Scaffolding is live. Board features arrive in later tickets.</p>
      <p className="muted">Supabase project: {host}</p>
    </main>
  )
}

function safeHost(url: string): string {
  try {
    return new URL(url).host
  } catch {
    return url
  }
}
