-- Ticket #6: notes.
--
-- `author_name` is a snapshot taken when the note is created, so renaming the
-- participant later does not rewrite past notes. `priority` defaults to 'none';
-- the cycle control and votes arrive in later tickets.

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards (id) on delete cascade,
  column_id uuid not null references public.columns (id) on delete cascade,
  text text not null check (char_length(text) between 1 and 2000),
  priority text not null default 'none'
    check (priority in ('none', 'low', 'medium', 'high')),
  author_id uuid not null,
  author_name text not null check (char_length(author_name) between 1 and 80),
  position double precision not null,
  created_at timestamptz not null default now()
);

create index notes_board_id_idx on public.notes (board_id);
create index notes_column_id_idx on public.notes (column_id);

alter table public.notes enable row level security;
create policy "anon full access" on public.notes
  for all to anon using (true) with check (true);
grant select, insert, update, delete on public.notes to anon;

alter publication supabase_realtime add table public.notes;
