import { describe, expect, it } from "vitest";
import { buildPhase10FlexLayoutSpikeSummary } from "./phase10FlexLayoutSpike";

const readyInput = {
  repositoryName: "caplin/FlexLayout",
  expectedLicense: "MIT",
  hasMitLicenseNotice: true,
  supportsTabsets: true,
  supportsSplitters: true,
  supportsSavedLayoutJson: true,
  supportsDockablePanels: true,
  dependencyInstalled: true,
  preservesCustomLayoutFallback: true,
  ownerApprovedDependency: true
};

describe("phase 10 FlexLayout docking spike", () => {
  it("stays review-only until dependency install and owner approval are explicit", () => {
    const summary = buildPhase10FlexLayoutSpikeSummary({
      ...readyInput,
      dependencyInstalled: false,
      ownerApprovedDependency: false
    });

    expect(summary.state).toBe("review");
    expect(summary.readiness).toBe(65);
    expect(summary.coveredCapabilityCount).toBe(4);
    expect(summary.decision).toBe("defer");
    expect(summary.decisionProof).toContain("decision=defer");
    expect(summary.decisionProof).toContain("dependencyInstalled=no");
    expect(summary.decisionProof).toContain("ownerApproved=no");
    expect(summary.decisionProof).toContain("fallback=preserved");
    expect(summary.detail).toContain("dependency installation or owner approval is still held");
    expect(summary.detail).toContain("decision=defer");
    expect(summary.nextAction).toContain("defer package installation until owner approval");
    expect(summary.safety).toContain("evidence-only");
  });

  it("blocks without license evidence or custom fallback protection", () => {
    const summary = buildPhase10FlexLayoutSpikeSummary({
      ...readyInput,
      hasMitLicenseNotice: false,
      preservesCustomLayoutFallback: false
    });

    expect(summary.state).toBe("blocked");
    expect(summary.nextAction).toContain("MIT license evidence");
  });

  it("waits when required docking capabilities are incomplete", () => {
    const summary = buildPhase10FlexLayoutSpikeSummary({
      ...readyInput,
      supportsSavedLayoutJson: false,
      supportsDockablePanels: false
    });

    expect(summary.state).toBe("waiting");
    expect(summary.coveredCapabilityCount).toBe(2);
    expect(summary.detail).toContain("2/4 docking capabilities");
  });

  it("is ready only when license, capability, dependency, owner approval, and fallback evidence pass", () => {
    const summary = buildPhase10FlexLayoutSpikeSummary(readyInput);

    expect(summary.state).toBe("ready");
    expect(summary.readiness).toBe(100);
    expect(summary.decision).toBe("adopt");
    expect(summary.decisionProof).toContain("decision=adopt");
    expect(summary.decisionProof).toContain("dependencyInstalled=yes");
    expect(summary.decisionProof).toContain("ownerApproved=yes");
    expect(summary.detail).toContain("all docking capabilities");
  });
});
