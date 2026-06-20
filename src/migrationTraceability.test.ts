import { describe, expect, it } from "vitest";
import {
  appendMigrationProfileDraftHistory,
  buildDefaultMigrationPreview,
  createMigrationProfileDraft,
  createMigrationProfileDraftAuditRecord,
  toggleMigrationCategory,
  type MigrationProfileDraftHistoryRecord
} from "./migrationModel";
import { buildMigrationHardeningReadiness } from "./migrationHardeningReadiness";
import { buildMigrationTraceabilitySummary } from "./migrationTraceability";
import { currentProjectManagementPhasePlanTaskIds } from "./projectManagementPhasePlan";
import { remainingGoalPlan } from "./remainingGoalPlan";

function selectedPreview(source = "codex" as const, categoryId = "projects" as const) {
  return toggleMigrationCategory(buildDefaultMigrationPreview(source), categoryId, true);
}

function historyForAcceptedDraft(): MigrationProfileDraftHistoryRecord[] {
  const draft = createMigrationProfileDraft(selectedPreview(), {
    createdAt: "2026-02-01T00:00:00.000Z"
  });

  return appendMigrationProfileDraftHistory(
    [],
    draft,
    "created",
    8,
    "2026-02-01T00:00:00.000Z"
  );
}

function historyForStagedAcceptedDraft(): MigrationProfileDraftHistoryRecord[] {
  const draft = createMigrationProfileDraft(selectedPreview(), {
    createdAt: "2026-02-01T00:00:00.000Z"
  });

  return appendMigrationProfileDraftHistory(
    [],
    draft,
    "apply-review-staged",
    8,
    "2026-02-01T00:05:00.000Z"
  );
}

function readyReadiness() {
  return buildMigrationHardeningReadiness({
    preview: selectedPreview(),
    draftHistory: historyForStagedAcceptedDraft(),
    excludedSecretsSummary: ["Credentials excluded", "Raw transcripts excluded", "Source mutation excluded"]
  });
}

function withCurrentPhase5Goal() {
  return remainingGoalPlan.map((goal) =>
    goal.id === "goal-phase-5-migration-hardening"
      ? { ...goal, status: "active" as const, current: true }
      : goal.current
        ? { ...goal, current: false }
        : goal
  );
}

function withCurrentNextPhase5Goal() {
  return remainingGoalPlan.map((goal) =>
    goal.id === "goal-phase-5-migration-hardening"
      ? { ...goal, status: "next" as const, current: true }
      : goal.current
        ? { ...goal, current: false }
        : goal
  );
}

function withNextPhase5Goal() {
  return remainingGoalPlan.map((goal) =>
    goal.id === "goal-phase-5-migration-hardening"
      ? { ...goal, status: "next" as const, current: false }
      : goal.current
        ? { ...goal, current: false }
        : goal
  );
}

function withDuplicateCurrentActivePhase5Goal() {
  return remainingGoalPlan.map((goal) =>
    goal.id === "goal-phase-5-migration-hardening"
      ? { ...goal, status: "active" as const, current: true }
      : goal.id === "goal-phase-3-proof-clearance"
        ? { ...goal, status: "active" as const, current: true }
      : goal
  );
}

describe("migration traceability", () => {
  it("keeps Phase 5 migration traceability waiting while Phase 5 is only next", () => {
    const summary = buildMigrationTraceabilitySummary({
      readiness: readyReadiness(),
      goals: withNextPhase5Goal()
    });

    expect(summary.state).toBe("waiting");
    expect(summary.canTrustMigrationReview).toBe(false);
    expect(summary.linkedGoalId).toBe("goal-phase-5-migration-hardening");
    expect(summary.linkedPmTaskCount).toBeGreaterThanOrEqual(9);
    expect(summary.missingPmTaskIds).toEqual([]);
    expect(summary.reviewDepthCount).toBe(6);
    expect(summary.evidenceKeyCount).toBe(6);
    expect(summary.migrationTraceabilityProof).toContain("items=5/5");
    expect(summary.migrationTraceabilityProof).toContain("pmLinks=9/9");
    expect(summary.migrationTraceabilityProof).toContain("reviewDepth=6/6");
    expect(summary.migrationTraceabilityProof).toContain("trust=held");
    expect(summary.migrationTraceabilityProof).toContain("sourceMutation=locked");
    expect(summary.items.map((item) => item.kind)).toEqual([
      "active-goal",
      "pm-coverage",
      "review-depth",
      "sensitive-boundary",
      "profile-lock"
    ]);
  });

  it("trusts Phase 5 migration review when Phase 5 is the current active goal", () => {
    const summary = buildMigrationTraceabilitySummary({
      readiness: readyReadiness(),
      goals: withCurrentPhase5Goal()
    });

    expect(summary.state).toBe("ready");
    expect(summary.canTrustMigrationReview).toBe(true);
    expect(summary.readyCount).toBe(5);
    expect(summary.migrationTraceabilityProof).toContain("ready=5");
    expect(summary.migrationTraceabilityProof).toContain("openReview=0");
    expect(summary.migrationTraceabilityProof).toContain("trust=ready");
  });

  it("does not trust migration review when Phase 5 is current but still next", () => {
    const summary = buildMigrationTraceabilitySummary({
      readiness: readyReadiness(),
      goals: withCurrentNextPhase5Goal()
    });

    expect(summary.state).toBe("waiting");
    expect(summary.canTrustMigrationReview).toBe(false);
    expect(summary.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "active-goal", status: "waiting" })
      ])
    );
  });

  it("does not trust migration review when Phase 5 duplicates the current active goal", () => {
    const summary = buildMigrationTraceabilitySummary({
      readiness: readyReadiness(),
      goals: withDuplicateCurrentActivePhase5Goal()
    });

    expect(summary.state).toBe("review");
    expect(summary.canTrustMigrationReview).toBe(false);
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

  it("blocks when the Phase 5 goal misses the traceability PM child link", () => {
    const goals = remainingGoalPlan.map((goal) =>
      goal.id === "goal-phase-5-migration-hardening"
        ? {
            ...goal,
            pmTaskIds: goal.pmTaskIds.filter((taskId) => taskId !== "phase-05-child-traceability")
          }
        : goal
    );
    const summary = buildMigrationTraceabilitySummary({
      readiness: readyReadiness(),
      goals
    });

    expect(summary.state).toBe("blocked");
    expect(summary.canTrustMigrationReview).toBe(false);
    expect(summary.missingPmTaskIds).toEqual(["phase-05-child-traceability"]);
    expect(summary.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "pm-coverage",
          status: "blocked"
        })
      ])
    );
  });

  it("blocks when the Phase 5 goal misses the blocker-priority PM child link", () => {
    const goals = remainingGoalPlan.map((goal) =>
      goal.id === "goal-phase-5-migration-hardening"
        ? {
            ...goal,
            pmTaskIds: goal.pmTaskIds.filter(
              (taskId) => taskId !== "phase-05-child-blocker-priority"
            )
          }
        : goal
    );
    const summary = buildMigrationTraceabilitySummary({
      readiness: readyReadiness(),
      goals
    });

    expect(summary.state).toBe("blocked");
    expect(summary.canTrustMigrationReview).toBe(false);
    expect(summary.missingPmTaskIds).toEqual(["phase-05-child-blocker-priority"]);
  });

  it("blocks when a required Phase 5 PM row is missing from the current board plan", () => {
    currentProjectManagementPhasePlanTaskIds.delete("phase-05-child-blocker-priority");

    try {
      const summary = buildMigrationTraceabilitySummary({ readiness: readyReadiness() });

      expect(summary.state).toBe("blocked");
      expect(summary.canTrustMigrationReview).toBe(false);
      expect(summary.missingPmTaskIds).toEqual(["phase-05-child-blocker-priority"]);
    } finally {
      currentProjectManagementPhasePlanTaskIds.add("phase-05-child-blocker-priority");
    }
  });

  it("holds traceability when sensitive exclusions are incomplete", () => {
    const readiness = buildMigrationHardeningReadiness({
      preview: selectedPreview(),
      draftHistory: historyForAcceptedDraft(),
      excludedSecretsSummary: ["Credentials excluded"]
    });
    const summary = buildMigrationTraceabilitySummary({
      readiness,
      goals: withCurrentPhase5Goal()
    });

    expect(summary.state).toBe("review");
    expect(summary.canTrustMigrationReview).toBe(false);
    expect(summary.openReviewRecordCount).toBe(2);
    expect(summary.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "sensitive-boundary",
          status: "review"
        })
      ])
    );
  });

  it("blocks when audit consistency blocks migration review depth", () => {
    const history = historyForAcceptedDraft();
    const badAudit = createMigrationProfileDraftAuditRecord(history[0].draft, "created");
    const inconsistentHistory: MigrationProfileDraftHistoryRecord[] = [
      {
        draft: history[0].draft,
        audit: {
          ...badAudit,
          selectedCategoryCount: 99
        }
      }
    ];
    const readiness = buildMigrationHardeningReadiness({
      preview: selectedPreview(),
      draftHistory: inconsistentHistory,
      excludedSecretsSummary: ["Credentials excluded", "Raw transcripts excluded", "Source mutation excluded"]
    });
    const summary = buildMigrationTraceabilitySummary({ readiness });

    expect(summary.state).toBe("blocked");
    expect(summary.canTrustMigrationReview).toBe(false);
    expect(summary.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "review-depth",
          status: "blocked"
        })
      ])
    );
  });

  it("keeps migration traceability text public-safe", () => {
    const goals = remainingGoalPlan.map((goal) =>
      goal.id === "goal-phase-5-migration-hardening"
        ? {
            ...goal,
            nextAction:
              "Open C:\\Users\\MJ\\Projects\\ProjectAtlas\\secret.md with token sk-ABCDEF1234567890 <unsafe>"
          }
        : goal
    );
    const summary = buildMigrationTraceabilitySummary({
      readiness: readyReadiness(),
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
    expect(combinedText).not.toContain("sk-ABCDEF1234567890");
    expect(combinedText).not.toContain("<");
    expect(combinedText).not.toContain(">");
  });
});
