# Cockpit Operating Modes

Steerboard's cockpit is the primary planning, chat, and monitoring surface. The same panel system must support focused work, orchestrated multi-agent work, and independent project monitoring.

## Mode 1: Focus Lane

Use Steerboard like a single coding-agent desktop app.

- One project or run is active.
- The cockpit can use `1x1`, `1x2`, or `2x1`.
- Supporting panels may show transcript, tool activity, diffs, tests, approvals, or environment state.
- This mode is optimized for deep focus and low visual noise.

## Mode 2: Orchestrator With Workers

Use Steerboard as a command cockpit for one orchestrated run.

- One main orchestrator panel owns the goal, task split, integration, and final report.
- Worker panels show implementer and validator agents assigned to small, non-overlapping tasks.
- The right-side progress surface summarizes attempts, validation status, file ownership, blockers, and handoffs.
- The cockpit can scale from `2x1` to `3x3` depending on worker count.

## Mode 3: Independent Project Monitor

Use Steerboard to watch several unrelated projects or runs at the same time.

- Each cockpit panel can bind to a different project, run, or session.
- Projects do not share task ownership unless the user explicitly links them.
- Each panel keeps its own workspace context, branch state, validation status, and notification state.
- This mode is optimized for portfolio visibility and quick triage.
- Each panel should expose the live capability state of its connected provider, including chat, commands, plugins, automations, MCP, personalization, approvals, and audit readiness.

## Mode 4: Adaptive Cockpit Canvas

Use Steerboard as a freeform cockpit when fixed presets are too rigid.

- Users can add panels from chats, projects, runs, tasks, evidence views, and provider tool surfaces.
- Users can drag a chat or whole project from the left rail into the cockpit center.
- Panels can be moved, resized, hidden, revealed, focused, or reset without mutating the source session or project.
- Magnetic snapping keeps panels aligned to grid intervals, neighboring panel edges, and safe drop zones.
- Adaptive mode can hold more panels than a fixed preset through scroll, pan, hidden queue, or tabbed stacks, while preserving readable visible panel sizes.

## Shared Interaction Requirements

- Users can switch between modes without losing session state.
- Users can focus, pin, swap, resize, collapse, or detach panels.
- The cockpit layout selector must be a dropdown or combobox, not a long row of preset buttons.
- The layout selector must support `1x1`, `2x1`, `1x2`, `3x1`, `1x3`, `2x2`, `2x3`, `3x2`, `3x3`, and `Adaptive`.
- `3x3` remains the fixed-grid visible panel maximum.
- The cockpit toolbar should compress layout, focus, panel activity, hidden queue, and monitor controls into one row.
- Long-running panels must show idle, active, waiting, blocked, failed, and complete states without layout shift.
- Panel headers must make project/run identity clear without exposing private data in public examples.
- Slash commands and integration controls are scoped to the focused panel unless the user explicitly applies them to a run, project, or cockpit group.

## Optional Project Management Lane Relationship

The project management lane is optional. It can deploy structured work into any cockpit mode when users want stronger pipeline visibility, tracking, readiness review, or change management:

- a single focused run,
- one orchestrator with worker panels,
- or several independent project panels.

The deploy preview must show which mode will open and which panels will be created, but users should still be able to plan directly in the cockpit chat without using this lane.
