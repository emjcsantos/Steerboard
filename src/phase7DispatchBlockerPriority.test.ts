import { describe, expect, it } from "vitest";
import { buildDispatchPackage } from "./dispatch";
import { createDispatchRolePanelPlan } from "./dispatchRolePanelPlan";
import type { DispatchReviewRecord } from "./dispatchReviewRecord";
import {
  buildCurrentDispatchReviewEvidenceFingerprint,
  createDispatchReviewRecord
} from "./dispatchReviewRecord";
import { buildPhase7DispatchBlockerPriority } from "./phase7DispatchBlockerPriority";
import { buildPhase7DispatchReviewDepth } from "./phase7DispatchReviewDepth";
import { buildPhase7DispatchTraceability } from "./phase7DispatchTraceability";
import { buildPhase7IntegrationOwnershipDepth } from "./phase7IntegrationOwnershipDepth";
import type { PlanningDraft } from "./planning";
import { remainingGoalPlan } from "./remainingGoalPlan";
import { createMockRunFromDispatchPackage, type MockOrchestratorRun } from "./run";

const project = {
  id: "phase-7-blocker-project",
  name: "Phase 7 Blocker Project"
};

const draft: PlanningDraft = {
  title: "Rank dispatch blockers",
  objective: "Rank dispatch review blockers before worker spawning.",
  targetProjectId: project.id,
  scope: ["Review depth", "Integration ownership", "Traceability"],
  fileAreas: ["src/phase7DispatchBlockerPriority.ts"],
  acceptanceCriteria: [
    "Dispatch blockers rank by exact top blocker.",
    "Live worker execution remains locked."
  ],
  validationPlan: ["npm test -- phase7DispatchBlockerPriority"],
  risk: "medium",
  rollbackNote: "Remove local dispatch blocker-priority rows.",
  deployMode: "staged"
};

function buildRecord(createdAt = "2026-06-14T00:00:00.000Z"): DispatchReviewRecord {
  return buildRecordBundle(createdAt).record;
}

function buildRecordBundle(
  createdAt = "2026-06-14T00:00:00.000Z"
): { record: DispatchReviewRecord; run: MockOrchestratorRun } {
  const dispatchPackage = buildDispatchPackage(draft, project, {
    createdAt,
    idSeed: "phase-7-blocker",
    status: "ready"
  });
  const run = createMockRunFromDispatchPackage(dispatchPackage, {
    createdAt,
    idSeed: "phase-7-blocker-run",
    status: "queued"
  });
  const rolePanelPlan = createDispatchRolePanelPlan(dispatchPackage, run);

  return {
    record: createDispatchReviewRecord(dispatchPackage, rolePanelPlan, run, {
      createdAt
    }),
    run
  };
}

function priority(options: {
  record?: DispatchReviewRecord;
  run?: MockOrchestratorRun;
  goals?: typeof remainingGoalPlan;
} = {}) {
  const record = options.record;
  const depth = buildPhase7DispatchReviewDepth({
    records: record ? [record] : [],
    selectedRecord: record,
    currentEvidenceFingerprint:
      record && options.run
        ? buildCurrentDispatchReviewEvidenceFingerprint(record, options.run)
        : undefined
  });
  const ownership = record
    ? buildPhase7IntegrationOwnershipDepth(record)
    : buildPhase7IntegrationOwnershipDepth({
        ...buildRecord(),
        roleCounts: { orchestrator: 0, implementer: 0, validator: 0, integration: 0 },
        validationGateCount: 0,
        traceabilityLinkCount: 0,
        noRuntimeExecutionNote: "No dispatch review record is selected."
      });
  const traceability = buildPhase7DispatchTraceability({
    record,
    depth,
    ownership,
    goals: options.goals ?? remainingGoalPlan
  });

  return buildPhase7DispatchBlockerPriority({
    depth,
    ownership,
    traceability
  });
}

function withCurrentPhase7Goal() {
  return remainingGoalPlan.map((goal) =>
    goal.id === "goal-phase-7-dispatch-loop"
      ? { ...goal, status: "active" as const, current: true }
      : goal.current
        ? { ...goal, current: false }
        : goal
  );
}

describe("phase 7 dispatch blocker priority", () => {
  it("ranks role coverage ahead of later dispatch review blockers", () => {
    const record = {
      ...buildRecord(),
      panelCount: 0,
      roleCounts: { orchestrator: 0, implementer: 0, validator: 0, integration: 0 },
      handoffTaskCount: 0,
      validationGateCount: 0
    };
    const summary = priority({ record });

    expect(summary.state).toBe("blocked");
    expect(summary.topPriorityLabel).toBe("Role coverage");
    expect(summary.items[0]).toMatchObject({
      kind: "review-depth",
      status: "blocked",
      priority: 1
    });
    expect(summary.dispatchReviewCanAddressTopBlocker).toBe(true);
  });

  it("surfaces integration ownership blockers after review depth is ready", () => {
    const record = {
      ...buildRecord(),
      commitPushReportingOwner: "Worker",
      mainIntegrationOwnershipNote: "Worker owns closure."
    };
    const summary = priority({ record });

    expect(summary.state).toBe("blocked");
    expect(summary.topPriorityLabel).toBe("Commit, push, and reporting owner");
    expect(summary.items[0]).toMatchObject({
      kind: "integration-ownership",
      status: "blocked"
    });
  });

  it("surfaces PM traceability gaps after depth and ownership are ready", () => {
    const record = buildRecord();
    const goals = remainingGoalPlan.map((goal) =>
      goal.id === "goal-phase-7-dispatch-loop"
        ? {
            ...goal,
            pmTaskIds: goal.pmTaskIds.filter((taskId) => taskId !== "phase-07-child-blocker-priority")
          }
        : goal
    );
    const summary = priority({ record, goals });

    expect(summary.state).toBe("blocked");
    expect(summary.topPriorityLabel).toBe("PM row coverage");
    expect(summary.items[0]).toMatchObject({
      kind: "traceability",
      status: "blocked",
      canUseDispatchReview: false
    });
    expect(summary.dispatchReviewCanAddressTopBlocker).toBe(false);
  });

  it("keeps non-current Phase 7 traceability as an open blocker", () => {
    const { record, run } = buildRecordBundle();
    const summary = priority({ record, run });

    expect(summary.state).toBe("waiting");
    expect(summary.openBlockerCount).toBe(1);
    expect(summary.topPriorityLabel).toBe("Remaining goal link");
    expect(summary.items[0]).toMatchObject({
      kind: "traceability",
      status: "waiting",
      canUseDispatchReview: false
    });
    expect(summary.dispatchReviewAddressableCount).toBe(0);
  });

  it("reports ready when dispatch review, ownership, traceability, and current goal are ready", () => {
    const { record, run } = buildRecordBundle();
    const summary = priority({ record, run, goals: withCurrentPhase7Goal() });

    expect(summary.state).toBe("ready");
    expect(summary.openBlockerCount).toBe(0);
    expect(summary.dispatchReviewAddressableCount).toBe(0);
    expect(summary.topPriorityLabel).toBe("No open Phase 7 dispatch blocker");
  });

  it("keeps dispatch blocker-priority text public-safe", () => {
    const summary = priority({
      record: {
        ...buildRecord(),
        noRuntimeExecutionNote:
          "Open C:\\Users\\MJ\\Projects\\ProjectAtlas\\secret.md with token sk-ABCDEF1234567890 <unsafe>"
      }
    });
    const combinedText = [
      summary.label,
      summary.nextAction,
      summary.safety,
      summary.ariaLabel,
      ...summary.items.flatMap((item) => [
        item.label,
        item.detail,
        item.nextAction
      ])
    ].join(" ");

    expect(combinedText).not.toMatch(/[A-Za-z]:[\\/]/);
    expect(combinedText).not.toMatch(/[\\/](Users|Projects|Documents|Desktop)[\\/]/i);
    expect(combinedText).not.toContain("<");
    expect(combinedText).not.toContain(">");
    expect(combinedText).not.toContain("sk-ABCDEF");
  });
});
