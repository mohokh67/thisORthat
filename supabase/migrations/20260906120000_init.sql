-- Initial migration.
--
-- Establishes the migrations directory. Table definitions arrive in later
-- tickets: `boards` and `columns` in #4, `participants` in #5, `notes` in #6,
-- `votes` in #9, `events` in #13. Every table ships with permissive RLS for the
-- `anon` role (see docs/adr/0001) and Realtime enabled where the client
-- subscribes to it.
--
-- `gen_random_uuid()` is built in on Postgres 13+, so no extension is required.

select 1;
