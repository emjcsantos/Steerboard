import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Phase9RunnerApprovalPanel } from "./App";
import type { DesktopActionRunnerExecuteResult } from "./desktopActionRunner";
import type { LiveActionAuditRecord } from "./liveActionAudit";
import type { LiveActionPermissionRequest } from "./liveActionPermission";
import {
  evaluateLiveActionRunnerExecution,
  LIVE_ACTION_RUNNER_DEFINITIONS
} from "./liveActionRunner";
import type { Phase8AuditReviewRecord } from "./phase8AuditReviewRecord";
import type { Phase8PermissionAuditDepthSnapshot } from "./phase8PermissionAuditDepth";
import {
  createPhase9RunnerApprovalRecord,
  type Phase9RunnerApprovalRecord
} from "./phase9RunnerApprovalRecord";
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

const readyPhase8PermissionAuditDepth: Phase8PermissionAuditDepthSnapshot = {
  id: "phase-08-permission-audit-depth",
  label: "Phase 8 permission and audit depth",
  state: "ready",
  statusLabel: "Ready",
  readiness: 100,
  riskyActionCount: 3,
  auditRecordCount: 8,
  disabledPathCount: 8,
  openExceptionCount: 0,
  readyCount: 8,
  reviewCount: 0,
  blockedCount: 0,
  waitingCount: 0,
  nextAction: "Keep Phase 8 permission, audit, rollback, and disabled-path evidence ready.",
  safety: "Phase 8 review only.",
  ariaLabel: "Phase 8 permission audit ready.",
  items: [],
  exceptions: []
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

function runnerApprovalSnapshot(options: {
  request?: LiveActionPermissionRequest;
  result?: DesktopActionRunnerExecuteResult;
  auditRecords?: LiveActionAuditRecord[];
  phase8ReviewRecord?: Phase8AuditReviewRecord;
  runnerApprovalRecord?: Phase9RunnerApprovalRecord;
  now?: string;
} = {}) {
  const request = options.request;
  const now = options.now ?? "2026-06-11T00:05:00.000Z";
  const evaluation = request
    ? evaluateLiveActionRunnerExecution(terminalDefinition, request, now, now)
    : undefined;

  return buildPhase9RunnerApprovalSnapshot({
    permissionRequest: request,
    runnerEvaluation: evaluation,
    desktopRunnerResult: options.result ?? desktopResult(),
    auditRecords: options.auditRecords ?? [],
    phase8AuditReviewRecord: options.phase8ReviewRecord ?? readyPhase8ReviewRecord,
    runnerApprovalRecord: options.runnerApprovalRecord,
    evaluatedAt: now
  });
}

function readyRunnerApprovalFixture() {
  const inputs = {
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
  const baseSnapshot = runnerApprovalSnapshot(inputs);
  const reviewRecord = createPhase9RunnerApprovalRecord(
    baseSnapshot,
    readyPhase8ReviewRecord,
    "2026-06-18T09:30:00.000Z"
  );

  return {
    reviewRecord,
    snapshot: runnerApprovalSnapshot({
      ...inputs,
      runnerApprovalRecord: reviewRecord
    })
  };
}

function recordableRunnerApprovalSnapshot(options: {
  phase8ReviewRecord?: Phase8AuditReviewRecord;
} = {}) {
  return runnerApprovalSnapshot({
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
    phase8ReviewRecord: options.phase8ReviewRecord
  });
}

function renderPhase9Proof(options: {
  reviewRecord?: Phase9RunnerApprovalRecord;
  snapshot?: ReturnType<typeof runnerApprovalSnapshot>;
  phase8?: Phase8PermissionAuditDepthSnapshot;
} = {}) {
  return renderToStaticMarkup(
    <Phase9RunnerApprovalPanel
      onClearRunnerReview={() => undefined}
      onRecordRunnerReview={() => undefined}
      phase8PermissionAuditDepth={options.phase8 ?? readyPhase8PermissionAuditDepth}
      reviewRecord={options.reviewRecord}
      snapshot={options.snapshot ?? runnerApprovalSnapshot()}
    />
  );
}

describe("phase 9 runner approval owner-visible proof", () => {
  it("renders the fixed probe, request gate, depth, traceability, blocker priority, and mutation lock text", () => {
    const html = renderPhase9Proof();

    expect(html).toContain("Phase 9 Runner Approval");
    expect(html).toContain("Phase 9 desktop runner approval");
    expect(html).toContain("terminal-readonly-probe");
    expect(html).toContain("No local runner review record");
    expect(html).toContain("Fixed probe remains held");
    expect(html).toContain("Selected reversible action");
    expect(html).toContain("Owner permission");
    expect(html).toContain("Approval window");
    expect(html).toContain("Runner request preview");
    expect(html).toContain("Validation output");
    expect(html).toContain("Approval and result audit");
    expect(html).toContain("Owner runner review");
    expect(html).toContain("Rollback evidence");
    expect(html).toContain("Phase 9 runner approval depth");
    expect(html).toContain("phase9.fixed-probe-selection");
    expect(html).toContain("phase9.desktop-execution-lock");
    expect(html).toContain("Phase 9 runner traceability");
    expect(html).toContain("Remaining goal link");
    expect(html).toContain("PM row coverage");
    expect(html).toContain("Phase 8 audit gate");
    expect(html).toContain("Runner approval depth");
    expect(html).toContain("Runner review record");
    expect(html).toContain("Mutation lock");
    expect(html).toContain("Phase 9 runner blocker priority");
    expect(html).toContain("phase-09-desktop-runner-approval:owner-review / approval / waiting");
    expect(html).toContain("Phase 9 desktop probe gate held");
    expect(html).toContain("Desktop probe gate");
    expect(html).toContain("Request owner approval for the fixed terminal read-only probe.");
    expect(html).toContain("Open");
    expect(html).toContain("Reviewable");
    expect(html).toContain("Status");
    expect(html).toContain("Runner review");
    expect(html).toContain(
      "Phase 9 runner review recording is held: Request owner approval for the fixed terminal read-only probe."
    );
    expect(html).toContain("no broad terminal, Git, MCP, plugin, automation, runtime, or profile mutation is unlocked");
  });

  it("enables runner review recording only when owner review is the final held gate", () => {
    const html = renderPhase9Proof({
      snapshot: recordableRunnerApprovalSnapshot()
    });

    expect(html).toContain(
      '<button title="Record a local owner review of the current Phase 9 runner approval evidence." type="button">'
    );
    expect(html).toContain("Owner runner review");
  });

  it("holds runner review recording when Phase 8 reviewed-blocker proof is incomplete", () => {
    const html = renderPhase9Proof({
      snapshot: recordableRunnerApprovalSnapshot({
        phase8ReviewRecord: {
          ...readyPhase8ReviewRecord,
          topBlockerSourceId: undefined
        }
      })
    });

    expect(html).toContain(
      "Phase 9 runner review recording is held: Re-record the Phase 8 owner audit review with top-blocker source, kind, status, label, action, and audit fingerprint before recording Phase 9 runner approval."
    );
    expect(html).toContain("<button disabled=\"\"");
  });

  it("renders ready local runner-review state with Phase 8 linkage and rollback evidence", () => {
    const { reviewRecord, snapshot } = readyRunnerApprovalFixture();
    const html = renderPhase9Proof({ reviewRecord, snapshot });

    expect(html).toContain("Runner review recorded");
    expect(html).toContain("Jun 18");
    expect(html).toContain("2 audit records");
    expect(html).toContain("Ready");
    expect(html).toContain("Request");
    expect(html).toContain(
      '<dd title="goal-phase-9-runner is next at 58% with 9 PM task links.'
    );
    expect(html).toContain(">Held</dd>");
    expect(html).toContain("Desktop probe gate");
    expect(html).toContain("goal-phase-9-runner is next at 58% with 9 PM task links.");
    expect(html).toContain("Records");
    expect(html).toContain("Phase 9 runner review record ready");
    expect(html).toContain(
      "Phase 8 proof phase8-audit:abcdef12 / phase-08-permission-audit-depth:owner-audit-review / audit-depth / waiting"
    );
    expect(html).toContain("Desktop terminal read-only probe executed through the approved runner contract");
    expect(html).toContain("Phase 9 remains limited to terminal-readonly-probe");
    expect(html).toContain("broad terminal, Git, MCP, plugin, automation, runtime, profile, and external-service mutation paths stay locked");
    expect(html).toContain("Owner action");
    expect(html).toContain(
      "phase-09-runner-traceability:active-goal / traceability / waiting"
    );
    expect(html).toContain("Clear");
  });

  it("shows stale runner-review records as visible review blockers", () => {
    const request = permissionRequest({ state: "approved" });
    const staleBase = runnerApprovalSnapshot({
      request,
      result: desktopResult(),
      auditRecords: []
    });
    const staleRecord = createPhase9RunnerApprovalRecord(
      staleBase,
      readyPhase8ReviewRecord,
      "2026-06-18T09:00:00.000Z"
    );
    const currentSnapshot = runnerApprovalSnapshot({
      request,
      result: desktopResult({
        requestId: "terminal-permission-1",
        status: "executed",
        code: "ok",
        canExecute: true,
        summary: "Desktop terminal read-only probe executed through the approved runner contract.",
        detail: "Executed fixed terminal read-only probe command for audit trail."
      }),
      auditRecords: [terminalAuditRecord("approved"), terminalAuditRecord("executed")],
      runnerApprovalRecord: staleRecord
    });
    const html = renderPhase9Proof({
      reviewRecord: staleRecord,
      snapshot: currentSnapshot
    });

    expect(html).toContain("Runner review recorded");
    expect(html).toContain("Owner runner review");
    expect(html).toContain("does not match current runner evidence");
    expect(html).toContain("Re-record Phase 9 runner approval review");
    expect(html).toContain("Phase 9 runner blocker priority");
    expect(html).toContain("Reviewable");
  });
});
