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
