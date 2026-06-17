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
- Phase 4 Surface Depth panel that summarizes surface coverage, setup blockers, capability gaps, preview review, and the execution lock while keeping provider work metadata-only with no command, skill, plugin, MCP, automation, personalization, network, terminal, Git, or profile execution.
- Migration Center preview for safe working-condition metadata, with excluded secret/auth/transcript categories, rollback-friendly local draft state, and a review-depth gate that keeps apply intent metadata-only while showing rollback evidence, audit consistency, sensitive exclusions, and profile activation lock.
- Optional project/program planning lane with local dispatch previews, role-panel plan scaffolds, and saved dispatch review records.
- Approval, audit, privacy, Phase 8 missing-requirement explanations, risk exceptions, disabled-path explanations, and read-only runner foundations, with broad mutation paths intentionally disabled.
- Phase 9 Runner Approval panel for the fixed `terminal-readonly-probe`, including owner permission, approval window, request preview, validation output, audit record, and rollback evidence targets.
- Phase 10 Arena Polish panel that tracks adaptive layout regression, density/readability, keyboard controls, focus state, terminology, and final Arena acceptance gates.
- Phase 11 Owner Command panel that gathers checklist coverage, proof freshness, blockers, phase readiness, next action, and fresh-checkout evidence into one pass/fail release gate, plus a Phase 11 Proof Freshness panel that breaks owner proof into Phase 1/2/6, Phase 3 clearance, desktop smoke, command-plan, and handoff rows.
- Phase 11 Evidence Records panel that shows fresh checkout, clean checkout, build/test, and docs/known-limits records with source, timestamp, missing, stale, malformed, waiting, review, blocked, and ready states.
- Phase 11 Release Readiness panel that gathers clean checkout, build/test, owner smoke proof, packaging lock, docs/known limits, and final release-decision evidence from structured records while keeping packaging paused.
- Owner testing surfaces for catalog refresh, slash execution evidence, session-control evidence, Phase 3 smoke proof rows, diagnostic exit-gate rows, a Phase 3 clearance package, a Phase 3 desktop smoke command plan, and a Phase 3 handoff gate with local record/clear actions.
- Owner testing priority evidence and explicit smoke actions for Phase 1 one-panel live proof, Phase 2 multi-panel isolation, and Phase 6 Project Management phase-board staging readiness.
- Reload-safe Phase 1/2 and Phase 3 smoke proof storage for desktop-executed smoke evidence, without running prompts automatically on startup.
- A right-panel remaining-goals summary that maps each remaining target to Phase 1 through Phase 11 and to the Project Management rows that can stage Arena review packages.

## Active Pipeline

| Target | Completion | Note |
|---|---|---|
| Phase 1/2/6 priority slice | In progress | Use the Owner Testing priority evidence card and explicit Phase 1/2 smoke actions to track one-panel live proof, two-panel isolation, and PM phase-board Epic/Parent/Child staging readiness together. |
| Phase 3 desktop proof clearance | In progress | Use the Phase 3 clearance package, desktop smoke command plan, and handoff gate to identify the exact blocking proof, run the held `npm.cmd run smoke:phase3` command only when appropriate, populate persisted smoke rows, verify slash/session-control evidence, record owner handoff only when exit-ready, and hold Phase 4 behind that boundary. |
| Provider integration surfaces | Next | Use the Phase 4 Provider Readiness and Phase 4 Surface Depth panels to keep catalog refresh metadata-only while resolving surface coverage, setup blockers, capability gaps, preview review, and the execution lock across commands, skills, plugins, MCP, automations, and personalization. |
| Migration Center hardening | Next | Use the Migration review gate to keep migration safe and metadata-only while checking preview selection, apply intent lock, rollback evidence, audit consistency, sensitive exclusions, and profile activation lock before any profile activation is considered. |
| Planning and dispatch loop | Next | Convert staged project/program work into orchestrator, implementer, validator, and integration panels with scoped handoff packets, saved review records, and visible attempt limits. |
| Permission and audit depth | Next | Use the Phase 8 Audit Depth panel to explain risk exceptions, disabled mutation paths, missing permission, approval, evidence, audit persistence, and rollback requirements before enabling broader desktop, terminal, Git, MCP, plugin, automation, runtime, profile, or external-service mutations. |
| Desktop-backed runner approval | Next | Use the Phase 9 Runner Approval panel to keep the fixed terminal read-only probe selected, owner-approved, previewed, validated, audited, and rollback-safe before expanding runner actions. |
| Adaptive Arena polish | Next | Use the Phase 10 Arena Polish panel to verify adaptive layout regression, density/readability, keyboard controls, focus state, terminology, and acceptance gates before packaging resumes. |
| Owner Testing command center | Next | Use the Phase 11 Owner Command, Proof Freshness, and Evidence Records panels to keep checklist coverage, proof freshness depth, blockers, phase readiness, next action, and fresh-checkout evidence visible as a single pass/fail release gate. |
| Release readiness pass | Paused | Use the Phase 11 Release Readiness panel to review clean checkout, build/test, smoke proof, packaging lock, docs/known limits, and the final release decision while packaging stays paused. |

## Remaining Goals

| Target | Phases | Status | Goal | Next Action |
|---|---|---|---|---|
| Unblock Phase 1/2/6 publishing | Phase 1, Phase 2, Phase 6 | Blocked | Hold the completed priority slice locally until the Steerboard public remote is restored and the owner approves pushing. | Keep the branch local, preserve the proof commit, and push only after the remote is recreated and the owner says to push. |
| Phase 3 desktop proof clearance | Phase 3 | Active | Clear live-control, active-turn interrupt, active-turn steer, slash, and session-control proof rows from desktop mode. | Use the Phase 3 command plan and handoff gate to clear the exact blocker, run the held desktop smoke command only when appropriate, record owner handoff only after exit-ready, and keep Phase 4 held behind the provider boundary. |
| Provider integration surfaces | Phase 4 | Next | Harden command, skill, plugin, MCP, automation, and personalization readiness depth while keeping refresh metadata-only. | Use the Phase 4 Provider Readiness and Phase 4 Surface Depth panels to resolve surface coverage, setup blockers, capability gaps, preview review, and the execution lock before provider execution is considered. |
| Migration Center hardening | Phase 5 | Next | Finish preview, apply-intent lock, rollback evidence, audit consistency, sensitive exclusions, and review-depth records for metadata-only migration work. | Use the Migration review gate to keep apply intent locked, confirm rollback evidence, repair audit blockers, verify sensitive exclusions, and keep profile activation locked before any migration apply path. |
| Planning and dispatch loop | Phase 7 | Next | Turn staged PM work into orchestrator, implementer, validator, and integration handoff packets with visible attempt limits. | Use dispatch review records to audit role counts, attempt limits, handoff tasks, and validation gates before any live worker session spawning. |
| Permission and audit depth | Phase 8 | Next | Expand approval gates, risk exceptions, disabled-path explanations, audit persistence, and rollback evidence before mutation paths grow. | Use the Phase 8 Audit Depth panel to resolve risk exceptions, disabled paths, missing permission, approval, evidence, audit persistence, and rollback explanations before mutation paths grow. |
| Desktop-backed runner approval | Phase 9 | Next | Allow the fixed terminal read-only desktop probe only after permission, audit, validation, and rollback gates pass. | Use the Phase 9 Runner Approval panel to keep the terminal-readonly-probe selected, owner-approved, previewed, validated, audited, and rollback-safe. |
| Adaptive Arena polish | Phase 10 | Next | Polish adaptive layout, density, keyboard controls, focus state, and Arena terminology after core live proof clears. | Use the Phase 10 Arena Polish panel to verify adaptive layout regression, density, keyboard controls, focus state, terminology, and acceptance gates. |
| Owner Testing command center | Phase 11 | Next | Make Owner Testing the single pass-fail release gate for proof freshness, blockers, phase readiness, and next actions. | Use the Phase 11 Owner Command, Proof Freshness, and Evidence Records panels to review checklist coverage, proof freshness depth, blockers, phase readiness, next action, and fresh-checkout evidence. |
| Release readiness pass | Phase 11 | Paused | Coordinate the final clean-checkout, build, smoke, packaging-lock, docs, known-limits, and release-decision pass before release. | Use the Phase 11 Release Readiness panel to review clean checkout, build/test, smoke proof, packaging lock, docs and known limits, and the final release decision while packaging stays paused. |

## Future Tasks

- Complete live panel chat hardening for one-panel and multi-panel desktop sessions.
- Finish panel lifecycle controls for interrupt, retry, steer, fork, resume, and archive where providers support them.
- Add richer incremental streaming evidence and failure recovery for Arena panels.
- Connect planning-lane dispatch records to live worker/session creation only after risk exceptions, disabled paths, permission approvals, audit persistence, and rollback evidence are ready.
- Add plugin, skill, MCP, and automation execution paths behind explicit provider support and approval gates.
- Add permissioned terminal and Git evidence capture after the read-only runner path is proven.
- Add signed audit export, rollback references, and release privacy checks.
- Prepare a clean Git-based install path and desktop packaging only after the Phase 11 Release Readiness gate records clean checkout, build/test, smoke proof, docs/known limits, and an explicit owner release decision.

## Closeout Note

The documentation closeout records the current implementation state and carries the remaining work forward as pipeline items. The product is not feature-complete yet; the next implementation goal should keep local proof branches unpushed until owner approval, then continue clearing Phase 3 desktop proof, Phase 4 provider readiness and surface-depth blockers, and Phase 11 release-readiness holds without resuming packaging.
