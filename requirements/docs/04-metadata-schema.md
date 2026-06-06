# Metadata schema

## Overview

The plugin should store current review state directly in the frontmatter of each tune note.

The old CLI JSON review store should not be used by the plugin.

The plugin only cares about the latest review state for now. It does not store review history and does not store review notes/comments.

## Review metadata

Preferred nested YAML shape:

```yaml
review:
  lastReviewed: 2026-06-05
  score: 9
  intervalDays: 365
  nextDue: 2027-06-05
  sessionMaintained: false
  excludedFromReview: false
```

Preferrably the `review` node is not visible in the reading view in the UI. Whether hidden by CSS or another means.

Fields:

| Field                 | Type                      | Required           | Meaning                               |
|-----------------------|---------------------------|--------------------|---------------------------------------|
| `review.lastReviewed` | date string, `YYYY-MM-DD` | after first review | Date the tune was last reviewed.      |
| `review.score`        | integer `0..9`            | after first review | Score selected in the review UI.      |
| `review.intervalDays` | integer                   | after first review | Number of days added for next review. |
| `review.nextDue`      | date string, `YYYY-MM-DD` | after first review | Next due date.                        |

`review.nextDue` is derivable from `lastReviewed + intervalDays`, but should be stored because it makes stats, reports, sorting, and external queries easier.

## Tune metadata

The exact tune metadata schema can evolve, but the plugin needs enough information to determine review eligibility and filtering.

Suggested shape:

```yaml
---
type: "[[Ref/Type/Reel|Reel]]"
key:
  - "[[Ref/Key/d minor.|d minor.]]"
mode:
  - "[[Ref/Mode/d dor.|d dor.]]"
whistle:
  - "[[Ref/Whistle/Bass C|Bass C]]"
origin: "[[Ref/Geo/Irish|Irish]]"
composer: "[[Ref/Composer/(trad.)|(trad.)]]"
sets: []
learn: false
learned: 2026-06-05
sessions: []
collections: []
id: 0e091387-4207-4cd4-98a1-33e380a3dd5c
created: 2026-04-27
review:
  lastReviewed: 2026-06-05
  score: 9
  intervalDays: 365
  nextDue: 2027-06-05
  sessionMaintained: false
  excludedFromReview: false
---
```

Potentially required fields for mature validation:

- `id`;
- tune kind/type marker;
- learned flag;
- origin(s), if origin filtering is enabled;
- review state after first review.

## Nested versus flat metadata

Nested review metadata is preferred for readability and ownership boundaries:

```yaml
review:
  lastReviewed: 2026-06-05
  score: 9
  intervalDays: 365
  nextDue: 2027-06-05
```

A flat shape such as `reviewLast`, `reviewScore`, `reviewNextDue` is not preferred at this stage.

The plugin owns review metadata, so it is acceptable if Obsidian’s generic Properties UI is less convenient for nested objects.

If a later reporting or Dataview use case proves painful, this decision can be revisited. Similarly if the Obsidian UI complains about nested yaml objects.

## Dates

All review dates should be stored as local date strings in ISO format:

```text
YYYY-MM-DD
```

Avoid storing date-times unless a future requirement needs them.

## Score values

Valid scores are integers from `0` to `9`, inclusive.

Invalid scores must be rejected before any write occurs.

## Frontmatter updates

The Obsidian adapter should use `app.fileManager.processFrontMatter(file, callback)` to update review metadata rather than manually parsing and rewriting YAML.

Be aware that any frontmatter update mechanism may reformat YAML. Mutating operations should be scoped to the fields the plugin owns.

## CSS/display considerations

The user prefers nested review metadata partly because it is easier to hide or visually group.

Obsidian’s own property display settings and CSS can be used to reduce visual noise in reading mode, but hiding/displaying metadata should be treated as presentation only. The plugin should not depend on CSS for correctness.

## Metadata ownership

The plugin owns:

- `review.*` fields;
- any plugin-specific schema/version marker it creates;
- any generated IDs, if the user asks Initialize/Validate to add missing IDs.

The plugin should avoid changing unrelated frontmatter fields.

## Acceptance criteria

The schema is acceptable when:

- latest review state can be read from tune notes;
- latest review state can be written after live reviews;
- no review history is required;
- no review notes/comments are stored;
- nested review metadata is supported;
- stats can be calculated from metadata alone;
- unit tests cover schema mapping and validation.
