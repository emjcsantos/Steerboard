import { describe, expect, it } from "vitest";
import { buildPhase7DispatchCompletionGate } from "./phase7DispatchCompletionGate";
import type { Phase7DispatchOwnerHandoffReport } from "./phase7DispatchOwnerHandoffReport";

function report(
  overrides: Partial<Phase7DispatchOwnerHandoffReport> = {}
): Phase7DispatchOwnerHandoffReport {
  return {
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
    closeoutState: "ready",
    detail:
      "Phase 7 owner handoff is ready for final validation, push approval, and reporting review while live-worker spawning stays locked.",
    nextAction:
      "Use the owner handoff report for final review; push remains held until the owner explicitly approves.",
    ownerHandoffProof:
      "phase7DispatchOwnerHandoffReport state=ready closeout=ready finalValidationOwner=Main Codex commitPushReportingOwner=Main Codex pushApproval=required canClose=yes canSpawn=no packets=4/4 validationGates=2 traceabilityLinks=5/5",
    ...overrides
  };
}

describe("phase 7 dispatch completion gate", () => {
  it("marks Phase 7 complete when owner handoff is ready and no live worker can spawn", () => {
    const gate = buildPhase7DispatchCompletionGate(report());

    expect(gate).toMatchObject({
      state: "complete",
      statusLabel: "Complete",
      readiness: 100,
      phaseComplete: true,
      canSpawnLiveWorker: false,
      canCreateWorkerSession: false,
      workerSessionCreationHeld: true,
      ownerHandoffState: "ready",
      pushApprovalRequired: true,
      sessionCreationApprovalRequired: true,
      finalValidationOwner: "Main Codex",
      commitPushReportingOwner: "Main Codex",
      handoffPacketCount: 4,
      validationGateCount: 2,
      traceabilityLinkCount: 5
    });
    expect(gate.detail).toContain("local metadata handoff");
    expect(gate.completionGateProof).toContain("phaseComplete=yes");
    expect(gate.completionGateProof).toContain("canSpawn=no");
    expect(gate.completionGateProof).toContain("workerSession=held");
    expect(gate.completionGateProof).toContain("sessionApproval=required");
    expect(gate.completionGateProof).toContain("canCreateSession=no");
  });

  it("keeps Phase 7 in review when owner handoff is incomplete", () => {
    const gate = buildPhase7DispatchCompletionGate(
      report({
        state: "review",
        statusLabel: "Review",
        canCloseDispatchReview: false,
        handoffPacketCount: 3,
        nextAction: "Review owner handoff."
      })
    );

    expect(gate).toMatchObject({
      state: "review",
      phaseComplete: false,
      canSpawnLiveWorker: false,
      ownerHandoffState: "review",
      handoffPacketCount: 3
    });
    expect(gate.nextAction).toBe("Review owner handoff.");
    expect(gate.completionGateProof).toContain("phaseComplete=no");
  });

  it("blocks Phase 7 completion when owner handoff loses no-spawn state", () => {
    const gate = buildPhase7DispatchCompletionGate(
      report({
        state: "blocked",
        statusLabel: "Blocked",
        canCloseDispatchReview: false,
        canSpawnLiveWorker: true
      })
    );

    expect(gate).toMatchObject({
      state: "blocked",
      phaseComplete: false,
      canSpawnLiveWorker: false,
      ownerHandoffState: "blocked"
    });
    expect(gate.detail).toContain("live-worker spawning is not locked");
  });
});
