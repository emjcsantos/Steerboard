# Adaptive Cockpit Layout

## Product Design Brief

Steerboard needs a cockpit layout that feels familiar to common IDEs while giving project managers and technical operators more control than a fixed split view. The fixed grid presets remain useful for fast setup, but `Adaptive` should let users build a working board around the exact sessions, projects, and evidence they need to watch.

The visual direction is dense, calm, and workbench-like: one compact control row, a left project/thread rail, a central cockpit canvas, and right-side environment or progress details. The feature should feel powerful without becoming a decorative dashboard.

## Target Table

| Target | Completion | Note |
|---|---|---|
| Compact cockpit control row | Planned | Replace the wide button cluster and scattered status widgets with one dense row that preserves layout, focus, panel activity, hidden queue, and monitor controls. |
| Layout dropdown | Planned | Present fixed presets and `Adaptive` from a single dropdown or combobox. |
| Adaptive canvas | Planned | Add a freeform cockpit mode where users can add panels, drag panels, resize panels, and preserve spatial continuity. |
| Magnetic behavior | Planned | Snap panels to grid intervals, neighboring edges, safe zones, and useful docking positions without forcing a rigid grid. |
| Drag-in sessions and projects | Planned | Let users drag a chat, run, task, evidence pane, or whole project from navigation into the center cockpit. |
| Persistence and recovery | Planned | Save layout geometry locally and repair malformed saved layouts to safe defaults. |
| Accessibility | Planned | Provide keyboard alternatives for layout selection, panel add, move, resize, focus, and reset. |

## Control Row Plan

The cockpit toolbar should become a single row with compact groups:

- Layout selector: one dropdown with `1x1`, `2x1`, `1x2`, `3x1`, `1x3`, `2x2`, `2x3`, `3x2`, `3x3`, and `Adaptive`.
- Focus summary: selected panel, no-focus state, focus action, and clear action.
- Panel activity summary: visible panels, hidden panels, role counts, and issue counts.
- Hidden queue summary: next hidden panel or project, review-needed badge, and reveal action.
- Monitor controls: play, pause, reset, and stream state when a run is selected.

At narrow widths, secondary labels can collapse into tooltips, but the row should remain one row before wrapping to a purpose-built compact overflow menu.

## Adaptive Canvas Plan

Adaptive mode is a freeform layout mode, not a tenth fixed grid preset. It should keep the same cockpit panel component, session state model, and provider integration surface as the fixed layouts, but store geometry per panel.

Each adaptive panel should track:

- source type: chat, project, run, task, evidence, terminal, browser, diff, or provider tool surface,
- source identifier,
- x, y, width, height, and optional z-index,
- minimum and preferred size,
- role and status metadata,
- pinned, hidden, focused, and collapsed state,
- last-known safe geometry for recovery.

## Drag And Drop

Users should be able to drag a chat, project, task, run, or evidence item into the cockpit center. Dropping should either create a new panel or replace a highlighted existing panel, depending on the drop target.

Dragging a whole project should offer useful panel templates, such as:

- project chat,
- orchestrator plus monitor,
- recent active sessions,
- project pipeline plus active run,
- compact status board.

Drag and drop must not launch a runtime, mutate the source project, or archive a session. It only changes what is visible in the cockpit unless the user takes a separate explicit action.

## Magnetic Behavior

Adaptive panels should feel free, but not sloppy. The first implementation should use predictable magnetic rules:

- snap to an underlying grid interval,
- snap edges to nearby panel edges,
- show live drop zones around the canvas and existing panels,
- prevent accidental overlap unless a later explicit stack or tab behavior is designed,
- push or resize softly when a panel is dropped into a crowded space,
- expose a reset action that restores the last safe layout.

## Guardrails

- Fixed presets keep `3x3` as the maximum visible grid.
- Adaptive can contain more than nine panels through scroll, pan, hidden queue, or tabbed stacks, but visible panels must preserve readable minimum sizes.
- Panel text must not overlap at minimum size.
- Every adaptive action needs a keyboard path.
- Saved layouts must be versioned and repaired when invalid.
- Public fixtures must stay generic and must not expose private local paths, private transcripts, secrets, or credentials.

## Implementation Slice Order

1. Convert layout buttons into a dropdown while preserving existing fixed presets.
2. Compress the cockpit status and monitor widgets into one control row.
3. Add `Adaptive` as a selectable mode that initially renders the current layout safely.
4. Add adaptive panel geometry storage and safe saved-state repair.
5. Add panel add/remove, drag, resize, and magnetic snapping.
6. Add drag-in from sidebar chats and projects.
7. Add keyboard move/resize/reset paths and interaction tests.
