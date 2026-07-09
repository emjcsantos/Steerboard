import { describe, expect, it } from "vitest";
import {
  createBoundedOrchestratorRun,
  createOrchestratorBackendState,
  processAllQueuedOrchestratorEvents
} from "./orchestratorBackend";
import {
  DEFAULT_REMOTE_POLICY,
  evaluateFinalizationGates,
  evaluateRemotePushGates,
  generateOrchestratorRunReport,
  recordRemotePushFailure
} from "./orchestratorFinalReport";
import { DEFAULT_PM_TASK_BUDGET, createPmTaskTemplateSnapshot, type PmWorkerReadyTask } from "./pmLaneWorkerReady";
import type { AcceptedWorkerCommit } from "./orchestratorIntegration";
import type { OrchestratorArtifact } from "./orchestratorArtifacts";
import { createCleanupJob, summarizeCleanupQueue } from "./orchestratorCleanup";

const createdAt = "2026-07-09T11:00:00.000Z";

function state() {
  return createBoundedOrchestratorRun(createOrchestratorBackendState(), {
    id: "run-123",
    projectId: "steerboard",
    scope: { mode: "task-list", taskIds: ["task-1"] },
    baseBranch: "main",
    createdAt
  });
}

function task(id = "task-1"): PmWorkerReadyTask {
  return {
    id,
    title: "Final report",
    objective: "Generate report.",
    ownedFiles: ["src/orchestratorFinalReport.ts"],
    forbiddenFiles: [],
    dependencies: [],
    acceptanceCriteria: ["Report exports Markdown."],
    validationCommands: ["npm.cmd run test -- src/orchestratorFinalReport.test.ts"],
    rollbackPlan: "Remove final report module.",
    budget: { ...DEFAULT_PM_TASK_BUDGET },
    priority: "normal",
    capabilityProfile: "workspace-write",
    evidenceKinds: ["unit-test"],
    provenance: {
      origin: "orchestrator",
      labels: ["orchestrator-created", "corrective"]
    },
    templateSnapshot: createPmTaskTemplateSnapshot({
      taskId: id,
      templateId: "final-report",
      resolvedAt: createdAt,
      templateJson: {}
    }),
    status: "queued",
    createdAt,
    sequence: 1
  };
}

function commit(): AcceptedWorkerCommit {
  return {
    taskId: "task-1",
    workerJobId: "worker-1",
    branch: "codex/orch/task-1",
    commitSha: "abc123",
    committedAt: createdAt,
    validationReportId: "report-1",
    commandEvidence: ["npm.cmd run test"]
  };
}

function artifact(): OrchestratorArtifact {
  return {
    id: "artifact-1",
    runId: "run-123",
    taskId: "task-1",
    kind: "validator-report",
    path: ".steerboard/artifacts/run-123/task-1/artifact-1.md",
    sha256: "a".repeat(64),
    sizeBytes: 100,
    createdAt
  };
}

describe("orchestrator final report and remote policy", () => {
  it("generates a Markdown final run report from durable state inputs", () => {
    const run = state().runs[0];
    const cleanupJob = createCleanupJob({
      id: "cleanup-1",
      runId: "run-123",
      kind: "worker-worktree",
      path: ".steerboard/worktrees/task-1",
      reason: "Retention",
      createdAt
    });
    const finalization = evaluateFinalizationGates({
      integrationValidationPassed: true,
      unresolvedCorrectiveTaskIds: [],
      blockerIds: [],
      targetBranchClean: true,
      expectedBaseMatches: true,
      userApprovedFinalMerge: false
    });
    const report = generateOrchestratorRunReport({
      run,
      tasks: [task()],
      acceptedCommits: [commit()],
      artifacts: [artifact()],
      correctiveTasks: [],
      blockerIds: [],
      ledger: [],
      cleanupJobs: [cleanupJob],
      cleanupSummary: summarizeCleanupQueue([cleanupJob]),
      finalization,
      generatedAt: createdAt
    });

    expect(report.summaryJson).toMatchObject({
      taskScope: ["task-1"],
      completedTaskIds: ["task-1"],
      acceptedCommitShas: ["abc123"],
      integrationBranch: "codex/orch/integration/run-123",
      validationEvidenceCount: 1,
      cleanupStatus: "1 cleanup job; 0 ready; 0 blocked; 1 in retention.",
      finalizationStatus: "ready-for-approval",
      recommendedNextAction: "Approve final merge when ready."
    });
    expect(report.markdown).toContain("# Orchestrator Run Report: run-123");
    expect(report.markdown).toContain("## Accepted Worker Commits");
    expect(report.markdown).toContain("abc123 task-1 codex/orch/task-1");
    expect(report.markdown).toContain("## Finalization");
  });

  it("requires explicit user approval before final merge", () => {
    expect(
      evaluateFinalizationGates({
        integrationValidationPassed: true,
        unresolvedCorrectiveTaskIds: [],
        blockerIds: [],
        targetBranchClean: true,
        expectedBaseMatches: true,
        userApprovedFinalMerge: false
      })
    ).toMatchObject({
      status: "ready-for-approval",
      canMergeToTarget: false,
      missingGateIds: ["user-approval"]
    });
    expect(
      evaluateFinalizationGates({
        integrationValidationPassed: true,
        unresolvedCorrectiveTaskIds: [],
        blockerIds: [],
        targetBranchClean: true,
        expectedBaseMatches: true,
        userApprovedFinalMerge: true
      })
    ).toMatchObject({
      status: "approved",
      canMergeToTarget: true
    });
  });

  it("blocks finalization when validation, corrective tasks, blockers, target cleanliness, or base drift fail", () => {
    expect(
      evaluateFinalizationGates({
        integrationValidationPassed: false,
        unresolvedCorrectiveTaskIds: ["task-corrective"],
        blockerIds: ["blocker-1"],
        targetBranchClean: false,
        expectedBaseMatches: false,
        userApprovedFinalMerge: true
      })
    ).toMatchObject({
      status: "blocked",
      canMergeToTarget: false,
      missingGateIds: [
        "integration-validation",
        "corrective-tasks",
        "blockers",
        "target-branch-clean",
        "expected-base"
      ]
    });
  });

  it("keeps remote push manual by default and allows automatic push only when all gates pass", () => {
    expect(
      evaluateRemotePushGates({
        policy: DEFAULT_REMOTE_POLICY,
        integrationValidationPassed: true,
        branchCommitted: true,
        remoteConfigured: true,
        secretsDetected: false,
        projectAllowsPush: true
      })
    ).toMatchObject({
      canPush: false,
      mode: "manual",
      missingGateIds: ["automatic-push-disabled"]
    });
    expect(
      evaluateRemotePushGates({
        policy: { ...DEFAULT_REMOTE_POLICY, pushMode: "automatic" },
        integrationValidationPassed: true,
        branchCommitted: true,
        remoteConfigured: true,
        secretsDetected: false,
        projectAllowsPush: true
      })
    ).toMatchObject({
      canPush: true,
      mode: "automatic",
      missingGateIds: []
    });
  });

  it("records push failures as ledger events and reportable integration evidence", () => {
    const next = recordRemotePushFailure(state(), {
      runId: "run-123",
      branch: "codex/orch/integration/run-123",
      remote: "origin",
      error: "remote disabled",
      createdAt
    });
    const processed = processAllQueuedOrchestratorEvents(next, "2026-07-09T11:01:00.000Z");

    expect(processed.ledger.at(-1)).toMatchObject({
      kind: "integration.updated",
      message: "Remote push failed."
    });
    expect(processed.ledger.at(-1)?.payload).toMatchObject({
      branch: "codex/orch/integration/run-123",
      remote: "origin",
      error: "remote disabled"
    });
  });
});
