# Project Brief

## Product

Steerboard is a desktop cockpit for monitoring and steering multiple agent-assisted project sessions at once.

## Problem

Single-lane agent surfaces make it hard to monitor concurrent work. Users often need several active sessions: one for planning, one or more for implementation, one for validation, and one for review. A single visible chat forces constant context switching.

## Target Experience

Steerboard should feel like a practical command cockpit:

- left project/thread navigation,
- adaptive multi-session cockpit in the main area,
- focused single-project lane, orchestrator-with-workers mode, and independent multi-project monitoring mode,
- per-session status, transcript, tool activity, diffs, tests, and approvals,
- right-side environment and progress panel,
- safe task dispatch from orchestrator to workers,
- clear evidence of implementer and validator loops.

## Primary Workflow

1. The user opens a project.
2. The main orchestrator prepares the plan and splits it into small tasks.
3. Configured worker agents receive non-overlapping tasks.
4. Each worker implements and validates up to three attempts.
5. The main orchestrator validates worker output, integrates accepted changes, fixes gaps, commits, pushes, and reports.

## Non-Goals For MVP

- Full marketplace or plugin ecosystem.
- Running every possible external agent.
- Importing private session history from another IDE as the main workflow.
- Shipping unaudited third-party application code.
