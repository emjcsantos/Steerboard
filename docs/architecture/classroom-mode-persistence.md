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
