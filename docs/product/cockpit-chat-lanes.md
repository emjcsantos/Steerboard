# Cockpit Chat Lanes

Steerboard cockpit panels are working lanes, not passive status cards.

Each visible panel should provide:

- a Codex-style conversation thread,
- a composer for follow-up instructions,
- local context chips for validation, activity, files, and tools,
- a visible role and runtime state,
- a clear boundary between local scaffold behavior and future live adapter transport.

The current implementation captures local messages and shows an adapter-pending response. It does not call a network endpoint, start a process, mutate project files, or claim that a live model session is connected.

The next live milestone is to connect panel chat to the provider adapter layer:

- connection center confirms Codex install, auth posture, and app-server availability,
- each panel can bind to a real provider thread,
- slash commands are discoverable from the composer,
- plugin, automation, MCP, and personalization state is visible before prompt submission,
- live actions remain gated by explicit permission and audit surfaces.

Packaging and optional project-management lane work remain paused until their own milestones resume.
