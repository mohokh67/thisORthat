-- Ticket #13: activity log events.
--
-- Append-only history of who did what on a board. Each client writes its own
-- event row immediately after a successful mutation (ADR-0002): anon may read
-- and insert, never update or delete. `detail` carries enough to render an
-- entry after its target row is gone.

create table public.events (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards (id) on delete cascade,
  actor_id uuid not null,
  actor_name text not null,
  action text not null,
  target_type text not null check (target_type in ('board', 'column', 'note')),
  target_id uuid not null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index events_board_id_created_at_idx on public.events (board_id, created_at desc);

alter table public.events enable row level security;
create policy "anon read" on public.events
  for select to anon using (true);
create policy "anon append" on public.events
  for insert to anon with check (true);
grant select, insert on public.events to anon;

-- Live updates for the log drawer. Insert-only, so no REPLICA IDENTITY change:
-- events are never updated, deleted, or filtered on a delete.
alter publication supabase_realtime add table public.events;
