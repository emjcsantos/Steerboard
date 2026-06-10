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
    expect(readiness.nextAction).toContain("Select safe metadata categories");
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
      excludedSecretsSummary: ["Credentials excluded", "Source mutation excluded"]
    });

    expect(readiness.state).toBe("ready");
    expect(readiness.readiness).toBe(100);
    expect(readiness.canRollback).toBe(true);
    expect(readiness.canStageApplyIntent).toBe(true);
    expect(readiness.applyIntentLabel).toBe("Apply review ready");
    expect(createMigrationApplyIntentNotice(readiness)).toContain("Active profile and source data remain unchanged");
  });

  it("keeps existing reviewed draft evidence ready after the preview checklist reloads", () => {
    const readiness = buildMigrationHardeningReadiness({
      preview: buildDefaultMigrationPreview("codex"),
      draftHistory: historyForAcceptedDraft(),
      excludedSecretsSummary: ["Credentials excluded", "Source mutation excluded"]
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
  });
});
