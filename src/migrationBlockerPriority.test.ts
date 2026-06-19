import { describe, expect, it } from "vitest";
import {
  appendMigrationProfileDraftHistory,
  buildDefaultMigrationPreview,
  createMigrationProfileDraft,
  createMigrationProfileDraftAuditRecord,
  toggleMigrationCategory,
  type MigrationProfileDraftHistoryRecord
} from "./migrationModel";
import { buildMigrationBlockerPriority } from "./migrationBlockerPriority";
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

function priority({
  preview = buildDefaultMigrationPreview("codex"),
  draftHistory = [],
  excludedSecretsSummary = ["Credentials excluded"],
  goals = remainingGoalPlan
}: {
  preview?: ReturnType<typeof buildDefaultMigrationPreview>;
  draftHistory?: MigrationProfileDraftHistoryRecord[];
  excludedSecretsSummary?: readonly string[];
  goals?: typeof remainingGoalPlan;
} = {}) {
  const readiness = buildMigrationHardeningReadiness({
    preview,
    draftHistory,
    excludedSecretsSummary
  });
  const traceability = buildMigrationTraceabilitySummary({
    readiness,
    goals
  });

  return buildMigrationBlockerPriority({ readiness, traceability });
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

describe("migration blocker priority", () => {
  it("ranks apply-intent review-depth blockers ahead of related waiting evidence", () => {
    const snapshot = priority();

    expect(snapshot.state).toBe("waiting");
    expect(snapshot.openBlockerCount).toBeGreaterThan(0);
    expect(snapshot.topPriorityLabel).toBe("Apply intent lock");
    expect(snapshot.metadataReviewCanAddressTopBlocker).toBe(true);
    expect(snapshot.items[0]).toMatchObject({
      kind: "review-depth",
      status: "waiting",
      severity: "high",
      priority: 1
    });
    expect(snapshot.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Rollback evidence", kind: "review-depth" }),
        expect.objectContaining({ label: "Audit consistency", kind: "review-depth" }),
        expect.objectContaining({ label: "Sensitive exclusions", kind: "review-depth" })
      ])
    );
  });

  it("keeps blocked audit consistency ahead of waiting rollback and review-only exclusions", () => {
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
    const snapshot = priority({
      preview: selectedPreview(),
      draftHistory: inconsistentHistory,
      excludedSecretsSummary: ["Credentials excluded", "Raw transcripts excluded"]
    });

    expect(snapshot.state).toBe("blocked");
    expect(snapshot.topPriorityLabel).toBe("Audit consistency");
    expect(snapshot.items[0]).toMatchObject({
      kind: "review-depth",
      status: "blocked",
      severity: "critical"
    });
    expect(snapshot.nextAction).toContain("phase5.audit-consistency");
  });

  it("surfaces PM traceability gaps after migration review evidence is ready", () => {
    const goals = remainingGoalPlan.map((goal) =>
      goal.id === "goal-phase-5-migration-hardening"
        ? {
            ...goal,
            pmTaskIds: goal.pmTaskIds.filter((taskId) => taskId !== "phase-05-child-traceability")
          }
        : goal
    );
    const snapshot = priority({
      preview: selectedPreview(),
      draftHistory: historyForStagedAcceptedDraft(),
      excludedSecretsSummary: ["Credentials excluded", "Raw transcripts excluded", "Source mutation excluded"],
      goals
    });

    expect(snapshot.state).toBe("blocked");
    expect(snapshot.topPriorityLabel).toBe("PM row coverage");
    expect(snapshot.items[0]).toMatchObject({
      kind: "traceability",
      status: "blocked",
      severity: "critical"
    });
  });

  it("ranks missing apply-review staging proof ahead of later review-only migration blockers", () => {
    const snapshot = priority({
      preview: selectedPreview(),
      draftHistory: historyForAcceptedDraft(),
      excludedSecretsSummary: [
        "Credentials excluded",
        "Raw transcripts excluded",
        "Source mutation excluded"
      ],
      goals: withCurrentPhase5Goal()
    });

    expect(snapshot.state).toBe("review");
    expect(snapshot.topPriorityLabel).toBe("Apply review staging");
    expect(snapshot.items[0]).toMatchObject({
      kind: "review-depth",
      status: "review",
      severity: "medium"
    });
    expect(snapshot.topPriorityAction).toContain("phase5.apply-review-staged-audit");
  });

  it("keeps remaining-goal traceability blockers out of metadata-review actions", () => {
    const snapshot = priority({
      preview: selectedPreview(),
      draftHistory: historyForStagedAcceptedDraft(),
      excludedSecretsSummary: ["Credentials excluded", "Raw transcripts excluded", "Source mutation excluded"]
    });

    expect(snapshot.state).toBe("waiting");
    expect(snapshot.topPriorityLabel).toBe("Remaining goal link");
    expect(snapshot.metadataReviewCanAddressTopBlocker).toBe(false);
    expect(snapshot.topPriorityAction).not.toContain("Run metadata review");
    expect(snapshot.topPriorityAction).toContain("Migration review gate");
    expect(snapshot.items[0]).toMatchObject({
      kind: "traceability",
      status: "waiting",
      canUseMetadataReview: false
    });
  });

  it("reports ready when migration review and traceability are fully ready", () => {
    const snapshot = priority({
      preview: selectedPreview(),
      draftHistory: historyForStagedAcceptedDraft(),
      excludedSecretsSummary: ["Credentials excluded", "Raw transcripts excluded", "Source mutation excluded"],
      goals: withCurrentPhase5Goal()
    });

    expect(snapshot.state).toBe("ready");
    expect(snapshot.openBlockerCount).toBe(0);
    expect(snapshot.readiness).toBe(100);
    expect(snapshot.topPriorityLabel).toBe("No open Phase 5 migration blocker");
  });

  it("keeps migration blocker-priority text public-safe", () => {
    const snapshot = priority({
      preview: selectedPreview(),
      draftHistory: historyForAcceptedDraft(),
      excludedSecretsSummary: [
        "Credentials excluded",
        "Raw transcripts excluded",
        "Source mutation excluded",
        "Open C:\\Users\\MJ\\Projects\\ProjectAtlas\\secret.md with token sk-ABCDEF1234567890 <unsafe>"
      ]
    });
    const combinedText = [
      snapshot.label,
      snapshot.ariaLabel,
      snapshot.nextAction,
      snapshot.safety,
      ...snapshot.items.flatMap((item) => [
        item.label,
        item.kind,
        item.status,
        item.severity,
        item.detail,
        item.nextAction
      ])
    ].join(" ");

    expect(combinedText).not.toMatch(/[A-Za-z]:[\\/]/);
    expect(combinedText).not.toMatch(/[\\/](Users|Projects|Documents|Desktop)[\\/]/i);
    expect(combinedText).not.toContain("sk-ABCDEF1234567890");
    expect(combinedText).not.toContain("<");
    expect(combinedText).not.toContain(">");
  });
});
