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

function readyReadiness() {
  return buildMigrationHardeningReadiness({
    preview: selectedPreview(),
    draftHistory: historyForAcceptedDraft(),
    excludedSecretsSummary: ["Credentials excluded", "Raw transcripts excluded", "Source mutation excluded"]
  });
}

describe("migration traceability", () => {
  it("links the Phase 5 goal, PM child rows, review-depth rows, sensitive boundary, and profile lock", () => {
    const summary = buildMigrationTraceabilitySummary({ readiness: readyReadiness() });

    expect(summary.state).toBe("ready");
    expect(summary.canTrustMigrationReview).toBe(true);
    expect(summary.linkedGoalId).toBe("goal-phase-5-migration-hardening");
    expect(summary.linkedPmTaskCount).toBeGreaterThanOrEqual(9);
    expect(summary.missingPmTaskIds).toEqual([]);
    expect(summary.reviewDepthCount).toBe(5);
    expect(summary.evidenceKeyCount).toBe(5);
    expect(summary.items.map((item) => item.kind)).toEqual([
      "active-goal",
      "pm-coverage",
      "review-depth",
      "sensitive-boundary",
      "profile-lock"
    ]);
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

  it("holds traceability when sensitive exclusions are incomplete", () => {
    const readiness = buildMigrationHardeningReadiness({
      preview: selectedPreview(),
      draftHistory: historyForAcceptedDraft(),
      excludedSecretsSummary: ["Credentials excluded"]
    });
    const summary = buildMigrationTraceabilitySummary({ readiness });

    expect(summary.state).toBe("review");
    expect(summary.canTrustMigrationReview).toBe(false);
    expect(summary.openReviewRecordCount).toBe(1);
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
