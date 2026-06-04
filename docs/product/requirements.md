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
- Runtime profile setup must be provider-neutral and should separate profile readiness from actual process execution.

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
- Selected mock runs should expose a runtime ingestion preview that compares normalized timeline events against the selected adapter contract.
- Runtime ingestion previews should show accepted, review, and blocked event counts without executing any runtime process.
- Selected mock runs should expose a local stream preview that can play, pause, and reset emitted adapter events for realtime cockpit monitoring.
- Stream previews should show latest event, emitted count, pending count, and blocked state without starting external processes.
- Runtime stream previews should expose adapter session status, heartbeat text, transport, and permission readiness for the selected project.
- Adapter session status should reflect offline, connecting, ready, live, paused, complete, and blocked states from local adapter and stream evidence.
- Runtime stream previews should expose a local event source summary showing queued, emitted, accepted, review, and blocked event counts.
- Event source summaries should make the next queued event visible before it is emitted into the cockpit.
- Event source summaries should show whether the queued events can attach to the selected runtime adapter or must remain local.
- Adapter source readiness should explain missing capabilities or permissions before any external process can run.
- Runtime stream previews should expose a local adapter bridge that can attach, detach, and gate stream playback without launching an external process.
- Adapter bridge state should distinguish attachable, attached, live, paused, complete, and blocked states.
- Runtime stream previews should expose a local launch request preview that shows handoff readiness, approval requirement, queued event count, and safety status before any external process can start.
- Launch request previews should allow a local approval request to be queued and cancelled without executing a runtime process.
- Runtime stream previews should expose a local execution audit preview showing launch readiness, approval state, execution lock state, queued event count, and transport.
- Runtime stream previews should retain a local execution audit preview history for approval request and cancellation actions across reloads.
- The desktop shell should expose a safe runtime bridge status so the cockpit can show whether it is running in browser preview or a desktop shell without enabling process execution.
- Desktop bridge status should default to unavailable or locked unless an approved runtime path explicitly reports readiness.
- Runtime profile drafts should start disabled with read-only workspace posture and deterministic readiness reasons.
- The environment panel should show selected runtime profile readiness, transport, workspace posture, capability count, permission count, and safety copy before execution exists.
- Users should be able to edit and locally persist a runtime profile draft without enabling execution.
- Saved runtime profile draft state should be repaired to safe defaults when malformed or unavailable.
- Runtime profile draft approvals should support local request and cancel states without activating a profile or starting a process.
- Runtime profile approval request and cancellation actions should be retained in a local history list across reloads.
- Approved ready runtime profile drafts should support an explicit local activation state that survives reloads without executing a process.
- Local runtime profile activation should be clearable and should remain separate from real launch approval.
- Active runtime profiles should expose a desktop permission handoff preview that explains bridge, process, and workspace gates without executing anything.
- Desktop permission handoff previews should support local request and cancel records that survive reloads without opening desktop permissions.
- Desktop permission request state should expose a local approval preview that keeps execution locked until a real desktop approval path exists.
- The desktop shell should expose a safe permission approval status so the cockpit can show whether the approval command is unavailable, locked, ready, or errored.
- Desktop permission state should expose a local audit and export preview that combines approval state, shell approval status, request history, and execution lock status without writing files.
- The environment panel should expose desktop packaging readiness so users can see shell, bridge, permission, and packaging-lock state before any installer or signed build command exists.

## Later Functional Scope

- Real agent-runtime session ownership.
- Real worker spawning.
- Live transcript streaming.
- Live runtime event ingestion from configured adapters.
- Live stream controls backed by configured adapter sessions.
- Adapter session monitor backed by real configured runtime events.
- Configured event source adapters that replace local mocked event queues.
- Adapter source connection flow that turns a local event queue into a configured runtime stream.
- Desktop-shell adapter bridge that can hand off from local preview to an approved configured runtime.
- Desktop-shell bridge commands that report runtime reachability, workspace readiness, and permission status before any process launch is allowed.
- Approved launch request execution from the local preview into a configured desktop-shell adapter.
- Approval request history, execution audit, and rollback records for configured runtime handoffs.
- Execution audit history persisted across approved runtime handoffs.
- Exportable execution audit records for team review.
- Git diff, test, commit, and push panels.
- Browser and terminal panes.
- MCP configuration and status.
- Additional worker adapters beyond the default configured runtime.
- Deploy-to-runtime action that converts a selected pipeline item into an orchestrator run, task split, and worker handoff set.
- Runtime integration wizard for adding or testing a configured model/provider adapter.
- Runtime profile editor for configuring provider-neutral transports, commands, permissions, and capabilities before launch approval.
- Runtime profile catalog management with project/adapter mapping, review states, and disabled-by-default local process drafts.
- Runtime profile drafts should graduate into approved runtime profiles only through an explicit permission and launch approval flow.
- Approved runtime profile promotion should preserve an audit trail from draft readiness to activation decision.
- Runtime profile approval history should later feed the activation audit trail when real profile promotion exists.
- Local runtime profile activation should later hand off to the desktop permission flow before any configured runtime can execute.
- Desktop permission handoff previews should later become explicit permission requests with audit records and rollback notes.
- Local desktop permission request records should later feed configured runtime permission approvals.
- Desktop permission approval previews should later become real approval gates with signed audit records.
- Desktop permission approval status should later connect to the real shell approval command after safety checks are implemented.
- Desktop permission audit previews should later export signed review records after the desktop approval and rollback model is implemented.
- Desktop packaging readiness should later hand off to real local build, signing, and installer checks after the packaging security model is implemented.

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
