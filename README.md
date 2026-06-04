# AtlasUI

AtlasUI is a public desktop IDE project for coordinating multiple AI coding sessions in one cockpit.

The product goal is a Codex Desktop-like workspace where a human operator can run, compare, validate, and steer several coding-agent threads at once. The first-class workflow is:

1. The main orchestrator plans the work.
2. The main orchestrator splits the work into small, non-overlapping tasks.
3. Configured worker agents implement and validate those tasks.
4. The main orchestrator integrates, validates, revises, commits, pushes, and reports.

## Current Status

This repository currently contains the public development plan, Harnss reference audit, architecture notes, and execution rules. No Harnss code has been copied into this repository yet.

Harnss is MIT-licensed and highly relevant, but the audited commit is approved as a reference only until dependency and security hardening gates pass. AtlasUI is intended to be an original product with its own architecture, interaction model, visual identity, and implementation.

## Document Map

- [Project Brief](docs/project/brief.md)
- [Requirements](docs/product/requirements.md)
- [UI Direction](docs/product/ui-direction.md)
- [Cockpit Operating Modes](docs/product/cockpit-operating-modes.md)
- [Project Management Lane](docs/product/project-management-lane.md)
- [Architecture Plan](docs/architecture/architecture-plan.md)
- [Platform Strategy](docs/architecture/platform-strategy.md)
- [Security and Privacy Model](docs/architecture/security-privacy-model.md)
- [Development Plan](docs/development/development-plan.md)
- [Worker Task Rules](docs/development/worker-task-rules.md)
- [Harnss Static Audit](docs/audits/harnss-static-audit-2026-06-04.md)
- [Harnss Reuse Decision](docs/decisions/harnss-reuse-decision.md)
- [Originality And Attribution Policy](docs/decisions/originality-attribution-policy.md)
- [Public Documentation Guidelines](docs/operations/public-documentation-guidelines.md)
- [Public Release Checklist](docs/operations/public-release-checklist.md)
- [Progress](docs/operations/progress.md)
- [Third-Party Notices](THIRD_PARTY_NOTICES.md)

## Development Principle

Do not start by blindly forking a large external IDE. Start with a small, testable AtlasUI scaffold, design a distinct cockpit experience, then selectively adapt proven patterns only after audit, attribution, and product-fit gates pass.
