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
- live mode (default) or dry run mode.

Defaults should be configurable in plugin settings (this can be post-MVP).

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
- skip/end controls.

No free-text review notes field should be included.

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
- dry run can be completed with no writes;
- live review updates only the latest review metadata;
- no notes/comments UI exists;
- no review history is written;
- the workflow is usable on mobile touch screens;
- all selection and date logic is covered by unit tests.
