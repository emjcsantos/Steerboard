import { describe, expect, it } from "vitest";
import { buildPhase3RecordedArtifactLoadNotice } from "./phase3ProofArtifactLoadNotice";

describe("phase 3 recorded artifact load notice", () => {
  it("reports full success when both recorded artifacts import", () => {
    expect(
      buildPhase3RecordedArtifactLoadNotice({
        commandValidation: "loaded",
        smokeProofBundle: "loaded"
      })
    ).toBe("Phase 3 CLI validation and desktop smoke proof artifacts loaded");
  });

  it("reports full success when panel evidence also imports", () => {
    expect(
      buildPhase3RecordedArtifactLoadNotice({
        commandValidation: "loaded",
        smokeProofBundle: "loaded",
        panelEvidence: "loaded"
      })
    ).toBe("Phase 3 CLI validation, desktop smoke proof, and panel evidence artifacts loaded");
  });

  it("reports unavailable artifacts separately from rejected imports", () => {
    expect(
      buildPhase3RecordedArtifactLoadNotice({
        commandValidation: "loaded",
        smokeProofBundle: "unavailable"
      })
    ).toBe("Phase 3 CLI validation artifact loaded; desktop smoke proof bundle is unavailable");

    expect(
      buildPhase3RecordedArtifactLoadNotice({
        commandValidation: "loaded",
        smokeProofBundle: "rejected",
        panelEvidence: "unavailable"
      })
    ).toBe(
      "Phase 3 CLI validation artifact loaded; desktop smoke proof bundle could not be imported; panel slash/session evidence is unavailable"
    );
  });

  it("reports partial smoke success with the command artifact reason", () => {
    expect(
      buildPhase3RecordedArtifactLoadNotice({
        commandValidation: "rejected",
        smokeProofBundle: "loaded"
      })
    ).toBe(
      "Phase 3 desktop smoke proof bundle loaded; Phase 3 CLI validation artifact could not be imported"
    );
  });

  it("preserves the rerun guidance when both recorded artifacts are missing", () => {
    expect(
      buildPhase3RecordedArtifactLoadNotice({
        commandValidation: "unavailable",
        smokeProofBundle: "unavailable"
      })
    ).toBe(
      "Recorded Phase 3 proof artifacts are unavailable; run npm.cmd run smoke:phase3:record first"
    );
  });
});
