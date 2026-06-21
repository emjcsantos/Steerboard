import { describe, expect, it } from "vitest";
import type { Phase7DispatchCompletionGate } from "./phase7DispatchCompletionGate";
import { buildPhase7WorkerSessionCreationGate } from "./phase7WorkerSessionCreationGate";
import type { Phase7LiveWorkerLaunchGate } from "./phase7LiveWorkerLaunchGate";

function completionGate(
  overrides: Partial<Phase7DispatchCompletionGate> = {}
): Phase7DispatchCompletionGate {
  return {
    state: "complete",
    statusLabel: "Complete",
    readiness: 100,
    phaseComplete: true,
    canSpawnLiveWorker: false,
    canCreateWorkerSession: false,
    workerSessionCreationHeld: true,
    ownerHandoffState: "ready",
    pushApprovalRequired: true,
    sessionCreationApprovalRequired: true,
    finalValidationOwner: "Main Codex",
    commitPushReportingOwner: "Main Codex",
    handoffPacketCount: 4,
    validationGateCount: 2,
    traceabilityLinkCount: 5,
    detail:
      "Phase 7 dispatch loop is complete as a local metadata handoff; live-worker spawning remains locked behind separate owner approval.",
    nextAction:
      "Move active implementation to the next pending lane while preserving Phase 7 completion proof for owner review.",
    completionGateProof:
      "phase7DispatchCompletionGate state=complete phaseComplete=yes ownerHandoff=ready pushApproval=required canSpawn=no workerSession=held sessionApproval=required canCreateSession=no finalValidationOwner=Main Codex commitPushReportingOwner=Main Codex packets=4/4 validationGates=2 traceabilityLinks=5/5",
    ...overrides
  };
}

function launchGate(overrides: Partial<Phase7LiveWorkerLaunchGate> = {}): Phase7LiveWorkerLaunchGate {
  return {
    state: "locked",
    statusLabel: "Locked",
    readiness: 95,
    canSpawnLiveWorker: false,
    approvalRequired: true,
    preflightState: "ready",
    readyPreflightCount: 5,
    requiredPreflightCount: 5,
    artifactVerificationState: "ready",
    executionLocked: true,
    openBlockerCount: 0,
    liveWorkerLockCount: 2,
    handoffPacketCount: 4,
    detail:
      "Phase 7 dispatch artifact and live-session preflight evidence are verified, but live-worker spawning remains locked until the owner approves a separate live-worker expansion.",
    nextAction:
      "Keep dispatch work in local metadata review and use the verified artifact plus preflight proof only as handoff evidence.",
    launchGateProof:
      "phase7LiveWorkerLaunchGate state=locked artifactVerification=ready preflight=ready preflightReady=5/5 approval=required canSpawn=no execution=locked locks=2/2 packets=4/4 open=0",
    ...overrides
  };
}

describe("phase 7 worker session creation gate", () => {
  it("waits for explicit owner approval after completion and preflight are ready", () => {
    const gate = buildPhase7WorkerSessionCreationGate(completionGate(), launchGate());

    expect(gate).toMatchObject({
      state: "waiting",
      statusLabel: "Waiting",
      canCreateWorkerSession: false,
      completionState: "complete",
      launchGateState: "locked",
      preflightState: "ready",
      phaseComplete: true,
      ownerApprovalRecorded: false,
      liveSessionHandlerReady: false,
      executionLocked: true,
      handoffPacketCount: 4
    });
    expect(gate.detail).toContain("waiting for explicit owner approval");
    expect(gate.sessionCreationProof).toContain("ownerApproval=required");
    expect(gate.sessionCreationProof).toContain("canCreate=no");
  });

  it("keeps the gate in review when approval is present but no live handler is ready", () => {
    const gate = buildPhase7WorkerSessionCreationGate(completionGate(), launchGate(), {
      ownerSessionCreationApprovalRecorded: true
    });

    expect(gate).toMatchObject({
      state: "review",
      canCreateWorkerSession: false,
      ownerApprovalRecorded: true,
      liveSessionHandlerReady: false
    });
    expect(gate.detail).toContain("no live session creation handler is ready");
    expect(gate.sessionCreationProof).toContain("ownerApproval=recorded");
    expect(gate.sessionCreationProof).toContain("handler=missing");
  });

  it("allows session creation only when completion, preflight, owner approval, and handler evidence are present", () => {
    const gate = buildPhase7WorkerSessionCreationGate(completionGate(), launchGate(), {
      ownerSessionCreationApprovalRecorded: true,
      liveSessionHandlerReady: true
    });

    expect(gate).toMatchObject({
      state: "ready",
      statusLabel: "Ready",
      readiness: 100,
      canCreateWorkerSession: true,
      ownerApprovalRecorded: true,
      liveSessionHandlerReady: true
    });
    expect(gate.sessionCreationProof).toContain("canCreate=yes");
    expect(gate.sessionCreationProof).toContain("handler=ready");
  });

  it("keeps session creation in review until preflight is ready", () => {
    const gate = buildPhase7WorkerSessionCreationGate(
      completionGate(),
      launchGate({
        preflightState: "missing",
        readyPreflightCount: 0
      })
    );

    expect(gate).toMatchObject({
      state: "review",
      canCreateWorkerSession: false,
      preflightState: "missing"
    });
    expect(gate.detail).toContain("preflight evidence is ready");
    expect(gate.sessionCreationProof).toContain("preflight=missing");
  });

  it("blocks session creation when execution is not locked", () => {
    const gate = buildPhase7WorkerSessionCreationGate(
      completionGate(),
      launchGate({
        state: "blocked",
        executionLocked: false
      })
    );

    expect(gate).toMatchObject({
      state: "blocked",
      canCreateWorkerSession: false,
      executionLocked: false
    });
    expect(gate.detail).toContain("live execution is not locked");
    expect(gate.sessionCreationProof).toContain("execution=unlocked");
  });
});
