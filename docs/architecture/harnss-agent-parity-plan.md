# Harnss Agent Parity Plan

## Purpose

This note maps the useful agent-runtime ideas from
[OpenSource03/harnss](https://github.com/OpenSource03/harnss) into Steerboard's
Tauri-first architecture. The target is not to clone harnss UI. The target is
to make Steerboard's Arena use real agent sessions, safe provider auth, provider
APIs, approvals, and orchestration as first-class product infrastructure.

## Source Signals

- Harnss positions itself as a desktop client for Claude Code, Codex, and any
  Agent Client Protocol agent, with parallel sessions, tool visualization, MCP,
  terminal, git, browser, project workspaces, an agent store, permission modes,
  background task agents, and session search.
- Harnss dependencies include `@agentclientprotocol/sdk`,
  `@anthropic-ai/claude-agent-sdk`, and `@modelcontextprotocol/sdk`. That makes
  its backend an Electron/Node runtime, while Steerboard's backend is Tauri/Rust.
- Harnss uses Codex through `codex app-server` JSON-RPC. Its session handler
  starts app-server, initializes the connection, checks `account/read`, gets
  `model/list`, starts or resumes threads, starts turns, interrupts turns,
  responds to approval and user-input requests, lists skills/apps, and handles
  login start.
- Official Codex guidance says app-server is the right interface for rich
  clients that need authentication, conversation history, approvals, and streamed
  agent events. The Codex SDK is better for automation, CI, or programmatic jobs.

## Current Steerboard State

- Steerboard already uses `codex app-server --listen stdio://` in
  `src-tauri/src/lib.rs`.
- Steerboard already supports no-prompt readiness, sanitized auth posture, panel
  session start, turn start, retry, interrupt, steer, event normalization, and
  per-panel local chat persistence.
- The implementation is still too concentrated: app-server lifecycle, protocol
  repair, session registry, auth classification, smoke tests, and Tauri command
  registration all live in one large Rust file, while the React panel owns too
  much live-session behavior directly.
- Steerboard docs already describe the right destination: normalized provider
  adapters, no credential storage, command/plugin/MCP surfaces, approvals, audit,
  and future ACP-compatible workers.

## ADR: Adopt A Provider Runtime Layer

Decision: build a provider-neutral runtime layer inside Steerboard, with Codex
as the first real adapter and ACP support as the second adapter family.

Why:

- Harnss proves the useful shape: engines are configured independently, sessions
  are per project, events are normalized, and approvals are bridged back to UI.
- Codex app-server already exposes the primitives Steerboard needs: threads,
  turns, items, streamed deltas, steering, interrupt, model list, account read,
  skills/apps, and approval-related server requests.
- Steerboard's Arena requires orchestration semantics beyond a chat box:
  orchestrator, worker, validator, and integration sessions need independent
  identities, statuses, events, approvals, and file ownership.

Consequences:

- Do not add OpenAI API key storage to Steerboard for Codex. Use the local Codex
  login and show only sanitized account/auth state.
- Do not wire ACP by importing harnss's Node SDK directly into React. Tauri needs
  either a Rust ACP client, a dedicated Node sidecar, or a constrained process
  bridge.
- Do not let provider-specific event payloads leak into Arena state. Normalize
  into Steerboard session, turn, item, tool, approval, and audit records.

## Implementation Targets

1. Runtime adapter contract

   Create a small TypeScript/Rust-shared shape for adapter capabilities:
   `provider`, `transport`, `authState`, `modelState`, `sessionControls`,
   `permissionModes`, `toolSurfaces`, `mcpState`, and `eventKinds`.

2. Codex adapter extraction

   Move Codex app-server lifecycle out of the monolithic Tauri command module
   into a dedicated Rust adapter module:
   session registry, app-server process, JSON-RPC send/receive, server requests,
   event normalization, and cleanup.

3. Auth and model flow

   Mirror the harnss flow but keep Steerboard's stricter privacy posture:
   initialize, `account/read`, safe auth classification, `model/list`, selected
   model validation, thread start, and turn start. Never return raw auth files,
   tokens, API keys, cookies, or full config paths to React.

4. Approval bridge

   Add a first-class approval request queue for app-server server requests such
   as command execution, file changes, tool calls, and user input. The UI should
   show the source panel/thread/turn, requested action, risk, and decision
   buttons. Until that exists, keep high-risk modes gated.

5. Provider API surfaces

   Promote skills, apps/plugins, slash commands, MCP status, models, account
   state, and permission mode from preview text into normalized adapter data.
   Browser preview must stay non-live and must never attempt Tauri invokes.

6. Agent session model

   Treat every Arena panel as a real agent session with a stable provider
   session id, thread id, role, workspace root, sandbox profile, permission mode,
   model setting, reasoning setting, and status. Closing a panel should detach
   UI visibility, not accidentally destroy the underlying thread unless the user
   chooses that.

7. Orchestration model

   Add an `OrchestratorRun` record that owns planned work, worker sessions,
   validation sessions, integration status, blockers, and evidence. Dispatch
   should create non-overlapping worker specs with file ownership boundaries.
   Codex subagents can be used for fan-out when the user explicitly asks, but
   Steerboard should still surface each worker as a trackable Arena session.

8. ACP adapter family

   Add ACP only after Codex adapter boundaries are clean. Support custom agents
   with command, args, env allowlist, cwd, icon/name, capabilities, and protocol
   status. Use OS keyring or provider config for secrets; do not store secrets in
   localStorage.

## Functional Mapping

| Harnss capability | Steerboard target |
| --- | --- |
| Multi-engine sessions | Runtime adapter registry with Codex first, ACP second |
| Codex app-server | Dedicated Tauri Codex adapter module |
| Agent Store | Runtime profile and ACP agent registry |
| MCP OAuth/status | Provider MCP manager with sanitized status and setup state |
| Permission modes | Ask First, Accept Edits, Allow All mapped to Codex approvals and sandbox |
| Background task agents | OrchestratorRun worker sessions plus Codex subagent visibility |
| Tool cards | Normalized item/tool/audit cards per turn |
| Project workspaces | Session workspace root plus permission profile |
| Session search/history | Provider thread ids plus local Steerboard metadata index |

## Glossary

- Adapter: Steerboard module that translates a provider runtime into normalized
  sessions, turns, events, permissions, and UI state.
- Agent session: One provider-backed worker identity attached to an Arena panel.
- Thread: Provider conversation history. In Codex app-server, threads contain
  turns.
- Turn: One user request and the agent work that follows.
- Item: A unit inside a turn, such as agent text, command execution, file
  change, tool call, or reasoning update.
- Approval request: Provider or Steerboard request for user permission before a
  risky action proceeds.
- Runtime profile: Local configuration that describes provider command,
  workspace, sandbox, models, tools, and permission posture.
- OrchestratorRun: Steerboard record that coordinates an orchestrator session,
  worker sessions, validation, integration, blockers, and evidence.
- ACP: Agent Client Protocol, useful for third-party agents after Codex adapter
  boundaries are clean.

## Priority Order

1. Extract Codex adapter from `src-tauri/src/lib.rs` without changing behavior.
2. Add typed runtime/session/event contracts and tests.
3. Replace panel-specific live state with adapter-backed session state.
4. Add model/account/permission surfaces from provider data.
5. Add approval request queue and UI.
6. Add orchestrator worker dispatch records and per-worker session ownership.
7. Add ACP agent registry once the Codex adapter is stable.

## Open Grill Questions

1. Should Steerboard default new live sessions to workspace-write agent mode, or
   default to read-only and require an explicit permission upgrade?
2. Should "Allow All" ever be available inside Steerboard v1, or should v1 stop
   at "Ask First" and "Accept Edits"?
3. Should ACP custom agents be configured only from Settings, or can project
   `.steerboard` files define project-scoped agents?
4. Should worker sessions share one Codex app-server process per project, or one
   process per session for stronger isolation?
5. Should model selection use Codex `model/list` exactly, hiding local fake
   options, or allow Steerboard aliases such as "Fast" and "Deep" that resolve
   to provider models?
