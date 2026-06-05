# Steerboard Milestone Snapshot

This document is a public-facing milestone snapshot of the Steerboard roadmap status.
It is intended for external visibility and product-level communication, not an internal execution log.
The compact summary below is the current next milestone selected for active monitoring.
The cockpit also expands the current next milestone into readable plan, latest-note, and next-step detail for monitoring.

It is the complete public milestone report contract. Every milestone must appear as one row in the compact target table and one row in the detailed milestone table.
The compact target table must include **Target**, **Completion**, and **Note**.
The detailed milestone table must include **Target**, **Plan**, **Completion**, **% Completion**, **Latest Note**, and **Next Step**.

Overall completion: 35%. Next milestone: Platform capabilities. Next step: expand provider-backed catalogs for plugins, skills, MCP, automations, and personalization.

Milestone reports should be readable at minimum by Target, Completion, and Note.

| Target | Completion | Note |
| --- | --- | --- |
| Product scaffold | In progress | Local shell, public docs, navigation, and cockpit scaffolding are in place. |
| Cockpit monitor and operating modes | In progress | Multi-panel cockpit and local chat-lane scaffold exist; visible panels can use panel-keyed live Codex chat and per-panel session controls, with native two-panel smoke still pending. |
| Orchestration model | In progress | Mock orchestration, validation, and handoff projections are modeled. |
| Runtime adapter previews | In progress | Runtime profiles, bridge previews, permission previews, local event simulations, panel-session persistence, stream routing, and control capability foundations exist. |
| Live Codex integration | In progress | Codex app-server bridge now supports no-prompt readiness, explicit live smoke, panel-keyed sessions, visible-panel live chat paths, and interrupt/retry/steer foundations. |
| Platform capabilities | In progress | Slash command catalog and panel composer routing are now provider-neutral and state-aware. |
| Security and privacy model | In progress | Local-first safety boundaries are documented; live-provider secrets and approvals still need hardening. |
| Packaging and installation | Paused | Packaging is intentionally deferred until core development is complete. |
| Optional project management lane | In progress | Pipeline visibility, dispatch previews, linked local runs, and readiness language are scaffolded. |

| Target | Plan | Completion | % Completion | Latest Note | Next Step |
| --- | --- | --- | --- | --- | --- |
| Product scaffold | Establish a stable baseline structure, public docs contract, and navigation foundations. | In progress | 60% | Local shell, public docs, navigation, and cockpit scaffolding are in place. | Keep scaffold stable while live provider integration starts. |
| Cockpit monitor and operating modes | Complete core cockpit panels, control affordances, and visible operating-mode cues. | In progress | 58% | Multi-panel cockpit and local chat-lane scaffold exist; visible panels can use panel-keyed live Codex chat and per-panel session controls, with native two-panel smoke still pending. | Run native two-panel smoke and live-control smoke, then continue command capability work. |
| Orchestration model | Define a consistent model for sequencing cross-cutting tasks and status propagation. | In progress | 40% | Mock orchestration, validation, and handoff projections are modeled. | Feed real provider session events into the same model. |
| Runtime adapter previews | Deliver and stabilize adapter surfaces for consistent runtime status intake. | In progress | 50% | Runtime profiles, bridge previews, permission previews, local event simulations, panel-session persistence, stream routing, and control capability foundations exist. | Connect routed stream and control state to richer monitor surfaces. |
| Live Codex integration | Connect real Codex auth/session transport to cockpit panels. | In progress | 42% | Codex app-server bridge now supports no-prompt readiness, explicit live smoke, panel-keyed sessions, visible-panel live chat paths, and interrupt/retry/steer foundations. | Run native two-panel smoke and live-control smoke as recurring regression checks. |
| Platform capabilities | Make commands, plugins, automations, MCP, personalization, permissions, and audit state live. | In progress | 8% | Slash command catalog and panel composer routing are now provider-neutral and state-aware. | Expand provider-backed catalogs for plugins, skills, MCP, automations, and personalization. |
| Security and privacy model | Set baseline protections, data-handling boundaries, and reviewable controls. | In progress | 30% | Local-first safety boundaries are documented; live-provider secrets and approvals still need hardening. | Add provider credential, permission, and audit acceptance criteria before live execution. |
| Packaging and installation | Prepare install, environment, and distribution path for dependable rollout. | Paused | 0% | Packaging is intentionally deferred until core development is complete. | Remain paused until core development is complete. |
| Optional project management lane | Define the optional lane scope while keeping cockpit chat primary. | In progress | 25% | Pipeline visibility, dispatch previews, linked local runs, and readiness language are scaffolded. | Keep secondary and connect it to provider capability readiness after live chat works. |
