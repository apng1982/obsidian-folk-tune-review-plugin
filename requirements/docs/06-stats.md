# Stats

## Overview

Stats should provide a useful summary of the tune review state without modifying the vault.

Stats are calculated from tune metadata and current date.

## Core stats

Initial stats should include:

- total tune notes discovered;
- total learned tunes;
- eligible review tunes;
- excluded tunes;
- session-maintained tunes;
- never-reviewed tunes;
- due today;
- overdue tunes;
- most overdue tunes;
- reviewed recently;
- counts by score;
- counts by next-due band.

## Suggested due bands

Example bands:

```text
Overdue
Due today
Due in 1–7 days
Due in 8–30 days
Due in 31–90 days
Due after 90 days
Never reviewed
```

## Most overdue list

Show a short list of the most overdue tunes.

Suggested fields:

- title;
- due date;
- overdue days;
- origin(s);
- last score.

## Score distribution

Show how many tunes currently have each last score:

```text
0: 2 tunes
1: 3 tunes
...
9: 42 tunes
```

Tunes with no review should be counted separately as never reviewed.

## Origin stats

Show counts by origin where metadata supports it.

Potential values:

- total learned;
- eligible;
- due/overdue;
- never reviewed.

## UI surface

Stats may initially be a modal or simple custom view.

Eventually, a dashboard/sidebar may be useful.

Stats UI must be mobile-friendly and not rely on status bar UI.

## No writes

Stats must never modify files or plugin data.

## Test requirements

Stats logic should be pure domain/application code and unit tested with fixture tune objects.

Tests should cover:

- empty vault;
- all never-reviewed tunes;
- due today;
- overdue tunes;
- excluded/session-maintained filtering;
- origin grouping;
- invalid/missing review metadata handling;
- date boundary cases.

## Acceptance criteria

Stats are acceptable when:

- calculated values are deterministic for a supplied `today` value;
- no Obsidian APIs are required for core calculations;
- no writes occur;
- the UI is usable on mobile;
- all stats calculations are unit tested.
