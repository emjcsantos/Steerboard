import { describe, expect, it } from "vitest";
import { buildMigrationApplyDecisionGate } from "./migrationApplyDecisionGate";
import { buildMigrationApplyImplementationBoundary } from "./migrationApplyImplementationBoundary";
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
import { buildPhase5MigrationCompletionGate } from "./phase5MigrationCompletionGate";

function selectedPreview() {
  return toggleMigrationCategory(buildDefaultMigrationPreview("codex"), "projects", true);
}

function readyGate() {
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
  const applyDecision = buildMigrationApplyDecisionGate({
    readiness,
    traceability,
    blockerPriority
  });
  const ownerApprovalHandoff = buildMigrationOwnerApprovalHandoff({
    applyDecisionGate: applyDecision
  });
  const applyImplementationBoundary = buildMigrationApplyImplementationBoundary({
    ownerApprovalHandoff
  });

  return buildPhase5MigrationCompletionGate({
    readiness,
    traceability,
    blockerPriority,
    applyDecision,
    ownerApprovalHandoff,
    applyImplementationBoundary
  });
}

describe("phase 5 migration completion gate", () => {
  it("marks Phase 5 complete as review-only while apply remains unavailable", () => {
    const gate = readyGate();

    expect(gate).toMatchObject({
      state: "complete",
      statusLabel: "Complete",
      readiness: 100,
      phaseComplete: true,
      reviewOnlyComplete: true,
      canApplyMigration: false,
      canActivateProfile: false,
      profileActivationApprovalRequired: true,
      profileActivationHandlerReady: false,
      ownerApprovalRequestable: true,
      ownerApprovalRecorded: false,
      openBlockerCount: 0,
      traceabilityTrusted: true,
      executorAvailable: false,
      mutationPathAvailable: false
    });
    expect(gate.completionGateProof).toContain("phase5MigrationCompletionGate");
    expect(gate.completionGateProof).toContain("phaseComplete=yes");
    expect(gate.completionGateProof).toContain("reviewOnly=complete");
    expect(gate.completionGateProof).toContain("canApply=no");
    expect(gate.completionGateProof).toContain("profileActivationApproval=required");
    expect(gate.completionGateProof).toContain("profileActivationHandler=missing");
    expect(gate.completionGateProof).toContain("executor=missing");
    expect(gate.completionGateProof).toContain("mutationPath=locked");
  });

  it("holds completion when apply review cannot be staged", () => {
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
    const traceability = buildMigrationTraceabilitySummary({ readiness });
    const blockerPriority = buildMigrationBlockerPriority({ readiness, traceability });
    const applyDecision = buildMigrationApplyDecisionGate({
      readiness,
      traceability,
      blockerPriority
    });
    const ownerApprovalHandoff = buildMigrationOwnerApprovalHandoff({
      applyDecisionGate: applyDecision
    });
    const applyImplementationBoundary = buildMigrationApplyImplementationBoundary({
      ownerApprovalHandoff
    });
    const gate = buildPhase5MigrationCompletionGate({
      readiness,
      traceability,
      blockerPriority,
      applyDecision,
      ownerApprovalHandoff,
      applyImplementationBoundary
    });

    expect(gate.state).toBe("review");
    expect(gate.phaseComplete).toBe(false);
    expect(gate.completionGateProof).toContain("phaseComplete=no");
  });
});
