# Release and distribution

## Overview

Distribution should support three stages:

1. personal development;
2. beta/private sharing;
3. community plugin release.

Mobile support must remain a first-class release criterion.

## Development install

During development, the plugin can be built and copied into a local vault under:

```text
.vault-root/.obsidian/plugins/<plugin-id>/
```

The required runtime files are typically:

```text
main.js
manifest.json
styles.css
```

`styles.css` is optional if the plugin has no styles, but likely useful for the review UI.

## Build automation

The repository should include scripts for:

```text
npm run dev
npm run build
npm run test
npm run lint
npm run typecheck
```

A local development helper may copy built files into a configured test vault, but that helper must not be part of plugin runtime functionality.

## GitHub Actions

CI should run on pull requests and main branch pushes:

```text
npm ci
npm run typecheck
npm run lint
npm test
npm run build
```

Release automation should create a GitHub release when a version tag is pushed.

The release should attach:

```text
main.js
manifest.json
styles.css
```

The release tag should match the plugin version in `manifest.json`.

## Beta sharing

Before community release, share with colleagues through GitHub releases and/or BRAT-style beta installation.

This allows testing with real vaults without going through the full community plugin directory review immediately.

## Community plugin release

For community release, submit to the Obsidian community plugin process.

Important release expectations:

- the GitHub release tag matches the version in `manifest.json`;
- the release contains `manifest.json`, `main.js`, and optionally `styles.css`;
- `versions.json` is maintained for compatibility metadata;
- `isDesktopOnly` is `false`;
- README clearly explains usage and mobile support;
- the plugin does not use Node/Electron-only APIs.

## Branching strategy

1. Development will be done on `feature/branches`
2. Beta testing (including mobile) will be done on the `prerelease` branch
3. Community eleases will be done on the `main` branch.

No PR merges should be done to `main` branch until a community release is ready.

Initial, MVP development may be done on the `prelease` branch, moving to use of feature branches from v1.0.0 onwards.

## Versioning

Use semantic versioning:

```text
0.x.y while unstable/beta
1.0.0 for first mature public release
```

## Mobile release checklist

Before every release:

- test install/update on desktop;
- test install/update on mobile;
- test Review on mobile;
- test dry run on mobile;
- test Stats on mobile;
- test Initialize/Validate on mobile;
- confirm offline behaviour;
- confirm no Node/Electron imports.

## Documentation for users

At minimum, the README should document:

- what the plugin does;
- required/recommended vault structure;
- how to initialize a vault;
- how to run a review;
- what score intervals mean;
- what dry run means;
- what metadata is written;
- how to view stats;
- mobile/offline support;
- known limitations.

## Acceptance criteria

Release/distribution is acceptable when:

- build output includes required plugin assets;
- releases can be created automatically through GitHub Actions;
- beta users can install without a CLI;
- mobile support is tested before release;
- release docs explain initialization and review behaviour clearly.
