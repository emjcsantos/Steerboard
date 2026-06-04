# Public Roadmap

This roadmap is intentionally high level. Detailed planning, task splitting, progress logs, and internal execution notes are kept outside the public repository.

## Phase 1: Product Scaffold

- Local desktop shell.
- Public-safe fixture data.
- Project sidebar.
- Adaptive cockpit grid up to `3x3`.
- Focus lane, orchestrator-with-workers, and independent project monitor modes.

## Phase 2: Orchestration Model

- Runs, tasks, workers, attempts, validation states, and handoff records.
- Orchestrator task board.
- Worker detail and validation evidence views.
- Deterministic handoff preview.

## Phase 3: Project Management Lane

- Project pipeline.
- Milestones, tasks, blockers, readiness checks, and dispatch previews.
- Link from pipeline item to cockpit run.

## Phase 4: Runtime Adapters

- Provider-neutral adapter contract.
- Provider-neutral runtime profile readiness model.
- Runtime profile catalog and cockpit readiness panel.
- Editable local runtime profile draft with saved-state repair.
- Local runtime profile approval request preview.
- Local runtime profile approval history.
- Local runtime profile activation state with no process execution.
- Mock adapter for tests and demos.
- Runtime setup and permission review flow.
- Local launch request preview before approved runtime execution.
- Local approval request preview for runtime handoff.
- Local execution audit preview before runtime execution.
- Local execution audit preview history.
- Desktop bridge status panel for shell reachability and locked execution state.
- Desktop permission handoff preview for an active local runtime profile.
- Local desktop permission request history.
- Local desktop permission approval preview.
- Desktop permission approval status panel.
- Local desktop permission audit and export preview.
- Desktop packaging readiness preview.

## Phase 5: Local Execution And Packaging

- Real session ownership through configured runtimes.
- Approved launch handoff from local preview into configured runtimes.
- Desktop bridge permission flow for approved process and workspace access.
- Runtime profile editor and validation flow before approved launch.
- Runtime profile activation handoff into desktop-shell permission flow.
- Desktop permission request records for approved profile handoffs.
- Desktop permission request execution with approval, rollback, and audit export.
- Desktop permission approval command backed by shell-level safety checks.
- Signed desktop permission audit export after approved handoff.
- Runtime execution unlock after shell permission approval and audit handoff.
- Runtime execution audit trail for approved handoffs.
- Persisted execution audit records and rollback references.
- Audit export and review workflow.
- Git, terminal, validation, and evidence panels.
- Local build, signing, and installer readiness checks.
- Signed desktop builds after the local security model is proven.
