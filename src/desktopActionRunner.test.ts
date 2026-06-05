import { describe, expect, it } from "vitest";
import {
  buildDesktopActionRunnerBrowserFallbackResult,
  buildTerminalReadonlyProbeRequest,
  normalizeDesktopActionRunnerBackendResult,
  summarizeDesktopActionRunnerResult
} from "./desktopActionRunner";
import { LIVE_ACTION_RUNNER_DEFINITIONS, evaluateLiveActionRunnerExecution } from "./liveActionRunner";
import type { LiveActionPermissionRequest } from "./liveActionPermission";

function buildPermissionRequest(overrides: Partial<LiveActionPermissionRequest> = {}): LiveActionPermissionRequest {
  return {
    id: "permission-terminal-1",
    provider: "terminal",
    actionLabel: "Run terminal readonly probe",
    state: "approved",
    requestedAt: "2026-06-06T00:00:00.000Z",
    timeoutMs: 15 * 60 * 1000,
    ...overrides
  };
}

describe("desktop action runner request building", () => {
  it("builds a terminal readonly probe request from ready execution state", () => {
    const permissionRequest = buildPermissionRequest();
    const execution = evaluateLiveActionRunnerExecution(
      LIVE_ACTION_RUNNER_DEFINITIONS[0],
      permissionRequest,
      "2026-06-06T00:10:00.000Z"
    );
    const result = buildTerminalReadonlyProbeRequest(
      execution,
      permissionRequest,
      "2026-06-06T00:10:00.000Z"
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("Expected a ready terminal request.");
    }

    expect(result.request.provider).toBe("terminal");
    expect(result.request.state).toBe("approved");
    expect(result.request.intent).toBe("terminal-readonly-probe");
    expect(result.request.requestId).toBe(permissionRequest.id);
    expect(result.request.requestedTimestamp).toBe(String(Date.parse(permissionRequest.requestedAt)));
    expect(result.request.expiry).toBe(String(Date.parse(permissionRequest.requestedAt) + permissionRequest.timeoutMs!));
  });

  it("rejects blocked execution state", () => {
    const permissionRequest = buildPermissionRequest();
    const execution = evaluateLiveActionRunnerExecution(
      LIVE_ACTION_RUNNER_DEFINITIONS[0],
      {
        ...permissionRequest,
        state: "requested"
      },
      "2026-06-06T00:10:00.000Z"
    );

    const result = buildTerminalReadonlyProbeRequest(execution, {
      ...permissionRequest,
      state: "requested"
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("Expected blocked execution rejection.");
    }
    expect(result.reason).toBe("execution-blocked");
  });

  it("rejects unsupported provider", () => {
    const permissionRequest = buildPermissionRequest({ provider: "terminal" });
    const execution = evaluateLiveActionRunnerExecution(
      LIVE_ACTION_RUNNER_DEFINITIONS[1],
      buildPermissionRequest({ provider: "git" }),
      "2026-06-06T00:10:00.000Z"
    );

    const result = buildTerminalReadonlyProbeRequest(execution, {
      ...permissionRequest,
      provider: "git"
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("Expected unsupported provider rejection.");
    }
    expect(result.reason).toBe("unsupported-provider");
  });

  it("rejects missing or expired approval timing", () => {
    const execution = evaluateLiveActionRunnerExecution(
      LIVE_ACTION_RUNNER_DEFINITIONS[0],
      buildPermissionRequest(),
      "2026-06-06T00:10:00.000Z"
    );

    const missingTiming = buildTerminalReadonlyProbeRequest(
      execution,
      buildPermissionRequest({
        requestedAt: "",
        timeoutMs: undefined,
        expiresAt: undefined
      })
    );

    expect(missingTiming.ok).toBe(false);
    if (missingTiming.ok) {
      throw new Error("Expected missing timing rejection.");
    }
    expect(missingTiming.reason).toBe("approval-timing-missing");

    const expired = buildTerminalReadonlyProbeRequest(
      execution,
      buildPermissionRequest({
        requestedAt: "2026-06-06T00:00:00.000Z",
        timeoutMs: 1000
      }),
      "2026-06-06T00:05:00.000Z"
    );

    expect(expired.ok).toBe(false);
    if (expired.ok) {
      throw new Error("Expected expired timing rejection.");
    }
    expect(expired.reason).toBe("approval-expired");
  });
});

describe("desktop action runner fallback and summary", () => {
  it("returns fallback result for unavailable desktop runtime", () => {
    const fallback = buildDesktopActionRunnerBrowserFallbackResult("permission-terminal-1");

    expect(fallback.status).toBe("unavailable");
    expect(fallback.code).toBe("runtime-unavailable");
    expect(fallback.canExecute).toBe(false);
  });

  it("maps backend statuses to UI labels and produces audit-safe text", () => {
    const readySummary = summarizeDesktopActionRunnerResult({
      provider: "terminal",
      intent: "terminal-readonly-probe",
      requestId: "ready-1",
      status: "executed",
      code: "ok",
      canExecute: true,
      summary: "runner completed for safe path /tmp/private",
      detail: "No sensitive bearer token=abc123 or secret value here.",
      evaluatedAt: "2026-06-06T00:10:00.000Z"
    });

    const blockedSummary = summarizeDesktopActionRunnerResult({
      provider: "terminal",
      intent: "terminal-readonly-probe",
      requestId: "blocked-1",
      status: "blocked",
      code: "execution-failed",
      canExecute: false,
      summary: "permission denied: token sk-ABCDEF1234567890",
      detail: "denied for terminal-readonly-probe request",
      evaluatedAt: "2026-06-06T00:10:00.000Z"
    });

    const unavailableSummary = summarizeDesktopActionRunnerResult({
      provider: "terminal",
      intent: "terminal-readonly-probe",
      requestId: "unavailable-1",
      status: "unavailable",
      code: "execution-failed",
      canExecute: false,
      summary: "desktop runtime unavailable",
      detail: "command bridge missing in browser preview",
      evaluatedAt: "2026-06-06T00:10:00.000Z"
    });

    expect(readySummary.statusLabel).toBe("Executed");
    expect(blockedSummary.statusLabel).toBe("Blocked");
    expect(unavailableSummary.statusLabel).toBe("Unavailable");
    expect(readySummary.auditText).toContain("redacted");
    expect(blockedSummary.auditText).not.toContain("/tmp/private");
    expect(blockedSummary.auditText).not.toContain("sk-ABCDEF1234567890");
  });

  it("normalizes backend probe results into UI-ready execution results", () => {
    const executed = normalizeDesktopActionRunnerBackendResult(
      {
        provider: "terminal",
        intent: "terminal-readonly-probe",
        executed: true,
        blocked: false,
        actionLabel: "Run terminal readonly probe",
        resultSummary: "STEERBOARD_LIVE_ACTION_PROBE_TOKEN",
        timestamp: "2026-06-06T00:10:00.000Z",
        safety: "Executed fixed terminal read-only probe command for audit trail."
      },
      "permission-terminal-1"
    );
    const blocked = normalizeDesktopActionRunnerBackendResult(
      {
        provider: "terminal",
        intent: "terminal-readonly-probe",
        executed: false,
        blocked: true,
        actionLabel: "Run terminal readonly probe",
        resultSummary: "blocked_expired",
        timestamp: "2026-06-06T00:10:00.000Z",
        safety: "Process execution was not started."
      },
      "permission-terminal-1"
    );

    expect(executed.status).toBe("executed");
    expect(executed.code).toBe("ok");
    expect(executed.canExecute).toBe(true);
    expect(blocked.status).toBe("blocked");
    expect(blocked.code).toBe("approval-expired");
    expect(blocked.canExecute).toBe(false);
  });
});
