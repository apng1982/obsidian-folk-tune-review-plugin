# Review workflow

## Overview

Review is the core workflow of the plugin.

The review flow should not be a direct CLI clone. It should be a native Obsidian workflow:

```text
build queue → preview queue → run review session → optionally write latest review metadata
```

There is no separate `pick` command.

## Review setup

The user starts a review from the command palette or a plugin UI surface.

The setup screen should allow the user to choose:

- filter(s), e.g. origin, session;
- number of tunes (default to 10);
- whether to include session-maintained tunes;
- whether to include excluded tunes;
- whether to prioritise never-reviewed tunes;
- live mode (default) or dry run mode.

Defaults should be configurable in plugin settings (this can be post-MVP).

The live/dry-run review mode control should be hidden by default. It is only
visible when the plugin setting `dev/test mode` is enabled, and when visible it
should be the last control in the setup screen.

## Review queue preview

The user must see all selected tunes before/during the session.

This is a hard requirement.

The queue preview replaces the old CLI `pick` command.

The preview should show useful context for each selected tune, such as:

- tune title;
- key(s)
- origin, if available;
- composer, if available;

## Review session UI

The session should show:

- the full queue;
- the current tune (and configurable metadata, such as origin, key, composer);
- an `Open note` action (without losing the context of the review);
- large touch-friendly score buttons;
- the interval days for every score;
- skip/end controls;
- actions to exclude the current tune from reviews and to mark it as session-maintained.

No free-text review notes field should be included.

When the user chooses `exclude from reviews`, the plugin should set
`review.excludedFromReview` on the tune note and advance the review session
without writing score/date metadata. When the user chooses `mark as session
maintained`, the plugin should set `review.sessionMaintained` on the tune note
and advance the review session without writing score/date metadata. These
actions should be unavailable or no-op in dry-run mode except for showing the
same user flow without persisting changes.

## Score-to-interval mapping

The score buttons must display both the score and the number of days that will be added to the next review date.

The mapping inherited from the current CLI reference implementation is:

| Score | Interval |
| ---: | ---: |
| 0 | 1 day |
| 1 | 3 days |
| 2 | 7 days |
| 3 | 14 days |
| 4 | 30 days |
| 5 | 60 days |
| 6 | 120 days |
| 7 | 180 days |
| 8 | 270 days |
| 9 | 365 days |

The UI must not show bare numbers without interval context.

Suggested button text:

```text
0  (1 day)
1  (3 days)
2  (7 days)
3  (14 days)
4  (30 days)
5  (60 days)
6  (120 days)
7  (180 days)
8  (270 days)
9  (365 days)
```

Optional descriptive labels may be added later, but the score and interval are mandatory.

## Live review mode

In the default live mode, when the user scores a tune, the plugin writes the latest review state into the tune note’s frontmatter.

The write should update only the current review state:

- last reviewed date;
- score;
- interval days;
- next due date.

The plugin should not write review notes or review history.

## Dry run mode

Dry run mode runs the same review session but writes nothing.

The user should still be able to:

- build the queue;
- view the selected tunes;
- open tune notes;
- choose scores;
- advance through the session;
- complete the session.

At completion, the UI should make clear that no notes were changed.

Example:

```text
Dry run complete. No tune metadata was changed.
```

No complex diff/preview system is required for dry run at this stage.

## Skip behaviour

The user should be able to skip a tune without writing metadata.

Skipped tunes should remain unchanged in both live and dry run modes.

## Current tune review

The user should be able to navigate to a tune note and run:

```text
Folk Tune Review: Add review to current tune
```

This command bypasses automated queue construction but must reuse the same tune
eligibility rules as queue selection. The active note can be reviewed only when:

- it is inside the configured tune folder;
- it can be parsed as a tune;
- it is learned/eligible according to the normal review rules;
- it is not excluded from reviews;
- it is not marked as session-maintained.

The command should show the same current-tune review screen used during a
review queue. After a successful live write, the dialog should close and a
native Obsidian notification should confirm that the note was updated.

## End session behaviour

The user should be able to end a session before completing the queue.

Completed live-review items should remain written. Unreviewed items should remain unchanged.

Dry-run sessions should never write anything regardless of completion state.

## Queue selection rules

The detailed queue selection logic should be implemented in the domain layer and tested independently.

The current CLI behaviour is a useful reference:

- learned tunes are candidates;
- excluded tunes are omitted unless explicitly included;
- session-maintained tunes are omitted unless explicitly included;
- origin filter can restrict candidates;
- overdue/due tunes should be prioritised;
- never-reviewed tunes are included;
- top-up tunes may be used to reach the requested count.

The review setup option `Prioritise never-reviewed tunes` changes the primary
ordering:

- when false, use the existing ordering: due for review, then never reviewed,
  then not due for review;
- when true, use: never reviewed, then due for review, then not due for review.

Exact ordering should be specified in tests.

## Review date calculation

Given:

- `today`;
- selected score;
- interval days from the score;

write:

- `review.lastReviewed = today`;
- `review.score = score`;
- `review.intervalDays = intervalDays`;
- `review.nextDue = today + intervalDays`.

The date provider must be injectable for tests.

## Acceptance criteria

The review workflow is acceptable when:

- all selected tunes are visible before review begins;
- all selected tunes remain accessible during review;
- score buttons show interval days;
- navigating to a tune note opens it without losing the context of the review;
- the current active tune note can be reviewed directly when eligible;
- dry run can be completed with no writes;
- live review updates only the latest review metadata;
- live review can set `review.excludedFromReview` and `review.sessionMaintained`
  from the review UI;
- no notes/comments UI exists;
- no review history is written;
- the workflow is usable on mobile touch screens;
- all selection and date logic is covered by unit tests.
