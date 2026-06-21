import { describe, expect, it } from "vitest";
import type { MigrationApplyImplementationBoundary } from "./migrationApplyImplementationBoundary";
import { buildPhase5ProfileActivationGate } from "./phase5ProfileActivationGate";
import type { Phase5MigrationCompletionGate } from "./phase5MigrationCompletionGate";

function completionGate(
  overrides: Partial<Phase5MigrationCompletionGate> = {}
): Phase5MigrationCompletionGate {
  return {
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
    mutationPathAvailable: false,
    detail:
      "Phase 5 migration center is complete as a review-only migration workflow; actual apply execution remains unavailable and profile activation stays locked.",
    nextAction:
      "Move active implementation to the next pending lane while preserving Phase 5 completion proof for owner review.",
    completionGateProof:
      "phase5MigrationCompletionGate state=complete phaseComplete=yes reviewOnly=complete canApply=no profileActivation=locked profileActivationApproval=required profileActivationHandler=missing ownerApprovalRequestable=yes ownerApprovalRecorded=no openBlockers=0 traceability=ready executor=missing mutationPath=locked",
    ariaLabel:
      "Phase 5 migration completion gate: Complete; phase complete yes; review-only complete; can apply no; next action: Move active implementation to the next pending lane while preserving Phase 5 completion proof for owner review.",
    ...overrides
  };
}

function implementationBoundary(
  overrides: Partial<MigrationApplyImplementationBoundary> = {}
): MigrationApplyImplementationBoundary {
  return {
    id: "phase-5-migration-apply-implementation-boundary",
    label: "Phase 5 migration apply implementation boundary",
    state: "waiting",
    statusLabel: "Approval needed",
    readiness: 80,
    ownerApprovalRecorded: false,
    canEnterApplyImplementation: false,
    canApplyMigration: false,
    canActivateProfile: false,
    sourceMutationLocked: true,
    profileActivationLocked: true,
    executorAvailable: false,
    mutationPathAvailable: false,
    applyImplementationBoundaryProof:
      "boundary=waiting readiness=80 ownerApproval=missing enterImplementation=no executor=missing mutationPath=locked canApply=no profileActivation=locked sourceMutation=locked",
    nextAction:
      "Record explicit owner approval locally before designing a separate reversible migration apply implementation.",
    safety:
      "Phase 5 migration apply implementation boundary is a local safety gate. It proves whether the reviewed and owner-approved packet can enter a future implementation path, while keeping source mutation, profile activation, provider calls, command execution, and secret copying locked.",
    ariaLabel:
      "Phase 5 migration apply implementation boundary: Approval needed; 80% ready; owner approval missing; enter implementation no; can apply no; profile activation locked; next action: Record explicit owner approval locally before designing a separate reversible migration apply implementation.",
    ...overrides
  };
}

describe("phase 5 profile activation gate", () => {
  it("waits for separate profile activation approval after review-only completion", () => {
    const gate = buildPhase5ProfileActivationGate(completionGate(), implementationBoundary());

    expect(gate).toMatchObject({
      state: "waiting",
      statusLabel: "Activation approval needed",
      canActivateProfile: false,
      phaseComplete: true,
      reviewOnlyComplete: true,
      ownerActivationApprovalRecorded: false,
      profileActivationHandlerReady: false,
      sourceMutationLocked: true,
      applyMigrationLocked: true
    });
    expect(gate.detail).toContain("waiting for separate owner approval");
    expect(gate.profileActivationGateProof).toContain("ownerActivationApproval=required");
    expect(gate.profileActivationGateProof).toContain("canActivate=no");
  });

  it("keeps activation in review when approval exists but no handler is ready", () => {
    const gate = buildPhase5ProfileActivationGate(completionGate(), implementationBoundary(), {
      ownerProfileActivationApprovalRecorded: true
    });

    expect(gate).toMatchObject({
      state: "review",
      canActivateProfile: false,
      ownerActivationApprovalRecorded: true,
      profileActivationHandlerReady: false
    });
    expect(gate.detail).toContain("no activation handler is ready");
    expect(gate.profileActivationGateProof).toContain("handler=missing");
  });

  it("allows activation only after completion, owner approval, and handler evidence are ready", () => {
    const gate = buildPhase5ProfileActivationGate(completionGate(), implementationBoundary(), {
      ownerProfileActivationApprovalRecorded: true,
      profileActivationHandlerReady: true
    });

    expect(gate).toMatchObject({
      state: "ready",
      readiness: 100,
      canActivateProfile: true,
      ownerActivationApprovalRecorded: true,
      profileActivationHandlerReady: true
    });
    expect(gate.profileActivationGateProof).toContain("canActivate=yes");
    expect(gate.profileActivationGateProof).toContain("handler=ready");
  });

  it("holds activation while review-only completion is incomplete", () => {
    const gate = buildPhase5ProfileActivationGate(
      completionGate({
        state: "review",
        phaseComplete: false,
        reviewOnlyComplete: false
      }),
      implementationBoundary()
    );

    expect(gate).toMatchObject({
      state: "review",
      canActivateProfile: false,
      phaseComplete: false,
      reviewOnlyComplete: false
    });
    expect(gate.detail).toContain("review-only migration completion is proven");
    expect(gate.profileActivationGateProof).toContain("reviewOnly=held");
  });

  it("blocks activation when apply or source-mutation locks are not trustworthy", () => {
    const gate = buildPhase5ProfileActivationGate(
      completionGate({
        canApplyMigration: true
      }),
      implementationBoundary()
    );

    expect(gate).toMatchObject({
      state: "blocked",
      canActivateProfile: false,
      applyMigrationLocked: false
    });
    expect(gate.detail).toContain("mutation locks are not trustworthy");
    expect(gate.profileActivationGateProof).toContain("apply=unlocked");
  });
});
