-- Ticket #7: make filtered Realtime DELETE events work.
--
-- With the default replica identity, a DELETE's `old` record carries only the
-- primary key. A Realtime subscription filtered on `board_id` (columns, notes)
-- or evaluated per board (participants) then never matches a delete, so the
-- event is silently dropped. REPLICA IDENTITY FULL logs the whole old row.

alter table public.columns replica identity full;
alter table public.notes replica identity full;
alter table public.participants replica identity full;
