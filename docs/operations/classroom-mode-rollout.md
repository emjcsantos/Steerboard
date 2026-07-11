# Classroom Mode rollout

Professional Mode is the safe default. Classroom Mode is a feature-gated read-only presentation over the existing orchestrator SQLite state.

## Rollout states

- `off`: Classroom UI is unavailable.
- `internal-preview`: Classroom UI is available for deliberate internal review.
- `owner-approved`: Classroom UI is available after an explicit owner approval record.
- `rolled-back`: Classroom UI is unavailable again; durable run state is retained.

The legacy `VITE_STEERBOARD_CLASSROOM_MODE=true` switch remains compatible as internal preview. Use the explicit rollout configuration for owner rollout and rollback. Never delete SQLite state to disable the presentation.

Set `VITE_STEERBOARD_CLASSROOM_ROLLOUT` to `off`, `internal-preview`, `owner-approved`, or `rolled-back`. Owner approval additionally requires non-empty `VITE_STEERBOARD_CLASSROOM_APPROVED_BY`, `VITE_STEERBOARD_CLASSROOM_APPROVED_AT`, and `VITE_STEERBOARD_CLASSROOM_APPROVAL_EVIDENCE`. Rollback requires `VITE_STEERBOARD_CLASSROOM_ROLLED_BACK_BY`, `VITE_STEERBOARD_CLASSROOM_ROLLED_BACK_AT`, and `VITE_STEERBOARD_CLASSROOM_ROLLBACK_REASON`. Missing or malformed evidence fails closed to `off`.

## Owner rollout checklist

1. Confirm Professional is still the initial presentation and its Arena, Project Management staging, provider, permission, and right-panel checks pass.
2. Run the focused Classroom suites, `npm.cmd run check`, relevant Rust/Tauri tests, and `npm.cmd run desktop:build`.
3. Verify restored five- and twenty-worker runs, three-failure takeover, Orchestrator-only chat, roster/inspector, bubbles, Full/Fast/Minimal/Reduced motion, keyboard navigation, high zoom/reflow, and forced colors.
4. Record owner approval and enable `owner-approved` rollout.
5. To roll back, select `rolled-back` or `off`; reload and verify the same run is visible in Professional Mode.

## Named performance baseline

`Classroom Owner Baseline v1` is deterministic: at most twenty actors, sixty motion-projection operations per durable update, three visible bubbles, eighty persisted chat messages, and constant-work normalized zoom/pan updates. This avoids unreliable wall-clock thresholds while bounding every presentation-specific hot path.

## Recovery and security

Legacy runs without Classroom envelopes render truthful empty capacity. Malformed participants become rejected or limited/read-only; missing profiles, invalid seats, orphaned jobs, lost runtime connections, unknown commands/events, duplicate reports, and blocked approvals retain explicit recoverable states. Classroom adds no execution bypass, automatic push, dependency, secret field, private transcript fixture, or raw chain-of-thought display.
