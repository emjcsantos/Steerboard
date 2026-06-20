import { describe, expect, it } from "vitest";
import type { DispatchReviewRecord } from "./dispatchReviewRecord";
import type { Phase7DispatchReviewArtifactVerification } from "./phase7DispatchReviewArtifact";
import type { Phase7LiveWorkerLaunchGate } from "./phase7LiveWorkerLaunchGate";
import { buildPhase7DispatchClosureGate } from "./phase7DispatchClosureGate";

function record(overrides: Partial<DispatchReviewRecord> = {}): DispatchReviewRecord {
  return {
    id: "dispatch-review-record",
    sourcePackageId: "dispatch-package",
    runId: "run",
    planId: "plan",
    projectId: "project",
    projectName: "Project",
    title: "Dispatch Review",
    createdAt: "2026-06-20T08:00:00.000Z",
    packageStatus: "ready",
    readinessState: "complete",
    risk: "medium",
    deployMode: "staged",
    panelCount: 4,
    roleCounts: {
      orchestrator: 1,
      implementer: 1,
      validator: 1,
      integration: 1
    },
    handoffTaskCount: 4,
    handoffPackets: [],
    validationGateCount: 2,
    maxAttemptLimit: 3,
    noRuntimeExecutionNote:
      "Dispatch review records are local metadata only; they do not launch worker sessions or execute runtime actions.",
    integrationOwner: "Main Codex",
    finalValidationOwner: "Main Codex",
    commitPushReportingOwner: "Main Codex",
    traceabilityLinkCount: 5,
    closureState: "ready-to-close",
    reviewEvidenceFingerprint: "phase7-dispatch-ready",
    mainIntegrationOwnershipNote:
      "Main Codex owns final integration, final validation, commit preparation, push approval, reporting, and dispatch-review traceability; worker records remain local metadata.",
    detail: "Dispatch review detail.",
    nextAction: "Confirm accepted handoff evidence before closing the dispatch review.",
    ...overrides
  };
}

function artifactVerification(
  overrides: Partial<Phase7DispatchReviewArtifactVerification> = {}
): Phase7DispatchReviewArtifactVerification {
  return {
    state: "ready",
    statusLabel: "Ready",
    readiness: 100,
    canVerifyOffline: true,
    detail: "Phase 7 dispatch review artifact is verified.",
    nextAction: "Keep the artifact attached.",
    latestRecordId: "dispatch-review-record",
    reviewRecordCount: 1,
    openDepthCount: 0,
    openOwnershipCount: 0,
    openBlockerCount: 0,
    linkedPmTaskCount: 10,
    liveWorkerLockCount: 2,
    recordEvidenceFingerprint: "phase7-dispatch-ready",
    currentEvidenceFingerprint: "phase7-dispatch-ready",
    expectedEvidenceFingerprint: "phase7-dispatch-ready",
    matchesExpectedEvidence: true,
    executionLocked: true,
    handoffPacketCount: 4,
    ...overrides
  };
}

function launchGate(overrides: Partial<Phase7LiveWorkerLaunchGate> = {}): Phase7LiveWorkerLaunchGate {
  return {
    state: "locked",
    statusLabel: "Locked",
    readiness: 95,
    canSpawnLiveWorker: false,
    approvalRequired: true,
    artifactVerificationState: "ready",
    executionLocked: true,
    openBlockerCount: 0,
    liveWorkerLockCount: 2,
    handoffPacketCount: 4,
    detail: "Phase 7 dispatch artifact is verified, but live-worker spawning remains locked.",
    nextAction: "Keep dispatch work in local metadata review.",
    launchGateProof:
      "phase7LiveWorkerLaunchGate state=locked artifactVerification=ready approval=required canSpawn=no execution=locked locks=2/2 packets=4/4 open=0",
    ...overrides
  };
}

describe("phase 7 dispatch closure gate", () => {
  it("allows metadata closure while keeping live worker spawning locked", () => {
    const gate = buildPhase7DispatchClosureGate({
      record: record(),
      artifactVerification: artifactVerification(),
      launchGate: launchGate()
    });

    expect(gate).toMatchObject({
      state: "ready",
      statusLabel: "Ready",
      readiness: 100,
      canCloseDispatchReview: true,
      canSpawnLiveWorker: false,
      closureState: "ready-to-close",
      artifactVerificationState: "ready",
      launchGateState: "locked",
      traceabilityLinkCount: 5,
      openBlockerCount: 0,
      approvalRequired: true
    });
    expect(gate.detail).toContain("metadata handoff");
    expect(gate.closureGateProof).toContain("canClose=yes");
    expect(gate.closureGateProof).toContain("canSpawn=no");
    expect(gate.closureGateProof).toContain("approval=required");
  });

  it("keeps closure in review when traceability or artifact proof is incomplete", () => {
    const gate = buildPhase7DispatchClosureGate({
      record: record({ traceabilityLinkCount: 3 }),
      artifactVerification: artifactVerification({
        state: "review",
        statusLabel: "Review",
        openBlockerCount: 1,
        nextAction: "Review dispatch traceability."
      }),
      launchGate: launchGate({ state: "review", statusLabel: "Review" })
    });

    expect(gate).toMatchObject({
      state: "review",
      canCloseDispatchReview: false,
      canSpawnLiveWorker: false,
      artifactVerificationState: "review",
      launchGateState: "review",
      traceabilityLinkCount: 3,
      openBlockerCount: 1
    });
    expect(gate.nextAction).toBe("Review dispatch traceability.");
    expect(gate.closureGateProof).toContain("traceabilityLinks=3/5");
  });

  it("blocks closure when launch safety fails", () => {
    const gate = buildPhase7DispatchClosureGate({
      record: record(),
      artifactVerification: artifactVerification({ state: "blocked", statusLabel: "Blocked" }),
      launchGate: launchGate({
        state: "blocked",
        statusLabel: "Blocked",
        canSpawnLiveWorker: false,
        executionLocked: false
      })
    });

    expect(gate).toMatchObject({
      state: "blocked",
      canCloseDispatchReview: false,
      canSpawnLiveWorker: false,
      artifactVerificationState: "blocked",
      launchGateState: "blocked"
    });
    expect(gate.detail).toContain("launch safety or artifact verification failed");
  });
});
