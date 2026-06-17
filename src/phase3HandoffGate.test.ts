import { describe, expect, it } from "vitest";
import type { Phase3ClearancePackage } from "./phase3ClearancePackage";
import { buildPhase3HandoffGate } from "./phase3HandoffGate";

function clearancePackage(
  overrides: Partial<Phase3ClearancePackage> = {}
): Phase3ClearancePackage {
  return {
    state: "ready",
    statusLabel: "Ready",
    readiness: 100,
    canExit: true,
    detail: "Phase 3 has complete evidence.",
    nextAction: "Record the Phase 3 handoff and advance provider integration only after owner review.",
    readyCount: 5,
    openCount: 0,
    blockerCount: 0,
    reviewCount: 0,
    waitingCount: 0,
    blockers: [],
    safety: "Evidence only.",
    ...overrides
  };
}

describe("phase 3 handoff gate", () => {
  it("advances provider integration only after clearance and owner handoff are ready", () => {
    const result = buildPhase3HandoffGate({
      clearancePackage: clearancePackage(),
      handoffRecordState: "ready"
    });

    expect(result.state).toBe("ready");
    expect(result.readiness).toBe(100);
    expect(result.canAdvanceProviderIntegration).toBe(true);
    expect(result.exactBlockerCount).toBe(0);
    expect(result.items.every((item) => item.status === "ready")).toBe(true);
    expect(result.ariaLabel).toContain("0 exact blockers");
  });

  it("holds provider integration when clearance is ready but owner handoff is not recorded", () => {
    const result = buildPhase3HandoffGate({
      clearancePackage: clearancePackage()
    });

    expect(result.state).toBe("waiting");
    expect(result.canAdvanceProviderIntegration).toBe(false);
    expect(result.readyCount).toBe(2);
    expect(result.waitingCount).toBe(2);
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Desktop proof clearance", status: "ready" }),
        expect.objectContaining({ label: "Exact blocker visibility", status: "ready" }),
        expect.objectContaining({ label: "Owner handoff record", status: "waiting" }),
        expect.objectContaining({ label: "Provider boundary", status: "waiting" })
      ])
    );
    expect(result.nextAction).toBe(
      "Record the owner-reviewed Phase 3 handoff before advancing provider integration."
    );
  });

  it("blocks provider advance when the owner handoff record fingerprint is stale", () => {
    const result = buildPhase3HandoffGate({
      clearancePackage: clearancePackage(),
      handoffRecordState: "review",
      handoffRecordValidation: {
        state: "review",
        detail:
          "Owner handoff record no longer matches the current Phase 3 evidence fingerprint.",
        nextAction: "Clear and record the Phase 3 handoff again from the current exit-ready evidence.",
        expectedFingerprint: "current",
        recordFingerprint: "old",
        matchesCurrentEvidence: false
      }
    });

    expect(result.state).toBe("review");
    expect(result.canAdvanceProviderIntegration).toBe(false);
    expect(result.nextAction).toBe(
      "Clear and record the Phase 3 handoff again from the current exit-ready evidence."
    );
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Owner handoff record",
          status: "review",
          detail: expect.stringContaining("no longer matches")
        }),
        expect.objectContaining({
          label: "Provider boundary",
          status: "review",
          detail: expect.stringContaining("no longer matches")
        })
      ])
    );
  });

  it("blocks provider advance when the owner handoff record age is stale", () => {
    const result = buildPhase3HandoffGate({
      clearancePackage: clearancePackage(),
      handoffRecordState: "review",
      handoffRecordValidation: {
        state: "review",
        detail:
          "Owner handoff record is stale and must be recorded again from current exit-ready evidence.",
        nextAction: "Clear and record the Phase 3 handoff again from fresh exit-ready evidence.",
        expectedFingerprint: "current",
        recordFingerprint: "current",
        matchesCurrentEvidence: true
      }
    });

    expect(result.state).toBe("review");
    expect(result.canAdvanceProviderIntegration).toBe(false);
    expect(result.nextAction).toBe(
      "Clear and record the Phase 3 handoff again from fresh exit-ready evidence."
    );
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Owner handoff record",
          status: "review",
          detail: expect.stringContaining("stale")
        }),
        expect.objectContaining({
          label: "Provider boundary",
          status: "review",
          detail: expect.stringContaining("stale")
        })
      ])
    );
  });

  it("routes exact blockers from the clearance package before handoff", () => {
    const result = buildPhase3HandoffGate({
      clearancePackage: clearancePackage({
        state: "blocked",
        statusLabel: "Blocked",
        readiness: 15,
        canExit: false,
        detail: "Phase 3 is blocked.",
        nextAction: "Repair provider route.",
        readyCount: 3,
        openCount: 2,
        blockerCount: 1,
        waitingCount: 1,
        blockers: [
          {
            id: "phase3-exit-gate:slash-execution",
            label: "Slash execution",
            state: "blocked",
            nextAction: "Repair provider route.",
            pmTaskId: "phase-03-child-slash-ready",
            evidenceKey: "phase3.slash-execution"
          },
          {
            id: "phase3-exit-gate:live-control-smoke",
            label: "Live control smoke",
            state: "waiting",
            nextAction: "Run live-control smoke.",
            pmTaskId: "phase-03-child-smoke-rows",
            evidenceKey: "phase3.live-control-smoke"
          }
        ]
      })
    });

    expect(result.state).toBe("blocked");
    expect(result.canAdvanceProviderIntegration).toBe(false);
    expect(result.exactBlockerCount).toBe(2);
    expect(result.nextAction).toBe("Repair provider route.");
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Desktop proof clearance", status: "blocked" }),
        expect.objectContaining({ label: "Exact blocker visibility", status: "blocked" }),
        expect.objectContaining({ label: "Provider boundary", status: "blocked" })
      ])
    );
  });

  it("keeps handoff text public-safe", () => {
    const result = buildPhase3HandoffGate({
      clearancePackage: clearancePackage({
        state: "blocked",
        canExit: false,
        nextAction:
          "Open C:\\Users\\MJ\\Projects\\ProjectAtlas\\secret.md with token sk-ABCDEF1234567890 <unsafe>",
        openCount: 1,
        blockers: [
          {
            id: "phase3-exit-gate:slash-execution",
            label: "Slash execution",
            state: "blocked",
            nextAction:
              "Open C:\\Users\\MJ\\Projects\\ProjectAtlas\\secret.md with token sk-ABCDEF1234567890 <unsafe>",
            pmTaskId: "phase-03-child-slash-ready",
            evidenceKey: "phase3.slash-execution"
          }
        ]
      })
    });
    const combinedText = [
      result.label,
      result.nextAction,
      result.safety,
      result.ariaLabel,
      ...result.items.flatMap((item) => [item.label, item.detail, item.nextAction])
    ].join(" ");

    expect(combinedText).not.toMatch(/[A-Za-z]:[\\/]/);
    expect(combinedText).not.toMatch(/[\\/](Users|Projects|Documents|Desktop)[\\/]/i);
    expect(combinedText).not.toContain("sk-ABCDEF1234567890");
    expect(combinedText).not.toContain("<");
    expect(combinedText).not.toContain(">");
  });
});
