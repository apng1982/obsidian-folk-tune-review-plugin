# Product requirements

## Product goal

Create an Obsidian-native plugin for reviewing folk tunes stored as Markdown notes in an Obsidian vault.

The plugin should replace the existing .NET CLI once it is mature enough.

## Primary user

The primary user is a musician who stores folk tune information in Obsidian and wants a simple spaced-review workflow that works on desktop and mobile.

The initial user is the author, but the design should allow the plugin to be shared with colleagues later.

## Core principles

### Mobile-first

Mobile support is mandatory. The project is not worthwhile if it does not work on mobile.

All features must be designed and tested with mobile constraints in mind.

### Offline-first

All core functionality must work without internet access.

The plugin must not require network calls, web services, remote APIs, CDN assets, telemetry, or cloud-only sync assumptions.

### Obsidian-native

The plugin should use Obsidian concepts directly:

- vault files;
- Markdown notes;
- frontmatter/properties;
- command palette commands;
- modals/views;
- workspace note opening;
- plugin settings.

It should not feel like a CLI embedded in Obsidian.

### Test-first/test-heavy

Everything meaningful must be unit tested.

Business rules must be isolated from Obsidian APIs so they can be tested quickly and deterministically.

### Safe by design

Mutating operations must be deliberate, previewable where appropriate, and idempotent where possible.

Initialization must preview planned changes before applying them.

Review sessions must support dry run mode.

## Top-level functional areas

The plugin has three top-level areas:

1. **Initialize** — create/validate the required vault structure and seed data.
2. **Review** — build a review queue, show all selected tunes, run live or dry-run review sessions, and update latest review metadata.
3. **Stats** — show review/tune status and summary information from note metadata.

## Explicit non-goals

The plugin must not include:

- the old CLI's `pick` command;
- the old CLI's review notes/comments functionality;
- full review history;
- desktop-only functionality;
- dependency on the .NET CLI;
- dependency on the old JSON review store;
- remote services;
- path-based filesystem code using Node `fs` or `path`;
- shell commands or external process execution.

## Relationship to the old CLI

The old CLI exists as a useful reference for:

- score-to-interval mapping;
- candidate selection rules;
- current stats concepts;
- vault format assumptions;
- test categories;
- seed/admin behaviour.

It is not a compatibility target.

## Acceptance criteria

A useful MVP must:

- install as an Obsidian plugin;
- have `isDesktopOnly: false` in `manifest.json`;
- run without Node/Electron-only APIs;
- default the configured tune folder to `Repertoire/Tunes`;
- scan the configured tune folder;
- read tune metadata from frontmatter/cache;
- build a review queue;
- show all selected tunes before and during review;
- allow the current tune note to be reviewed directly when it is eligible;
- show score buttons with interval days clearly visible;
- support dry run mode with no writes;
- support live mode writing latest review metadata to tune notes;
- allow users to mark tunes as excluded from review or session-maintained from the review UI;
- run offline;
- have comprehensive domain unit tests;
- have adapter/application tests using fake Obsidian boundaries.
