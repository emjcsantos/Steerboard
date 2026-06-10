# Current State And Pipeline

This document summarizes the current public development state for Steerboard. It is a product-facing handoff, not an internal execution log.

## Current State

Steerboard is an active desktop-app scaffold with a familiar multi-session Arena pattern, provider-neutral runtime boundaries, local-first security posture, and public-safe fixture data.

The current implementation includes:

- Desktop shell and local browser preview through the same Vite UI.
- Left project/thread navigation, compact app menu, right-side environment/progress panel, and central arena.
- Fixed Arena layouts up to `3x3`, plus adaptive panel layout foundations with drag, resize, hide, reveal, project drag-in, chat drag-in, and saved-state repair.
- Arena panels with local chat composers, panel-scoped slash suggestions, provider-route transcript evidence, session state, and unsupported-control evidence.
- Provider-neutral runtime profile, adapter, stream, session, and bridge models.
- Desktop-backed safe metadata refresh for command, skill, plugin, MCP, automation, and personalization catalogs.
- Phase 4 Provider Readiness panel that classifies command, skill, plugin, MCP, automation, and personalization surfaces as ready, preview, setup-required, unsupported, unavailable, or blocked without executing provider actions.
- Migration Center preview for safe working-condition metadata, with excluded secret/auth/transcript categories, rollback-friendly local draft state, and a review gate that keeps apply intent metadata-only.
- Optional project/program planning lane with local dispatch previews, role-panel plan scaffolds, and saved dispatch review records.
- Approval, audit, privacy, Phase 8 missing-requirement explanations, and read-only runner foundations, with broad mutation paths intentionally disabled.
- Owner testing surfaces for catalog refresh, slash execution evidence, session-control evidence, Phase 3 smoke proof rows, diagnostic exit-gate rows, and a Phase 3 clearance package.
- Owner testing priority evidence and explicit smoke actions for Phase 1 one-panel live proof, Phase 2 multi-panel isolation, and Phase 6 Project Management phase-board staging readiness.
- Reload-safe Phase 1/2 and Phase 3 smoke proof storage for desktop-executed smoke evidence, without running prompts automatically on startup.
- A right-panel remaining-goals summary that maps each remaining target to Phase 1 through Phase 11 and to the Project Management rows that can stage Arena review packages.

## Active Pipeline

| Target | Completion | Note |
|---|---|---|
| Phase 1/2/6 priority slice | In progress | Use the Owner Testing priority evidence card and explicit Phase 1/2 smoke actions to track one-panel live proof, two-panel isolation, and PM phase-board Epic/Parent/Child staging readiness together. |
| Phase 3 desktop proof clearance | In progress | Use the Phase 3 clearance package to identify the next runnable proof, populate persisted live-control, active-turn interrupt, and active-turn steer proof rows, and verify slash/session-control evidence reaches ready or an exact blocker. |
| Provider integration surfaces | Next | Use the Phase 4 Provider Readiness panel to keep catalog refresh metadata-only while improving connection, setup-required, unsupported, blocked, preview, ready, and unavailable states across commands, skills, plugins, MCP, automations, and personalization. |
| Migration Center hardening | Next | Use the Migration review gate to keep migration safe and metadata-only while checking preview selection, apply intent, rollback evidence, audit consistency, and sensitive exclusions before any profile activation is considered. |
| Planning and dispatch loop | Next | Convert staged project/program work into orchestrator, implementer, validator, and integration panels with scoped handoff packets, saved review records, and visible attempt limits. |
| Permission and audit depth | Next | Use the Phase 8 Audit Depth panel to explain missing permission, approval, evidence, audit persistence, and rollback requirements before enabling broader desktop, terminal, Git, MCP, plugin, automation, runtime, profile, or external-service mutations. |
| Packaging and installation | Deferred | Keep packaging paused until the core live Arena workflow is repeatable from a clean checkout. |

## Remaining Goals

| Target | Phases | Status | Goal | Next Action |
|---|---|---|---|---|
| Unblock Phase 1/2/6 publishing | Phase 1, Phase 2, Phase 6 | Blocked | Hold the completed priority slice locally until the Steerboard public remote is restored and the owner approves pushing. | Keep the branch local, preserve the proof commit, and push only after the remote is recreated and the owner says to push. |
| Phase 3 desktop proof clearance | Phase 3 | Active | Clear live-control, active-turn interrupt, active-turn steer, slash, and session-control proof rows from desktop mode. | Use the Phase 3 clearance package to run any recommended desktop proof, reload, and verify exit-ready handoff or an exact blocker. |
| Provider integration surfaces | Phase 4 | Next | Harden command, skill, plugin, MCP, automation, and personalization readiness states while keeping refresh metadata-only. | Use the Phase 4 Provider Readiness panel to resolve setup-required, unsupported, unavailable, blocked, preview, and ready labels before enabling execution. |
| Migration Center hardening | Phase 5 | Next | Finish preview, apply-intent, rollback, and audit review for metadata-only migration work. | Use the Migration review gate to keep apply intent locked, confirm rollback evidence, and repair audit blockers before any profile activation. |
| Planning and dispatch loop | Phase 7 | Next | Turn staged PM work into orchestrator, implementer, validator, and integration handoff packets with visible attempt limits. | Use dispatch review records to audit role counts, attempt limits, handoff tasks, and validation gates before any live worker session spawning. |
| Permission and audit depth | Phase 8 | Next | Expand approval gates, disabled-path explanations, audit persistence, and rollback notes before mutation paths grow. | Use the Phase 8 Audit Depth panel to resolve missing permission, approval, evidence, audit persistence, and rollback explanations before mutation paths grow. |
| Desktop-backed runner approval | Phase 9 | Planned | Allow one reversible approved desktop-backed action only after permission, audit, validation, and rollback gates pass. | Pick a low-risk reversible action and require owner approval, preview, validation output, and rollback evidence. |
| Adaptive Arena polish | Phase 10 | Planned | Polish adaptive layout, density, keyboard controls, focus state, and Arena terminology after core live proof clears. | Run layout regression checks across common viewport sizes and keep old public vocabulary from returning. |
| Owner Testing command center | Phase 11 | Planned | Make Owner Testing the single pass-fail release gate for proof freshness, blockers, phase readiness, and next actions. | Group proof actions, freshness, reload checks, and unresolved blockers into one owner-readable readiness path. |
| Release readiness pass | Phase 11 | Paused | Run the final clean-checkout, build, smoke, packaging, docs, and known-limits pass before release. | Stay paused until the live Arena workflow, provider gates, migration safety, audit depth, and owner proof loop are stable. |

## Future Tasks

- Complete live panel chat hardening for one-panel and multi-panel desktop sessions.
- Finish panel lifecycle controls for interrupt, retry, steer, fork, resume, and archive where providers support them.
- Add richer incremental streaming evidence and failure recovery for Arena panels.
- Connect planning-lane dispatch records to live worker/session creation only after the permission and audit model is ready.
- Add plugin, skill, MCP, and automation execution paths behind explicit provider support and approval gates.
- Add permissioned terminal and Git evidence capture after the read-only runner path is proven.
- Add signed audit export, rollback references, and release privacy checks.
- Prepare a clean Git-based install path and desktop packaging only after the live workflow passes repeatable local testing.

## Closeout Note

The documentation closeout records the current implementation state and carries the remaining work forward as pipeline items. The product is not feature-complete yet; the next implementation goal should keep local proof branches unpushed until owner approval, then continue clearing Phase 3 desktop proof and Phase 4 provider readiness blockers.
