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
import type { Phase9RunnerApprovalRecord } from "./phase9RunnerApprovalRecord";
import { buildPhase9RunnerApprovalSnapshot } from "./phase9RunnerApproval";
import { buildPhase9RunnerApprovalDepthSummary } from "./phase9RunnerApprovalDepth";
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
  rollbackEvidence: "Phase 8 rollback evidence is attached.",
  detail: "Phase 8 owner audit review is ready."
};

const readyRunnerApprovalRecord: Phase9RunnerApprovalRecord = {
  id: "phase9-runner-approval:2026-06-18T01:00:00.000Z",
  createdAt: "2026-06-18T01:00:00.000Z",
  state: "ready",
  readiness: 100,
  selectedAction: "terminal-readonly-probe",
  auditRecordCount: 2,
  phase8ReviewRecordId: readyPhase8ReviewRecord.id,
  phase8ReviewState: "ready",
  canRequestDesktopProbe: true,
  mutationLocked: true,
  rollbackEvidence: "Phase 9 rollback evidence is attached.",
  detail: "Phase 9 runner approval review is ready."
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
  return {
    id: `terminal:local:${action}:2026-06-11T00:00:00.000Z`,
    action,
    what: "Run terminal command",
    why: "Owner approved the selected read-only probe.",
    provider: "terminal",
    workspace: "current workspace",
    service: "local shell",
    resultSummary: "Terminal read-only probe audit record.",
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
  const evaluation = request
    ? evaluateLiveActionRunnerExecution(
        terminalDefinition,
        request,
        options.now ?? "2026-06-11T00:05:00.000Z",
        options.now ?? "2026-06-11T00:05:00.000Z"
      )
    : undefined;

  return buildPhase9RunnerApprovalSnapshot({
    permissionRequest: request,
    runnerEvaluation: evaluation,
    desktopRunnerResult: options.result ?? desktopResult(),
    auditRecords: options.auditRecords ?? [],
    phase8AuditReviewRecord: options.phase8ReviewRecord ?? readyPhase8ReviewRecord,
    runnerApprovalRecord:
      options.runnerApprovalRecord === null
        ? undefined
        : options.runnerApprovalRecord ?? readyRunnerApprovalRecord,
    evaluatedAt: options.now ?? "2026-06-11T00:05:00.000Z"
  });
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
        : options.runnerApprovalRecord ?? readyRunnerApprovalRecord,
    goals: options.goals ?? remainingGoalPlan
  });
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
    const summary = traceability({ approval });

    expect(summary.state).toBe("ready");
    expect(summary.canTrustRunnerApproval).toBe(true);
    expect(summary.readyCount).toBe(6);
    expect(summary.mutationLockCount).toBeGreaterThanOrEqual(6);
    expect(summary.runnerReviewRecordReady).toBe(true);
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
