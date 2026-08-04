# Codex implementation brief

Use this brief when working with Codex or another coding agent in an IDE.

## Project

Build a new Obsidian plugin for reviewing folk tunes stored as Markdown notes in an Obsidian vault.

This is a complete TypeScript re-code. Do not port the .NET CLI directly. Treat the CLI only as a behaviour/reference source.

## Hard requirements

- Mobile-first.
- Offline-first.
- TypeScript.
- Obsidian-native.
- No Node `fs` or `path`.
- No Electron APIs.
- No shell commands.
- No dependency on the .NET CLI.
- No runtime network calls for core behaviour.
- No `pick` command.
- No review notes/comments.
- No review history.
- Latest review state only.
- Nested review metadata.
- Strong unit testing.

## Commands

Implement these command areas:

1. Initialize
2. Review
3. Stats

Likely command palette entries:

```text
Folk Tune Review: Start review
Folk Tune Review: Add review to current tune
Folk Tune Review: Open stats
Folk Tune Review: Initialize vault
Folk Tune Review: Validate vault
```

## Review flow

The review flow is:

```text
build queue → preview queue → run session → optionally write latest review metadata
```

The user must see all selected tunes before/during review.

The old CLI `pick` command does not exist. Its useful behaviour is absorbed into the queue preview.

The current active tune note can also be reviewed directly with
`Folk Tune Review: Add review to current tune`. This command bypasses queue
construction but must enforce the configured tune folder, parseable tune
metadata, and `learn: false`. Excluded and session-maintained flags do not block
direct review.

## Score mapping

Implement exactly:

```ts
export const REVIEW_INTERVAL_DAYS = {
  0: 1,
  1: 3,
  2: 7,
  3: 14,
  4: 30,
  5: 60,
  6: 120,
  7: 180,
  8: 270,
  9: 365,
} as const;
```

The UI must display both score and interval days.

Do not show bare `0..9` score buttons.

## Review metadata

Write this nested shape to tune notes:

```yaml
review:
  lastReviewed: 2026-06-05
  score: 9
  intervalDays: 365
  nextDue: 2027-06-05
  sessionMaintained: false
  excludedFromReview: false
```

Do not write notes/comments/history.

## Dry run

Dry run writes nothing back to the vault.

It should still allow queue preview, opening notes, scoring, skipping, and completing the session.

The live/dry-run option is hidden from normal users. Add a plugin setting named
`dev/test mode`, default false, shown at the bottom of settings. Only show the
review mode control in the review setup screen when that setting is enabled,
and place it last when visible.

## Pre-beta alpha feedback

- Default tune folder: `Repertoire/Tunes`.
- Review setup includes `Prioritise never-reviewed tunes`, default false.
- Default queue order remains due for review, then never reviewed, then not due.
- With prioritisation enabled, queue order is never reviewed, then due for
  review, then not due.
- Review UI includes actions for `exclude from reviews` and `mark as session
  maintained`, writing `review.excludedFromReview` and
  `review.sessionMaintained` respectively in live mode.

## Architecture

Keep strict boundaries:

```text
Domain code imports no Obsidian APIs.
Application code depends on interfaces.
Obsidian code implements those interfaces.
UI code orchestrates but does not contain business rules.
```

Suggested folders:

```text
src/domain
src/application
src/ports
src/obsidian
src/ui
src/seed
```

## Testing

Everything meaningful must be unit tested.

Start with tests for:

- score validation;
- interval mapping;
- next due date calculation;
- queue selection;
- dry run writes nothing;
- live mode writes expected review state;
- stats calculation;
- initialization planning.

Use an injected date/clock in all date-sensitive code.

## Do not implement initially

- review note/comment field;
- review history/log;
- CLI compatibility layer;
- old JSON review store migration;
- desktop-only features;
- network features;
- separate `pick` command.

## First milestone

Build a read-only review queue preview:

- plugin loads;
- command opens review setup;
- scans configured tune folder;
- builds queue;
- displays all selected tunes;
- displays score interval mapping;
- writes nothing;
- tests pass.
