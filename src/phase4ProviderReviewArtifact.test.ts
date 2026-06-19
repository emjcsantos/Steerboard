import { describe, expect, it } from "vitest";
import { buildCatalogRefreshOwnerValidation } from "./catalogRefreshOwnerValidation";
import {
  buildCatalogRefreshProviderSmoke,
  CATALOG_REFRESH_PROVIDER_SMOKE_NOT_RUN_PREVIEW
} from "./catalogRefreshProviderSmoke";
import { buildPhase4ProviderBlockerPriority } from "./phase4ProviderBlockerPriority";
import { buildPhase4ProviderCatalogDepth } from "./phase4ProviderCatalogDepth";
import {
  buildPhase4ProviderReviewArtifact,
  parsePhase4ProviderReviewArtifact,
  serializePhase4ProviderReviewArtifact,
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

function reviewArtifact({
  evaluatedAt = "2026-06-18T10:00:00.000Z",
  refreshSmoke = CATALOG_REFRESH_PROVIDER_SMOKE_NOT_RUN_PREVIEW
}: {
  evaluatedAt?: string;
  refreshSmoke?: ReturnType<typeof buildCatalogRefreshProviderSmoke>;
} = {}): Phase4ProviderReviewArtifact {
  const readiness = buildProviderIntegrationReadiness(buildCatalogRefreshOwnerValidation());
  const catalogDepth = buildPhase4ProviderCatalogDepth(readiness);
  const refreshSafety = buildPhase4RefreshSafetyDepth(refreshSmoke, {
    evaluatedAt,
    expectedCatalogFingerprint: "phase4-catalog-current"
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
    currentCatalogFingerprint: "phase4-catalog-current",
    catalogDepth,
    refreshSafety,
    surfaceDepth,
    traceability,
    blockerPriority
  });
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
      refreshSafetyRecordCount: 7,
      surfaceDepthItemCount: 9,
      traceabilityItemCount: 6,
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
      refreshSmoke: buildCatalogRefreshProviderSmoke(liveCatalogPayload)
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
      refreshSmoke: buildCatalogRefreshProviderSmoke(liveCatalogPayload)
    });
    const readyArtifact: Phase4ProviderReviewArtifact = {
      ...artifact,
      traceability: { ...artifact.traceability, canTrustProviderReview: true },
      blockerPriority: {
        ...artifact.blockerPriority,
        openBlockerCount: 0,
        topPriorityAction: "No Phase 4 provider blockers remain.",
        topPriorityLabel: "No open Phase 4 provider blocker"
      }
    };

    expect(
      verifyPhase4ProviderReviewArtifact(readyArtifact, {
        verifiedAt: "2026-06-18T10:05:00.000Z",
        expectedCatalogFingerprint: "phase4-catalog-current"
      })
    ).toMatchObject({
      state: "ready",
      readiness: 100,
      canVerifyOffline: true,
      executionLocked: true,
      currentCatalogFingerprint: "phase4-catalog-current",
      expectedCatalogFingerprint: "phase4-catalog-current",
      matchesExpectedCatalog: true
    });
  });

  it("reviews artifacts with inconsistent local record validation evidence", () => {
    const artifact = reviewArtifact({
      refreshSmoke: buildCatalogRefreshProviderSmoke(liveCatalogPayload)
    });
    const inconsistentArtifact: Phase4ProviderReviewArtifact = {
      ...artifact,
      traceability: { ...artifact.traceability, canTrustProviderReview: true },
      blockerPriority: {
        ...artifact.blockerPriority,
        openBlockerCount: 0,
        topPriorityAction: "No Phase 4 provider blockers remain.",
        topPriorityLabel: "No open Phase 4 provider blocker"
      },
      approvalRecord: {
        id: "phase4-provider-approval-1",
        createdAt: "2026-06-18T10:00:00.000Z",
        state: "ready",
        catalogFingerprint: "phase4-catalog-current",
        detail: "Approval record attached."
      },
      approvalValidation: {
        state: "review",
        detail: "Approval record no longer matches the current catalog.",
        nextAction: "Record a current Phase 4 provider approval.",
        expectedCatalogFingerprint: "phase4-catalog-current",
        recordCatalogFingerprint: "phase4-catalog-old",
        recordAgeMs: 5 * 60 * 1000,
        maxRecordAgeMs: 24 * 60 * 60 * 1000,
        matchesCurrentCatalog: false
      }
    };

    expect(
      verifyPhase4ProviderReviewArtifact(inconsistentArtifact, {
        verifiedAt: "2026-06-18T10:05:00.000Z",
        expectedCatalogFingerprint: "phase4-catalog-current"
      })
    ).toMatchObject({
      state: "review",
      detail: expect.stringContaining("approval record that is not ready"),
      nextAction: "Record a current Phase 4 provider approval."
    });
  });
});
