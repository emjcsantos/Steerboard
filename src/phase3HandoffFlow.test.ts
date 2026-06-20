import { afterEach, describe, expect, it, vi } from "vitest";
import { buildPhase3ClearancePackage } from "./phase3ClearancePackage";
import { buildPhase3ClearanceTraceabilityPrecondition } from "./phase3ClearanceTraceability";
import type { Phase3CommandValidationRecordValidation } from "./phase3CommandValidationRecord";
import { buildPhase3ExitGateEvidence } from "./phase3ExitGateEvidence";
import { buildPhase3HandoffGate } from "./phase3HandoffGate";
import {
  buildPhase3HandoffEvidenceFingerprint,
  createPhase3OwnerHandoffRecord,
  derivePhase3HandoffRecordValidation
} from "./phase3HandoffRecord";
import {
  PHASE3_PROOF_EXPORT_EVIDENCE_KEY,
  PHASE3_PROOF_EXPORT_PM_TASK_ID,
  type Phase3ProofExportVerification
} from "./phase3ProofExport";
import {
  loadPhase3SessionControlEvidenceByPanel,
  loadPhase3SlashEvidenceByPanel,
  savePhase3SessionControlEvidenceByPanel,
  savePhase3SlashEvidenceByPanel
} from "./phase3PanelEvidenceStorage";
import { importPhase3SmokeProofBundleArtifact } from "./phase3SmokeProofImport";
import {
  createPhase3SmokeProofFingerprint,
  PHASE3_SMOKE_PROOF_BUNDLE_PROVENANCE_SOURCE
} from "./phase3SmokeProofStorage";
import { buildSessionControlReadinessEvidence } from "./sessionControlReadinessEvidence";
import { buildSlashCommandExecutionEvidence } from "./slashCommandExecutionEvidence";
import { findCurrentActiveRemainingGoals, remainingGoalPlan } from "./remainingGoalPlan";

const evaluatedAt = "2026-06-18T07:58:00.000Z";
const panelProofCreatedAt = "2026-06-18T07:57:40.000Z";
const handoffCreatedAt = "2026-06-18T07:58:05.000Z";
const handoffEvaluatedAt = "2026-06-18T07:58:30.000Z";
const currentPanelId = "panel-phase3-owner-proof";

const liveControlSmoke = {
  source: "desktop",
  checkedAt: "1781769450476",
  executed: true,
  ok: true,
  completed: true,
  unsupported: false,
  detail: "Live-control proof passed.",
  sourceDetected: true,
  appServerReady: true,
  protocolReady: true,
  requiredMethods: [
    {
      method: "thread/start",
      supported: true,
      state: "supported",
      detail: "Thread creation protocol schema is present."
    }
  ],
  supportedMethodCount: 1,
  unsupportedMethodCount: 0,
  totalMethodCount: 1
};

const activeTurnInterruptSmoke = {
  source: "desktop",
  checkedAt: "1781769429511",
  completed: true,
  controls: [
    {
      attempted: true,
      control: "turn/interrupt",
      detail: "Sent turn/interrupt request while turn was active.",
      observed: false,
      sent: true,
      supported: true
    }
  ],
  detail: "Active-turn interrupt command was sent.",
  eventCount: 23,
  executed: true,
  failed: false,
  interruptObserved: false,
  interruptSent: true,
  ok: true,
  sessionStarted: true,
  transcriptLength: 33,
  turnIdSeen: true,
  unsupported: false
};

const activeTurnSteerSmoke = {
  source: "desktop",
  checkedAt: "1781769438295",
  completed: false,
  controls: [
    {
      attempted: true,
      control: "turn/steer",
      detail: "Sent turn/steer request while turn was active.",
      observed: false,
      sent: true,
      supported: true
    }
  ],
  detail: "Active-turn steer command was sent.",
  eventCount: 12,
  executed: true,
  expectedTokenSeen: false,
  failed: false,
  ok: true,
  sessionStarted: true,
  steerObserved: false,
  steerSent: true,
  transcriptLength: 0,
  turnIdSeen: true,
  unsupported: false
};

function createStore() {
  const store = new Map<string, string>();

  vi.stubGlobal("window", {
    localStorage: {
      getItem: vi.fn((key: string) => store.get(key) ?? null),
      removeItem: vi.fn((key: string) => {
        store.delete(key);
      }),
      setItem: vi.fn((key: string, value: string) => {
        store.set(key, value);
      })
    }
  });

  return store;
}

function rawBundle() {
  return {
    liveControlSmoke,
    activeTurnInterruptSmoke,
    activeTurnSteerSmoke
  };
}

function provenanceEnvelope() {
  const bundle = rawBundle();

  return {
    source: PHASE3_SMOKE_PROOF_BUNDLE_PROVENANCE_SOURCE,
    command: "npm.cmd run smoke:phase3",
    createdAt: "2026-06-18T07:57:30.551Z",
    runId: "phase3-smoke-record:2026-06-18T07:57:30.551Z",
    passedTestCount: 3,
    failedTestCount: 0,
    rowFingerprints: {
      liveControlSmoke: createPhase3SmokeProofFingerprint(bundle.liveControlSmoke),
      activeTurnInterruptSmoke: createPhase3SmokeProofFingerprint(bundle.activeTurnInterruptSmoke),
      activeTurnSteerSmoke: createPhase3SmokeProofFingerprint(bundle.activeTurnSteerSmoke)
    },
    bundle
  };
}

function readyCommandValidation(): Phase3CommandValidationRecordValidation {
  return {
    state: "ready",
    statusLabel: "Ready",
    detail:
      "Phase 3 CLI smoke validation is fresh and matches current desktop smoke proof rows.",
    nextAction:
      "Keep the CLI smoke validation attached for owner review without using it to unlock handoff.",
    isFresh: true,
    hasSmokeBundleProvenance: true
  };
}

function readyProofExportVerification(
  expectedFingerprint: string
): Phase3ProofExportVerification {
  return {
    state: "ready",
    statusLabel: "Ready",
    readiness: 100,
    canVerifyOffline: true,
    detail:
      "Phase 3 proof export artifact contains current-panel panel proof, storage-attested desktop proof, CLI validation, and current exit-ready owner handoff evidence.",
    nextAction:
      "Keep the exported Phase 3 proof package attached while Phase 4 review remains gated by owner review plus proof-export offline verification.",
    currentPanelId,
    readyPanelEvidenceCount: 2,
    storageAttestedDesktopProofCount: 3,
    hasCommandValidationRecord: true,
    hasOwnerHandoffRecord: true,
    handoffEvidenceFingerprint: expectedFingerprint,
    ownerHandoffRecordFingerprint: expectedFingerprint,
    ownerHandoffClearanceReadiness: 100,
    ownerHandoffExactBlockerCount: 0,
    pmTaskId: PHASE3_PROOF_EXPORT_PM_TASK_ID,
    evidenceKey: PHASE3_PROOF_EXPORT_EVIDENCE_KEY
  };
}

function saveReadyPanelEvidence() {
  const slashEvidence = buildSlashCommandExecutionEvidence({
    submittedMessage: "/plan Phase 3 handoff",
    liveTransportAvailable: true,
    transcriptMessages: [
      {
        role: "user",
        body: "/plan Phase 3 handoff",
        meta: "slash command"
      },
      {
        role: "system",
        body: "/plan routed through provider",
        meta: "slash command provider route"
      },
      {
        role: "system",
        body: "Live command completed",
        meta: "live codex"
      }
    ]
  });
  const sessionControlEvidence = buildSessionControlReadinessEvidence({
    interrupt: { state: "live" },
    retry: { state: "live" },
    steer: { state: "live" },
    fork: { state: "unsupported" },
    resume: { state: "unsupported" },
    archive: { state: "unsupported" }
  });

  savePhase3SlashEvidenceByPanel(
    { [currentPanelId]: slashEvidence },
    { createdAt: panelProofCreatedAt }
  );
  savePhase3SessionControlEvidenceByPanel(
    { [currentPanelId]: sessionControlEvidence },
    { createdAt: panelProofCreatedAt }
  );
}

describe("phase 3 handoff flow", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("keeps provider integration held until imported proof and current panel evidence produce a fresh owner handoff", () => {
    createStore();
    saveReadyPanelEvidence();
    const smokeImport = importPhase3SmokeProofBundleArtifact(
      JSON.stringify(provenanceEnvelope()),
      evaluatedAt
    );

    expect(smokeImport.imported).toBe(true);
    expect(smokeImport.readiness).toMatchObject({
      state: "ready",
      storageAttestedCount: 3,
      storageReviewCount: 0
    });
    expect(smokeImport.persistedDesktopProofs).toEqual({
      liveControlSmoke: true,
      activeTurnInterruptSmoke: true,
      activeTurnSteerSmoke: true
    });

    const exitGate = buildPhase3ExitGateEvidence({
      slashEvidence: loadPhase3SlashEvidenceByPanel()[currentPanelId],
      sessionControlEvidence: loadPhase3SessionControlEvidenceByPanel()[currentPanelId],
      liveControlSmoke: smokeImport.bundle?.liveControlSmoke,
      activeTurnInterruptSmoke: smokeImport.bundle?.activeTurnInterruptSmoke,
      activeTurnSteerSmoke: smokeImport.bundle?.activeTurnSteerSmoke,
      persistedDesktopProofs: smokeImport.persistedDesktopProofs,
      evaluatedAt,
      currentPanelId
    });

    expect(exitGate).toMatchObject({
      currentPanelId,
      state: "ready",
      pass: true,
      readiness: 100
    });
    expect(exitGate.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "phase3-exit-gate:slash-execution",
          state: "ready",
          detail: expect.stringContaining("current-panel storage provenance")
        }),
        expect.objectContaining({
          id: "phase3-exit-gate:session-controls",
          state: "ready",
          detail: expect.stringContaining("current-panel storage provenance")
        })
      ])
    );

    const clearancePackage = buildPhase3ClearancePackage({ exitGate });
    const traceabilityPrecondition = buildPhase3ClearanceTraceabilityPrecondition();
    const expectedFingerprint = buildPhase3HandoffEvidenceFingerprint({
      clearancePackage,
      exitGate,
      commandPlanId: "phase-3-clearance-command-plan"
    });
    const heldHandoffGate = buildPhase3HandoffGate({
      clearancePackage,
      traceabilityPrecondition,
      commandValidation: readyCommandValidation()
    });

    expect(clearancePackage).toMatchObject({
      state: "ready",
      canExit: true,
      openCount: 0,
      readyCount: 5
    });
    expect(traceabilityPrecondition).toMatchObject({
      state: "ready",
      canTrustTrace: true
    });
    expect(heldHandoffGate).toMatchObject({
      state: "waiting",
      canAdvanceProviderIntegration: false
    });
    expect(heldHandoffGate.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "provider-boundary",
          status: "waiting",
          detail: expect.stringContaining("owner handoff record is attached")
        })
      ])
    );

    const handoffRecord = createPhase3OwnerHandoffRecord(
      clearancePackage,
      handoffCreatedAt,
      expectedFingerprint
    );
    const handoffValidationWithoutAge = derivePhase3HandoffRecordValidation(
      handoffRecord,
      clearancePackage,
      expectedFingerprint
    );
    const readyLookingHandoffGate = buildPhase3HandoffGate({
      clearancePackage,
      traceabilityPrecondition,
      commandValidation: readyCommandValidation(),
      handoffRecordState: "ready",
      handoffRecordValidation: handoffValidationWithoutAge
    });
    const handoffValidation = derivePhase3HandoffRecordValidation(
      handoffRecord,
      clearancePackage,
      expectedFingerprint,
      { evaluatedAt: handoffEvaluatedAt }
    );
    const readyHandoffGate = buildPhase3HandoffGate({
      clearancePackage,
      traceabilityPrecondition,
      commandValidation: readyCommandValidation(),
      proofExportVerification: readyProofExportVerification(expectedFingerprint),
      handoffRecordValidation: handoffValidation
    });

    expect(handoffValidationWithoutAge).toMatchObject({
      state: "review",
      matchesCurrentEvidence: true,
      expectedFingerprint,
      recordFingerprint: expectedFingerprint
    });
    expect(readyLookingHandoffGate).toMatchObject({
      state: "review",
      canAdvanceProviderIntegration: false
    });
    expect(readyLookingHandoffGate.handoffEvidenceReview).toMatchObject({
      expectedFingerprint,
      recordFingerprint: expectedFingerprint,
      matchesCurrentEvidence: true,
      hasFreshAgeMetadata: false,
      clearanceSnapshot: {
        state: "ready",
        readiness: 100,
        canExit: true,
        exactBlockerCount: 0
      }
    });
    expect(readyLookingHandoffGate.nextAction).toContain(
      "current evaluation time"
    );
    expect(handoffValidation).toMatchObject({
      state: "ready",
      matchesCurrentEvidence: true,
      expectedFingerprint,
      recordFingerprint: expectedFingerprint,
      evaluatedAt: handoffEvaluatedAt,
      recordAgeMs: 25_000
    });
    expect(readyHandoffGate).toMatchObject({
      state: "ready",
      readiness: 100,
      canAdvanceProviderIntegration: true
    });
    expect(readyHandoffGate.handoffEvidenceReview).toMatchObject({
      matchesCurrentEvidence: true,
      hasFreshAgeMetadata: true,
      clearanceSnapshot: {
        state: "ready",
        readiness: 100,
        canExit: true,
        exactBlockerCount: 0
      }
    });

    const currentGoals = findCurrentActiveRemainingGoals();
    const phase5Goal = remainingGoalPlan.find(
      (goal) => goal.id === "goal-phase-5-migration-hardening"
    );

    expect(currentGoals.map((goal) => goal.id)).toEqual([
      "goal-phase-5-migration-hardening"
    ]);
    expect(phase5Goal).toMatchObject({
      status: "active",
      priority: "high"
    });
    expect(phase5Goal?.current).toBe(true);
  });
});
