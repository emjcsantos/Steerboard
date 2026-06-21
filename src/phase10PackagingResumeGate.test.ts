import { describe, expect, it } from "vitest";
import type { Phase10ArenaPolishCloseoutStatus } from "./phase10ArenaPolishCloseoutStatus";
import { buildPhase10PackagingResumeGate } from "./phase10PackagingResumeGate";

function closeout(
  overrides: Partial<Phase10ArenaPolishCloseoutStatus> = {}
): Phase10ArenaPolishCloseoutStatus {
  return {
    id: "phase-10-arena-polish-closeout-status",
    label: "Phase 10 Arena polish closeout status",
    state: "complete",
    statusLabel: "Complete",
    readiness: 100,
    implementationComplete: true,
    arenaPolishReady: true,
    traceabilityTrusted: true,
    blockerPriorityClear: true,
    flexLayoutDeferred: true,
    packagingPaused: true,
    canResumePackaging: false,
    ownerResumeApproved: false,
    installPathLocked: true,
    desktopPackagingLocked: true,
    releaseGateRequired: true,
    linkedPmTaskCount: 10,
    requiredPmTaskCount: 10,
    openBlockerCount: 0,
    arenaReviewAddressableCount: 0,
    topHold: "none",
    phase10ArenaPolishCloseoutStatusProof:
      "phase10ArenaPolishCloseoutStatusProof=state=complete polish=ready traceability=ready blockers=clear flexLayout=defer packaging=paused canResumePackaging=no ownerResume=missing installPath=locked desktopPackaging=locked releaseGate=required",
    nextAction:
      "Phase 10 Arena polish closeout proof is ready; keep packaging paused until the owner explicitly resumes release actions.",
    safety: "Evidence-only.",
    ariaLabel: "Phase 10 Arena polish closeout status: Complete",
    ...overrides
  };
}

describe("Phase 10 packaging resume gate", () => {
  it("keeps packaging paused when Arena closeout is ready but owner resume approval is missing", () => {
    const gate = buildPhase10PackagingResumeGate(closeout());

    expect(gate.state).toBe("review");
    expect(gate.closeoutReady).toBe(true);
    expect(gate.ownerResumeApproved).toBe(false);
    expect(gate.canResumePackaging).toBe(false);
    expect(gate.installPathLocked).toBe(true);
    expect(gate.desktopPackagingLocked).toBe(true);
    expect(gate.phase10PackagingResumeGateProof).toContain("ownerResume=missing");
    expect(gate.phase10PackagingResumeGateProof).toContain("canResume=no");
  });

  it("can resume only after explicit owner approval while still requiring Phase 11 release gate", () => {
    const gate = buildPhase10PackagingResumeGate(closeout(), {
      ownerResumeApproved: true
    });

    expect(gate.state).toBe("ready");
    expect(gate.canResumePackaging).toBe(true);
    expect(gate.releaseGateRequired).toBe(true);
    expect(gate.phase10PackagingResumeGateProof).toContain("ownerResume=approved");
    expect(gate.nextAction).toContain("Phase 11 release-readiness gate");
  });

  it("holds when closeout proof is not complete", () => {
    const gate = buildPhase10PackagingResumeGate(
      closeout({
        state: "review",
        statusLabel: "Review",
        arenaPolishReady: false,
        topHold: "arena-polish",
        phase10ArenaPolishCloseoutStatusProof:
          "phase10ArenaPolishCloseoutStatusProof=state=review polish=held packaging=paused"
      }),
      {
        ownerResumeApproved: true
      }
    );

    expect(gate.state).toBe("review");
    expect(gate.closeoutReady).toBe(false);
    expect(gate.canResumePackaging).toBe(false);
    expect(gate.phase10PackagingResumeGateProof).toContain("closeout=held");
  });

  it("blocks when Phase 10 closeout is blocked", () => {
    const gate = buildPhase10PackagingResumeGate(
      closeout({
        state: "blocked",
        statusLabel: "Blocked",
        readiness: 0,
        topHold: "arena-polish",
        phase10ArenaPolishCloseoutStatusProof:
          "phase10ArenaPolishCloseoutStatusProof=state=blocked polish=held packaging=paused"
      })
    );

    expect(gate.state).toBe("blocked");
    expect(gate.canResumePackaging).toBe(false);
    expect(gate.detail).toContain("blocked by Phase 10 Arena closeout");
  });
});
