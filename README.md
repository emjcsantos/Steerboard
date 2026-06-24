# Steerboard

Steerboard is a local-first desktop Arena for planning, coordinating, and monitoring agent-assisted project execution.

The product goal is a focused workspace where a human operator can plan project work through the Arena chat, connect live agent runtimes, use commands and integrations, dispatch small validated tasks, compare progress across sessions, and steer several project lanes at once. The project management lane is optional support for visibility, tracking, and change management; it does not replace the Arena chat as the main planning surface.

The first-class workflow is:

1. The main orchestrator plans the work.
2. The main orchestrator splits the work into small, non-overlapping tasks.
3. Configured worker agents implement and validate those tasks.
4. The main orchestrator integrates, validates, revises, commits, pushes, and reports.

## Current Status

This repository currently contains the desktop app scaffold, Arena UI, public product brief, requirements, architecture notes, local testing guidance, installation strategy, and contribution guidance. The active development lane is making the Arena controls, slash commands, provider metadata refresh, desktop smoke-proof evidence, Phase 3 proof export, owner handoff records, Phase 4 provider boundaries, Phase 11 release readiness, owner release traceability, blocker-priority review, and packaging holds fully testable in local desktop mode without automatic release execution.

See [Current State And Pipeline](docs/project/current-state-and-pipeline.md) for the latest public summary of completed work, active pipeline items, and future tasks. Internal planning, progress logs, and agent execution rules should stay outside the public repository.

## Local Preview

```text
npm install
npm run dev
```

The preview runs on `http://127.0.0.1:5173/` by default.

## Desktop Preview

```text
npm run desktop:dev
```

The desktop shell uses Tauri and loads the same local Vite UI during development.

## Document Map

- [Project Brief](docs/project/brief.md)
- [Current State And Pipeline](docs/project/current-state-and-pipeline.md)
- [Requirements](docs/product/requirements.md)
- [UI Direction](docs/product/ui-direction.md)
- [Arena Operating Modes](docs/product/arena-operating-modes.md)
- [Adaptive Arena Layout](docs/product/adaptive-arena-layout.md)
- [Live Platform Capabilities](docs/product/live-platform-capabilities.md)
- [Migration Center](docs/product/migration-center.md)
- [Project Management Lane](docs/product/project-management-lane.md)
- [Architecture Overview](docs/architecture/architecture-plan.md)
- [Platform Strategy](docs/architecture/platform-strategy.md)
- [Codex Transport Spike](docs/architecture/codex-transport-spike.md)
- [Harnss Agent Parity Plan](docs/architecture/harnss-agent-parity-plan.md)
- [Security and Privacy Model](docs/architecture/security-privacy-model.md)
- [Public Roadmap](docs/roadmap.md)
- [Installation Strategy](docs/operations/installation-strategy.md)
- [Local Testing Checklist](docs/operations/local-testing-checklist.md)
- [Originality And Attribution Policy](docs/decisions/originality-attribution-policy.md)
- [Contributing](CONTRIBUTING.md)
- [Third-Party Notices](THIRD_PARTY_NOTICES.md)

## Product Principle

Steerboard should remain a distinct product with its own Arena experience, provider-neutral runtime adapter boundary, local-first security model, and public-safe fixture data.
