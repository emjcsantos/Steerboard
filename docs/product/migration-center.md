# Migration Center

Steerboard should let users ask for migration in natural language:

> Migrate my Codex setup into Steerboard.

> Inspect my Claude Code setup and import the safe settings.

> Bring over my Antigravity MCP servers and agent preferences.

The migration center is a guided import workflow, not a blind copy operation. It should inspect a source platform, show a preview, redact secrets, ask for approval, then create Steerboard profiles and provider mappings.

## Goals

- Reduce setup friction for users already working in another agent desktop, CLI, or IDE.
- Preserve useful settings, commands, skills, plugins, MCP servers, project instructions, and provider preferences.
- Keep imported data reviewable, reversible, and separated from the original source platform.
- Make Steerboard useful as a central cockpit without forcing users to manually rebuild every integration.

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

## Required Migration Flow

1. User asks Steerboard to migrate from a source platform.
2. Steerboard detects or asks for the source location.
3. The source adapter scans metadata only by default.
4. Steerboard shows a migration preview grouped by category.
5. Secrets, tokens, auth caches, private browser state, and raw transcripts are marked excluded.
6. User chooses which categories to import.
7. Steerboard writes imported data into a named Steerboard profile.
8. Steerboard records a local migration audit summary.
9. User can roll back the imported profile or refresh from the source later.

## Safety Rules

- Never import access tokens, API keys, OAuth refresh tokens, auth caches, cookies, browser profiles, or credential-store records.
- Never mutate the source platform unless the user explicitly asks for a write-back operation.
- Default to read-only scanning and profile creation.
- Redact local paths in public docs, screenshots, and demo fixtures.
- Treat executable hooks, scripts, plugin commands, MCP server commands, and automation prompts as review-required before enabling.
- Disable imported live execution by default until the user approves the target provider, workspace posture, and permission gates.

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
