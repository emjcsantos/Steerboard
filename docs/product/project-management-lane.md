# Project Management Lane

## Purpose

The project management lane is an optional Steerboard tab where users manage a Jira-like work hierarchy before launching staged work to configured runtime environments.

The primary planning medium remains the Arena chat, where the user gives goals, refines scope, reviews plans, and steers the orchestrator. The project management lane adds better visibility, monitoring, tracking, readiness review, and change management around that Arena workflow.
Staged dispatch in this lane is local preview only: it can generate explicit Arena review packages for selected Epics, Parents, or Children without launching external runtime workers.

## Current Default Board

The default Project Management board is seeded from the current Steerboard phase plan:

- Phase 0: Baseline, Safety, and Docs Hygiene.
- Phase 1: One Live Chat Panel.
- Phase 2: Multi-Panel Session Isolation.
- Phase 3: Controls, Slash Commands, and Desktop Proof.
- Phase 4: Provider Integration Surfaces.
- Phase 5: Migration Center.
- Phase 6: Project and Program Planning Lane.
- Phase 7: Orchestrator-Worker Dispatch.
- Phase 8: Permissions and Audit.
- Phase 9: Desktop-Backed Runner.
- Phase 10: Adaptive Magnetic Arena.
- Phase 11: Owner Testing and Release Readiness.

Each phase appears as an Epic. The board includes the Parent and Child rows needed to complete that phase, including proof clearance, owner-visible evidence, provider catalog safety, migration/audit review, PM phase-board upkeep, dispatch handoff, risk gates, runner approval, Arena layout polish, Owner Testing command gates, release-readiness review, and package-lock validation.

Existing local boards are repaired on load: older seed rows are replaced with the current phase plan while custom user-created rows are preserved.

The Environment panel also shows a Remaining Goals summary. Each remaining target lists the related phase or phases, current status, completion, next action, and the Project Management row IDs used to stage Arena review packages. The current hold is `Unblock Phase 1/2/6 publishing`, which stays blocked until the public remote is restored and the owner approves pushing.

Owner Testing also includes a Phase 1/2/6 priority evidence card. It reads the live Arena panel smoke proof, two-panel isolation proof, panel session identity state, and Project Management phase-board state. The card does not run live actions automatically; it reports whether one-panel proof, multi-panel isolation, and Epic/Parent/Child PM staging are ready, waiting, blocked, or in review. Desktop-executed Phase 1/2 smoke proofs are persisted after an explicit run so the card can keep owner-visible proof state across reloads without sending prompts on startup.

Owner Testing also includes a Phase 3 clearance package and handoff gate. The clearance package reads slash execution evidence, session-control evidence, desktop smoke proof readiness, and available smoke actions, then shows whether Phase 3 is exit-ready, held for review, waiting, or blocked. The handoff gate keeps desktop proof clearance, exact blocker visibility, local owner handoff record actions, and the provider-integration boundary visible before Phase 4 advances. Both surfaces are evidence-only and do not launch provider work automatically.

Owner Testing also includes a Phase 11 command center. It gathers checklist coverage, proof freshness, unresolved blockers, phase readiness, current next action, and fresh-checkout evidence into one pass/fail gate. A companion Proof Freshness panel breaks that proof into Phase 1/2/6 priority proof, Phase 3 clearance, desktop smoke, command-plan, and handoff rows. A Phase 11 Evidence Records panel shows fresh checkout, clean checkout, build/test, and docs/known-limits records with source, timestamp, detail, and missing/stale/malformed/readiness states. These surfaces are evidence-only and keep release readiness held until the owner proof loop and fresh-checkout evidence are clear.

The Environment panel also includes a Phase 11 Release Readiness gate. It aggregates clean checkout, build/test, owner smoke proof, packaging lock, docs/known limits, and final release-decision evidence. The gate is decision support only: packaging, signing, installer creation, Git push, and external release actions remain paused until the owner explicitly resumes them.

The Environment panel also includes a Phase 4 Provider Readiness panel. It reads the same safe catalog validation snapshots used by Owner Testing, classifies each provider surface as ready, preview, setup-required, unsupported, unavailable, or blocked, and keeps the next action metadata-only until explicit execution, approval, audit, and rollback gates exist.

The Environment panel also includes a Phase 4 Surface Depth panel beside Provider Readiness. It turns the same metadata snapshots into surface coverage, setup blocker, capability gap, preview review, and execution lock rows, and it remains metadata-only with no command, skill, plugin, MCP, automation, personalization, network, terminal, Git, or profile execution.

The Environment panel also includes the Migration review gate for Phase 5. It keeps migration metadata-only while showing apply-intent lock, rollback evidence, audit consistency, sensitive exclusions, and profile activation lock as separate owner-review records before any active profile or source platform state can change.

The Environment panel also includes a Phase 8 Audit Depth panel. It shows risk exceptions, disabled mutation paths, required evidence, rollback expectations, and audit sources for permission, approval, evidence, and rollback gates before Phase 9 runner expansion or any broader mutation-capable path can advance.

## Core Jobs

- Create and manage projects.
- Organize backlog work into Epics, Parents, and Children with dense table visibility.
- Attach task briefs, acceptance criteria, validation commands, and risk notes.
- Track pipeline state: idea, planned, ready, dispatched, running, validating, blocked, accepted, shipped.
- Select an Epic, Parent, or Child and stage a structured Arena review package.
- Show which pipeline item created each staged role-panel plan and which worker tasks would be spawned.
- Preserve the Arena chat as the source of planning intent when the user does not need structured pipeline management.

## User Flow

1. User plans and steers work through the Arena chat.
2. User optionally opens the project management tab when they need structured tracking or change-management visibility.
3. User creates or selects a generic project workspace.
4. User reviews the hierarchical table with Task, Description, Status, Completion, Complexity, Source, and Run columns.
5. User expands or collapses Epic and Parent rows to focus on the right level of work.
6. User uses the bottom PM alignment chat to request dashboard revisions, hierarchy changes, status changes, or Arena-run preparation.
7. User clicks `Run` on an Epic, Parent, or Child.
8. Steerboard creates a structured staged Arena review package with hierarchy context and descendant tasks while execution remains disabled unless approval/runtime gates allow it.

## MVP Shape

- Generic sample projects only.
- Dense hierarchy table with Epics, Parents, and Children.
- Collapsible Epic and Parent rows.
- Exact table columns: Task, Description, Status, Completion, Complexity, Source, and Action.
- Compact `Run` button on every row.
- Task type color: Epic uses accent/purple, Parent uses blue, and Child uses neutral/green.
- Compact status badges for Completed, On-going, Canceled, and TO DO.
- Compact complexity badges for Low, Medium, High, and Extra High.
- Display-safe source document labels only.
- Bottom PM chat/terminal panel scoped to dashboard alignment, updates, and revision requests.
- Staged Arena review preview for the latest row run.
- Remaining Goals summary for all open targets across Phase 1 through Phase 11.
- Phase 4 Provider Readiness and Phase 4 Surface Depth panels for catalog-surface labels, surface coverage, setup blockers, capability gaps, preview review, and the execution lock before execution is considered.
- Phase 5 Migration review depth records for apply-intent lock, rollback evidence, audit consistency, sensitive exclusions, and profile activation lock.
- Phase 8 Audit Depth risk exceptions with disabled-path explanations, evidence requirements, rollback expectations, and audit sources before mutation paths grow.
- Owner Testing evidence and explicit smoke buttons for Phase 1 live panel proof, Phase 2 multi-panel isolation, and Phase 6 PM board staging readiness.
- Phase 3 clearance package and handoff gate with exact open blockers, next smoke action, local owner handoff record/clear actions, and provider-integration boundary.
- Phase 11 Release Readiness gate for clean checkout, build/test, smoke proof, packaging lock, docs/known limits, and release decision while packaging stays paused.
- Item detail panel.
- Selected-item role-panel dispatch preview with pipeline, registry, and runtime gates.
- Local selected-item dispatch request and cancellation history.
- Local Arena run projection from a dispatch-ready selected item.
- Editable local draft list and draft detail editor.
- Readiness checklist.
- Runtime deployment remains review-only unless required runtime and approval gates are present.
- Registry and runtime gate chips showing why dispatch is enabled or blocked.
- Generated role handoff preview (orchestrator, implementer, validator, integration).
- Generated dispatch package preview before real runtime execution.
- Link from staged dispatch item to reviewed role-panel plan.
- Linked local Arena run list for the selected item, with an open action that returns users to the matching Arena run.
- Linked Arena run status summary on pipeline rows and selected item detail so users can monitor progress without leaving the lane.
- Local selected-item detail so users can review dispatch blockers without leaving the pipeline.
- Local dispatch request records so users can queue intent for Arena review before runtime launch exists.
- Local Arena run projection so users can inspect the pipeline item as orchestrator sessions before runtime launch exists.
- Local mock orchestrator role-panel projection so users can inspect the staged plan in Arena panels before real runtime integration.
- Local run history list and selected-run detail so users can compare staged runs without losing Arena context.
- Local run lifecycle controls for previewing queued, running, accepted, blocked, and failed Arena states before real runtime integration.
- Local event timeline showing how the projected run, tasks, sessions, and validation gates relate.
- Runtime adapter contract inspector showing whether the target project can support sessions, tasks, validation, and tool-call events while keeping execution in preview mode.
- Runtime ingestion preview showing whether staged plan events are accepted, require review, or are blocked by the target adapter contract.
- Local stream preview controls for watching staged projected adapter events for review before real runtime integration.
- Adapter session preview showing the selected runtime's transport, health, heartbeat, and permission readiness.
- Event source preview showing the queued normalized events that will feed the stream monitor.
- Source connection preview showing whether the queued events can attach to the selected runtime adapter.
- Adapter bridge preview showing whether a local event source has been attached to the selected runtime stream.
- Provider capability readiness showing whether the selected runtime supports live chat, slash commands, plugins, automations, MCP, personalization, approvals, and audit state before deployment.
- Deploy-mode selector for focused run, orchestrator-with-workers, or independent project monitor.

## Hierarchy Run Contract

Clicking `Run` on a Project Management row creates a structured staged Arena package.

- Epic runs include every descendant Parent and Child, even when descendants are hidden by collapsed rows.
- Parent runs include every descendant Child.
- Child runs include only the Child plus enough Epic and Parent context for safe review.
- The package includes task id, task type, title, description, status, completion, complexity, source document, relationship context, and descendant tasks.
- If runtime execution is locked, the package is labeled as staged for Arena review, not live execution.

## Required Fields For Dispatch

- title,
- objective,
- target project workspace,
- scope,
- files or areas likely involved,
- acceptance criteria,
- validation command or validation plan,
- risk level,
- rollback note.
- project registry readiness,
- runtime adapter readiness and required permissions.
- live provider capability readiness for commands, plugins, automations, MCP, and personalization.

## Privacy Rules

- Demo data must use generic placeholders such as `Website Refresh`, `Billing Workflow`, `Developer Tooling`, or `Mobile App Prototype`.
- Do not include private project names, owner names, customer names, local folders, screenshots from private navigation, or raw chat logs.
- Public screenshots should use sanitized fixture data only.

## Runtime Dispatch Contract

Deploying to a configured runtime creates:

- a staged dispatch package,
- a local mock orchestrator role-panel projection,
- a persisted local run-history entry,
- a traceable link from the selected pipeline item back to matching local run-history entries,
- a compact linked-run status summary for the selected pipeline item,
- local lifecycle state updates for the projected run,
- selected-run event timeline records,
- adapter contract readiness records,
- runtime ingestion preview records,
- local stream preview state,
- adapter session preview state,
- event source preview state,
- source connection readiness state,
- adapter bridge preview state,
- provider capability readiness state,
- a future real orchestrator run (out-of-band of local preview),
- selected Arena operating mode,
- a task split proposal,
- worker task briefs,
- validator task briefs,
- expected files or ownership boundaries,
- final integration checklist.

The main orchestrator remains responsible for architecture, final validation, commit, push, and reporting.
