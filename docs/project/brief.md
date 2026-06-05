# Project Brief

## Product

Steerboard is a desktop cockpit for planning, monitoring, and steering multiple agent-assisted project sessions at once. The primary planning surface is the cockpit chat, backed by live provider integrations for sessions, commands, plugins, automations, MCP, personalization, approvals, and audit state. Optional project-management views support visibility, tracking, and change management.

## Problem

Single-lane agent surfaces make it hard to monitor concurrent work. Users often need several active sessions: one for planning, one or more for implementation, one for validation, and one for review. A single visible chat forces constant context switching.

## Target Experience

Steerboard should feel like a practical command cockpit:

- left project/thread navigation,
- cockpit chat as the main planning and instruction surface,
- live provider connection state and service setup,
- slash commands, plugin invocation, MCP status, automations, and personalization controls,
- migration center for importing settings, options, skills, plugins, MCP servers, commands, and personalization from supported agent platforms,
- adaptive multi-session cockpit in the main area,
- focused single-project lane, orchestrator-with-workers mode, and independent multi-project monitoring mode,
- per-session status, transcript, tool activity, diffs, tests, and approvals,
- right-side environment and progress panel,
- safe task dispatch from orchestrator to workers,
- clear evidence of implementer and validator loops.

## Primary Workflow

1. The user opens a project and plans through the cockpit chat.
2. The main orchestrator prepares the plan from the chat context and splits it into small tasks.
3. The user can ask Steerboard to migrate safe settings and integrations from a supported source platform into a Steerboard profile.
4. The user can use slash commands, plugins, MCP tools, automations, and personalization sources from the same cockpit surface when the connected runtime supports them.
5. Configured worker agents receive non-overlapping tasks.
6. Each worker implements and validates up to three attempts.
7. The main orchestrator validates worker output, integrates accepted changes, fixes gaps, commits, pushes, and reports.

## Non-Goals For MVP

- Building a proprietary plugin marketplace in the MVP. Live plugin status and invocation through configured provider adapters are in scope.
- Running every possible external agent.
- Importing private session history from another IDE as the main workflow.
- Requiring the project management lane as the primary planning surface.
- Shipping unaudited third-party application code.
