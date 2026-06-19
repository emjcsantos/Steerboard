import { describe, expect, it } from "vitest";
import type { CockpitAcceptancePass } from "./cockpitAcceptancePass";
import type { CockpitInteractionReadiness } from "./cockpitInteractionReadiness";
import type { CockpitLayoutCapacity } from "./cockpitLayoutCapacity";
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

function polishSnapshot(
  overrides: Partial<Parameters<typeof buildPhase10ArenaPolishSnapshot>[0]> = {}
) {
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
      dependencyInstalled: true,
      preservesCustomLayoutFallback: true,
      ownerApprovedDependency: true
    }),
    terminologyIssues: [],
    ...overrides
  });
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

function withCurrentNextPhase10Goal() {
  return remainingGoalPlan.map((goal) =>
    goal.id === "goal-phase-10-arena-polish"
      ? { ...goal, current: true }
      : goal.current
        ? { ...goal, current: false }
        : goal
  );
}

function withDuplicateCurrentActivePhase10Goal() {
  return remainingGoalPlan.map((goal) =>
    goal.id === "goal-phase-10-arena-polish"
      ? { ...goal, status: "active" as const, current: true }
      : goal
  );
}

describe("phase 10 Arena polish traceability", () => {
  it("keeps Phase 10 Arena polish traceability waiting while Phase 10 is only next", () => {
    const summary = buildPhase10ArenaPolishTraceability({ snapshot: polishSnapshot() });

    expect(summary.linkedGoalId).toBe("goal-phase-10-arena-polish");
    expect(summary.linkedPmTaskCount).toBe(9);
    expect(summary.missingPmTaskIds).toEqual([]);
    expect(summary.items.map((item) => item.kind)).toEqual([
      "active-goal",
      "pm-coverage",
      "polish-readiness",
      "layout-evidence",
      "acceptance-gate"
    ]);
    expect(summary.state).toBe("waiting");
    expect(summary.canTrustArenaPolish).toBe(false);
    expect(summary.acceptanceGateStatus).toBe("ready");
    expect(summary.safety).toContain("evidence-only");
  });

  it("trusts Arena polish when Phase 10 is the current active goal", () => {
    const summary = buildPhase10ArenaPolishTraceability({
      snapshot: polishSnapshot(),
      goals: withCurrentPhase10Goal()
    });

    expect(summary.state).toBe("ready");
    expect(summary.canTrustArenaPolish).toBe(true);
    expect(summary.readyCount).toBe(5);
    expect(summary.acceptanceGateStatus).toBe("ready");
  });

  it("does not trust Arena polish when Phase 10 is current but still next", () => {
    const summary = buildPhase10ArenaPolishTraceability({
      snapshot: polishSnapshot(),
      goals: withCurrentNextPhase10Goal()
    });

    expect(summary.state).toBe("waiting");
    expect(summary.canTrustArenaPolish).toBe(false);
    expect(summary.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "active-goal", status: "waiting" })
      ])
    );
  });

  it("does not trust Arena polish when Phase 10 duplicates the current active goal", () => {
    const summary = buildPhase10ArenaPolishTraceability({
      snapshot: polishSnapshot(),
      goals: withDuplicateCurrentActivePhase10Goal()
    });

    expect(summary.state).toBe("review");
    expect(summary.canTrustArenaPolish).toBe(false);
    expect(summary.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "active-goal",
          status: "review",
          detail: expect.stringContaining("2 current active goals"),
          nextAction: expect.stringContaining("exactly one current active remaining goal")
        })
      ])
    );
  });

  it("blocks when the Phase 10 goal misses a required PM child link", () => {
    const goals = remainingGoalPlan.map((goal) =>
      goal.id === "goal-phase-10-arena-polish"
        ? {
            ...goal,
            pmTaskIds: goal.pmTaskIds.filter((taskId) => taskId !== "phase-10-child-traceability")
          }
        : goal
    );
    const summary = buildPhase10ArenaPolishTraceability({
      snapshot: polishSnapshot(),
      goals
    });

    expect(summary.state).toBe("blocked");
    expect(summary.missingPmTaskIds).toEqual(["phase-10-child-traceability"]);
    expect(summary.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "pm-coverage",
          status: "blocked"
        })
      ])
    );
  });

  it("blocks when the Phase 10 goal misses the FlexLayout docking spike PM child link", () => {
    const goals = remainingGoalPlan.map((goal) =>
      goal.id === "goal-phase-10-arena-polish"
        ? {
            ...goal,
            pmTaskIds: goal.pmTaskIds.filter((taskId) => taskId !== "phase-10-child-flexlayout-spike")
          }
        : goal
    );
    const summary = buildPhase10ArenaPolishTraceability({
      snapshot: polishSnapshot(),
      goals
    });

    expect(summary.state).toBe("blocked");
    expect(summary.canTrustArenaPolish).toBe(false);
    expect(summary.missingPmTaskIds).toEqual(["phase-10-child-flexlayout-spike"]);
    expect(summary.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "pm-coverage",
          detail: expect.stringContaining("phase-10-child-flexlayout-spike")
        })
      ])
    );
  });

  it("blocks when the Phase 10 goal misses the blocker-priority PM child link", () => {
    const goals = remainingGoalPlan.map((goal) =>
      goal.id === "goal-phase-10-arena-polish"
        ? {
            ...goal,
            pmTaskIds: goal.pmTaskIds.filter(
              (taskId) => taskId !== "phase-10-child-blocker-priority"
            )
          }
        : goal
    );
    const summary = buildPhase10ArenaPolishTraceability({
      snapshot: polishSnapshot(),
      goals
    });

    expect(summary.state).toBe("blocked");
    expect(summary.canTrustArenaPolish).toBe(false);
    expect(summary.missingPmTaskIds).toEqual(["phase-10-child-blocker-priority"]);
  });

  it("carries layout and acceptance blockers from the Arena polish snapshot", () => {
    const summary = buildPhase10ArenaPolishTraceability({
      snapshot: polishSnapshot({
        layoutCapacity: layout({ tone: "overflow", usageLabel: "9/9 visible / 2 queued" }),
        hasKeyboardAdjustment: false,
        acceptancePass: acceptance({ tone: "blocked", detail: "Narrow-pane gate failed." })
      })
    });

    expect(summary.state).toBe("blocked");
    expect(summary.canTrustArenaPolish).toBe(false);
    expect(summary.acceptanceGateStatus).toBe("blocked");
    expect(summary.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "polish-readiness", status: "blocked" }),
        expect.objectContaining({ kind: "layout-evidence", status: "blocked" }),
        expect.objectContaining({ kind: "acceptance-gate", status: "blocked" })
      ])
    );
  });

  it("keeps traceability text public-safe", () => {
    const goals = remainingGoalPlan.map((goal) =>
      goal.id === "goal-phase-10-arena-polish"
        ? {
            ...goal,
            nextAction:
              "Open C:\\Users\\MJ\\Projects\\ProjectAtlas\\secret.md with token sk-ABCDEF1234567890 <unsafe>"
          }
        : goal
    );
    const summary = buildPhase10ArenaPolishTraceability({
      snapshot: polishSnapshot(),
      goals
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
