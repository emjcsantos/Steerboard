# Public Roadmap

This roadmap is intentionally high level. Detailed planning, task splitting, progress logs, and internal execution notes are kept outside the public repository.

## Current Pipeline

The current implementation target is Phase 3 desktop proof clearance. Phase 1, Phase 2, and Phase 6 are held locally behind the owner/remote publish hold until the Steerboard public remote is restored and the owner explicitly approves pushing. The Project Management board, Remaining Goals summary, Owner Testing surfaces, and release-readiness gates all use the current Phase 0-11 plan below.

The latest public handoff is maintained in [Current State And Pipeline](project/current-state-and-pipeline.md). The Project Management lane details are maintained in [Project Management Lane](product/project-management-lane.md).

## Milestone Tracking

| Target | Completion | Note |
|---|---|---|
| Phase 0: Baseline, Safety, and Docs Hygiene | Completed | Public boundary, repeatable validation, and roadmap/PM documentation hygiene are in place. |
| Phase 1: One Live Chat Panel | In progress | One-panel live send/stream proof is modeled with persisted proof rows and remains part of the Phase 1/2/6 owner publish hold. |
| Phase 2: Multi-Panel Session Isolation | In progress | Two-panel session/thread isolation, no-cross-talk proof, and restore-panel behavior are modeled and remain part of the Phase 1/2/6 owner publish hold. |
| Phase 3: Controls, Slash Commands, and Desktop Proof | In progress | Current active implementation target for slash/session controls, desktop smoke proof, blocker priority, traceability, and owner handoff gating. |
| Phase 4: Provider Integration Surfaces | Next | Provider catalog depth, surface depth, approval, audit, rollback, permission, traceability, and blocker priority remain metadata-only and execution-locked. |
| Phase 5: Migration Center | Next | Migration review, apply-intent lock, rollback evidence, sensitive exclusions, traceability, and blocker priority remain metadata-only until review gates pass. |
| Phase 6: Project and Program Planning Lane | In progress | The Project Management board carries the current Phase 0-11 Epic, Parent, and Child hierarchy, saved-state upgrades, staged Arena review packages, publish-hold traceability, and blocker-priority rows. |
| Phase 7: Orchestrator-Worker Dispatch | Next | Dispatch review depth, role packet staging, integration ownership, traceability, blocker priority, and live-worker locks remain staged for review. |
| Phase 8: Permissions and Audit | Next | Permission labels, risk blockers, risk exceptions, audit persistence, traceability, and blocker priority remain prerequisites before mutation paths grow. |
| Phase 9: Desktop-Backed Runner | Next | The fixed terminal read-only probe remains behind permission, audit, validation, rollback, traceability, runner-review, and owner approval gates. |
| Phase 10: Adaptive Magnetic Arena | Next | Adaptive layout regression, density, keyboard controls, focus state, Arena terminology, traceability, and blocker priority remain polish work after core proof clears. |
| Phase 11: Owner Testing and Release Readiness | Next | Owner Testing, evidence records, proof freshness, fresh checkout, release readiness, owner release traceability, blocker priority, and packaging holds remain the final release gate. |

## Phase 0: Baseline, Safety, and Docs Hygiene

- Public-safe project boundary and documentation hygiene.
- Repeatable validation and build checks.
- Roadmap and current-state handoff references.

## Phase 1: One Live Chat Panel

- Live Arena panel send/stream proof with thread, turn, stream delta, completion, and expected-token evidence.
- Persisted proof rows that can survive reload without sending prompts on startup.
- Owner-visible proof status in the Phase 1/2/6 priority evidence surface.
- Publishing remains held locally until owner approval.

## Phase 2: Multi-Panel Session Isolation

- Two-panel live smoke proof with distinct session and thread identities.
- No foreign-token or cross-talk evidence between panels.
- Restore-panel behavior for saved sessions.
- Duplicated live panel identity blocks Phase 2 until fresh isolated sessions are proven.

## Phase 3: Controls, Slash Commands, and Desktop Proof

- Slash command readiness and local control rows.
- Session-control proof for active-turn interrupt, retry, and steer while unsupported controls stay honest.
- Desktop smoke proof rows with stale-proof review and row-specific next actions.
- Phase 3 command plan, CLI validation provenance, blocker-priority queue, traceability rows, and handoff gate.
- Fail-closed Phase 3 proof export that lets the owner record the handoff from a complete proof-export preflight when the handoff record is the only missing item, then prepares downloadable owner-review JSON only after offline verification is ready; imported proof packages return to review unless they match the current focused panel and owner-visible handoff fingerprint.
- Phase 4 review remains held until current evidence, current active goal links, PM row links, fingerprint match, clearance snapshot, proof-export offline verification, and handoff age metadata are trusted.

## Phase 4: Provider Integration Surfaces

- Command, skill, plugin, MCP, automation, and personalization catalog depth.
- Provider surface depth for setup blockers, capability gaps, preview review, and execution locks.
- Local approval, audit, rollback, and permission records tied to the current catalog and evidence fingerprints.
- Provider traceability and blocker priority before any provider execution is considered.

## Phase 5: Migration Center

- Migration source picker and metadata-only import review.
- Apply-intent lock, rollback evidence, profile activation lock, and sensitive exclusion checks.
- Migration review depth, traceability, and blocker priority before any active profile or source platform state can change.

## Phase 6: Project and Program Planning Lane

- Current Phase 0-11 Project Management board seeded as Epics with Parent and Child rows.
- Saved-state repair that replaces older seed rows with the current phase plan while preserving custom owner rows.
- Dense Jira-like hierarchy for task, description, status, completion, complexity, source, and action review.
- Row-level staged Arena review packages for Epics, Parents, and Children, including hierarchy context and descendant tasks.
- Remaining-goal links from each priority target to the PM rows needed to stage Arena review packages.
- Phase 1/2/6 publish-hold traceability and blocker-priority rows, including the required Phase 6 publish-hold traceability and blocker-priority child rows, that keep the owner/remote publish hold ranked above proof review.
- Execution remains locked: PM staging is local review only and does not launch workers, push branches, publish artifacts, or mutate external state.

## Phase 7: Orchestrator-Worker Dispatch

- Role-panel plan scaffolds for orchestrator, implementer, validator, and integration ownership.
- Dispatch review depth for role coverage, max attempts, handoff task depth, packet integrity, validation gates, and closure boundaries.
- Current evidence fingerprint matching, traceability, blocker priority, and no-live-worker execution lock before worker spawning.

## Phase 8: Permissions and Audit

- Permission labels, risk blockers, risk exceptions, and disabled-path explanations.
- Local owner audit-review records with current audit evidence fingerprints.
- Record-specific rollback review, audit persistence, risk traceability, blocker priority, and owner-visible proof before mutation paths grow.

## Phase 9: Desktop-Backed Runner

- Fixed terminal read-only probe selection and owner approval.
- Request preview, validation output, audit record, rollback evidence, local runner-review record, and unique evidence keys.
- Phase 8 owner-review linkage, Phase 9 traceability, blocker priority, and mutation lock before the desktop runner can advance.

## Phase 10: Adaptive Magnetic Arena

- Adaptive layout regression, density/readability, keyboard controls, focus state, and Arena terminology.
- Current adaptive canvas behavior remains local UI work; release gating stays behind Phase 3 clearance and later packaging gates.
- Traceability and blocker priority for Arena-review acceptance before packaging resumes.

## Phase 11: Owner Testing and Release Readiness

- Owner Testing command center with checklist coverage, proof freshness depth, evidence records, phase readiness, current next action, and prioritized remaining-goal traces.
- Release readiness gate for fresh checkout, clean checkout, build/test, owner smoke proof with Phase 3 proof-export detail, current active Phase 3 clearance PM traceability with handoff proof and proof-export evidence, docs/known limits, security closure capability, and final release decision.
- Owner release traceability and blocker priority keep packaging, signing, installer creation, Git push, and external release actions paused until the owner explicitly resumes them.
