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
- CodexSaver is a useful orchestration reference for Steerboard even if it is
  not a dependency candidate yet: the main agent owns judgment and final review,
  worker agents receive bounded work packets, risky actions fall back to the
  main agent, and worker output is verified before it is trusted.

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
   validation sessions, integration status, blockers, and evidence. The initial
   default is a high-capability main orchestrator profile, such as GPT-5.5 when
   the connected provider exposes it, delegating bounded worker packets to a
   lower-cost worker profile, such as GPT-5.3 Spark when available. Dispatch
   should create non-overlapping worker specs with file ownership boundaries.
   Codex subagents can be used for fan-out when the user explicitly asks, but
   Steerboard should still surface each worker as a trackable Arena session.

8. ACP adapter family

   Add ACP only after Codex adapter boundaries are clean. Support custom agents
   with command, args, env allowlist, cwd, icon/name, capabilities, and protocol
   status. Use OS keyring or provider config for secrets; do not store secrets in
   localStorage.

## Steerboard Orchestrator Plan

The orchestrator is native Steerboard product state, not a thin wrapper around a
single provider feature. Codex subagents, CodexSaver-style workers, ACP agents,
or future provider-native workers can all be execution backends, but Steerboard
owns the visible run graph, session ownership, risk routing, handoff, evidence,
and final integration state.

### Default Profiles

- `Main Orchestrator`: high-capability Codex profile, initially mapped to
  GPT-5.5 only when `model/list` exposes that model. It owns planning,
  architecture, ambiguity, auth/security/payment/permission decisions, approval
  review, final integration, commit readiness, and user reporting.
- `Spark Worker`: lower-cost Codex worker profile, initially mapped to
  GPT-5.3 Spark only when `model/list` exposes that model. It handles bounded
  implementation, docs, tests, search, explanation, and low-risk repair tasks.
- `Validator`: readonly or test-focused profile for checking worker output,
  running allowed validation plans, and reporting gaps.
- `Integrator`: optional profile for final patch aggregation and conflict
  analysis. By default this remains the main orchestrator until approval,
  rollback, and audit flows are mature.

These are defaults, not permanent hard-coded model choices. Users should be able
to add, disable, reorder, and edit subagent profiles after provider capability
discovery. If a named model is unavailable, the profile must show a setup or
fallback state instead of silently switching to an invented model.

### Agent Profile Contract

Each configurable subagent profile should include:

- profile id, label, role, provider, provider model id, reasoning effort, and
  display color/icon,
- capability tags such as `search`, `explain`, `docs`, `tests`, `bounded_patch`,
  `validation`, or `integration_review`,
- sandbox profile, permission mode, writable roots, forbidden paths, and network
  posture,
- cost weight, context window, current load, success rate, and enabled state,
- allowed commands and MCP/tool policy,
- source: built-in, user-global, project-scoped, or imported.

Secrets must stay in provider auth stores, OS keyrings, environment variables,
or provider-owned config. Steerboard can store references and sanitized status,
but not raw API keys, bearer tokens, cookies, or auth caches.

### Work Packet Contract

Worker dispatch should use a bounded packet rather than a loose prompt:

- goal,
- task type,
- allowed files or globs,
- forbidden paths,
- context files,
- acceptance criteria,
- allowed commands,
- max iterations,
- max diff lines,
- rollback notes requirement,
- verification plan requirement,
- expected output shape.

Readonly workers may return findings, summaries, risk notes, and suggested next
actions. Patch workers must return changed files, patch content, verification
plan, rollback notes, and risk notes. Steerboard should reject empty patches,
duplicate file writes in the same batch, changed-file mismatches, forbidden-path
touches, missing verification plans, missing rollback notes, and overlapping
patches unless the main orchestrator explicitly resolves them.

### Routing Policy

Delegate first to workers when the task is low-risk, bounded, and verifiable:

- repository search,
- code explanation,
- documentation updates,
- test generation,
- lint or type fixes,
- small localized refactors,
- performance hints,
- bounded implementation with explicit allowed files.

Keep with the main orchestrator:

- architecture decisions,
- ambiguous product choices,
- auth, security, payment, permissions, billing, secrets, migrations, deployment,
  and destructive filesystem actions,
- final review before commit or push,
- failed worker handoffs,
- overlapping patch aggregation,
- any task whose verification plan is weak or unavailable.

### OrchestratorRun State

An `OrchestratorRun` should store:

- run id, source panel id, project id, goal, status, and selected mode,
- orchestrator profile id and worker profile ids,
- work graph nodes with dependencies, owner profile, packet, lifecycle state,
  and evidence,
- blocked actions and Codex-only actions,
- worker results, validator results, aggregate patch state, and conflict state,
- handoff summary with delegated work done, commands to run, blocked actions,
  and main-orchestrator next actions,
- audit metadata: created time, approval state, verification state, rollback
  state, and final integration state.

Lifecycle states should be explicit: `planned`, `queued`, `running`,
`needs_orchestrator`, `blocked`, `failed`, `validated`, `integrating`, and
`complete`.

### V1 Execution Path

The first shippable orchestrator lane should be conservative:

1. main orchestrator plans a work graph,
2. Steerboard previews packets and risk routing,
3. readonly workers run first,
4. bounded patch workers run only when allowed files, commands, verification,
   and rollback notes are present,
5. Steerboard validates worker output and detects overlap,
6. main orchestrator reviews handoff and decides whether to apply, revise, or
   keep work in the main session.

This keeps the product aligned with the CodexSaver lesson: cheaper workers can
do volume, but the main orchestrator remains accountable for judgment.

## Functional Mapping

| Harnss capability | Steerboard target |
| --- | --- |
| Multi-engine sessions | Runtime adapter registry with Codex first, ACP second |
| Codex app-server | Dedicated Tauri Codex adapter module |
| Agent Store | Runtime profile and ACP agent registry |
| MCP OAuth/status | Provider MCP manager with sanitized status and setup state |
| Permission modes | Ask First, Accept Edits, Allow All mapped to Codex approvals and sandbox |
| Background task agents | OrchestratorRun worker sessions plus Codex subagent visibility |
| CodexSaver work packets | Bounded Steerboard worker packets with verification and fallback |
| CodexSaver Agent Cards | User-configurable subagent profiles with capability and cost metadata |
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
- Agent profile: User-editable profile for an orchestrator, worker, validator,
  or integrator, including model, reasoning, permissions, capabilities, cost,
  and tool policy.
- Work packet: Bounded unit of delegated work with explicit goal, scope,
  forbidden paths, acceptance criteria, allowed commands, and verification
  requirements.
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
6. Add agent profile storage with main orchestrator, worker, validator, and
   integrator defaults.
7. Add orchestrator work-packet preview, risk routing, and readonly worker
   dispatch records.
8. Add bounded patch worker dispatch with verification, rollback notes, overlap
   detection, and main-orchestrator handoff.
9. Add ACP agent registry once the Codex adapter and orchestrator contracts are
   stable.

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
6. Should the initial `Main Orchestrator` and `Spark Worker` profiles be global
   defaults, project-scoped defaults, or both?
7. Should worker patch output be applied to a temporary workspace first, or
   should Steerboard require patch-only output until a dedicated sandbox runner
   is implemented?
