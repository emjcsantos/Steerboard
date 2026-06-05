# Project Management Lane

## Purpose

The project management lane is an optional Steerboard tab where users manage development pipelines before deploying selected work to configured agent runtimes.

The primary planning medium remains the cockpit chat, where the user gives goals, refines scope, reviews plans, and steers the orchestrator. The project management lane adds better visibility, monitoring, tracking, readiness review, and change management around that cockpit workflow.

## Core Jobs

- Create and manage projects.
- Organize backlog, milestones, epics, tasks, blockers, and release gates.
- Attach task briefs, acceptance criteria, validation commands, and risk notes.
- Track pipeline state: idea, planned, ready, dispatched, running, validating, blocked, accepted, shipped.
- Select one or more ready items and deploy them to a configured runtime.
- Show which pipeline item created each orchestrator run and which worker tasks were spawned.
- Preserve the cockpit chat as the source of planning intent when the user does not need structured pipeline management.

## User Flow

1. User plans and steers work through the cockpit chat.
2. User optionally opens the project management tab when they need structured tracking or change-management visibility.
3. User creates or selects a generic project workspace.
4. User adds pipeline items with scope, priority, acceptance criteria, and validation.
5. Steerboard checks readiness and highlights missing fields.
6. User clicks deploy to runtime.
7. The main orchestrator turns the selected item into a run plan, small worker tasks, validation tasks, and integration steps.
8. The cockpit opens the resulting run while the project management lane keeps the pipeline status synchronized.

## MVP Shape

- Generic sample projects only.
- Pipeline board or table.
- Item detail panel.
- Selected item dispatch preview with pipeline, registry, and runtime gates.
- Local selected-item dispatch request and cancellation history.
- Local cockpit run projection from a dispatch-ready selected item.
- Editable local draft list and draft detail editor.
- Readiness checklist.
- Deploy-to-runtime button disabled until required fields are present.
- Registry and runtime gate chips showing why dispatch is enabled or blocked.
- Generated handoff preview.
- Generated dispatch package preview before real runtime execution.
- Link from deployed item to cockpit run.
- Linked local cockpit run list for the selected item, with an open action that returns users to the matching cockpit run.
- Linked cockpit run status summary on pipeline rows and selected item detail so users can monitor progress without leaving the lane.
- Local selected-item detail so users can review dispatch blockers without leaving the pipeline.
- Local dispatch request records so users can queue intent for review before runtime launch exists.
- Local cockpit run projection so users can inspect the pipeline item as orchestrator sessions before runtime launch exists.
- Local mock orchestrator run projection so users can inspect the planned run in cockpit panels before real runtime integration.
- Local run history list and selected-run detail so users can compare staged runs without losing cockpit context.
- Local run lifecycle controls for previewing queued, running, accepted, blocked, and failed cockpit states before real runtime integration.
- Local event timeline showing how the projected run, tasks, sessions, and validation gates relate.
- Runtime adapter contract inspector showing whether the target project can support sessions, tasks, validation, and tool-call events.
- Runtime ingestion preview showing whether selected-run events are accepted, require review, or are blocked by the target adapter contract.
- Local stream preview controls for watching projected adapter events emit over time before real runtime integration.
- Adapter session preview showing the selected runtime's transport, health, heartbeat, and permission readiness.
- Event source preview showing the queued normalized events that will feed the stream monitor.
- Source connection preview showing whether the queued events can attach to the selected runtime adapter.
- Adapter bridge preview showing whether a local event source has been attached to the selected runtime stream.
- Provider capability readiness showing whether the selected runtime supports live chat, slash commands, plugins, automations, MCP, personalization, approvals, and audit state before deployment.
- Deploy-mode selector for focused run, orchestrator-with-workers, or independent project monitor.

## Required Fields For Dispatch

- title,
- objective,
- target project workspace,
- scope,
- files or areas likely involved,
- acceptance criteria,
- validation command or validation plan,
- risk level,
- rollback note.
- project registry readiness,
- runtime adapter readiness and required permissions.
- live provider capability readiness for commands, plugins, automations, MCP, and personalization.

## Privacy Rules

- Demo data must use generic placeholders such as `Website Refresh`, `Billing Workflow`, `Developer Tooling`, or `Mobile App Prototype`.
- Do not include private project names, owner names, customer names, local folders, screenshots from private navigation, or raw chat logs.
- Public screenshots should use sanitized fixture data only.

## Runtime Dispatch Contract

Deploying to a configured runtime creates:

- a staged dispatch package,
- a mock orchestrator run projection,
- a persisted local run-history entry,
- a traceable link from the selected pipeline item back to matching local run-history entries,
- a compact linked-run status summary for the selected pipeline item,
- local lifecycle state updates for the projected run,
- selected-run event timeline records,
- adapter contract readiness records,
- runtime ingestion preview records,
- local stream preview state,
- adapter session preview state,
- event source preview state,
- source connection readiness state,
- adapter bridge preview state,
- provider capability readiness state,
- a future real orchestrator run,
- selected cockpit operating mode,
- a task split proposal,
- worker task briefs,
- validator task briefs,
- expected files or ownership boundaries,
- final integration checklist.

The main orchestrator remains responsible for architecture, final validation, commit, push, and reporting.
