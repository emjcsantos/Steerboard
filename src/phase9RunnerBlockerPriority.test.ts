import { describe, expect, it } from "vitest";
import type { LiveActionAuditRecord } from "./liveActionAudit";
import type { LiveActionPermissionRequest } from "./liveActionPermission";
import type { DesktopActionRunnerExecuteResult } from "./desktopActionRunner";
import {
  evaluateLiveActionRunnerExecution,
  LIVE_ACTION_RUNNER_DEFINITIONS
} from "./liveActionRunner";
import type { Phase8AuditReviewRecord } from "./phase8AuditReviewRecord";
import type { Phase8PermissionAuditDepthSnapshot } from "./phase8PermissionAuditDepth";
import {
  buildPhase9RunnerEvidenceFingerprint,
  type Phase9RunnerApprovalRecord
} from "./phase9RunnerApprovalRecord";
import { buildPhase9RunnerApprovalSnapshot } from "./phase9RunnerApproval";
import { buildPhase9RunnerApprovalDepthSummary } from "./phase9RunnerApprovalDepth";
import { buildPhase9RunnerBlockerPriority } from "./phase9RunnerBlockerPriority";
import { buildPhase9RunnerTraceabilitySummary } from "./phase9RunnerTraceability";
import { remainingGoalPlan } from "./remainingGoalPlan";

const terminalDefinition = LIVE_ACTION_RUNNER_DEFINITIONS[0];

const readyPhase8ReviewRecord: Phase8AuditReviewRecord = {
  id: "phase8-audit-review:2026-06-18T00:00:00.000Z",
  createdAt: "2026-06-18T00:00:00.000Z",
  state: "ready",
  readiness: 100,
  auditRecordCount: 8,
  openExceptionCount: 0,
  disabledPathCount: 8,
  mutationLocked: true,
  auditEvidenceFingerprint: "phase8-audit:abcdef12",
  topBlockerLabel: "Owner audit review",
  topBlockerSourceId: "phase-08-permission-audit-depth:owner-audit-review",
  topBlockerKind: "audit-depth",
  topBlockerStatus: "waiting",
  topBlockerAction: "Record Phase 8 owner audit review.",
  rollbackEvidence: "Phase 8 rollback evidence is attached.",
  detail: "Phase 8 owner audit review is ready."
};

function permissionRequest(
  overrides: Partial<LiveActionPermissionRequest> = {}
): LiveActionPermissionRequest {
  return {
    id: "terminal-permission-1",
    provider: "terminal",
    actionLabel: "Run terminal command",
    state: "idle",
    requestedAt: "2026-06-11T00:00:00.000Z",
    timeoutMs: 15 * 60 * 1000,
    expiresAt: "2026-06-11T00:15:00.000Z",
    risk: "high",
    ...overrides
  };
}

function desktopResult(
  overrides: Partial<DesktopActionRunnerExecuteResult> = {}
): DesktopActionRunnerExecuteResult {
  return {
    provider: "terminal",
    intent: "terminal-readonly-probe",
    requestId: "desktop-action-runner-initial",
    status: "unavailable",
    code: "runtime-unavailable",
    canExecute: false,
    summary: "Desktop runner execution is unavailable in browser preview.",
    detail: "Desktop runtime command bridge is not available.",
    evaluatedAt: "2026-06-11T00:00:00.000Z",
    ...overrides
  };
}

function terminalAuditRecord(
  action: LiveActionAuditRecord["action"] = "executed"
): LiveActionAuditRecord {
  const needsRollback = action === "executed" || action === "failed";

  return {
    id: `terminal:local:${action}:2026-06-11T00:00:00.000Z`,
    action,
    what: "Run terminal command",
    why: "Owner approved the selected read-only probe.",
    provider: "terminal",
    workspace: "current workspace",
    service: "local shell",
    resultSummary: needsRollback
      ? "Terminal read-only probe audit record. Rollback: fixed no-mutation contract remains attached."
      : "Terminal read-only probe audit record.",
    timestamp: "2026-06-11T00:00:00.000Z",
    risk: "high"
  };
}

function phase8Snapshot(
  overrides: Partial<Phase8PermissionAuditDepthSnapshot> = {}
): Phase8PermissionAuditDepthSnapshot {
  const state = overrides.state ?? "ready";
  const statusLabel = state === "ready" ? "Ready" : state === "blocked" ? "Blocked" : state === "review" ? "Review" : "Waiting";

  return {
    id: "phase-08-permission-audit-depth",
    label: "Phase 8 permission and audit depth",
    state,
    statusLabel,
    readiness: state === "ready" ? 100 : 0,
    riskyActionCount: 1,
    auditRecordCount: state === "ready" ? 2 : 0,
    disabledPathCount: state === "ready" ? 0 : 1,
    openExceptionCount: state === "ready" ? 0 : 1,
    readyCount: state === "ready" ? 4 : 0,
    reviewCount: state === "review" ? 1 : 0,
    blockedCount: state === "blocked" ? 1 : 0,
    waitingCount: state === "waiting" ? 1 : 0,
    nextAction: state === "ready" ? "Keep Phase 8 ready." : "Resolve Phase 8 blocker before Phase 9.",
    safety: "Phase 8 review only.",
    ariaLabel: "Phase 8 ready.",
    items: [],
    exceptions: [],
    ...overrides
  };
}

function approvalSnapshot(options: {
  request?: LiveActionPermissionRequest;
  result?: DesktopActionRunnerExecuteResult;
  auditRecords?: LiveActionAuditRecord[];
  phase8ReviewRecord?: Phase8AuditReviewRecord;
  runnerApprovalRecord?: Phase9RunnerApprovalRecord | null;
  now?: string;
} = {}) {
  const request = options.request;
  const now = options.now ?? "2026-06-11T00:05:00.000Z";
  const result = options.result ?? desktopResult();
  const auditRecords = options.auditRecords ?? [];
  const phase8ReviewRecord = options.phase8ReviewRecord ?? readyPhase8ReviewRecord;
  const evaluation = request
    ? evaluateLiveActionRunnerExecution(
        terminalDefinition,
        request,
        now,
        now
      )
    : undefined;
  const baseSnapshot = buildPhase9RunnerApprovalSnapshot({
    permissionRequest: request,
    runnerEvaluation: evaluation,
    desktopRunnerResult: result,
    auditRecords,
    phase8AuditReviewRecord: phase8ReviewRecord,
    runnerApprovalRecord: undefined,
    evaluatedAt: now
  });
  const runnerApprovalRecord =
    options.runnerApprovalRecord === null
      ? undefined
      : options.runnerApprovalRecord ?? readyRunnerApprovalRecordForApproval(baseSnapshot);

  return buildPhase9RunnerApprovalSnapshot({
    permissionRequest: request,
    runnerEvaluation: evaluation,
    desktopRunnerResult: result,
    auditRecords,
    phase8AuditReviewRecord: phase8ReviewRecord,
    runnerApprovalRecord,
    evaluatedAt: now
  });
}

function readyRunnerApprovalRecordForApproval(
  approval: ReturnType<typeof buildPhase9RunnerApprovalSnapshot>
): Phase9RunnerApprovalRecord {
  return {
    id: "phase9-runner-approval:2026-06-18T01:00:00.000Z",
    createdAt: "2026-06-18T01:00:00.000Z",
    state: "ready",
    readiness: 100,
    selectedAction: "terminal-readonly-probe",
    auditRecordCount: approval.auditRecordCount,
    phase8ReviewRecordId: readyPhase8ReviewRecord.id,
    phase8ReviewState: "ready",
    phase8ReviewFingerprint: readyPhase8ReviewRecord.auditEvidenceFingerprint,
    phase8ReviewedBlockerLabel: readyPhase8ReviewRecord.topBlockerLabel,
    phase8ReviewedBlockerSourceId: readyPhase8ReviewRecord.topBlockerSourceId,
    phase8ReviewedBlockerKind: readyPhase8ReviewRecord.topBlockerKind,
    phase8ReviewedBlockerStatus: readyPhase8ReviewRecord.topBlockerStatus,
    phase8ReviewedBlockerAction: readyPhase8ReviewRecord.topBlockerAction,
    canRequestDesktopProbe: true,
    mutationLocked: true,
    runnerEvidenceFingerprint: buildPhase9RunnerEvidenceFingerprint(approval),
    rollbackEvidence: "Phase 9 rollback evidence is attached.",
    detail: "Phase 9 runner approval review is ready."
  };
}

function priority({
  approval = approvalSnapshot(),
  phase8 = phase8Snapshot(),
  runnerApprovalRecord,
  goals = remainingGoalPlan
}: {
  approval?: ReturnType<typeof approvalSnapshot>;
  phase8?: Phase8PermissionAuditDepthSnapshot;
  runnerApprovalRecord?: Phase9RunnerApprovalRecord | null;
  goals?: typeof remainingGoalPlan;
} = {}) {
  const depth = buildPhase9RunnerApprovalDepthSummary(approval);
  const traceability = buildPhase9RunnerTraceabilitySummary({
    approval,
    depth,
    phase8,
    runnerReviewRecord:
      runnerApprovalRecord === null
        ? undefined
        : runnerApprovalRecord ?? readyRunnerApprovalRecordForApproval(approval),
    goals
  });

  return buildPhase9RunnerBlockerPriority({
    approval,
    depth,
    phase8,
    traceability
  });
}

function withCurrentPhase9Goal() {
  return remainingGoalPlan.map((goal) =>
    goal.id === "goal-phase-9-runner"
      ? { ...goal, status: "active" as const, current: true }
      : goal.current
        ? { ...goal, current: false }
        : goal
  );
}

describe("phase 9 runner blocker priority", () => {
  it("keeps Phase 8 audit gate blockers ahead of runner approval rows", () => {
    const summary = priority({
      phase8: phase8Snapshot({ state: "blocked", blockedCount: 1, openExceptionCount: 1 })
    });

    expect(summary.state).toBe("blocked");
    expect(summary.topPriorityLabel).toBe("Phase 8 audit gate");
    expect(summary.topPrioritySourceId).toBe(summary.items[0].sourceId);
    expect(summary.topPriorityKind).toBe("phase8-gate");
    expect(summary.topPriorityStatus).toBe("blocked");
    expect(summary.ariaLabel).toContain(`source ${summary.topPrioritySourceId}`);
    expect(summary.ariaLabel).toContain("kind phase8-gate");
    expect(summary.ariaLabel).toContain("status blocked");
    expect(summary.runnerReviewCanAddressTopBlocker).toBe(true);
    expect(summary.items[0]).toMatchObject({
      kind: "phase8-gate",
      status: "blocked",
      severity: "critical",
      priority: 1
    });
  });

  it("ranks owner permission as the top runner blocker after Phase 8 is ready", () => {
    const summary = priority();

    expect(summary.state).toBe("waiting");
    expect(summary.openBlockerCount).toBeGreaterThan(0);
    expect(summary.topPriorityLabel).toBe("Owner permission");
    expect(summary.topPrioritySourceId).toBe("phase-09-desktop-runner-approval:permission");
    expect(summary.topPriorityKind).toBe("approval");
    expect(summary.topPriorityStatus).toBe("waiting");
    expect(summary.items[0]).toMatchObject({
      kind: "approval",
      status: "waiting",
      severity: "medium"
    });
    expect(summary.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Owner approval and window", kind: "approval-depth" }),
        expect.objectContaining({ label: "Runner approval depth", kind: "traceability" })
      ])
    );
  });

  it("surfaces PM traceability gaps after runner approval evidence is ready", () => {
    const goals = remainingGoalPlan.map((goal) =>
      goal.id === "goal-phase-9-runner"
        ? {
            ...goal,
            pmTaskIds: goal.pmTaskIds.filter((taskId) => taskId !== "phase-09-child-traceability")
          }
        : goal
    );
    const summary = priority({
      approval: approvalSnapshot({
        request: permissionRequest({ state: "approved" }),
        result: desktopResult({
          requestId: "terminal-permission-1",
          status: "executed",
          code: "ok",
          canExecute: true,
          summary: "Desktop terminal read-only probe executed through the approved runner contract.",
          detail: "Executed fixed terminal read-only probe command for audit trail."
        }),
        auditRecords: [terminalAuditRecord("approved"), terminalAuditRecord("executed")]
      }),
      goals
    });

    expect(summary.state).toBe("blocked");
    expect(summary.topPriorityLabel).toBe("PM row coverage");
    expect(summary.items[0]).toMatchObject({
      kind: "traceability",
      status: "blocked",
      severity: "critical"
    });
  });

  it("ranks missing persisted runner review before lower-value traceability rows", () => {
    const approval = approvalSnapshot({
      request: permissionRequest({ state: "approved" }),
      result: desktopResult({
        requestId: "terminal-permission-1",
        status: "executed",
        code: "ok",
        canExecute: true,
        summary: "Desktop terminal read-only probe executed through the approved runner contract.",
        detail: "Executed fixed terminal read-only probe command for audit trail."
      }),
      auditRecords: [terminalAuditRecord("approved"), terminalAuditRecord("executed")],
      runnerApprovalRecord: null
    });
    const summary = priority({
      approval,
      runnerApprovalRecord: null
    });

    expect(summary.state).toBe("waiting");
    expect(summary.topPriorityLabel).toBe("Owner runner review");
    expect(summary.items[0]).toMatchObject({
      kind: "approval",
      status: "waiting"
    });
  });

  it("reports ready when Phase 8, approval depth, and traceability are ready", () => {
    const summary = priority({
      approval: approvalSnapshot({
        request: permissionRequest({ state: "approved" }),
        result: desktopResult({
          requestId: "terminal-permission-1",
          status: "executed",
          code: "ok",
          canExecute: true,
          summary: "Desktop terminal read-only probe executed through the approved runner contract.",
          detail: "Executed fixed terminal read-only probe command for audit trail."
        }),
        auditRecords: [terminalAuditRecord("approved"), terminalAuditRecord("executed")]
      }),
      goals: withCurrentPhase9Goal()
    });

    expect(summary.state).toBe("ready");
    expect(summary.openBlockerCount).toBe(0);
    expect(summary.readiness).toBe(100);
    expect(summary.topPriorityLabel).toBe("No open Phase 9 runner blocker");
    expect(summary.topPrioritySourceId).toBe("phase9.runner-blocker.none");
    expect(summary.topPriorityKind).toBe("none");
    expect(summary.topPriorityStatus).toBe("ready");
    expect(summary.ariaLabel).toContain("source phase9.runner-blocker.none");
    expect(summary.ariaLabel).toContain("kind none");
    expect(summary.ariaLabel).toContain("status ready");
  });

  it("keeps Phase 9 blocker-priority text public-safe", () => {
    const summary = priority({
      approval: approvalSnapshot({
        request: permissionRequest({
          state: "approved",
          actionLabel: "Run C:\\Users\\MJ\\secret.ps1 with token sk-ABCDEF1234567890 <unsafe>"
        })
      })
    });
    const combinedText = [
      summary.label,
      summary.ariaLabel,
      summary.nextAction,
      summary.safety,
      ...summary.items.flatMap((item) => [
        item.label,
        item.kind,
        item.status,
        item.severity,
        item.detail,
        item.nextAction
      ])
    ].join(" ");

    expect(combinedText).not.toMatch(/[A-Za-z]:[\\/]/);
    expect(combinedText).not.toMatch(/[\\/](Users|Projects|Documents|Desktop)[\\/]/i);
    expect(combinedText).not.toContain("sk-ABCDEF1234567890");
    expect(combinedText).not.toContain("<");
    expect(combinedText).not.toContain(">");
  });
});
