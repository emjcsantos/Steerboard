# Steerboard Milestone Snapshot

This document is a public-facing milestone snapshot of the Steerboard roadmap status.
It is intended for external visibility and product-level communication, not an internal execution log.
The compact summary below is the current next milestone selected for active monitoring.
The cockpit also expands the current next milestone into readable plan, latest-note, and next-step detail for monitoring.

It is the complete public milestone report contract. Every milestone must appear as one row in the compact target table and one row in the detailed milestone table.
The compact target table must include **Target**, **Completion**, and **Note**.
The detailed milestone table must include **Target**, **Plan**, **Completion**, **% Completion**, **Latest Note**, and **Next Step**.

Overall completion: 30%. Next milestone: Live Codex integration. Next step: validate and extend one-panel live chat into multi-panel live session isolation.

Milestone reports should be readable at minimum by Target, Completion, and Note.

| Target | Completion | Note |
| --- | --- | --- |
| Product scaffold | In progress | Local shell, public docs, navigation, and cockpit scaffolding are in place. |
| Cockpit monitor and operating modes | In progress | Multi-panel cockpit and local chat-lane scaffold exist; first visible desktop panel can use live Codex chat, while multi-panel live isolation is pending. |
| Orchestration model | In progress | Mock orchestration, validation, and handoff projections are modeled. |
| Runtime adapter previews | In progress | Runtime profiles, bridge previews, permission previews, and local event simulations exist. |
| Live Codex integration | In progress | Codex app-server bridge now supports no-prompt readiness, explicit live smoke, and a first live panel chat path. |
| Platform capabilities | Planned | The plan now treats these as required provider-backed surfaces, not decorative sidebar entries. |
| Security and privacy model | In progress | Local-first safety boundaries are documented; live-provider secrets and approvals still need hardening. |
| Packaging and installation | Paused | Packaging is intentionally deferred until core development is complete. |
| Optional project management lane | In progress | Pipeline visibility, dispatch previews, linked local runs, and readiness language are scaffolded. |

| Target | Plan | Completion | % Completion | Latest Note | Next Step |
| --- | --- | --- | --- | --- | --- |
| Product scaffold | Establish a stable baseline structure, public docs contract, and navigation foundations. | In progress | 60% | Local shell, public docs, navigation, and cockpit scaffolding are in place. | Keep scaffold stable while live provider integration starts. |
| Cockpit monitor and operating modes | Complete core cockpit panels, control affordances, and visible operating-mode cues. | In progress | 50% | Multi-panel cockpit and local chat-lane scaffold exist; first visible desktop panel can use live Codex chat, while multi-panel live isolation is pending. | Extend live chat from one panel to independent multi-panel sessions. |
| Orchestration model | Define a consistent model for sequencing cross-cutting tasks and status propagation. | In progress | 40% | Mock orchestration, validation, and handoff projections are modeled. | Feed real provider session events into the same model. |
| Runtime adapter previews | Deliver and stabilize adapter surfaces for consistent runtime status intake. | In progress | 40% | Runtime profiles, bridge previews, permission previews, local event simulations, and the first Codex panel-session bridge exist. | Route multiple panel sessions through provider-neutral runtime state. |
| Live Codex integration | Connect real Codex auth/session transport to cockpit panels. | In progress | 25% | Codex app-server bridge now supports no-prompt readiness, explicit live smoke, and a first live panel chat path. | Validate the native desktop path, then extend to multi-panel isolation and session controls. |
| Platform capabilities | Make commands, plugins, automations, MCP, personalization, permissions, and audit state live. | Planned | 0% | The plan now treats these as required provider-backed surfaces, not decorative sidebar entries. | Define adapter capability schemas and UI states for each surface. |
| Security and privacy model | Set baseline protections, data-handling boundaries, and reviewable controls. | In progress | 30% | Local-first safety boundaries are documented; live-provider secrets and approvals still need hardening. | Add provider credential, permission, and audit acceptance criteria before live execution. |
| Packaging and installation | Prepare install, environment, and distribution path for dependable rollout. | Paused | 0% | Packaging is intentionally deferred until core development is complete. | Remain paused until core development is complete. |
| Optional project management lane | Define the optional lane scope while keeping cockpit chat primary. | In progress | 25% | Pipeline visibility, dispatch previews, linked local runs, and readiness language are scaffolded. | Keep secondary and connect it to provider capability readiness after live chat works. |
