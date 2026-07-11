import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type {
  ClassroomParticipantProjection,
  ClassroomParticipantSnapshot
} from "./classroomParticipants";
import { ClassroomInspector, type TrustedParticipantUsage } from "./classroomInspector";
import type { OrchestratorLedgerEntry } from "./orchestratorBackend";

const participant: ClassroomParticipantSnapshot = {
  id: "run-1:participant:task-7",
  runId: "run-1",
  role: "worker",
  lifecycle: "working",
  seat: 7,
  modelProfileSnapshot: {
    id: "implementation-worker",
    role: "worker",
    provider: "codex",
    model: "gpt-5.3-codex",
    reasoningEffort: "high",
    authRef: "codex-desktop",
    capabilities: {
      tools: true,
      filesystem: true,
      shell: true,
      browser: false,
      structuredOutput: true
    }
  },
  currentJobId: "job-7",
  messageIds: ["message-7"],
  executionState: "eligible"
};

const projection: ClassroomParticipantProjection = {
  participants: [participant],
  jobs: [{
    id: "job-7",
    runId: "run-1",
    participantId: participant.id,
    taskId: "task-7",
    branch: "codex/classroom-inspector",
    worktreePath: ".steerboard/worktrees/classroom-inspector",
    status: "running",
    attempt: 2,
    ownership: {
      ownedFiles: ["src/classroomInspector.tsx"],
      forbiddenFiles: ["src/orchestratorChat.tsx"],
      leaseOwner: "worker-7"
    },
    createdAt: "2026-07-11T02:00:00.000Z"
  }],
  messages: [{
    id: "message-7",
    runId: "run-1",
    actor: { kind: "participant", participantId: participant.id },
    body: "Inspector implementation is in progress.",
    createdAt: "2026-07-11T02:00:01.000Z"
  }]
};

const ledger: OrchestratorLedgerEntry[] = [{
  id: "ledger-7",
  runId: "run-1",
  sequence: 7,
  eventId: "event-7",
  kind: "validator.reported",
  severity: "warning",
  message: "Validator reported durable context.",
  payload: {
    taskId: "task-7",
    jobId: "job-7",
    findings: [{ id: "finding-1", severity: "warning", message: "Add keyboard coverage." }],
    evidenceReferences: ["vitest:classroom-inspector"],
    artifactPaths: ["artifacts/inspector-proof.json"]
  },
  createdAt: "2026-07-11T02:04:00.000Z"
}];

function renderInspector(input?: {
  selectedParticipantId?: string;
  sourceLedger?: readonly OrchestratorLedgerEntry[];
  trustedUsage?: TrustedParticipantUsage;
}): string {
  return renderToStaticMarkup(
    <ClassroomInspector
      ledger={input?.sourceLedger ?? ledger}
      now="2026-07-11T02:05:30.000Z"
      projection={projection}
      selectedParticipantId={input?.selectedParticipantId}
      trustedUsage={input?.trustedUsage}
    />
  );
}

describe("ClassroomInspector", () => {
  it("shows truthful participant, profile, job, ownership, findings, evidence, elapsed, and trusted usage context", () => {
    const html = renderInspector({
      selectedParticipantId: participant.id,
      trustedUsage: { source: "provider", inputTokens: 1_200, outputTokens: 340, costUsd: 0.0123 }
    });

    expect(html).toContain(`aria-label="Worker inspector for ${participant.id}"`);
    expect(html).toContain('data-read-only="true"');
    expect(html).toContain("implementation-worker");
    expect(html).toContain("codex / gpt-5.3-codex");
    expect(html).toContain("high");
    expect(html).toContain("tools, filesystem, shell, structuredOutput");
    expect(html).not.toContain("tools, filesystem, shell, browser");
    expect(html).toContain("task-7");
    expect(html).toContain("running");
    expect(html).toContain("2</dd>");
    expect(html).toContain("codex/classroom-inspector");
    expect(html).toContain(".steerboard/worktrees/classroom-inspector");
    expect(html).toContain("src/classroomInspector.tsx");
    expect(html).toContain("src/orchestratorChat.tsx");
    expect(html).toContain("worker-7");
    expect(html).toContain("warning: Add keyboard coverage.");
    expect(html).toContain("vitest:classroom-inspector");
    expect(html).toContain("artifacts/inspector-proof.json");
    expect(html).toContain("5m 30s");
    expect(html).toContain('data-usage-source="provider"');
    expect(html).toContain("1200 input");
    expect(html).toContain("340 output");
    expect(html).toContain("$0.0123");
  });

  it("communicates status through visible text and a separate non-color icon", () => {
    const html = renderInspector({ selectedParticipantId: participant.id });

    expect(html).toMatch(/class="classroom-status-icon"[^>]*>[^<]+<\/span>/);
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("<strong>running</strong>");
  });

  it("keeps unsupported worker actions disabled and explains every reason without exposing chat controls", () => {
    const html = renderInspector({ selectedParticipantId: participant.id });

    for (const [label, reason] of [
      ["Pause", "Pause is not exposed for this durable job."],
      ["Cancel", "Cancel is not exposed from the read-only inspector."],
      ["Retry", "Retry is controlled by validation policy."],
      ["Reassign", "Reassignment requires orchestrator ownership review."],
      ["Validate", "Validation is queued by the orchestrator runtime."],
      ["Escalate", "Escalation is controlled by the orchestrator."]
    ]) {
      expect(html).toContain(`disabled="" title="${reason}" type="button">${label}</button>`);
    }
    expect(html.match(/<button /g)).toHaveLength(6);
    expect(html).not.toMatch(/aria-label="[^"]*(?:chat|composer|recipient)[^"]*"/i);
    expect(html).not.toMatch(/<button[^>]*>(?:Chat|Send|Message)<\/button>/i);
    expect(html).not.toContain("<form");
    expect(html).not.toContain("<input");
    expect(html).not.toContain("textarea");
    expect(html).not.toContain("contenteditable");
  });

  it("does not invent usage, findings, evidence, or participant details for missing state and selection", () => {
    const selectedHtml = renderInspector({ selectedParticipantId: participant.id, sourceLedger: [] });
    const noSelectionHtml = renderInspector();
    const missingSelectionHtml = renderInspector({ selectedParticipantId: "participant-does-not-exist" });

    expect(selectedHtml).toContain("No durable findings.");
    expect(selectedHtml).toContain("No durable evidence references.");
    expect(selectedHtml).toContain('data-usage-source="unavailable"');
    expect(selectedHtml).toContain("no trusted provider or runtime value reported");
    for (const html of [noSelectionHtml, missingSelectionHtml]) {
      expect(html).toContain('aria-label="Worker inspector"');
      expect(html).toContain('data-read-only="true"');
      expect(html).toContain("Select a real participant");
      expect(html).not.toContain("job-7");
      expect(html).not.toContain("Worker actions");
      expect(html).not.toContain("<button");
    }
  });
});
