# Testing strategy

## Testing goal

Testing is a primary requirement.

The plugin should be developed so that business logic is thoroughly unit tested and adapter/application behaviour is tested as far as practical.

## Recommended tooling

Suggested baseline:

- TypeScript strict mode;
- Vitest or Jest for unit tests;
- ESLint;
- Prettier or equivalent formatting;
- CI running typecheck, lint, tests, and build.

Vitest is a good default for modern TypeScript projects, but Jest is acceptable if preferred.

## Test pyramid

### 1. Domain unit tests

Most tests should live here.

These tests should be fast, deterministic, and free from Obsidian APIs.

Required coverage areas:

- score validation;
- score-to-interval mapping;
- next due date calculation;
- review state creation;
- date parsing/formatting;
- tune eligibility;
- excluded tune filtering;
- session-maintained tune filtering;
- origin filtering;
- never-reviewed classification;
- due/overdue classification;
- top-up selection;
- queue ordering;
- queue ordering with and without never-reviewed prioritisation;
- stats calculation;
- initialization planning;
- validation rules.

### 2. Application tests

Application tests should use fake ports.

Required coverage areas:

- build review session from repository results;
- complete review item in live mode;
- complete review item in dry run mode;
- ensure dry run does not call writer;
- skip item does not write;
- current-note review validates tune folder and eligibility;
- current-note review writes the same review state as queue review;
- excluded/session-maintained flag actions write only the intended flag;
- end session leaves unreviewed items unchanged;
- stats use case does not write;
- initialization preview does not write;
- initialization apply writes only planned changes.

### 3. Obsidian adapter tests

Adapter tests should be limited and focused.

Because Obsidian APIs are not trivial to run in normal Node tests, prefer thin adapters and test mapping functions separately.

Testable pieces:

- frontmatter object to domain tune mapping;
- domain review state to frontmatter mutation;
- settings default merging;
- `dev/test mode` and never-reviewed prioritisation default merging;
- seed plan to vault operations;
- path normalization using Obsidian-style vault paths.

### 4. Integration tests

Integration tests should use a fixture vault representation where possible.

Useful fixture cases:

- empty vault;
- initialized blank vault;
- vault with learned tunes only;
- vault with excluded/session-maintained tunes;
- vault with mixed origins;
- vault with invalid review metadata;

Later, consider Obsidian-specific E2E tooling if the plugin matures.

## Dry run test requirements

Dry run must be explicitly tested.

Tests should prove:

- the same queue is built as live mode for the same options;
- score selection advances the session;
- no `ReviewWriter` call occurs;
- skipped items remain unchanged;
- completion summary says no writes occurred.

## Review write test requirements

Live review tests should prove:

- score `0` writes interval `1`;
- score `9` writes interval `365`;
- `lastReviewed` is the injected `today` date;
- `nextDue` is calculated from today plus interval;
- only review metadata is changed;
- invalid scores are rejected before write.

## Queue test requirements

Queue tests should cover:

- overdue tunes selected before top-up tunes;
- never-reviewed handling;
- requested count respected;
- fewer available tunes than requested;
- origin filter;
- session-maintained exclusion/inclusion;
- excluded tune exclusion/inclusion;
- deterministic ordering when randomization is disabled.
- default priority: due/overdue, never reviewed, not due;
- never-reviewed priority: never reviewed, due/overdue, not due.

## Current-note review test requirements

Current-note review tests should prove:

- notes outside the configured tune folder cannot be reviewed;
- current-note review requires `learn: false`;
- excluded tunes can be reviewed directly;
- session-maintained tunes can be reviewed directly;
- malformed tune metadata prevents direct review;
- eligible active tune notes can be scored;
- successful live writes close the review UI and show an Obsidian notification.

## Review flag action test requirements

Review flag action tests should prove:

- `exclude from reviews` writes `review.excludedFromReview`;
- `mark as session maintained` writes `review.sessionMaintained`;
- neither action writes score/date metadata unless a score is selected;
- dry run does not persist either flag.

## Settings/UI visibility test requirements

Settings/UI tests should prove:

- default tune folder is `Repertoire/Tunes`;
- `dev/test mode` defaults to false;
- the review mode control is hidden when `dev/test mode` is false;
- the review mode control is visible and last when `dev/test mode` is true;
- `Prioritise never-reviewed tunes` defaults to false.

## Stats test requirements

Stats tests should cover:

- total discovered;
- learned count;
- eligible count;
- excluded count;
- session-maintained count;
- never-reviewed count;
- due today count;
- overdue count;
- most overdue ordering;
- counts by origin;
- counts by score.

## Initialize test requirements

Initialization tests should cover:

- blank vault plan;
- partially initialized vault plan;
- no-op plan for initialized vault;
- seed notes are not overwritten by default;
- missing folder creation;
- missing template creation;
- apply plan calls the expected writer operations.

## CI requirements

A minimal CI pipeline should run:

```text
npm ci
npm run typecheck
npm run lint
npm test
npm run build
```

No release should be created unless this pipeline passes.

## Coverage expectations

No exact percentage is required yet, but the standard should be high.

A sensible target once the project stabilizes:

- domain/application line coverage: 90%+;
- branch coverage for selection/date/review policy: very high;
- UI coverage: pragmatic rather than exhaustive.

## Acceptance criteria

The testing strategy is acceptable when:

- every business rule is represented in a test;
- all date-sensitive tests use an injected date;
- dry run write-safety is tested;
- no test requires a real Obsidian app for domain/application coverage;
- CI blocks broken builds.
