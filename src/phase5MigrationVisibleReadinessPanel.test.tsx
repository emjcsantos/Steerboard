import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MigrationReviewGatePanel } from "./App";
import {
  appendMigrationProfileDraftHistory,
  buildDefaultMigrationPreview,
  createMigrationProfileDraft,
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
    expect(html).toContain("Apply review staging");
    expect(html).toContain("apply-review-staged");
    expect(html).toContain("phase5.apply-review-staged-audit");
    expect(html).toContain("Local apply-review-staged audit action");
    expect(html).toContain("active-profile lock");
    expect(html).toContain("source-data lock");
    expect(html).toContain("Profile activation lock");
    expect(html).toContain("Migration hardening is preview/apply-intent metadata only");
    expect(html).toContain("Phase 5 migration traceability");
    expect(html).toContain("Phase 5 migration blocker priority");
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
