# AtlasUI

AtlasUI is a public desktop IDE project for coordinating multiple AI coding sessions in one cockpit.

The product goal is a Codex Desktop-like workspace where a human operator can run, compare, validate, and steer several coding-agent threads at once. The first-class workflow is:

1. Main Codex plans the work.
2. Main Codex splits the work into small, non-overlapping tasks.
3. Codex 5.3 Spark workers implement and validate those tasks.
4. Main Codex integrates, validates, revises, commits, pushes, and reports.

## Current Status

This repository currently contains the public development plan, Harnss reference audit, architecture notes, and execution rules. No Harnss code has been copied into this repository yet.

Harnss is MIT-licensed and highly relevant, but the audited commit is approved as a reference only until dependency and security hardening gates pass.

## Document Map

- [Project Brief](docs/project/brief.md)
- [Requirements](docs/product/requirements.md)
- [Architecture Plan](docs/architecture/architecture-plan.md)
- [Security and Privacy Model](docs/architecture/security-privacy-model.md)
- [Development Plan](docs/development/development-plan.md)
- [Worker Task Rules](docs/development/worker-task-rules.md)
- [Harnss Static Audit](docs/audits/harnss-static-audit-2026-06-04.md)
- [Harnss Reuse Decision](docs/decisions/harnss-reuse-decision.md)
- [Public Documentation Guidelines](docs/operations/public-documentation-guidelines.md)
- [Progress](docs/operations/progress.md)
- [Third-Party Notices](THIRD_PARTY_NOTICES.md)

## Development Principle

Do not start by blindly forking a large external IDE. Start with a small, testable AtlasUI scaffold, then selectively import or adapt proven patterns after audit gates pass.

