# UI Direction

## Product Feel

Steerboard should feel like a calm, high-control engineering cockpit: focused, dense, legible, and smooth under pressure.

The UI should not feel like a marketing page, a decorative dashboard, or a loose clone of an existing agent IDE.

## Visual Identity

- Dark-first desktop interface with strong contrast and quiet color.
- Use color semantically: orchestrator, implementer, validator, blocked, failed, complete.
- Avoid one-note color themes and decorative gradients.
- Keep surfaces restrained: panels, split panes, tool docks, and overlays should feel native to a workbench.
- Use consistent icon language, preferably a single stroke icon set.

## Layout Principles

- Steerboard must include a Codex-like desktop command menu at the top-left: `File`, `Edit`, `View`, `Window`, and `Help`.
- The top menu should remain visible in browser preview and desktop preview; native menu integration can follow later if the desktop shell supports it.
- `File > Migrate...` is the primary entry point for importing settings and working context from supported source platforms.
- The cockpit is the first screen.
- Supported layouts: `1x1`, `2x1`, `1x2`, `3x1`, `1x3`, `2x2`, `2x3`, `3x2`, `3x3`.
- `3x3` is the hard maximum.
- Each cockpit cell must have stable dimensions and predictable scroll behavior.
- Resizing, moving, and replacing sessions must preserve spatial continuity.
- Long labels must truncate or wrap cleanly without overlap.
- Sidebars and panels should be useful but never steal attention from active sessions.

## Interaction Principles

- Primary actions should be clear and limited per surface.
- Icon-only buttons require accessible labels and tooltips.
- Hover, focus, pressed, loading, disabled, success, warning, error, and blocked states must all be designed.
- Keyboard navigation must cover session switching, cockpit focus, task review, approvals, and search.
- Keyboard navigation must cover top-menu access and migration dialog controls.
- Reduced-motion users must get non-animated state changes.

## Motion

Motion should be subtle and functional:

- 150-250ms for pane transitions.
- Use easing to show where a session moved or resized.
- Avoid decorative motion loops.
- Never animate layout in a way that makes transcript reading harder.

## MVP UI Quality Bar

Before calling the scaffold acceptable:

- `1x1`, `2x1`, `1x2`, and `3x3` render without overlap.
- Streaming transcript placeholders do not resize the grid.
- Status chips remain readable at minimum cell width.
- Right panel does not cover cockpit content.
- Focus ring is visible on all interactive elements.
- Empty, loading, failed, blocked, validating, and complete states are present.
