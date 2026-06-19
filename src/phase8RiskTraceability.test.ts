import { describe, expect, it } from "vitest";
import type { LiveActionAuditRecord } from "./liveActionAudit";
import type { LiveActionPermissionRequestSummary } from "./liveActionPermission";
import type { RuntimeExecutionAuditSnapshot } from "./runtimeExecutionAudit";
import type { RuntimeExecutionAuditRecord } from "./runtimeExecutionAuditHistory";
import type { RuntimeProfilePermissionApprovalSnapshot } from "./runtimeProfilePermissionApproval";
import type { RuntimeProfilePermissionAuditSnapshot } from "./runtimeProfilePermissionAudit";
import type { RuntimeProfilePermissionRequestRecord } from "./runtimeProfilePermissionRequestHistory";
import type { Phase8AuditReviewRecord } from "./phase8AuditReviewRecord";
import { createPhase8AuditReviewRecord } from "./phase8AuditReviewRecord";
import { buildPhase8PermissionAuditDepth } from "./phase8PermissionAuditDepth";
import { buildPhase8RiskTraceabilitySummary } from "./phase8RiskTraceability";
import { currentProjectManagementPhasePlanTaskIds } from "./projectManagementPhasePlan";
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
  items: []
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

const executionRecord: RuntimeExecutionAuditRecord = {
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

const profileRequest: RuntimeProfilePermissionRequestRecord = {
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

const readyOwnerReviewRecord: Phase8AuditReviewRecord = {
  id: "phase8-audit-review:2026-06-11T00:00:00.000Z",
  createdAt: "2026-06-11T00:00:00.000Z",
  state: "ready",
  readiness: 100,
  auditRecordCount: 4,
  openExceptionCount: 0,
  disabledPathCount: 8,
  mutationLocked: true,
  auditEvidenceFingerprint: "",
  rollbackEvidence:
    "Mutation paths remain locked; rollback evidence is required before future executed or failed mutation records can advance.",
  detail: "Owner-reviewed Phase 8 audit depth recorded locally."
};

function depth(options: {
  summaries?: LiveActionPermissionRequestSummary[];
  liveAuditRecords?: LiveActionAuditRecord[];
  runtimeExecutionAudit?: RuntimeExecutionAuditSnapshot;
  runtimeExecutionAuditHistory?: RuntimeExecutionAuditRecord[];
  runtimeProfilePermissionAudit?: RuntimeProfilePermissionAuditSnapshot;
  runtimeProfilePermissionRequestHistory?: RuntimeProfilePermissionRequestRecord[];
  ownerAuditReviewRecord?: Phase8AuditReviewRecord;
} = {}) {
  return buildPhase8PermissionAuditDepth({
    liveActionSummaries: options.summaries ?? [
      liveSummary("terminal"),
      liveSummary("git"),
      liveSummary("plugin")
    ],
    liveActionAuditRecords: options.liveAuditRecords ?? [],
    runtimeExecutionAudit: options.runtimeExecutionAudit ?? {
      ...readyRuntimeExecutionAudit,
      state: "waiting",
      statusLabel: "Waiting",
      detail: "Runtime handoff request is waiting on local bridge readiness."
    },
    runtimeExecutionAuditHistory: options.runtimeExecutionAuditHistory ?? [],
    runtimeProfilePermissionApproval: readyProfilePermissionApproval,
    runtimeProfilePermissionAudit:
      options.runtimeProfilePermissionAudit ?? readyProfilePermissionAudit,
    runtimeProfilePermissionRequestHistory:
      options.runtimeProfilePermissionRequestHistory ?? [],
    ownerAuditReviewRecord: options.ownerAuditReviewRecord
  });
}

function ownerReviewFor(options: Parameters<typeof depth>[0] = {}): Phase8AuditReviewRecord {
  return createPhase8AuditReviewRecord(
    depth({ ...options, ownerAuditReviewRecord: undefined }),
    "2026-06-11T00:00:00.000Z"
  );
}

function traceability(options: {
  snapshot?: ReturnType<typeof depth>;
  goals?: typeof remainingGoalPlan;
} = {}) {
  return buildPhase8RiskTraceabilitySummary({
    snapshot: options.snapshot ?? depth(),
    goals: options.goals ?? remainingGoalPlan
  });
}

function withCurrentPhase8Goal() {
  return remainingGoalPlan.map((goal) =>
    goal.id === "goal-phase-8-permission-audit"
      ? { ...goal, status: "active" as const, current: true }
      : goal.current
        ? { ...goal, current: false }
        : goal
  );
}

function withCurrentNextPhase8Goal() {
  return remainingGoalPlan.map((goal) =>
    goal.id === "goal-phase-8-permission-audit"
      ? { ...goal, current: true }
      : goal.current
        ? { ...goal, current: false }
        : goal
  );
}

function withDuplicateCurrentActivePhase8Goal() {
  return remainingGoalPlan.map((goal) =>
    goal.id === "goal-phase-8-permission-audit"
      ? { ...goal, status: "active" as const, current: true }
      : goal
  );
}

describe("phase 8 risk traceability", () => {
  it("links the Phase 8 goal, PM child rows, audit-depth evidence, exceptions, and disabled paths", () => {
    const summary = traceability();

    expect(summary.linkedGoalId).toBe("goal-phase-8-permission-audit");
    expect(summary.linkedPmTaskCount).toBeGreaterThanOrEqual(9);
    expect(summary.missingPmTaskIds).toEqual([]);
    expect(summary.items.map((item) => item.kind)).toEqual([
      "active-goal",
      "pm-coverage",
      "audit-depth",
      "exception-register",
      "disabled-path-lock"
    ]);
    expect(summary.state).toBe("waiting");
    expect(summary.canTrustPermissionAudit).toBe(false);
    expect(summary.safety).toContain("evidence-only");
  });

  it("blocks when the Phase 8 goal misses a required PM child link", () => {
    const goals = remainingGoalPlan.map((goal) =>
      goal.id === "goal-phase-8-permission-audit"
        ? {
            ...goal,
            pmTaskIds: goal.pmTaskIds.filter((taskId) => taskId !== "phase-08-child-traceability")
          }
        : goal
    );
    const summary = traceability({ goals });

    expect(summary.state).toBe("blocked");
    expect(summary.missingPmTaskIds).toEqual(["phase-08-child-traceability"]);
    expect(summary.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "pm-coverage",
          status: "blocked"
        })
      ])
    );
  });

  it("blocks when the Phase 8 goal misses the blocker-priority PM child link", () => {
    const goals = remainingGoalPlan.map((goal) =>
      goal.id === "goal-phase-8-permission-audit"
        ? {
            ...goal,
            pmTaskIds: goal.pmTaskIds.filter(
              (taskId) => taskId !== "phase-08-child-blocker-priority"
            )
          }
        : goal
    );
    const summary = traceability({ goals });

    expect(summary.state).toBe("blocked");
    expect(summary.canTrustPermissionAudit).toBe(false);
    expect(summary.missingPmTaskIds).toEqual(["phase-08-child-blocker-priority"]);
  });

  it("blocks when a required Phase 8 PM row is missing from the current board plan", () => {
    currentProjectManagementPhasePlanTaskIds.delete("phase-08-child-blocker-priority");

    try {
      const summary = traceability();

      expect(summary.state).toBe("blocked");
      expect(summary.canTrustPermissionAudit).toBe(false);
      expect(summary.missingPmTaskIds).toEqual(["phase-08-child-blocker-priority"]);
    } finally {
      currentProjectManagementPhasePlanTaskIds.add("phase-08-child-blocker-priority");
    }
  });

  it("trusts permission audit only after depth, exception, PM, key, and disabled-path evidence are ready", () => {
    const summary = traceability({
      snapshot: depth({
        summaries: [
          liveSummary("terminal", "approved"),
          liveSummary("git", "approved"),
          liveSummary("plugin", "approved")
        ],
        liveAuditRecords: [liveAuditRecord],
        runtimeExecutionAudit: readyRuntimeExecutionAudit,
        runtimeExecutionAuditHistory: [executionRecord],
        runtimeProfilePermissionRequestHistory: [profileRequest],
        ownerAuditReviewRecord: ownerReviewFor({
          summaries: [
            liveSummary("terminal", "approved"),
            liveSummary("git", "approved"),
            liveSummary("plugin", "approved")
          ],
          liveAuditRecords: [liveAuditRecord],
          runtimeExecutionAudit: readyRuntimeExecutionAudit,
          runtimeExecutionAuditHistory: [executionRecord],
          runtimeProfilePermissionRequestHistory: [profileRequest]
        })
      }),
      goals: withCurrentPhase8Goal()
    });

    expect(summary.state).toBe("ready");
    expect(summary.canTrustPermissionAudit).toBe(true);
    expect(summary.readyCount).toBe(5);
    expect(summary.evidenceKeyCount).toBe(summary.auditDepthItemCount + summary.exceptionCount);
    expect(summary.openExceptionCount).toBe(0);
  });

  it("does not trust permission audit when Phase 8 is current but still next", () => {
    const summary = traceability({
      snapshot: depth({
        summaries: [
          liveSummary("terminal", "approved"),
          liveSummary("git", "approved"),
          liveSummary("plugin", "approved")
        ],
        liveAuditRecords: [liveAuditRecord],
        runtimeExecutionAudit: readyRuntimeExecutionAudit,
        runtimeExecutionAuditHistory: [executionRecord],
        runtimeProfilePermissionRequestHistory: [profileRequest],
        ownerAuditReviewRecord: ownerReviewFor({
          summaries: [
            liveSummary("terminal", "approved"),
            liveSummary("git", "approved"),
            liveSummary("plugin", "approved")
          ],
          liveAuditRecords: [liveAuditRecord],
          runtimeExecutionAudit: readyRuntimeExecutionAudit,
          runtimeExecutionAuditHistory: [executionRecord],
          runtimeProfilePermissionRequestHistory: [profileRequest]
        })
      }),
      goals: withCurrentNextPhase8Goal()
    });

    expect(summary.state).toBe("waiting");
    expect(summary.canTrustPermissionAudit).toBe(false);
    expect(summary.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "active-goal", status: "waiting" })
      ])
    );
  });

  it("does not trust permission audit when Phase 8 duplicates the current active goal", () => {
    const readyDepth = depth({
      summaries: [
        liveSummary("terminal", "approved"),
        liveSummary("git", "approved"),
        liveSummary("plugin", "approved")
      ],
      liveAuditRecords: [liveAuditRecord],
      runtimeExecutionAudit: readyRuntimeExecutionAudit,
      runtimeExecutionAuditHistory: [executionRecord],
      runtimeProfilePermissionRequestHistory: [profileRequest],
      ownerAuditReviewRecord: ownerReviewFor({
        summaries: [
          liveSummary("terminal", "approved"),
          liveSummary("git", "approved"),
          liveSummary("plugin", "approved")
        ],
        liveAuditRecords: [liveAuditRecord],
        runtimeExecutionAudit: readyRuntimeExecutionAudit,
        runtimeExecutionAuditHistory: [executionRecord],
        runtimeProfilePermissionRequestHistory: [profileRequest]
      })
    });
    const summary = traceability({
      snapshot: readyDepth,
      goals: withDuplicateCurrentActivePhase8Goal()
    });

    expect(summary.state).toBe("review");
    expect(summary.canTrustPermissionAudit).toBe(false);
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

  it("does not trust permission audit without persisted owner review and rollback evidence", () => {
    const summary = traceability({
      snapshot: depth({
        summaries: [
          liveSummary("terminal", "approved"),
          liveSummary("git", "approved"),
          liveSummary("plugin", "approved")
        ],
        liveAuditRecords: [liveAuditRecord],
        runtimeExecutionAudit: readyRuntimeExecutionAudit,
        runtimeExecutionAuditHistory: [executionRecord],
        runtimeProfilePermissionRequestHistory: [profileRequest]
      })
    });

    expect(summary.state).toBe("waiting");
    expect(summary.canTrustPermissionAudit).toBe(false);
    expect(summary.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "audit-depth",
          status: "waiting",
          detail: expect.stringContaining("audit-depth rows")
        })
      ])
    );
  });

  it("blocks when disabled-path lock copy is missing", () => {
    const snapshot = depth({
      summaries: [liveSummary("terminal", "approved")],
      liveAuditRecords: [liveAuditRecord],
      runtimeExecutionAudit: readyRuntimeExecutionAudit,
      runtimeExecutionAuditHistory: [executionRecord],
      runtimeProfilePermissionRequestHistory: [profileRequest],
      ownerAuditReviewRecord: ownerReviewFor({
        summaries: [liveSummary("terminal", "approved")],
        liveAuditRecords: [liveAuditRecord],
        runtimeExecutionAudit: readyRuntimeExecutionAudit,
        runtimeExecutionAuditHistory: [executionRecord],
        runtimeProfilePermissionRequestHistory: [profileRequest]
      })
    });
    const summary = traceability({
      snapshot: {
        ...snapshot,
        exceptions: snapshot.exceptions.map((exception, index) =>
          index === 0
            ? {
                ...exception,
                disabledPath: "Permission copy is incomplete."
              }
            : exception
        )
      }
    });

    expect(summary.state).toBe("blocked");
    expect(summary.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "disabled-path-lock",
          status: "blocked"
        })
      ])
    );
  });

  it("keeps traceability text public-safe", () => {
    const summary = traceability({
      goals: remainingGoalPlan.map((goal) =>
        goal.id === "goal-phase-8-permission-audit"
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
