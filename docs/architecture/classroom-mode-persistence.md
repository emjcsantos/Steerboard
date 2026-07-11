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
