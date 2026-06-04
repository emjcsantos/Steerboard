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
- Mock adapter for tests and demos.
- Runtime setup and permission review flow.
- Local launch request preview before approved runtime execution.

## Phase 5: Local Execution And Packaging

- Real session ownership through configured runtimes.
- Approved launch handoff from local preview into configured runtimes.
- Git, terminal, validation, and evidence panels.
- Signed desktop builds after the local security model is proven.
