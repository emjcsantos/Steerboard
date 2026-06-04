# Architecture Plan

## Recommended Starting Point

Start with a clean AtlasUI scaffold and use Harnss as a reference implementation, not as a direct base.

Reason: Harnss has strong feature fit, but its current audited dependency and security posture requires hardening before direct adoption.

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
- Readiness checks before dispatch to Codex.
- Deploy-to-Codex action that creates an orchestrator run from selected pipeline items.
- Trace links from project pipeline item to Codex run, worker tasks, validation reports, and final integration result.

### Adapter Layer

- Codex app-server adapter.
- Worker adapter for configured agent runtimes.
- Future adapters for ACP-compatible workers.
- Adapter APIs should normalize events into the session core instead of leaking provider-specific event shapes into the UI.
- Adapter contracts must be easy to add, test, and disable.
- Each runtime adapter should declare capabilities, required permissions, configuration fields, supported commands, event mapping, and mock fixtures.
- The cockpit must consume normalized session, task, validation, and tool-call events instead of provider-specific payloads.

### Persistence

- Project registry.
- Session metadata.
- Handoff records.
- Validation reports.
- Pipeline items and dispatch records.
- Audit trail.
- User preferences.

Do not persist credentials, raw private browser state, or unredacted secrets.

### Development Execution

- Use multiagent and multiworktree execution for independent file ownership lanes.
- The main orchestrator keeps architecture, integration, final validation, commit, push, and report responsibilities.
- Worker agents should receive small tasks with explicit file ownership and validation commands.

## Harnss Patterns Worth Reusing

- Electron main/preload/renderer split.
- Codex JSON-RPC app-server bridge.
- ACP-style agent abstraction.
- Session list and split-pane concepts.
- Tool-call visualization ideas.
- Git, terminal, browser, MCP, and file-panel surfaces.
- Encrypted OAuth store pattern.

## Harnss Patterns To Harden Before Reuse

- Analytics default-on behavior.
- Broad renderer-exposed file operations.
- Arbitrary external URL opening.
- Webview capability boundary.
- Managed CLI auto-download behavior.
- Dependency vulnerabilities from the current lockfile.
- Worktree setup command execution.
