# PRD: Steerboard Agent Orchestration And Runtime Adapter Layer

## Problem Statement

Steerboard is intended to be a desktop Arena for planning, monitoring, and
steering multiple agent-assisted project sessions at once, but the current live
agent path is still too close to a single-panel chat bridge. The product needs a
first-class orchestration layer that can connect to Codex, expose real provider
capabilities, create independent agent sessions, delegate bounded work to
workers, validate results, and keep risky judgment in the main orchestrator.

Users want the main Arena chat to behave like a real agentic workspace: the main
orchestrator should plan and judge, lower-cost workers should handle bounded and
verifiable tasks, validators should check evidence, and the user should be able
to configure subagents over time. They should not have to trust silent routing,
fake model labels, unclear auth state, or hidden provider behavior.

The current architecture note correctly identified useful patterns from harnss
and CodexSaver, but it was not yet a product requirements document. This PRD
turns that plan into implementable product scope.

## Solution

Build a provider-neutral runtime adapter and orchestration layer for Steerboard,
with Codex as the first live adapter and ACP-compatible agents as a later adapter
family.

The first target experience is:

1. The user connects Steerboard to the local Codex app-server.
2. Steerboard safely discovers account state, models, session controls, commands,
   skills, plugins, MCP status, and approval capabilities without exposing
   secrets.
3. The user sees configurable agent profiles, including a main orchestrator,
   worker, validator, and optional integrator.
4. The main orchestrator plans work from the Arena chat.
5. Steerboard converts safe delegated work into bounded work packets.
6. Workers run only when scope, files, commands, permissions, verification, and
   rollback expectations are explicit.
7. Validators and the main orchestrator review worker output before integration.
8. The Arena shows every panel/session, run, worker, blocker, approval, and
   evidence item as product state.

Initial defaults should support a high-capability main orchestrator profile,
mapped to GPT-5.5 only when the connected provider exposes that model, and a
lower-cost Spark worker profile, mapped to GPT-5.3 Spark only when available.
These are defaults, not hard-coded assumptions. Users must be able to configure
subagent profiles over time.

## User Stories

1. As a Steerboard user, I want one main orchestrator to own planning, so that I
   can keep architecture and final judgment in one accountable place.
2. As a Steerboard user, I want lower-cost worker agents to handle bounded tasks,
   so that routine work does not consume the strongest model unnecessarily.
3. As a Steerboard user, I want workers to be configurable, so that I can choose
   the model, provider, reasoning effort, permissions, and capabilities that fit
   my workflow.
4. As a Steerboard user, I want GPT-5.5 to be used only when it is actually
   available from the provider, so that the app does not show fake model choices.
5. As a Steerboard user, I want GPT-5.3 Spark to be available as a worker default
   only when the provider reports it, so that worker routing is honest.
6. As a Steerboard user, I want unavailable default models to show a setup or
   fallback state, so that I know what needs attention.
7. As a Steerboard user, I want every Arena panel to represent a real agent
   session, so that each chat/thread has its own identity and status.
8. As a Steerboard user, I want hidden Arena panels to preserve their underlying
   sessions, so that layout changes do not destroy agent work.
9. As a Steerboard user, I want closing a panel to be different from archiving a
   provider thread, so that I do not accidentally lose useful history.
10. As a Steerboard user, I want the connection panel to show sanitized Codex
    account state, so that I understand whether I am using ChatGPT entitlement,
    API-key billing, or an unknown local auth state.
11. As a Steerboard user, I want Steerboard to avoid storing Codex secrets, so
    that auth remains owned by Codex and the operating system.
12. As a Steerboard user, I want the app to list provider models from the
    provider, so that the model selector reflects reality.
13. As a Steerboard user, I want the app to list provider commands and slash
    commands, so that panel composers can route commands correctly.
14. As a Steerboard user, I want plugin, skill, MCP, automation, and
    personalization surfaces to show real provider state, so that I can see what
    is usable, disabled, unsupported, or needs setup.
15. As a Steerboard user, I want browser preview mode to stay non-live, so that
    web preview never attempts desktop-only provider calls.
16. As a Steerboard user, I want Tauri desktop mode to own privileged provider
    calls, so that secrets, processes, and workspace access stay outside React.
17. As a Steerboard user, I want each worker task to have explicit file scope, so
    that parallel agents do not trample each other's work.
18. As a Steerboard user, I want workers to receive acceptance criteria, so that
    delegated work has a measurable finish line.
19. As a Steerboard user, I want workers to receive forbidden paths, so that
    auth, secrets, billing, security, migrations, and deployment code remain
    protected unless the main orchestrator handles them.
20. As a Steerboard user, I want workers to receive allowed command lists, so
    that validation is bounded and auditable.
21. As a Steerboard user, I want workers to return verification plans, so that I
    can judge whether their output is testable.
22. As a Steerboard user, I want workers to return rollback notes, so that I know
    how to undo delegated changes safely.
23. As a Steerboard user, I want readonly workers to run first, so that search,
    explanation, review, and planning evidence can be gathered with low risk.
24. As a Steerboard user, I want bounded patch workers to run only after scope is
    explicit, so that patch work stays reviewable.
25. As a Steerboard user, I want overlapping worker patches to be blocked, so
    that conflicting changes return to the main orchestrator.
26. As a Steerboard user, I want changed-file declarations to match actual
    patches, so that worker output cannot hide unrelated edits.
27. As a Steerboard user, I want empty patches to be rejected, so that failed
    workers do not look successful.
28. As a Steerboard user, I want forbidden-path touches to be rejected, so that
    protected domains stay protected.
29. As a Steerboard user, I want worker failures to produce a clear handoff back
    to the orchestrator, so that I can continue without losing context.
30. As a Steerboard user, I want the orchestrator to decide whether to apply,
    revise, or reject worker output, so that final judgment remains centralized.
31. As a Steerboard user, I want validation sessions to be separate from
    implementation sessions when risk requires it, so that review is not biased
    by the worker that made the change.
32. As a Steerboard user, I want an OrchestratorRun to track the whole work
    graph, so that I can see planned, queued, running, blocked, failed,
    validated, integrating, and complete work.
33. As a Steerboard user, I want each OrchestratorRun node to show owner,
    dependencies, packet, status, and evidence, so that I can understand why
    something is running or blocked.
34. As a Steerboard user, I want blocked actions to be called out, so that risky
    work stays visible instead of disappearing.
35. As a Steerboard user, I want Codex-only actions to stay with the main
    orchestrator, so that architecture, security, payment, permissions, billing,
    migrations, deployment, and final review stay high-trust.
36. As a Steerboard user, I want the Arena to show worker participation, so that
    I know which subagents actually contributed.
37. As a Steerboard user, I want worker results to include risk notes, so that
    the main orchestrator can review the right concerns.
38. As a Steerboard user, I want the app to preserve commands to run from worker
    handoffs, so that validation steps do not get lost.
39. As a Steerboard user, I want approvals to be first-class UI state, so that
    command execution, file changes, tool calls, and user-input requests do not
    block invisibly.
40. As a Steerboard user, I want approval requests to show source panel, thread,
    turn, requested action, risk, and decision buttons, so that I can make safe
    decisions quickly.
41. As a Steerboard user, I want approval requests to have clear states, so that
    I know whether a request is pending, approved, rejected, expired, failed, or
    consumed.
42. As a Steerboard user, I want the active Codex turn to show what it is waiting
    on during approval, so that the app never looks frozen.
43. As a Steerboard user, I want per-agent permission modes, so that readonly,
    workspace-write, ask-first, and accept-edits postures are visible and
    intentional.
44. As a Steerboard user, I want full-access or allow-all behavior excluded from
    v1, so that the product does not outrun its audit and rollback protections.
45. As a Steerboard user, I want app-server processes isolated enough that one
    worker cannot corrupt another worker's state, so that parallelism is safe.
46. As a Steerboard user, I want session process cleanup to be reliable, so that
    Steerboard does not leak RAM or background processes.
47. As a Steerboard user, I want the app to show worker load and success metadata
    when available, so that routing can become smarter over time.
48. As a Steerboard user, I want project-scoped agent profiles, so that a project
    can define its own preferred workers without changing global defaults.
49. As a Steerboard user, I want global agent profiles, so that common worker
    setups are available across projects.
50. As a Steerboard user, I want imported or ACP-compatible agents to appear in
    the same profile model later, so that non-Codex workers can join the Arena
    without a separate UI model.
51. As a Steerboard user, I want third-party orchestration references treated as
    references until licensed and reviewed, so that Steerboard remains safe and
    original.
52. As a Steerboard user, I want a handoff summary after delegated work, so that
    I can see delegated work done, blocked actions, commands to run, and next
    orchestrator actions.
53. As a Steerboard user, I want the main orchestrator to commit and report only
    after validation and review, so that worker output does not skip the final
    integration lane.
54. As a Steerboard user, I want the UI to distinguish orchestrator, worker,
    validator, and integrator roles, so that I can scan the Arena under pressure.
55. As a Steerboard user, I want orchestration state to survive reloads, so that
    active runs do not disappear when the app restarts.

## Implementation Decisions

- Build a provider-neutral runtime adapter layer and make Codex the first live
  adapter.
- Keep the Codex integration centered on local app-server rather than direct
  OpenAI API-key storage inside Steerboard.
- Use the Codex app-server for rich client behavior such as account posture,
  model discovery, thread lifecycle, turn lifecycle, streamed events, approvals,
  and provider surface discovery.
- Keep the Codex SDK as a future option for automation or CI-style jobs, not the
  primary Arena session transport.
- Extract Codex app-server lifecycle and protocol handling into a dedicated
  adapter module while preserving existing panel behavior.
- Keep React responsible for rendering session state and user decisions, not for
  owning provider process lifecycle, provider auth, or privileged filesystem
  behavior.
- Normalize provider events into Steerboard records for sessions, turns, items,
  tools, approvals, audit entries, and orchestration nodes.
- Define a runtime adapter contract with provider, transport, auth state, model
  state, session controls, permission modes, tool surfaces, MCP state, and event
  kinds.
- Define an agent session as a provider-backed identity attached to an Arena
  panel, with provider session id, thread id, role, workspace root, sandbox,
  permission mode, model setting, reasoning setting, and status.
- Treat hide, close, detach, archive, and kill-process as separate lifecycle
  operations.
- Treat every configurable subagent as an agent profile.
- Include role, provider, model, reasoning, sandbox, permission mode,
  capabilities, cost weight, context window, load, success rate, enabled state,
  allowed commands, MCP/tool policy, and source in each agent profile.
- Seed default profiles for main orchestrator, Spark worker, validator, and
  optional integrator.
- Resolve default model labels only from provider model discovery. Do not invent
  unavailable model ids.
- Store only references and sanitized provider status for credentials. Do not
  store raw auth files, API keys, bearer tokens, cookies, private transcripts, or
  full sensitive config paths.
- Add an OrchestratorRun model that owns the run goal, source panel, selected
  mode, orchestrator profile, worker profiles, work graph, blocked actions,
  Codex-only actions, worker results, validator results, aggregate patch state,
  conflict state, handoff summary, approvals, verification, rollback, and final
  integration state.
- Use explicit lifecycle states for orchestration work: planned, queued,
  running, needs_orchestrator, blocked, failed, validated, integrating, and
  complete.
- Use bounded work packets for worker dispatch instead of loose prompts.
- Include goal, task type, allowed files, forbidden paths, context files,
  acceptance criteria, allowed commands, max iterations, max diff lines,
  rollback notes requirement, verification plan requirement, and expected output
  shape in each work packet.
- Route readonly worker tasks first for search, explanation, documentation,
  performance hints, test planning, and review.
- Route bounded patch tasks only when scope, allowed files, allowed commands,
  verification, and rollback requirements are explicit.
- Keep architecture, ambiguous product decisions, auth, security, payment,
  permissions, billing, secrets, migrations, deployment, destructive actions,
  final review, failed worker handoffs, and overlapping patch aggregation with
  the main orchestrator.
- Reject worker output when patches are empty, changed files are mismatched,
  duplicate writes appear in the same batch, forbidden paths are touched,
  verification plans are missing, rollback notes are missing, or patches overlap
  without explicit orchestrator resolution.
- Add a first-class approval request queue for provider server requests and
  Steerboard runtime actions.
- Use explicit approval states: pending, approved, rejected, expired, failed,
  and consumed.
- Keep high-risk permission modes gated until approvals, audit, and rollback are
  productized.
- Exclude full-access or allow-all behavior from v1.
- Treat CodexSaver as an orchestration reference, not a bundled dependency,
  unless licensing, security policy, dependency behavior, and code reuse
  implications are reviewed later.
- Treat harnss as a reference for provider-runtime capabilities and session
  surface shape, not a UI clone.
- Add ACP-compatible agent support only after the Codex adapter and native
  orchestration contracts are stable.

## Implementation Phases

### Phase 0: Contract Baseline And Safety Decisions

Goal: turn the PRD into stable implementation contracts before runtime behavior
changes.

Scope:

- define runtime adapter, agent session, agent profile, work packet,
  OrchestratorRun, approval request, and normalized event contracts,
- define hide, close, detach, archive, and kill-process lifecycle semantics,
- define sanitized auth and model discovery payloads,
- decide v1 permission posture for read-only, workspace-write, ask-first, and
  accept-edits behavior,
- keep full-access and allow-all out of v1.

Exit criteria:

- contracts have unit tests,
- no secret-bearing field is returned to React,
- browser preview remains non-live,
- existing panel chat behavior is unchanged.

### Phase 1: Codex Adapter Extraction

Goal: move Codex app-server lifecycle out of the monolithic Tauri command module
without changing visible behavior.

Scope:

- extract process start, initialize, request/response ids, thread start, turn
  start, retry, interrupt, steer, stream reading, cleanup, and error handling,
- preserve current Tauri command names where practical,
- preserve per-panel session isolation,
- keep one app-server process per live panel/session until shared-process
  routing is proven safe.

Exit criteria:

- live readiness, session start, simple send, streaming, retry, interrupt,
  steer, stale-session recovery, and close behavior pass existing tests,
- desktop build still succeeds,
- no provider-specific raw payloads leak into Arena state.

### Phase 2: Provider Discovery And Profile Defaults

Goal: make account, model, command, skill, plugin, MCP, and permission surfaces
come from provider data rather than static labels.

Scope:

- add safe `account/read` handling,
- add provider `model/list` handling,
- map `Main Orchestrator` to GPT-5.5 only when available,
- map `Spark Worker` to GPT-5.3 Spark only when available,
- add validator and integrator default profiles,
- support global and project-scoped profile storage with safe repair.

Exit criteria:

- unavailable models show setup/fallback state,
- profile defaults are editable and disableable,
- profile state survives reloads,
- secret and raw-path exclusion tests pass.

### Phase 3: OrchestratorRun Preview

Goal: create native Steerboard orchestration state before any worker execution.

Scope:

- create OrchestratorRun records from Arena chat or dispatch package context,
- generate work-packet previews with goal, task type, scope, acceptance,
  forbidden paths, allowed commands, verification expectations, and rollback
  requirements,
- classify actions as worker-safe, validator-safe, blocked, or
  main-orchestrator-only,
- show planned graph nodes in the Arena and environment panel.

Exit criteria:

- users can inspect the run graph before execution,
- blocked and Codex-only actions are visible,
- no worker model call or filesystem mutation occurs in preview,
- reload repair preserves visible run state.

### Phase 4: Readonly Worker Dispatch

Goal: ship the first safe multi-agent lane using readonly specialists.

Scope:

- dispatch search, explanation, documentation review, performance hints, test
  planning, and code review packets to worker profiles,
- track submitted, running, completed, failed, and timed-out worker lifecycle
  states,
- return findings, summaries, risk notes, and suggested next actions,
- produce a handoff summary for the main orchestrator.

Exit criteria:

- readonly workers cannot write files,
- failures return `needs_orchestrator`,
- worker participation and results are visible per Arena session,
- main orchestrator can continue from the handoff without losing context.

### Phase 5: Bounded Patch Worker Dispatch

Goal: allow workers to propose patches only inside strict work-packet
boundaries.

Scope:

- require allowed files, forbidden paths, acceptance criteria, verification
  plan, rollback notes, and max diff limits before patch dispatch,
- reject empty patches, changed-file mismatches, duplicate file writes,
  forbidden-path touches, missing verification plans, missing rollback notes,
  and overlapping patches,
- apply worker patches only to a temporary workspace or keep patch-only output
  until the sandbox runner is implemented,
- route failures, overlaps, and weak evidence back to the main orchestrator.

Exit criteria:

- no worker patch is applied directly to the real workspace without review,
- patch policy tests cover every rejection path,
- validators and the main orchestrator can inspect worker output and decide
  whether to apply, revise, or reject it.

### Phase 6: Approval Queue, Audit, And Handoff

Goal: make provider and Steerboard permission requests visible, auditable, and
recoverable.

Scope:

- add approval queue states: pending, approved, rejected, expired, failed, and
  consumed,
- show source panel, thread, turn, requested action, risk, and decision buttons,
- keep active turns visibly waiting while approval is pending,
- persist local approval and audit records,
- attach approval, verification, rollback, and final-integration status to
  OrchestratorRun handoff.

Exit criteria:

- no action requiring approval fails silently,
- approval decisions are visible after reload,
- rejected or expired approvals return a clear handoff to the main orchestrator,
- audit records do not store secrets or raw private transcripts.

### Phase 7: Configurable Subagents And ACP Readiness

Goal: graduate from default Codex-only profiles to user-configurable subagents
and prepare ACP support.

Scope:

- expose profile create, edit, disable, reorder, and project/global precedence,
- support imported or project-scoped agent profiles without secrets,
- add capability, cost, context, load, success, sandbox, and tool-policy fields,
- add ACP registry design after Codex adapter and orchestration contracts are
  stable.

Exit criteria:

- users can configure subagents without code changes,
- invalid profiles repair to safe disabled states,
- ACP support has a documented adapter boundary before any runtime integration
  is attempted.

## Project Impact Report

This PRD helps Steerboard by turning the Arena from a single live chat surface
into a controlled multi-agent workspace. The main orchestrator remains
accountable for planning, risk, and final review, while lower-cost or specialized
workers can handle bounded throughput.

Expected benefits:

- smoother agent experience because each chat/thread becomes a real session with
  visible lifecycle state,
- lower cost and better throughput because safe tasks can move from the main
  orchestrator to worker profiles,
- stronger trust because auth, models, commands, MCP, approvals, and worker
  capabilities are discovered and shown instead of implied,
- safer delegation because every worker packet has scope, forbidden paths,
  acceptance criteria, verification, and rollback expectations,
- better debugging because worker failures, blocked actions, approval waits, and
  handoffs become visible product state,
- cleaner architecture because Codex app-server behavior moves behind an adapter
  boundary instead of staying spread across UI and Tauri command code,
- better extensibility because Codex, ACP agents, and future providers can share
  one runtime/session/orchestration model,
- stronger product differentiation because Steerboard becomes an orchestration
  Arena rather than a clone of a chat client or external reference app.

Primary project risks reduced:

- fake or stale model labels,
- hidden auth/billing assumptions,
- cross-talk between panels,
- worker patch conflicts,
- silent approval waits,
- direct worker edits to sensitive areas,
- brittle provider-specific UI state,
- unclear handoff between planning, implementation, validation, and integration.

Delivery value by phase:

| Phase | Project Value |
| --- | --- |
| Phase 0 | Prevents abstraction drift by defining the contracts first. |
| Phase 1 | Makes Codex integration maintainable without changing behavior. |
| Phase 2 | Makes connection, model, and profile state honest and configurable. |
| Phase 3 | Lets users inspect orchestration before spending model calls or mutating files. |
| Phase 4 | Ships safe parallelism through readonly workers. |
| Phase 5 | Adds controlled worker patch throughput with verification and fallback. |
| Phase 6 | Turns approvals and audit from blockers into visible workflow state. |
| Phase 7 | Opens the path to user-configurable subagents and ACP providers. |

## Testing Decisions

- Test behavior through the highest practical seams: runtime adapter contract,
  panel session lifecycle, OrchestratorRun reducer/state helpers, work-packet
  routing policy, approval queue, and Arena-visible orchestration state.
- Prefer tests that assert external behavior and state transitions over tests
  that assert internal implementation details.
- Preserve existing live panel behavior while extracting the Codex adapter:
  readiness, session start, turn send, streaming, retry, interrupt, steer,
  recovery, stale-session handling, and browser preview safety must continue to
  work.
- Add contract tests for sanitized auth and model discovery outputs, including
  missing auth, ChatGPT auth, API-key auth, unclassified auth, unavailable
  models, and no secret/path leakage.
- Add adapter tests that normalize app-server events into Steerboard event
  records without leaking provider-specific payloads into UI state.
- Add lifecycle tests for hide, close, detach, archive, and kill-process
  semantics.
- Add agent profile tests for default repair, provider model resolution,
  unavailable model setup states, project/global precedence, disabled profiles,
  and secret exclusion.
- Add work-packet tests for low-risk delegation, high-risk main-orchestrator
  retention, missing scope, forbidden paths, allowed commands, weak
  verification, and rollback-note requirements.
- Add patch policy tests for empty patches, changed-file mismatches, duplicate
  file writes, forbidden-path touches, missing verification plans, missing
  rollback notes, and overlapping patches.
- Add OrchestratorRun tests for graph planning, dependency readiness, worker
  status transitions, blocked action tracking, handoff generation, validator
  results, integration state, and reload repair.
- Add approval queue tests for pending, approved, rejected, expired, failed, and
  consumed states.
- Add UI tests that verify the Arena distinguishes orchestrator, worker,
  validator, and integrator roles; shows session status; exposes blocked actions;
  and keeps controls visible at supported desktop sizes.
- Add browser-preview tests to verify that provider actions remain non-live
  outside Tauri desktop mode.
- Add Tauri functional QA for live Codex readiness, session start, model
  discovery, simple send, interrupt, retry, approval-blocked turn visibility,
  and per-panel session isolation.
- Run full validation before implementation commits that touch runtime
  behavior, Tauri command registration, provider transport, approval handling,
  or Arena session state.

## Out Of Scope

- Cloning harnss UI or adopting harnss as a direct dependency.
- Bundling CodexSaver code before license, security, and dependency review.
- Adding direct OpenAI API-key storage to Steerboard for Codex.
- Shipping full-access or allow-all permission mode in v1.
- Running every possible external agent runtime.
- Implementing ACP before the Codex adapter and native orchestration contracts
  are stable.
- Letting workers directly apply unreviewed patches to the real workspace.
- Supporting destructive migrations, production deployments, payment changes,
  auth changes, security-sensitive changes, or secrets handling through worker
  delegation.
- Importing private session history from another agent application as part of
  this PRD.
- Building a plugin marketplace.
- Publishing remote changes or opening release workflows as part of the
  orchestration feature.

## Further Notes

- The implementation phases above are the delivery source of truth for this PRD.
- Open decision: default new live sessions to workspace-write agent mode or
  read-only with an explicit permission upgrade.
- Open decision: store initial main orchestrator and Spark worker profiles as
  global defaults, project-scoped defaults, or both.
- Open decision: use temporary workspace patch application in v1 or require
  patch-only worker output until a dedicated sandbox runner exists.
- Triage label: ready-for-agent.
