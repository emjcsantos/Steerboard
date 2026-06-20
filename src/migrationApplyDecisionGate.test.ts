import { describe, expect, it } from "vitest";
import { buildMigrationApplyDecisionGate } from "./migrationApplyDecisionGate";
import { buildMigrationBlockerPriority } from "./migrationBlockerPriority";
import { buildMigrationHardeningReadiness } from "./migrationHardeningReadiness";
import {
  appendMigrationProfileDraftHistory,
  buildDefaultMigrationPreview,
  createMigrationProfileDraft,
  toggleMigrationCategory
} from "./migrationModel";
import { buildMigrationTraceabilitySummary } from "./migrationTraceability";

function selectedPreview() {
  return toggleMigrationCategory(buildDefaultMigrationPreview("codex"), "projects", true);
}

function readyReadiness() {
  const draft = createMigrationProfileDraft(selectedPreview(), {
    createdAt: "2026-06-18T08:15:00.000Z"
  });

  return buildMigrationHardeningReadiness({
    preview: selectedPreview(),
    draftHistory: appendMigrationProfileDraftHistory(
      [],
      draft,
      "apply-review-staged",
      8,
      "2026-06-18T08:16:00.000Z"
    ),
    excludedSecretsSummary: [
      "Credentials excluded",
      "Raw transcripts excluded",
      "Source mutation excluded"
    ]
  });
}

function buildGate(readiness = readyReadiness()) {
  const traceability = buildMigrationTraceabilitySummary({ readiness });
  const blockerPriority = buildMigrationBlockerPriority({
    readiness,
    traceability
  });

  return buildMigrationApplyDecisionGate({
    readiness,
    traceability,
    blockerPriority
  });
}

describe("migration apply decision gate", () => {
  it("allows only local apply review staging when migration evidence is ready", () => {
    const gate = buildGate();

    expect(gate).toMatchObject({
      state: "ready",
      readiness: 100,
      canStageApplyReview: true,
      canApplyMigration: false,
      canActivateProfile: false,
      ownerApprovalRequired: true,
      sourceMutationLocked: true,
      profileActivationLocked: true,
      localApplyReviewAuditReady: true,
      rollbackReady: true,
      sensitiveExclusionsReady: true,
      openBlockerCount: 0
    });
    expect(gate.migrationApplyDecisionProof).toContain("stageApplyReview=yes");
    expect(gate.migrationApplyDecisionProof).toContain("canApply=no");
    expect(gate.migrationApplyDecisionProof).toContain("profileActivation=locked");
    expect(gate.migrationApplyDecisionProof).toContain("sourceMutation=locked");
    expect(gate.migrationApplyDecisionProof).toContain("approval=required");
  });

  it("holds the decision gate before a local apply-review-staged audit exists", () => {
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
    const gate = buildGate(readiness);

    expect(gate.state).toBe("review");
    expect(gate.canStageApplyReview).toBe(false);
    expect(gate.canApplyMigration).toBe(false);
    expect(gate.localApplyReviewAuditReady).toBe(false);
    expect(gate.migrationApplyDecisionProof).toContain("localAudit=held");
    expect(gate.migrationApplyDecisionProof).toContain("canApply=no");
  });
});
