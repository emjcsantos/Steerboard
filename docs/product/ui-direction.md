# UI Direction

## Product Feel

Steerboard should feel familiar to users of common IDEs and agent desktops: focused, dense, legible, keyboard-friendly, and smooth under pressure.

The UI should use familiar workbench patterns such as a top menu, left project/thread rail, split panes, command surfaces, status bars, tool panels, and modal setup flows so coders can migrate without relearning the basics.

The UI should not feel like a marketing page, a decorative dashboard, or a loose clone of any one existing agent IDE.

## Visual Identity

- Dark-first desktop interface with strong contrast and quiet color.
- Use color semantically: orchestrator, implementer, validator, blocked, failed, complete.
- Avoid one-note color themes and decorative gradients.
- Keep surfaces restrained: panels, split panes, tool docks, and overlays should feel native to a workbench.
- Prefer conventional IDE affordances before inventing custom controls, especially for menus, tabs, sidebars, terminals, settings, search, command palettes, and migration dialogs.
- Use consistent icon language, preferably a single stroke icon set.

## Layout Principles

- Steerboard must include a familiar desktop command menu at the top-left without copying a reference app wholesale.
- The MVP top menu should stay restrained to useful sections: `File`, `View`, `Connect`, and `Help`.
- Add `Edit`, `Window`, or other menu sections only when they expose implemented behavior or a concrete setup flow.
- The top menu should remain visible in browser preview and desktop preview; native menu integration can follow later if the desktop shell supports it.
- `File > Migrate...` is the primary entry point for importing settings and working context from supported source platforms.
- The cockpit is the first screen.
- Preset layouts: `1x1`, `2x1`, `1x2`, `3x1`, `1x3`, `2x2`, `2x3`, `3x2`, and `3x3`.
- `Adaptive` is a separate freeform layout mode for user-created, draggable, resizable cockpit panels.
- Preset layout choices must be presented through one compact dropdown or combobox, not a long row of buttons.
- The cockpit control strip must fit into a single dense row: layout selector, focus state, panel activity summary, hidden queue, and playback or monitor controls should collapse gracefully instead of leaving large empty gaps.
- `3x3` is the hard maximum for fixed visible preset grids.
- Adaptive mode may hold additional user-added panels through a scrollable or pannable canvas, but visible panels must obey minimum readable sizes and must not overlap.
- Each cockpit cell must have stable dimensions and predictable scroll behavior.
- Resizing, moving, and replacing sessions must preserve spatial continuity.
- Adaptive panels should use magnetic snapping to grid lines, neighboring panel edges, and safe drop zones so freeform movement still feels controlled.
- Long labels must truncate or wrap cleanly without overlap.
- Sidebars and panels should be useful but never steal attention from active sessions.

## Interaction Principles

- Primary actions should be clear and limited per surface.
- Top-menu actions should either perform a local UI state change, open a real setup/preview dialog, or be omitted until useful.
- Panel composers should always feel chat-capable: text entry, submit, local transcript updates, persistence, and slash command discovery are baseline behavior.
- Icon-only buttons require accessible labels and tooltips.
- Hover, focus, pressed, loading, disabled, success, warning, error, and blocked states must all be designed.
- Keyboard navigation must cover session switching, cockpit focus, task review, approvals, and search.
- Keyboard navigation must cover top-menu access and migration dialog controls.
- Keyboard navigation must cover layout selection, adaptive panel creation, panel movement, panel resize, and layout reset.
- Reduced-motion users must get non-animated state changes.

## Motion

Motion should be subtle and functional:

- 150-250ms for pane transitions.
- Use easing to show where a session moved, resized, snapped, or docked.
- Avoid decorative motion loops.
- Never animate layout in a way that makes transcript reading harder.

## MVP UI Quality Bar

Before calling the scaffold acceptable:

- `1x1`, `2x1`, `1x2`, and `3x3` render without overlap.
- Layout presets are selectable from one dropdown, including `Adaptive`.
- Cockpit status and layout controls fit in one row at desktop widths used by the app preview.
- Streaming transcript placeholders do not resize the grid.
- Status chips remain readable at minimum cell width.
- Right panel does not cover cockpit content.
- Focus ring is visible on all interactive elements.
- Empty, loading, failed, blocked, validating, and complete states are present.
