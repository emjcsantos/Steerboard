import { describe, expect, it } from "vitest";
import type { Phase8CloseoutStatus } from "./phase8CloseoutStatus";
import {
  buildPhase8MutationExpansionGate,
  PHASE8_MUTATION_EXPANSION_SURFACES
} from "./phase8MutationExpansionGate";
import type { Phase8PermissionAuditCompletionGate } from "./phase8PermissionAuditCompletionGate";

function completionGate(
  overrides: Partial<Phase8PermissionAuditCompletionGate> = {}
): Phase8PermissionAuditCompletionGate {
  return {
    state: "complete",
    statusLabel: "Complete",
    readiness: 100,
    phaseComplete: true,
    canAdvanceMutationPaths: false,
    ownerReviewAttached: true,
    artifactReady: true,
    mutationLocked: true,
    openBlockerCount: 0,
    openExceptionCount: 0,
    traceabilityTrusted: true,
    reviewedBlockerProof: true,
    ownerHandoffReady: true,
    ownerHandoffState: "ready",
    ownerHandoffFingerprintCurrent: true,
    detail:
      "Phase 8 permission and audit depth is complete as an owner-reviewed, artifact-verified audit lane; mutation-capable paths remain locked for later phases.",
    nextAction:
      "Move active implementation to the next pending lane while preserving Phase 8 completion proof for Phase 9 runner approval.",
    completionGateProof:
      "phase8PermissionAuditCompletionGate state=complete phaseComplete=yes canAdvanceMutationPaths=no ownerReview=attached artifact=ready mutation=locked openBlockers=0 openExceptions=0 traceability=ready reviewedBlocker=attached handoff=ready handoffState=ready handoffFingerprint=current",
    ariaLabel:
      "Phase 8 permission audit completion gate: Complete; phase complete yes; mutation paths locked; next action: Move active implementation to the next pending lane while preserving Phase 8 completion proof for Phase 9 runner approval.",
    ...overrides
  };
}

function closeoutStatus(overrides: Partial<Phase8CloseoutStatus> = {}): Phase8CloseoutStatus {
  return {
    id: "phase-8-closeout-status",
    label: "Phase 8 closeout status",
    state: "ready",
    statusLabel: "Ready",
    readiness: 100,
    phaseComplete: true,
    phase9DependencyReady: true,
    mutationPathsLocked: true,
    canAdvanceMutationPaths: false,
    mutationExpansionHeld: true,
    approvedMutationSurfaceCount: 0,
    handlerMutationSurfaceCount: 0,
    requiredMutationSurfaceCount: 9,
    ownerReviewClosed: true,
    finalHandoffReady: true,
    ownerReviewRecorded: true,
    openBlockerCount: 0,
    openExceptionCount: 0,
    auditReviewBlockersRemaining: 0,
    topHold: "none",
    phase8CloseoutStatusProof:
      "phase8CloseoutStatusProof=state=ready readiness=100 phaseComplete=yes phase9Dependency=ready mutationPaths=locked mutationExpansion=held approvals=0/9 handlers=0/9 canAdvanceMutation=no ownerReviewClose=ready finalHandoff=ready recorded=yes open=0 openExceptions=0 auditReviewBlockers=0 topHold=none",
    nextAction:
      "Phase 8 closeout proof is ready for Phase 9 dependency review; keep mutation paths locked.",
    safety:
      "Phase 8 closeout status is evidence-only. It closes the Phase 8 proof surface for Phase 9 dependency review without recording owner review, requesting approval, running actions, mutating files, exporting records, or unlocking mutation paths.",
    ariaLabel:
      "Phase 8 closeout status: Ready; 100% ready; phase complete yes; Phase 9 dependency ready; mutation paths locked; next action: Phase 8 closeout proof is ready for Phase 9 dependency review; keep mutation paths locked.",
    ...overrides
  };
}

describe("phase 8 mutation expansion gate", () => {
  it("waits for owner approval on all broad mutation surfaces after closeout", () => {
    const gate = buildPhase8MutationExpansionGate(completionGate(), closeoutStatus());

    expect(gate).toMatchObject({
      state: "waiting",
      canAdvanceMutationPaths: false,
      phaseComplete: true,
      closeoutReady: true,
      mutationPathsLocked: true,
      approvedSurfaceCount: 0,
      handlerSurfaceCount: 0,
      requiredSurfaceCount: 9
    });
    expect(gate.missingApprovalSurfaces).toEqual(PHASE8_MUTATION_EXPANSION_SURFACES);
    expect(gate.mutationExpansionGateProof).toContain("approvals=0/9");
    expect(gate.mutationExpansionGateProof).toContain("canAdvance=no");
  });

  it("stays in review when approvals exist but handlers are missing", () => {
    const gate = buildPhase8MutationExpansionGate(completionGate(), closeoutStatus(), {
      approvedMutationSurfaces: PHASE8_MUTATION_EXPANSION_SURFACES
    });

    expect(gate).toMatchObject({
      state: "review",
      canAdvanceMutationPaths: false,
      approvedSurfaceCount: 9,
      handlerSurfaceCount: 0
    });
    expect(gate.detail).toContain("not every live handler is ready");
    expect(gate.mutationExpansionGateProof).toContain("handlers=0/9");
  });

  it("allows mutation expansion only when closeout, approvals, and handlers are ready", () => {
    const gate = buildPhase8MutationExpansionGate(completionGate(), closeoutStatus(), {
      approvedMutationSurfaces: PHASE8_MUTATION_EXPANSION_SURFACES,
      liveHandlerSurfaces: PHASE8_MUTATION_EXPANSION_SURFACES
    });

    expect(gate).toMatchObject({
      state: "ready",
      readiness: 100,
      canAdvanceMutationPaths: true,
      approvedSurfaceCount: 9,
      handlerSurfaceCount: 9
    });
    expect(gate.mutationExpansionGateProof).toContain("canAdvance=yes");
    expect(gate.mutationExpansionGateProof).toContain("missingHandlers=none");
  });

  it("keeps expansion in review while Phase 8 completion is held", () => {
    const gate = buildPhase8MutationExpansionGate(
      completionGate({
        state: "review",
        phaseComplete: false
      }),
      closeoutStatus()
    );

    expect(gate).toMatchObject({
      state: "review",
      canAdvanceMutationPaths: false,
      phaseComplete: false
    });
    expect(gate.detail).toContain("completion and closeout are both ready");
    expect(gate.mutationExpansionGateProof).toContain("phaseComplete=no");
  });

  it("blocks expansion if mutation locks are lost", () => {
    const gate = buildPhase8MutationExpansionGate(
      completionGate({
        mutationLocked: false
      }),
      closeoutStatus()
    );

    expect(gate).toMatchObject({
      state: "blocked",
      canAdvanceMutationPaths: false,
      mutationPathsLocked: false
    });
    expect(gate.detail).toContain("locked mutation paths");
    expect(gate.mutationExpansionGateProof).toContain("mutationPaths=unlocked");
  });
});
