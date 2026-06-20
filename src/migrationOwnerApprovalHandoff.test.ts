import { describe, expect, it } from "vitest";
import { buildMigrationApplyDecisionGate } from "./migrationApplyDecisionGate";
import { buildMigrationBlockerPriority } from "./migrationBlockerPriority";
import { buildMigrationHardeningReadiness } from "./migrationHardeningReadiness";
import { buildMigrationOwnerApprovalHandoff } from "./migrationOwnerApprovalHandoff";
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

function readyApplyDecisionGate() {
  const draft = createMigrationProfileDraft(selectedPreview(), {
    createdAt: "2026-06-18T08:15:00.000Z"
  });
  const readiness = buildMigrationHardeningReadiness({
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

describe("migration owner approval handoff", () => {
  it("makes owner approval requestable without unlocking migration apply", () => {
    const handoff = buildMigrationOwnerApprovalHandoff({
      applyDecisionGate: readyApplyDecisionGate()
    });

    expect(handoff).toMatchObject({
      state: "waiting",
      readiness: 85,
      canRequestOwnerApproval: true,
      ownerApprovalRecorded: false,
      canApplyMigration: false,
      canActivateProfile: false,
      sourceMutationLocked: true,
      profileActivationLocked: true,
      approvalRequired: true
    });
    expect(handoff.migrationOwnerApprovalHandoffProof).toContain("requestable=yes");
    expect(handoff.migrationOwnerApprovalHandoffProof).toContain("recorded=no");
    expect(handoff.migrationOwnerApprovalHandoffProof).toContain("canApply=no");
    expect(handoff.migrationOwnerApprovalHandoffProof).toContain("profileActivation=locked");
    expect(handoff.migrationOwnerApprovalHandoffProof).toContain("sourceMutation=locked");
  });

  it("records owner approval evidence without adding an apply path", () => {
    const handoff = buildMigrationOwnerApprovalHandoff({
      applyDecisionGate: readyApplyDecisionGate(),
      ownerApprovalRecorded: true
    });

    expect(handoff).toMatchObject({
      state: "ready",
      readiness: 100,
      canRequestOwnerApproval: false,
      ownerApprovalRecorded: true,
      canApplyMigration: false,
      canActivateProfile: false,
      approvalRequired: false
    });
    expect(handoff.migrationOwnerApprovalHandoffProof).toContain("recorded=yes");
    expect(handoff.migrationOwnerApprovalHandoffProof).toContain("canApply=no");
  });
});
