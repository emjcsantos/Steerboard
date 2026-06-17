import { describe, expect, it } from "vitest";
import type { LiveActionAuditRecord } from "./liveActionAudit";
import type { LiveActionPermissionRequest } from "./liveActionPermission";
import type { DesktopActionRunnerExecuteResult } from "./desktopActionRunner";
import {
  evaluateLiveActionRunnerExecution,
  LIVE_ACTION_RUNNER_DEFINITIONS
} from "./liveActionRunner";
import type { Phase8PermissionAuditDepthSnapshot } from "./phase8PermissionAuditDepth";
import { buildPhase9RunnerApprovalSnapshot } from "./phase9RunnerApproval";
import { buildPhase9RunnerApprovalDepthSummary } from "./phase9RunnerApprovalDepth";
import { buildPhase9RunnerBlockerPriority } from "./phase9RunnerBlockerPriority";
import { buildPhase9RunnerTraceabilitySummary } from "./phase9RunnerTraceability";
import { remainingGoalPlan } from "./remainingGoalPlan";

const terminalDefinition = LIVE_ACTION_RUNNER_DEFINITIONS[0];

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
    evaluatedAt: options.now ?? "2026-06-11T00:05:00.000Z"
  });
}

function priority({
  approval = approvalSnapshot(),
  phase8 = phase8Snapshot(),
  goals = remainingGoalPlan
}: {
  approval?: ReturnType<typeof approvalSnapshot>;
  phase8?: Phase8PermissionAuditDepthSnapshot;
  goals?: typeof remainingGoalPlan;
} = {}) {
  const depth = buildPhase9RunnerApprovalDepthSummary(approval);
  const traceability = buildPhase9RunnerTraceabilitySummary({
    approval,
    depth,
    phase8,
    goals
  });

  return buildPhase9RunnerBlockerPriority({
    approval,
    depth,
    phase8,
    traceability
  });
}

describe("phase 9 runner blocker priority", () => {
  it("keeps Phase 8 audit gate blockers ahead of runner approval rows", () => {
    const summary = priority({
      phase8: phase8Snapshot({ state: "blocked", blockedCount: 1, openExceptionCount: 1 })
    });

    expect(summary.state).toBe("blocked");
    expect(summary.topPriorityLabel).toBe("Phase 8 audit gate");
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
      })
    });

    expect(summary.state).toBe("ready");
    expect(summary.openBlockerCount).toBe(0);
    expect(summary.readiness).toBe(100);
    expect(summary.topPriorityLabel).toBe("No open Phase 9 runner blocker");
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
