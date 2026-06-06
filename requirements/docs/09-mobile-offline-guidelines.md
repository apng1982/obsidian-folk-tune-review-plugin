# Mobile and offline guidelines

## Overview

Mobile and offline support are non-negotiable.

Any feature that cannot be implemented in a mobile-safe and offline-safe way should not be included.

## Manifest requirement

The plugin must be intended for mobile use.

`manifest.json` should use:

```json
{
  "isDesktopOnly": false
}
```

## Hard bans

The plugin must not use:

- Node `fs`;
- Node `path`;
- Electron APIs;
- shell commands;
- external process execution;
- absolute filesystem paths;
- `FileSystemAdapter` assumptions;
- desktop-only APIs as part of core functionality;
- runtime network calls for core behaviour;
- CDN-loaded assets;
- telemetry.

## Vault access

Use Obsidian vault APIs rather than direct filesystem APIs.

Allowed patterns:

- scan Markdown files through Obsidian vault APIs;
- read metadata through Obsidian metadata cache where suitable;
- write frontmatter through Obsidian file manager APIs;
- create folders/files through Obsidian vault APIs.

Avoid treating the vault as a normal OS directory.

## UI constraints

The UI must be touch-friendly.

Important actions should not rely on hover, keyboard shortcuts, or status bar UI.

Score buttons should be large enough for mobile use and must show interval days.

The queue preview should fit mobile screens, even if it requires vertical scrolling.

## Status bar

Do not rely on Obsidian’s status bar for essential plugin state. Status bar APIs are not available on mobile.

## Offline behaviour

Core plugin functionality must work fully offline:

- review;
- dry run;
- stats;
- initialization;
- validation;
- seed data.

Seed data must be bundled with the plugin.

## External links

Documentation links are fine in README/docs, but the plugin must not require online access at runtime.

## Sync assumptions

The plugin should not require Obsidian Sync, iCloud, Git, Dropbox, or any other sync provider.

It should simply operate on the local vault state available to Obsidian.

That said, sync operations must be supported, as this is a common use for users on multiple devices. Given that outputs are all saved in note front matter, syncing should not be affected by the use of the plugin. But it is a requirement that the plugin should interfere with sync operations.

## Error handling on mobile

Errors should be concise and actionable.

Examples:

```text
Tune folder not found. Open settings or run Initialize vault.
```

```text
Cannot update review metadata for this tune. The note may have invalid frontmatter.
```

## Acceptance criteria

Mobile/offline support is acceptable when:

- the plugin loads on mobile;
- no desktop-only APIs are used;
- all core features work without internet access;
- the review UI is touch-friendly;
- the queue preview is usable on a small screen;
- automated checks/lint rules prevent obvious Node/Electron imports.
