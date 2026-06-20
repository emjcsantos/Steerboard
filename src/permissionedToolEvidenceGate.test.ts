import { describe, expect, it } from "vitest";
import type { Phase9RunnerCloseoutStatus } from "./phase9RunnerCloseoutStatus";
import { buildPermissionedToolEvidenceGate } from "./permissionedToolEvidenceGate";

function closeout(
  overrides: Partial<Phase9RunnerCloseoutStatus> = {}
): Phase9RunnerCloseoutStatus {
  return {
    id: "phase-9-runner-closeout-status",
    label: "Phase 9 runner closeout status",
    state: "review",
    statusLabel: "Review",
    readiness: 90,
    implementationComplete: true,
    fixedProbeReady: false,
    runnerExpansionLocked: true,
    approvalSurfaceReady: true,
    approvalDepthReady: true,
    traceabilityTrusted: true,
    blockerPriorityClear: true,
    requestGateReady: false,
    completionGateReady: false,
    linkedPmTaskCount: 11,
    requiredPmTaskCount: 11,
    openBlockerCount: 0,
    topHold: "request-gate",
    phase9RunnerCloseoutStatusProof:
      "phase9RunnerCloseoutStatusProof=state=review fixedProbe=held runnerExpansion=locked requestGate=held completionGate=held",
    nextAction: "Finish the fixed terminal-readonly-probe closeout proof.",
    safety: "Evidence-only.",
    ariaLabel: "Phase 9 runner closeout status: Review",
    ...overrides
  };
}

const completeCloseout = closeout({
  state: "complete",
  statusLabel: "Complete",
  readiness: 100,
  fixedProbeReady: true,
  requestGateReady: true,
  completionGateReady: true,
  topHold: "none",
  phase9RunnerCloseoutStatusProof:
    "phase9RunnerCloseoutStatusProof=state=complete fixedProbe=ready runnerExpansion=locked requestGate=ready completionGate=ready",
  nextAction: "Phase 9 closeout is ready for the fixed terminal-readonly-probe only."
});

describe("permissioned Terminal/Git evidence gate", () => {
  it("holds permissioned capture until the fixed read-only runner path is proven", () => {
    const gate = buildPermissionedToolEvidenceGate(closeout());

    expect(gate.state).toBe("review");
    expect(gate.canRequestCapture).toBe(false);
    expect(gate.readOnlyProofReady).toBe(false);
    expect(gate.permissionedToolEvidenceGateProof).toContain("readOnlyProof=held");
    expect(gate.safety).toContain("metadata-only");
  });

  it("requires explicit Terminal and Git approvals after read-only proof is ready", () => {
    const gate = buildPermissionedToolEvidenceGate(completeCloseout);

    expect(gate.state).toBe("review");
    expect(gate.readOnlyProofReady).toBe(true);
    expect(gate.approvedSurfaceCount).toBe(0);
    expect(gate.canRequestCapture).toBe(false);
    expect(gate.permissionedToolEvidenceGateProof).toContain("approvals=0/2");
  });

  it("allows only a scoped capture request when both approvals are present", () => {
    const gate = buildPermissionedToolEvidenceGate(completeCloseout, {
      terminal: true,
      git: true
    });

    expect(gate.state).toBe("ready");
    expect(gate.canRequestCapture).toBe(true);
    expect(gate.approvedSurfaceCount).toBe(2);
    expect(gate.permissionedToolEvidenceGateProof).toContain("canRequest=yes");
    expect(gate.nextAction).toContain("broader runner actions locked");
  });

  it("blocks when Phase 9 runner closeout is blocked even if approvals are present", () => {
    const gate = buildPermissionedToolEvidenceGate(
      closeout({
        state: "blocked",
        statusLabel: "Blocked",
        readiness: 0,
        topHold: "traceability",
        phase9RunnerCloseoutStatusProof:
          "phase9RunnerCloseoutStatusProof=state=blocked fixedProbe=held runnerExpansion=locked"
      }),
      {
        terminal: true,
        git: true
      }
    );

    expect(gate.state).toBe("blocked");
    expect(gate.canRequestCapture).toBe(false);
    expect(gate.items.every((item) => item.state === "blocked")).toBe(true);
  });
});
