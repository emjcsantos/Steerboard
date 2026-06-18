import { describe, expect, it } from "vitest";
import type { LiveActionPermissionRequestSummary } from "./liveActionPermission";
import {
  createPhase8AuditReviewRecord,
  type Phase8AuditReviewRecord
} from "./phase8AuditReviewRecord";
import {
  buildPhase8AuditReviewArtifact,
  parsePhase8AuditReviewArtifact,
  serializePhase8AuditReviewArtifact,
  verifyPhase8AuditReviewArtifact,
  verifySerializedPhase8AuditReviewArtifact,
  type Phase8AuditReviewArtifact
} from "./phase8AuditReviewArtifact";
import { buildPhase8PermissionAuditDepth } from "./phase8PermissionAuditDepth";
import { buildPhase8RiskBlockerPriority } from "./phase8RiskBlockerPriority";
import { buildPhase8RiskTraceabilitySummary } from "./phase8RiskTraceability";
import type { RuntimeExecutionAuditSnapshot } from "./runtimeExecutionAudit";
import type { RuntimeProfilePermissionApprovalSnapshot } from "./runtimeProfilePermissionApproval";
import type { RuntimeProfilePermissionAuditSnapshot } from "./runtimeProfilePermissionAudit";

function liveSummary(provider: string): LiveActionPermissionRequestSummary {
  return {
    id: `${provider}:permission`,
    provider: provider as LiveActionPermissionRequestSummary["provider"],
    actionLabel: `${provider} action`,
    state: "idle",
    risk: provider === "plugin" ? "medium" : "high",
    isRiskGated: true,
    requestedAt: "2026-06-11T00:00:00.000Z",
    expiresAt: "none",
    requestedBy: "operator",
    transcriptLineCount: 0,
    detail: `${provider} requires explicit permission.`
  };
}

const waitingRuntimeExecutionAudit: RuntimeExecutionAuditSnapshot = {
  id: "runtime-launch:execution-audit",
  label: "Runtime launch execution audit",
  state: "waiting",
  statusLabel: "Waiting",
  eventCount: 0,
  transport: "local",
  canExecute: false,
  executionLocked: true,
  requiresDesktopApproval: true,
  detail: "Runtime handoff request is waiting on local bridge readiness.",
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

function artifact({
  evaluatedAt = "2026-06-18T10:00:00.000Z",
  reviewRecord
}: {
  evaluatedAt?: string;
  reviewRecord?: Phase8AuditReviewRecord;
} = {}): Phase8AuditReviewArtifact {
  const snapshot = buildPhase8PermissionAuditDepth({
    liveActionSummaries: [liveSummary("terminal"), liveSummary("git"), liveSummary("plugin")],
    liveActionAuditRecords: [],
    runtimeExecutionAudit: waitingRuntimeExecutionAudit,
    runtimeExecutionAuditHistory: [],
    runtimeProfilePermissionApproval: readyProfilePermissionApproval,
    runtimeProfilePermissionAudit: readyProfilePermissionAudit,
    runtimeProfilePermissionRequestHistory: [],
    ownerAuditReviewRecord: reviewRecord
  });
  const traceability = buildPhase8RiskTraceabilitySummary({ snapshot });
  const blockerPriority = buildPhase8RiskBlockerPriority({ snapshot, traceability });

  return buildPhase8AuditReviewArtifact({
    exportedAt: evaluatedAt,
    evaluatedAt,
    snapshot,
    traceability,
    blockerPriority,
    reviewRecord
  });
}

describe("phase 8 audit review artifact", () => {
  it("exports and verifies current Phase 8 audit evidence without marking open blockers ready", () => {
    const exported = artifact();
    const verification = verifyPhase8AuditReviewArtifact(exported, {
      verifiedAt: "2026-06-18T10:05:00.000Z"
    });

    expect(verification).toMatchObject({
      state: "review",
      auditDepthItemCount: 10,
      exceptionCount: 10,
      disabledPathCount: 10,
      evidenceKeyCount: 20,
      mutationLocked: true,
      hasReviewRecord: false
    });
    expect(verification.openExceptionCount).toBeGreaterThan(0);
    expect(verification.openBlockerCount).toBeGreaterThan(0);
    expect(verification.nextAction).toBe(exported.blockerPriority.topPriorityAction);
  });

  it("round-trips serialized artifacts and rejects malformed payloads", () => {
    const exported = artifact();
    const serialized = serializePhase8AuditReviewArtifact(exported);

    expect(parsePhase8AuditReviewArtifact(serialized)).toEqual(exported);
    expect(
      verifySerializedPhase8AuditReviewArtifact(serialized, {
        verifiedAt: "2026-06-18T10:05:00.000Z"
      }).state
    ).toBe("review");
    expect(parsePhase8AuditReviewArtifact("{")).toBeUndefined();
    expect(
      verifySerializedPhase8AuditReviewArtifact("{}", {
        verifiedAt: "2026-06-18T10:05:00.000Z"
      })
    ).toMatchObject({
      state: "waiting",
      detail: expect.stringContaining("missing or malformed")
    });
  });

  it("blocks artifacts with incomplete disabled-path mutation locks", () => {
    const exported = artifact();

    expect(
      verifyPhase8AuditReviewArtifact(
        {
          ...exported,
          snapshot: {
            ...exported.snapshot,
            exceptions: [
              {
                ...exported.snapshot.exceptions[0],
                disabledPath: "Path can execute."
              },
              ...exported.snapshot.exceptions.slice(1)
            ]
          }
        },
        { verifiedAt: "2026-06-18T10:05:00.000Z" }
      )
    ).toMatchObject({
      state: "blocked",
      detail: expect.stringContaining("mutation locks are incomplete")
    });
  });

  it("reviews stale artifacts and artifacts with incomplete evidence-key traceability", () => {
    const exported = artifact();

    expect(
      verifyPhase8AuditReviewArtifact(exported, {
        verifiedAt: "2026-06-19T10:00:01.000Z",
        maxArtifactAgeMs: 24 * 60 * 60 * 1000
      })
    ).toMatchObject({ state: "review", detail: expect.stringContaining("stale") });
    expect(
      verifyPhase8AuditReviewArtifact(
        {
          ...exported,
          traceability: { ...exported.traceability, evidenceKeyCount: 1 }
        },
        { verifiedAt: "2026-06-18T10:05:00.000Z" }
      )
    ).toMatchObject({
      state: "review",
      detail: expect.stringContaining("evidence-key traceability")
    });
  });

  it("can verify offline as ready only with trusted traceability and owner review attached", () => {
    const base = artifact();
    const reviewRecord = createPhase8AuditReviewRecord(base.snapshot, "2026-06-18T10:00:00.000Z");
    const readyArtifact: Phase8AuditReviewArtifact = {
      ...base,
      reviewRecord,
      snapshot: {
        ...base.snapshot,
        openExceptionCount: 0
      },
      traceability: {
        ...base.traceability,
        canTrustPermissionAudit: true,
        nextAction: "Permission and audit traceability is trusted."
      },
      blockerPriority: {
        ...base.blockerPriority,
        openBlockerCount: 0,
        topPriorityAction: "No Phase 8 risk blockers remain.",
        topPriorityLabel: "No open Phase 8 risk blocker"
      }
    };

    expect(
      verifyPhase8AuditReviewArtifact(readyArtifact, {
        verifiedAt: "2026-06-18T10:05:00.000Z"
      })
    ).toMatchObject({
      state: "ready",
      readiness: 100,
      mutationLocked: true,
      hasReviewRecord: true
    });
  });
});
