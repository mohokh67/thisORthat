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
- SQL migrations live in `supabase/migrations/`; each table ships permissive `anon` RLS (ADR-0001) and is added to the `supabase_realtime` publication. Apply them by pasting into the Supabase SQL Editor (no CLI in this environment).
- **Realtime gotcha:** a Postgres Changes subscription filtered on a non-PK column (e.g. `board_id=eq.…`) drops DELETE events unless the table has `REPLICA IDENTITY FULL` (default replica identity only puts the PK in the delete payload). `columns`, `notes`, `participants` are set to FULL. Also: `SUBSCRIBED` fires ~1-2s before the replication bindings are actually live, so `useBoard` refetches on every `live` transition to close that gap.
- Layout: pure domain logic (the test seam) in `src/lib/*.ts` with a `.test.ts` beside it (`templates`, `parseHash`, `identity`, `position`, `linkify`, `config`); Supabase adapters also in `src/lib/` (`boards`, `notes`, `participants`, `supabase`); React in `src/pages/` and `src/components/`; hash routing in `src/routing/`.
- Fractional `position` (double precision) orders columns and notes; new notes go to the top via `positionAtStart`. Use `src/lib/position.ts` helpers, never ad-hoc arithmetic.
