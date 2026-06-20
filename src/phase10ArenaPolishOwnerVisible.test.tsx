import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Phase10ArenaPolishPanel } from "./App";
import type { CockpitAcceptancePass } from "./cockpitAcceptancePass";
import type { CockpitInteractionReadiness } from "./cockpitInteractionReadiness";
import type { CockpitLayoutCapacity } from "./cockpitLayoutCapacity";
import { buildPhase10ArenaPolishSnapshot } from "./phase10ArenaPolish";
import { buildPhase10FlexLayoutSpikeSummary } from "./phase10FlexLayoutSpike";

function layout(overrides: Partial<CockpitLayoutCapacity> = {}): CockpitLayoutCapacity {
  return {
    label: "Layout active",
    detail: "Layout has open capacity.",
    tone: "active",
    layoutLabel: "Adaptive",
    capacityLabel: "9 cells",
    usageLabel: "3/9 visible",
    ...overrides
  };
}

function interaction(
  overrides: Partial<CockpitInteractionReadiness> = {}
): CockpitInteractionReadiness {
  return {
    label: "Interaction QA ready",
    detail: "Mode, layout, focus, and clear controls are ready for final Arena QA.",
    tone: "ready",
    checkLabel: "4/4 controls",
    checks: [
      { label: "Mode", value: "3/3 panels", tone: "ok" },
      { label: "Layout", value: "3/9 visible", tone: "ok" },
      { label: "Focus", value: "Focused", tone: "ok" },
      { label: "Clear", value: "Ready", tone: "ok" }
    ],
    ariaLabel: "Interaction QA ready",
    ...overrides
  };
}

function acceptance(overrides: Partial<CockpitAcceptancePass> = {}): CockpitAcceptancePass {
  return {
    label: "Arena acceptance passed",
    detail: "Desktop, narrow-pane, monitor, mode, and interaction gates are ready to close.",
    tone: "accepted",
    checkLabel: "4/4 gates",
    checks: [],
    ariaLabel: "Arena acceptance passed",
    ...overrides
  };
}

function phase10Snapshot() {
  return buildPhase10ArenaPolishSnapshot({
    isAdaptiveLayout: true,
    adaptivePanelCount: 4,
    visiblePanelCount: 3,
    hiddenPanelCount: 1,
    layoutCapacity: layout(),
    interactionReadiness: interaction(),
    acceptancePass: acceptance(),
    hasKeyboardAdjustment: true,
    hasDropPreview: true,
    hasSavedLayoutRepair: true,
    flexLayoutSpike: buildPhase10FlexLayoutSpikeSummary({
      repositoryName: "caplin/FlexLayout",
      expectedLicense: "MIT",
      hasMitLicenseNotice: true,
      supportsTabsets: true,
      supportsSplitters: true,
      supportsSavedLayoutJson: true,
      supportsDockablePanels: true,
      dependencyInstalled: false,
      preservesCustomLayoutFallback: true,
      ownerApprovedDependency: false
    }),
    terminologyIssues: []
  });
}

describe("phase 10 Arena polish owner-visible proof", () => {
  it("renders polish counts, traceability, blocker priority, and the held FlexLayout action", () => {
    const html = renderToStaticMarkup(
      <Phase10ArenaPolishPanel snapshot={phase10Snapshot()} />
    );

    expect(html).toContain("Phase 10 Arena Polish");
    expect(html).toContain("Phase 10 adaptive Arena polish");
    expect(html).toContain("3/4");
    expect(html).toContain("FlexLayout docking spike");
    expect(html).toContain("decision=defer");
    expect(html).toContain("defer package installation until owner approval");
    expect(html).toContain("Phase 10 Arena polish traceability");
    expect(html).toContain("Phase 10 Arena polish blocker priority");
    expect(html).toContain("Phase 10 Arena polish closeout status");
    expect(html).toContain("phase10ArenaPolishCloseoutStatusProof");
    expect(html).toContain("Phase 10 packaging resume gate");
    expect(html).toContain("phase10PackagingResumeGateProof");
    expect(html).toContain("canResume=no");
    expect(html).toContain("ownerResume=missing");
    expect(html).toContain("installPath=locked");
    expect(html).toContain("desktopPackaging=locked");
    expect(html).toContain("releaseGate=required");
    expect(html).toContain("Arena review");
    expect(html).toContain("Phase 10 polish only");
    expect(html).toContain("without launching runtime or mutating sources");
    expect(html).not.toMatch(/[A-Za-z]:[\\/]/);
    expect(html).not.toContain("sk-");
  });
});
