import { describe, expect, it } from "vitest";
import {
  createOrchestratorContextCheckpoint,
  filterOrchestratorLedgerEntries,
  groupOrchestratorLedgerForUi,
  isProgressKind,
  selectCleanupQueueSummaryForUi,
  selectLatestOrchestratorRunReportForUi
} from "./orchestratorLedgerView";
import type { OrchestratorLedgerEntry } from "./orchestratorBackend";

const entries: OrchestratorLedgerEntry[] = [
  {
    id: "ledger-1",
    runId: "run-1",
    sequence: 1,
    kind: "run.created",
    severity: "info",
    message: "Created run.",
    payload: {},
    createdAt: "2026-07-09T05:00:00.000Z"
  },
  {
    id: "ledger-2",
    runId: "run-1",
    sequence: 2,
    kind: "worker.progress",
    severity: "info",
    message: "Worker ran command.",
    payload: {
      taskId: "task-1",
      jobId: "worker-1",
      attempt: 1,
      changedFiles: ["src/a.ts"],
      validationCommands: ["npm.cmd run test -- src/a.test.ts"],
      budget: {
        maxWorkerAttempts: 3,
        maxRuntimeMinutes: 30,
        maxTokens: 100000
      }
    },
    createdAt: "2026-07-09T05:01:00.000Z"
  },
  {
    id: "ledger-3",
    runId: "run-1",
    sequence: 3,
    kind: "validator.reported",
    severity: "info",
    message: "Validator verdict: revision-required.",
    payload: {
      taskId: "task-1",
      workerJobId: "worker-1",
      validatorJobId: "validator-1",
      attempt: 1,
      verdict: "revision-required",
      nextAction: "return-to-worker",
      findingCount: 2,
      changedFiles: ["src/a.ts", "src/a.test.ts"],
      commandsRun: [
        {
          command: "npm.cmd run test -- src/a.test.ts",
          status: "failed",
          detail: "One failing test."
        }
      ],
      findings: [
        {
          id: "missing-assertion",
          severity: "error",
          message: "Add missing assertion.",
          files: ["src/a.test.ts"],
          evidence: ["vitest"]
        }
      ],
      acceptanceResults: [
        {
          criterion: "Task is complete.",
          status: "fail",
          evidence: ["vitest"]
        }
      ],
      evidenceReferences: ["artifact://validator/report-1"]
    },
    createdAt: "2026-07-09T05:02:00.000Z"
  },
  {
    id: "ledger-4",
    runId: "run-1",
    sequence: 4,
    kind: "approval.requested",
    severity: "warning",
    message: "Full agent approval requested.",
    payload: {
      taskId: "task-2"
    },
    createdAt: "2026-07-09T05:03:00.000Z"
  },
  {
    id: "ledger-5",
    runId: "run-2",
    sequence: 1,
    kind: "cleanup.updated",
    severity: "info",
    message: "Cleanup retained.",
    payload: {
      taskId: "task-9"
    },
    createdAt: "2026-07-09T05:04:00.000Z"
  }
];

describe("orchestrator ledger view", () => {
  it("groups run, worker, validator, approval, and cleanup events into collapsible UI sections", () => {
    const sections = groupOrchestratorLedgerForUi(entries);

    expect(sections.map((section) => section.kind)).toEqual([
      "run",
      "worker",
      "validator",
      "approval",
      "cleanup"
    ]);
    expect(sections.every((section) => section.collapsible)).toBe(true);
    expect(sections.find((section) => section.kind === "worker")).toMatchObject({
      title: "Worker | task-1 | attempt 1",
      summary: "1 event | latest: Worker ran command.",
      details: expect.arrayContaining([
        { label: "Commands", value: "npm.cmd run test -- src/a.test.ts" },
        { label: "Changed files", value: "src/a.ts" },
        { label: "Budget", value: "3 attempts / 30 min / 100000 tokens" }
      ])
    });
    expect(sections.find((section) => section.kind === "validator")).toMatchObject({
      details: expect.arrayContaining([
        { label: "Commands", value: "npm.cmd run test -- src/a.test.ts (failed)" },
        { label: "Findings", value: "Add missing assertion. (error)" },
        { label: "Acceptance", value: "Task is complete. (fail)" },
        { label: "Evidence", value: "artifact://validator/report-1" },
        { label: "Verdict", value: "revision-required -> return-to-worker" }
      ])
    });
  });

  it("filters ledger events by run, task, job, attempt, kind, severity, and timestamp", () => {
    expect(filterOrchestratorLedgerEntries(entries, { runId: "run-1" })).toHaveLength(4);
    expect(filterOrchestratorLedgerEntries(entries, { taskId: "task-1" }).map((entry) => entry.id)).toEqual([
      "ledger-2",
      "ledger-3"
    ]);
    expect(filterOrchestratorLedgerEntries(entries, { jobId: "validator-1" }).map((entry) => entry.id)).toEqual([
      "ledger-3"
    ]);
    expect(filterOrchestratorLedgerEntries(entries, { attempt: 1 })).toHaveLength(2);
    expect(filterOrchestratorLedgerEntries(entries, { eventKind: "approval.requested" })).toHaveLength(1);
    expect(filterOrchestratorLedgerEntries(entries, { severity: "warning" })).toHaveLength(1);
    expect(filterOrchestratorLedgerEntries(entries, { since: "2026-07-09T05:02:30.000Z" }).map((entry) => entry.id)).toEqual([
      "ledger-4",
      "ledger-5"
    ]);
  });

  it("creates compact context checkpoints without raw event payload spam", () => {
    const checkpoint = createOrchestratorContextCheckpoint({
      runId: "run-1",
      entries,
      generatedAt: "2026-07-09T05:05:00.000Z"
    });

    expect(checkpoint).toMatchObject({
      runId: "run-1",
      latestVerdict: "revision-required",
      unresolvedFindingCount: 2,
      changedFiles: ["src/a.ts", "src/a.test.ts"],
      nextActions: ["return-to-worker"],
      excludedRawEventCount: 4
    });
    expect(checkpoint.summaryLines.join(" ")).toContain("Latest validator signal: revision-required.");
    expect(JSON.stringify(checkpoint)).not.toContain("Full agent approval requested.");
    expect(JSON.stringify(checkpoint)).not.toContain("Worker ran command.");
  });

  it("keeps progress classification explicit for UI streams", () => {
    expect(isProgressKind("worker.progress")).toBe(true);
    expect(isProgressKind("validator.reported")).toBe(true);
    expect(isProgressKind("integration.updated")).toBe(true);
    expect(isProgressKind("approval.requested")).toBe(false);
  });

  it("selects visible cleanup queue status from the latest cleanup ledger event per job", () => {
    const cleanup = selectCleanupQueueSummaryForUi([
      ...entries,
      {
        id: "cleanup-running",
        runId: "run-1",
        sequence: 6,
        kind: "cleanup.updated",
        severity: "info",
        message: "Cleanup running.",
        payload: {
          cleanupJobId: "cleanup-1",
          cleanupStatus: "running"
        },
        createdAt: "2026-07-09T05:05:00.000Z"
      },
      {
        id: "cleanup-completed",
        runId: "run-1",
        sequence: 7,
        kind: "cleanup.updated",
        severity: "info",
        message: "Cleanup completed.",
        payload: {
          cleanupJobId: "cleanup-1",
          cleanupStatus: "completed"
        },
        createdAt: "2026-07-09T05:06:00.000Z"
      },
      {
        id: "cleanup-blocked",
        runId: "run-1",
        sequence: 8,
        kind: "cleanup.updated",
        severity: "warning",
        message: "Cleanup blocked.",
        payload: {
          cleanupJobId: "cleanup-2",
          cleanupStatus: "blocked"
        },
        createdAt: "2026-07-09T05:07:00.000Z"
      }
    ], "run-1");

    expect(cleanup).toMatchObject({
      total: 2,
      completed: 1,
      blocked: 1,
      running: 0,
      label: "2 cleanup jobs",
      detail: "2 cleanup jobs; 0 ready; 0 running; 1 blocked; 0 in retention."
    });
  });

  it("selects the latest Markdown-exportable run report from ledger payloads", () => {
    const report = selectLatestOrchestratorRunReportForUi([
      ...entries,
      {
        id: "ledger-report",
        runId: "run-1",
        sequence: 5,
        kind: "run.phase.changed",
        severity: "info",
        message: "Final run report generated.",
        payload: {
          reportId: "run-1:report:2026-07-09T05:06:00.000Z",
          reportMarkdown: "# Orchestrator Run Report: run-1",
          exportFormats: ["markdown"],
          recommendedNextAction: "Approve final merge when ready.",
          summaryJson: {
            acceptedCommitShas: ["abc123", "def456"],
            validationEvidenceCount: 3,
            cleanupStatus: "1 cleanup job; 0 ready; 0 blocked; 0 in retention.",
            finalizationStatus: "ready-for-approval"
          }
        },
        createdAt: "2026-07-09T05:06:00.000Z"
      }
    ], "run-1");

    expect(report).toMatchObject({
      id: "run-1:report:2026-07-09T05:06:00.000Z",
      runId: "run-1",
      markdown: "# Orchestrator Run Report: run-1",
      recommendedNextAction: "Approve final merge when ready.",
      finalizationStatus: "ready-for-approval",
      cleanupStatus: "1 cleanup job; 0 ready; 0 blocked; 0 in retention.",
      acceptedCommitCount: 2,
      validationEvidenceCount: 3,
      exportFormats: ["markdown"]
    });
  });
});
