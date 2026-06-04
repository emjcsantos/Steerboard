# Multiagent And Worktree Strategy

AtlasUI development should use parallel agents and worktrees when the work can be split into small, non-overlapping file ownership lanes.

## When To Use Parallel Agents

Use parallel agents for:

- independent docs or research tasks,
- isolated UI components,
- isolated schema or fixture files,
- tests for a completed implementation slice,
- validation reviews that can run while implementation continues.

Keep work local for:

- architecture decisions,
- cross-cutting integration,
- dependency selection,
- security boundary changes,
- final validation,
- commits, pushes, and release reporting.

## Worktree Rule

Use a separate worktree for material parallel implementation when two agents need to edit files at the same time. Each worktree should have:

- one branch,
- one task brief,
- one owned file set,
- one validation command,
- one handoff summary.

The main orchestrator integrates accepted changes into the final branch after validation.

## Task Split Rule

A delegated task should be small enough to complete without redesigning the product:

- one component,
- one schema,
- one fixture set,
- one test file,
- one adapter method cluster,
- or one documentation page.

Avoid assigning a worker task that mixes UI, persistence, adapter execution, security policy, and tests.

## Validation Rule

Workers must validate their own slice when possible. A separate validator agent can be used when the slice is risky or when validation does not touch the same files.

Each handoff must include:

- task id,
- branch or worktree,
- owned files,
- files changed,
- validation run,
- validation result,
- risks,
- next recommended action.

The main orchestrator still owns final validation, integration, commit, push, and report.
