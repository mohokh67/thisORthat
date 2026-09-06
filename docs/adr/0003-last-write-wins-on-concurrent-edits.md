# Last-write-wins on concurrent edits

Real-time sync is done with Supabase Realtime Postgres Changes: clients subscribe to
row inserts, updates, and deletes for a board and apply them locally. There is no
field-level merge, operational transform, or CRDT. When two people edit the same
note's text at the same time, the later write replaces the earlier one and the
earlier edit is lost.

We chose this because conflict-free collaborative editing is a large amount of
machinery for a tool where notes are one or two lines and simultaneous edits of the
same note are rare. Votes converge safely on their own (a unique constraint on
note plus participant, applied as an upsert), and note ordering uses fractional
position values so concurrent drags rarely collide. The accepted consequence is
silent loss of one side of a truly concurrent text edit; the mitigation is that
edits are small and fast, and the activity log records that an edit happened.
