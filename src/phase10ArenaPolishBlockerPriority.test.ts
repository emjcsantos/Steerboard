import { describe, expect, it } from "vitest";
import type { CockpitAcceptancePass } from "./cockpitAcceptancePass";
import type { CockpitInteractionReadiness } from "./cockpitInteractionReadiness";
import type { CockpitLayoutCapacity } from "./cockpitLayoutCapacity";
import { buildPhase10ArenaPolishBlockerPriority } from "./phase10ArenaPolishBlockerPriority";
import { buildPhase10ArenaPolishSnapshot } from "./phase10ArenaPolish";
import { buildPhase10ArenaPolishTraceability } from "./phase10ArenaPolishTraceability";
import { buildPhase10FlexLayoutSpikeSummary } from "./phase10FlexLayoutSpike";
import { remainingGoalPlan } from "./remainingGoalPlan";

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

function priority(options: {
  snapshotOverrides?: Partial<Parameters<typeof buildPhase10ArenaPolishSnapshot>[0]>;
  goals?: typeof remainingGoalPlan;
} = {}) {
  const snapshot = buildPhase10ArenaPolishSnapshot({
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
      dependencyInstalled: true,
      preservesCustomLayoutFallback: true,
      ownerApprovedDependency: true
    }),
    terminologyIssues: [],
    ...options.snapshotOverrides
  });
  const traceability = buildPhase10ArenaPolishTraceability({
    snapshot,
    goals: options.goals ?? remainingGoalPlan
  });

  return buildPhase10ArenaPolishBlockerPriority({ snapshot, traceability });
}

function withCurrentPhase10Goal() {
  return remainingGoalPlan.map((goal) =>
    goal.id === "goal-phase-10-arena-polish"
      ? { ...goal, status: "active" as const, current: true }
      : goal.current
        ? { ...goal, current: false }
        : goal
  );
}

describe("phase 10 Arena polish blocker priority", () => {
  it("ranks layout regression ahead of later Arena polish blockers", () => {
    const summary = priority({
      snapshotOverrides: {
        layoutCapacity: layout({ tone: "overflow", usageLabel: "9/9 visible / 2 queued" }),
        hasKeyboardAdjustment: false
      }
    });

    expect(summary.state).toBe("blocked");
    expect(summary.topPriorityLabel).toBe("Layout regression");
    expect(summary.items[0]).toMatchObject({
      kind: "polish",
      status: "blocked",
      priority: 1
    });
    expect(summary.arenaReviewCanAddressTopBlocker).toBe(true);
  });

  it("surfaces PM traceability gaps after Arena polish evidence is ready", () => {
    const goals = remainingGoalPlan.map((goal) =>
      goal.id === "goal-phase-10-arena-polish"
        ? {
            ...goal,
            pmTaskIds: goal.pmTaskIds.filter((taskId) => taskId !== "phase-10-child-blocker-priority")
          }
        : goal
    );
    const summary = priority({ goals });

    expect(summary.state).toBe("blocked");
    expect(summary.topPriorityLabel).toBe("PM row coverage");
    expect(summary.items[0]).toMatchObject({
      kind: "traceability",
      status: "blocked",
      canUseArenaReview: false,
      nextAction: expect.stringContaining("missing Phase 10 PM")
    });
    expect(summary.arenaReviewCanAddressTopBlocker).toBe(false);
  });

  it("ranks FlexLayout docking review after layout and density blockers", () => {
    const summary = priority({
      snapshotOverrides: {
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
        })
      }
    });

    expect(summary.state).toBe("review");
    expect(summary.topPriorityLabel).toBe("FlexLayout docking spike");
    expect(summary.items[0]).toMatchObject({
      sourceId: "phase-10-adaptive-arena-polish:docking-spike",
      status: "review",
      canUseArenaReview: true
    });
  });

  it("surfaces FlexLayout docking spike coverage before Arena polish can be trusted", () => {
    const goals = remainingGoalPlan.map((goal) =>
      goal.id === "goal-phase-10-arena-polish"
        ? {
            ...goal,
            pmTaskIds: goal.pmTaskIds.filter((taskId) => taskId !== "phase-10-child-flexlayout-spike")
          }
        : goal
    );
    const summary = priority({ goals });

    expect(summary.state).toBe("blocked");
    expect(summary.topPriorityLabel).toBe("PM row coverage");
    expect(summary.items[0]).toMatchObject({
      kind: "traceability",
      status: "blocked",
      canUseArenaReview: false,
      detail: expect.stringContaining("phase-10-child-flexlayout-spike")
    });
  });

  it("reports ready when polish and traceability are ready", () => {
    const summary = priority({ goals: withCurrentPhase10Goal() });

    expect(summary.state).toBe("ready");
    expect(summary.openBlockerCount).toBe(0);
    expect(summary.arenaReviewAddressableCount).toBe(0);
    expect(summary.topPriorityLabel).toBe("No open Phase 10 Arena polish blocker");
  });

  it("keeps blocker-priority text public-safe", () => {
    const summary = priority({
      snapshotOverrides: {
        acceptancePass: acceptance({
          tone: "blocked",
          detail:
            "Open C:\\Users\\MJ\\Projects\\ProjectAtlas\\secret.md with token sk-ABCDEF1234567890 <unsafe>"
        })
      }
    });
    const combinedText = [
      summary.label,
      summary.nextAction,
      summary.safety,
      summary.ariaLabel,
      ...summary.items.flatMap((item) => [item.label, item.detail, item.nextAction])
    ].join(" ");

    expect(combinedText).not.toMatch(/[A-Za-z]:[\\/]/);
    expect(combinedText).not.toMatch(/[\\/](Users|Projects|Documents|Desktop)[\\/]/i);
    expect(combinedText).not.toContain("<");
    expect(combinedText).not.toContain(">");
    expect(combinedText).not.toContain("sk-ABCDEF");
  });
});
