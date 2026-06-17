import { describe, expect, it } from "vitest";
import type { LiveActionAuditRecord } from "./liveActionAudit";
import type { LiveActionPermissionRequest } from "./liveActionPermission";
import type { DesktopActionRunnerExecuteResult } from "./desktopActionRunner";
import {
  evaluateLiveActionRunnerExecution,
  LIVE_ACTION_RUNNER_DEFINITIONS
} from "./liveActionRunner";
import { buildPhase9RunnerApprovalSnapshot } from "./phase9RunnerApproval";
import { buildPhase9RunnerApprovalDepthSummary } from "./phase9RunnerApprovalDepth";

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

function snapshot(options: {
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

describe("phase 9 runner approval depth", () => {
  it("breaks the runner approval plan into explicit owner-visible depth records", () => {
    const depth = buildPhase9RunnerApprovalDepthSummary(snapshot());

    expect(depth.records.map((record) => record.kind)).toEqual([
      "fixed-probe-selection",
      "owner-approval",
      "request-preview",
      "validation-output",
      "audit-record",
      "rollback-evidence",
      "desktop-execution-lock"
    ]);
    expect(new Set(depth.records.map((record) => record.evidenceKey)).size).toBe(depth.records.length);
    expect(depth.records.map((record) => record.pmTaskId)).toEqual([
      "phase-09-child-reversible-action",
      "phase-09-parent-approval-flow",
      "phase-09-parent-runner-probe",
      "phase-09-child-runner-observability",
      "phase-09-child-approval-record",
      "phase-09-child-approval-depth",
      "phase-09-child-traceability"
    ]);
    expect(depth.records).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "fixed-probe-selection",
          evidenceKey: "phase9.fixed-probe-selection",
          status: "ready",
          locksMutation: true
        }),
        expect.objectContaining({
          kind: "desktop-execution-lock",
          evidenceKey: "phase9.desktop-execution-lock",
          status: "ready",
          locksMutation: true
        })
      ])
    );
    expect(depth.waitingCount).toBeGreaterThan(0);
    expect(depth.mutationLockCount).toBe(5);
  });

  it("marks the full depth ready only when approval, preview, validation, audit, and rollback proof are present", () => {
    const depth = buildPhase9RunnerApprovalDepthSummary(
      snapshot({
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
    );

    expect(depth.records.every((record) => record.status === "ready")).toBe(true);
    expect(depth.readyCount).toBe(7);
    expect(depth.records).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "rollback-evidence",
          evidence: expect.stringContaining("read-only")
        }),
        expect.objectContaining({
          kind: "validation-output",
          evidence: expect.stringContaining("approved runner contract")
        })
      ])
    );
  });

  it("blocks owner approval depth when the owner denies the probe while keeping mutation locks visible", () => {
    const depth = buildPhase9RunnerApprovalDepthSummary(
      snapshot({
        request: permissionRequest({ state: "denied" })
      })
    );

    expect(depth.blockedCount).toBeGreaterThan(0);
    expect(depth.records).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "owner-approval",
          status: "blocked"
        }),
        expect.objectContaining({
          kind: "desktop-execution-lock",
          status: "ready",
          evidence: expect.stringContaining("mutation paths stay locked")
        })
      ])
    );
  });

  it("keeps depth text public-safe", () => {
    const depth = buildPhase9RunnerApprovalDepthSummary(
      snapshot({
        request: permissionRequest({
          state: "approved",
          actionLabel: "Run C:\\Users\\MJ\\secret.ps1 with token sk-ABCDEF1234567890"
        }),
        auditRecords: [terminalAuditRecord("approved")]
      })
    );
    const combinedText = [
      depth.label,
      depth.ariaLabel,
      ...depth.records.flatMap((record) => [
        record.label,
        record.kind,
        record.statusLabel,
        record.evidence,
        record.nextAction
      ])
    ].join(" ");

    expect(combinedText).not.toMatch(/[A-Za-z]:[\\/]/);
    expect(combinedText).not.toMatch(/[\\/](Users|Projects|Documents|Desktop)[\\/]/i);
    expect(combinedText).not.toContain("sk-ABCDEF1234567890");
    expect(combinedText).not.toContain("<");
    expect(combinedText).not.toContain(">");
  });
});
