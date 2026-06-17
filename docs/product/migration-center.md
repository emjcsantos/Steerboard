# Migration Center

Steerboard should let users ask for migration in natural language:

> Migrate my Codex setup into Steerboard.

> Inspect my Claude Code setup and import the safe settings.

> Bring over my Antigravity MCP servers and agent preferences.

The migration center is a guided import workflow, not a blind copy operation. It should inspect a source platform, show a preview, redact secrets, ask for approval, then create Steerboard profiles and provider mappings.

The primary entry point is the desktop app menu:

```text
File > Migrate...
```

Natural-language requests such as "migrate my Codex setup" should open the same flow, but the menu path must always exist for users who expect a desktop-style command surface.

## Goals

- Reduce setup friction for users already working in another agent desktop, CLI, or IDE.
- Preserve useful settings, commands, skills, plugins, MCP servers, project instructions, and provider preferences.
- Keep imported data reviewable, reversible, and separated from the original source platform.
- Make Steerboard useful as a central Arena without forcing users to manually rebuild every integration.

## Supported Source Types

Each source platform needs an import adapter. Initial planned adapters:

- Codex
- Claude Code
- Antigravity
- generic MCP config import
- generic skill/prompt folder import
- manual JSON or TOML import for advanced users

Other platforms can be added by implementing the same migration adapter contract.

## Importable Categories

Adapters should declare which categories they support:

- projects and workspace registry entries,
- threads, chats, and session metadata where the source exposes exportable history safely,
- account and connection posture, without importing credentials,
- model/provider preferences,
- sandbox, permission, and approval preferences,
- slash commands and custom command shortcuts,
- skills, prompts, agents, and reusable workflows,
- plugin manifests and plugin enablement state,
- MCP server definitions and tool policies,
- project or workspace instruction files,
- automation definitions where the source exposes them safely,
- UI preferences such as theme, sidebar visibility, layout, and notification posture.

The migration dialog should present these categories as checkboxes. Unsupported categories remain visible but disabled with a short reason, so users understand why an item cannot be migrated from the selected source.

## Required Migration Flow

1. User opens `File > Migrate...` or asks Steerboard to migrate from a source platform.
2. Steerboard opens a migration dialog with a source picker.
3. User chooses the source platform, such as Codex, Claude Code, Antigravity, generic MCP config, skill/prompt folder, or manual JSON/TOML.
4. Steerboard detects or asks for the source location.
5. The source adapter scans metadata only by default.
6. Steerboard shows checkbox categories for projects, threads/chats, plugins, skills, MCP, personalization, commands, settings, automations, and UI preferences.
7. User chooses which categories to migrate.
8. Steerboard shows a migration preview grouped by category.
9. Secrets, tokens, auth caches, private browser state, and raw transcripts are marked excluded.
10. User confirms the import.
11. Steerboard writes imported data into a named, reviewable Steerboard profile draft.
12. Steerboard records a local migration audit summary for the draft, including import mode, selected categories, acceptance decisions, excluded fields, and safe metadata diffs.
13. Steerboard shows a migration review gate for preview selection, apply intent, rollback evidence, audit consistency, and sensitive exclusions.
14. User can review the draft, stage apply review, refresh from source, or roll it back safely. Profile activation remains locked until explicit approval and future apply support exist.

## Desktop Menu Requirement

Steerboard should expose a familiar desktop menu bar at the top-left of the application:

```text
File  Edit  View  Window  Help
```

`File` owns app-level project and migration operations:

- New chat
- Open project
- Open recent
- Migrate...
- Import profile
- Export profile
- Settings

The first implementation can render the menu in the app shell, with native desktop menu integration added when the shell supports it. The visible order and labels should remain stable across browser preview and desktop preview.

## Migration Dialog Shape

The `File > Migrate...` dialog should include:

- source platform selector,
- source location picker or auto-detected path summary,
- category checkbox list,
- import mode: create new profile, merge into profile, or preview only,
- conflict behavior: keep existing, replace, duplicate, or ask per item,
- live-execution toggle defaulting off,
- tool-scope selector defaulting to minimum required tools only,
- excluded secrets summary,
- preview table grouped by category,
- confirmation step,
- rollback summary after import.
- review gate showing apply-intent lock, rollback evidence, audit consistency, sensitive-exclusion status, and profile activation lock as separate owner-review records.

The goal is that a user can end with the same practical working condition as the source application: projects visible, usable chat/session context where safely exportable, matching plugins and skills, matching MCP server definitions, matching personalization posture, and matching relevant settings.

Reviewed profile draft persistence is contractually read-only until explicitly applied:

- Draft state includes normalized migration metadata only and excludes secrets, tokens, auth files, browser state, raw transcripts, and source artifacts.
- Each draft stores a rollback/undo summary so the migration can be reverted without touching source data.
- A local audit summary is kept with a compact event log and a source-fingerprint note for operator review and traceability.

## Migration Review Gate

The migration dialog includes a review gate before any profile activation path. The gate is metadata-only and must show:

- whether safe metadata categories are selected,
- whether unsupported categories remain excluded,
- whether a reviewed draft exists,
- whether apply intent is ready, held for review, waiting, or blocked,
- whether rollback evidence exists for the local draft history,
- whether the latest audit matches the latest draft,
- whether sensitive exclusions are complete,
- whether profile activation remains locked behind explicit owner approval.

The review-depth records separately show:

- apply-intent lock evidence, including draft id, import state, audit match, and owner-visible apply-intent notice,
- rollback evidence, including latest draft id, prior active-profile pointer, rollback audit note, checksumable manifest references, and no-source-mutation boundary,
- audit consistency, including draft/audit id match, selected category count, review-required count, and unsupported count,
- sensitive exclusions, including secrets, tokens, auth caches/files/state, browser state, source artifacts, source mutation, and raw transcript exclusions,
- profile activation lock, including the disabled mutation boundary before owner approval.

`Stage apply review` records an owner-visible intent notice only. It does not change the active profile, mutate the source platform, copy secrets, import raw transcripts, run commands, or enable provider execution.

## Safety Rules

- Never import access tokens, API keys, OAuth refresh tokens, auth caches, cookies, browser profiles, or credential-store records.
- Never mutate the source platform unless the user explicitly asks for a write-back operation.
- Default to read-only scanning and profile creation.
- Redact local paths in public docs, screenshots, and demo fixtures.
- Treat executable hooks, scripts, plugin commands, MCP server commands, and automation prompts as review-required before enabling.
- Disable imported live execution by default until the user approves the target provider, workspace posture, and permission gates.
- Limit imported tools to the functions that are actually needed for the selected migration categories. Extra tools, broad tool suites, and unused MCP tools should stay disabled until explicitly enabled.
- Imported threads or chats must be metadata-only unless the source offers an explicit safe export path and the user selects it.

## Reviewed Draft Persistence

- Migration creates a local draft profile in Steerboard before any active profile is changed.
- The draft stores approved metadata and reversible diffs only.
- The audit summary is written locally and must include:
  - migration source and detected adapter,
  - selected source categories,
  - item counts by category (`accepted`, `review`, `skipped`, `excluded`),
  - checksumable manifest references used for rollback.
- Rollback restores the previous active profile pointer and archive-safe draft snapshot metadata.
- There is no full source migration claim in this milestone; source data and secrets remain excluded by design.

## Adapter Contract

Each migration adapter should expose:

- source platform id and display name,
- detection rules,
- supported config file formats,
- supported import categories,
- sensitive fields to redact or exclude,
- parser and validation version,
- migration preview builder,
- conflict detection,
- rollback plan,
- refresh plan,
- unsupported-state copy.
- minimum required tool list for each import category.

The migration center should normalize source-specific concepts into Steerboard's provider-neutral model. If a source has no equivalent for a Steerboard feature, the preview must say so clearly instead of faking support.

## Codex Import Baseline

The Codex importer should support:

- default option seeding for plugins, skills, slash commands, MCP servers, and personalization sources,
- config-layer inspection for user, profile, and trusted project configuration,
- connection posture detection,
- app-server capability detection,
- MCP server catalog import,
- skill registry import,
- plugin metadata import,
- rules and memory-state visibility where available.

Codex secrets and auth storage remain owned by Codex and must not be copied into Steerboard.
