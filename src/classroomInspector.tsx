import type { ClassroomParticipantProjection } from "./classroomParticipants";
import type { OrchestratorLedgerEntry } from "./orchestratorBackend";

export interface TrustedParticipantUsage {
  source: "provider" | "runtime";
  inputTokens?: number;
  outputTokens?: number;
  costUsd?: number;
}

function elapsedLabel(createdAt: string, now: string): string {
  const start = Date.parse(createdAt);
  const end = Date.parse(now);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return "Unavailable";
  const seconds = Math.floor((end - start) / 1000);
  const minutes = Math.floor(seconds / 60);
  return minutes > 0 ? `${minutes}m ${seconds % 60}s` : `${seconds}s`;
}

function recordList(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null && !Array.isArray(item))
    : [];
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
}

function statusIcon(status: string): string {
  if (status === "completed" || status === "accepted") return "✓";
  if (status === "failed" || status === "blocked" || status === "recovery-review") return "!";
  if (status === "running" || status === "leased") return "▶";
  if (status === "paused" || status === "waiting-approval") return "Ⅱ";
  return "•";
}

export function ClassroomInspector({
  ledger,
  now,
  projection,
  selectedParticipantId,
  trustedUsage
}: {
  ledger: readonly OrchestratorLedgerEntry[];
  now: string;
  projection: ClassroomParticipantProjection;
  selectedParticipantId?: string;
  trustedUsage?: TrustedParticipantUsage;
}) {
  const participant = projection.participants.find((item) => item.id === selectedParticipantId);
  if (!participant) {
    return (
      <aside aria-label="Worker inspector" className="classroom-inspector" data-read-only="true">
        <h2>Worker Inspector</h2>
        <p>Select a real participant from the room or roster to inspect durable context.</p>
      </aside>
    );
  }
  const job = projection.jobs.find((item) => item.id === participant.currentJobId);
  const relevantLedger = ledger.filter((entry) =>
    entry.runId === participant.runId &&
    (entry.payload.taskId === job?.taskId || entry.payload.jobId === job?.id || entry.payload.workerJobId === job?.id)
  );
  const findings = relevantLedger.flatMap((entry) => recordList(entry.payload.findings)).map((finding) => ({
    id: typeof finding.id === "string" ? finding.id : "finding",
    message: typeof finding.message === "string" ? finding.message : "Finding detail unavailable",
    severity: typeof finding.severity === "string" ? finding.severity : "unknown"
  }));
  const evidence = [...new Set(relevantLedger.flatMap((entry) => [
    ...stringList(entry.payload.evidenceReferences),
    ...stringList(entry.payload.artifactPaths)
  ]))];
  const profile = participant.modelProfileSnapshot;
  const enabledCapabilities = Object.entries(profile.capabilities)
    .filter(([, enabled]) => enabled)
    .map(([capability]) => capability);
  const status = job?.status ?? participant.lifecycle;

  return (
    <aside aria-label={`Worker inspector for ${participant.id}`} className="classroom-inspector" data-read-only="true">
      <header>
        <div>
          <span aria-hidden="true" className="classroom-status-icon">{statusIcon(status)}</span>
          <h2>Worker Inspector</h2>
        </div>
        <strong>{status}</strong>
      </header>
      <dl>
        <div><dt>Identity</dt><dd>{participant.id}</dd></div>
        <div><dt>Seat</dt><dd>{participant.seat}</dd></div>
        <div><dt>Profile</dt><dd>{profile.id}</dd></div>
        <div><dt>Provider / model</dt><dd>{profile.provider} / {profile.model}</dd></div>
        <div><dt>Reasoning</dt><dd>{profile.reasoningEffort}</dd></div>
        <div><dt>Capabilities</dt><dd>{enabledCapabilities.join(", ") || "None reported"}</dd></div>
        <div><dt>Task</dt><dd>{job?.taskId ?? "No current task"}</dd></div>
        <div><dt>Attempt</dt><dd>{job?.attempt ?? "Unavailable"}</dd></div>
        <div><dt>Branch</dt><dd>{job?.branch ?? "Unavailable"}</dd></div>
        <div><dt>Worktree</dt><dd>{job?.worktreePath ?? "Unavailable"}</dd></div>
        <div><dt>Owned files</dt><dd>{job?.ownership.ownedFiles.join(", ") || "None"}</dd></div>
        <div><dt>Forbidden files</dt><dd>{job?.ownership.forbiddenFiles.join(", ") || "None"}</dd></div>
        <div><dt>Lease owner</dt><dd>{job?.ownership.leaseOwner ?? "Released / none"}</dd></div>
        <div><dt>Elapsed</dt><dd>{job ? elapsedLabel(job.createdAt, now) : "Unavailable"}</dd></div>
      </dl>
      <section aria-label="Validation findings">
        <h3>Findings</h3>
        {findings.length ? <ul>{findings.map((finding) => <li key={finding.id}>{finding.severity}: {finding.message}</li>)}</ul> : <p>No durable findings.</p>}
      </section>
      <section aria-label="Evidence references">
        <h3>Evidence</h3>
        {evidence.length ? <ul>{evidence.map((item) => <li key={item}>{item}</li>)}</ul> : <p>No durable evidence references.</p>}
      </section>
      <section aria-label="Trusted usage" data-usage-source={trustedUsage?.source ?? "unavailable"}>
        <h3>Usage</h3>
        {trustedUsage ? (
          <p>{trustedUsage.inputTokens ?? 0} input · {trustedUsage.outputTokens ?? 0} output · {trustedUsage.costUsd === undefined ? "cost unavailable" : `$${trustedUsage.costUsd.toFixed(4)}`}</p>
        ) : <p>Unavailable — no trusted provider or runtime value reported.</p>}
      </section>
      <div aria-label="Worker actions" className="classroom-inspector-actions">
        {[
          ["Pause", "Pause is not exposed for this durable job."],
          ["Cancel", "Cancel is not exposed from the read-only inspector."],
          ["Retry", "Retry is controlled by validation policy."],
          ["Reassign", "Reassignment requires orchestrator ownership review."],
          ["Validate", "Validation is queued by the orchestrator runtime."],
          ["Escalate", "Escalation is controlled by the orchestrator."]
        ].map(([label, reason]) => (
          <button disabled key={label} title={reason} type="button">{label}</button>
        ))}
      </div>
    </aside>
  );
}
