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
import { buildPhase8PermissionAuditCompletionGate } from "./phase8PermissionAuditCompletionGate";
import { buildPhase8PermissionAuditDepth } from "./phase8PermissionAuditDepth";
import { buildPhase8RiskBlockerPriority } from "./phase8RiskBlockerPriority";
import { buildPhase8RiskTraceabilitySummary } from "./phase8RiskTraceability";

function liveSummary(
  provider: string,
  state: LiveActionPermissionRequestSummary["state"] = "approved"
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

function readySnapshot() {
  const baseInput = {
    liveActionSummaries: [
      liveSummary("terminal"),
      liveSummary("git"),
      liveSummary("plugin")
    ],
    liveActionAuditRecords: [liveAuditRecord],
    runtimeExecutionAudit: readyRuntimeExecutionAudit,
    runtimeExecutionAuditHistory: [readyAuditRecord],
    runtimeProfilePermissionApproval: readyProfilePermissionApproval,
    runtimeProfilePermissionAudit: readyProfilePermissionAudit,
    runtimeProfilePermissionRequestHistory: [readyProfileRequest]
  };
  const baseSnapshot = buildPhase8PermissionAuditDepth(baseInput);
  const baseTraceability = buildPhase8RiskTraceabilitySummary({ snapshot: baseSnapshot });
  const baseBlockerPriority = buildPhase8RiskBlockerPriority({
    snapshot: baseSnapshot,
    traceability: baseTraceability
  });
  const reviewRecord = createPhase8AuditReviewRecord(
    baseSnapshot,
    "2026-06-18T09:00:00.000Z",
    baseBlockerPriority
  );
  const snapshot = buildPhase8PermissionAuditDepth({
    ...baseInput,
    ownerAuditReviewRecord: reviewRecord
  });
  const traceability = buildPhase8RiskTraceabilitySummary({ snapshot });
  const blockerPriority = buildPhase8RiskBlockerPriority({ snapshot, traceability });

  return {
    snapshot,
    traceability,
    blockerPriority,
    reviewRecord
  };
}

function artifactVerification(
  overrides: Partial<Phase8AuditReviewArtifactVerification> = {}
): Phase8AuditReviewArtifactVerification {
  return {
    state: "ready",
    statusLabel: "Ready",
    readiness: 100,
    canVerifyOffline: true,
    detail: "Artifact is ready.",
    nextAction: "Keep Phase 8 artifact attached.",
    auditDepthItemCount: 10,
    exceptionCount: 10,
    openExceptionCount: 0,
    disabledPathCount: 10,
    evidenceKeyCount: 20,
    openBlockerCount: 0,
    mutationLocked: true,
    hasReviewRecord: true,
    ...overrides
  };
}

describe("phase 8 permission audit completion gate", () => {
  it("waits until owner review and artifact verification are attached", () => {
    const { blockerPriority, snapshot, traceability } = readySnapshot();
    const gate = buildPhase8PermissionAuditCompletionGate({
      snapshot,
      traceability,
      blockerPriority
    });

    expect(gate.state).toBe("waiting");
    expect(gate.phaseComplete).toBe(false);
    expect(gate.completionGateProof).toContain("phase8PermissionAuditCompletionGate");
    expect(gate.completionGateProof).toContain("ownerReview=missing");
    expect(gate.completionGateProof).toContain("artifact=held");
    expect(gate.completionGateProof).toContain("handoff=held");
    expect(gate.completionGateProof).toContain("handoffState=missing");
    expect(gate.canAdvanceMutationPaths).toBe(false);
  });

  it("blocks when artifact evidence shows mutation paths are unlocked", () => {
    const { blockerPriority, reviewRecord, snapshot, traceability } = readySnapshot();
    const gate = buildPhase8PermissionAuditCompletionGate({
      snapshot,
      traceability,
      blockerPriority,
      reviewRecord,
      artifactVerification: artifactVerification({
        state: "blocked",
        statusLabel: "Blocked",
        readiness: 0,
        mutationLocked: false
      })
    });

    expect(gate.state).toBe("blocked");
    expect(gate.mutationLocked).toBe(false);
    expect(gate.completionGateProof).toContain("mutation=unlocked");
  });

  it("keeps completion in review until owner-review handoff proof is ready", () => {
    const { blockerPriority, reviewRecord, snapshot, traceability } = readySnapshot();
    const heldHandoff = buildPhase8AuditReviewHandoff({
      snapshot,
      traceability,
      blockerPriority,
      reviewRecord,
      artifactVerification: artifactVerification({
        state: "review",
        statusLabel: "Review"
      })
    });
    const gate = buildPhase8PermissionAuditCompletionGate({
      snapshot,
      traceability,
      blockerPriority,
      reviewRecord,
      artifactVerification: artifactVerification(),
      auditReviewHandoff: heldHandoff
    });

    expect(gate.state).toBe("review");
    expect(gate.phaseComplete).toBe(false);
    expect(gate.ownerHandoffReady).toBe(false);
    expect(gate.ownerHandoffState).toBe("review");
    expect(gate.completionGateProof).toContain("handoff=held");
    expect(gate.completionGateProof).toContain("handoffState=review");
    expect(gate.nextAction).toContain("Verify the current Phase 8 audit artifact");
  });

  it("completes only with trusted traceability, no blockers, owner review, artifact proof, and reviewed-blocker proof", () => {
    const { blockerPriority, reviewRecord, snapshot, traceability } = readySnapshot();
    const readyHandoff = buildPhase8AuditReviewHandoff({
      snapshot,
      traceability,
      blockerPriority,
      reviewRecord,
      artifactVerification: artifactVerification()
    });
    const gate = buildPhase8PermissionAuditCompletionGate({
      snapshot,
      traceability,
      blockerPriority,
      reviewRecord,
      artifactVerification: artifactVerification(),
      auditReviewHandoff: readyHandoff
    });

    expect(gate.state).toBe("complete");
    expect(gate.phaseComplete).toBe(true);
    expect(gate.traceabilityTrusted).toBe(true);
    expect(gate.ownerReviewAttached).toBe(true);
    expect(gate.artifactReady).toBe(true);
    expect(gate.ownerHandoffReady).toBe(true);
    expect(gate.ownerHandoffFingerprintCurrent).toBe(true);
    expect(gate.reviewedBlockerProof).toBe(true);
    expect(gate.canAdvanceMutationPaths).toBe(false);
    expect(gate.completionGateProof).toContain("phaseComplete=yes");
    expect(gate.completionGateProof).toContain("canAdvanceMutationPaths=no");
    expect(gate.completionGateProof).toContain("handoff=ready");
    expect(gate.completionGateProof).toContain("handoffFingerprint=current");
  });
});
