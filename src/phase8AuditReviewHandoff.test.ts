import { describe, expect, it } from "vitest";
import type { LiveActionAuditRecord } from "./liveActionAudit";
import type { LiveActionPermissionRequestSummary } from "./liveActionPermission";
import type { RuntimeExecutionAuditSnapshot } from "./runtimeExecutionAudit";
import type { RuntimeExecutionAuditRecord } from "./runtimeExecutionAuditHistory";
import type { RuntimeProfilePermissionApprovalSnapshot } from "./runtimeProfilePermissionApproval";
import type { RuntimeProfilePermissionAuditSnapshot } from "./runtimeProfilePermissionAudit";
import type { RuntimeProfilePermissionRequestRecord } from "./runtimeProfilePermissionRequestHistory";
import type { Phase8AuditReviewArtifactVerification } from "./phase8AuditReviewArtifact";
import { buildPhase8AuditReviewHandoff } from "./phase8AuditReviewHandoff";
import { createPhase8AuditReviewRecord } from "./phase8AuditReviewRecord";
import { buildPhase8PermissionAuditDepth } from "./phase8PermissionAuditDepth";
import { buildPhase8RiskBlockerPriority } from "./phase8RiskBlockerPriority";
import { buildPhase8RiskTraceabilitySummary } from "./phase8RiskTraceability";

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

function phase8Bundle(options: { approved?: boolean } = {}) {
  const snapshot = buildPhase8PermissionAuditDepth({
    liveActionSummaries: options.approved
      ? [liveSummary("terminal", "approved"), liveSummary("git", "approved"), liveSummary("plugin", "approved")]
      : [liveSummary("terminal"), liveSummary("git"), liveSummary("plugin")],
    liveActionAuditRecords: options.approved ? [liveAuditRecord] : [],
    runtimeExecutionAudit: readyRuntimeExecutionAudit,
    runtimeExecutionAuditHistory: options.approved ? [readyAuditRecord] : [],
    runtimeProfilePermissionApproval: readyProfilePermissionApproval,
    runtimeProfilePermissionAudit: readyProfilePermissionAudit,
    runtimeProfilePermissionRequestHistory: options.approved ? [readyProfileRequest] : []
  });
  const traceability = buildPhase8RiskTraceabilitySummary({ snapshot });
  const blockerPriority = buildPhase8RiskBlockerPriority({ snapshot, traceability });

  return { snapshot, traceability, blockerPriority };
}

function artifactVerification(
  overrides: Partial<Phase8AuditReviewArtifactVerification> = {}
): Phase8AuditReviewArtifactVerification {
  return {
    state: "review",
    statusLabel: "Review",
    readiness: 65,
    canVerifyOffline: true,
    detail: "Artifact is reviewable.",
    nextAction: "Review the current Phase 8 artifact.",
    auditDepthItemCount: 10,
    exceptionCount: 10,
    openExceptionCount: 4,
    disabledPathCount: 10,
    evidenceKeyCount: 20,
    openBlockerCount: 4,
    mutationLocked: true,
    hasReviewRecord: false,
    ...overrides
  };
}

describe("phase 8 audit review handoff", () => {
  it("keeps owner audit review recordable while mutation paths stay locked", () => {
    const bundle = phase8Bundle();
    const handoff = buildPhase8AuditReviewHandoff({
      ...bundle,
      artifactVerification: artifactVerification()
    });

    expect(handoff.state).toBe("waiting");
    expect(handoff.canRecordOwnerReview).toBe(true);
    expect(handoff.ownerReviewRecorded).toBe(false);
    expect(handoff.mutationLocked).toBe(true);
    expect(handoff.phase8AuditReviewHandoffProof).toContain("recordable=yes");
    expect(handoff.phase8AuditReviewHandoffProof).toContain("mutation=locked");
    expect(handoff.phase8AuditReviewHandoffProof).toContain("fingerprintCurrent=no");
    expect(handoff.phase8AuditReviewHandoffProof).toContain("reviewedBlocker=missing");
    expect(handoff.safety).toContain("does not request approval");
  });

  it("blocks owner review handoff when artifact evidence shows mutation unlock", () => {
    const bundle = phase8Bundle();
    const handoff = buildPhase8AuditReviewHandoff({
      ...bundle,
      artifactVerification: artifactVerification({
        state: "blocked",
        statusLabel: "Blocked",
        mutationLocked: false
      })
    });

    expect(handoff.state).toBe("blocked");
    expect(handoff.canRecordOwnerReview).toBe(false);
    expect(handoff.mutationLocked).toBe(false);
    expect(handoff.phase8AuditReviewHandoffProof).toContain("mutation=unlocked");
  });

  it("reports ready after the owner review record captures the current top blocker", () => {
    const bundle = phase8Bundle({ approved: true });
    const reviewRecord = createPhase8AuditReviewRecord(
      bundle.snapshot,
      "2026-06-18T09:00:00.000Z",
      bundle.blockerPriority
    );
    const handoff = buildPhase8AuditReviewHandoff({
      ...bundle,
      artifactVerification: artifactVerification({ state: "ready", hasReviewRecord: true }),
      reviewRecord
    });

    expect(handoff.state).toBe("ready");
    expect(handoff.canRecordOwnerReview).toBe(false);
    expect(handoff.ownerReviewRecorded).toBe(true);
    expect(handoff.reviewRecordId).toBe(reviewRecord.id);
    expect(handoff.phase8AuditReviewHandoffProof).toContain("recorded=yes");
    expect(handoff.phase8AuditReviewHandoffProof).toContain("artifactState=ready");
    expect(handoff.phase8AuditReviewHandoffProof).toContain("fingerprintCurrent=yes");
    expect(handoff.phase8AuditReviewHandoffProof).toContain("reviewedBlocker=attached");
    expect(handoff.phase8AuditReviewHandoffProof).toContain(reviewRecord.id);
  });

  it("keeps recorded owner reviews in review until the current artifact is ready", () => {
    const bundle = phase8Bundle({ approved: true });
    const reviewRecord = createPhase8AuditReviewRecord(
      bundle.snapshot,
      "2026-06-18T09:00:00.000Z",
      bundle.blockerPriority
    );
    const handoff = buildPhase8AuditReviewHandoff({
      ...bundle,
      artifactVerification: artifactVerification({
        state: "review",
        hasReviewRecord: true
      }),
      reviewRecord
    });

    expect(handoff.state).toBe("review");
    expect(handoff.ownerReviewRecorded).toBe(true);
    expect(handoff.artifactVerified).toBe(false);
    expect(handoff.nextAction).toContain("Verify the current Phase 8 audit artifact");
    expect(handoff.phase8AuditReviewHandoffProof).toContain("artifactState=review");
    expect(handoff.phase8AuditReviewHandoffProof).toContain("fingerprintCurrent=yes");
  });

  it("keeps stale owner reviews in review until the audit fingerprint is current", () => {
    const bundle = phase8Bundle({ approved: true });
    const staleRecord = createPhase8AuditReviewRecord(
      {
        ...bundle.snapshot,
        riskyActionCount: bundle.snapshot.riskyActionCount + 1
      },
      "2026-06-18T09:00:00.000Z",
      bundle.blockerPriority
    );
    const handoff = buildPhase8AuditReviewHandoff({
      ...bundle,
      artifactVerification: artifactVerification({ state: "ready", hasReviewRecord: true }),
      reviewRecord: staleRecord
    });

    expect(handoff.state).toBe("review");
    expect(handoff.auditFingerprintCurrent).toBe(false);
    expect(handoff.nextAction).toContain("current audit fingerprint");
    expect(handoff.phase8AuditReviewHandoffProof).toContain("fingerprintCurrent=no");
  });

  it("keeps partial reviewed-blocker records in review", () => {
    const bundle = phase8Bundle({ approved: true });
    const partialRecord = {
      ...createPhase8AuditReviewRecord(
        bundle.snapshot,
        "2026-06-18T09:00:00.000Z",
        bundle.blockerPriority
      ),
      topBlockerAction: undefined
    };
    const handoff = buildPhase8AuditReviewHandoff({
      ...bundle,
      artifactVerification: artifactVerification({ state: "ready", hasReviewRecord: true }),
      reviewRecord: partialRecord
    });

    expect(handoff.state).toBe("review");
    expect(handoff.reviewedBlockerProof).toBe(false);
    expect(handoff.nextAction).toContain("complete reviewed-blocker proof");
    expect(handoff.phase8AuditReviewHandoffProof).toContain("reviewedBlocker=missing");
  });
});
