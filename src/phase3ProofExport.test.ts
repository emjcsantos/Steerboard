import { afterEach, describe, expect, it, vi } from "vitest";
import {
  savePhase3CommandValidationRecord,
  type Phase3CommandValidationRecord
} from "./phase3CommandValidationRecord";
import {
  savePhase3OwnerHandoffRecord,
  type Phase3OwnerHandoffRecord
} from "./phase3HandoffRecord";
import {
  PHASE3_PROOF_EXPORT_EVIDENCE_KEY,
  PHASE3_PROOF_EXPORT_PM_TASK_ID,
  buildPhase3ProofExportArtifact,
  canRecordPhase3OwnerHandoffFromProofExportPreflight,
  parsePhase3ProofExportArtifact,
  preparePhase3ProofExportDownload,
  serializePhase3ProofExportArtifact,
  verifyPhase3ProofExportArtifact,
  verifySerializedPhase3ProofExportArtifact
} from "./phase3ProofExport";
import type { Phase3SmokeProofBundle } from "./phase3SmokeProofStorage";
import { savePhase3SmokeProofBundle } from "./phase3SmokeProofStorage";
import { buildSessionControlReadinessEvidence } from "./sessionControlReadinessEvidence";
import { buildSlashCommandExecutionEvidence } from "./slashCommandExecutionEvidence";

const currentPanelId = "panel-phase3-proof-export";
const evaluatedAt = "2026-06-18T08:10:00.000Z";
const exportedAt = "2026-06-18T08:10:05.000Z";
const verifiedAt = "2026-06-18T08:10:30.000Z";
const handoffFingerprint = "phase3-handoff-current";

const slashEvidence = buildSlashCommandExecutionEvidence({
  submittedMessage: "/plan Phase 3 proof export",
  liveTransportAvailable: true,
  transcriptMessages: [
    { role: "user", body: "/plan Phase 3 proof export", meta: "slash command" },
    { role: "system", body: "/plan routed through provider", meta: "slash command provider route" },
    { role: "system", body: "Live command completed", meta: "live codex" }
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
const smokeProofBundle = {
  liveControlSmoke: { source: "desktop", executed: true, ok: true },
  activeTurnInterruptSmoke: { source: "desktop", executed: true, ok: true },
  activeTurnSteerSmoke: { source: "desktop", executed: true, ok: true }
} as Phase3SmokeProofBundle;
const commandValidationRecord: Phase3CommandValidationRecord = {
  id: "phase3-command-validation:2026-06-18T08:09:00.000Z",
  createdAt: "2026-06-18T08:09:00.000Z",
  command: "npm.cmd run smoke:phase3",
  status: "passed",
  passedTestCount: 3,
  failedTestCount: 0,
  detail: "Phase 3 CLI smoke validation passed locally."
};
const ownerHandoffRecord: Phase3OwnerHandoffRecord = {
  id: "phase3-owner-handoff:2026-06-18T08:09:30.000Z",
  createdAt: "2026-06-18T08:09:30.000Z",
  state: "ready",
  clearanceReadiness: 100,
  exactBlockerCount: 0,
  canExit: true,
  evidenceFingerprint: handoffFingerprint,
  detail: "Owner-reviewed Phase 3 handoff is recorded."
};

function createStore() {
  const store = new Map<string, string>();
  vi.stubGlobal("window", {
    localStorage: {
      getItem: vi.fn((key: string) => store.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => {
        store.set(key, value);
      }),
      removeItem: vi.fn((key: string) => {
        store.delete(key);
      })
    }
  });

  return store;
}

function readyArtifact(overrides: Parameters<typeof buildPhase3ProofExportArtifact>[0] = {}) {
  return buildPhase3ProofExportArtifact({
    currentPanelId,
    evaluatedAt,
    exportedAt,
    handoffEvidenceFingerprint: handoffFingerprint,
    slashEvidenceByPanel: { [currentPanelId]: slashEvidence },
    sessionControlEvidenceByPanel: { [currentPanelId]: sessionControlEvidence },
    smokeProofBundle,
    persistedDesktopProofs: {
      liveControlSmoke: true,
      activeTurnInterruptSmoke: true,
      activeTurnSteerSmoke: true
    },
    commandValidationRecord,
    ownerHandoffRecord,
    ...overrides
  });
}

describe("phase 3 proof export", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("verifies a fresh complete Phase 3 proof export without live actions", () => {
    const artifact = readyArtifact();
    const verification = verifyPhase3ProofExportArtifact(artifact, { verifiedAt });

    expect(verification).toMatchObject({
      state: "ready",
      readiness: 100,
      canVerifyOffline: true,
      pmTaskId: PHASE3_PROOF_EXPORT_PM_TASK_ID,
      evidenceKey: PHASE3_PROOF_EXPORT_EVIDENCE_KEY,
      readyPanelEvidenceCount: 2,
      storageAttestedDesktopProofCount: 3,
      hasCommandValidationRecord: true,
      hasOwnerHandoffRecord: true
    });
    expect(verification.detail).toContain("handoff fingerprint phase3-handoff-current");
    expect(serializePhase3ProofExportArtifact(artifact)).toContain(currentPanelId);
  });

  it("keeps missing localStorage-derived evidence in review", () => {
    const verification = verifyPhase3ProofExportArtifact(
      readyArtifact({
        slashEvidenceByPanel: {},
        sessionControlEvidenceByPanel: {}
      }),
      { verifiedAt }
    );

    expect(verification.state).toBe("review");
    expect(verification.detail).toContain("ready slash and session-control proof");
    expect(verification.readyPanelEvidenceCount).toBe(0);
  });

  it("keeps wrong-panel slash and session proof out of ready verification", () => {
    const verification = verifyPhase3ProofExportArtifact(
      readyArtifact({
        currentPanelId: "panel-current",
        slashEvidenceByPanel: { "panel-other": slashEvidence },
        sessionControlEvidenceByPanel: { "panel-other": sessionControlEvidence }
      }),
      { verifiedAt }
    );

    expect(verification.state).toBe("review");
    expect(verification.readyPanelEvidenceCount).toBe(0);
  });

  it("carries storage proof review reasons into offline proof export verification", () => {
    const verification = verifyPhase3ProofExportArtifact(
      readyArtifact({
        persistedDesktopProofs: {
          liveControlSmoke: false,
          activeTurnInterruptSmoke: true,
          activeTurnSteerSmoke: true
        },
        storageReviewReasons: {
          liveControlSmoke:
            "Storage proof was created before the desktop proof row it attests; reload the recorded desktop smoke proof bundle."
        }
      }),
      { verifiedAt }
    );

    expect(verification.state).toBe("review");
    expect(verification.storageAttestedDesktopProofCount).toBe(2);
    expect(verification.detail).toContain("Storage proof review");
    expect(verification.detail).toContain("created before the desktop proof row it attests");
    expect(verification.nextAction).toContain("Resolve the storage proof review reasons");
  });

  it("blocks failed CLI smoke validation records during proof export verification", () => {
    const verification = verifyPhase3ProofExportArtifact(
      readyArtifact({
        commandValidationRecord: {
          ...commandValidationRecord,
          status: "failed",
          passedTestCount: 1,
          failedTestCount: 1,
          detail: "Phase 3 CLI smoke validation failed locally."
        }
      }),
      { verifiedAt }
    );

    expect(verification.state).toBe("blocked");
    expect(verification.detail).toContain("CLI smoke validation is not ready");
    expect(verification.detail).toContain("failed locally");
    expect(verification.nextAction).toContain("Rerun npm.cmd run smoke:phase3");
  });

  it("reviews stale CLI smoke validation records during proof export verification", () => {
    const verification = verifyPhase3ProofExportArtifact(
      readyArtifact({
        commandValidationRecord: {
          ...commandValidationRecord,
          createdAt: "2026-06-15T08:09:00.000Z"
        }
      }),
      { verifiedAt }
    );

    expect(verification.state).toBe("review");
    expect(verification.detail).toContain("CLI smoke validation is not ready");
    expect(verification.detail).toContain("stale");
    expect(verification.nextAction).toContain("record a fresh local CLI pass");
  });

  it("reviews wrong-command CLI smoke validation records during proof export verification", () => {
    const verification = verifyPhase3ProofExportArtifact(
      readyArtifact({
        commandValidationRecord: {
          ...commandValidationRecord,
          command: "npm.cmd run smoke:phase1-2"
        }
      }),
      { verifiedAt }
    );

    expect(verification.state).toBe("review");
    expect(verification.detail).toContain("different command");
    expect(verification.nextAction).toContain("current command plan");
  });

  it("keeps stale owner handoff records in review", () => {
    const verification = verifyPhase3ProofExportArtifact(
      readyArtifact({
        ownerHandoffRecord: {
          ...ownerHandoffRecord,
          createdAt: "2026-06-15T08:09:30.000Z"
        }
      }),
      { verifiedAt }
    );

    expect(verification.state).toBe("review");
    expect(verification.detail).toContain("handoff record");
    expect(verification.detail).toContain("stale");
  });

  it("keeps stale proof export artifacts in review", () => {
    const verification = verifyPhase3ProofExportArtifact(
      readyArtifact({
        evaluatedAt: "2026-06-15T08:10:00.000Z"
      }),
      { verifiedAt }
    );

    expect(verification.state).toBe("review");
    expect(verification.detail).toContain("stale or future-dated");
    expect(verification.nextAction).toContain("current focused panel");
  });

  it("keeps proof exports from a different focused panel in review", () => {
    const verification = verifyPhase3ProofExportArtifact(
      readyArtifact({
        currentPanelId: "panel-other-phase3"
      }),
      {
        verifiedAt,
        expectedCurrentPanelId: currentPanelId
      }
    );

    expect(verification.state).toBe("review");
    expect(verification.detail).toContain("different focused panel");
    expect(verification.nextAction).toContain("current focused Arena panel");
  });

  it("requires the current expected owner handoff fingerprint", () => {
    const verification = verifyPhase3ProofExportArtifact(
      readyArtifact({
        handoffEvidenceFingerprint: undefined
      }),
      { verifiedAt }
    );

    expect(verification.state).toBe("review");
    expect(verification.detail).toContain("current expected owner handoff fingerprint");
    expect(verification.nextAction).toContain("current exit-ready handoff fingerprint");
  });

  it("identifies proof export preflight that can record the owner handoff", () => {
    const verification = verifyPhase3ProofExportArtifact(
      readyArtifact({
        ownerHandoffRecord: undefined
      }),
      { verifiedAt }
    );
    const stale = verifyPhase3ProofExportArtifact(
      readyArtifact({
        evaluatedAt: "2026-06-15T08:10:00.000Z",
        ownerHandoffRecord: undefined
      }),
      { verifiedAt }
    );

    expect(verification.state).toBe("review");
    expect(verification.detail).toContain("missing the owner handoff record");
    expect(canRecordPhase3OwnerHandoffFromProofExportPreflight(verification)).toBe(true);
    expect(canRecordPhase3OwnerHandoffFromProofExportPreflight(stale)).toBe(false);
  });

  it("respects explicit current-state absence instead of pulling stored command validation", () => {
    createStore();
    savePhase3CommandValidationRecord(commandValidationRecord);

    const artifact = readyArtifact({
      commandValidationRecord: undefined
    });
    const verification = verifyPhase3ProofExportArtifact(artifact, { verifiedAt });

    expect(artifact.commandValidationRecord).toBeUndefined();
    expect(verification.state).toBe("review");
    expect(verification.hasCommandValidationRecord).toBe(false);
    expect(verification.detail).toContain("missing the CLI smoke validation record");
  });

  it("loads stored command validation only when the build input omits the field", () => {
    createStore();
    savePhase3CommandValidationRecord(commandValidationRecord);

    const artifact = buildPhase3ProofExportArtifact({
      currentPanelId,
      evaluatedAt,
      exportedAt,
      handoffEvidenceFingerprint: handoffFingerprint,
      slashEvidenceByPanel: { [currentPanelId]: slashEvidence },
      sessionControlEvidenceByPanel: { [currentPanelId]: sessionControlEvidence },
      smokeProofBundle,
      persistedDesktopProofs: {
        liveControlSmoke: true,
        activeTurnInterruptSmoke: true,
        activeTurnSteerSmoke: true
      },
      ownerHandoffRecord
    });

    expect(artifact.commandValidationRecord).toEqual(commandValidationRecord);
  });

  it("respects explicit current-state absence instead of pulling a stored owner handoff", () => {
    createStore();
    savePhase3OwnerHandoffRecord(ownerHandoffRecord);

    const artifact = readyArtifact({
      ownerHandoffRecord: undefined
    });
    const verification = verifyPhase3ProofExportArtifact(artifact, { verifiedAt });

    expect(artifact.ownerHandoffRecord).toBeUndefined();
    expect(verification.state).toBe("review");
    expect(verification.hasOwnerHandoffRecord).toBe(false);
    expect(verification.detail).toContain("missing the owner handoff record");
    expect(canRecordPhase3OwnerHandoffFromProofExportPreflight(verification)).toBe(true);
  });

  it("respects explicit current smoke state instead of pulling stored desktop proof readiness", () => {
    createStore();
    savePhase3SmokeProofBundle(smokeProofBundle);

    const artifact = readyArtifact({
      persistedDesktopProofs: undefined
    });
    const verification = verifyPhase3ProofExportArtifact(artifact, { verifiedAt });

    expect(artifact.smokeProofBundle).toEqual(smokeProofBundle);
    expect(artifact.persistedDesktopProofs).toEqual({
      liveControlSmoke: false,
      activeTurnInterruptSmoke: false,
      activeTurnSteerSmoke: false
    });
    expect(verification.state).toBe("review");
    expect(verification.storageAttestedDesktopProofCount).toBe(0);
    expect(verification.detail).toContain("does not include all storage-attested desktop proof rows");
  });

  it("keeps self-consistent but non-current handoff fingerprints in review", () => {
    const oldFingerprint = "phase3-handoff-old";
    const verification = verifyPhase3ProofExportArtifact(
      readyArtifact({
        handoffEvidenceFingerprint: oldFingerprint,
        ownerHandoffRecord: {
          ...ownerHandoffRecord,
          evidenceFingerprint: oldFingerprint
        }
      }),
      {
        verifiedAt,
        expectedHandoffEvidenceFingerprint: handoffFingerprint
      }
    );

    expect(verification.state).toBe("review");
    expect(verification.detail).toContain("current owner-visible handoff fingerprint");
    expect(verification.nextAction).toContain("re-export the proof package");
  });

  it("reviews proof export artifacts with stale owner handoff fingerprints", () => {
    const verification = verifyPhase3ProofExportArtifact(
      readyArtifact({
        ownerHandoffRecord: {
          ...ownerHandoffRecord,
          evidenceFingerprint: "phase3-handoff-old"
        }
      }),
      { verifiedAt }
    );

    expect(verification.state).toBe("review");
    expect(verification.detail).toContain("handoff fingerprint does not match");
    expect(verification.nextAction).toContain("current exit-ready evidence");
  });

  it.each([
    ["state", { state: "review" as const }],
    ["canExit", { canExit: false }],
    ["exactBlockerCount", { exactBlockerCount: 1 }],
    ["clearanceReadiness", { clearanceReadiness: 90 }]
  ])(
    "keeps fresh handoff records in review when %s is not exit-ready",
    (_field, ownerHandoffRecordOverride) => {
      const verification = verifyPhase3ProofExportArtifact(
        readyArtifact({
          ownerHandoffRecord: {
            ...ownerHandoffRecord,
            ...ownerHandoffRecordOverride
          }
        }),
        { verifiedAt }
      );

      expect(verification.state).toBe("review");
      expect(verification.detail).toContain("not an exit-ready clearance snapshot");
      expect(verification.nextAction).toContain("100% ready clearance snapshot");
    }
  );

  it("keeps fresh handoff records in review until the full clearance snapshot is exit-ready", () => {
    const verification = verifyPhase3ProofExportArtifact(
      readyArtifact({
        ownerHandoffRecord: {
          ...ownerHandoffRecord,
          state: "review",
          clearanceReadiness: 90,
          exactBlockerCount: 1,
          canExit: false
        }
      }),
      { verifiedAt }
    );

    expect(verification.state).toBe("review");
    expect(verification.detail).toContain("not an exit-ready clearance snapshot");
    expect(verification.nextAction).toContain("100% ready clearance snapshot");
  });

  it("keeps malformed proof export artifacts out of ready verification", () => {
    const parsed = parsePhase3ProofExportArtifact("{");
    const verification = verifyPhase3ProofExportArtifact(parsed, { verifiedAt });

    expect(parsed).toBeUndefined();
    expect(verification.state).toBe("waiting");
    expect(verification.canVerifyOffline).toBe(false);
  });

  it("verifies serialized proof export artifacts without persisting proof state", () => {
    const verification = verifySerializedPhase3ProofExportArtifact(
      serializePhase3ProofExportArtifact(readyArtifact()),
      { verifiedAt }
    );
    const malformed = verifySerializedPhase3ProofExportArtifact("{", { verifiedAt });

    expect(verification.state).toBe("ready");
    expect(verification.canVerifyOffline).toBe(true);
    expect(malformed.state).toBe("waiting");
  });

  it("prepares downloadable proof export JSON only after offline verification is ready", () => {
    const readyDownload = preparePhase3ProofExportDownload(readyArtifact(), { verifiedAt });
    const heldDownload = preparePhase3ProofExportDownload(
      readyArtifact({
        ownerHandoffRecord: undefined,
        handoffEvidenceFingerprint: undefined
      }),
      { verifiedAt }
    );

    expect(readyDownload.verification.canVerifyOffline).toBe(true);
    expect(readyDownload.serializedArtifact).toContain(currentPanelId);
    expect(heldDownload.verification).toMatchObject({
      state: "review",
      canVerifyOffline: false
    });
    expect(heldDownload.serializedArtifact).toBeUndefined();
  });

  it("does not prepare downloadable proof export JSON for a stale current context", () => {
    const download = preparePhase3ProofExportDownload(readyArtifact(), {
      verifiedAt,
      expectedCurrentPanelId: currentPanelId,
      expectedHandoffEvidenceFingerprint: "phase3-handoff-new-owner-context"
    });

    expect(download.verification).toMatchObject({
      state: "review",
      canVerifyOffline: false
    });
    expect(download.verification.detail).toContain("current owner-visible handoff fingerprint");
    expect(download.serializedArtifact).toBeUndefined();
  });
});
