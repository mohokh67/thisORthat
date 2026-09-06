-- Ticket #4: boards and columns.
--
-- Access model: wide open, guarded only by knowing the board link
-- (see docs/adr/0001-link-is-the-only-access-control). RLS is enabled so the
-- table is never fully unguarded, but the policy allows every anon operation.

create table public.boards (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  template text not null
    check (template in ('positive-negative', 'start-stop-continue', 'blank')),
  created_at timestamptz not null default now()
);

create table public.columns (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  color text check (color in ('gray', 'red', 'orange', 'green', 'blue', 'purple')),
  position double precision not null,
  created_at timestamptz not null default now()
);

create index columns_board_id_idx on public.columns (board_id);

alter table public.boards enable row level security;
alter table public.columns enable row level security;

create policy "anon full access" on public.boards
  for all to anon using (true) with check (true);
create policy "anon full access" on public.columns
  for all to anon using (true) with check (true);

grant select, insert, update, delete on public.boards to anon;
grant select, insert, update, delete on public.columns to anon;

-- Live updates for the board view.
alter publication supabase_realtime add table public.boards;
alter publication supabase_realtime add table public.columns;
