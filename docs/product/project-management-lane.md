# Project Management Lane

## Purpose

The project management lane is a future Steerboard tab where users manage development pipelines before deploying selected work to configured agent runtimes.

It should make the product useful before a coding agent starts: the user can organize priorities, define scope, attach acceptance criteria, inspect readiness, and then dispatch a clean task package into the orchestration workflow.

## Core Jobs

- Create and manage projects.
- Organize backlog, milestones, epics, tasks, blockers, and release gates.
- Attach task briefs, acceptance criteria, validation commands, and risk notes.
- Track pipeline state: idea, planned, ready, dispatched, running, validating, blocked, accepted, shipped.
- Select one or more ready items and deploy them to a configured runtime.
- Show which pipeline item created each orchestrator run and which worker tasks were spawned.

## User Flow

1. User opens the project management tab.
2. User creates or selects a generic project workspace.
3. User adds pipeline items with scope, priority, acceptance criteria, and validation.
4. Steerboard checks readiness and highlights missing fields.
5. User clicks deploy to runtime.
6. The main orchestrator turns the selected item into a run plan, small worker tasks, validation tasks, and integration steps.
7. The cockpit opens the resulting run while the project management lane keeps the pipeline status synchronized.

## MVP Shape

- Generic sample projects only.
- Pipeline board or table.
- Item detail panel.
- Editable local draft list and draft detail editor.
- Readiness checklist.
- Deploy-to-runtime button disabled until required fields are present.
- Registry and runtime gate chips showing why dispatch is enabled or blocked.
- Generated handoff preview.
- Generated dispatch package preview before real runtime execution.
- Link from deployed item to cockpit run.
- Local mock orchestrator run projection so users can inspect the planned run in cockpit panels before real runtime integration.
- Local run history list and selected-run detail so users can compare staged runs without losing cockpit context.
- Local run lifecycle controls for previewing queued, running, accepted, blocked, and failed cockpit states before real runtime integration.
- Local event timeline showing how the projected run, tasks, sessions, and validation gates relate.
- Runtime adapter contract inspector showing whether the target project can support sessions, tasks, validation, and tool-call events.
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

## Privacy Rules

- Demo data must use generic placeholders such as `Website Refresh`, `Billing Workflow`, `Developer Tooling`, or `Mobile App Prototype`.
- Do not include private project names, owner names, customer names, local folders, screenshots from private navigation, or raw chat logs.
- Public screenshots should use sanitized fixture data only.

## Runtime Dispatch Contract

Deploying to a configured runtime creates:

- a staged dispatch package,
- a mock orchestrator run projection,
- a persisted local run-history entry,
- local lifecycle state updates for the projected run,
- selected-run event timeline records,
- adapter contract readiness records,
- a future real orchestrator run,
- selected cockpit operating mode,
- a task split proposal,
- worker task briefs,
- validator task briefs,
- expected files or ownership boundaries,
- final integration checklist.

The main orchestrator remains responsible for architecture, final validation, commit, push, and reporting.
