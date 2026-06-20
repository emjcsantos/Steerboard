import { describe, expect, it } from "vitest";
import { buildCatalogRefreshOwnerValidation } from "./catalogRefreshOwnerValidation";
import {
  buildCatalogRefreshProviderSmoke,
  CATALOG_REFRESH_PROVIDER_SMOKE_NOT_RUN_PREVIEW
} from "./catalogRefreshProviderSmoke";
import { buildPhase4ProviderBlockerPriority } from "./phase4ProviderBlockerPriority";
import { buildPhase4ProviderCatalogDepth } from "./phase4ProviderCatalogDepth";
import {
  createPhase4ProviderApprovalRecord,
  derivePhase4ProviderApprovalRecordValidation,
  type Phase4ProviderApprovalRecord
} from "./phase4ProviderApprovalRecord";
import {
  buildPhase4ProviderAuditEvidenceFingerprint,
  createPhase4ProviderAuditRecord,
  derivePhase4ProviderAuditRecordValidation,
  type Phase4ProviderAuditRecord
} from "./phase4ProviderAuditRecord";
import {
  createPhase4ProviderPermissionRecord,
  derivePhase4ProviderPermissionRecordValidation,
  EXPECTED_PHASE4_PROVIDER_PERMISSION_SURFACES,
  buildPhase4ProviderPermissionEvidenceFingerprint
} from "./phase4ProviderPermissionRecord";
import {
  buildPhase4ProviderRollbackEvidenceFingerprint,
  createPhase4ProviderRollbackRecord,
  derivePhase4ProviderRollbackRecordValidation,
  type Phase4ProviderRollbackRecord
} from "./phase4ProviderRollbackRecord";
import {
  buildPhase4ProviderReviewArtifact,
  parsePhase4ProviderReviewArtifact,
  serializePhase4ProviderReviewArtifact,
  verifyRecordedPhase4ProviderReviewArtifact,
  verifyPhase4ProviderReviewArtifact,
  verifySerializedPhase4ProviderReviewArtifact,
  type Phase4ProviderReviewArtifact
} from "./phase4ProviderReviewArtifact";
import { buildPhase4ProviderSurfaceDepth } from "./phase4ProviderSurfaceDepth";
import { buildPhase4ProviderTraceabilitySummary } from "./phase4ProviderTraceability";
import { buildPhase4RefreshSafetyDepth } from "./phase4RefreshSafetyDepth";
import { buildProviderIntegrationReadiness } from "./providerIntegrationReadiness";

const liveCatalogPayload = {
  commandCatalogSnapshot: {
    source: "provider-live",
    entries: [{ command: "/alpha", label: "Alpha", detail: "Alpha.", state: "live", scopes: ["panel"] }]
  },
  skillCatalogSnapshot: {
    source: "provider-live",
    entries: [{ id: "alpha-skill", label: "Alpha Skill", source: "builtin", trigger: "slash", invocationLabel: "Alpha", state: "live" }]
  },
  pluginCatalogSnapshot: {
    source: "provider-live",
    entries: [{ id: "alpha-plugin", label: "Alpha Plugin", detail: "Alpha.", state: "live" }]
  },
  mcpCatalogSnapshot: {
    source: "provider-live",
    entries: [{ id: "alpha-mcp", label: "Alpha MCP", transport: "stdio", state: "live", toolPolicy: "read-only" }]
  },
  automationCatalogSnapshot: {
    source: "provider-live",
    entries: [{ id: "alpha-automation", label: "Alpha Automation", lifecycle: "active", trigger: "manual", approvalPosture: "manual", state: "live" }]
  },
  personalizationCatalogSnapshot: {
    source: "provider-live",
    entries: [{ id: "alpha-personalization", label: "Alpha Personalization", layer: "ui", source: "builtin", privacyPosture: "device-only", state: "live" }]
  }
} as const;

function liveCatalogRefreshSmoke() {
  return buildCatalogRefreshProviderSmoke(liveCatalogPayload, {
    checkedAt: "2026-06-18T10:00:00.000Z"
  });
}

function reviewArtifact({
  evaluatedAt = "2026-06-18T10:00:00.000Z",
  refreshSmoke = CATALOG_REFRESH_PROVIDER_SMOKE_NOT_RUN_PREVIEW
}: {
  evaluatedAt?: string;
  refreshSmoke?: ReturnType<typeof buildCatalogRefreshProviderSmoke>;
} = {}): Phase4ProviderReviewArtifact {
  const currentCatalogFingerprint =
    refreshSmoke.catalogFingerprint ?? "phase4-catalog-current";
  const readiness = buildProviderIntegrationReadiness(buildCatalogRefreshOwnerValidation());
  const catalogDepth = buildPhase4ProviderCatalogDepth(readiness);
  const refreshSafety = buildPhase4RefreshSafetyDepth(refreshSmoke, {
    evaluatedAt,
    expectedCatalogFingerprint: currentCatalogFingerprint
  });
  const surfaceDepth = buildPhase4ProviderSurfaceDepth(readiness);
  const traceability = buildPhase4ProviderTraceabilitySummary({
    catalogDepth,
    refreshSafety,
    surfaceDepth
  });
  const blockerPriority = buildPhase4ProviderBlockerPriority({
    catalogDepth,
    refreshSafety,
    surfaceDepth,
    traceability
  });

  return buildPhase4ProviderReviewArtifact({
    exportedAt: evaluatedAt,
    evaluatedAt,
    currentCatalogFingerprint,
    catalogDepth,
    refreshSafety,
    surfaceDepth,
    traceability,
    blockerPriority
  });
}

function noOpenBlockers(artifact: Phase4ProviderReviewArtifact): Phase4ProviderReviewArtifact {
  return {
    ...artifact,
    traceability: { ...artifact.traceability, canTrustProviderReview: true },
    blockerPriority: {
      ...artifact.blockerPriority,
      openBlockerCount: 0,
      topPriorityAction: "No Phase 4 provider blockers remain.",
      topPriorityLabel: "No open Phase 4 provider blocker",
      topPrioritySourceId: "phase4.provider-blocker.none",
      topPriorityKind: "none",
      topPriorityStatus: "ready",
      topPriorityEvidenceKey: "phase-04-provider-blocker:none"
    }
  };
}

function withReadyLocalRecords(
  artifact: Phase4ProviderReviewArtifact
): Phase4ProviderReviewArtifact {
  const createdAt = artifact.evaluatedAt;
  const approvalRecord: Phase4ProviderApprovalRecord =
    createPhase4ProviderApprovalRecord({
      catalogFingerprint: artifact.currentCatalogFingerprint,
      createdAt
    });
  const approvalValidation = derivePhase4ProviderApprovalRecordValidation({
    record: approvalRecord,
    expectedCatalogFingerprint: artifact.currentCatalogFingerprint,
    refreshSafety: artifact.refreshSafety,
    options: { evaluatedAt: createdAt }
  });
  const auditEvidenceFingerprint = buildPhase4ProviderAuditEvidenceFingerprint(
    artifact.surfaceDepth
  );
  const auditRecord: Phase4ProviderAuditRecord = createPhase4ProviderAuditRecord({
    approvalRecord,
    auditEvidenceFingerprint,
    catalogFingerprint: artifact.currentCatalogFingerprint,
    createdAt
  });
  const auditValidation = derivePhase4ProviderAuditRecordValidation({
    record: auditRecord,
    approvalRecord,
    approvalValidation,
    expectedAuditEvidenceFingerprint: auditEvidenceFingerprint,
    expectedCatalogFingerprint: artifact.currentCatalogFingerprint,
    options: { evaluatedAt: createdAt }
  });
  const rollbackEvidenceFingerprint = buildPhase4ProviderRollbackEvidenceFingerprint(
    artifact.surfaceDepth
  );
  const rollbackRecord: Phase4ProviderRollbackRecord =
    createPhase4ProviderRollbackRecord({
      approvalRecord,
      auditRecord,
      catalogFingerprint: artifact.currentCatalogFingerprint,
      createdAt,
      surfaceDepthEvidenceFingerprint: rollbackEvidenceFingerprint
    });
  const rollbackValidation = derivePhase4ProviderRollbackRecordValidation({
    record: rollbackRecord,
    approvalRecord,
    auditRecord,
    auditValidation,
    expectedCatalogFingerprint: artifact.currentCatalogFingerprint,
    expectedSurfaceDepthEvidenceFingerprint: rollbackEvidenceFingerprint,
    options: { evaluatedAt: createdAt }
  });
  const permissionEvidenceFingerprint =
    buildPhase4ProviderPermissionEvidenceFingerprint(artifact.surfaceDepth);
  const permissionRecord = createPhase4ProviderPermissionRecord({
    approvalRecord,
    auditRecord,
    rollbackRecord,
    catalogFingerprint: artifact.currentCatalogFingerprint,
    createdAt,
    surfaceDepthEvidenceFingerprint: rollbackEvidenceFingerprint,
    permissionEvidenceFingerprint,
    providerSurfaceScopes: EXPECTED_PHASE4_PROVIDER_PERMISSION_SURFACES
  });
  const permissionValidation = derivePhase4ProviderPermissionRecordValidation({
    record: permissionRecord,
    approvalRecord,
    auditRecord,
    rollbackRecord,
    rollbackValidation,
    expectedCatalogFingerprint: artifact.currentCatalogFingerprint,
    expectedSurfaceDepthEvidenceFingerprint: rollbackEvidenceFingerprint,
    expectedPermissionEvidenceFingerprint: permissionEvidenceFingerprint,
    options: { evaluatedAt: createdAt }
  });

  return {
    ...noOpenBlockers(artifact),
    approvalRecord,
    approvalValidation,
    auditRecord,
    auditValidation,
    rollbackRecord,
    rollbackValidation,
    permissionRecord,
    permissionValidation
  };
}

describe("phase 4 provider review artifact", () => {
  it("exports and verifies current provider review evidence without marking open blockers ready", () => {
    const artifact = reviewArtifact();
    const verification = verifyPhase4ProviderReviewArtifact(artifact, {
      verifiedAt: "2026-06-18T10:05:00.000Z"
    });

    expect(verification).toMatchObject({
      state: "review",
      catalogDepthRecordCount: 6,
      refreshSafetyRecordCount: 8,
      surfaceDepthItemCount: 9,
      traceabilityItemCount: 7,
      executionLocked: true,
      hasApprovalRecord: false,
      hasAuditRecord: false,
      hasRollbackRecord: false,
      hasPermissionRecord: false
    });
    expect(verification.openBlockerCount).toBeGreaterThan(0);
    expect(verification.detail).toContain("open blocker");
    expect(verification.nextAction).toBe(artifact.blockerPriority.topPriorityAction);
  });

  it("round-trips serialized artifacts and rejects malformed payloads", () => {
    const artifact = reviewArtifact({
      refreshSmoke: liveCatalogRefreshSmoke()
    });
    const serialized = serializePhase4ProviderReviewArtifact(artifact);

    expect(parsePhase4ProviderReviewArtifact(serialized)).toEqual(artifact);
    expect(
      verifySerializedPhase4ProviderReviewArtifact(serialized, {
        verifiedAt: "2026-06-18T10:05:00.000Z"
      }).state
    ).toBe("review");
    expect(parsePhase4ProviderReviewArtifact("{")).toBeUndefined();
    expect(
      verifySerializedPhase4ProviderReviewArtifact("{}", {
        verifiedAt: "2026-06-18T10:05:00.000Z"
      })
    ).toMatchObject({
      state: "waiting",
      detail: expect.stringContaining("missing or malformed")
    });
  });

  it("blocks artifacts that claim provider execution is enabled", () => {
    const artifact = {
      ...reviewArtifact(),
      surfaceDepth: {
        ...reviewArtifact().surfaceDepth,
        canEnableExecution: true
      }
    };

    expect(
      verifyPhase4ProviderReviewArtifact(artifact, {
        verifiedAt: "2026-06-18T10:05:00.000Z"
      })
    ).toMatchObject({
      state: "blocked",
      detail: expect.stringContaining("provider execution is enabled")
    });
  });

  it("reviews stale artifacts and artifacts missing catalog fingerprint or execution locks", () => {
    const artifact = reviewArtifact();

    expect(
      verifyPhase4ProviderReviewArtifact(artifact, {
        verifiedAt: "2026-06-19T10:00:01.000Z",
        maxArtifactAgeMs: 24 * 60 * 60 * 1000
      })
    ).toMatchObject({ state: "review", detail: expect.stringContaining("stale") });
    expect(
      verifyPhase4ProviderReviewArtifact(
        { ...artifact, currentCatalogFingerprint: "" },
        { verifiedAt: "2026-06-18T10:05:00.000Z" }
      )
    ).toMatchObject({ state: "review", detail: expect.stringContaining("fingerprint") });
    expect(
      verifyPhase4ProviderReviewArtifact(artifact, {
        verifiedAt: "2026-06-18T10:05:00.000Z",
        expectedCatalogFingerprint: "phase4-catalog-new"
      })
    ).toMatchObject({
      state: "review",
      detail: expect.stringContaining("does not match"),
      currentCatalogFingerprint: "phase4-catalog-current",
      expectedCatalogFingerprint: "phase4-catalog-new",
      matchesExpectedCatalog: false
    });
    expect(
      verifyPhase4ProviderReviewArtifact(
        {
          ...artifact,
          traceability: { ...artifact.traceability, executionLockCount: 5 }
        },
        { verifiedAt: "2026-06-18T10:05:00.000Z" }
      )
    ).toMatchObject({ state: "review", detail: expect.stringContaining("six provider execution locks") });
  });

  it("can verify offline as ready only when blockers are clear and traceability is trusted", () => {
    const artifact = reviewArtifact({
      refreshSmoke: liveCatalogRefreshSmoke()
    });
    const readyArtifact: Phase4ProviderReviewArtifact = {
      ...artifact,
      traceability: { ...artifact.traceability, canTrustProviderReview: true },
      blockerPriority: {
        ...artifact.blockerPriority,
        openBlockerCount: 0,
        topPriorityAction: "No Phase 4 provider blockers remain.",
        topPriorityLabel: "No open Phase 4 provider blocker",
        topPrioritySourceId: "phase4.provider-blocker.none",
        topPriorityKind: "none",
        topPriorityStatus: "ready",
        topPriorityEvidenceKey: "phase-04-provider-blocker:none"
      }
    };

    expect(
      verifyPhase4ProviderReviewArtifact(readyArtifact, {
        verifiedAt: "2026-06-18T10:05:00.000Z",
        expectedCatalogFingerprint: readyArtifact.currentCatalogFingerprint
      })
    ).toMatchObject({
      state: "ready",
      readiness: 100,
      canVerifyOffline: true,
      executionLocked: true,
      currentCatalogFingerprint: readyArtifact.currentCatalogFingerprint,
      expectedCatalogFingerprint: readyArtifact.currentCatalogFingerprint,
      matchesExpectedCatalog: true
    });
  });

  it("verifies recorded artifacts against their own catalog fingerprint for offline load", () => {
    const artifact = reviewArtifact({
      refreshSmoke: liveCatalogRefreshSmoke()
    });
    const readyArtifact = withReadyLocalRecords(artifact);
    const verification = verifyRecordedPhase4ProviderReviewArtifact(
      serializePhase4ProviderReviewArtifact(readyArtifact),
      { verifiedAt: "2026-06-18T10:05:00.000Z" }
    );

    expect(verification).toMatchObject({
      state: "ready",
      expectedCatalogFingerprint: readyArtifact.currentCatalogFingerprint,
      currentCatalogFingerprint: readyArtifact.currentCatalogFingerprint,
      matchesExpectedCatalog: true,
      hasApprovalRecord: true,
      hasAuditRecord: true,
      hasRollbackRecord: true,
      hasPermissionRecord: true
    });
  });

  it("reviews recorded artifacts missing required local record evidence", () => {
    const artifact = reviewArtifact({
      refreshSmoke: liveCatalogRefreshSmoke()
    });
    const readyWithoutLocalRecords = noOpenBlockers(artifact);

    expect(
      verifyRecordedPhase4ProviderReviewArtifact(
        serializePhase4ProviderReviewArtifact(readyWithoutLocalRecords),
        { verifiedAt: "2026-06-18T10:05:00.000Z" }
      )
    ).toMatchObject({
      state: "review",
      detail: expect.stringContaining("missing approval local record evidence"),
      nextAction: expect.stringContaining("approval local record and validation")
    });
  });

  it("keeps malformed recorded artifacts waiting instead of trusting offline load", () => {
    expect(
      verifyRecordedPhase4ProviderReviewArtifact("{}", {
        verifiedAt: "2026-06-18T10:05:00.000Z"
      })
    ).toMatchObject({
      state: "waiting",
      detail: expect.stringContaining("missing or malformed")
    });
  });

  it("reviews artifacts with inconsistent local record validation evidence", () => {
    const artifact = reviewArtifact({
      refreshSmoke: liveCatalogRefreshSmoke()
    });
    const inconsistentArtifact: Phase4ProviderReviewArtifact = {
      ...noOpenBlockers(artifact),
      approvalRecord: {
        id: "phase4-provider-approval-1",
        createdAt: "2026-06-18T10:00:00.000Z",
        state: "ready",
        catalogFingerprint: artifact.currentCatalogFingerprint,
        detail: "Approval record attached."
      },
      approvalValidation: {
        state: "review",
        detail: "Approval record no longer matches the current catalog.",
        nextAction: "Record a current Phase 4 provider approval.",
        expectedCatalogFingerprint: artifact.currentCatalogFingerprint,
        recordCatalogFingerprint: "phase4-catalog-old",
        recordAgeMs: 5 * 60 * 1000,
        maxRecordAgeMs: 24 * 60 * 60 * 1000,
        matchesCurrentCatalog: false
      }
    };

    expect(
      verifyPhase4ProviderReviewArtifact(inconsistentArtifact, {
        verifiedAt: "2026-06-18T10:05:00.000Z",
        expectedCatalogFingerprint: artifact.currentCatalogFingerprint
      })
    ).toMatchObject({
      state: "review",
      detail: expect.stringContaining("approval record that is not ready"),
      nextAction: "Record a current Phase 4 provider approval."
    });
  });
});
