import { describe, expect, it } from "vitest";
import {
  createBoundedOrchestratorRun,
  createOrchestratorBackendState,
  enqueueOrchestratorCommand,
  enqueueOrchestratorEvent,
  processAllQueuedOrchestratorEvents
} from "./orchestratorBackend";
import {
  DEFAULT_REMOTE_POLICY,
  applyFinalizationRuntimeCommandResult,
  enqueueFinalRunReportIfReady,
  evaluateFinalizationGates,
  evaluateRemotePushGates,
  generateOrchestratorRunReport,
  queueFinalMergeAfterApproval,
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

  it("queues approval evidence instead of final merge when user approval is missing", () => {
    const result = queueFinalMergeAfterApproval({
      backendState: state(),
      runId: "run-123",
      targetBranch: "codex/steerboard-orchestrator-backend",
      integrationValidationPassed: true,
      unresolvedCorrectiveTaskIds: [],
      blockerIds: [],
      targetBranchClean: true,
      expectedBaseMatches: true,
      userApprovedFinalMerge: false,
      createdAt
    });

    expect(result).toMatchObject({
      queued: false,
      approvalRequired: true,
      detail: "Final merge requires explicit user approval."
    });
    expect(result.backendState.commandQueue).toEqual([]);
    expect(result.backendState.eventQueue[0]).toMatchObject({
      kind: "approval.requested",
      payload: {
        phase: "Final merge requires explicit approval.",
        integrationBranch: "codex/orch/integration/run-123",
        targetBranch: "codex/steerboard-orchestrator-backend",
        finalMergeRequiresApproval: true
      }
    });
  });

  it("queues final merge only after approval and passing finalization gates", () => {
    const result = queueFinalMergeAfterApproval({
      backendState: state(),
      runId: "run-123",
      targetBranch: "codex/steerboard-orchestrator-backend",
      integrationValidationPassed: true,
      unresolvedCorrectiveTaskIds: [],
      blockerIds: [],
      targetBranchClean: true,
      expectedBaseMatches: true,
      userApprovedFinalMerge: true,
      createdAt
    });

    expect(result).toMatchObject({
      queued: true,
      approvalRequired: false
    });
    expect(result.backendState.eventQueue[0]).toMatchObject({
      kind: "approval.requested",
      payload: {
        phase: "Final merge approved.",
        userApprovedFinalMerge: true,
        finalMergeRequiresApproval: true
      }
    });
    expect(result.backendState.commandQueue[0]).toMatchObject({
      kind: "finalization.merge",
      payload: {
        integrationBranch: "codex/orch/integration/run-123",
        targetBranch: "codex/steerboard-orchestrator-backend",
        userApprovedFinalMerge: true,
        pushMode: "manual",
        finalMergeRequiresApproval: true
      }
    });
  });

  it("records completed final merge and keeps remote push manual by default", () => {
    const queued = queueFinalMergeAfterApproval({
      backendState: state(),
      runId: "run-123",
      targetBranch: "codex/steerboard-orchestrator-backend",
      integrationValidationPassed: true,
      unresolvedCorrectiveTaskIds: [],
      blockerIds: [],
      targetBranchClean: true,
      expectedBaseMatches: true,
      userApprovedFinalMerge: true,
      createdAt
    });
    const applied = applyFinalizationRuntimeCommandResult({
      backendState: queued.backendState,
      command: queued.backendState.commandQueue[0],
      result: {
        commandId: queued.backendState.commandQueue[0].id,
        runId: "run-123",
        kind: "finalization.merge",
        executed: true,
        blocked: false,
        artifactPaths: [],
        steps: [],
        detail: "Final merge completed.",
        structuredOutput: {
          mergeCommitSha: "merge123"
        }
      },
      createdAt: "2026-07-09T11:02:00.000Z"
    });

    expect(applied).toMatchObject({
      completed: true,
      remoteQueued: false,
      failed: false,
      detail: "Final merge completed; remote push remained gated by policy."
    });

    const processed = processAllQueuedOrchestratorEvents(
      applied?.backendState ?? queued.backendState,
      "2026-07-09T11:03:00.000Z"
    );

    expect(processed.runs[0]).toMatchObject({
      status: "completed",
      phase: "Remote push gated."
    });
    expect(processed.ledger.at(-2)).toMatchObject({
      kind: "integration.updated",
      message: "Final merge completed."
    });
    expect(processed.ledger.at(-1)).toMatchObject({
      kind: "integration.updated",
      message: "Remote push gated.",
      payload: {
        pushMode: "manual",
        missingGateIds: ["automatic-push-disabled"]
      }
    });
  });

  it("queues automatic remote push only when project policy explicitly enables it", () => {
    const queued = queueFinalMergeAfterApproval({
      backendState: state(),
      runId: "run-123",
      targetBranch: "codex/steerboard-orchestrator-backend",
      integrationValidationPassed: true,
      unresolvedCorrectiveTaskIds: [],
      blockerIds: [],
      targetBranchClean: true,
      expectedBaseMatches: true,
      userApprovedFinalMerge: true,
      remotePolicy: { ...DEFAULT_REMOTE_POLICY, pushMode: "automatic" },
      createdAt
    });
    const applied = applyFinalizationRuntimeCommandResult({
      backendState: queued.backendState,
      command: queued.backendState.commandQueue[0],
      result: {
        commandId: queued.backendState.commandQueue[0].id,
        runId: "run-123",
        kind: "finalization.merge",
        executed: true,
        blocked: false,
        artifactPaths: [],
        steps: [],
        detail: "Final merge completed.",
        structuredOutput: {
          mergeCommitSha: "merge123"
        }
      },
      createdAt: "2026-07-09T11:02:00.000Z"
    });

    expect(applied?.remoteQueued).toBe(true);
    expect(applied?.backendState.commandQueue.at(-1)).toMatchObject({
      kind: "remote.push",
      payload: {
        remote: "origin",
        branch: "codex/steerboard-orchestrator-backend",
        pushMode: "automatic",
        mergeCommitSha: "merge123"
      }
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

  it("queues a Markdown-exportable final report event from durable run state", () => {
    const withIntegrationCommand = enqueueOrchestratorCommand(state(), {
      id: "run-123:integration:start",
      runId: "run-123",
      kind: "integration.start",
      payload: {
        integrationBranch: "codex/orch/integration/run-123",
        acceptedCommits: [
          {
            taskId: "task-1",
            workerJobId: "worker-1",
            branch: "codex/orch/task-1",
            worktreePath: ".steerboard/worktrees/task-1",
            commitSha: "abc123",
            validationReportId: "report-1"
          }
        ],
        commitShas: ["abc123"],
        finalMergeRequiresApproval: true
      },
      enqueuedAt: createdAt
    });
    const readyState = processAllQueuedOrchestratorEvents(
      enqueueOrchestratorEvent(withIntegrationCommand, {
        id: "run-123:ready",
        runId: "run-123",
        kind: "integration.updated",
        payload: {
          phase: "Integration branch ready for finalization.",
          runStatus: "ready-for-finalization",
          integrationBranch: "codex/orch/integration/run-123",
          commitShas: ["abc123"],
          finalMergeRequiresApproval: true
        },
        enqueuedAt: createdAt
      }),
      "2026-07-09T11:01:00.000Z"
    );
    const result = enqueueFinalRunReportIfReady({
      backendState: readyState,
      artifacts: [artifact()],
      generatedAt: "2026-07-09T11:02:00.000Z"
    });

    expect(result.queued).toBe(true);
    expect(result.report?.summaryJson).toMatchObject({
      taskScope: ["task-1"],
      completedTaskIds: ["task-1"],
      acceptedCommitShas: ["abc123"],
      finalizationStatus: "ready-for-approval",
      recommendedNextAction: "Approve final merge when ready."
    });

    const processed = processAllQueuedOrchestratorEvents(result.backendState, "2026-07-09T11:03:00.000Z");

    expect(processed.ledger.at(-1)).toMatchObject({
      kind: "run.phase.changed",
      message: "Final run report generated."
    });
    expect(processed.ledger.at(-1)?.payload).toMatchObject({
      reportMarkdown: expect.stringContaining("# Orchestrator Run Report: run-123"),
      exportFormats: ["markdown"],
      recommendedNextAction: "Approve final merge when ready."
    });
  });

  it("uses cleanup ledger updates when summarizing final report cleanup status", () => {
    const cleanupJob = createCleanupJob({
      id: "cleanup-1",
      runId: "run-123",
      taskId: "task-1",
      jobId: "worker-1",
      kind: "worker-worktree",
      path: ".steerboard/worktrees/task-1",
      reason: "Integrated",
      createdAt
    });
    const withCommands = enqueueOrchestratorCommand(
      enqueueOrchestratorCommand(state(), {
        id: "run-123:integration:start",
        runId: "run-123",
        kind: "integration.start",
        payload: {
          integrationBranch: "codex/orch/integration/run-123",
          acceptedCommits: [
            {
              taskId: "task-1",
              workerJobId: "worker-1",
              branch: "codex/orch/task-1",
              commitSha: "abc123",
              validationReportId: "report-1"
            }
          ],
          commitShas: ["abc123"],
          finalMergeRequiresApproval: true
        },
        enqueuedAt: createdAt
      }),
      {
        id: "cleanup-1:start",
        runId: "run-123",
        kind: "cleanup.start",
        payload: { ...cleanupJob },
        enqueuedAt: createdAt
      }
    );
    const readyAndCleaned = processAllQueuedOrchestratorEvents(
      enqueueOrchestratorEvent(
        enqueueOrchestratorEvent(withCommands, {
          id: "run-123:ready",
          runId: "run-123",
          kind: "integration.updated",
          payload: {
            phase: "Integration branch ready for finalization.",
            runStatus: "ready-for-finalization"
          },
          enqueuedAt: createdAt
        }),
        {
          id: "cleanup-1:completed",
          runId: "run-123",
          kind: "cleanup.updated",
          payload: {
            phase: "Cleanup completed for worker-worktree.",
            cleanupJobId: "cleanup-1",
            cleanupStatus: "completed",
            completedAt: "2026-07-09T11:03:00.000Z",
            deletionResult: "Removed worktree."
          },
          enqueuedAt: "2026-07-09T11:03:00.000Z"
        }
      ),
      "2026-07-09T11:04:00.000Z"
    );
    const result = enqueueFinalRunReportIfReady({
      backendState: readyAndCleaned,
      artifacts: [],
      generatedAt: "2026-07-09T11:05:00.000Z"
    });

    expect(result.report?.summaryJson.cleanupStatus).toBe("1 cleanup job; 0 ready; 0 blocked; 0 in retention.");
    expect(result.report?.markdown).toContain("1 cleanup job; 0 ready; 0 blocked; 0 in retention.");
  });
});
