# Cockpit Chat Lanes

Steerboard cockpit panels are working lanes, not passive status cards.

Each visible panel should provide:

- a Codex-style conversation thread,
- a composer for follow-up instructions,
- local context chips for validation, activity, files, and tools,
- a visible role and runtime state,
- a clear boundary between local scaffold behavior and future live adapter transport.

The current implementation supports a first live-panel milestone:

- browser preview captures local messages and shows a local preview response,
- visible cockpit panels can use the desktop Codex adapter when the Tauri runtime and Codex app-server transport are available,
- the live panel starts an explicit ephemeral read-only session only after the user submits a message,
- the panel renders normalized assistant output, completion, interruption, and error states,
- panel session metadata is keyed by cockpit panel ID so hidden/revealed panels can preserve identity,
- each panel exposes compact live session controls for interrupt, retry, and steering when supported,
- fork, resume, and archive controls remain visible as honest unsupported states until the adapter exposes those capabilities,
- passive readiness checks must not send prompts or spend model tokens.

This is still an early live milestone. Multi-panel state, event isolation, session-control foundations, the native two-panel smoke proof path, the control-readiness smoke proof path, and explicit active-turn interrupt and steer smoke proof paths now exist, while true incremental UI streaming, fork/resume/archive support, and provider catalogs remain future milestones.

The next live milestone is to connect panel chat to the provider adapter layer:

- connection center confirms Codex install, auth posture, and app-server availability,
- each panel can bind to a real provider thread,
- slash commands are discoverable from the composer with live, preview, unsupported, or unavailable states,
- plugin, automation, MCP, and personalization state is visible before prompt submission,
- live actions remain gated by explicit permission and audit surfaces.

Packaging and optional project-management lane work remain paused until their own milestones resume.
