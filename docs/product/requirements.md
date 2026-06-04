# Product Requirements

## Core Functional Requirements

- Project workspace registry.
- Session registry for active and historical agent threads.
- Adaptive cockpit layouts: `1x1`, `2x1`, `1x2`, `3x1`, `1x3`, `2x2`, `2x3`, `3x2`, and `3x3`.
- `3x3` hard maximum for visible cockpit cells.
- Per-cell session state: idle, planning, implementing, validating, blocked, failed, complete.
- Orchestrator task board showing task ownership, attempt count, validation state, files touched, and handoff result.
- Worker handoff format with scope, allowed files, acceptance criteria, validation command, and rollback note.
- Separate implementer and validator roles when task risk requires it.
- Final integration lane owned by Main Codex.

## MVP Functional Scope

- Static project list and session mock data.
- Cockpit layout model and responsive grid.
- Task and worker state model.
- Handoff document generation.
- Audit and progress panels.
- Local-only persistence for mock projects and runs.

## Later Functional Scope

- Real Codex app-server session ownership.
- Real worker spawning.
- Live transcript streaming.
- Git diff, test, commit, and push panels.
- Browser and terminal panes.
- MCP configuration and status.
- External worker adapters beyond Codex Spark.

## UX Requirements

- The cockpit is the first screen, not a marketing landing page.
- Dense, readable, desktop-first layout.
- No card-inside-card dashboard clutter.
- Clear visual distinction between orchestrator, implementer, validator, and integration roles.
- User can collapse from `3x3` down to simpler layouts as needed.

## Safety Requirements

- No secrets in tracked docs.
- No raw private transcripts in public examples.
- Analytics default off.
- Worker tasks must be file-scoped.
- Destructive actions require explicit user confirmation.
- Third-party code must pass license, dependency, script, IPC, storage, and network review before adoption.

