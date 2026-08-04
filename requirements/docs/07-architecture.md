# Architecture

## Overview

The plugin should be built as a clean TypeScript application with Obsidian as an adapter layer.

Business rules must not depend on Obsidian APIs.

## Architectural rule

```text
Domain code imports no Obsidian APIs.
Application code depends on interfaces.
Obsidian code implements those interfaces.
UI code orchestrates but does not contain business rules.
```

## Suggested folder structure

```text
src/
  main.ts

  domain/
    dates.ts
    review-score.ts
    review-policy.ts
    tune.ts
    review-state.ts
    tune-selection.ts
    stats.ts
    initialization-plan.ts
    validation.ts

  application/
    build-review-session.ts
    complete-review-item.ts
    calculate-stats.ts
    initialize-vault.ts
    validate-vault.ts

  ports/
    tune-repository.ts
    review-writer.ts
    note-opener.ts
    settings-store.ts
    clock.ts

  obsidian/
    obsidian-tune-repository.ts
    obsidian-review-writer.ts
    obsidian-note-opener.ts
    obsidian-settings-store.ts
    obsidian-vault-initializer.ts

  ui/
    review-start-modal.ts
    review-session-view.ts
    stats-view.ts
    initialize-modal.ts
    settings-tab.ts

  seed/
    default-origins.ts
    default-keys.ts
    default-modes.ts
    default-tune-types.ts
```

## Domain layer

The domain layer contains pure logic:

- score validation;
- score-to-interval mapping;
- next due date calculation;
- tune eligibility;
- review queue selection;
- stats calculation;
- initialization planning;
- validation rules.

It must not import from `obsidian`.

## Application layer

The application layer coordinates use cases through ports/interfaces.

Example use cases:

- build review session;
- review current tune;
- complete one review item;
- update review flags for one tune;
- calculate stats;
- build initialization plan;
- apply initialization plan;
- validate vault.

The application layer should be mostly testable with fake ports.

## Ports

Suggested ports:

```ts
export interface TuneRepository {
  getTunes(): Promise<Tune[]>;
}

export interface ReviewWriter {
  writeReview(tuneId: string, review: ReviewState): Promise<void>;
}

export interface NoteOpener {
  openTune(tune: Tune): Promise<void>;
}

export interface Clock {
  today(): LocalDateString;
}
```

More ports can be added for initialization and settings.

## Obsidian adapter layer

The Obsidian layer is the only layer that should import from `obsidian`.

Responsibilities:

- scan Markdown files from configured tune folder;
- read cached frontmatter/metadata;
- map Obsidian files to domain `Tune` objects;
- update frontmatter via `app.fileManager.processFrontMatter`;
- open tune notes in the workspace;
- save/load plugin settings;
- create folders and seed notes through vault APIs.

## UI layer

The UI layer should be thin.

It should:

- gather user options;
- display review queues;
- display score buttons and intervals;
- call application use cases;
- show success/error messages;
- remain mobile-friendly.

It should not:

- calculate queue selection;
- calculate next due dates;
- manipulate YAML directly;
- decide eligibility rules;
- contain test-critical business logic.

## Settings

Suggested settings:

```ts
export interface PluginSettings {
  rootFolder: string;
  tuneFolder: string;
  originFolder: string;
  keyFolder: string;
  modeFolder: string;
  typeFolder: string;
  templateFolder: string;
  defaultReviewCount: number;
  includeSessionMaintainedByDefault: boolean;
  includeExcludedByDefault: boolean;
  prioritiseNeverReviewedTunesByDefault: boolean;
  devTestMode: boolean;
}
```

Settings should be stored with Obsidian plugin data APIs.

## Date handling

Use local date strings, not date-times, for review state.

All date logic must go through a small date utility or injected clock so tests do not depend on the real current date.

## Error handling

The plugin should distinguish:

- validation errors;
- missing folder/configuration errors;
- malformed metadata;
- write failures;
- unexpected exceptions.

User-facing errors should be concise and actionable.

## Logging

Avoid noisy logging.

Do not rely on console logs for normal usage.

For debugging, consider a developer/debug setting later.

## Acceptance criteria

The architecture is acceptable when:

- domain tests run without Obsidian;
- application tests run with fake ports;
- Obsidian imports are isolated;
- mobile-incompatible APIs are absent;
- review and stats logic are independent of UI;
- the plugin can be evolved without tangling domain rules into Obsidian views.
