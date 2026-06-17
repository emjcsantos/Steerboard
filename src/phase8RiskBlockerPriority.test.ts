import { describe, expect, it } from "vitest";
import type { LiveActionAuditRecord } from "./liveActionAudit";
import type { LiveActionPermissionRequestSummary } from "./liveActionPermission";
import type { RuntimeExecutionAuditSnapshot } from "./runtimeExecutionAudit";
import type { RuntimeExecutionAuditRecord } from "./runtimeExecutionAuditHistory";
import type { RuntimeProfilePermissionApprovalSnapshot } from "./runtimeProfilePermissionApproval";
import type { RuntimeProfilePermissionAuditSnapshot } from "./runtimeProfilePermissionAudit";
import type { RuntimeProfilePermissionRequestRecord } from "./runtimeProfilePermissionRequestHistory";
import { buildPhase8PermissionAuditDepth } from "./phase8PermissionAuditDepth";
import { buildPhase8RiskBlockerPriority } from "./phase8RiskBlockerPriority";
import { buildPhase8RiskTraceabilitySummary } from "./phase8RiskTraceability";
import { remainingGoalPlan } from "./remainingGoalPlan";

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

function snapshot(options: {
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

function priority({
  depth = snapshot(),
  goals = remainingGoalPlan
}: {
  depth?: ReturnType<typeof snapshot>;
  goals?: typeof remainingGoalPlan;
} = {}) {
  const traceability = buildPhase8RiskTraceabilitySummary({
    snapshot: depth,
    goals
  });

  return buildPhase8RiskBlockerPriority({ snapshot: depth, traceability });
}

describe("phase 8 risk blocker priority", () => {
  it("ranks waiting permission blockers with audit-review actions", () => {
    const summary = priority();

    expect(summary.state).toBe("waiting");
    expect(summary.openBlockerCount).toBeGreaterThan(0);
    expect(summary.auditReviewCanAddressTopBlocker).toBe(true);
    expect(summary.topPriorityLabel).toBe("terminal action");
    expect(summary.items[0]).toMatchObject({
      kind: "audit-depth",
      status: "waiting",
      severity: "medium",
      priority: 1
    });
    expect(summary.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "risk-exception", status: "waiting" }),
        expect.objectContaining({ kind: "traceability", status: "waiting" })
      ])
    );
  });

  it("keeps blocked approval and execution audit rows ahead of waiting evidence", () => {
    const summary = priority({
      depth: snapshot({
        summaries: [liveSummary("terminal", "denied")],
        runtimeExecutionAudit: blockedRuntimeExecutionAudit
      })
    });

    expect(summary.state).toBe("blocked");
    expect(summary.topPriorityLabel).toBe("terminal action");
    expect(summary.items[0]).toMatchObject({
      kind: "audit-depth",
      status: "blocked",
      severity: "critical"
    });
    expect(summary.nextAction).toContain("phase8.approval-gate");
  });

  it("surfaces PM traceability gaps after audit depth is ready", () => {
    const goals = remainingGoalPlan.map((goal) =>
      goal.id === "goal-phase-8-permission-audit"
        ? {
            ...goal,
            pmTaskIds: goal.pmTaskIds.filter((taskId) => taskId !== "phase-08-child-traceability")
          }
        : goal
    );
    const summary = priority({
      depth: snapshot({
        summaries: [
          liveSummary("terminal", "approved"),
          liveSummary("git", "approved"),
          liveSummary("plugin", "approved")
        ],
        liveAuditRecords: [liveAuditRecord],
        runtimeExecutionAudit: readyRuntimeExecutionAudit,
        runtimeExecutionAuditHistory: [readyAuditRecord],
        runtimeProfilePermissionRequestHistory: [readyProfileRequest]
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

  it("reports ready when permission audit depth and traceability are ready", () => {
    const summary = priority({
      depth: snapshot({
        summaries: [
          liveSummary("terminal", "approved"),
          liveSummary("git", "approved"),
          liveSummary("plugin", "approved")
        ],
        liveAuditRecords: [liveAuditRecord],
        runtimeExecutionAudit: readyRuntimeExecutionAudit,
        runtimeExecutionAuditHistory: [readyAuditRecord],
        runtimeProfilePermissionRequestHistory: [readyProfileRequest]
      })
    });

    expect(summary.state).toBe("ready");
    expect(summary.openBlockerCount).toBe(0);
    expect(summary.readiness).toBe(100);
    expect(summary.topPriorityLabel).toBe("No open Phase 8 risk blocker");
  });

  it("keeps Phase 8 blocker-priority text public-safe", () => {
    const unsafeDepth = {
      ...snapshot(),
      nextAction:
        "Open C:\\Users\\MJ\\Projects\\ProjectAtlas\\secret.md with token sk-ABCDEF1234567890 <unsafe>"
    };
    const summary = priority({ depth: unsafeDepth });
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
