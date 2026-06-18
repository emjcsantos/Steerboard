# Live Platform Capabilities

Steerboard must make core agent-platform functions live, not decorative. The first live action surface is a fixed read-only terminal probe, while adjacent capability UIs (commands, plugins, automations, MCP, personalization, approvals, service status) remain visible but non-mutating until later phases.

Project-management dispatch remains a local-review capability in this slice: staged plans should explicitly model orchestrator, implementer, validator, and integration role panel workflows for Arena review, with external runtime execution intentionally deferred.

## Current Implementation Closeout

The current live-functionality slice has completed the public scaffold, Arena panels, adaptive layout foundations, Phase 10 polish readiness targets, Phase 11 owner command targets, Phase 11 release-readiness targets, provider-neutral catalogs, migration preview foundations, permission/audit foundations, Phase 9 fixed runner approval targets, and Phase 3 smoke-proof evidence persistence. The next active pipeline item is desktop proof clearance: run the explicit desktop gate actions, verify persisted proof rows after reload and while the app remains open, and confirm slash-command and session-control readiness evidence before moving to broader provider integration, dispatch execution, or release packaging.

The Phase 11 release-readiness target is decision support only. It aggregates clean checkout, build/test, owner smoke proof, current active Phase 3 clearance PM traceability with handoff proof, packaging lock, docs/known limits, final security closure capability, and final release decision while packaging, signing, installer creation, Git push, and external release actions stay paused.

## Product Principle

Every visible capability must have an honest state:

- unavailable when the local runtime does not expose it,
- disconnected when credentials or configuration are missing,
- preview when the UI can model the workflow but cannot execute it yet,
- live when a provider adapter can read, write, stream, or execute through an approved path.

Steerboard should start with a runtime adapter, but the product contract must stay provider-neutral so other services can implement the same surfaces later.

## First Live Adapter

The first adapter should use a local provider runtime instead of storing runtime secrets in Steerboard.

- Authentication delegates to runtime-specific login or trusted access-token setup.
- Session transport uses local adapter transport where available.
- The first transport spike targets supervised `stdio://` transport because it can prove local reachability with a no-prompt initialize handshake before any request is sent.
- A separate explicit live smoke should prove one ephemeral read-only send/stream turn by observing `item/agentMessage/delta` and `turn/completed`.
- Command-line fallback is treated as a one-shot fallback, not a replacement for live multi-panel session transport.
- Session, tool, approval, and stream events are normalized into Steerboard Arena events.
- Runtime config, plugins, MCP, automations, memories, rules, and slash commands are reflected through adapter APIs rather than hardcoded as static UI.

## Runtime Default Option Seeding

Steerboard should copy connected adapter defaults as a read-only seed catalog during adapter setup, then refresh that catalog from the active runtime.

- Plugin defaults should mirror connected plugin metadata, including bundled skills, app connectors, bundled MCP servers, enabled/disabled state, setup-required state, and invocation hints.
- Skill defaults should mirror runtime skill registry across system, admin, user, repository, and plugin-provided skills, while preserving each skill's source, trigger description, explicit invocation name, and enablement state.
- MCP defaults should mirror runtime MCP configuration layers, including user config, project config, plugin-provided MCP servers, stdio servers, HTTP servers, OAuth/login-required state, tool policy, timeout settings, and enabled/disabled state.
- Slash command defaults should mirror the connected runtime's command registry and include command availability, scope, required capability, and unsupported-state copy.
- Seeded defaults are not secrets and must not include tokens, raw auth files, private browser state, or raw transcripts.
- If a user customizes a seeded option in Steerboard, save it as a Steerboard profile override instead of mutating runtime config silently.
- Provide a refresh action so users can re-sync Steerboard with the active runtime after installing plugins, adding skills, or changing MCP servers.
- The connection dialog should provide one all-catalog provider refresh smoke proof that refreshes command, skill, plugin, MCP, automation, and personalization metadata/status sources without executing commands, tools, automations, profile mutations, terminal actions, Git operations, or external actions.

## Migration Center

Steerboard should let users migrate settings and integrations from supported source platforms through `File > Migrate...`, then convert them into Steerboard profiles through a reviewed import flow. Natural-language migration requests should open the same dialog.

- Planned source adapters include generic MCP config, skill/prompt folders, and manual JSON or TOML imports.
- Importable categories include projects, threads/chats, settings, model/provider preferences, commands, skills, prompts, agents, plugins, MCP servers, tool policy, project instructions, automations, personalization, and safe UI preferences.
- The migration dialog should expose category checkboxes and disabled unsupported options with clear reasons.
- Imported tools should be limited to the functions needed by the selected categories; broad or unused tool access remains disabled until explicitly enabled.
- The migration center must show a preview before import, with counts for accepted, review-required, unsupported, and excluded items.
- Secrets, auth caches, cookies, browser state, raw transcripts, and access tokens are always excluded.
- Imported live execution is disabled by default until the user approves provider, workspace, permission, and audit gates.
- Refresh from source is allowed, but write-back to the source platform requires a separate explicit approval.
- The migration center now also persists reviewed metadata into local profile drafts with rollback-friendly state and a local audit summary so users can safely inspect and apply/revert migration edits before activation.

## Required Live Surfaces

### Chat And Session Control

- Start a new session from any Arena panel.
- Resume or fork existing sessions.
- Send messages through the panel composer.
- Stream agent messages, tool events, command output summaries, approvals, and final status.
- Interrupt, retry, or steer an active turn.

### Slash Command Registry

- Show a command menu from `/` in every composer.
- Support provider-reported commands first.
- Built-in baseline commands should include status, plan, review, MCP, feedback, and memory controls when available; command execution is preview-only and must not run side-effectful actions yet.
- Commands must be discoverable, keyboard accessible, scoped to the active panel, and capable of reporting unsupported states.
- Skills and plugins should be invocable with explicit prefixes when the connected runtime supports them.

### Plugin Manager

- Show installed, enabled, disabled, unavailable, and setup-required plugin states.
- Start from adapter-seeded plugin catalog data for the active adapter.
- Distinguish plugin skills, app connectors, and bundled MCP servers.
- Let users open setup, enable, disable, or inspect a plugin through the provider adapter; runtime plugin invocation and plugin-backed actions stay disabled in this phase.
- Never store third-party app secrets in Steerboard.
- External app sign-in and data-sharing warnings must be visible before use.

### Automations

- List thread, project, and standalone automations.
- Create, edit, pause, resume, archive, or inspect automations when the provider exposes those operations; scheduling and execution are disabled by design in this phase.
- Show schedule, run mode, worktree/local execution posture, latest run state, findings, and triage status.
- Make unattended execution risk visible, especially sandbox mode, approval policy, and workspace access.

### MCP Manager

- List configured MCP servers and their health.
- Start from adapter-seeded MCP catalog data for the active adapter.
- Add, edit, enable, disable, or remove servers through provider-supported flows.
- Support stdio and HTTP server configuration where the provider supports them.
- Surface OAuth/login-required states without storing tokens directly.
- Show tool allowlists, denylists, approval modes, startup failures, and timeout state; MCP tool execution is cataloged and disabled until a later phase.

### Personalization

- Expose user and project configuration layers.
- Show instruction sources such as project docs, local agent guidance, rules, skills, memories, and custom prompts.
- Start from adapter-seeded skill and personalization catalog data when the active adapter is connected.
- Let users inspect which personalization sources are active in a panel before sending a prompt.
- Keep durable team rules in checked-in docs or project config, not only in generated memories.
- Do not persist secrets, private browser state, or raw transcripts in public project files.

### Approvals, Permissions, And Audit

- Any live external action must pass through a visible permission path.
- The Arena should show what action is requested, which runtime requested it, what workspace or service is affected, and how to reject or approve.
- Automation and plugin actions need stronger warning states because they are cataloged but explicitly non-executable in this phase.
- Audit records should capture decisions and normalized event summaries without storing secrets.

## Adapter Contract

Each provider adapter should declare:

- auth methods and current connection state,
- supported session lifecycle methods,
- supported stream event types,
- command registry entries,
- plugin registry capability,
- automation registry capability,
- MCP registry capability,
- personalization sources,
- permission and approval requirements,
- safe mock fixtures for tests and demos.

The Arena consumes only normalized adapter events. Adapter-specific payloads stay inside the adapter.

## Runner Contract and Dry-Run Attachment

Phase 10B defines the first desktop-backed runner attachment:

- Approved requests can progress into a fixed read-only terminal probe only.
- The probe returns terminal output summaries and redacted action evidence for review.
- Arbitrary terminal commands, Git mutation, MCP execution, plugin execution, automation execution, runtime mutation, profile mutation, and external-service actions are disabled in this phase.
- Real desktop-backed execution and mutation remain explicitly deferred to a later intentional phase.

## Milestone Path

| Target | Completion | Note |
|---|---|---|
| Connection Center | 25% | Local transport probe model added; desktop bridge can distinguish browser preview, CLI detection, app-server stdio handshake, explicit live-smoke result, and locked startup execution. |
| Primary Runtime Adapter | 50% | Supervised adapter transport now has no-prompt readiness, explicit live smoke, panel-keyed session start/send/interrupt/close commands, retry/steer foundations, and normalized event collection. |
| Live Panel Chat | 50% | Visible desktop panels can send through the runtime adapter, render normalized assistant/status/error output, expose compact interrupt/retry/steer controls, and show unsupported-control plus per-control owner-testing readiness evidence for unavailable lifecycle actions; browser preview remains local fallback. Panel-session persistence, duplicate identity guards, stream isolation foundations, native two-panel smoke, control-readiness smoke, explicit active-turn interrupt and steer smoke proof paths, and an actionable diagnostic Phase 3 exit-gate evidence rollup are in place; desktop owner execution of those smokes, incremental UI streaming, and fork/resume/archive support remain pending. |
| Slash Command Registry | 42% | Provider-neutral command catalog, command state model, panel-scoped composer suggestions, preview routing, unsupported/unavailable blocking, visible provider-route transcript evidence, evidence-driven owner testing readiness, desktop-backed safe provider capability refresh, owner validation, all-catalog provider refresh smoke proofing, and Refresh Safety depth for current metadata/status snapshots are in place; arbitrary command/tool execution remains pending. |
| Skills Catalog | 24% | Provider-neutral skill model, dialog surface, provider-only row support, desktop-backed safe provider metadata refresh, owner validation, all-catalog provider refresh smoke proofing, and Refresh Safety depth for current metadata/status snapshots are in place; skill execution remains pending. |
| MCP Manager | 24% | Provider-neutral MCP model, dialog surface, provider-only row support, desktop-backed safe provider metadata refresh, owner validation, all-catalog provider refresh smoke proofing, and Refresh Safety depth for current metadata/status snapshots are in place; MCP tool execution remains pending. |
| Plugin Manager | 24% | Provider-neutral plugin model, dialog surface, provider-only row support, desktop-backed safe provider metadata refresh, owner validation, all-catalog provider refresh smoke proofing, and Refresh Safety depth for current metadata/status snapshots are in place; plugin execution remains pending. |
| Automations Manager | 24% | Provider-neutral automation model, dialog surface, provider-only row support, desktop-backed safe provider metadata refresh, owner validation, all-catalog provider refresh smoke proofing, and Refresh Safety depth for current metadata/status snapshots are in place; scheduling and execution remain pending. |
| Personalization Center | 24% | Provider-neutral personalization model, settings entry, provider-only row support, desktop-backed safe provider metadata refresh, owner validation, all-catalog provider refresh smoke proofing, and Refresh Safety depth for current metadata/status snapshots are in place; profile mutation remains pending. |
| Migration Center | 30% | `File > Migrate...` now exposes a safe source selector, desktop metadata scan, category checkboxes, excluded secrets summary, local reviewed draft persistence, and rollback/audit summary for safe metadata. Full source migration and source mutation remain pending by design. |
| Permission And Audit Layer | 60% | Provider-neutral approval gates, approval-first read-only terminal probe runner, redacted local audit records, a Phase 8 Audit Depth panel with PM/evidence-key traceability, and a Phase 9 Runner Approval panel now explain missing permission, request preview, validation output, audit persistence, disabled paths, and rollback requirements; Git/MCP/plugin/automation/runtime/profile/external mutation remains deferred. |
| Release Readiness | 20% | The Phase 11 Release Readiness gate now tracks clean checkout, build/test, smoke proof, current active Phase 3 clearance PM traceability with handoff proof, packaging lock, docs/known limits, final security closure capability, and release decision while packaging remains paused. |
