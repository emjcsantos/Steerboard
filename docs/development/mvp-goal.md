# MVP Goal

This goal follows the Define Goal quality bar: concrete outcome, scoped work, measurable validation, and clear stop conditions.

## Phase 1 Objective

Build a clean AtlasUI scaffold from a fresh clone that launches locally as a desktop app, renders public-safe mock data for focus lane, orchestrator-with-workers, and independent project monitor modes up to `3x3`, and verifies with repeatable setup, lint, test, build, visual layout checks, and public-reference scans.

## In Scope

- Source-first install path from a clean clone.
- Desktop shell feasibility spike.
- Cockpit layout model from `1x1` through `3x3`.
- Mock session, worker, validation, and pipeline data.
- Public-safe project fixtures only.
- Basic permissions surface for project folder, Git, terminal/process, local runtime, and notifications.
- No real agent execution.
- No third-party source import.

## Out Of Scope

- Real Codex session ownership.
- Real worker spawning.
- Real Git commit or push from the app.
- Cloud control plane.
- Marketplace, plugins, or enterprise deployment.

## Required Evidence

- Clean clone setup command succeeds.
- Local app launch command succeeds.
- Local production build command succeeds.
- Lint and unit tests pass.
- Screenshot or DOM-based layout checks pass for `1x1`, `2x1`, `1x2`, and `3x3`.
- All three cockpit modes render from generic fixture data.
- Public-reference scan passes with no local paths, private project labels, raw transcripts, credentials, or owner-specific names.
- Harnss code import scan confirms no copied source.

## Stop And Ask Conditions

Stop and ask before continuing if:

- Tauri cannot satisfy the desktop shell spike without materially delaying terminal, editor, or process integration.
- A dependency requires broad postinstall scripts, native permissions, or unexplained network behavior.
- The scaffold needs real credentials, real private project data, or real agent execution to demonstrate the MVP.
- Multiagent tasks would require overlapping file ownership.
