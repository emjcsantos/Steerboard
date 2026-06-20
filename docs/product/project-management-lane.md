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

The Environment panel also shows a Remaining Goals summary. Each remaining target lists the related phase or phases, current status, completion, next action, and the Project Management row IDs used to stage Arena review packages. The current implementation target is Phase 3 exit-package clearance after local desktop smoke proof passed, combined recorded-artifact import, and current-panel slash/session evidence remain ahead of owner handoff, while `Unblock Phase 1/2/6 publishing` remains a separate owner hold until the public remote is restored and the owner approves pushing.

Owner Testing also includes a Phase 1/2/6 priority evidence card. It reads the live Arena panel smoke proof, two-panel isolation proof, panel session identity state, and Project Management phase-board state. The card does not run live actions automatically; it reports whether one-panel proof, multi-panel isolation, and Epic/Parent/Child PM staging are ready, waiting, blocked, or in review. Desktop-executed Phase 1/2 smoke proofs are persisted after an explicit run so the card can keep owner-visible proof state across reloads without sending prompts on startup. The same area now includes publish-hold traceability and blocker-priority rows that link `goal-phase-1-2-6-publish`, Phase 1 proof children, Phase 2 isolation children, Phase 6 PM staging children, required PM coverage, and the exact owner/remote push hold while keeping Git push and release actions disabled.

Owner Testing also includes a Phase 3 clearance package, blocker-priority queue, traceability rows, proof-export boundary child, and handoff gate. The clearance package reads reload-safe slash execution evidence, reload-safe session-control evidence, desktop smoke proof readiness, and available smoke actions, then shows whether Phase 3 is exit-ready, held for review, waiting, or blocked. Exit-gate diagnostics and blocker queues carry PM child links and unique evidence keys, and stale desktop proof timestamps or missing/stale slash/session storage provenance degrade to review after reload or during long-open app sessions until rerun. Slash and session-control proof storage carries source, panel, timestamp, and evidence-fingerprint metadata so legacy ready-looking rows cannot satisfy the exit gate by themselves. The desktop smoke bundle shows the evaluated-at timestamp and freshness window used for that stale-proof decision, and the latest local smoke record now passes live-control, active-turn interrupt, and active-turn steer rows before the combined CLI validation plus smoke-proof artifact loader imports both recorded artifacts into UI storage; the combined loader reports loaded, partial, or unavailable states from actual import results rather than file-read success alone. The blocker-priority queue ranks exact blockers by severity, proof category, and whether `npm.cmd run smoke:phase3` can address the top blocker; non-matching smoke action buttons remain held until their proof row becomes the top matching blocker. The command plan lists live-control, active-turn interrupt, and active-turn steer smoke proof rows separately, with a local CLI smoke validation record for owner-run command results that does not replace persisted desktop UI proof rows. The traceability rows link the current active Phase 3 goal, required Project Management child rows, clearance evidence, command plan, blocker priority, and compact current non-expired evidence handoff boundary before Phase 3 can be trusted as exit-ready. The handoff gate keeps desktop proof clearance, exact blocker visibility, trusted current-goal and PM traceability, local owner handoff record actions, compact current evidence fingerprint, clearance snapshot, age matching, and the Phase 4 review boundary visible before Phase 4 review resumes; Phase 4 review stays held unless the handoff validation proves both current fingerprint match and fresh age metadata, and proof-export offline verification is ready. Phase 3 proof export is evidence-only, fail-closed, and now first-class in the Project Management board: export stays disabled until offline verification is ready, proof cards expose `phase-03-child-proof-export-boundary` and `phase3.proof-export.offline-verification`, and downloadable JSON is prepared only when current-panel slash/session proof, current storage-attested desktop smoke proof, current CLI validation, expected/recorded handoff fingerprints, clearance snapshot, open blocker count, and fresh handoff age all match. When the current App state explicitly lacks CLI validation, owner handoff, or persisted desktop proof attestation, proof export does not borrow older stored records to make the package look ready. These surfaces are evidence-only and do not launch provider work automatically.

Owner Testing also includes a Phase 11 command center. It gathers checklist coverage, proof freshness, unresolved blockers, phase readiness, current next action, fresh-checkout evidence, prioritized remaining-goal traces, and the non-live `npm.cmd run test:phase11:owner-visible` proof into one pass/fail gate that remains held while blocked, active, next, planned, or paused goals exist. The goal traces keep the current critical path plus the full critical/high deployed and pending goal set at the top with goal IDs, phase IDs, PM task link counts, status, and completion. A companion Proof Freshness panel breaks that proof into Phase 1/2/6 priority proof, Phase 3 clearance, desktop smoke, command-plan, CLI validation, proof export, and handoff rows, with the desktop smoke row carrying the Phase 3 evaluated-at timestamp and freshness window, the proof-export row carrying offline verification, handoff fingerprints, the `phase-03-child-proof-export-boundary` PM child, the `phase3.proof-export.offline-verification` evidence key, clearance snapshot, and open blocker counts, and the handoff row preserving trusted current active goal/PM traceability before provider or release readiness advances. A Phase 11 Evidence Records panel shows fresh checkout, clean checkout, build/test, docs/known-limits, and release-decision evidence records with source, timestamp, detail, and missing/stale/malformed/readiness states; mismatched gate metadata or future-dated timestamps remain blocked as malformed evidence. Phase 11 release readiness requires structured clean-checkout, build/test, docs-known-limits, release-decision evidence, owner smoke proof with proof-export detail, and visible current active Phase 3 clearance PM traceability with handoff proof and proof-export evidence before any ready state can recommend release; state-only ready hints are held for review. Phase 11 owner release traceability links the Owner Testing command center, proof freshness depth, evidence records, release readiness, required Project Management rows, and packaging holds without running tests, builds, packaging, Git pushes, or release actions, and it surfaces packaging-hold next actions ahead of broader release-readiness blockers. Phase 11 blocker-priority ranks the exact top release blocker across owner proof, evidence freshness, release readiness, PM coverage, and packaging hold state. These surfaces are evidence-only and keep release readiness held until the remaining-goal queue, owner proof loop, structured release evidence, release-decision evidence, and fresh-checkout evidence are clear.

The Environment panel also includes a Phase 11 Release Readiness gate. It aggregates clean checkout, build/test, owner smoke proof with Phase 3 proof-export detail, packaging lock, docs/known limits, security closure, current active Phase 3 clearance PM traceability with handoff proof and proof-export evidence, and final structured release-decision evidence. The gate is decision support only: packaging, signing, installer creation, Git push, and external release actions remain paused until the owner explicitly resumes them.

The Environment panel also includes a Phase 4 Provider Readiness panel. It reads the same safe catalog validation snapshots used by Owner Testing, classifies each provider surface as ready, preview, setup-required, unsupported, unavailable, or blocked, and keeps the next action metadata-only until explicit execution, approval, audit, rollback, and permission gates exist. The same card now includes visible catalog-depth rows for command, skill, plugin, MCP, automation, and personalization sources, totals, item-order proof, metadata proof, structured catalog-depth aggregate proof, structured command/skill aggregate proof, structured plugin/MCP aggregate proof, command scope proof, skill invocation proof, evidence expectations, next actions, and execution locks.

The Connection Dialog catalog smoke proof includes Phase 4 Refresh Safety depth rows. They keep refresh run state, six-surface order, validation result, proof freshness, current catalog fingerprint match, structured all-catalog refresh-smoke proof, structured refresh-safety depth aggregate proof, metadata-only contract, provider execution lock, and reload-safe metadata-only proof visible beside the explicit catalog smoke action.

The Environment panel also includes a Phase 4 Surface Depth panel beside Provider Readiness. It turns the same metadata snapshots into surface coverage, setup blocker, capability gap, preview review, approval, audit, rollback, permission, owner-boundary proof, structured surface-depth aggregate proof, and execution lock rows, and it remains metadata-only with no command, skill, plugin, MCP, automation, personalization, network, terminal, Git, or profile execution. Command and skill catalog-depth rows carry evidence keys, scoped item-order proof, command scope proof, skill invocation proof, owner-safe readiness proof, fallback/source guidance, and execution locks without running commands or skills. Plugin and MCP catalog-depth rows carry metadata-only surface proof, scoped plugin surface proof, scoped MCP transport/tool-policy proof, owner-safe readiness proof, connection/source metadata, and execution locks without invoking plugins, tools, or MCP servers. The approval row can be backed by a local owner approval record only when the record is fresh, matches the current six-surface catalog fingerprint, has ready refresh-safety proof, and exposes structured approval-chain proof before audit can advance. Clearing or stale/mismatched/refresh-held/missing-chain-proof records return the approval row to review. The audit row can be backed by a local audit record only when it is fresh, tied to the current approval record, tied to the current catalog fingerprint, matched to the current self-safe surface-depth audit evidence fingerprint, mutation-locked, and exposing structured audit-chain proof. The rollback row can be backed by a local rollback record only when it is fresh, mutation-locked, tied to the current approval and audit records, tied to the current audit evidence fingerprint, tied to the current catalog fingerprint, matched to the current self-safe surface-depth rollback evidence fingerprint, owner/action-present, and exposing structured rollback-chain proof. The permission row can be backed by a local permission record only when it is fresh, mutation-locked, tied to the current approval, audit, rollback, audit evidence, rollback evidence, catalog, surface-depth, permission evidence, all six provider surface scopes, owner/scope/action evidence, and exposing structured permission-chain proof. The approval, audit, rollback, and permission surface-depth rows now expose owner-boundary proof, the snapshot exposes aggregate row/lock proof, and recorded artifacts return to review when approval validation chain proof, audit validation chain proof, rollback validation chain proof, permission validation chain proof, surface-depth aggregate proof, or owner-boundary proof is missing or incomplete. Companion Phase 4 Provider Traceability and Provider Blocker Priority panels link the remaining goal, required PM child rows including blocker priority, catalog depth, refresh safety depth, fresh fingerprint-matched catalog smoke proof, surface depth, exact top blocker with compact source/evidence/status proof, catalog-smoke relevance, local approval/audit/rollback/permission evidence, and execution locks before provider execution is considered; required rows must exist in both the current board plan and the remaining-goal links, and the provider review cannot be trusted until Phase 4 is the single current active remaining goal. While another goal is current, the Phase 4 hold names that current active goal and carries the owner-visible provider readiness check as the follow-up after Phase 4 becomes current. Even when metadata rows plus local approval, audit, rollback, and permission records are ready, the execution lock stays attached.

The Environment panel also includes the Migration review gate for Phase 5. It keeps migration metadata-only while showing apply-intent lock, rollback evidence, draft/audit evidence fingerprints, persisted apply-review staging, fingerprint-matched audit consistency, sensitive exclusions, profile activation lock, traceability rows, and blocker priority as separate owner-review records before any active profile or source platform state can change. Migration traceability remains waiting until Phase 5 is the current active goal. Apply-review staging stays disabled until secret/auth, raw transcript, and source mutation/browser exclusion evidence is complete.

The Environment panel also includes a Phase 8 Audit Depth panel. It shows risk exceptions, disabled mutation paths, required evidence, rollback expectations, record-specific rollback review for executed or failed audit records, audit sources, PM child links, unique evidence keys, local owner audit-review records with current audit evidence fingerprints, risk traceability rows, and a blocker-priority queue for permission, approval, evidence, audit-review freshness, and rollback gates before Phase 9 runner expansion or any broader mutation-capable path can advance. The non-live `npm.cmd run test:phase8:owner-visible` proof verifies that this permission, approval, evidence, rollback, disabled-path, review-record, traceability, and blocker-priority text remains visible without requesting approvals, exporting records, running commands, or unlocking mutation paths. Phase 8 and Phase 9 traceability require required PM rows to exist in both the current board plan and remaining-goal links, and each trust gate remains waiting until that phase is the current active goal. Phase 9 then carries its own local runner-review record and runner blocker-priority queue to rank the Phase 8 gate, owner permission, approval preview, validation output, audit record, runner-review record, rollback evidence, traceability, and mutation lock before the fixed desktop probe can advance; the non-live `npm.cmd run test:phase9:owner-visible` proof verifies those runner gates without running the desktop probe or unlocking broader desktop execution.

## Core Jobs

- Create and manage projects.
- Organize backlog work into Epics, Parents, and Children with dense table visibility.
- Attach task briefs, acceptance criteria, validation commands, and risk notes.
- Track pipeline state: idea, planned, ready, dispatched, running, validating, blocked, accepted, shipped.
- Select an Epic, Parent, or Child and stage a structured Arena review package.
- Show which pipeline item created each staged role-panel plan and which worker tasks would be spawned.
- Show dispatch review depth, traceability, and blocker-priority records for role coverage, attempt limits, handoff tasks, handoff packet integrity, newest-record evidence freshness, validation gates, integration ownership, exact top blocker, closure boundaries, and the no-live-worker execution lock, with `npm.cmd run test:phase7:owner-visible` covering the visible owner-review proof.
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
- Phase 4 Provider Readiness catalog depth with aggregate proof, command/skill aggregate proof, and plugin/MCP aggregate proof, Connection Dialog Refresh Safety depth with structured refresh-safety depth aggregate proof, Phase 4 Surface Depth aggregate and owner-boundary proof, local approval with structured approval-chain proof, audit, rollback, and structured permission-chain record review, provider traceability, and provider blocker-priority panels for source coverage, command/skill item-order, evidence-key, scoped command, skill invocation, and execution-lock proof, plugin/MCP metadata-only surface, scoped plugin surface proof, scoped MCP transport/tool-policy proof, catalog evidence expectations, reload-safe metadata-only refresh proof freshness, current catalog fingerprint match, surface coverage, setup blockers, capability gaps, preview review, PM links, exact top blocker source/evidence/status proof, catalog-smoke relevance, and execution locks before execution is considered.
- Phase 5 Migration review depth, traceability, and blocker-priority records for apply-intent lock, rollback evidence, draft/audit evidence fingerprints, persisted apply-review staging, fingerprint-matched audit consistency, sensitive exclusions, profile activation lock, exact top blocker, PM child links, and evidence keys.
- Phase 7 Dispatch review depth, integration ownership, traceability, and blocker-priority checks for role counts, max attempt limits, handoff task depth, per-role handoff packet integrity, current evidence fingerprint matching, validation gate depth, main integration ownership, PM child links, exact top blocker, closure boundaries, no-live-worker lock, owner-visible `test:phase7:owner-visible` proof, and the current-active Phase 7 goal boundary.
- Phase 8 Audit Depth, local owner audit-review records, current audit evidence fingerprint checks, risk traceability, blocker-priority records, and owner-visible `test:phase8:owner-visible` proof with disabled-path explanations, evidence requirements, record-specific rollback review, rollback expectations, audit sources, exact top blocker, PM child links, and unique evidence keys before mutation paths grow.
- Phase 9 Runner Approval depth, local runner-review, traceability, blocker-priority records, and owner-visible `test:phase9:owner-visible` proof for fixed probe selection, owner approval, request preview, validation output, audit record, rollback evidence, unique evidence keys, PM child links, Phase 8 owner-review linkage, exact top blocker, runner-review addressability, and the desktop execution lock.
- Phase 10 Arena Polish traceability and blocker-priority records for adaptive layout regression, density/readability, keyboard controls, focus state, Arena terminology, acceptance gates, PM child links, exact top blocker, Arena-review addressability, current-active Phase 10 goal state, and the packaging hold.
- Phase 11 prioritized remaining-goal trace rows plus owner release traceability, blocker-priority records, and owner-visible `test:phase11:owner-visible` proof for current critical blockers, active clearance work, high-priority pending goals, required PM task links, exact top release blocker, evidence freshness, release readiness, and packaging hold state.
- Owner Testing evidence, publish-hold traceability, blocker-priority records, and explicit smoke buttons for Phase 1 live panel proof, Phase 2 multi-panel isolation, Phase 6 PM board staging readiness, required PM child links, and the owner/remote push hold.
- Phase 3 clearance package, blocker-priority queue, traceability rows, command plan, fail-closed proof export, and handoff gate with exact open blockers, long-open stale-proof review, command-addressable blocker status, active-goal and PM child linkage, PM/evidence-key proof links, separate live-control/interrupt/steer command-plan rows, next smoke action, local owner handoff record/clear actions, compact current-evidence fingerprint, clearance snapshot, age matching, offline-verification-ready download gating, and provider-integration boundary.
- Phase 11 Release Readiness gate and owner-visible proof for clean checkout, build/test, smoke proof with Phase 3 proof-export detail, current active Phase 3 clearance PM traceability with handoff proof and proof-export evidence, packaging lock, docs/known limits, final security closure capability, owner release traceability, blocker-priority review, and release decision while packaging stays paused.
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
- local dispatch review depth and integration ownership checks with visible owner-review proof,
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
