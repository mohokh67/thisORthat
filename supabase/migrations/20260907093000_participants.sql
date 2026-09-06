-- Ticket #5: participants.
--
-- One row per (participant, board): the durable name record used for
-- attribution. Live "who is here" presence is handled by Realtime Presence
-- (#10), not by polling this table.

create table public.participants (
  participant_id uuid not null,
  board_id uuid not null references public.boards (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  last_seen timestamptz not null default now(),
  primary key (participant_id, board_id)
);

alter table public.participants enable row level security;
create policy "anon full access" on public.participants
  for all to anon using (true) with check (true);
grant select, insert, update, delete on public.participants to anon;

alter publication supabase_realtime add table public.participants;
