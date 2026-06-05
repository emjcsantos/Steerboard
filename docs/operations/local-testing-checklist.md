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
3. `Chat`
   - Send a test message and verify response capture and interruption controls.
   - Confirm the same session can continue after transient stalls.
4. `Multi-Panel`
   - Open two or more panels and switch focus repeatedly.
   - Verify each panel preserves its own session context and activity state.
5. `Controls`
   - Exercise stop, retry, pause, and route controls.
   - Confirm control actions are deterministic and do not drift between views.
6. `Slash Commands`
   - Run at least one documented command and one invalid command.
   - Confirm valid output is clear and invalid input returns explicit guidance.
   - Refresh the command catalog and confirm source/state changes are visible without running side-effectful actions.
7. `Catalogs`
   - Open command, plugin, and tool catalogs.
   - Verify stable ordering and filtering output across repeated reloads.
   - Refresh the Skills catalog and confirm source/state changes are visible without executing skills.
   - Refresh the Plugins catalog and confirm source/state changes are visible without executing plugins.
   - Refresh the MCP catalog and confirm source/state changes are visible without executing MCP tools.
   - Refresh the Automations catalog and confirm source/state changes are visible without scheduling or running automations.
   - Refresh the Personalization catalog and confirm source/state changes are visible without mutating profile or instruction sources.
8. `Migration`
   - Validate migration plan preview and staged execution flow.
   - Confirm irreversible steps are explicit and recoverable.
9. `Planning`
   - Create or update a plan item and confirm expected persistence updates.
   - Confirm planning metadata remains readable after a refresh.
10. `Dispatch`
    - Dispatch a non-destructive action through the standard lane.
    - Confirm route, result status, and log details are consistent.
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
