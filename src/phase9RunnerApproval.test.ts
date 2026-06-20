import { describe, expect, it } from "vitest";
import type { LiveActionAuditRecord } from "./liveActionAudit";
import type { LiveActionPermissionRequest } from "./liveActionPermission";
import type { Phase8AuditReviewRecord } from "./phase8AuditReviewRecord";
import {
  buildPhase9RunnerEvidenceFingerprint,
  type Phase9RunnerApprovalRecord
} from "./phase9RunnerApprovalRecord";
import {
  buildDesktopActionRunnerBrowserFallbackResult,
  type DesktopActionRunnerExecuteResult
} from "./desktopActionRunner";
import {
  evaluateLiveActionRunnerExecution,
  LIVE_ACTION_RUNNER_DEFINITIONS
} from "./liveActionRunner";
import { buildPhase9RunnerApprovalSnapshot } from "./phase9RunnerApproval";

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
  action: LiveActionAuditRecord["action"] = "requested"
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

function snapshot(options: {
  request?: LiveActionPermissionRequest;
  result?: DesktopActionRunnerExecuteResult;
  auditRecords?: LiveActionAuditRecord[];
  phase8ReviewRecord?: Phase8AuditReviewRecord | null;
  runnerApprovalRecord?: Phase9RunnerApprovalRecord | null;
  now?: string;
} = {}) {
  const request = options.request;
  const now = options.now ?? "2026-06-11T00:05:00.000Z";
  const result = options.result ?? desktopResult();
  const auditRecords = options.auditRecords ?? [];
  const phase8AuditReviewRecord =
    options.phase8ReviewRecord === null
      ? undefined
      : options.phase8ReviewRecord ?? readyPhase8ReviewRecord;
  const evaluation = request
    ? evaluateLiveActionRunnerExecution(
        terminalDefinition,
        request,
        now,
        now
      )
    : undefined;
  const runnerApprovalRecord =
    options.runnerApprovalRecord === null
      ? undefined
      : options.runnerApprovalRecord ??
        readyRunnerApprovalRecordFor({
          request,
          evaluation,
          result,
          auditRecords,
          phase8AuditReviewRecord,
          now
        });

  return buildPhase9RunnerApprovalSnapshot({
    permissionRequest: request,
    runnerEvaluation: evaluation,
    desktopRunnerResult: result,
    auditRecords,
    phase8AuditReviewRecord,
    runnerApprovalRecord,
    evaluatedAt: now
  });
}

function readyRunnerApprovalRecordFor({
  request,
  evaluation,
  result,
  auditRecords,
  phase8AuditReviewRecord,
  now,
  overrides = {}
}: {
  request?: LiveActionPermissionRequest;
  evaluation?: ReturnType<typeof evaluateLiveActionRunnerExecution>;
  result: DesktopActionRunnerExecuteResult;
  auditRecords: LiveActionAuditRecord[];
  phase8AuditReviewRecord?: Phase8AuditReviewRecord;
  now: string;
  overrides?: Partial<Phase9RunnerApprovalRecord>;
}): Phase9RunnerApprovalRecord {
  const baseSnapshot = buildPhase9RunnerApprovalSnapshot({
    permissionRequest: request,
    runnerEvaluation: evaluation,
    desktopRunnerResult: result,
    auditRecords,
    phase8AuditReviewRecord,
    runnerApprovalRecord: undefined,
    evaluatedAt: now
  });

  return {
    id: "phase9-runner-approval:2026-06-18T01:00:00.000Z",
    createdAt: "2026-06-18T01:00:00.000Z",
    state: "ready",
    readiness: 100,
    selectedAction: "terminal-readonly-probe",
    auditRecordCount: baseSnapshot.auditRecordCount,
    phase8ReviewRecordId:
      phase8AuditReviewRecord?.id ?? "missing-phase8-review-record",
    phase8ReviewState: phase8AuditReviewRecord?.state ?? "blocked",
    phase8ReviewFingerprint: phase8AuditReviewRecord?.auditEvidenceFingerprint,
    phase8ReviewedBlockerLabel: phase8AuditReviewRecord?.topBlockerLabel,
    phase8ReviewedBlockerSourceId: phase8AuditReviewRecord?.topBlockerSourceId,
    phase8ReviewedBlockerKind: phase8AuditReviewRecord?.topBlockerKind,
    phase8ReviewedBlockerStatus: phase8AuditReviewRecord?.topBlockerStatus,
    phase8ReviewedBlockerAction: phase8AuditReviewRecord?.topBlockerAction,
    canRequestDesktopProbe: true,
    mutationLocked: true,
    runnerEvidenceFingerprint: buildPhase9RunnerEvidenceFingerprint(baseSnapshot),
    rollbackEvidence: "Phase 9 rollback evidence is attached.",
    detail: "Phase 9 runner approval review is ready.",
    ...overrides
  };
}

describe("phase 9 runner approval", () => {
  it("waits when the selected probe has not been requested", () => {
    const approval = snapshot();

    expect(approval.state).toBe("waiting");
    expect(approval.selectedAction).toBe("terminal-readonly-probe");
    expect(approval.canRequestDesktopProbe).toBe(false);
    expect(approval.runnerApprovalProof).toContain("items=8/8");
    expect(approval.runnerApprovalProof).toContain("selected=terminal-readonly-probe");
    expect(approval.runnerApprovalProof).toContain("requestGate=held");
    expect(approval.runnerApprovalProof).toContain("execution=locked");
    expect(approval.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Selected reversible action",
          status: "ready"
        }),
        expect.objectContaining({
          label: "Owner permission",
          kind: "permission",
          status: "waiting"
        })
      ])
    );
    expect(approval.safety).toContain("no broad terminal");
  });

  it("reviews runner approval records when Phase 8 dependency proof changes", () => {
    const request = permissionRequest({ state: "approved" });
    const evaluation = evaluateLiveActionRunnerExecution(
      terminalDefinition,
      request,
      "2026-06-11T00:05:00.000Z",
      "2026-06-11T00:05:00.000Z"
    );
    const result = desktopResult({
      requestId: "terminal-permission-1",
      status: "executed",
      code: "ok",
      canExecute: true,
      summary: "Desktop terminal read-only probe executed through the approved runner contract.",
      detail: "Executed fixed terminal read-only probe command for audit trail."
    });
    const auditRecords = [terminalAuditRecord("approved"), terminalAuditRecord("executed")];
    const staleRecord = readyRunnerApprovalRecordFor({
      request,
      evaluation,
      result,
      auditRecords,
      phase8AuditReviewRecord: readyPhase8ReviewRecord,
      now: "2026-06-11T00:05:00.000Z"
    });
    const changedPhase8Record: Phase8AuditReviewRecord = {
      ...readyPhase8ReviewRecord,
      auditEvidenceFingerprint: "phase8-audit:changed",
      topBlockerSourceId: "phase-08-risk-traceability:active-goal"
    };
    const approval = snapshot({
      request,
      result,
      auditRecords,
      phase8ReviewRecord: changedPhase8Record,
      runnerApprovalRecord: staleRecord,
      now: "2026-06-11T00:05:00.000Z"
    });

    expect(approval.state).toBe("review");
    expect(approval.canRequestDesktopProbe).toBe(false);
    expect(approval.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Owner runner review",
          kind: "owner-review",
          status: "review",
          detail: expect.stringContaining("reviewed-blocker proof")
        })
      ])
    );
  });

  it("reviews runner approval records that predate Phase 8 reviewed-blocker proof", () => {
    const request = permissionRequest({ state: "approved" });
    const result = desktopResult({
      requestId: "terminal-permission-1",
      status: "executed",
      code: "ok",
      canExecute: true,
      summary: "Desktop terminal read-only probe executed through the approved runner contract.",
      detail: "Executed fixed terminal read-only probe command for audit trail."
    });
    const auditRecords = [terminalAuditRecord("approved"), terminalAuditRecord("executed")];
    const oldRecord = readyRunnerApprovalRecordFor({
      request,
      evaluation: evaluateLiveActionRunnerExecution(
        terminalDefinition,
        request,
        "2026-06-11T00:05:00.000Z",
        "2026-06-11T00:05:00.000Z"
      ),
      result,
      auditRecords,
      phase8AuditReviewRecord: readyPhase8ReviewRecord,
      now: "2026-06-11T00:05:00.000Z",
      overrides: {
        phase8ReviewFingerprint: undefined,
        phase8ReviewedBlockerLabel: undefined,
        phase8ReviewedBlockerSourceId: undefined,
        phase8ReviewedBlockerKind: undefined,
        phase8ReviewedBlockerStatus: undefined,
        phase8ReviewedBlockerAction: undefined
      }
    });
    const approval = snapshot({
      request,
      result,
      auditRecords,
      runnerApprovalRecord: oldRecord,
      now: "2026-06-11T00:05:00.000Z"
    });

    expect(approval.state).toBe("review");
    expect(approval.canRequestDesktopProbe).toBe(false);
    expect(approval.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Owner runner review",
          kind: "owner-review",
          status: "review",
          detail: expect.stringContaining("reviewed-blocker proof")
        })
      ])
    );
  });

  it("allows a desktop probe request once approval and preview gates are ready", () => {
    const approval = snapshot({
      request: permissionRequest({ state: "approved" })
    });

    expect(approval.state).toBe("waiting");
    expect(approval.canRequestDesktopProbe).toBe(true);
    expect(approval.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Owner permission",
          status: "ready"
        }),
        expect.objectContaining({
          label: "Approval window",
          status: "ready"
        }),
        expect.objectContaining({
          label: "Runner request preview",
          status: "ready"
        }),
        expect.objectContaining({
          label: "Validation output",
          status: "waiting"
        })
      ])
    );
  });

  it("blocks runner approval when persisted owner review evidence is missing", () => {
    const approval = snapshot({
      request: permissionRequest({ state: "approved" }),
      phase8ReviewRecord: null
    });

    expect(approval.state).toBe("blocked");
    expect(approval.canRequestDesktopProbe).toBe(false);
    expect(approval.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Owner runner review",
          kind: "owner-review",
          status: "blocked"
        })
      ])
    );
  });

  it("reviews legacy runner approval records that predate evidence fingerprinting", () => {
    const request = permissionRequest({ state: "approved" });
    const now = "2026-06-11T00:05:00.000Z";
    const evaluation = evaluateLiveActionRunnerExecution(
      terminalDefinition,
      request,
      now,
      now
    );
    const result = desktopResult();
    const auditRecords = [terminalAuditRecord("approved")];
    const { runnerEvidenceFingerprint: _fingerprint, ...legacyRecord } =
      readyRunnerApprovalRecordFor({
        request,
        evaluation,
        result,
        auditRecords,
        phase8AuditReviewRecord: readyPhase8ReviewRecord,
        now
      });
    const approval = snapshot({
      request,
      result,
      auditRecords,
      runnerApprovalRecord: legacyRecord
    });

    expect(approval.state).toBe("review");
    expect(approval.canRequestDesktopProbe).toBe(false);
    expect(approval.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Owner runner review",
          kind: "owner-review",
          status: "review",
          detail:
            "The persisted Phase 9 runner review predates runner evidence fingerprinting."
        })
      ])
    );
  });

  it("reviews stale runner approval records when current evidence changes", () => {
    const request = permissionRequest({ state: "approved" });
    const approval = snapshot({
      request,
      auditRecords: [terminalAuditRecord("approved")],
      runnerApprovalRecord: readyRunnerApprovalRecordFor({
        request,
        evaluation: evaluateLiveActionRunnerExecution(
          terminalDefinition,
          request,
          "2026-06-11T00:05:00.000Z",
          "2026-06-11T00:05:00.000Z"
        ),
        result: desktopResult(),
        auditRecords: [],
        phase8AuditReviewRecord: readyPhase8ReviewRecord,
        now: "2026-06-11T00:05:00.000Z"
      })
    });

    expect(approval.state).toBe("review");
    expect(approval.canRequestDesktopProbe).toBe(false);
    expect(approval.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Owner runner review",
          kind: "owner-review",
          status: "review",
          detail: expect.stringContaining("does not match current runner evidence")
        })
      ])
    );
  });

  it("enters review when desktop runtime is unavailable after an approved attempt", () => {
    const fallback = buildDesktopActionRunnerBrowserFallbackResult(
      "terminal-permission-1",
      "2026-06-11T00:06:00.000Z"
    );
    const approval = snapshot({
      request: permissionRequest({ state: "approved" }),
      result: fallback,
      auditRecords: [terminalAuditRecord("failed")]
    });

    expect(approval.state).toBe("review");
    expect(approval.reviewCount).toBe(1);
    expect(approval.auditRecordCount).toBe(1);
    expect(approval.nextAction).toContain("desktop mode");
  });

  it("is ready after the fixed probe executes with audit and rollback evidence", () => {
    const approval = snapshot({
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

    expect(approval.state).toBe("ready");
    expect(approval.readiness).toBe(100);
    expect(approval.auditRecordCount).toBe(2);
    expect(approval.runnerApprovalProof).toContain("ready=8");
    expect(approval.runnerApprovalProof).toContain("auditRecords=2");
    expect(approval.runnerApprovalProof).toContain("requestGate=ready");
    expect(approval.runnerApprovalProof).toContain("runnerFingerprint=phase9-runner-");
    expect(approval.items.every((item) => item.status === "ready")).toBe(true);
  });

  it("reviews executed probe records that lack record-specific rollback proof", () => {
    const executedWithoutRollback = {
      ...terminalAuditRecord("executed"),
      resultSummary: "Terminal read-only probe audit record."
    };
    const approval = snapshot({
      request: permissionRequest({ state: "approved" }),
      result: desktopResult({
        requestId: "terminal-permission-1",
        status: "executed",
        code: "ok",
        canExecute: true,
        summary: "Desktop terminal read-only probe executed through the approved runner contract.",
        detail: "Executed fixed terminal read-only probe command for audit trail."
      }),
      auditRecords: [terminalAuditRecord("approved"), executedWithoutRollback]
    });

    expect(approval.state).toBe("review");
    expect(approval.canRequestDesktopProbe).toBe(false);
    expect(approval.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Rollback evidence",
          kind: "rollback",
          status: "review",
          detail: expect.stringContaining("record-specific rollback")
        })
      ])
    );
  });

  it("blocks denied and expired approvals", () => {
    const denied = snapshot({
      request: permissionRequest({ state: "denied" })
    });
    const expired = snapshot({
      request: permissionRequest({
        state: "approved",
        requestedAt: "2026-06-11T00:00:00.000Z",
        timeoutMs: 1000,
        expiresAt: "2026-06-11T00:00:01.000Z"
      }),
      now: "2026-06-11T00:05:00.000Z"
    });

    expect(denied.state).toBe("blocked");
    expect(denied.nextAction).toContain("Reset and re-request");
    expect(expired.state).toBe("blocked");
    expect(expired.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Owner permission",
          status: "blocked"
        })
      ])
    );
  });

  it("keeps snapshot text public-safe", () => {
    const approval = snapshot({
      request: permissionRequest({
        state: "approved",
        actionLabel: "Run C:\\Users\\MJ\\secret.ps1 with token sk-ABCDEF1234567890"
      }),
      auditRecords: [terminalAuditRecord("approved")]
    });
    const combinedText = [
      approval.label,
      approval.nextAction,
      approval.safety,
      approval.ariaLabel,
      ...approval.items.flatMap((item) => [
        item.label,
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
