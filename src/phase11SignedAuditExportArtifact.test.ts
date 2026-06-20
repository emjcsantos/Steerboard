import { describe, expect, it } from "vitest";
import { buildPhase11EvidenceRecords } from "./phase11EvidenceRecords";
import {
  buildPhase11SignedAuditExportArtifact,
  parsePhase11SignedAuditExportArtifact,
  serializePhase11SignedAuditExportArtifact,
  verifyPhase11SignedAuditExportArtifact,
  verifySerializedPhase11SignedAuditExportArtifact,
  type Phase11SignedAuditExportArtifact
} from "./phase11SignedAuditExportArtifact";
import type { Phase11ReleaseReadinessSnapshot } from "./phase11ReleaseReadiness";
import type { ReleasePrivacyReadinessSnapshot } from "./releasePrivacyReadiness";
import type { SecurityFinalReviewSnapshot } from "./securityFinalReview";

const now = "2026-06-20T10:00:00.000Z";

const releaseReadiness: Phase11ReleaseReadinessSnapshot = {
  id: "phase-11-release-readiness",
  label: "Phase 11 Release readiness gate",
  state: "review",
  statusLabel: "Review",
  readiness: 90,
  canRecommendRelease: false,
  releaseHoldCount: 1,
  readyCount: 9,
  reviewCount: 1,
  blockedCount: 0,
  waitingCount: 0,
  ownerReadiness: 100,
  securityReadiness: 100,
  packagingReadiness: 100,
  nextAction: "Keep packaging paused.",
  safety: "Evidence-only.",
  ariaLabel: "Phase 11 release readiness review.",
  items: [
    {
      id: "phase-11-release-readiness:signed-audit-export",
      label: "Signed audit export",
      kind: "signed-audit-export",
      status: "ready",
      detail: "Signed audit export and rollback reference evidence is ready.",
      nextAction: "Keep signed audit export metadata attached."
    }
  ]
};

const releasePrivacy: ReleasePrivacyReadinessSnapshot = {
  id: "release-privacy-readiness",
  label: "Release privacy readiness",
  state: "ready",
  statusLabel: "Ready",
  readiness: 100,
  canRecommendRelease: true,
  detail: "All release privacy checks are ready for release recommendation.",
  safety: "No filesystem action, process action, release action, or network call is performed.",
  ariaLabel: "Release privacy ready.",
  items: []
};

const securityFinalReview: SecurityFinalReviewSnapshot = {
  id: "security-final-review",
  label: "Security final review",
  state: "ready",
  statusLabel: "Ready",
  readiness: 100,
  canCloseSecurity: true,
  canResumePackaging: false,
  detail: "All security and packaging pre-close checks are ready.",
  safety: "No filesystem action, process action, network action, release action, or packaging action is performed.",
  ariaLabel: "Security final review ready.",
  items: []
};

function readyEvidenceRecords() {
  return buildPhase11EvidenceRecords(
    {
      "signed-audit-export": {
        gate: "signed-audit-export",
        state: "ready",
        source: "owner local evidence record",
        recordedAt: now,
        detail:
          "Owner attached signed audit export, signature verification, rollback references, no-mutation export scope, and release privacy readiness evidence metadata."
      }
    },
    now
  );
}

function artifact(overrides: Partial<Phase11SignedAuditExportArtifact> = {}) {
  return {
    ...buildPhase11SignedAuditExportArtifact({
      exportedAt: now,
      evaluatedAt: now,
      evidenceRecords: readyEvidenceRecords(),
      releaseReadiness,
      releasePrivacy,
      securityFinalReview,
      packagingPaused: true
    }),
    ...overrides
  };
}

describe("phase 11 signed audit export artifact", () => {
  it("exports and verifies a locally signed audit artifact", () => {
    const exported = artifact();

    expect(verifyPhase11SignedAuditExportArtifact(exported)).toMatchObject({
      state: "ready",
      readiness: 100,
      rollbackReferenceCount: 3,
      noMutationScopeCount: 6,
      releasePrivacyState: "ready",
      securityFinalReviewState: "ready",
      signedAuditEvidenceState: "ready"
    });
    expect(exported.signature).toMatch(/^phase11-signed-audit:[a-f0-9]{8}$/);
  });

  it("round-trips serialized artifacts and rejects malformed payloads", () => {
    const exported = artifact();
    const serialized = serializePhase11SignedAuditExportArtifact(exported);

    expect(parsePhase11SignedAuditExportArtifact(serialized)).toEqual(exported);
    expect(verifySerializedPhase11SignedAuditExportArtifact(serialized).state).toBe("ready");
    expect(parsePhase11SignedAuditExportArtifact("{")).toBeUndefined();
    expect(verifySerializedPhase11SignedAuditExportArtifact("{}")).toMatchObject({
      state: "waiting",
      detail: expect.stringContaining("missing or malformed")
    });
  });

  it("blocks tampered payloads when the local signature no longer matches", () => {
    const exported = artifact();

    expect(
      verifyPhase11SignedAuditExportArtifact({
        ...exported,
        payload: {
          ...exported.payload,
          rollbackReferences: ["tampered rollback reference"]
        }
      })
    ).toMatchObject({
      state: "blocked",
      detail: expect.stringContaining("signature does not match")
    });
  });

  it("reviews valid artifacts when signed-audit metadata is not ready", () => {
    const heldEvidenceRecords = buildPhase11EvidenceRecords({}, now);
    const exported = buildPhase11SignedAuditExportArtifact({
      exportedAt: now,
      evaluatedAt: now,
      evidenceRecords: heldEvidenceRecords,
      releaseReadiness,
      releasePrivacy,
      securityFinalReview,
      packagingPaused: true
    });

    expect(verifyPhase11SignedAuditExportArtifact(exported)).toMatchObject({
      state: "review",
      detail: expect.stringContaining("signed-audit evidence is not fresh and ready")
    });
  });

  it("blocks artifacts exported without packaging pause evidence", () => {
    expect(
      verifyPhase11SignedAuditExportArtifact(
        buildPhase11SignedAuditExportArtifact({
          exportedAt: now,
          evaluatedAt: now,
          evidenceRecords: readyEvidenceRecords(),
          releaseReadiness,
          releasePrivacy,
          securityFinalReview,
          packagingPaused: false
        })
      )
    ).toMatchObject({
      state: "blocked",
      detail: expect.stringContaining("packaging pause evidence was not active")
    });
  });
});
