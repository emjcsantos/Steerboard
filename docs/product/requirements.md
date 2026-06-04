# Product Requirements

## Core Functional Requirements

- Project workspace registry.
- Project registry entries must expose display-safe workspace labels, status, runtime state, permission state, and readiness without storing private local paths in public fixtures.
- Session registry for active and historical agent threads.
- Adaptive cockpit layouts: `1x1`, `2x1`, `1x2`, `3x1`, `1x3`, `2x2`, `2x3`, `3x2`, and `3x3`.
- `3x3` hard maximum for visible cockpit cells.
- Cockpit operating modes: focused single-project lane, orchestrator with worker panels, and independent multi-project monitor.
- Per-cell session state: idle, planning, implementing, validating, blocked, failed, complete.
- Orchestrator task board showing task ownership, attempt count, validation state, files touched, and handoff result.
- Project management lane for planning and managing a user's development pipeline before dispatching selected work to a configured agent runtime.
- Dispatch controls must combine pipeline readiness, project registry readiness, and runtime adapter readiness before enabling a launch action.
- Worker handoff format with scope, allowed files, acceptance criteria, validation command, and rollback note.
- Separate implementer and validator roles when task risk requires it.
- Final integration lane owned by the main orchestrator.
- Model-agnostic worker profiles so model/provider choice stays configurable.
- Easy agent-runtime integration through pluggable adapters, documented worker profiles, mockable transports, and no cockpit-specific rewrites.

## MVP Functional Scope

- Static project list and session mock data.
- Static project registry and runtime adapter mock data.
- Cockpit layout model and responsive grid.
- Mock cockpit mode presets for focus lane, orchestrator-with-workers, and independent project monitor.
- Task and worker state model.
- Handoff document generation.
- Audit and progress panels.
- Local-only persistence for mock projects and runs.
- Placeholder project-management lane with generic sample pipelines and no private project names.
- Dispatch gate preview with no real command execution.
- Editable local planning drafts with readiness scoring before dispatch.
- Local planning draft persistence with safe saved-state repair.
- Local dispatch package preview generated from a complete staged planning draft.
- Local mock orchestrator run projection from a staged dispatch package, visible in cockpit panels without executing a runtime.
- Local mock run history persisted across reloads with selected-run detail in the environment panel.
- Mock run detail should expose the source package, spawned task count, cockpit panel count, and validation gate count.
- Local mock run lifecycle controls for queue, running, complete, blocked, and failed states.
- Lifecycle controls should update cockpit panels, task status summaries, validation gate status, and persisted run history together.
- Selected mock runs should expose a compact event timeline covering run, task, session, and validation events.
- Timeline summaries should show active, issue, and complete counts for quick cockpit monitoring.
- Runtime adapters should expose a compact contract inspector with transport, capabilities, permissions, and normalized event support.
- Adapter contract summaries should show ready, review, and blocked counts before any real command execution is enabled.

## Later Functional Scope

- Real agent-runtime session ownership.
- Real worker spawning.
- Live transcript streaming.
- Git diff, test, commit, and push panels.
- Browser and terminal panes.
- MCP configuration and status.
- Additional worker adapters beyond the default configured runtime.
- Deploy-to-runtime action that converts a selected pipeline item into an orchestrator run, task split, and worker handoff set.
- Runtime integration wizard for adding or testing a configured model/provider adapter.

## UX Requirements

- The cockpit is the first screen, not a marketing landing page.
- Dense, readable, desktop-first layout.
- No card-inside-card dashboard clutter.
- Clear visual distinction between orchestrator, implementer, validator, and integration roles.
- User can collapse from `3x3` down to simpler layouts as needed.
- User can switch cockpit modes without losing active session state.
- Steerboard must have its own visual identity and interaction model rather than copying a reference product screen-for-screen.
- Animations must be restrained, fast, and purposeful: use them to preserve spatial continuity when sessions move, resize, start, pause, or complete.
- Every cockpit cell must keep transcript, status, tool activity, and validation evidence readable without overlap.
- Icon buttons must have accessible labels, visible focus states, and clear hover/pressed/disabled states.
- Layout must remain stable under streaming text, long file names, long branch names, loading states, and failed-worker messages.

## Safety Requirements

- No secrets in tracked docs.
- No raw private transcripts in public examples.
- Analytics default off.
- Worker tasks must be file-scoped.
- Parallel agent execution must use explicit workspace and file ownership boundaries.
- Destructive actions require explicit user confirmation.
- Third-party code must pass license, dependency, script, IPC, storage, and network review before adoption.
- Third-party code or assets must be credited when copied, derived, bundled, or adapted; Steerboard code and UI should remain original unless a deliberate reuse decision is recorded.
- Public docs, screenshots, fixtures, seeds, and demo data must use generic project names only.
