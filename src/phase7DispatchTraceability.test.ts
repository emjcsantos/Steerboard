import { describe, expect, it } from "vitest";
import { buildDispatchPackage } from "./dispatch";
import { createDispatchRolePanelPlan } from "./dispatchRolePanelPlan";
import type { DispatchReviewRecord } from "./dispatchReviewRecord";
import {
  buildCurrentDispatchReviewEvidenceFingerprint,
  createDispatchReviewRecord
} from "./dispatchReviewRecord";
import { buildPhase7DispatchReviewDepth } from "./phase7DispatchReviewDepth";
import { buildPhase7DispatchTraceability } from "./phase7DispatchTraceability";
import { buildPhase7IntegrationOwnershipDepth } from "./phase7IntegrationOwnershipDepth";
import type { PlanningDraft } from "./planning";
import { remainingGoalPlan } from "./remainingGoalPlan";
import { createMockRunFromDispatchPackage, type MockOrchestratorRun } from "./run";

const project = {
  id: "phase-7-trace-project",
  name: "Phase 7 Trace Project"
};

const draft: PlanningDraft = {
  title: "Trace dispatch review",
  objective: "Link dispatch review evidence before worker spawning.",
  targetProjectId: project.id,
  scope: ["PM rows", "Review depth", "Integration ownership", "Live worker lock"],
  fileAreas: ["src/phase7DispatchTraceability.ts"],
  acceptanceCriteria: [
    "Dispatch traceability links the remaining goal.",
    "Live worker execution remains locked."
  ],
  validationPlan: ["npm test -- phase7DispatchTraceability"],
  risk: "medium",
  rollbackNote: "Remove local dispatch traceability rows.",
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
    idSeed: "phase-7-trace",
    status: "ready"
  });
  const run = createMockRunFromDispatchPackage(dispatchPackage, {
    createdAt,
    idSeed: "phase-7-trace-run",
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

function traceability(options: {
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
    : {
        id: "phase-07-integration-ownership-depth",
        label: "Phase 7 integration ownership depth",
        state: "waiting" as const,
        statusLabel: "Waiting",
        readiness: 35,
        openDepthCount: 5,
        readyCount: 0,
        reviewCount: 0,
        blockedCount: 0,
        waitingCount: 5,
        nextAction: "Create a dispatch review record before ownership can be verified.",
        ariaLabel: "Phase 7 integration ownership depth: Waiting.",
        items: [
          {
            id: "phase-07-integration-ownership-depth:closure-boundary",
            label: "Closure boundary",
            kind: "closure-boundary" as const,
            status: "waiting" as const,
            statusLabel: "Waiting",
            detail: "No closure boundary evidence exists yet.",
            nextAction: "Create a dispatch review record before final integration review."
          }
        ]
      };

  return buildPhase7DispatchTraceability({
    record,
    depth,
    ownership,
    goals: options.goals ?? remainingGoalPlan
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

describe("phase 7 dispatch traceability", () => {
  it("keeps Phase 7 dispatch traceability waiting while Phase 7 is only next", () => {
    const { record, run } = buildRecordBundle();
    const summary = traceability({ record, run });

    expect(summary.linkedGoalId).toBe("goal-phase-7-dispatch-loop");
    expect(summary.linkedPmTaskCount).toBeGreaterThanOrEqual(10);
    expect(summary.missingPmTaskIds).toEqual([]);
    expect(summary.items.map((item) => item.kind)).toEqual([
      "active-goal",
      "pm-coverage",
      "review-depth",
      "integration-ownership",
      "live-worker-lock"
    ]);
    expect(summary.state).toBe("waiting");
    expect(summary.canTrustDispatchReview).toBe(false);
    expect(summary.liveWorkerLockCount).toBe(2);
    expect(summary.safety).toContain("evidence-only");
  });

  it("trusts dispatch traceability when Phase 7 is the current active goal", () => {
    const { record, run } = buildRecordBundle();
    const summary = traceability({
      record,
      run,
      goals: withCurrentPhase7Goal()
    });

    expect(summary.state).toBe("ready");
    expect(summary.canTrustDispatchReview).toBe(true);
    expect(summary.readyCount).toBe(5);
  });

  it("waits when no dispatch review record exists", () => {
    const summary = traceability();

    expect(summary.state).toBe("waiting");
    expect(summary.canTrustDispatchReview).toBe(false);
    expect(summary.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "live-worker-lock",
          status: "waiting"
        })
      ])
    );
  });

  it("blocks when the Phase 7 goal misses a required PM child link", () => {
    const { record, run } = buildRecordBundle();
    const goals = remainingGoalPlan.map((goal) =>
      goal.id === "goal-phase-7-dispatch-loop"
        ? {
            ...goal,
            pmTaskIds: goal.pmTaskIds.filter((taskId) => taskId !== "phase-07-child-traceability")
          }
        : goal
    );
    const summary = traceability({ record, run, goals });

    expect(summary.state).toBe("blocked");
    expect(summary.missingPmTaskIds).toEqual(["phase-07-child-traceability"]);
    expect(summary.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "pm-coverage",
          status: "blocked"
        })
      ])
    );
  });

  it("blocks when the Phase 7 goal misses the blocker-priority PM child link", () => {
    const { record, run } = buildRecordBundle();
    const goals = remainingGoalPlan.map((goal) =>
      goal.id === "goal-phase-7-dispatch-loop"
        ? {
            ...goal,
            pmTaskIds: goal.pmTaskIds.filter(
              (taskId) => taskId !== "phase-07-child-blocker-priority"
            )
          }
        : goal
    );
    const summary = traceability({ record, run, goals });

    expect(summary.state).toBe("blocked");
    expect(summary.canTrustDispatchReview).toBe(false);
    expect(summary.missingPmTaskIds).toEqual(["phase-07-child-blocker-priority"]);
  });

  it("blocks when review depth or ownership depth breaks the live-worker lock", () => {
    const record = {
      ...buildRecord(),
      noRuntimeExecutionNote: "Live worker sessions can launch now."
    };
    const summary = traceability({ record });

    expect(summary.state).toBe("blocked");
    expect(summary.canTrustDispatchReview).toBe(false);
    expect(summary.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "live-worker-lock",
          status: "blocked"
        })
      ])
    );
  });

  it("keeps dispatch traceability text public-safe", () => {
    const record = buildRecord();
    const summary = traceability({
      record,
      goals: remainingGoalPlan.map((goal) =>
        goal.id === "goal-phase-7-dispatch-loop"
          ? {
              ...goal,
              nextAction:
                "Open C:\\Users\\MJ\\Projects\\ProjectAtlas\\secret.md with token sk-ABCDEF1234567890 <unsafe>"
            }
          : goal
      )
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
