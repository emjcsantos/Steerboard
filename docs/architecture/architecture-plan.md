# Architecture Overview

Steerboard is a local-first desktop cockpit. The UI presents project lanes, agent sessions, task state, validation evidence, and local runtime status while privileged operations stay behind narrow desktop-shell APIs.

## Major Subsystems

### Desktop Shell

- Desktop-first shell.
- Tauri-first feasibility spike, with Electron as the fallback if core IDE integrations become slower or riskier in Tauri.
- Shell-specific code stays behind adapters.
- Main process owns filesystem, terminal, git, process, and app-server boundaries.
- Renderer stays isolated from Node APIs.
- A narrow desktop bridge status command reports shell reachability and safety state before exposing any process, filesystem, terminal, or network execution capability.

### Session Core

- Session registry.
- Thread metadata.
- Transcript stream.
- Tool-call stream.
- File-change stream.
- Validation result stream.

### Cockpit Layout

- Layout model supports `1x1` through `3x3`.
- Each cell binds to a session, task, or evidence pane.
- Layout state is independent from the session registry.
- Users can resize and reassign cells without mutating session data.
- Mode presets support focus lane, orchestrator-with-workers, and independent project monitor.

### Orchestration Core

- The main orchestrator owns architecture and final integration.
- Task splitter creates small, non-overlapping tasks.
- Worker runner dispatches implementer tasks.
- Validator runner dispatches validation tasks.
- Integration runner checks, revises, commits, pushes, and reports.

### Project Management Lane

- Pipeline registry for user-defined development work.
- Backlog, milestone, task, blocker, and release-gate entities.
- Readiness checks before dispatch to a configured agent runtime.
- Dispatch gates combine pipeline item readiness, project registry state, runtime adapter state, and required permission status.
- A local dispatch package preview is staged before any real runtime execution starts.
- Mock orchestrator run projection converts staged packages into session and task rows for cockpit review before runtime adapters execute anything.
- Local run history records staged package projections, task counts, panel counts, and validation gate counts for selected-run inspection.
- Local lifecycle controls transition mock runs through queued, running, complete, blocked, and failed states while keeping task, session, and validation-gate state aligned.
- Selected-run event timelines derive normalized run, task, session, and validation events for compact monitoring in the cockpit side panel.
- Local evidence readiness summarizes selected-run gates, evidence-bearing sessions, blockers, and final review state before any terminal, process, filesystem, or network capability is available.
- Runtime ingestion preview checks selected-run timeline events against the active adapter contract and marks each event as accepted, review, or blocked.
- Local stream preview plays normalized ingestion events into the cockpit as a realtime monitoring simulation before external runtime sessions exist.
- Adapter session preview derives transport, heartbeat, permission readiness, and health from the selected runtime adapter plus local stream state.
- Event source preview exposes the remaining normalized event queue that will feed the local stream monitor.
- Source connection preview checks whether the selected adapter has the capabilities and permissions needed to attach that event queue.
- Adapter bridge preview tracks local attach, detach, and stream handoff state before any external runtime process is launched.
- Launch request preview derives handoff readiness, approval status, queued event count, and safety copy from the local bridge and event source before any external runtime process is launched.
- Approval request preview records the user's local request intent separately from execution so the cockpit can show pending approval without starting a runtime process.
- Execution audit preview summarizes launch readiness, approval state, and execution lock state before any runtime process is available.
- Local execution audit preview history records request and cancellation actions in browser storage before runtime execution exists.
- Deploy-to-runtime action that creates an orchestrator run from selected pipeline items.
- Trace links from project pipeline item to orchestrator run, worker tasks, validation reports, and final integration result.

### Adapter Layer

- Agent-runtime adapter for configured local or remote runtimes.
- Worker adapter for configured implementer and validator profiles.
- Future adapters for ACP-compatible workers.
- Adapter APIs should normalize events into the session core instead of leaking provider-specific event shapes into the UI.
- Adapter contracts must be easy to add, test, and disable.
- Runtime profiles describe configured transports, commands, permissions, workspace posture, and capabilities without executing them during readiness evaluation.
- Runtime profile catalog helpers keep profile selection and readiness summaries pure so the renderer can display profile state before any launch path exists.
- Runtime profile draft storage keeps one editable local draft in browser storage with defensive repair and no side effects beyond local persistence.
- Runtime profile approval previews derive local request, cancel, blocked, review, and ready states without activating profiles or invoking runtimes.
- Runtime profile approval history stores local request and cancellation records so review state survives reloads before activation exists.
- Runtime profile activation stores a single local active-profile snapshot after an explicit ready-profile approval request, while process execution remains unavailable.
- Runtime profile permission handoff previews combine active-profile state with desktop bridge status before any process, workspace, or network capability can be requested.
- Runtime profile permission request history stores local request and cancellation records for the handoff gate before desktop permissions are available.
- Runtime profile permission approval previews derive blocked, requestable, requested, and review states from local handoff/request state while execution remains locked.
- A narrow desktop permission approval status command reports shell approval reachability before any permission grant or runtime execution can occur.
- Runtime profile permission audit previews combine local approval state, shell approval status, request records, and execution lock state into a reviewable export preview without writing files.
- Desktop packaging readiness derives shell, bridge, permission, and packaging-lock status into a local preview before any build, signing, installer, or filesystem action exists.
- Each runtime adapter should declare capabilities, required permissions, configuration fields, supported commands, event mapping, and mock fixtures.
- The cockpit must consume normalized session, task, validation, and tool-call events instead of provider-specific payloads.
- The scaffold exposes an adapter contract inspector that summarizes transport, capability, permission, and normalized-event readiness before runtime execution exists.
- The scaffold exposes a runtime ingestion preview that uses mocked timeline events to verify adapter event compatibility before real streaming is wired in.
- The scaffold exposes local stream controls that play, pause, and reset mocked adapter events without starting external processes.
- The scaffold exposes adapter session health derived from local runtime adapter configuration and mocked stream events.
- The scaffold exposes event source state so the cockpit can distinguish queued adapter events from emitted stream events.
- The scaffold exposes source connection readiness so users can see why a local event queue is or is not attachable to a configured adapter.
- The scaffold exposes adapter bridge state so stream playback can be gated by an explicit local attach step.
- The scaffold exposes a launch request preview so users can see when a handoff would be ready while execution remains blocked behind an explicit desktop-shell approval path.
- The scaffold exposes a local approval request state so users can queue or cancel a handoff request while process execution remains unavailable.
- The scaffold exposes an execution audit preview so users can monitor the next execution gate without granting process execution.
- The scaffold stores local execution audit preview records so monitor state survives reloads without storing private paths or secrets.
- The scaffold exposes local validation evidence readiness from selected-run data only; real terminal output, test artifacts, and Git evidence remain behind later permissioned desktop adapters.
- The scaffold exposes desktop bridge reachability in the cockpit while keeping process execution and workspace access locked by default.
- The scaffold keeps runtime adapter data local and mocked until a desktop-shell permission path exists for process execution.
- The scaffold keeps runtime profile activation as browser-local cockpit state until a desktop-shell permission path can safely promote it into real execution.
- The scaffold shows desktop permission handoff readiness from local active-profile and bridge status only; it does not open a shell permission request or execute commands.
- The scaffold records local desktop permission request intent separately from desktop permission execution so review state can be audited without side effects.
- The scaffold shows desktop permission approval status as a preview only until a desktop-shell approval command exists.
- The scaffold shows desktop permission audit/export preview text only; real audit file creation stays behind a later explicit desktop-shell approval path.
- The scaffold shows desktop packaging readiness as a preview only; packaging commands remain unavailable until a dedicated security and signing path exists.
- The desktop shell approval command currently reports locked status only and does not grant permissions, access files, or launch processes.

### Persistence

- Project registry.
- Runtime adapter configuration and readiness state.
- Session metadata.
- Handoff records.
- Validation reports.
- Pipeline items and dispatch records.
- Local mock run history.
- Local runtime profile activation state.
- Audit trail.
- User preferences.

Do not persist credentials, raw private browser state, or unredacted secrets.
