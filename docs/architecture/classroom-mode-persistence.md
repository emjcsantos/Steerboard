# Classroom Mode persistence

Classroom Mode projects its participant state from the existing orchestrator SQLite boundary. It does not maintain a second run store.

Worker dispatch writes a versioned `classroom` envelope into the existing command and progress-event `payload_json`. The envelope snapshots:

- stable participant and run identity, worker role, lifecycle, and deterministic seat;
- the resolved model profile, including provider, model, reasoning effort, auth reference, and capability flags;
- current job identity, branch, worktree, attempt, status, owned/forbidden files, and lease owner;
- an actor-aware worker message and the participant's message references.

`hydrateClassroomParticipantProjection` is read-only. It derives a Classroom projection after the normal orchestrator snapshot reload and deduplicates the same envelope when it appears in both command and event rows. Legacy rows without the envelope remain valid and produce an empty Classroom projection.

The projection never makes stored data executable. Unknown schema versions, invalid actors, missing runs, duplicate/out-of-range seats, or malformed job references are rejected. Unknown lifecycle or incomplete model profiles are retained only as limited/recovery-review state. Runtime execution continues to use the existing validated top-level command contract.

The Project Management surface shows a minimal read-only restored-participant summary. It contains no participant chat control; user conversation remains with the orchestrator.

## Shared run projection and controller

`projectOrchestratorRun` derives Professional and Classroom counts from the same restored backend state. Presentation adapters may change layout and labels, but run identity, task/participant/job/message/validation/completion counts, task states, and sanitized progress remain shared runtime truth.

The typed work-state transition table prevents out-of-order or duplicate progress from regressing accepted, integrating, or completed work. Progress removes private-reasoning markers and control characters, is length-bounded, and can be rate-limited through `OrchestratorProgressThrottle`.

`OrchestratorRunController` keeps execution policy explicit. Manual is the default. Continuous command execution requires both readiness and permission approval; event processing remains a separate safe phase. A repository-scoped in-flight lease prevents simultaneous queue pumps from executing the same durable command twice.

## Worker capacity and seats

Approved worker capacity is stored in the durable run scope and defaults to five. The UI reports occupied and empty places separately; only restored participant envelopes count as occupied workers. Dispatch restores active jobs and occupied seats before applying capacity or file-ownership checks, rejects duplicate active attempts for the same task, and assigns the first available deterministic seat. The first two assigned participants are projected into teacher standing slots while additional assigned participants remain explicitly visible in the queue.

Capacity may be approved from one through twenty. Increasing it exposes empty places only; decreasing it below current active usage blocks new dispatch without cancelling valid work. Per-task model assignments resolve worker profiles independently, while validator and orchestrator profiles are snapshotted alongside the durable command routing metadata. An explicitly missing assigned profile blocks dispatch instead of silently substituting a model. The complete accessible roster is sourced only from real participant envelopes and remains selectable even when a participant is outside the currently visible room subset.

## Validation exhaustion and takeover

Validation exhaustion policy is stored in the durable run scope and is independent of presentation. The default is `orchestrator-takeover`; `corrective-task` remains explicitly selectable. Revision failures one and two reuse the same worker identity, branch, worktree, and ownership scope for attempts two and three while persisting the validator report and required actions.

The third revision failure creates one deterministic `orchestrator.takeover` command and no fourth worker attempt. A durable handoff event releases the worker owner and transfers the exact mutable file scope before the command can run. The Rust runtime refuses takeover without a valid handoff or a resolved Codex orchestrator profile, and applies that profile's model and reasoning effort. Successful takeover queues the normal accepted-commit/integration path without another validator; failed takeover queues no downstream mutation. Replayed third-failure reports cannot duplicate the deterministic takeover job.

## Orchestrator-only chat

The persistent right-side chat has one immutable recipient: the main orchestrator. Stored messages repair to `user` or `orchestrator` authors only; worker, validator, broadcast, and malformed messages are discarded. Selecting a roster participant changes only the persisted read-only watching reference. Orchestrator replies may link to durable task, job, validation, and evidence identifiers, while active/waiting/validating/blocked counts remain read-only projections.

Panel messages, width, collapsed state, and watching context persist under `steerboard.orchestratorChat.v1` with bounded repair. The collapse toggle remains mounted as the focus-return target. Wide layouts keep the non-modal panel beside staged/canvas content; narrower layouts use a stacked compact non-overlay presentation.

## Worker inspection and roster navigation

The roster and visual actor selection share one participant identifier. Selection opens the read-only Worker Inspector and updates only the chat's watching reference; the chat recipient remains the orchestrator. The inspector reports durable identity, model/profile details, enabled capabilities, current task and attempt, status, branch/worktree, ownership, findings, evidence, elapsed time, and only explicitly trusted provider/runtime usage. Unsupported mutation controls remain disabled with visible reasons.

The complete roster is the semantic alternative for up to twenty real participants. It uses one roving tab stop, arrow-key wrapping, Home/End navigation, and Enter/Space selection. Selecting an off-room participant adds it to the visible presentation set while preserving focus; `prefers-reduced-motion` changes reveal behavior to immediate. Every status includes visible text and a non-color icon.

## Static classroom presentation

`ClassroomPresentation` is a read-only adapter over `OrchestratorRunProjection` and `ClassroomParticipantProjection`. The App owns one restored backend state and supplies that same state to both the Professional planning tools and the Classroom canvas, so switching presentations does not restart or copy the run.

The initial room always shows at least five capacity places, but creates student actors only for durable participants. The Orchestrator teacher, subordinate Validator, two assignment slots, two validation slots, status counts, roster, inspector, and non-modal Orchestrator Chat remain separate semantic regions. Queued, working, validating, revision, accepted, escalated, blocked, and completed states use persistent text plus an icon and remain understandable with motion disabled. Seat selection only updates read-only watching context; the canvas has no execution callbacks.

## Twenty-seat scene and viewport

The room uses a deterministic normalized `100 x 100` scene map. It reserves independent bounds for the status rail, door corridor, teacher and validator zones, walking paths, roster, and every seat's desk, label, focus ring, and interaction target. The supported proof capacities are 1, 5, 6, 10, 15, and 20; intermediate approved capacities render within the next collision-proven map while exposing only the approved places. Seats distinguish empty, reserved, occupied, and temporarily-away state independently from worker status.

Viewport state persists bounded zoom, normalized pan, and automatic/manual fit mode under `steerboard.classroomViewport.v1`. Labeled Zoom In, Zoom Out, Fit, Reset, and directional pan controls have keyboard equivalents scoped to the focused room, so normal page scrolling is not intercepted. Manual zoom or pan disables auto-fit. Semantic overview hides only the redundant seat number while preserving worker name, status, and target. Wide layouts keep Orchestrator Chat persistently visible in the right column beside the room, with roster and inspector below it. Compact layouts place the chat context before the room rather than overlaying it; selection and roster focus remain participant-ID based.

## Durable bubble previews

Classroom bubbles are optional previews derived from sanitized durable participant/orchestrator messages. Assignment, acknowledgement, validation, escalation, orchestrator, and bounded thinking-summary kinds share a deterministic selector: unacknowledged error/escalation first, then validation, orchestrator communication, and routine progress. It renders at most three previews and one per actor. Focused or hovered routine previews do not expire; unacknowledged errors remain; reduced motion uses static status.

Every candidate supplies collision-tested normalized anchors. A preview is suppressed when all anchors intersect protected room geometry or another bubble, and a labeled link to the complete sanitized durable activity remains instead. Preview links are read-only references to Orchestrator Chat or durable activity and never create a worker-chat route. Raw thinking blocks and private-reasoning markers are removed before either preview or durable activity display.

## Ephemeral motion over durable truth

`deriveClassroomMotion` compares durable frames and emits replaceable visual intents for first seating with chair, assignment, return to desk, validator submission, revision return, pass/escalation forwarding, and teacher takeover. The projection has no callbacks, timers, promises, or runtime writes; `animationBlocksRuntime` is permanently false. A newer durable frame replaces obsolete pending intent immediately. Actor keys remain participant-ID based, and focus metadata survives reconciliation.

Participants already present in the first restored frame are treated as durably seated, preventing chair-entry replay after reload. Full, Fast, Minimal, and Reduced modes use distinct bounded durations; Reduced is instant and disables camera motion. Pointer, keyboard, zoom, fit, reset, or pan manipulation disables automatic camera movement. CSS animations use only transform and opacity, run once, remain interruptible, and settle on the authoritative seat. A deterministic O(n) baseline caps evidence at twenty actors and sixty projection operations.

## Rollout and hardening boundary

`resolveClassroomRollout` fails closed to Professional for absent, malformed, incomplete owner approval, or incomplete rollback configuration. Internal preview and owner-approved rollout make the presentation available; off and rolled-back do not. The resolver returns the original durable-state reference and never mutates it. The App retains backward compatibility with the legacy boolean flag as internal preview while explicit rollout states require auditable owner/rollback records.

`Classroom Owner Baseline v1` bounds the integration at twenty workers, sixty motion operations, three bubbles, eighty chat messages, and constant-work normalized viewport updates. Recovery contracts distinguish truthful empty, repaired, blocked, and limited/read-only states for legacy/malformed data, unknown or duplicate input, orphan jobs, missing profiles, invalid seats, lost runtimes, and approval boundaries. Product and operator behavior is documented separately in `docs/product/classroom-mode.md` and `docs/operations/classroom-mode-rollout.md`.
