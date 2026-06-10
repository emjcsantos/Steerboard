# Local Owner Testing Checklist (Phase 9)

This checklist is provider/model agnostic and intended for owner-level local hardening validation.

## How To Use This Checklist

Use this checklist in a local workspace after checkout and dependencies are installed.
Run through each section in order, and record one of four states:

- `ready` - behavior is verified and repeatable.
- `review` - behavior appears acceptable but needs evidence or peer review.
- `blocked` - work cannot continue until the blocker is resolved.
- `waiting` - setup or evidence is incomplete.

Do not proceed to the next section until the current item is at least `review`.

## Phase 9 Owner Test Flow

1. `Launch`
   - Start from a clean workspace state.
   - Verify app launch, local profile load, and startup status messages are deterministic.
2. `Connect`
   - Open a fresh connection.
   - Confirm reconnect/restart behavior does not lose panel scope or pending action context.
   - Run live smoke, control smoke, active-turn interrupt smoke, active-turn steer smoke, and two-panel smoke from the connection dialog when desktop runtime access is available.
   - Confirm the Owner Testing Phase 1/2/6 priority card shows one-panel proof, two-panel isolation, and PM phase-board staging as separate evidence rows.
   - Optionally run `npm run smoke:phase1-2` to execute the opt-in one-panel live smoke and two-panel isolation desktop smoke tests. This can send tiny read-only prompts through the local runtime and is intentionally excluded from normal tests.
   - Optionally run `npm run smoke:phase3` to execute the opt-in live-control, active-turn interrupt, and active-turn steer desktop smoke tests. This can send tiny read-only prompts through the local runtime and is intentionally excluded from normal tests.
3. `Chat`
   - Send a test message and verify response capture and interruption controls.
   - Confirm the same session can continue after transient stalls.
4. `Multi-Panel`
   - Open two or more panels and switch focus repeatedly.
   - Verify each panel preserves its own session context and activity state.
   - Confirm corrupted saved panel metadata with duplicate live identities shows a conflict warning and does not send live chat through the duplicated identity.
5. `Controls`
   - Exercise stop, retry, pause, and route controls.
   - Confirm control actions are deterministic and do not drift between views.
   - Confirm unsupported lifecycle controls show visible unsupported evidence, not only disabled icons.
   - Confirm the Owner Testing controls card lists interrupt, retry, steer, fork, resume, and archive with their current state.
   - Confirm the Owner Testing panel moves control evidence from review to ready only after interrupt, retry, and steer/follow-up transcript proof is present and fork/resume/archive are honestly unsupported or live.
6. `Slash Commands`
   - Type `/` in a Arena panel composer and confirm suggestions are limited to commands scoped to the active panel.
   - Submit one app/global-only command from a panel and confirm it is blocked with explicit unsupported guidance.
   - Submit one provider-routed panel command in live desktop mode and confirm the transcript shows provider-route evidence before the live turn runs.
   - Confirm the Owner Testing panel moves slash execution evidence from review to ready only after provider-route plus live/status transcript proof is present.
   - Confirm the Owner Testing Phase 3 gate remains review or waiting until slash execution, session-control evidence, live-control smoke, active-turn interrupt smoke, and active-turn steer smoke are all proven ready.
   - Confirm the Owner Testing Phase 3 smoke proof rows show browser fallback or non-executed proofs as `waiting`, successful desktop proofs as `ready`, incomplete desktop proofs as `review`, and unsupported-after-execution proofs as `blocked`.
   - Reload after a full desktop smoke bundle and confirm the Phase 3 smoke proof rows keep the last desktop-executed proof states without rerunning prompts on startup.
   - Use the Phase 3 gate diagnostic rows to identify which proof is still waiting, review, or blocked before rerunning desktop smokes.
   - Use the Phase 3 gate action buttons to rerun live-control, active-turn interrupt, and active-turn steer smoke proofs only after explicitly choosing the action.
   - Refresh the command catalog and confirm metadata/status is updated as a safe metadata/status refresh (no side-effectful actions).
7. `Catalogs`
   - Open command, skill, plugin, MCP, automation, and personalization catalogs.
   - Verify stable ordering and filtering output across repeated reloads.
   - Confirm the Owner Testing panel shows six catalog refresh validation rows and a metadata-only safety note.
   - Open the connection dialog and run the catalog smoke to refresh all six catalog metadata/status surfaces together without execution.
   - Refresh the command catalog as a safe metadata/status refresh and confirm source/state changes are visible without side effects.
   - Refresh the skill catalog as a safe metadata/status refresh and confirm source/state changes are visible without executing skills.
   - Refresh the plugin catalog as a safe metadata/status refresh and confirm source/state changes are visible without invoking plugin actions.
   - Refresh the MCP catalog as a safe metadata/status refresh and confirm source/state changes are visible without running MCP tools.
   - Refresh the automation catalog as a safe metadata/status refresh and confirm source/state changes are visible without scheduling or running automations.
   - Refresh the personalization catalog as a safe metadata/status refresh and confirm source/state changes are visible without mutating profile or instruction sources.
8. `Migration`
   - Validate migration plan preview and reviewed-draft staging flow.
   - Confirm migration audit summary exists locally and includes accepted, review-required, unsupported, and excluded counts.
   - Confirm rollback metadata exists for applied drafts and that rollback restores the prior profile pointer without source mutation.
   - Confirm secrets, raw transcripts, and source auth state remain excluded from persisted migration metadata.
9. `Planning`
   - Create or update a plan item and confirm expected persistence updates.
   - Confirm planning metadata remains readable after a refresh.
   - Confirm the Project Management board contains Phase 0 through Phase 11 as Epics and that representative Epic, Parent, and Child rows each stage an Arena review package through `Run`.
10. `Dispatch`
    - Dispatch a staged pipeline item through the standard lane.
    - Confirm role-panel plan generation, route details, and log records are consistent.
    - Verify the result is a local review artifact only (no runtime worker launch or external session execution).
11. `Permissions`
    - Trigger at least one sensitive action.
    - Verify approval and block branches are explicit and safe.
12. `Reload`
    - Reload during an in-progress run and resume from persisted context.
    - Confirm unsaved owner state is surfaced before continuing.
13. `Recovery`
    - Induce one recoverable failure path.
    - Verify recovery evidence and handoff route are visible and deterministic.

## Repeatability Note

Record state for each item at every run and compare across runs. If state changes only because of environment fluctuations, file the variance and rerun after a clean refresh.
