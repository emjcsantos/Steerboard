# Development Plan

## Phase 0: Public Planning Baseline

Status: complete.

Deliverables:

- public project brief,
- requirements,
- architecture plan,
- worker task rules,
- Harnss audit,
- reuse decision,
- progress tracker.

Validation:

- markdown structure exists,
- public-safety text scan passes,
- no local paths or private owner-specific data in docs.

## Phase 1: Clean Scaffold

Goal: create a minimal desktop app shell without importing Harnss code.

Tiny worker tasks:

- `S001`: initialize package, TypeScript, lint, test runner, and formatter.
- `S002`: create desktop shell with isolated renderer.
- `S003`: create cockpit layout model with supported layouts and `3x3` max.
- `S004`: create session/task mock data model.
- `S005`: render project sidebar and cockpit cells from mock data.
- `S006`: render right-side environment/progress panel.
- `S007`: add persistence boundary for non-sensitive mock preferences.
- `S008`: add tests for layout limits and state transitions.
- `S009`: add cockpit mode presets for focus lane, orchestrator-with-workers, and independent project monitor.
- `S010`: run Tauri-first shell feasibility spike with Electron fallback criteria.
- `S011`: add source-first git install instructions and one-command local startup.
- `S012`: add local production build command and dependency audit instructions.

Exit criteria:

- app launches locally,
- `3x3` layout renders without overlap,
- all three cockpit modes render from public-safe mock data,
- source install path is documented and reproducible,
- tests pass,
- no third-party Harnss code imported.

## Phase 2: Orchestrator And Worker Model

Goal: implement the orchestration data model before real agent execution.

Tiny worker tasks:

- `O001`: define run, task, worker, attempt, validation, and handoff schemas.
- `O002`: create orchestrator task board UI.
- `O003`: create worker detail drawer.
- `O004`: create validator result display.
- `O005`: create deterministic handoff markdown generator.
- `O006`: create three-attempt loop state machine.
- `O007`: test implementer and validator transitions.

Exit criteria:

- orchestrator can split mock tasks,
- worker attempts and validation states are visible,
- handoff docs are public-safe and deterministic.

## Phase 3: Project Management Lane

Goal: let users manage a development pipeline in a tab and deploy ready items to Codex.

Tiny worker tasks:

- `P001`: define project, milestone, pipeline item, readiness, and dispatch schemas.
- `P002`: create generic pipeline fixture data.
- `P003`: render project management tab shell.
- `P004`: render pipeline board or table.
- `P005`: render item detail and readiness checklist.
- `P006`: create deploy-to-Codex handoff preview.
- `P007`: create dispatch record linking pipeline item to orchestrator run.
- `P008`: test readiness validation and dispatch payload generation.

Exit criteria:

- pipeline uses generic public-safe sample data,
- deploy button stays disabled until required fields are present,
- dispatch payload can seed an orchestrator run,
- tests pass.

## Phase 4: Codex App-Server Adapter

Goal: integrate real Codex sessions through supported app-server APIs.

Tiny worker tasks:

- `C001`: process lifecycle wrapper.
- `C002`: initialize handshake.
- `C003`: thread start/resume/list/read.
- `C004`: turn start/interrupt.
- `C005`: approval and user-input bridge.
- `C006`: event normalization into session core.
- `C007`: app-server adapter tests with mocked JSON-RPC.

Exit criteria:

- app owns sessions directly,
- no dependency on monitoring another IDE's UI,
- adapter tests pass.

## Phase 5: Worker Execution

Goal: connect orchestrator tasks to configured worker agents through a model-agnostic worker profile.

Tiny worker tasks:

- `W001`: worker profile configuration.
- `W002`: implementer dispatch.
- `W003`: validator dispatch.
- `W004`: three-attempt fail loop.
- `W005`: worker handoff parser.
- `W006`: integration queue.
- `W007`: end-to-end mocked worker test.

Exit criteria:

- implementer and validator roles are separate,
- the main orchestrator owns final integration,
- failures loop up to three times then return to the main orchestrator.

## Phase 6: Harnss-Pattern Selective Adoption

Goal: reuse only patterns that pass hardening.

Candidates:

- Codex JSON-RPC bridge ideas,
- split-pane session management ideas,
- tool-call rendering ideas,
- encrypted OAuth store pattern,
- git and terminal panel concepts.

Blocked until:

- dependency vulnerabilities are resolved,
- analytics defaults are changed,
- file/URL/command IPC boundaries are hardened,
- third-party notices are updated if code is copied.
