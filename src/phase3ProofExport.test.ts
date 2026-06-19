import { describe, expect, it } from "vitest";
import type { Phase3CommandValidationRecord } from "./phase3CommandValidationRecord";
import type { Phase3OwnerHandoffRecord } from "./phase3HandoffRecord";
import {
  buildPhase3ProofExportArtifact,
  parsePhase3ProofExportArtifact,
  serializePhase3ProofExportArtifact,
  verifyPhase3ProofExportArtifact,
  verifySerializedPhase3ProofExportArtifact
} from "./phase3ProofExport";
import type { Phase3SmokeProofBundle } from "./phase3SmokeProofStorage";
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
  it("verifies a fresh complete Phase 3 proof export without live actions", () => {
    const artifact = readyArtifact();
    const verification = verifyPhase3ProofExportArtifact(artifact, { verifiedAt });

    expect(verification).toMatchObject({
      state: "ready",
      readiness: 100,
      canVerifyOffline: true,
      readyPanelEvidenceCount: 2,
      storageAttestedDesktopProofCount: 3,
      hasCommandValidationRecord: true,
      hasOwnerHandoffRecord: true
    });
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
});
