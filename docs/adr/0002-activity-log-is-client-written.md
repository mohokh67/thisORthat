# Activity log is client-written and best-effort

Each client writes its own Event rows into an append-only table immediately after it
performs a successful mutation. There are no database triggers and no server code
enforcing that events are recorded.

We chose this to keep the backend to plain tables plus RLS, with no functions or
edge code to deploy or maintain for a small tool. The consequence is that the
activity log is not a trustworthy audit trail: a modified or buggy client can omit
or fabricate entries, and a crash between a mutation and its event write drops the
record silently. This is acceptable given ADR-0001 (anyone with the link can already
do anything); the log exists to help a room see what happened during a session, not
to hold anyone accountable. Moving integrity server-side later would mean database
triggers and a backfill, so recording the deliberate choice here.
