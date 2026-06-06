# Implementation roadmap

## Phase 0: Repository setup

Goals:

- create plugin repo from Obsidian sample/plugin template;
- configure TypeScript strict mode;
- configure test runner;
- configure lint/typecheck/build scripts;
- configure CI;
- add this planning documentation.

Acceptance criteria:

- `npm test` runs;
- `npm run build` creates plugin assets;
- CI passes;
- plugin can load in a dev vault.

## Phase 1: Domain model and review policy

Goals:

- implement tune/review domain types;
- implement score validation;
- implement score-to-interval mapping;
- implement next-due calculation;
- implement date utilities with injectable clock.

Acceptance criteria:

- all review policy tests pass;
- no Obsidian imports in domain code;
- scores `0..9` map exactly to agreed interval days.

## Phase 2: Read-only vault scanning and queue preview

Goals:

2.1 (logic)
- implement Obsidian tune repository;
- scan configured tune folder;
- map frontmatter to domain tune objects;
- implement queue selection;

2.2 (UI)
- show full queue in a mobile-friendly UI;
- write nothing.

Acceptance criteria:

- Review command can build and show a queue;
- all selected tunes are visible;
- no writes occur;
- selection logic is unit tested;
- mobile UI is usable.

## Phase 3: Dry run review session

Goals:

- run through the selected queue;
- open tune notes, without losing review session context;
- select scores;
- advance/skip/end session;
- write nothing.

Acceptance criteria:

- dry run can be completed;
- dry review session recap is displayed;
- score buttons show interval days;
- writer port is not called;
- dry run tests pass.

## Phase 4: Live review writes

Goals:

- implement review writer;
- write nested `review` metadata to tune frontmatter;
- update only latest review state;
- add error handling.

Acceptance criteria:

- live review writes `lastReviewed`, `score`, `intervalDays`, `nextDue`;
- no notes/comments are written;
- no history is written;
- invalid scores are rejected;
- write behaviour is tested.


## Alpha Checkpoint 

Goals: 

- Manual testing of desktop plugin
- Manual testing of mobile plugin
- Review and extend test suite 
- Create and populate public user documentation
- Create initial README.md summary for Obsidian community consumption, with an overt reference to more extensive documentation.


## Phase 5: Stats

Goals:

- implement stats domain/application code;
- add Stats command;
- show stats in modal/view;
- keep stats read-only.

Acceptance criteria:

- stats are deterministic for injected `today`;
- stats tests pass;
- stats command writes nothing;
- UI is mobile-friendly.

## Phase 6: Initialize and Validate

Goals:

- implement initialization planning;
- seed folders/notes/templates;
- add validation rules;
- preview before applying changes;
- make operation idempotent.

Acceptance criteria:

- blank vault can be initialized;
- existing vault can be validated;
- no overwrites by default;
- seed data works offline;
- initialization planning and apply tests pass.

## Phase 7: Beta distribution

Goals:

- add release GitHub Action;
- produce GitHub release assets;
- document beta install;
- test with colleagues.

Acceptance criteria:

- release contains `main.js`, `manifest.json`, `styles.css`;
- beta users can install without CLI;
- mobile install/review/dry-run tested.

## Beta Checkpoint

Goals: 

- Manual testing of desktop plugin
- Manual testing of mobile plugin
- Review and extend test suite, as required
- Review and extend public user documentation
- Review and extend README.md summary for Obsidian community consumption


## Phase 8: Public/community readiness

Goals:

- improve README;
- add screenshots/GIFs;
- complete mobile checklist;
- submit to community plugin process

Acceptance criteria:

- no desktop-only APIs;
- release process is repeatable;
- documentation is sufficient for non-technical users;
- plugin can be used from blank-vault initialization to review workflow.
