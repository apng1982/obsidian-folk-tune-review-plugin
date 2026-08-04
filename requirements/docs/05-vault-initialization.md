# Vault initialization

## Overview

The plugin will expect a specific vault structure, but it should be able to create and validate that structure from inside Obsidian.

A mature version should support this flow:

```text
Create blank vault → install plugin → run Initialize vault → usable folk tune review vault
```

## Initialize command

The Initialize command should open a wizard.

Suggested flow:

1. Choose or confirm root folder.
2. Preview folders and seed notes to create.
3. Preview tune template(s) to create.
4. Preview missing metadata to add, if enabled.
5. Apply changes only after explicit confirmation.
6. Show a summary.

## Idempotency

Initialization must be safe to run multiple times.

It should not duplicate folders or notes.

It should not overwrite user-edited seed notes unless the user explicitly asks for a reset/update.

Example preview:

```text
Already exists:
- Folk Tunes/Origins/Ireland.md

Will create:
- Folk Tunes/Modes/Dorian.md
- Folk Tunes/Templates/Tune.md

Will update:
- none
```

## Suggested default structure

The exact structure can be configurable, but a default generated vault could look like:

```text
Root/
  Repertoire/
  Repertoire/Tunes/
  Repertoire/Sets
  Repertoire/Dots
  Ref/
  Ref/Composer/
  Ref/Geo/
  Ref/Keys/
  Ref/Modes/
  Ref/Types/
  Templates/
```

## Configurable paths

Do not deeply hard-code the author’s personal vault paths.

Suggested settings:

```yaml
rootFolder: Repertoire
tuneFolder: Repertoire/Tunes
originFolder: Ref/Geo
keyFolder: Ref/Keys
modeFolder: Ref/Modes
typeFolder: Ref/Types
```

The default tune folder should be `Repertoire/Tunes`. Users should be able to
adapt existing vaults by changing the path in plugin settings.

## Seed data

The plugin should be able to seed common musical reference notes.

Potential seed categories:

- origins/geographies;
- keys;
- modes;
- tune types;
- tune template.

Example origins:

```text
Ireland
Scotland
England
Wales
Brittany
Sweden
```

Example keys:

```text
A
Bb
B
C
D
Eb
E
F
G
```

Example modes:

```text
D Dorian
G Mixolydian
B Aeolian
```

Example tune types:

```text
Reel
Jig
Hornpipe
Waltz
Polka
March
Air
Slip jig
Strathspey
```

These lists are seed defaults only. They should be easy to edit or extend.

## Seed data packaging

Do not rely on loose Markdown seed files being available beside the plugin at runtime.

Community plugin releases install `main.js`, `manifest.json`, and optionally `styles.css`. Seed definitions should therefore be embedded into the plugin bundle as TypeScript constants or bundled data.

## Tune template

A generated tune template might look like:

```markdown
---
type: ""
key: 
  - ""
mode: 
  - ""
whistle:
  - ""
origin:
composer:
sets: []
learn: true 
sessions: []
collections: []
created: <% tp.date.now("YYYY-MM-DD") %>
---


```

The template should not include review metadata until a review has occurred.

## Validation

Initialize and/or Validate should be able to report:

- missing required folders;
- missing seed categories;
- invalid review scores;
- invalid review dates;
- review metadata where `nextDue` does not match `lastReviewed + intervalDays`;
- tunes missing required learning metadata;
- unknown or malformed origin links, if enforced.

Validation should be read-only unless the user explicitly asks to apply fixes.

## Acceptance criteria

Initialization is acceptable when:

- a blank vault can be prepared for use;
- the operation is previewed before writes;
- existing user content is not overwritten by default;
- the operation is idempotent;
- seed data is available offline;
- validation can run read-only;
- all planning logic is unit tested.
