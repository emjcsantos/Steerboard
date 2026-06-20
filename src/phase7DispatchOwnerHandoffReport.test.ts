import { describe, expect, it } from "vitest";
import type { DispatchReviewRecord } from "./dispatchReviewRecord";
import type { Phase7DispatchCloseoutProof } from "./phase7DispatchCloseoutProof";
import { buildPhase7DispatchOwnerHandoffReport } from "./phase7DispatchOwnerHandoffReport";

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
    handoffPackets: [
      {
        role: "orchestrator",
        panelId: "orchestrator",
        owner: "Planning",
        files: ["src/planning.ts"],
        ownedAreas: ["planning"],
        acceptanceSummary: "Plan accepted.",
        dependencies: [],
        validationLabel: "ready",
        noRuntimeExecutionNote: "No runtime execution in local preview."
      },
      {
        role: "implementer",
        panelId: "implementer",
        owner: "Implementer",
        files: ["src/App.tsx"],
        ownedAreas: ["implementation"],
        acceptanceSummary: "Implementation accepted.",
        dependencies: ["planning"],
        validationLabel: "ready",
        noRuntimeExecutionNote: "No runtime execution in local preview."
      },
      {
        role: "validator",
        panelId: "validator",
        owner: "Validator",
        files: ["src/App.test.tsx"],
        ownedAreas: ["validation"],
        acceptanceSummary: "Validation accepted.",
        dependencies: ["implementer"],
        validationLabel: "ready",
        noRuntimeExecutionNote: "No runtime execution in local preview."
      },
      {
        role: "integration",
        panelId: "integration",
        owner: "Main Codex",
        files: ["src/projectManagementPhasePlan.ts"],
        ownedAreas: ["integration"],
        acceptanceSummary: "Integration accepted.",
        dependencies: ["planning", "implementer", "validation"],
        validationLabel: "ready",
        noRuntimeExecutionNote: "No runtime execution in local preview."
      }
    ],
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

function closeout(overrides: Partial<Phase7DispatchCloseoutProof> = {}): Phase7DispatchCloseoutProof {
  return {
    state: "ready",
    statusLabel: "Ready",
    readiness: 100,
    canCloseDispatchReview: true,
    canSpawnLiveWorker: false,
    artifactVerificationState: "ready",
    launchGateState: "locked",
    closureGateState: "ready",
    openBlockerCount: 0,
    approvalRequired: true,
    detail: "Phase 7 dispatch closeout is ready as a local metadata handoff.",
    nextAction: "Use this closeout proof for owner review.",
    closeoutProof:
      "phase7DispatchCloseoutProof state=ready artifactVerification=ready launchGate=locked closureGate=ready canClose=yes canSpawn=no approval=required open=0",
    ...overrides
  };
}

describe("phase 7 dispatch owner handoff report", () => {
  it("creates a ready owner handoff report from ready closeout proof", () => {
    const report = buildPhase7DispatchOwnerHandoffReport({
      record: record(),
      closeout: closeout()
    });

    expect(report).toMatchObject({
      state: "ready",
      statusLabel: "Ready",
      readiness: 100,
      finalValidationOwner: "Main Codex",
      commitPushReportingOwner: "Main Codex",
      pushApprovalRequired: true,
      canCloseDispatchReview: true,
      canSpawnLiveWorker: false,
      handoffPacketCount: 4,
      validationGateCount: 2,
      traceabilityLinkCount: 5,
      closeoutState: "ready"
    });
    expect(report.detail).toContain("final validation, push approval, and reporting");
    expect(report.ownerHandoffProof).toContain("phase7DispatchOwnerHandoffReport");
    expect(report.ownerHandoffProof).toContain("pushApproval=required");
    expect(report.ownerHandoffProof).toContain("canSpawn=no");
  });

  it("keeps owner handoff in review when owners or packets are incomplete", () => {
    const report = buildPhase7DispatchOwnerHandoffReport({
      record: record({
        commitPushReportingOwner: "Worker",
        handoffPackets: [],
        traceabilityLinkCount: 3
      }),
      closeout: closeout({
        state: "review",
        statusLabel: "Review",
        canCloseDispatchReview: false,
        nextAction: "Review closeout proof."
      })
    });

    expect(report).toMatchObject({
      state: "review",
      canCloseDispatchReview: false,
      canSpawnLiveWorker: false,
      commitPushReportingOwner: "Worker",
      handoffPacketCount: 0,
      traceabilityLinkCount: 3,
      closeoutState: "review"
    });
    expect(report.nextAction).toBe("Review closeout proof.");
  });

  it("blocks owner handoff when closeout loses the no-spawn boundary", () => {
    const report = buildPhase7DispatchOwnerHandoffReport({
      record: record(),
      closeout: closeout({
        state: "blocked",
        statusLabel: "Blocked",
        canCloseDispatchReview: false,
        canSpawnLiveWorker: true
      })
    });

    expect(report).toMatchObject({
      state: "blocked",
      canCloseDispatchReview: false,
      canSpawnLiveWorker: false,
      closeoutState: "blocked"
    });
    expect(report.detail).toContain("closeout proof failed");
  });
});
