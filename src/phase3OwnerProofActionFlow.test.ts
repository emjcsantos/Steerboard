import { afterEach, describe, expect, it, vi } from "vitest";
import type { Phase3ClearancePackage } from "./phase3ClearancePackage";
import type { Phase3ClearanceTraceabilityPrecondition } from "./phase3ClearanceTraceability";
import type { Phase3CommandValidationRecordValidation } from "./phase3CommandValidationRecord";
import type { Phase3ProofExportVerification } from "./phase3ProofExport";
import {
  buildPhase3HandoffEvidenceFingerprint,
  derivePhase3HandoffRecordValidation,
  PHASE3_HANDOFF_RECORD_STORAGE_KEY
} from "./phase3HandoffRecord";
import {
  runPhase3OwnerHandoffClearAction,
  runPhase3OwnerHandoffRecordAction,
  runPhase3SmokeProofBundleImportAction
} from "./phase3OwnerProofActionFlow";
import {
  createPhase3SmokeProofFingerprint,
  PHASE3_SMOKE_PROOF_BUNDLE_PROVENANCE_SOURCE,
  PHASE3_SMOKE_PROOF_STORAGE_KEY
} from "./phase3SmokeProofStorage";

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
  const setItem = vi.fn((key: string, value: string) => {
    store.set(key, value);
  });
  const getItem = vi.fn((key: string) => store.get(key) ?? null);
  const removeItem = vi.fn((key: string) => {
    store.delete(key);
  });

  vi.stubGlobal("window", {
    localStorage: {
      getItem,
      setItem,
      removeItem
    }
  });

  return { getItem, removeItem, setItem, store };
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
      activeTurnInterruptSmoke: createPhase3SmokeProofFingerprint(
        bundle.activeTurnInterruptSmoke
      ),
      activeTurnSteerSmoke: createPhase3SmokeProofFingerprint(bundle.activeTurnSteerSmoke)
    },
    bundle
  };
}

function clearancePackage(
  overrides: Partial<Phase3ClearancePackage> = {}
): Phase3ClearancePackage {
  return {
    state: "ready",
    statusLabel: "Ready",
    readiness: 100,
    canExit: true,
    detail: "Phase 3 has complete evidence.",
    nextAction: "Record Phase 3 handoff.",
    readyCount: 5,
    openCount: 0,
    blockerCount: 0,
    reviewCount: 0,
    waitingCount: 0,
    blockers: [],
    safety: "Evidence only.",
    ...overrides
  };
}

function traceabilityPrecondition(
  overrides: Partial<Phase3ClearanceTraceabilityPrecondition> = {}
): Phase3ClearanceTraceabilityPrecondition {
  return {
    state: "ready",
    canTrustTrace: true,
    detail: "Phase 3 traceability is trusted.",
    nextAction: "Keep Phase 3 traceability attached.",
    ...overrides
  };
}

function commandValidation(
  overrides: Partial<Phase3CommandValidationRecordValidation> = {}
): Phase3CommandValidationRecordValidation {
  return {
    state: "ready",
    statusLabel: "Ready",
    detail: "Phase 3 CLI smoke validation is fresh.",
    nextAction: "Keep Phase 3 CLI smoke validation attached.",
    isFresh: true,
    ...overrides
  };
}

function proofExportVerification(
  overrides: Partial<Phase3ProofExportVerification> = {}
): Phase3ProofExportVerification {
  return {
    state: "ready",
    statusLabel: "Ready",
    readiness: 100,
    canVerifyOffline: true,
    pmTaskId: "phase-03-child-proof-export-boundary",
    evidenceKey: "phase3.proof-export.offline-verification",
    detail: "Phase 3 proof export is offline-verifiable.",
    nextAction: "Keep Phase 3 proof export offline verification attached.",
    readyPanelEvidenceCount: 2,
    storageAttestedDesktopProofCount: 3,
    hasCommandValidationRecord: true,
    hasOwnerHandoffRecord: true,
    ...overrides
  };
}

describe("phase 3 owner proof action flow", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("imports provenance-wrapped desktop proof into all App state slices", () => {
    createStore();
    const effects = {
      setLiveControlSmokeProof: vi.fn(),
      setActiveTurnInterruptSmokeProof: vi.fn(),
      setActiveTurnSteerSmokeProof: vi.fn(),
      setPersistedDesktopProofs: vi.fn(),
      setStorageReviewReasons: vi.fn(),
      setProofEvaluationTime: vi.fn(),
      setAppNotice: vi.fn()
    };

    const result = runPhase3SmokeProofBundleImportAction(
      JSON.stringify(provenanceEnvelope()),
      effects,
      "2026-06-18T07:58:00.000Z"
    );

    expect(result.imported).toBe(true);
    expect(result.readiness?.storageAttestedCount).toBe(3);
    expect(result.readiness?.state).toBe("ready");
    expect(effects.setLiveControlSmokeProof).toHaveBeenCalledWith(
      expect.objectContaining({ source: "desktop", executed: true })
    );
    expect(effects.setActiveTurnInterruptSmokeProof).toHaveBeenCalledWith(
      expect.objectContaining({ source: "desktop", interruptSent: true })
    );
    expect(effects.setActiveTurnSteerSmokeProof).toHaveBeenCalledWith(
      expect.objectContaining({ source: "desktop", steerSent: true })
    );
    expect(effects.setPersistedDesktopProofs).toHaveBeenCalledWith({
      liveControlSmoke: true,
      activeTurnInterruptSmoke: true,
      activeTurnSteerSmoke: true
    });
    expect(effects.setStorageReviewReasons).toHaveBeenCalledWith({});
    expect(effects.setProofEvaluationTime).toHaveBeenCalledWith(
      "2026-06-18T07:58:00.000Z"
    );
    expect(effects.setAppNotice).toHaveBeenCalledWith(
      expect.stringContaining("3 storage-proof-attested desktop proof rows")
    );
  });

  it("rejects malformed imports without touching existing proof state", () => {
    createStore();
    const effects = {
      setLiveControlSmokeProof: vi.fn(),
      setActiveTurnInterruptSmokeProof: vi.fn(),
      setActiveTurnSteerSmokeProof: vi.fn(),
      setPersistedDesktopProofs: vi.fn(),
      setProofEvaluationTime: vi.fn(),
      setAppNotice: vi.fn()
    };

    const result = runPhase3SmokeProofBundleImportAction("{", effects);

    expect(result.imported).toBe(false);
    expect(effects.setLiveControlSmokeProof).not.toHaveBeenCalled();
    expect(effects.setActiveTurnInterruptSmokeProof).not.toHaveBeenCalled();
    expect(effects.setActiveTurnSteerSmokeProof).not.toHaveBeenCalled();
    expect(effects.setPersistedDesktopProofs).not.toHaveBeenCalled();
    expect(effects.setProofEvaluationTime).not.toHaveBeenCalled();
    expect(effects.setAppNotice).toHaveBeenCalledWith(
      "Phase 3 desktop smoke proof artifact could not be imported"
    );
  });

  it("holds owner handoff recording until clearance is exit-ready", () => {
    const effects = {
      saveRecord: vi.fn(),
      setRecord: vi.fn(),
      setProofEvaluationTime: vi.fn(),
      setAppNotice: vi.fn()
    };

    const result = runPhase3OwnerHandoffRecordAction({
      clearancePackage: clearancePackage({ canExit: false, state: "review" }),
      traceabilityPrecondition: traceabilityPrecondition(),
      commandValidation: commandValidation(),
      proofExportVerification: proofExportVerification(),
      evidenceFingerprint: "phase3-handoff-current",
      createdAt: "2026-06-18T08:00:00.000Z",
      ...effects
    });

    expect(result.recorded).toBe(false);
    expect(effects.saveRecord).not.toHaveBeenCalled();
    expect(effects.setRecord).not.toHaveBeenCalled();
    expect(effects.setProofEvaluationTime).not.toHaveBeenCalled();
    expect(effects.setAppNotice).toHaveBeenCalledWith(
      "Phase 3 handoff remains held until clearance is exit-ready"
    );
  });

  it("holds owner handoff recording until Phase 3 traceability is trusted", () => {
    const effects = {
      saveRecord: vi.fn(),
      setRecord: vi.fn(),
      setProofEvaluationTime: vi.fn(),
      setAppNotice: vi.fn()
    };

    const result = runPhase3OwnerHandoffRecordAction({
      clearancePackage: clearancePackage(),
      traceabilityPrecondition: traceabilityPrecondition({
        state: "review",
        canTrustTrace: false,
        nextAction: "Attach Phase 3 PM child rows before handoff."
      }),
      commandValidation: commandValidation(),
      proofExportVerification: proofExportVerification(),
      evidenceFingerprint: "phase3-handoff-current",
      createdAt: "2026-06-18T08:00:00.000Z",
      ...effects
    });

    expect(result.recorded).toBe(false);
    expect(effects.saveRecord).not.toHaveBeenCalled();
    expect(effects.setRecord).not.toHaveBeenCalled();
    expect(effects.setProofEvaluationTime).not.toHaveBeenCalled();
    expect(effects.setAppNotice).toHaveBeenCalledWith(
      "Attach Phase 3 PM child rows before handoff."
    );
  });

  it("holds owner handoff recording until CLI validation is ready", () => {
    const effects = {
      saveRecord: vi.fn(),
      setRecord: vi.fn(),
      setProofEvaluationTime: vi.fn(),
      setAppNotice: vi.fn()
    };

    const result = runPhase3OwnerHandoffRecordAction({
      clearancePackage: clearancePackage(),
      traceabilityPrecondition: traceabilityPrecondition(),
      commandValidation: commandValidation({
        state: "review",
        statusLabel: "Review",
        detail: "Phase 3 CLI smoke validation is stale.",
        nextAction: "Rerun npm.cmd run smoke:phase3 manually."
      }),
      proofExportVerification: proofExportVerification(),
      evidenceFingerprint: "phase3-handoff-current",
      createdAt: "2026-06-18T08:00:00.000Z",
      ...effects
    });

    expect(result.recorded).toBe(false);
    expect(effects.saveRecord).not.toHaveBeenCalled();
    expect(effects.setRecord).not.toHaveBeenCalled();
    expect(effects.setProofEvaluationTime).not.toHaveBeenCalled();
    expect(effects.setAppNotice).toHaveBeenCalledWith(
      "Rerun npm.cmd run smoke:phase3 manually."
    );
  });

  it("holds owner handoff recording until proof export is offline-verifiable", () => {
    const effects = {
      saveRecord: vi.fn(),
      setRecord: vi.fn(),
      setProofEvaluationTime: vi.fn(),
      setAppNotice: vi.fn()
    };

    const result = runPhase3OwnerHandoffRecordAction({
      clearancePackage: clearancePackage(),
      traceabilityPrecondition: traceabilityPrecondition(),
      commandValidation: commandValidation(),
      proofExportVerification: proofExportVerification({
        state: "review",
        statusLabel: "Review",
        readiness: 65,
        canVerifyOffline: false,
        detail: "Phase 3 proof export is missing the owner handoff record.",
        nextAction: "Record the owner-reviewed Phase 3 handoff before exporting."
      }),
      evidenceFingerprint: "phase3-handoff-current",
      createdAt: "2026-06-18T08:00:00.000Z",
      ...effects
    });

    expect(result.recorded).toBe(false);
    expect(effects.saveRecord).not.toHaveBeenCalled();
    expect(effects.setRecord).not.toHaveBeenCalled();
    expect(effects.setProofEvaluationTime).not.toHaveBeenCalled();
    expect(effects.setAppNotice).toHaveBeenCalledWith(
      "Record the owner-reviewed Phase 3 handoff before exporting."
    );
  });

  it("records fresh owner handoff with the current evidence fingerprint", () => {
    const currentClearance = clearancePackage();
    const evidenceFingerprint = buildPhase3HandoffEvidenceFingerprint({
      clearancePackage: currentClearance
    });
    const effects = {
      saveRecord: vi.fn(),
      setRecord: vi.fn(),
      setProofEvaluationTime: vi.fn(),
      setAppNotice: vi.fn()
    };

    const result = runPhase3OwnerHandoffRecordAction({
      clearancePackage: currentClearance,
      traceabilityPrecondition: traceabilityPrecondition(),
      commandValidation: commandValidation(),
      proofExportVerification: proofExportVerification(),
      evidenceFingerprint,
      createdAt: "2026-06-18T08:00:00.000Z",
      ...effects
    });

    expect(result.recorded).toBe(true);
    expect(result.record).toMatchObject({
      state: "ready",
      evidenceFingerprint,
      canExit: true,
      exactBlockerCount: 0
    });
    expect(effects.saveRecord).toHaveBeenCalledWith(result.record);
    expect(effects.setRecord).toHaveBeenCalledWith(result.record);
    expect(effects.setProofEvaluationTime).toHaveBeenCalledWith(
      "2026-06-18T08:00:00.000Z"
    );
    expect(effects.setAppNotice).toHaveBeenCalledWith(
      "Phase 3 owner handoff recorded locally"
    );
    expect(
      derivePhase3HandoffRecordValidation(
        result.record,
        currentClearance,
        evidenceFingerprint,
        { evaluatedAt: "2026-06-18T08:01:00.000Z" }
      )
    ).toMatchObject({
      state: "ready",
      matchesCurrentEvidence: true,
      recordAgeMs: 60_000
    });
  });

  it("clears only the owner handoff record and preserves smoke proof storage", () => {
    const { store } = createStore();
    const effects = {
      setRecord: vi.fn(),
      setProofEvaluationTime: vi.fn(),
      setAppNotice: vi.fn()
    };
    store.set(PHASE3_HANDOFF_RECORD_STORAGE_KEY, "handoff");
    store.set(PHASE3_SMOKE_PROOF_STORAGE_KEY, "smoke-proof");

    runPhase3OwnerHandoffClearAction(effects, "2026-06-18T08:03:00.000Z");

    expect(store.has(PHASE3_HANDOFF_RECORD_STORAGE_KEY)).toBe(false);
    expect(store.get(PHASE3_SMOKE_PROOF_STORAGE_KEY)).toBe("smoke-proof");
    expect(effects.setRecord).toHaveBeenCalledWith(undefined);
    expect(effects.setProofEvaluationTime).toHaveBeenCalledWith(
      "2026-06-18T08:03:00.000Z"
    );
    expect(effects.setAppNotice).toHaveBeenCalledWith(
      "Phase 3 owner handoff record cleared"
    );
  });
});
