import { describe, expect, it } from "vitest";
import type { LiveActionAuditRecord } from "./liveActionAudit";
import type { LiveActionPermissionRequest } from "./liveActionPermission";
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

describe("phase 9 runner approval", () => {
  it("waits when the selected probe has not been requested", () => {
    const approval = snapshot();

    expect(approval.state).toBe("waiting");
    expect(approval.selectedAction).toBe("terminal-readonly-probe");
    expect(approval.canRequestDesktopProbe).toBe(false);
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
    expect(approval.items.every((item) => item.status === "ready")).toBe(true);
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
