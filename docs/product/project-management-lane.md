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

The Environment panel also shows a Remaining Goals summary. Each remaining target lists the related phase or phases, current status, completion, next action, and the Project Management row IDs used to stage Arena review packages. The current implementation target is Phase 3 desktop proof clearance, while `Unblock Phase 1/2/6 publishing` remains a separate owner hold until the public remote is restored and the owner approves pushing.

Owner Testing also includes a Phase 1/2/6 priority evidence card. It reads the live Arena panel smoke proof, two-panel isolation proof, panel session identity state, and Project Management phase-board state. The card does not run live actions automatically; it reports whether one-panel proof, multi-panel isolation, and Epic/Parent/Child PM staging are ready, waiting, blocked, or in review. Desktop-executed Phase 1/2 smoke proofs are persisted after an explicit run so the card can keep owner-visible proof state across reloads without sending prompts on startup. The same area now includes publish-hold traceability and blocker-priority rows that link `goal-phase-1-2-6-publish`, Phase 1 proof children, Phase 2 isolation children, Phase 6 PM staging children, required PM coverage, and the exact owner/remote push hold while keeping Git push and release actions disabled.

Owner Testing also includes a Phase 3 clearance package, blocker-priority queue, traceability rows, and handoff gate. The clearance package reads slash execution evidence, session-control evidence, desktop smoke proof readiness, and available smoke actions, then shows whether Phase 3 is exit-ready, held for review, waiting, or blocked. Exit-gate diagnostics and blocker queues carry PM child links and unique evidence keys, and stale desktop proof timestamps degrade to review after reload or during long-open app sessions until rerun. The blocker-priority queue ranks exact blockers by severity, proof category, and whether `npm.cmd run smoke:phase3` can address the top blocker. The command plan lists live-control, active-turn interrupt, and active-turn steer smoke proof rows separately, with a local CLI smoke validation record for owner-run command results that does not replace persisted desktop UI proof rows. The traceability rows link the active Phase 3 goal, required Project Management child rows, clearance evidence, command plan, blocker priority, and compact current non-expired evidence handoff boundary before Phase 3 can be trusted as exit-ready. The handoff gate keeps desktop proof clearance, exact blocker visibility, local owner handoff record actions, compact current evidence fingerprint and age matching, and the provider-integration boundary visible before Phase 4 advances. These surfaces are evidence-only and do not launch provider work automatically.

Owner Testing also includes a Phase 11 command center. It gathers checklist coverage, proof freshness, unresolved blockers, phase readiness, current next action, fresh-checkout evidence, and prioritized remaining-goal traces into one pass/fail gate. The goal traces keep critical and high-priority deployed/pending goals at the top with goal IDs, phase IDs, PM task link counts, status, and completion. A companion Proof Freshness panel breaks that proof into Phase 1/2/6 priority proof, Phase 3 clearance, desktop smoke, command-plan, CLI validation, and handoff rows. A Phase 11 Evidence Records panel shows fresh checkout, clean checkout, build/test, and docs/known-limits records with source, timestamp, detail, and missing/stale/malformed/readiness states. Phase 11 owner release traceability links the Owner Testing command center, proof freshness depth, evidence records, release readiness, required Project Management rows, and packaging holds without running tests, builds, packaging, Git pushes, or release actions. Phase 11 blocker-priority ranks the exact top release blocker across owner proof, evidence freshness, release readiness, PM coverage, and packaging hold state. These surfaces are evidence-only and keep release readiness held until the owner proof loop and fresh-checkout evidence are clear.

The Environment panel also includes a Phase 11 Release Readiness gate. It aggregates clean checkout, build/test, owner smoke proof, packaging lock, docs/known limits, and final release-decision evidence. The gate is decision support only: packaging, signing, installer creation, Git push, and external release actions remain paused until the owner explicitly resumes them.

The Environment panel also includes a Phase 4 Provider Readiness panel. It reads the same safe catalog validation snapshots used by Owner Testing, classifies each provider surface as ready, preview, setup-required, unsupported, unavailable, or blocked, and keeps the next action metadata-only until explicit execution, approval, audit, and rollback gates exist. The same card now includes catalog-depth rows for command, skill, plugin, MCP, automation, and personalization sources, totals, evidence expectations, and execution locks.

The Connection Dialog catalog smoke proof includes Phase 4 Refresh Safety depth rows. They keep refresh run state, six-surface order, validation result, proof freshness, current catalog fingerprint match, metadata-only contract, provider execution lock, and reload-safe metadata-only proof visible beside the explicit catalog smoke action.

The Environment panel also includes a Phase 4 Surface Depth panel beside Provider Readiness. It turns the same metadata snapshots into surface coverage, setup blocker, capability gap, preview review, and execution lock rows, and it remains metadata-only with no command, skill, plugin, MCP, automation, personalization, network, terminal, Git, or profile execution. Companion Phase 4 Provider Traceability and Provider Blocker Priority panels link the remaining goal, PM child rows, catalog depth, refresh safety depth, fresh fingerprint-matched catalog smoke proof, surface depth, exact top blocker, catalog-smoke relevance, and execution locks before provider execution is considered.

The Environment panel also includes the Migration review gate for Phase 5. It keeps migration metadata-only while showing apply-intent lock, rollback evidence, draft/audit evidence fingerprints, persisted apply-review staging, fingerprint-matched audit consistency, sensitive exclusions, profile activation lock, traceability rows, and blocker priority as separate owner-review records before any active profile or source platform state can change.

The Environment panel also includes a Phase 8 Audit Depth panel. It shows risk exceptions, disabled mutation paths, required evidence, rollback expectations, record-specific rollback review for executed or failed audit records, audit sources, PM child links, unique evidence keys, local owner audit-review records with current audit evidence fingerprints, risk traceability rows, and a blocker-priority queue for permission, approval, evidence, audit-review freshness, and rollback gates before Phase 9 runner expansion or any broader mutation-capable path can advance. Phase 9 then carries its own local runner-review record and runner blocker-priority queue to rank the Phase 8 gate, owner permission, approval preview, validation output, audit record, runner-review record, rollback evidence, traceability, and mutation lock before the fixed desktop probe can advance.

## Core Jobs

- Create and manage projects.
- Organize backlog work into Epics, Parents, and Children with dense table visibility.
- Attach task briefs, acceptance criteria, validation commands, and risk notes.
- Track pipeline state: idea, planned, ready, dispatched, running, validating, blocked, accepted, shipped.
- Select an Epic, Parent, or Child and stage a structured Arena review package.
- Show which pipeline item created each staged role-panel plan and which worker tasks would be spawned.
- Show dispatch review depth, traceability, and blocker-priority records for role coverage, attempt limits, handoff tasks, handoff packet integrity, evidence freshness, validation gates, integration ownership, exact top blocker, closure boundaries, and the no-live-worker execution lock.
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
- Phase 4 Provider Readiness catalog depth, Connection Dialog Refresh Safety depth, Phase 4 Surface Depth, provider traceability, and provider blocker-priority panels for source coverage, catalog evidence expectations, reload-safe metadata-only refresh proof freshness, current catalog fingerprint match, surface coverage, setup blockers, capability gaps, preview review, PM links, exact top blocker, catalog-smoke relevance, and execution locks before execution is considered.
- Phase 5 Migration review depth, traceability, and blocker-priority records for apply-intent lock, rollback evidence, draft/audit evidence fingerprints, persisted apply-review staging, fingerprint-matched audit consistency, sensitive exclusions, profile activation lock, exact top blocker, PM child links, and evidence keys.
- Phase 7 Dispatch review depth, integration ownership, traceability, and blocker-priority checks for role counts, max attempt limits, handoff task depth, per-role handoff packet integrity, current evidence fingerprint matching, validation gate depth, main integration ownership, PM child links, exact top blocker, closure boundaries, and the no-live-worker lock.
- Phase 8 Audit Depth, local owner audit-review records, current audit evidence fingerprint checks, risk traceability, and blocker-priority records with disabled-path explanations, evidence requirements, record-specific rollback review, rollback expectations, audit sources, exact top blocker, PM child links, and unique evidence keys before mutation paths grow.
- Phase 9 Runner Approval depth, local runner-review, traceability, and blocker-priority records for fixed probe selection, owner approval, request preview, validation output, audit record, rollback evidence, unique evidence keys, PM child links, Phase 8 owner-review linkage, exact top blocker, runner-review addressability, and the desktop execution lock.
- Phase 10 Arena Polish traceability and blocker-priority records for adaptive layout regression, density/readability, keyboard controls, focus state, Arena terminology, acceptance gates, PM child links, exact top blocker, and the packaging hold.
- Phase 11 prioritized remaining-goal trace rows plus owner release traceability and blocker-priority records for current critical blockers, active clearance work, high-priority pending goals, required PM task links, exact top release blocker, evidence freshness, release readiness, and packaging hold state.
- Owner Testing evidence, publish-hold traceability, blocker-priority records, and explicit smoke buttons for Phase 1 live panel proof, Phase 2 multi-panel isolation, Phase 6 PM board staging readiness, required PM child links, and the owner/remote push hold.
- Phase 3 clearance package, blocker-priority queue, traceability rows, command plan, and handoff gate with exact open blockers, long-open stale-proof review, command-addressable blocker status, active-goal and PM child linkage, PM/evidence-key proof links, separate live-control/interrupt/steer command-plan rows, next smoke action, local owner handoff record/clear actions, compact current-evidence fingerprint and age matching, and provider-integration boundary.
- Phase 11 Release Readiness gate for clean checkout, build/test, smoke proof, packaging lock, docs/known limits, owner release traceability, blocker-priority review, and release decision while packaging stays paused.
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
- local dispatch review depth and integration ownership checks,
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
- final integration checklist owned by the main Arena path.

The main orchestrator remains responsible for architecture, final validation, commit preparation, push approval, reporting, and dispatch-review traceability.
