# Obsidian Folk Tune Review Plugin — Planning Notes

This repository is intended to replace the existing `CloudAwesome.FolkTune.Reviewer` .NET CLI with a new Obsidian-native plugin.

The CLI should be treated as a reference implementation for behaviour, terminology, and tests, but the plugin is a complete re-code from the ground up. If the plugin succeeds, the CLI will be deprecated.

## Product summary

The plugin manages a spaced-review workflow for folk tunes stored as Markdown notes in an Obsidian vault.

The plugin must be:

- mobile-first;
- offline-first;
- Obsidian-native;
- test-first/test-heavy;
- safe to run repeatedly;
- free from desktop-only APIs;
- usable by non-technical musicians once mature.

## Top-level command areas

The product has exactly three top-level functional areas:

1. **Review**
2. **Stats**
3. **Initialize**

There is intentionally no `pick` command in the plugin. The old CLI `pick` behaviour becomes part of the Review queue preview.

## Documentation map

- [`docs/01-product-requirements.md`](docs/01-product-requirements.md) — agreed product requirements and non-goals.
- [`docs/02-command-model.md`](docs/02-command-model.md) — command palette structure and UI entry points.
- [`docs/03-review-workflow.md`](docs/03-review-workflow.md) — review queue, dry run, scoring, and write behaviour.
- [`docs/04-metadata-schema.md`](docs/04-metadata-schema.md) — proposed nested frontmatter model.
- [`docs/05-vault-initialization.md`](docs/05-vault-initialization.md) — required vault structure and seed data strategy.
- [`docs/06-stats.md`](docs/06-stats.md) — stats requirements and likely calculations.
- [`docs/07-architecture.md`](docs/07-architecture.md) — implementation architecture and boundaries.
- [`docs/08-testing-strategy.md`](docs/08-testing-strategy.md) — unit, adapter, integration, and UI testing expectations.
- [`docs/09-mobile-offline-guidelines.md`](docs/09-mobile-offline-guidelines.md) — hard constraints for mobile and offline support.
- [`docs/10-release-and-distribution.md`](docs/10-release-and-distribution.md) — beta, GitHub release, mobile, and community plugin notes.
- [`docs/11-implementation-roadmap.md`](docs/11-implementation-roadmap.md) — suggested development phases.
- [`docs/12-codex-implementation-brief.md`](docs/12-codex-implementation-brief.md) — concise brief to give to Codex/agentic IDE tooling.
- [`adr/0001-recode-as-obsidian-plugin.md`](adr/0001-recode-as-obsidian-plugin.md) — decision record.

## Key external references

These are useful while implementing the plugin:

- Obsidian sample plugin: <https://github.com/obsidianmd/obsidian-sample-plugin>
- Obsidian plugin API type definitions: <https://github.com/obsidianmd/obsidian-api>
- Obsidian developer docs: <https://docs.obsidian.md/>
- Obsidian `processFrontMatter` API: <https://docs.obsidian.md/Reference/TypeScript+API/FileManager/processFrontMatter>
- Obsidian community plugin release repo: <https://github.com/obsidianmd/obsidian-releases>
- Existing CLI repo: <https://github.com/apng1982/obsidian-folk-tune-review>
- Existing public docs: <https://docs.cloudawesome.uk/personal/obsidian-folk-tune-review/>
