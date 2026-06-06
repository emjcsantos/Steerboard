# Architecture Overview

Steerboard is a local-first desktop arena. The UI presents project lanes, agent sessions, task state, validation evidence, and local runtime status while privileged operations stay behind narrow desktop-shell APIs.

## Major Subsystems

### Desktop Shell

- Desktop-first shell.
- App shell exposes a restrained top-left desktop menu bar with useful working sections first.
- `File > Migrate...` opens the migration source picker and category checklist.
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
- Slash command stream and command-result events.
- Provider session lifecycle state for start, resume, fork, steer, interrupt, retry, and archive.

### Arena Layout

- Preset layout model supports `1x1` through `3x3`.
- Adaptive layout model stores freeform panel geometry separately from fixed preset grids.
- Each fixed cell or adaptive panel binds to a session, task, project, run, provider surface, or evidence pane.
- Layout state is independent from the session registry.
- Users can resize and reassign cells or adaptive panels without mutating session data.
- Adaptive panel records store source type, source id, x, y, width, height, z-order, minimum size, role metadata, focus state, hidden state, and last safe geometry.
- Drag-and-drop from the project/thread rail can create or replace adaptive panels, including chat panels and whole-project panel templates.
- Magnetic layout helpers snap panels to grid intervals, neighboring panel edges, canvas safe zones, and valid docking positions.
- Collision handling should prevent accidental overlap and provide a reset path to the last safe layout.
- The layout selector is one dropdown or combobox that chooses fixed presets or `Adaptive`.
- The Arena control strip should summarize layout, focus, panel activity, hidden queue, and monitor controls in one compact row.
- Mode presets support focus lane, orchestrator-with-workers, and independent project monitor.
- Arena chat remains the primary planning and steering surface; structured pipeline views are optional support surfaces.

### Orchestration Core

- The main orchestrator owns architecture and final integration.
- Task splitter creates small, non-overlapping tasks.
- Worker runner dispatches implementer tasks.
- Validator runner dispatches validation tasks.
- Integration runner checks, revises, commits, pushes, and reports.

### Optional Project Management Lane

- Optional pipeline registry for user-defined development work.
- Backlog, milestone, task, blocker, and release-gate entities.
- Readiness checks before dispatch to a configured agent runtime.
- Dispatch gates combine pipeline item readiness, project registry state, runtime adapter state, and required permission status.
- Selected pipeline item previews summarize dispatch state and blocker details locally before any runtime process is launched.
- Selected pipeline item dispatch request history stores local request and cancellation records separately from real runtime execution.
- Dispatch-ready pipeline items can create local mock Arena run projections through the same dispatch package and run-history path used by planning drafts.
- Selected pipeline item run links are derived from local run history and exact task ownership labels, so the pipeline can reopen matching Arena runs without storing full run payloads in the item detail.
- Pipeline item run status summaries are derived from stripped linked-run records so pipeline monitoring stays local, compact, and independent from full Arena run payloads.
- The lane supports visibility, monitoring, tracking, and change management; it does not replace Arena chat as the normal planning medium.
- A local dispatch package preview is staged before any real runtime execution starts.
- Mock orchestrator run projection converts staged packages into session and task rows for Arena review before runtime adapters execute anything.
- Local run history records staged package projections, task counts, panel counts, and validation gate counts for selected-run inspection.
- Local lifecycle controls transition mock runs through queued, running, complete, blocked, and failed states while keeping task, session, and validation-gate state aligned.
- Selected-run event timelines derive normalized run, task, session, and validation events for compact monitoring in the Arena side panel.
- Local evidence readiness summarizes selected-run gates, evidence-bearing sessions, blockers, and final review state before any terminal, process, filesystem, or network capability is available.
- Terminal and Git evidence readiness combines local evidence state, desktop bridge status, and permission status before any command, Git operation, process, filesystem, or network capability is available.
- Terminal and Git evidence capture history stores local request and cancellation records for review before command output or repository evidence exists.
- Runtime ingestion preview checks selected-run timeline events against the active adapter contract and marks each event as accepted, review, or blocked.
- Local stream preview plays normalized ingestion events into the Arena as a realtime monitoring simulation before external runtime sessions exist.
- Arena monitor summaries combine selected-run timeline counts and local stream state into a compact side-panel strip for quick realtime visibility.
- Arena monitor controls reuse local stream gates so starting, pausing, and resetting the preview remains side-effect-free and permissioned by local adapter readiness.
- Adapter session preview derives transport, heartbeat, permission readiness, and health from the selected runtime adapter plus local stream state.
- Event source preview exposes the remaining normalized event queue that will feed the local stream monitor.
- Source connection preview checks whether the selected adapter has the capabilities and permissions needed to attach that event queue.
- Adapter bridge preview tracks local attach, detach, and stream handoff state before any external runtime process is launched.
- Launch request preview derives handoff readiness, approval status, queued event count, and safety copy from the local bridge and event source before any external runtime process is launched.
- Approval request preview records the user's local request intent separately from execution so the Arena can show pending approval without starting a runtime process.
- Execution audit preview summarizes launch readiness, approval state, and execution lock state before any runtime process is available.
- Local execution audit preview history records request and cancellation actions in browser storage before runtime execution exists.
- Deploy-to-runtime action that creates an orchestrator run from selected pipeline items.
- Trace links from project pipeline item to orchestrator run, worker tasks, validation reports, and final integration result.

### Adapter Layer

- Agent-runtime adapter for configured local or remote runtimes.
- Worker adapter for configured implementer and validator profiles.
- Future adapters for ACP-compatible workers.
- Codex adapter should be the first live adapter and should delegate authentication to Codex rather than storing Codex secrets in Steerboard.
- The first Codex transport target is a desktop-gated, supervised `app-server stdio` bridge. Readiness detection can prove CLI availability, protocol schema, and no-prompt initialize handshake; an explicit live smoke can prove one read-only send/stream turn through `item/agentMessage/delta`.
- `codex exec --json` is a fallback for deliberate one-shot work, not the default live Arena session transport.
- Live provider adapters should expose session, command, plugin, automation, MCP, personalization, approval, and audit capabilities through one normalized contract.
- The Codex adapter should expose a read-only default option seed that mirrors Codex plugins, skills, slash commands, MCP servers, and personalization sources from the connected runtime.
- Source-platform migration adapters should convert supported external settings and integration metadata into Steerboard profiles without copying secrets or mutating the source platform.
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
- The Arena must consume normalized session, task, validation, and tool-call events instead of provider-specific payloads.
- The scaffold exposes an adapter contract inspector that summarizes transport, capability, permission, and normalized-event readiness before runtime execution exists.
- The scaffold exposes a runtime ingestion preview that uses mocked timeline events to verify adapter event compatibility before real streaming is wired in.
- The scaffold exposes local stream controls that play, pause, and reset mocked adapter events without starting external processes.
- The scaffold exposes adapter session health derived from local runtime adapter configuration and mocked stream events.
- The scaffold exposes event source state so the Arena can distinguish queued adapter events from emitted stream events.
- The scaffold exposes source connection readiness so users can see why a local event queue is or is not attachable to a configured adapter.
- The scaffold exposes adapter bridge state so stream playback can be gated by an explicit local attach step.
- The scaffold exposes a launch request preview so users can see when a handoff would be ready while execution remains blocked behind an explicit desktop-shell approval path.
- The scaffold exposes a local approval request state so users can queue or cancel a handoff request while process execution remains unavailable.
- The scaffold exposes an execution audit preview so users can monitor the next execution gate without granting process execution.
- The scaffold stores local execution audit preview records so monitor state survives reloads without storing private paths or secrets.
- The scaffold exposes local validation evidence readiness from selected-run data only; real terminal output, test artifacts, and Git evidence remain behind later permissioned desktop adapters.
- The scaffold exposes terminal and Git capture readiness from local state only; real command output and repository evidence remain locked until desktop permission gates are implemented.
- The scaffold stores local terminal and Git capture request records only; real command output, diffs, and repository metadata are deferred to later permissioned adapters.
- The scaffold exposes desktop bridge reachability in the Arena while keeping process execution and workspace access locked by default.
- The scaffold keeps runtime adapter data local and mocked until a desktop-shell permission path exists for process execution.
- The scaffold keeps runtime profile activation as browser-local Arena state until a desktop-shell permission path can safely promote it into real execution.
- The scaffold shows desktop permission handoff readiness from local active-profile and bridge status only; it does not open a shell permission request or execute commands.
- The scaffold records local desktop permission request intent separately from desktop permission execution so review state can be audited without side effects.
- The scaffold shows desktop permission approval status as a preview only until a desktop-shell approval command exists.
- The scaffold shows desktop permission audit/export preview text only; real audit file creation stays behind a later explicit desktop-shell approval path.
- The scaffold shows desktop packaging readiness as a preview only; packaging commands remain unavailable until a dedicated security and signing path exists.
- The desktop shell approval command currently reports locked status only and does not grant permissions, access files, or launch processes.

### Live Platform Capability Layer

- Connection center detects provider install/version, auth posture, credential storage posture, and service availability.
- Default option seeding creates a read-only provider catalog before live execution: plugins, skills, commands, MCP servers, personalization sources, capability flags, and unsupported states.
- Migration center scans supported source platforms, builds an import preview, redacts excluded data, creates Steerboard profiles, and records a local audit summary.
- Migration center owns source selection, category checkbox state, minimum tool-scope calculation, conflict behavior, preview-only mode, profile write mode, and rollback metadata.
- Command registry powers `/` menus in every Arena composer and maps command invocations to the active provider adapter.
- Plugin manager reads provider plugin state, distinguishes skills, app connectors, and bundled MCP servers, and surfaces setup-required or disabled states.
- Automation manager reads thread, project, and standalone automation state, including schedule, worktree/local mode, latest findings, and unattended-execution risk.
- MCP manager reads configured server state, tool policy, OAuth/login state, startup failures, and health.
- Personalization center reads active instruction and context sources such as project docs, config layers, rules, skills, memories, and custom prompts.
- Permission layer normalizes approval requests from sessions, plugins, MCP tools, automations, terminal commands, Git operations, and external services.
- Audit layer stores reviewable local records of decisions and normalized event summaries without persisting secrets or raw private transcripts.

### Persistence

- Project registry.
- Runtime adapter configuration and readiness state.
- Provider connection metadata and capability availability.
- Read-only provider default option seed metadata.
- Migration import previews, profile mappings, rollback metadata, and local audit summaries.
- Session metadata.
- Handoff records.
- Validation reports.
- Pipeline items and dispatch records.
- Local mock run history.
- Local runtime profile activation state.
- Audit trail.
- User preferences.
- Slash command preferences and recent command state.
- Plugin, automation, MCP, and personalization visibility state.

Do not persist credentials, raw private browser state, or unredacted secrets.
