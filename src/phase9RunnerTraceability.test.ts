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
import {
  buildPhase9DesktopProbeGate,
  buildPhase9RunnerTraceabilitySummary
} from "./phase9RunnerTraceability";
import { currentProjectManagementPhasePlanTaskIds } from "./projectManagementPhasePlan";
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

function phase8Snapshot(
  overrides: Partial<Phase8PermissionAuditDepthSnapshot> = {}
): Phase8PermissionAuditDepthSnapshot {
  return {
    id: "phase-08-permission-audit-depth",
    label: "Phase 8 permission and audit depth",
    state: "ready",
    statusLabel: "Ready",
    readiness: 100,
    riskyActionCount: 3,
    auditRecordCount: 3,
    disabledPathCount: 7,
    openExceptionCount: 0,
    readyCount: 7,
    reviewCount: 0,
    blockedCount: 0,
    waitingCount: 0,
    nextAction: "Keep permission, approval, evidence, and rollback explanations visible.",
    safety: "Phase 8 review only.",
    ariaLabel: "Phase 8 ready.",
    items: [],
    exceptions: [],
    ...overrides
  };
}

function traceability(options: {
  approval?: ReturnType<typeof approvalSnapshot>;
  phase8?: Phase8PermissionAuditDepthSnapshot;
  runnerApprovalRecord?: Phase9RunnerApprovalRecord | null;
  goals?: typeof remainingGoalPlan;
} = {}) {
  const approval = options.approval ?? approvalSnapshot();
  const depth = buildPhase9RunnerApprovalDepthSummary(approval);

  return buildPhase9RunnerTraceabilitySummary({
    approval,
    depth,
    phase8: options.phase8 ?? phase8Snapshot(),
    runnerReviewRecord:
      options.runnerApprovalRecord === null
        ? undefined
        : options.runnerApprovalRecord ?? readyRunnerApprovalRecordForApproval(approval),
    goals: options.goals ?? remainingGoalPlan
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

function withCurrentNextPhase9Goal() {
  return remainingGoalPlan.map((goal) =>
    goal.id === "goal-phase-9-runner"
      ? { ...goal, current: true }
      : goal.current
        ? { ...goal, current: false }
        : goal
  );
}

function withDuplicateCurrentActivePhase9Goal() {
  return remainingGoalPlan.map((goal) =>
    goal.id === "goal-phase-9-runner"
      ? { ...goal, status: "active" as const, current: true }
      : goal
  );
}

describe("phase 9 runner traceability", () => {
  it("links the Phase 9 goal, PM child rows, Phase 8 gate, approval depth, and mutation lock", () => {
    const summary = traceability();

    expect(summary.linkedGoalId).toBe("goal-phase-9-runner");
    expect(summary.linkedPmTaskCount).toBeGreaterThanOrEqual(9);
    expect(summary.missingPmTaskIds).toEqual([]);
    expect(summary.items.map((item) => item.kind)).toEqual([
      "active-goal",
      "pm-coverage",
      "phase8-gate",
      "approval-depth",
      "runner-review-record",
      "mutation-lock"
    ]);
    expect(summary.state).toBe("waiting");
    expect(summary.canTrustRunnerApproval).toBe(false);
    expect(summary.runnerTraceabilityProof).toContain("items=6/6");
    expect(summary.runnerTraceabilityProof).toContain("pmLinks=9/9");
    expect(summary.runnerTraceabilityProof).toContain("runnerReview=ready");
    expect(summary.runnerTraceabilityProof).toContain("trust=held");
    expect(summary.runnerTraceabilityProof).toContain("execution=locked");
    expect(summary.safety).toContain("evidence-only");
  });

  it("blocks when the Phase 9 goal misses a required PM child link", () => {
    const goals = remainingGoalPlan.map((goal) =>
      goal.id === "goal-phase-9-runner"
        ? {
            ...goal,
            pmTaskIds: goal.pmTaskIds.filter((taskId) => taskId !== "phase-09-child-traceability")
          }
        : goal
    );
    const summary = traceability({ goals });

    expect(summary.state).toBe("blocked");
    expect(summary.missingPmTaskIds).toEqual(["phase-09-child-traceability"]);
    expect(summary.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "pm-coverage",
          status: "blocked"
        })
      ])
    );
  });

  it("blocks when the Phase 9 goal misses the blocker-priority PM child link", () => {
    const goals = remainingGoalPlan.map((goal) =>
      goal.id === "goal-phase-9-runner"
        ? {
            ...goal,
            pmTaskIds: goal.pmTaskIds.filter(
              (taskId) => taskId !== "phase-09-child-blocker-priority"
            )
          }
        : goal
    );
    const summary = traceability({ goals });

    expect(summary.state).toBe("blocked");
    expect(summary.canTrustRunnerApproval).toBe(false);
    expect(summary.missingPmTaskIds).toEqual(["phase-09-child-blocker-priority"]);
  });

  it("blocks when a required Phase 9 PM row is missing from the current board plan", () => {
    currentProjectManagementPhasePlanTaskIds.delete("phase-09-child-blocker-priority");

    try {
      const summary = traceability();

      expect(summary.state).toBe("blocked");
      expect(summary.canTrustRunnerApproval).toBe(false);
      expect(summary.missingPmTaskIds).toEqual(["phase-09-child-blocker-priority"]);
    } finally {
      currentProjectManagementPhasePlanTaskIds.add("phase-09-child-blocker-priority");
    }
  });

  it("blocks when Phase 8 permission or audit blockers remain", () => {
    const summary = traceability({
      phase8: phase8Snapshot({
        state: "blocked",
        statusLabel: "Blocked",
        blockedCount: 1,
        openExceptionCount: 1,
        nextAction: "Resolve Phase 8 blocker before Phase 9."
      })
    });

    expect(summary.state).toBe("blocked");
    expect(summary.phase8OpenExceptionCount).toBe(1);
    expect(summary.nextAction).toBe("Resolve Phase 8 blocker before Phase 9.");
  });

  it("trusts runner approval only after approval depth and Phase 8 are ready", () => {
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
      auditRecords: [terminalAuditRecord("approved"), terminalAuditRecord("executed")]
    });
    const summary = traceability({ approval, goals: withCurrentPhase9Goal() });

    expect(summary.state).toBe("ready");
    expect(summary.canTrustRunnerApproval).toBe(true);
    expect(summary.readyCount).toBe(6);
    expect(summary.mutationLockCount).toBeGreaterThanOrEqual(6);
    expect(summary.runnerReviewRecordReady).toBe(true);
    expect(summary.runnerTraceabilityProof).toContain("ready=6");
    expect(summary.runnerTraceabilityProof).toContain("mutationLocks=6/6");
    expect(summary.runnerTraceabilityProof).toContain("trust=ready");
    expect(buildPhase9DesktopProbeGate(approval, summary)).toMatchObject({
      state: "ready",
      readiness: 100,
      canRun: true,
      holdReason: "Run a fixed read-only terminal probe through the desktop runner.",
      phase9RequestGateProof: expect.stringContaining(
        "phase9RequestGateProof=state=ready"
      )
    });
    expect(buildPhase9DesktopProbeGate(approval, summary).phase9RequestGateProof).toContain(
      "canRun=yes"
    );
  });

  it("keeps the desktop probe held when Phase 9 approval is not request-ready", () => {
    const approval = approvalSnapshot();
    const summary = traceability({ approval, goals: withCurrentPhase9Goal() });

    expect(approval.canRequestDesktopProbe).toBe(false);
    expect(buildPhase9DesktopProbeGate(approval, summary)).toMatchObject({
      state: "waiting",
      canRun: false,
      holdReason: "Request owner approval for the fixed terminal read-only probe.",
      phase9RequestGateProof: expect.stringContaining("approvalGate=held")
    });
  });

  it("does not trust runner approval when Phase 9 is current but still next", () => {
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
      auditRecords: [terminalAuditRecord("approved"), terminalAuditRecord("executed")]
    });
    const summary = traceability({ approval, goals: withCurrentNextPhase9Goal() });

    expect(summary.state).toBe("waiting");
    expect(summary.canTrustRunnerApproval).toBe(false);
    expect(buildPhase9DesktopProbeGate(approval, summary)).toMatchObject({
      state: "waiting",
      canRun: false,
      holdReason: expect.stringContaining("goal-phase-9-runner is next"),
      phase9RequestGateProof: expect.stringContaining("traceability=held")
    });
    expect(summary.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "active-goal", status: "waiting" })
      ])
    );
  });

  it("does not trust runner approval when Phase 9 duplicates the current active goal", () => {
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
      auditRecords: [terminalAuditRecord("approved"), terminalAuditRecord("executed")]
    });
    const summary = traceability({ approval, goals: withDuplicateCurrentActivePhase9Goal() });

    expect(summary.state).toBe("review");
    expect(summary.canTrustRunnerApproval).toBe(false);
    expect(buildPhase9DesktopProbeGate(approval, summary)).toMatchObject({
      state: "review",
      canRun: false
    });
    expect(summary.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "active-goal",
          status: "review",
          detail: expect.stringContaining("2 current active goals"),
          nextAction: expect.stringContaining("exactly one current active remaining goal")
        })
      ])
    );
  });

  it("does not trust runner approval without persisted runner review evidence", () => {
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
    const summary = traceability({ approval, runnerApprovalRecord: null });

    expect(summary.state).toBe("waiting");
    expect(summary.canTrustRunnerApproval).toBe(false);
    expect(summary.runnerReviewRecordReady).toBe(false);
    expect(summary.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "runner-review-record",
          status: "waiting"
        })
      ])
    );
  });

  it("does not mark a stale persisted runner review record ready", () => {
    const approvedInputs = {
      request: permissionRequest({ state: "approved" }),
      result: desktopResult({
        requestId: "terminal-permission-1",
        status: "executed" as const,
        code: "ok",
        canExecute: true,
        summary: "Desktop terminal read-only probe executed through the approved runner contract.",
        detail: "Executed fixed terminal read-only probe command for audit trail."
      }),
      auditRecords: [terminalAuditRecord("approved"), terminalAuditRecord("executed")]
    };
    const currentApproval = approvalSnapshot(approvedInputs);
    const staleRecord: Phase9RunnerApprovalRecord = {
      ...readyRunnerApprovalRecordForApproval(currentApproval),
      runnerEvidenceFingerprint: "phase-9-runner-evidence:stale"
    };
    const staleApproval = approvalSnapshot({
      ...approvedInputs,
      runnerApprovalRecord: staleRecord
    });
    const summary = traceability({
      approval: staleApproval,
      runnerApprovalRecord: staleRecord
    });

    expect(staleApproval.state).toBe("review");
    expect(summary.state).toBe("review");
    expect(summary.canTrustRunnerApproval).toBe(false);
    expect(summary.runnerReviewRecordReady).toBe(false);
    expect(summary.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "runner-review-record",
          status: "review",
          detail: expect.stringContaining("does not match current runner evidence")
        })
      ])
    );
  });

  it("keeps traceability text public-safe", () => {
    const summary = traceability({
      goals: remainingGoalPlan.map((goal) =>
        goal.id === "goal-phase-9-runner"
          ? {
              ...goal,
              nextAction:
                "Open C:\\Users\\MJ\\Projects\\ProjectAtlas\\secret.md with token sk-ABCDEF1234567890 <unsafe>"
            }
          : goal
      )
    });
    const combinedText = [
      summary.label,
      summary.nextAction,
      summary.safety,
      summary.ariaLabel,
      ...summary.items.flatMap((item) => [item.label, item.detail, item.nextAction])
    ].join(" ");

    expect(combinedText).not.toMatch(/[A-Za-z]:[\\/]/);
    expect(combinedText).not.toMatch(/[\\/](Users|Projects|Documents|Desktop)[\\/]/i);
    expect(combinedText).not.toContain("sk-ABCDEF1234567890");
    expect(combinedText).not.toContain("<");
    expect(combinedText).not.toContain(">");
  });
});
