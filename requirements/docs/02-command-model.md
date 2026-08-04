# Command model

## Overview

Obsidian commands are command-palette actions, not CLI-style commands with flags and positional arguments.

The plugin should therefore expose a small set of command palette entries that open native Obsidian UI.

## Top-level command areas

The product has three functional areas:

1. Initialize
2. Review
3. Stats

In the command palette these can be represented as named commands such as:

```text
Folk Tune Review: Start review
Folk Tune Review: Add review to current tune
Folk Tune Review: Open stats
Folk Tune Review: Admin - Initialize vault
Folk Tune Review: Admin - Validate vault
```

The precise command names can change, but the conceptual model should remain stable.

## No command arguments

Do not attempt to reproduce CLI syntax such as:

```text
review --origin Ireland --count 10
```

Instead, commands should open setup modals/views where the user can choose options.

## Review command behaviour

The main Review command should:

1. open a review setup screen;
2. collect review options;
3. build the review queue;
4. show the full selected queue;
5. allow either live review or dry run;
6. run the session.

Likely review options:

- number of tunes (defaults to 10);
- optional filters (origin, session, etc.);
- include/exclude session-maintained tunes;
- include/exclude excluded tunes;
- prioritise never-reviewed tunes;
- live or dry run mode.

The live/dry-run review mode option is intended for the author and testers. It
must remain available, but should only be visible when the plugin setting
`dev/test mode` is enabled. When visible, it should be the last option in the
review setup screen. The setting defaults to false and should be shown as the
bottom setting in the plugin settings tab.

## Dry run command behaviour

Dry run means the review session can be run normally, but no tune metadata is written back to the vault.

## Current tune review command behaviour

The `Folk Tune Review: Add review to current tune` command should review the
currently active note directly, bypassing automated queue selection.

This is the Obsidian-native replacement for the old CLI option, but without
requiring an ID-based lookup:

```csharp
[CommandOption("--tune <NAME>")]
[Description("Review a specific tune by its title, bypassing automated selection logic")]
public string? Tune { get; set; }
```

The command should:

1. validate that the active note is inside the configured tune folder;
2. validate that the tune is marked as learned;
3. open the same single-tune review UI used during a normal queue session;
4. write the selected score to the active tune note's frontmatter in live mode;
5. close the dialog after a successful write;
6. show a native Obsidian notification confirming that the note was updated.

If the current note is outside the tune folder, cannot be parsed as a tune, or
is not marked as learned, the command should not allow an individual review.
Excluded and session-maintained tunes can still be reviewed directly.

## Stats command behaviour

The Stats command should open a stats view/modal showing basic calculated values from current metadata as well as a list of all stats/reports options.

Stats should never modify the vault.

## Initialize command behaviour

The Initialize command should open an initialization wizard.

It should:

1. inspect the current vault/configuration;
2. calculate missing folders, seed notes, and templates;
3. preview planned changes;
4. apply changes only after explicit confirmation;
5. be safe to run more than once.

Assumption is that this command would only be run once, in a fresh vault, but idempotency is a requirement as described above.

## Validate command behaviour

A Validate command may be part of Initialize or separate.

It should inspect the current vault structure and tune metadata and report issues without changing anything.

## Other `Admin` commands

While initially, only the Initialize and Validate commands will be part of the Admin command area,
it is expected that more commands will be added in the future for advanced vault management and maintenance.

Example future commands are:
- `Admin - Add metadata` - adds a new yaml field to every tune note
- `Admin - Remove metadata` - deletes an existing yaml field from every tune note
- `Admin - Update metadata` - updates an existing yaml field in every tune note

## Commands that should not exist

There must be no plugin-level `pick` command.

The old `pick` use case is replaced by the review queue preview shown before the review begins.
