# Architecture Overview

Steerboard is a local-first desktop cockpit. The UI presents project lanes, agent sessions, task state, validation evidence, and local runtime status while privileged operations stay behind narrow desktop-shell APIs.

## Major Subsystems

### Desktop Shell

- Desktop-first shell.
- Tauri-first feasibility spike, with Electron as the fallback if core IDE integrations become slower or riskier in Tauri.
- Shell-specific code stays behind adapters.
- Main process owns filesystem, terminal, git, process, and app-server boundaries.
- Renderer stays isolated from Node APIs.

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
- Runtime ingestion preview checks selected-run timeline events against the active adapter contract and marks each event as accepted, review, or blocked.
- Local stream preview plays normalized ingestion events into the cockpit as a realtime monitoring simulation before external runtime sessions exist.
- Adapter session preview derives transport, heartbeat, permission readiness, and health from the selected runtime adapter plus local stream state.
- Event source preview exposes the remaining normalized event queue that will feed the local stream monitor.
- Source connection preview checks whether the selected adapter has the capabilities and permissions needed to attach that event queue.
- Adapter bridge preview tracks local attach, detach, and stream handoff state before any external runtime process is launched.
- Deploy-to-runtime action that creates an orchestrator run from selected pipeline items.
- Trace links from project pipeline item to orchestrator run, worker tasks, validation reports, and final integration result.

### Adapter Layer

- Agent-runtime adapter for configured local or remote runtimes.
- Worker adapter for configured implementer and validator profiles.
- Future adapters for ACP-compatible workers.
- Adapter APIs should normalize events into the session core instead of leaking provider-specific event shapes into the UI.
- Adapter contracts must be easy to add, test, and disable.
- Each runtime adapter should declare capabilities, required permissions, configuration fields, supported commands, event mapping, and mock fixtures.
- The cockpit must consume normalized session, task, validation, and tool-call events instead of provider-specific payloads.
- The scaffold exposes an adapter contract inspector that summarizes transport, capability, permission, and normalized-event readiness before runtime execution exists.
- The scaffold exposes a runtime ingestion preview that uses mocked timeline events to verify adapter event compatibility before real streaming is wired in.
- The scaffold exposes local stream controls that play, pause, and reset mocked adapter events without starting external processes.
- The scaffold exposes adapter session health derived from local runtime adapter configuration and mocked stream events.
- The scaffold exposes event source state so the cockpit can distinguish queued adapter events from emitted stream events.
- The scaffold exposes source connection readiness so users can see why a local event queue is or is not attachable to a configured adapter.
- The scaffold exposes adapter bridge state so stream playback can be gated by an explicit local attach step.
- The scaffold keeps runtime adapter data local and mocked until a desktop-shell permission path exists for process execution.

### Persistence

- Project registry.
- Runtime adapter configuration and readiness state.
- Session metadata.
- Handoff records.
- Validation reports.
- Pipeline items and dispatch records.
- Local mock run history.
- Audit trail.
- User preferences.

Do not persist credentials, raw private browser state, or unredacted secrets.
