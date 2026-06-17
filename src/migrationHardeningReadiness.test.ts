import { describe, expect, it } from "vitest";
import {
  appendMigrationProfileDraftHistory,
  buildDefaultMigrationPreview,
  createMigrationProfileDraft,
  createMigrationProfileDraftAuditRecord,
  toggleMigrationCategory,
  type MigrationProfileDraftHistoryRecord
} from "./migrationModel";
import {
  buildMigrationHardeningReadiness,
  createMigrationApplyIntentNotice
} from "./migrationHardeningReadiness";

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

describe("migration hardening readiness", () => {
  it("waits for a selected preview and reviewed draft before apply intent", () => {
    const readiness = buildMigrationHardeningReadiness({
      preview: buildDefaultMigrationPreview("codex"),
      draftHistory: [],
      excludedSecretsSummary: ["Credentials excluded"]
    });

    expect(readiness.state).toBe("waiting");
    expect(readiness.canCreateDraft).toBe(false);
    expect(readiness.canRollback).toBe(false);
    expect(readiness.canStageApplyIntent).toBe(false);
    expect(readiness.applyIntentState).toBe("waiting");
    expect(readiness.reviewRecordCount).toBe(5);
    expect(readiness.openReviewRecordCount).toBeGreaterThan(0);
    expect(readiness.nextAction).toContain("Select safe metadata categories");
    expect(readiness.reviewDepthItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "migration-review-depth:apply-intent-lock",
          status: "waiting",
          evidence: expect.stringContaining("Draft id")
        }),
        expect.objectContaining({
          id: "migration-review-depth:profile-activation-lock",
          status: "ready",
          detail: expect.stringContaining("never changes the active profile")
        })
      ])
    );
  });

  it("allows draft creation from selected safe metadata while apply remains waiting", () => {
    const readiness = buildMigrationHardeningReadiness({
      preview: selectedPreview(),
      draftHistory: [],
      excludedSecretsSummary: ["Credentials excluded", "Raw transcripts excluded"]
    });

    expect(readiness.state).toBe("waiting");
    expect(readiness.selectedCategoryCount).toBe(1);
    expect(readiness.canCreateDraft).toBe(true);
    expect(readiness.canStageApplyIntent).toBe(false);
    expect(readiness.items.find((item) => item.id === "draft-created")?.status).toBe("waiting");
  });

  it("marks a ready draft as apply-review ready without applying the profile", () => {
    const readiness = buildMigrationHardeningReadiness({
      preview: selectedPreview(),
      draftHistory: historyForAcceptedDraft(),
      excludedSecretsSummary: ["Credentials excluded", "Raw transcripts excluded", "Source mutation excluded"]
    });

    expect(readiness.state).toBe("ready");
    expect(readiness.readiness).toBe(100);
    expect(readiness.canRollback).toBe(true);
    expect(readiness.canStageApplyIntent).toBe(true);
    expect(readiness.openReviewRecordCount).toBe(0);
    expect(readiness.applyIntentLabel).toBe("Apply review ready");
    expect(readiness.reviewDepthItems.every((item) => item.status === "ready")).toBe(true);
    expect(createMigrationApplyIntentNotice(readiness)).toContain("Active profile and source data remain unchanged");
  });

  it("keeps existing reviewed draft evidence ready after the preview checklist reloads", () => {
    const readiness = buildMigrationHardeningReadiness({
      preview: buildDefaultMigrationPreview("codex"),
      draftHistory: historyForAcceptedDraft(),
      excludedSecretsSummary: ["Credentials excluded", "Raw transcripts excluded", "Source mutation excluded"]
    });

    expect(readiness.state).toBe("ready");
    expect(readiness.selectedCategoryCount).toBe(1);
    expect(readiness.canCreateDraft).toBe(false);
    expect(readiness.canStageApplyIntent).toBe(true);
    expect(readiness.items.find((item) => item.id === "preview-selection")?.detail).toContain(
      "existing reviewed draft"
    );
  });

  it("keeps review-required drafts held but stageable for owner review", () => {
    const reviewDraft = createMigrationProfileDraft(toggleMigrationCategory(buildDefaultMigrationPreview("codex"), "commands", true), {
      createdAt: "2026-02-02T00:00:00.000Z"
    });
    const history = appendMigrationProfileDraftHistory(
      [],
      reviewDraft,
      "created",
      8,
      "2026-02-02T00:00:00.000Z"
    );

    const readiness = buildMigrationHardeningReadiness({
      preview: toggleMigrationCategory(buildDefaultMigrationPreview("codex"), "commands", true),
      draftHistory: history,
      excludedSecretsSummary: ["Credentials excluded", "Raw transcripts excluded"]
    });

    expect(readiness.state).toBe("review");
    expect(readiness.canStageApplyIntent).toBe(true);
    expect(readiness.applyIntentState).toBe("needs-review");
    expect(readiness.reviewDepthItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "migration-review-depth:apply-intent-lock",
          status: "review",
          nextAction: expect.stringContaining("Stage owner review")
        })
      ])
    );
    expect(readiness.nextAction).toContain("Review required categories");
  });

  it("blocks apply intent when the latest audit does not match the latest draft", () => {
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
      excludedSecretsSummary: ["Credentials excluded"]
    });

    expect(readiness.state).toBe("blocked");
    expect(readiness.canStageApplyIntent).toBe(false);
    expect(readiness.applyIntentState).toBe("blocked");
    expect(readiness.items.find((item) => item.id === "audit-review")?.status).toBe("blocked");
    expect(readiness.reviewDepthItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "migration-review-depth:audit-consistency",
          status: "blocked",
          nextAction: expect.stringContaining("Repair inconsistent audit")
        })
      ])
    );
  });

  it("keeps incomplete sensitive exclusions in review before apply depth is complete", () => {
    const readiness = buildMigrationHardeningReadiness({
      preview: selectedPreview(),
      draftHistory: historyForAcceptedDraft(),
      excludedSecretsSummary: ["Credentials excluded"]
    });

    expect(readiness.state).toBe("review");
    expect(readiness.openReviewRecordCount).toBe(1);
    expect(readiness.reviewDepthItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "migration-review-depth:sensitive-exclusions",
          status: "review",
          evidence: expect.stringContaining("raw transcript")
        })
      ])
    );
  });

  it("keeps migration review depth text public-safe", () => {
    const readiness = buildMigrationHardeningReadiness({
      preview: selectedPreview(),
      draftHistory: historyForAcceptedDraft(),
      excludedSecretsSummary: ["Credentials excluded", "Raw transcripts excluded", "Source mutation excluded"]
    });
    const combinedText = [
      readiness.nextAction,
      readiness.safety,
      ...readiness.items.flatMap((item) => [item.label, item.detail]),
      ...readiness.reviewDepthItems.flatMap((item) => [
        item.label,
        item.detail,
        item.evidence,
        item.nextAction
      ])
    ].join(" ");

    expect(combinedText).not.toMatch(/[A-Za-z]:[\\/]/);
    expect(combinedText).not.toMatch(/[\\/](Users|Projects|Documents|Desktop)[\\/]/i);
    expect(combinedText).not.toContain("<");
    expect(combinedText).not.toContain(">");
  });
});
