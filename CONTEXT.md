# Context: thisORthat

A shared, real-time board for grouping short written items into columns and voting
on them. Built for retrospectives and similar "collect, discuss, prioritise"
sessions. Anyone holding a board's link can read and change everything on it.

This file is a glossary. It defines the language of the domain and nothing else:
no implementation notes, no architecture, no decisions. Those live in `docs/adr/`.

---

## Board

A single working surface: a title plus an ordered set of **Columns**. Every Board is
reachable by one unguessable link and has no owner, no members, and no access
control. Possession of the link is the only thing that grants access. A Board lives
indefinitely; it is never archived or expired.

## Board link

The unguessable address of a Board. It is the entire sharing and access mechanism:
there is nothing to send other than this link. Knowing it grants full read and write
access; not knowing it is the only thing that keeps a Board private.

## Template

A named starting shape for a new Board: a fixed list of Column titles (and their
accent colours) inserted at creation. Three exist: **Positive / Negative**,
**Start / Stop / Continue**, and **Blank** (no Columns). A Template only seeds the
Board; once created, the Board is fully editable and retains no memory of which
Template it came from. People cannot define their own Templates.

## Column

A titled, coloured, ordered bucket within a Board that holds **Notes**. Columns can
be added, renamed, recoloured, reordered, and deleted by anyone. Deleting a Column
also destroys every Note in it.

## Note

A single written item inside a Column: a short piece of plain text, plus a recorded
**Author name**, a **Priority**, and the **Votes** cast on it. Notes can be edited,
moved between Columns, reprioritised, or deleted by anyone, regardless of who
authored them. A Note's text is shown literally; only bare URLs within it become
clickable.

## Author name

The **Display name** of the Participant who created a Note, captured at creation and
kept with the Note thereafter. It is shown for social context and confers no rights;
it does not change if that person later renames themselves.

## Priority

An independent label on a Note, separate from Votes: **none**, **low**, **medium**,
or **high**. Anyone can change it. It carries the Note's colour signal and is one of
the ways a Column can be sorted.

## Vote

A single Participant's endorsement (**Up**) or objection (**Down**) on one Note. A
Participant has at most one Vote per Note; casting the opposite one replaces it, and
casting the same one again clears it.

## Points

A Note's net score: its Up votes minus its Down votes. Derived, never set directly.
Can be negative. Used as a sort key.

## Participant

A person viewing a Board in a browser. Identified by a stable **Participant ID**
minted the first time they use the app and remembered on their device across every
Board. A Participant must supply a **Display name** before interacting with a Board;
there is no anonymous viewing.

## Display name

The human-readable name a Participant chooses for themselves. Remembered on their
device and reused on every Board, including new ones. Changing it updates how that
person is shown going forward and in **Presence**, but does not rewrite the
**Author name** already stored on their past Notes.

## Presence

The live set of Participants currently viewing a Board. Ephemeral: it reflects who is
here right now (roughly the last minute of activity in a focused tab) and is not
history.

## Custom order

The hand-arranged sequence of Notes within a Column, set by dragging. It is the
Board's canonical order, shared by everyone. It is what a **Sort lens** other
than Custom temporarily reorders away from on one screen.

## Sort lens

A per-viewer, non-destructive reordering applied to a single Column on one person's
screen: by **Points**, by **Priority**, by newest, or by oldest. It never changes the
**Custom order** and is not seen by other Participants. While a Column is under a Sort
lens other than Custom, Notes in it cannot be hand-reordered.

## Activity log

The running, append-only history of who did what on a Board: Notes and Columns
created, edited, moved, reprioritised, renamed, recoloured, reordered, or deleted;
Votes cast, changed, and cleared; the Board renamed. Read-only. It records history
and offers no way to undo or restore. Pure position nudges of a Note within its
Column are not recorded.

## Event

One entry in the **Activity log**: an actor (Participant ID and their name at the
time), an action, the thing acted on, and enough detail to read the entry even after
that thing is gone.

## Export

A point-in-time dump of a Board that a Participant downloads to their own machine.
**Markdown**: a readable summary (Columns as headings, Notes as bullets annotated
with Points, Priority, and Author), in the exporting Participant's current
on-screen order (each Column's **Sort lens** applied), without the Activity log.
It is therefore viewer-relative, not a single canonical rendering. **JSON**: the
complete Board including every Event. The Activity log can also be exported on
its own as CSV.

## Recent boards

The list, kept on a Participant's device, of Boards they have opened, shown to them
when they are not on a Board. It is a personal convenience, not a directory: Boards
are not otherwise discoverable.
