import { describe, expect, it } from "vitest";
import type { LiveActionAuditRecord } from "./liveActionAudit";
import type { LiveActionPermissionRequestSummary } from "./liveActionPermission";
import type { RuntimeExecutionAuditSnapshot } from "./runtimeExecutionAudit";
import type { RuntimeExecutionAuditRecord } from "./runtimeExecutionAuditHistory";
import type { RuntimeProfilePermissionApprovalSnapshot } from "./runtimeProfilePermissionApproval";
import type { RuntimeProfilePermissionAuditSnapshot } from "./runtimeProfilePermissionAudit";
import type { RuntimeProfilePermissionRequestRecord } from "./runtimeProfilePermissionRequestHistory";
import { buildPhase8PermissionAuditDepth } from "./phase8PermissionAuditDepth";

function liveSummary(
  provider: string,
  state: LiveActionPermissionRequestSummary["state"] = "idle"
): LiveActionPermissionRequestSummary {
  return {
    id: `${provider}:permission`,
    provider: provider as LiveActionPermissionRequestSummary["provider"],
    actionLabel: `${provider} action`,
    state,
    risk: provider === "plugin" ? "medium" : "high",
    isRiskGated: true,
    requestedAt: "2026-06-11T00:00:00.000Z",
    expiresAt: "none",
    requestedBy: "operator",
    transcriptLineCount: 0,
    detail: `${provider} requires explicit permission.`
  };
}

const readyRuntimeExecutionAudit: RuntimeExecutionAuditSnapshot = {
  id: "runtime-launch:execution-audit",
  label: "Runtime launch execution audit",
  state: "ready",
  statusLabel: "Ready",
  eventCount: 3,
  transport: "local",
  canExecute: false,
  executionLocked: true,
  requiresDesktopApproval: true,
  detail: "Execution audit is ready after approval request.",
  safety: "Audit preview only. Runtime execution remains locked.",
  items: [
    {
      id: "runtime-launch:execution-lock",
      label: "Execution lock",
      status: "locked",
      detail: "Runtime execution is unavailable in this preview."
    }
  ]
};

const waitingRuntimeExecutionAudit: RuntimeExecutionAuditSnapshot = {
  ...readyRuntimeExecutionAudit,
  state: "waiting",
  statusLabel: "Waiting",
  detail: "Runtime handoff request is waiting on local bridge readiness."
};

const blockedRuntimeExecutionAudit: RuntimeExecutionAuditSnapshot = {
  ...readyRuntimeExecutionAudit,
  state: "blocked",
  statusLabel: "Blocked",
  detail: "Execution audit is blocked by launch readiness."
};

const readyProfilePermissionApproval: RuntimeProfilePermissionApprovalSnapshot = {
  id: "profile:permission-approval",
  label: "Profile permission approval",
  intent: "idle",
  state: "requestable",
  statusLabel: "Ready",
  primaryActionLabel: "Request",
  detail: "Permission approval can be requested before runtime handoff.",
  safety: "No process execution, filesystem action, or network action is performed.",
  readiness: 100,
  approvalRequired: true,
  executionLocked: true,
  canRequest: true,
  canCancel: false,
  bridgeState: "ready",
  profileId: "profile",
  profileLabel: "Profile"
};

const readyProfilePermissionAudit: RuntimeProfilePermissionAuditSnapshot = {
  id: "profile:permission-audit",
  label: "Profile permission audit",
  state: "ready",
  statusLabel: "Ready",
  readiness: 100,
  executionLocked: true,
  canExport: true,
  recordCount: 1,
  detail: "Audit is ready for review.",
  safety: "Audit preview only. No process execution, filesystem action, or network action is performed.",
  exportMarkdown: "# Export",
  items: []
};

const readyAuditRecord: RuntimeExecutionAuditRecord = {
  id: "execution:requested:2026-06-11T00:00:00.000Z",
  auditId: "runtime-launch:execution-audit",
  action: "requested",
  createdAt: "2026-06-11T00:00:00.000Z",
  statusLabel: "Ready",
  eventCount: 3,
  transport: "local",
  executionLocked: true,
  detail: "Approval requested locally."
};

const readyProfileRequest: RuntimeProfilePermissionRequestRecord = {
  id: "profile:requested:2026-06-11T00:00:00.000Z",
  handoffId: "profile:permission-handoff",
  action: "requested",
  createdAt: "2026-06-11T00:00:00.000Z",
  statusLabel: "Ready",
  readiness: 100,
  detail: "Requested local profile permission handoff.",
  bridgeState: "ready",
  bridgeSource: "desktop",
  profileId: "profile",
  profileLabel: "Profile"
};

const liveAuditRecord: LiveActionAuditRecord = {
  id: "terminal:local:requested:2026-06-11T00:00:00.000Z",
  action: "requested",
  what: "Terminal probe",
  why: "Permission requested.",
  provider: "terminal",
  workspace: "local",
  service: "terminal",
  resultSummary: "Permission requested locally; execution remains locked.",
  timestamp: "2026-06-11T00:00:00.000Z",
  risk: "high"
};

function buildSnapshot(options: {
  summaries?: LiveActionPermissionRequestSummary[];
  liveAuditRecords?: LiveActionAuditRecord[];
  runtimeExecutionAudit?: RuntimeExecutionAuditSnapshot;
  runtimeExecutionAuditHistory?: RuntimeExecutionAuditRecord[];
  runtimeProfilePermissionApproval?: RuntimeProfilePermissionApprovalSnapshot;
  runtimeProfilePermissionAudit?: RuntimeProfilePermissionAuditSnapshot;
  runtimeProfilePermissionRequestHistory?: RuntimeProfilePermissionRequestRecord[];
} = {}) {
  return buildPhase8PermissionAuditDepth({
    liveActionSummaries: options.summaries ?? [
      liveSummary("terminal"),
      liveSummary("git"),
      liveSummary("plugin")
    ],
    liveActionAuditRecords: options.liveAuditRecords ?? [],
    runtimeExecutionAudit: options.runtimeExecutionAudit ?? waitingRuntimeExecutionAudit,
    runtimeExecutionAuditHistory: options.runtimeExecutionAuditHistory ?? [],
    runtimeProfilePermissionApproval:
      options.runtimeProfilePermissionApproval ?? readyProfilePermissionApproval,
    runtimeProfilePermissionAudit:
      options.runtimeProfilePermissionAudit ?? readyProfilePermissionAudit,
    runtimeProfilePermissionRequestHistory:
      options.runtimeProfilePermissionRequestHistory ?? []
  });
}

describe("phase 8 permission and audit depth", () => {
  it("keeps idle risky actions waiting with explicit permission requirements", () => {
    const snapshot = buildSnapshot();

    expect(snapshot.state).toBe("waiting");
    expect(snapshot.riskyActionCount).toBe(3);
    expect(snapshot.waitingCount).toBeGreaterThan(0);
    expect(snapshot.nextAction).toContain("Request permission");
    expect(snapshot.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "permission",
          status: "waiting",
          label: "terminal action"
        })
      ])
    );
    expect(snapshot.safety).toContain("without granting access");
  });

  it("returns ready when permissions, approval evidence, audit history, and locks are present", () => {
    const snapshot = buildSnapshot({
      summaries: [
        liveSummary("terminal", "approved"),
        liveSummary("git", "approved"),
        liveSummary("plugin", "approved")
      ],
      liveAuditRecords: [liveAuditRecord],
      runtimeExecutionAudit: readyRuntimeExecutionAudit,
      runtimeExecutionAuditHistory: [readyAuditRecord],
      runtimeProfilePermissionRequestHistory: [readyProfileRequest]
    });

    expect(snapshot.state).toBe("ready");
    expect(snapshot.statusLabel).toBe("Ready");
    expect(snapshot.readiness).toBe(100);
    expect(snapshot.auditRecordCount).toBe(4);
    expect(snapshot.items.every((item) => item.status === "ready")).toBe(true);
  });

  it("blocks denied risky actions and blocked runtime audit evidence", () => {
    const snapshot = buildSnapshot({
      summaries: [liveSummary("terminal", "denied")],
      runtimeExecutionAudit: blockedRuntimeExecutionAudit
    });

    expect(snapshot.state).toBe("blocked");
    expect(snapshot.blockedCount).toBeGreaterThanOrEqual(2);
    expect(snapshot.nextAction).toContain("Reset or re-request approval");
    expect(snapshot.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "approval",
          status: "blocked"
        }),
        expect.objectContaining({
          kind: "evidence",
          status: "blocked"
        })
      ])
    );
  });

  it("flags pending approvals and executed records for review", () => {
    const executedRecord: LiveActionAuditRecord = {
      ...liveAuditRecord,
      id: "terminal:local:executed:2026-06-11T00:01:00.000Z",
      action: "executed",
      resultSummary: "Executed local dry-run action."
    };
    const snapshot = buildSnapshot({
      summaries: [liveSummary("terminal", "requested")],
      liveAuditRecords: [executedRecord],
      runtimeExecutionAudit: {
        ...readyRuntimeExecutionAudit,
        state: "pending",
        statusLabel: "Pending",
        detail: "Local approval is queued and desktop execution remains locked."
      }
    });

    expect(snapshot.state).toBe("review");
    expect(snapshot.reviewCount).toBeGreaterThanOrEqual(3);
    expect(snapshot.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Rollback requirement",
          kind: "rollback",
          status: "review"
        })
      ])
    );
  });

  it("blocks when rollback lock evidence is missing", () => {
    const snapshot = buildSnapshot({
      summaries: [liveSummary("terminal", "approved")],
      runtimeExecutionAudit: {
        ...readyRuntimeExecutionAudit,
        executionLocked: false
      }
    });

    expect(snapshot.state).toBe("blocked");
    expect(snapshot.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Rollback requirement",
          status: "blocked",
          nextAction: expect.stringContaining("Restore execution locks")
        })
      ])
    );
  });

  it("keeps labels and details public-safe", () => {
    const snapshot = buildSnapshot();
    const combinedText = [
      snapshot.label,
      snapshot.nextAction,
      snapshot.safety,
      snapshot.ariaLabel,
      ...snapshot.items.flatMap((item) => [
        item.label,
        item.detail,
        item.nextAction
      ])
    ].join(" ");

    expect(combinedText).not.toMatch(/[A-Za-z]:[\\/]/);
    expect(combinedText).not.toMatch(/[\\/](Users|Projects|Documents|Desktop)[\\/]/i);
    expect(combinedText).not.toContain("<");
    expect(combinedText).not.toContain(">");
  });
});
