# Steerboard

Steerboard is a local-first desktop cockpit for planning, coordinating, and monitoring agent-assisted project execution.

The product goal is a focused workspace where a human operator can plan project work, dispatch small validated tasks to configured agent runtimes, compare progress across sessions, and steer several project lanes at once. The first-class workflow is:

1. The main orchestrator plans the work.
2. The main orchestrator splits the work into small, non-overlapping tasks.
3. Configured worker agents implement and validate those tasks.
4. The main orchestrator integrates, validates, revises, commits, pushes, and reports.

## Current Status

This repository currently contains the public product brief, requirements, architecture notes, installation strategy, and contribution guidance. Internal planning, progress logs, and agent execution rules should stay outside the public repository.

## Document Map

- [Project Brief](docs/project/brief.md)
- [Requirements](docs/product/requirements.md)
- [UI Direction](docs/product/ui-direction.md)
- [Cockpit Operating Modes](docs/product/cockpit-operating-modes.md)
- [Project Management Lane](docs/product/project-management-lane.md)
- [Architecture Overview](docs/architecture/architecture-plan.md)
- [Platform Strategy](docs/architecture/platform-strategy.md)
- [Security and Privacy Model](docs/architecture/security-privacy-model.md)
- [Public Roadmap](docs/roadmap.md)
- [Installation Strategy](docs/operations/installation-strategy.md)
- [Originality And Attribution Policy](docs/decisions/originality-attribution-policy.md)
- [Contributing](CONTRIBUTING.md)
- [Third-Party Notices](THIRD_PARTY_NOTICES.md)

## Product Principle

Steerboard should remain a distinct product with its own cockpit experience, provider-neutral runtime adapter boundary, local-first security model, and public-safe fixture data.
