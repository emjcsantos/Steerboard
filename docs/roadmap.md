# Public Roadmap

This roadmap is intentionally high level. Detailed planning, task splitting, progress logs, and internal execution notes are kept outside the public repository.

## Milestone Tracking

| Target | Completion | Note |
|---|---|---|
| Phase 1: Product Scaffold | In progress | Core local shell, restrained app menu, public fixture data, project sidebar, fixed cockpit presets, compact cockpit control row, layout dropdown, local panel chat, and operating modes are scaffolded for local review. |
| Phase 2: Orchestration Model | In progress | Mock runs, task state, validation gates, handoff previews, selected-run evidence panels, and compact cockpit monitor summaries with local stream controls are available without external runtime execution. |
| Phase 3: Optional Project Management Lane | In progress | Pipeline items can be inspected, request history is local, dispatch-ready items can create local cockpit run projections, and selected items can show linked local runs with status summaries. This lane supports visibility and change management, while cockpit chat remains primary. |
| Phase 4: Runtime Adapters | In progress | Provider-neutral adapter previews, runtime profiles, local approvals, bridge status, permission previews, and evidence readiness are scaffolded as locked local previews. |
| Phase 5: Live Codex Integration | In progress | Codex transport spike identifies supervised app-server stdio as the safest first session bridge, with prompt execution still locked behind future approval gates. |
| Phase 6: Adaptive Cockpit Canvas | Planned | Adaptive layout enables user-added panels, drag-in chats/projects, magnetic snapping, resizing, repositioning, keyboard control, and persisted safe geometry. |
| Phase 7: Platform Capabilities | Planned | Slash commands, plugins, automations, MCP, personalization, permissions, and audit state become live provider-backed surfaces. |
| Phase 8: Local Execution And Packaging | Planned | Real runtime execution, permissioned terminal/Git capture, audit exports, build signing, and installer checks remain behind future explicit approval gates. |

## Phase 1: Product Scaffold

- Local desktop shell.
- Top-left desktop app menu with only useful MVP sections: `File`, `View`, `Connect`, and `Help`.
- Local panel chat transcript and composer in every cockpit panel.
- Local slash command discovery in panel composers.
- Local Codex connection request preview with execution still locked.
- Public-safe fixture data.
- Project sidebar.
- Fixed cockpit grid presets up to `3x3`.
- Layout dropdown with `Adaptive` as a selectable option.
- Compact single-row cockpit control strip for layout, focus, panel activity, hidden queue, and monitor controls.
- Focus lane, orchestrator-with-workers, and independent project monitor modes.

## Phase 2: Orchestration Model

- Runs, tasks, workers, attempts, validation states, and handoff records.
- Orchestrator task board.
- Worker detail and validation evidence views.
- Deterministic handoff preview.
- Compact cockpit monitor summary for selected-run and stream state.
- Local stream controls on the compact cockpit monitor summary.

## Phase 3: Optional Project Management Lane

- Optional project pipeline.
- Milestones, tasks, blockers, readiness checks, and dispatch previews.
- Selected pipeline item dispatch detail preview.
- Local selected-item dispatch request history.
- Link from pipeline item to cockpit run.
- Local pipeline item to cockpit run projection.
- Visible linked local cockpit runs for selected pipeline items.
- Linked cockpit run status summaries in the pipeline lane.

## Phase 4: Runtime Adapters

- Provider-neutral adapter contract.
- Provider-neutral runtime profile readiness model.
- Runtime profile catalog and cockpit readiness panel.
- Editable local runtime profile draft with saved-state repair.
- Local runtime profile approval request preview.
- Local runtime profile approval history.
- Local runtime profile activation state with no process execution.
- Mock adapter for tests and demos.
- Runtime setup and permission review flow.
- Local launch request preview before approved runtime execution.
- Local approval request preview for runtime handoff.
- Local execution audit preview before runtime execution.
- Local execution audit preview history.
- Desktop bridge status panel for shell reachability and locked execution state.
- Desktop permission handoff preview for an active local runtime profile.
- Local desktop permission request history.
- Local desktop permission approval preview.
- Desktop permission approval status panel.
- Local desktop permission audit and export preview.
- Desktop packaging readiness preview.
- Local validation evidence readiness preview.
- Terminal and Git evidence readiness preview.
- Local terminal and Git capture request history.

## Phase 5: Live Codex Integration

- Codex install and version detection.
- Auth posture display for ChatGPT login, API-key login, and trusted access-token setup.
- Provider connection flow that grows from the local Codex connection request preview into a real adapter handshake.
- Desktop-gated app-server stdio transport probe with no-prompt initialize handshake.
- Documented fallback to local preview or explicit one-shot `exec --json` behavior when stable session transport is unavailable.
- Read-only Codex default option seed for plugins, skills, slash commands, MCP servers, and personalization sources.
- `File > Migrate...` preview for importing supported Codex settings, options, projects, threads/chats, skills, plugins, MCP servers, commands, and personalization into a Steerboard profile.
- Local app-server initialization and health state.
- Thread start, resume, fork, archive, turn start, steer, interrupt, retry, and completion handling.
- Live panel chat backed by normalized stream events.
- Per-panel workspace, model, sandbox, approval, and runtime metadata where supported.
- Connection failure, unsupported capability, and offline states.

## Phase 6: Adaptive Cockpit Canvas

- Adaptive freeform cockpit mode.
- User-created panels from chats, sessions, tasks, evidence panes, provider surfaces, and whole projects.
- Drag-and-drop from the left rail into the cockpit center.
- Resizable and repositionable panels with magnetic snapping.
- Collision handling, safe drop zones, hidden queue integration, and reset to last safe layout.
- Local persistence and saved-state repair for panel geometry.
- Keyboard alternatives for add, move, resize, focus, hide, reveal, and reset.

## Phase 7: Platform Capabilities

- Slash command registry and composer command menu.
- Refreshable seeded option catalog so default plugins, skills, MCP servers, and commands stay aligned with the connected provider.
- Migration center for Codex, Claude Code, Antigravity, generic MCP config, generic skill/prompt folders, and manual JSON or TOML imports, with source picker, category checkboxes, and minimum-needed tool scope.
- Provider-backed command execution with unsupported-state handling.
- Plugin manager showing installed, enabled, disabled, setup-required, and unavailable states.
- Plugin invocation through prompt prefixes or provider-supported command actions.
- Automation manager for thread, project, and standalone automation lifecycle.
- Automation schedule, worktree/local mode, latest findings, and triage state.
- MCP manager for configured servers, health, OAuth/setup state, tool policy, and server failures.
- Personalization center for active instructions, config layers, rules, skills, memories, and custom prompts.
- Permission and approval surface shared by sessions, plugins, MCP tools, automations, terminal, Git, and external services.
- Local audit records for approvals, denials, retries, and normalized live events.

## Phase 8: Local Execution And Packaging

- Real session ownership through configured runtimes.
- Approved launch handoff from local preview into configured runtimes.
- Desktop bridge permission flow for approved process and workspace access.
- Runtime profile editor and validation flow before approved launch.
- Runtime profile activation handoff into desktop-shell permission flow.
- Desktop permission request records for approved profile handoffs.
- Desktop permission request execution with approval, rollback, and audit export.
- Desktop permission approval command backed by shell-level safety checks.
- Signed desktop permission audit export after approved handoff.
- Runtime execution unlock after shell permission approval and audit handoff.
- Runtime execution audit trail for approved handoffs.
- Persisted execution audit records and rollback references.
- Audit export and review workflow.
- Git, terminal, validation, and evidence panels.
- Permissioned terminal and Git evidence capture.
- Rollback-aware command and repository evidence records.
- Local build, signing, and installer readiness checks.
- Signed desktop builds after the local security model is proven.
