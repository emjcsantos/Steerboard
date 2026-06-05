# Live Platform Capabilities

Steerboard must make core agent-platform functions live, not decorative. The cockpit should support real chat sessions first, then expose the surrounding capabilities users expect from a Codex-class desktop surface: commands, plugins, automations, MCP servers, personalization, approvals, and service connection status.

## Product Principle

Every visible capability must have an honest state:

- unavailable when the local runtime does not expose it,
- disconnected when credentials or configuration are missing,
- preview when the UI can model the workflow but cannot execute it yet,
- live when a provider adapter can read, write, stream, or execute through an approved path.

Steerboard should start with a Codex adapter, but the product contract must stay provider-neutral so other services can implement the same surfaces later.

## First Live Adapter: Codex

The Codex adapter should use the local Codex runtime instead of storing Codex secrets in Steerboard.

- Authentication delegates to Codex login, API-key login, or trusted access-token setup.
- Session transport uses Codex app-server where available.
- The first transport spike targets supervised app-server `stdio://` because it can prove local reachability with a no-prompt initialize handshake before any model prompt is sent.
- A separate explicit live smoke should prove one ephemeral read-only send/stream turn by observing `item/agentMessage/delta` and `turn/completed`.
- Codex CLI `exec --json` is treated as a one-shot fallback, not a replacement for live multi-panel session transport.
- Thread, turn, item, tool, approval, and stream events are normalized into Steerboard cockpit events.
- Codex config, plugins, MCP, automations, memories, rules, and slash commands are reflected through adapter APIs rather than hardcoded as static UI.

## Codex Default Option Seeding

Steerboard should copy Codex's default options as a read-only seed catalog during Codex adapter setup, then refresh that catalog from the connected Codex runtime.

- Plugin defaults should mirror Codex plugin groups and installed plugin metadata, including bundled skills, app connectors, bundled MCP servers, enabled/disabled state, setup-required state, and invocation hints.
- Skill defaults should mirror Codex's available skill registry across system, admin, user, repository, and plugin-provided skills, while preserving each skill's source, trigger description, explicit invocation name, and enablement state.
- MCP defaults should mirror Codex MCP configuration layers, including user config, trusted project config, plugin-provided MCP servers, stdio servers, HTTP servers, OAuth/login-required state, tool policy, timeout settings, and enabled/disabled state.
- Slash command defaults should mirror the connected runtime's command registry and include command availability, scope, required capability, and unsupported-state copy.
- Seeded defaults are not secrets and must not include tokens, raw auth files, private browser state, or raw transcripts.
- If a user customizes a seeded option in Steerboard, save it as a Steerboard profile override instead of mutating Codex config silently.
- Provide a refresh action so users can re-sync Steerboard with Codex after installing plugins, adding skills, or changing MCP servers.

## Migration Center

Steerboard should let users migrate settings and integrations from supported source platforms through `File > Migrate...`, then convert them into Steerboard profiles through a reviewed import flow. Natural-language migration requests should open the same dialog.

- Planned source adapters include Codex, Claude Code, Antigravity, generic MCP config, generic skill/prompt folders, and manual JSON or TOML imports.
- Importable categories include projects, threads/chats, settings, model/provider preferences, commands, skills, prompts, agents, plugins, MCP servers, tool policy, project instructions, automations, personalization, and safe UI preferences.
- The migration dialog should expose category checkboxes and disabled unsupported options with clear reasons.
- Imported tools should be limited to the functions needed by the selected categories; broad or unused tool access remains disabled until explicitly enabled.
- The migration center must show a preview before import, with counts for accepted, review-required, unsupported, and excluded items.
- Secrets, auth caches, cookies, browser state, raw transcripts, and access tokens are always excluded.
- Imported live execution is disabled by default until the user approves provider, workspace, permission, and audit gates.
- Refresh from source is allowed, but write-back to the source platform requires a separate explicit approval.

## Required Live Surfaces

### Chat And Session Control

- Start a new session from any cockpit panel.
- Resume or fork existing sessions.
- Send messages through the panel composer.
- Stream agent messages, tool events, command output summaries, approvals, and final status.
- Interrupt, retry, or steer an active turn.

### Slash Command Registry

- Show a command menu from `/` in every composer.
- Support provider-reported commands first.
- Codex baseline commands should include status, plan, goal, review, MCP, feedback, and memory controls when available.
- Commands must be discoverable, keyboard accessible, scoped to the active panel, and capable of reporting unsupported states.
- Skills and plugins should be invocable with explicit prefixes when the connected runtime supports them.

### Plugin Manager

- Show installed, enabled, disabled, unavailable, and setup-required plugin states.
- Start from the Codex-seeded plugin catalog when the active provider is Codex.
- Distinguish plugin skills, app connectors, and bundled MCP servers.
- Let users open setup, enable, disable, or inspect a plugin through the provider adapter.
- Never store third-party app secrets in Steerboard.
- External app sign-in and data-sharing warnings must be visible before use.

### Automations

- List thread, project, and standalone automations.
- Create, edit, pause, resume, archive, or inspect automations when the provider exposes those operations.
- Show schedule, run mode, worktree/local execution posture, latest run state, findings, and triage status.
- Make unattended execution risk visible, especially sandbox mode, approval policy, and workspace access.

### MCP Manager

- List configured MCP servers and their health.
- Start from the Codex-seeded MCP catalog when the active provider is Codex.
- Add, edit, enable, disable, or remove servers through provider-supported flows.
- Support stdio and HTTP server configuration where the provider supports them.
- Surface OAuth/login-required states without storing tokens directly.
- Show tool allowlists, denylists, approval modes, startup failures, and timeout state.

### Personalization

- Expose user and project configuration layers.
- Show instruction sources such as project docs, local agent guidance, rules, skills, memories, and custom prompts.
- Start from the Codex-seeded skill and personalization catalog when the active provider is Codex.
- Let users inspect which personalization sources are active in a panel before sending a prompt.
- Keep durable team rules in checked-in docs or project config, not only in generated memories.
- Do not persist secrets, private browser state, or raw transcripts in public project files.

### Approvals, Permissions, And Audit

- Any live external action must pass through a visible permission path.
- The cockpit should show what action is requested, which runtime requested it, what workspace or service is affected, and how to reject or approve.
- Automation and plugin actions need stronger warning states because they may run without active supervision.
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

The cockpit consumes only normalized adapter events. Provider-specific payloads stay inside the adapter.

## Milestone Path

| Target | Completion | Note |
|---|---|---|
| Connection Center | 25% | Local transport probe model added; desktop bridge can distinguish browser preview, CLI detection, app-server stdio handshake, explicit live-smoke result, and locked startup execution. |
| Codex App-Server Adapter | 50% | Supervised app-server stdio now has no-prompt readiness, explicit live smoke, panel-keyed session start/send/interrupt/close commands, retry/steer foundations, and normalized event collection. |
| Live Panel Chat | 42% | Visible desktop panels can send through the Codex adapter, render normalized assistant/status/error output, and expose compact interrupt/retry/steer controls; browser preview remains local fallback. Panel-session persistence and stream isolation foundations are in place; native two-panel smoke, live control smoke, and incremental UI streaming remain pending. |
| Slash Command Registry | 20% | Provider-neutral command catalog, command state model, composer suggestions, preview routing, and unsupported/unavailable blocking are in place; provider-reported command refresh and live command execution remain pending. |
| MCP Manager | 0% | Show configured servers, health, OAuth/setup state, and tool policy. |
| Plugin Manager | 0% | Show plugin install/setup/enabled state and supported invocations. |
| Automations Manager | 0% | Show and manage thread/project/standalone automation lifecycle. |
| Personalization Center | 0% | Show active instructions, config layers, rules, skills, and memory state. |
| Permission And Audit Layer | 0% | Gate live actions and preserve reviewable local audit records. |
