import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MigrationReviewGatePanel } from "./App";
import {
  appendMigrationProfileDraftHistory,
  buildDefaultMigrationPreview,
  createMigrationProfileDraft,
  loadMigrationProfileDraftHistory,
  saveMigrationProfileDraftHistory,
  toggleMigrationCategory
} from "./migrationModel";
import { buildMigrationHardeningReadiness } from "./migrationHardeningReadiness";

function selectedPreview() {
  return toggleMigrationCategory(buildDefaultMigrationPreview("codex"), "projects", true);
}

function stagedDraftHistory() {
  const draft = createMigrationProfileDraft(selectedPreview(), {
    createdAt: "2026-06-18T08:15:00.000Z"
  });

  return appendMigrationProfileDraftHistory(
    [],
    draft,
    "apply-review-staged",
    8,
    "2026-06-18T08:16:00.000Z"
  );
}

describe("phase 5 migration visible readiness panel", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders staged apply-review audit evidence and migration safety locks for owner review", () => {
    const readiness = buildMigrationHardeningReadiness({
      preview: selectedPreview(),
      draftHistory: stagedDraftHistory(),
      excludedSecretsSummary: [
        "Credentials excluded",
        "Raw transcripts excluded",
        "Source mutation excluded"
      ]
    });
    const html = renderToStaticMarkup(
      <MigrationReviewGatePanel migrationHardeningReadiness={readiness} />
    );

    expect(html).toContain("Migration review gate");
    expect(html).toContain("Metadata impact preview");
    expect(html).toContain("selected metadata categories");
    expect(html).toContain("Apply review staging");
    expect(html).toContain("apply-review-staged");
    expect(html).toContain("records=6/6");
    expect(html).toContain("evidenceKeys=6/6");
    expect(html).toContain("sourceMutation=locked");
    expect(html).toContain("phase5.apply-review-staged-audit");
    expect(html).toContain("Local apply-review-staged audit action");
    expect(html).toContain("active-profile lock");
    expect(html).toContain("source-data lock");
    expect(html).toContain("Profile activation lock");
    expect(html).toContain("Migration hardening is preview/apply-intent metadata only");
    expect(html).toContain("Phase 5 migration traceability");
    expect(html).toContain("pmLinks=9/9");
    expect(html).toContain("trust=ready");
    expect(html).toContain("Phase 5 migration blocker priority");
    expect(html).toContain("metadataReviewAddressable=");
  });

  it("renders staged apply-review evidence after saved draft history reload", () => {
    const storage = { value: "" };
    const memoryStorage = {
      getItem: vi.fn(() => (storage.value.length ? storage.value : null)),
      setItem: vi.fn((_key: string, next: string) => {
        storage.value = next;
      })
    };

    vi.stubGlobal("window", { localStorage: memoryStorage });
    saveMigrationProfileDraftHistory(stagedDraftHistory());

    const loadedHistory = loadMigrationProfileDraftHistory([], 8);
    const readiness = buildMigrationHardeningReadiness({
      preview: selectedPreview(),
      draftHistory: loadedHistory,
      excludedSecretsSummary: [
        "Credentials excluded",
        "Raw transcripts excluded",
        "Source mutation excluded"
      ]
    });
    const html = renderToStaticMarkup(
      <MigrationReviewGatePanel migrationHardeningReadiness={readiness} />
    );

    expect(loadedHistory).toHaveLength(1);
    expect(loadedHistory[0].audit.action).toBe("apply-review-staged");
    expect(memoryStorage.setItem).toHaveBeenCalled();
    expect(memoryStorage.getItem).toHaveBeenCalled();
    expect(html).toContain("apply-review-staged");
    expect(html).toContain("phase5.apply-review-staged-audit");
    expect(html).toContain("Local apply-review-staged audit action");
    expect(html).toContain("active-profile lock");
    expect(html).toContain("source-data lock");
    expect(html).toContain("Profile activation lock");
    expect(html).toContain("Phase 5 migration traceability");
    expect(html).toContain("Phase 5 migration blocker priority");
    expect(html).toContain("records=6/6");
    expect(html).toContain("top priority No open Phase 5 migration blocker");
    expect(html).not.toContain("has not recorded a local apply-review-staged audit action yet");
    expect(html).not.toContain("top priority Apply review staging");
    expect(html).not.toContain("Review required");
  });

  it("keeps unstaged drafts visibly held before apply-review staging is recorded", () => {
    const draft = createMigrationProfileDraft(selectedPreview(), {
      createdAt: "2026-06-18T08:15:00.000Z"
    });
    const readiness = buildMigrationHardeningReadiness({
      preview: selectedPreview(),
      draftHistory: appendMigrationProfileDraftHistory([], draft, "created", 8, draft.createdAt),
      excludedSecretsSummary: [
        "Credentials excluded",
        "Raw transcripts excluded",
        "Source mutation excluded"
      ]
    });
    const html = renderToStaticMarkup(
      <MigrationReviewGatePanel migrationHardeningReadiness={readiness} />
    );

    expect(html).toContain("Apply review staging");
    expect(html).toContain("has not recorded a local apply-review-staged audit action yet");
    expect(html).toContain("Stage apply review as a local audit record only");
    expect(html).toContain("Review required");
  });
});
