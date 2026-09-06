# AGENTS.md

Guidance for coding agents working in this repository.

## Agent skills

### Issue tracker

Issues and specs live as GitHub issues in `mohokh67/thisORthat`, managed with the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## Development

- Stack and commands are in `README.md`. Vite + React + TS, Supabase, Vitest.
- **Base path gotcha:** `vite.config.ts` sets `base: '/thisORthat/'` for project-path GitHub Pages, so local URLs are `http://localhost:5173/thisORthat/`. Routing (added in #4) must account for this.
- Build-time env (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) is validated in `src/lib/config.ts` and unit-tested there; `src/lib/supabase.ts` builds the shared client from it.
- Tests cover pure logic only (see the spec's Testing Decisions). No component or E2E tests.
- Tests must not import `src/lib/supabase.ts` (directly or transitively) without stubbing `import.meta.env` — it validates env and throws at module load.
- SQL migrations live in `supabase/migrations/`; each table ships permissive `anon` RLS (ADR-0001).
