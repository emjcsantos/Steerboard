# Current State And Pipeline

This document summarizes the current public development state for Steerboard. It is a product-facing handoff, not an internal execution log.

## Current State

Steerboard is an active desktop-app scaffold with a familiar multi-session cockpit pattern, provider-neutral runtime boundaries, local-first security posture, and public-safe fixture data.

The current implementation includes:

- Desktop shell and local browser preview through the same Vite UI.
- Left project/thread navigation, compact app menu, right-side environment/progress panel, and central cockpit.
- Fixed cockpit layouts up to `3x3`, plus adaptive panel layout foundations with drag, resize, hide, reveal, project drag-in, chat drag-in, and saved-state repair.
- Cockpit panels with local chat composers, panel-scoped slash suggestions, provider-route transcript evidence, session state, and unsupported-control evidence.
- Provider-neutral runtime profile, adapter, stream, session, and bridge models.
- Desktop-backed safe metadata refresh for command, skill, plugin, MCP, automation, and personalization catalogs.
- Migration Center preview for safe working-condition metadata, with excluded secret/auth/transcript categories and rollback-friendly local draft state.
- Optional project/program planning lane with local dispatch previews and role-panel plan scaffolds.
- Approval, audit, privacy, and read-only runner foundations, with broad mutation paths intentionally disabled.
- Owner testing surfaces for catalog refresh, slash execution evidence, session-control evidence, Phase 3 smoke proof rows, and diagnostic exit-gate rows.
- Reload-safe Phase 3 smoke proof storage for desktop-executed smoke evidence, without running prompts automatically on startup.

## Active Pipeline

| Target | Completion | Note |
|---|---|---|
| Phase 3 desktop proof clearance | In progress | Use desktop-mode gate actions to populate persisted live-control, active-turn interrupt, and active-turn steer proof rows; verify slash and session-control evidence moves to ready. |
| Provider integration surfaces | Next | Keep catalog refresh metadata-only while improving connection, setup-required, unsupported, blocked, and unavailable states across commands, skills, plugins, MCP, automations, and personalization. |
| Migration Center hardening | Next | Keep migration safe and metadata-only; finish preview/apply/rollback checks before any source mutation or raw transcript handling is considered. |
| Planning and dispatch loop | Future active | Convert staged project/program work into orchestrator, implementer, validator, and integration panels with scoped handoff packets and visible attempt limits. |
| Permission and audit depth | Future active | Expand approval and audit records before enabling broader desktop, terminal, Git, MCP, plugin, automation, runtime, profile, or external-service mutations. |
| Packaging and installation | Deferred | Keep packaging paused until the core live cockpit workflow is repeatable from a clean checkout. |

## Future Tasks

- Complete live panel chat hardening for one-panel and multi-panel desktop sessions.
- Finish panel lifecycle controls for interrupt, retry, steer, fork, resume, and archive where providers support them.
- Add richer incremental streaming evidence and failure recovery for cockpit panels.
- Connect planning-lane dispatch records to live worker/session creation only after the permission and audit model is ready.
- Add plugin, skill, MCP, and automation execution paths behind explicit provider support and approval gates.
- Add permissioned terminal and Git evidence capture after the read-only runner path is proven.
- Add signed audit export, rollback references, and release privacy checks.
- Prepare a clean Git-based install path and desktop packaging only after the live workflow passes repeatable local testing.

## Closeout Note

The documentation closeout records the current implementation state and carries the remaining work forward as pipeline items. The product is not feature-complete yet; the next implementation goal should begin with Phase 3 desktop proof clearance.
