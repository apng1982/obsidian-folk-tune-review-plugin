# MVP decisions

## Status

Accepted on 2026-06-06.

## Authority of the existing CLI

The existing CLI's business rules, definitions, and selection logic are
authoritative unless a plugin requirement explicitly overrides them.

Relevant references:

- `SelectionService.cs` in the existing CLI repository;
- the CLI selection service tests;
- <https://docs.cloudawesome.uk/personal/obsidian-folk-tune-review/selection-logic>.

The platform and UI are changing. Existing correct business behaviour should not
be redesigned during the re-code without an explicit decision.

## Clarified MVP decisions

- A tune is learned and eligible only when its `learn` frontmatter value is
  `false` or missing. Missing `learn` metadata is treated as learned.
- Selection follows the existing CLI logic:
  1. due and overdue tunes with review history, ordered by most overdue;
  2. never-reviewed tunes, randomized;
  3. non-due top-up tunes, randomized.
- Due today counts as overdue for selection purposes.
- Malformed frontmatter or malformed review metadata excludes a tune from
  selection. Validation should report the problem separately.
- A partial `review` object may contain `sessionMaintained` and
  `excludedFromReview` without post-review state fields.
- The configured tune folder is flat and is not scanned recursively.
- The default tune folder is `[root]/Tunes/Tunes`.
- Origin filtering follows the existing CLI's case-insensitive displayed-text
  matching, including Obsidian wikilinks and aliases.
- The initial review session UI will use an Obsidian `ItemView`.
- The plugin must not interfere with vault sync operations.
- Initial development proceeds one roadmap phase at a time.

## Initial plugin metadata

- ID: `folk-tune-review`
- Name: `Folk Tune Review`
- Version: `0.1.0`
- `isDesktopOnly`: `false`
