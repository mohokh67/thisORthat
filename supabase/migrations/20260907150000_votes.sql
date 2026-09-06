-- Ticket #9: votes.
--
-- One row per (note, participant); the key is that pair, so a repeat vote is an
-- upsert and there is no surrogate id. `board_id` is denormalised so the
-- Realtime subscription can filter per board like columns and notes do.

create table public.votes (
  board_id uuid not null references public.boards (id) on delete cascade,
  note_id uuid not null references public.notes (id) on delete cascade,
  participant_id uuid not null,
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  primary key (note_id, participant_id)
);

create index votes_board_id_idx on public.votes (board_id);

alter table public.votes enable row level security;
create policy "anon full access" on public.votes
  for all to anon using (true) with check (true);
grant select, insert, update, delete on public.votes to anon;

alter publication supabase_realtime add table public.votes;
alter table public.votes replica identity full;
