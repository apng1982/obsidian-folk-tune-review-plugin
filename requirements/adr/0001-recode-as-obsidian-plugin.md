# ADR 0001: Re-code the folk tune reviewer as a mobile-first Obsidian plugin

## Status

Accepted.

## Context

The existing folk tune reviewer is a .NET CLI distributed via NuGet as `CloudAwesome.FolkTune.Reviewer`. It was built as a CLI because that was the fastest implementation route at the time.

The CLI currently consumes a local Obsidian vault with a specific folder and metadata format. It supports review, candidate selection, stats, session-related behaviour, validation, and initialization/admin tasks.

The CLI is mainly a personal tool, but it is plausible that colleagues will want to use it once the technical CLI friction is removed.

The key motivator for the re-code is mobile use. A desktop-only or CLI-based approach does not satisfy the desired workflow, and at present several backlog items are being raised to support the non-mobile workflow.

## Decision

Build a new Obsidian plugin from the ground up.

The existing CLI is a reference implementation for behaviour and test coverage, but the plugin is not a direct port and does not need backward compatibility with CLI storage formats or command names.

If the plugin succeeds, the CLI will be deprecated.

## Consequences

The plugin must:

- use TypeScript;
- run inside Obsidian;
- be mobile-first;
- be offline-first;
- avoid Node/Electron-only APIs;
- avoid shelling out to the CLI or any external process;
- use native Obsidian vault, metadata, command, and UI APIs;
- replace the CLI `pick` command with an Obsidian-native review queue preview;
- write latest review state directly into tune note frontmatter;
- avoid review notes/comments and review history for now;
- maintain strong unit and integration test coverage.

## Non-goals

- Directly hosting or invoking the .NET CLI.
- Maintaining compatibility with the old JSON review store for other users.
- Supporting desktop-only features.
- Adding cloud/network-backed features.
- Preserving the old `pick` command.
- Capturing free-text review notes.
- Storing full review history. (Only the latest review state is stored.)
