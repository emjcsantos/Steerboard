import { describe, expect, it } from "vitest";
import { buildMigrationApplyDecisionGate } from "./migrationApplyDecisionGate";
import { buildMigrationApplyImplementationBoundary } from "./migrationApplyImplementationBoundary";
import { buildMigrationBlockerPriority } from "./migrationBlockerPriority";
import { buildMigrationHardeningReadiness } from "./migrationHardeningReadiness";
import {
  buildMigrationOwnerApprovalHandoff,
  createMigrationOwnerApprovalRecord
} from "./migrationOwnerApprovalHandoff";
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

function readyStack() {
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
  const applyDecisionGate = buildMigrationApplyDecisionGate({
    readiness,
    traceability,
    blockerPriority
  });

  const handoff = buildMigrationOwnerApprovalHandoff({
    applyDecisionGate
  });

  return { applyDecisionGate, handoff };
}

describe("migration apply implementation boundary", () => {
  it("waits for local owner approval before implementation can be considered", () => {
    const boundary = buildMigrationApplyImplementationBoundary({
      ownerApprovalHandoff: readyStack().handoff
    });

    expect(boundary).toMatchObject({
      state: "waiting",
      readiness: 80,
      ownerApprovalRecorded: false,
      canEnterApplyImplementation: false,
      canApplyMigration: false,
      canActivateProfile: false,
      executorAvailable: false,
      mutationPathAvailable: false,
      sourceMutationLocked: true,
      profileActivationLocked: true
    });
    expect(boundary.applyImplementationBoundaryProof).toContain("ownerApproval=missing");
    expect(boundary.applyImplementationBoundaryProof).toContain("enterImplementation=no");
    expect(boundary.applyImplementationBoundaryProof).toContain("canApply=no");
  });

  it("keeps apply and profile activation locked after owner approval is recorded", () => {
    const { applyDecisionGate, handoff } = readyStack();
    const ownerApprovalRecord = createMigrationOwnerApprovalRecord({
      handoff,
      createdAt: "2026-06-20T12:15:00.000Z"
    });
    const recordedHandoff = buildMigrationOwnerApprovalHandoff({
      applyDecisionGate,
      ownerApprovalRecord
    });
    const boundary = buildMigrationApplyImplementationBoundary({
      ownerApprovalHandoff: recordedHandoff,
      ownerApprovalRecord
    });

    expect(boundary).toMatchObject({
      state: "ready",
      readiness: 100,
      ownerApprovalRecorded: true,
      canEnterApplyImplementation: true,
      canApplyMigration: false,
      canActivateProfile: false,
      executorAvailable: false,
      mutationPathAvailable: false,
      sourceMutationLocked: true,
      profileActivationLocked: true
    });
    expect(boundary.applyImplementationBoundaryProof).toContain("ownerApproval=recorded");
    expect(boundary.applyImplementationBoundaryProof).toContain("enterImplementation=yes");
    expect(boundary.applyImplementationBoundaryProof).toContain("executor=missing");
    expect(boundary.applyImplementationBoundaryProof).toContain("mutationPath=locked");
    expect(boundary.applyImplementationBoundaryProof).toContain("canApply=no");
  });
});
