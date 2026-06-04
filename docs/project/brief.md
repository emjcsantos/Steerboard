# Project Brief

## Product

AtlasUI is a desktop IDE for monitoring and steering multiple AI coding sessions at once.

## Problem

Single-chat IDE surfaces make it hard to monitor concurrent work. Users often need several active coding-agent threads: one for planning, one or more for implementation, one for validation, and one for review. A single visible chat forces constant context switching.

## Target Experience

AtlasUI should feel like a practical command cockpit:

- left project/thread navigation,
- adaptive multi-session cockpit in the main area,
- per-session status, transcript, tool activity, diffs, tests, and approvals,
- right-side environment and progress panel,
- safe task dispatch from orchestrator to workers,
- clear evidence of implementer and validator loops.

## Primary Workflow

1. The user opens a project.
2. Main Codex prepares the plan and splits it into small tasks.
3. Spark workers receive non-overlapping tasks.
4. Each worker implements and validates up to three attempts.
5. Main Codex validates worker output, integrates accepted changes, fixes gaps, commits, pushes, and reports.

## Non-Goals For MVP

- Full marketplace or plugin ecosystem.
- Running every possible external agent.
- Importing private session history from another IDE as the main workflow.
- Shipping an unaudited fork of any third-party app.

