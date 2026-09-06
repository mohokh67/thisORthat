# thisORthat

A shared, real-time board for collecting short items into columns and voting on
them. Built for retrospectives and similar "collect, discuss, prioritise"
sessions. Anyone holding a board's link can read and change everything on it: no
accounts, no permissions.

See [`CONTEXT.md`](./CONTEXT.md) for the domain glossary and
[`docs/adr/`](./docs/adr/) for the decisions that shape the app. The full v1
scope lives in GitHub issue #2, broken into tickets #3–#17.

## Stack

- **Vite + React + TypeScript** single-page app, no custom backend
- **Supabase** for Postgres, Realtime, and Presence, accessed directly from the browser
- **dnd-kit** for drag-and-drop
- **Vitest** for unit tests (pure domain logic only)
- Static hosting on **GitHub Pages**, deployed by GitHub Actions on push to `main`

## Local development

```bash
npm install
cp .env.example .env      # then fill in your Supabase URL + anon key
npm run dev               # http://localhost:5173/thisORthat/
```

| Command | Does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Type-check, then build to `dist/` |
| `npm run preview` | Serve the built `dist/` locally |
| `npm test` | Run the unit tests once |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run typecheck` | Type-check without emitting |

### Environment

Two variables, read at build time (see [`src/lib/config.ts`](./src/lib/config.ts)):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

The anon key is public by design (ADR-0001); storing it as a secret is for
hygiene and rotation, not secrecy.

## Database

Migrations are plain SQL under [`supabase/migrations/`](./supabase/migrations/),
applied to the hosted project with the Supabase CLI:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

The initial migration is a no-op; tables are added in later tickets.

## Deployment

`.github/workflows/deploy.yml` runs the tests, builds, and publishes to GitHub
Pages on every push to `main`. `.github/workflows/ci.yml` runs the tests and a
build on every pull request.

One-time setup (stores the Supabase secrets and points Pages at Actions):

```bash
./scripts/setup-github.sh
```

Or do it by hand: add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as
repository secrets (Settings → Secrets and variables → Actions), and set
Settings → Pages → Build and deployment → Source to **GitHub Actions**.

The site is served from a project path, so `vite.config.ts` sets
`base: '/thisORthat/'`. Change it if you attach a custom domain.
