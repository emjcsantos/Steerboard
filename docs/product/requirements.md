# Product Requirements

## Core Functional Requirements

- Project workspace registry.
- Session registry for active and historical agent threads.
- Adaptive cockpit layouts: `1x1`, `2x1`, `1x2`, `3x1`, `1x3`, `2x2`, `2x3`, `3x2`, and `3x3`.
- `3x3` hard maximum for visible cockpit cells.
- Cockpit operating modes: focused single-project lane, orchestrator with worker panels, and independent multi-project monitor.
- Per-cell session state: idle, planning, implementing, validating, blocked, failed, complete.
- Orchestrator task board showing task ownership, attempt count, validation state, files touched, and handoff result.
- Project management lane for planning and managing a user's development pipeline before dispatching selected work to Codex.
- Worker handoff format with scope, allowed files, acceptance criteria, validation command, and rollback note.
- Separate implementer and validator roles when task risk requires it.
- Final integration lane owned by the main orchestrator.
- Model-agnostic worker profiles so model/provider choice stays configurable.
- Easy Codex and model integration through pluggable runtime adapters, documented worker profiles, mockable transports, and no cockpit-specific rewrites.

## MVP Functional Scope

- Static project list and session mock data.
- Cockpit layout model and responsive grid.
- Mock cockpit mode presets for focus lane, orchestrator-with-workers, and independent project monitor.
- Task and worker state model.
- Handoff document generation.
- Audit and progress panels.
- Local-only persistence for mock projects and runs.
- Placeholder project-management lane with generic sample pipelines and no private project names.

## Later Functional Scope

- Real Codex app-server session ownership.
- Real worker spawning.
- Live transcript streaming.
- Git diff, test, commit, and push panels.
- Browser and terminal panes.
- MCP configuration and status.
- Additional worker adapters beyond the default configured runtime.
- Deploy-to-Codex action that converts a selected pipeline item into an orchestrator run, task split, and worker handoff set.
- Runtime integration wizard for adding or testing a configured model/provider adapter.

## UX Requirements

- The cockpit is the first screen, not a marketing landing page.
- Dense, readable, desktop-first layout.
- No card-inside-card dashboard clutter.
- Clear visual distinction between orchestrator, implementer, validator, and integration roles.
- User can collapse from `3x3` down to simpler layouts as needed.
- User can switch cockpit modes without losing active session state.
- AtlasUI must have its own visual identity and interaction model rather than copying a reference product screen-for-screen.
- Animations must be restrained, fast, and purposeful: use them to preserve spatial continuity when sessions move, resize, start, pause, or complete.
- Every cockpit cell must keep transcript, status, tool activity, and validation evidence readable without overlap.
- Icon buttons must have accessible labels, visible focus states, and clear hover/pressed/disabled states.
- Layout must remain stable under streaming text, long file names, long branch names, loading states, and failed-worker messages.

## Safety Requirements

- No secrets in tracked docs.
- No raw private transcripts in public examples.
- Analytics default off.
- Worker tasks must be file-scoped.
- Multiagent and multiworktree development must use non-overlapping file ownership.
- Destructive actions require explicit user confirmation.
- Third-party code must pass license, dependency, script, IPC, storage, and network review before adoption.
- Third-party inspiration must be credited, but AtlasUI code and UI should remain original unless a deliberate fork/import decision is recorded.
- Public docs, screenshots, fixtures, seeds, and demo data must use generic project names only.
