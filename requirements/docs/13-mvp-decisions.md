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
- Tune notes do not require a GUID or frontmatter ID. The note path/file name in
  the configured flat tune folder is sufficient identity because review state is
  stored inside the note.
- Selection follows the existing CLI logic by default:
  1. due and overdue tunes with review history, ordered by most overdue;
  2. never-reviewed tunes, randomized;
  3. non-due top-up tunes, randomized.
- Review setup includes `Prioritise never-reviewed tunes`, default false. When
  enabled, selection should order never-reviewed tunes first, then due/overdue
  tunes, then non-due top-up tunes.
- Due today counts as overdue for selection purposes.
- Malformed frontmatter or malformed review metadata excludes a tune from
  selection. Validation should report the problem separately.
- A partial `review` object may contain `sessionMaintained` and
  `excludedFromReview` without post-review state fields.
- The configured tune folder is flat and is not scanned recursively.
- The default tune folder is `Repertoire/Tunes`.
- Add a plugin setting named `dev/test mode`, default false, as the bottom
  setting. The live/dry-run review mode control remains supported but is hidden
  in review setup unless `dev/test mode` is enabled; when visible, it appears
  last.
- Add `Folk Tune Review: Add review to current tune`, equivalent to the old CLI
  `--tune <NAME>` use case but based on the active Obsidian note. The active
  note must be in the configured tune folder, parse as a tune, and have
  `learn: false`. Excluded and session-maintained flags do not block direct
  review.
- Review UI should expose actions to set `review.excludedFromReview` and
  `review.sessionMaintained`.
- Origin filtering follows the existing CLI's case-insensitive displayed-text
  matching, including Obsidian wikilinks and aliases.
- The initial review session UI will use an Obsidian `ItemView`.
- The plugin must not interfere with vault sync operations.
- Initial development proceeds one roadmap phase at a time.

## Beta feedback decisions

Accepted on 2026-08-07.

- Add native note creation commands for the three initialized template types:
  `Folk Tune Review: New Tune`, `Folk Tune Review: New Set`, and
  `Folk Tune Review: New Composer`.
- These commands remove the need for Templater for basic note creation. The
  plugin must not depend on Templater or any other template plugin.
- Commands use the user's current vault templates as source of truth:
  `Templates/Tune Template.md`, `Templates/Set Template.md`, and
  `Templates/Composer Template.md`.
- Commands copy template content exactly as stored in the vault. No liquid,
  Templater, date, or other expression expansion is required.
- New tune notes are created in `Repertoire/Tunes`, new set notes in
  `Repertoire/Sets`, and new composer notes in `Ref/Composer`.
- New notes may be created as `Untitled.md` or the next safe unique variant, and
  should be opened immediately so the user can rename and complete the note.
- Missing templates or destination folders should produce a clear notice and no
  partial note.

## Initial plugin metadata

- ID: `folk-tune-review`
- Name: `Folk Tune Review`
- Version: `0.1.0`
- `isDesktopOnly`: `false`
