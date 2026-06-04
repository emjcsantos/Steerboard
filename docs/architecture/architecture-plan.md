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
