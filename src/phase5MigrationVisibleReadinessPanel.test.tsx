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
import {
  buildMigrationOwnerApprovalHandoff,
  createMigrationOwnerApprovalRecord
} from "./migrationOwnerApprovalHandoff";
import { buildMigrationApplyDecisionGate } from "./migrationApplyDecisionGate";
import { buildMigrationBlockerPriority } from "./migrationBlockerPriority";
import { buildMigrationTraceabilitySummary } from "./migrationTraceability";

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
    expect(html).toContain("pmLinks=13/13");
    expect(html).toContain("trust=ready");
    expect(html).toContain("Phase 5 migration blocker priority");
    expect(html).toContain("metadataReviewAddressable=");
    expect(html).toContain("Phase 5 migration apply decision gate");
    expect(html).toContain("stageApplyReview=yes");
    expect(html).toContain("canApply=no");
    expect(html).toContain("profileActivation=locked");
    expect(html).toContain("sourceMutation=locked");
    expect(html).toContain("approval=required");
    expect(html).toContain("Phase 5 migration owner approval handoff");
    expect(html).toContain("requestable=yes");
    expect(html).toContain("recorded=no");
    expect(html).toContain("Phase 5 migration apply implementation boundary");
    expect(html).toContain("ownerApproval=missing");
    expect(html).toContain("enterImplementation=no");
    expect(html).toContain("executor=missing");
    expect(html).toContain("mutationPath=locked");
    expect(html).toContain("Phase 5 migration completion gate");
    expect(html).toContain("phase5MigrationCompletionGate");
    expect(html).toContain("phaseComplete=yes");
    expect(html).toContain("reviewOnly=complete");
    expect(html).toContain("profileActivationApproval=required");
    expect(html).toContain("profileActivationHandler=missing");
    expect(html).toContain("Phase 5 profile activation gate");
    expect(html).toContain("phase5ProfileActivationGate");
    expect(html).toContain("ownerActivationApproval=required");
    expect(html).toContain("handler=missing");
    expect(html).toContain("canActivate=no");
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
    expect(html).toContain("No open Phase 5 migration blocker");
    expect(html).toContain("open=0 metadataReviewAddressable=0");
    expect(html).toContain("Phase 5 migration apply decision gate");
    expect(html).toContain("stageApplyReview=yes");
    expect(html).toContain("canApply=no");
    expect(html).toContain("profileActivation=locked");
    expect(html).toContain("approval=required");
    expect(html).toContain("Phase 5 migration owner approval handoff");
    expect(html).toContain("requestable=yes");
    expect(html).toContain("recorded=no");
    expect(html).toContain("Phase 5 migration apply implementation boundary");
    expect(html).toContain("ownerApproval=missing");
    expect(html).toContain("enterImplementation=no");
    expect(html).toContain("Phase 5 migration completion gate");
    expect(html).toContain("phaseComplete=yes");
    expect(html).toContain("Phase 5 profile activation gate");
    expect(html).toContain("ownerActivationApproval=required");
    expect(html).toContain("handler=missing");
    expect(html).not.toContain("has not recorded a local apply-review-staged audit action yet");
    expect(html).not.toContain("top priority Apply review staging");
    expect(html).not.toContain("Review required");
  });

  it("renders recorded owner approval without unlocking apply or profile activation", () => {
    const readiness = buildMigrationHardeningReadiness({
      preview: selectedPreview(),
      draftHistory: stagedDraftHistory(),
      excludedSecretsSummary: [
        "Credentials excluded",
        "Raw transcripts excluded",
        "Source mutation excluded"
      ]
    });
    const traceability = buildMigrationTraceabilitySummary({ readiness });
    const blockerPriority = buildMigrationBlockerPriority({
      readiness,
      traceability
    });
    const applyDecisionGate = buildMigrationApplyDecisionGate({
      readiness,
      traceability,
      blockerPriority
    });
    const pendingHandoff = buildMigrationOwnerApprovalHandoff({
      applyDecisionGate
    });
    const ownerApprovalRecord = createMigrationOwnerApprovalRecord({
      handoff: pendingHandoff,
      createdAt: "2026-06-20T12:15:00.000Z"
    });
    const html = renderToStaticMarkup(
      <MigrationReviewGatePanel
        migrationHardeningReadiness={readiness}
        migrationOwnerApprovalRecord={ownerApprovalRecord}
      />
    );

    expect(html).toContain("Phase 5 migration owner approval handoff");
    expect(html).toContain("recorded=yes");
    expect(html).toContain(`record=${ownerApprovalRecord.id}`);
    expect(html).toContain("canApply=no");
    expect(html).toContain("profileActivation=locked");
    expect(html).toContain("Phase 5 migration apply implementation boundary");
    expect(html).toContain("ownerApproval=recorded");
    expect(html).toContain("enterImplementation=yes");
    expect(html).toContain("executor=missing");
    expect(html).toContain("mutationPath=locked");
    expect(html).toContain("Phase 5 migration completion gate");
    expect(html).toContain("phaseComplete=yes");
    expect(html).toContain("Phase 5 profile activation gate");
    expect(html).toContain("ownerActivationApproval=required");
    expect(html).toContain("handler=missing");
    expect(html).toContain("canActivate=no");
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
    expect(html).toContain("Phase 5 migration apply decision gate");
    expect(html).toContain("stageApplyReview=no");
    expect(html).toContain("canApply=no");
    expect(html).toContain("localAudit=held");
    expect(html).toContain("Phase 5 migration owner approval handoff");
    expect(html).toContain("requestable=no");
    expect(html).toContain("Phase 5 migration apply implementation boundary");
    expect(html).toContain("ownerApproval=missing");
    expect(html).toContain("Phase 5 migration completion gate");
    expect(html).toContain("phaseComplete=no");
    expect(html).toContain("Phase 5 profile activation gate");
    expect(html).toContain("reviewOnly=held");
    expect(html).toContain("canActivate=no");
  });
});
