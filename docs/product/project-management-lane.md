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
- Readiness checklist.
- Deploy-to-runtime button disabled until required fields are present.
- Generated handoff preview.
- Link from deployed item to cockpit run.
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

## Privacy Rules

- Demo data must use generic placeholders such as `Website Refresh`, `Billing Workflow`, `Developer Tooling`, or `Mobile App Prototype`.
- Do not include private project names, owner names, customer names, local folders, screenshots from private navigation, or raw chat logs.
- Public screenshots should use sanitized fixture data only.

## Runtime Dispatch Contract

Deploying to a configured runtime creates:

- an orchestrator run,
- selected cockpit operating mode,
- a task split proposal,
- worker task briefs,
- validator task briefs,
- expected files or ownership boundaries,
- final integration checklist.

The main orchestrator remains responsible for architecture, final validation, commit, push, and reporting.
