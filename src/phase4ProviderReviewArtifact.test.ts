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
  const catalogDepth = {
    ...artifact.catalogDepth,
    readyCount: 6,
    previewCount: 0,
    setupRequiredCount: 0,
    heldCount: 0,
    executionLockCount: 6,
    catalogDepthProof:
      "records=6/6 ready=6 preview=0 setupRequired=0 held=0 locks=6/6 " +
      "metadataProof=6/6 scopedExecution=6/6 ownerSafe=6/6 " +
      "command=ready skill=ready plugin=ready mcp=ready automation=ready personalization=ready " +
      "metadataOnly=locked execution=locked",
    commandSkillProof:
      "command=ready skill=ready commandItems=1 skillItems=1 " +
      "commandEvidence=phase-04-provider-catalog:command skillEvidence=phase-04-provider-catalog:skill " +
      "commandScopeProof=present skillInvocationProof=present " +
      "commandLock=locked skillLock=locked metadataOnly=locked execution=locked",
    pluginMcpProof:
      "plugin=ready mcp=ready pluginItems=1 mcpItems=1 " +
      "pluginEvidence=phase-04-provider-catalog:plugin mcpEvidence=phase-04-provider-catalog:mcp " +
      "pluginSurfaceProof=present mcpToolPolicyProof=present metadataOnlySurface=present " +
      "mcpTransport=present mcpToolPolicy=present " +
      "pluginLock=locked mcpLock=locked metadataOnly=locked execution=locked",
    records: artifact.catalogDepth.records.map((record) => ({
      ...record,
      status: "ready" as const,
      statusLabel: "Ready",
      readiness: 100
    }))
  };

  return {
    ...artifact,
    catalogDepth,
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
  const surfaceDepth = {
    ...artifact.surfaceDepth,
    state: "ready" as const,
    statusLabel: "Ready",
    readiness: 100,
    attentionCount: 0,
    readyCount: 9,
    previewCount: 0,
    setupRequiredCount: 0,
    heldCount: 0,
    nextSurfaceLabel: "Execution lock",
    surfaceDepthProof:
      "items=9/9 ready=9 preview=0 setupRequired=0 held=0 " +
      "surfaceCoverage=ready setupBlockers=ready capabilityGaps=ready previewReview=ready " +
      "approval=ready audit=ready rollback=ready permission=ready executionLock=ready " +
      "ownerBoundary=present canEnableExecution=locked metadataOnly=locked execution=locked",
    items: artifact.surfaceDepth.items.map((item) => {
      if (item.kind === "approval-gate") {
        return {
          ...item,
          status: "ready" as const,
          ownerBoundaryProof:
            `catalog=${approvalValidation.expectedCatalogFingerprint} ` +
            `recordCatalog=${approvalValidation.recordCatalogFingerprint} ` +
            `${approvalValidation.refreshSafetyProof} catalogMatch=matched execution=locked`
        };
      }

      if (item.kind === "audit-gate") {
        return {
          ...item,
          status: "ready" as const,
          ownerBoundaryProof: auditValidation.auditChainProof
        };
      }

      if (item.kind === "rollback-gate") {
        return {
          ...item,
          status: "ready" as const,
          ownerBoundaryProof: rollbackValidation.rollbackChainProof
        };
      }

      if (item.kind === "permission-gate") {
        return {
          ...item,
          status: "ready" as const,
          ownerBoundaryProof: permissionValidation.permissionChainProof
        };
      }

      return item;
    })
  };

  return {
    ...noOpenBlockers(artifact),
    surfaceDepth,
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
    const readyArtifact = withReadyLocalRecords(artifact);

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

  it("reviews no-blocker artifacts missing surface owner-boundary proof", () => {
    const artifact = withReadyLocalRecords(
      reviewArtifact({
        refreshSmoke: liveCatalogRefreshSmoke()
      })
    );
    const withoutAuditOwnerBoundaryProof = {
      ...artifact,
      surfaceDepth: {
        ...artifact.surfaceDepth,
        items: artifact.surfaceDepth.items.map((item) =>
          item.kind === "audit-gate" ? { ...item, ownerBoundaryProof: undefined } : item
        )
      }
    };

    expect(
      verifyPhase4ProviderReviewArtifact(withoutAuditOwnerBoundaryProof, {
        verifiedAt: "2026-06-18T10:05:00.000Z",
        expectedCatalogFingerprint: artifact.currentCatalogFingerprint
      })
    ).toMatchObject({
      state: "review",
      detail: expect.stringContaining("audit-gate owner-boundary proof"),
      nextAction: expect.stringContaining("owner-boundary proof")
    });
  });

  it("reviews no-blocker artifacts missing surface-depth aggregate proof", () => {
    const artifact = withReadyLocalRecords(
      reviewArtifact({
        refreshSmoke: liveCatalogRefreshSmoke()
      })
    );
    const withoutSurfaceDepthProof: Phase4ProviderReviewArtifact = {
      ...artifact,
      surfaceDepth: { ...artifact.surfaceDepth, surfaceDepthProof: "" }
    };

    expect(
      verifyPhase4ProviderReviewArtifact(withoutSurfaceDepthProof, {
        verifiedAt: "2026-06-18T10:05:00.000Z",
        expectedCatalogFingerprint: artifact.currentCatalogFingerprint
      })
    ).toMatchObject({
      state: "review",
      detail: expect.stringContaining("surface-depth aggregate proof"),
      nextAction: expect.stringContaining("surface-depth snapshot")
    });
  });

  it("reviews no-blocker artifacts missing all-catalog refresh smoke proof", () => {
    const artifact = withReadyLocalRecords(
      reviewArtifact({
        refreshSmoke: liveCatalogRefreshSmoke()
      })
    );
    const withoutRefreshSmokeProof: Phase4ProviderReviewArtifact = {
      ...artifact,
      refreshSafety: { ...artifact.refreshSafety, refreshSmokeProof: "" }
    };

    expect(
      verifyPhase4ProviderReviewArtifact(withoutRefreshSmokeProof, {
        verifiedAt: "2026-06-18T10:05:00.000Z",
        expectedCatalogFingerprint: artifact.currentCatalogFingerprint
      })
    ).toMatchObject({
      state: "review",
      detail: expect.stringContaining("all-catalog refresh smoke proof"),
      nextAction: expect.stringContaining("all-catalog smoke proof")
    });
  });

  it("reviews no-blocker artifacts missing refresh-safety depth aggregate proof", () => {
    const artifact = withReadyLocalRecords(
      reviewArtifact({
        refreshSmoke: liveCatalogRefreshSmoke()
      })
    );
    const withoutRefreshSafetyDepthProof: Phase4ProviderReviewArtifact = {
      ...artifact,
      refreshSafety: { ...artifact.refreshSafety, refreshSafetyDepthProof: "" }
    };

    expect(
      verifyPhase4ProviderReviewArtifact(withoutRefreshSafetyDepthProof, {
        verifiedAt: "2026-06-18T10:05:00.000Z",
        expectedCatalogFingerprint: artifact.currentCatalogFingerprint
      })
    ).toMatchObject({
      state: "review",
      detail: expect.stringContaining("refresh-safety depth aggregate proof"),
      nextAction: expect.stringContaining("refresh-safety depth summary")
    });
  });

  it("reviews no-blocker artifacts missing audit validation chain proof", () => {
    const artifact = withReadyLocalRecords(
      reviewArtifact({
        refreshSmoke: liveCatalogRefreshSmoke()
      })
    );
    const withoutAuditChainProof: Phase4ProviderReviewArtifact = {
      ...artifact,
      auditValidation: artifact.auditValidation
        ? { ...artifact.auditValidation, auditChainProof: "" }
        : artifact.auditValidation
    };

    expect(
      verifyPhase4ProviderReviewArtifact(withoutAuditChainProof, {
        verifiedAt: "2026-06-18T10:05:00.000Z",
        expectedCatalogFingerprint: artifact.currentCatalogFingerprint
      })
    ).toMatchObject({
      state: "review",
      detail: expect.stringContaining("audit validation chain proof"),
      nextAction: expect.stringContaining("audit validation chain proof")
    });
  });

  it("reviews no-blocker artifacts missing rollback validation chain proof", () => {
    const artifact = withReadyLocalRecords(
      reviewArtifact({
        refreshSmoke: liveCatalogRefreshSmoke()
      })
    );
    const withoutRollbackChainProof: Phase4ProviderReviewArtifact = {
      ...artifact,
      rollbackValidation: artifact.rollbackValidation
        ? { ...artifact.rollbackValidation, rollbackChainProof: "" }
        : artifact.rollbackValidation
    };

    expect(
      verifyPhase4ProviderReviewArtifact(withoutRollbackChainProof, {
        verifiedAt: "2026-06-18T10:05:00.000Z",
        expectedCatalogFingerprint: artifact.currentCatalogFingerprint
      })
    ).toMatchObject({
      state: "review",
      detail: expect.stringContaining("rollback validation chain proof"),
      nextAction: expect.stringContaining("rollback validation chain proof")
    });
  });

  it("reviews no-blocker artifacts missing permission validation chain proof", () => {
    const artifact = withReadyLocalRecords(
      reviewArtifact({
        refreshSmoke: liveCatalogRefreshSmoke()
      })
    );
    const withoutPermissionChainProof: Phase4ProviderReviewArtifact = {
      ...artifact,
      permissionValidation: artifact.permissionValidation
        ? { ...artifact.permissionValidation, permissionChainProof: "" }
        : artifact.permissionValidation
    };

    expect(
      verifyPhase4ProviderReviewArtifact(withoutPermissionChainProof, {
        verifiedAt: "2026-06-18T10:05:00.000Z",
        expectedCatalogFingerprint: artifact.currentCatalogFingerprint
      })
    ).toMatchObject({
      state: "review",
      detail: expect.stringContaining("permission validation chain proof"),
      nextAction: expect.stringContaining("permission validation chain proof")
    });
  });

  it("reviews no-blocker artifacts missing command scoped execution proof", () => {
    const artifact = withReadyLocalRecords(
      reviewArtifact({
        refreshSmoke: liveCatalogRefreshSmoke()
      })
    );
    const withoutCommandScopedExecutionProof = {
      ...artifact,
      catalogDepth: {
        ...artifact.catalogDepth,
        records: artifact.catalogDepth.records.map((record) =>
          record.kind === "command" ? { ...record, scopedExecutionProof: "" } : record
        )
      }
    };

    expect(
      verifyPhase4ProviderReviewArtifact(withoutCommandScopedExecutionProof, {
        verifiedAt: "2026-06-18T10:05:00.000Z",
        expectedCatalogFingerprint: artifact.currentCatalogFingerprint
      })
    ).toMatchObject({
      state: "review",
      detail: expect.stringContaining("command scoped execution proof"),
      nextAction: expect.stringContaining("command, skill, plugin, and MCP catalog rows")
    });
  });

  it("reviews no-blocker artifacts missing command/skill aggregate proof", () => {
    const artifact = withReadyLocalRecords(
      reviewArtifact({
        refreshSmoke: liveCatalogRefreshSmoke()
      })
    );
    const withoutCommandSkillProof: Phase4ProviderReviewArtifact = {
      ...artifact,
      catalogDepth: { ...artifact.catalogDepth, commandSkillProof: "" }
    };

    expect(
      verifyPhase4ProviderReviewArtifact(withoutCommandSkillProof, {
        verifiedAt: "2026-06-18T10:05:00.000Z",
        expectedCatalogFingerprint: artifact.currentCatalogFingerprint
      })
    ).toMatchObject({
      state: "review",
      detail: expect.stringContaining("command/skill aggregate proof"),
      nextAction: expect.stringContaining("command and skill catalog rows")
    });
  });

  it("reviews no-blocker artifacts missing catalog-depth aggregate proof", () => {
    const artifact = withReadyLocalRecords(
      reviewArtifact({
        refreshSmoke: liveCatalogRefreshSmoke()
      })
    );
    const withoutCatalogDepthProof: Phase4ProviderReviewArtifact = {
      ...artifact,
      catalogDepth: { ...artifact.catalogDepth, catalogDepthProof: "" }
    };

    expect(
      verifyPhase4ProviderReviewArtifact(withoutCatalogDepthProof, {
        verifiedAt: "2026-06-18T10:05:00.000Z",
        expectedCatalogFingerprint: artifact.currentCatalogFingerprint
      })
    ).toMatchObject({
      state: "review",
      detail: expect.stringContaining("catalog-depth aggregate proof"),
      nextAction: expect.stringContaining("catalog-depth rows")
    });
  });

  it("reviews no-blocker artifacts missing plugin/MCP aggregate proof", () => {
    const artifact = withReadyLocalRecords(
      reviewArtifact({
        refreshSmoke: liveCatalogRefreshSmoke()
      })
    );
    const withoutPluginMcpProof: Phase4ProviderReviewArtifact = {
      ...artifact,
      catalogDepth: { ...artifact.catalogDepth, pluginMcpProof: "" }
    };

    expect(
      verifyPhase4ProviderReviewArtifact(withoutPluginMcpProof, {
        verifiedAt: "2026-06-18T10:05:00.000Z",
        expectedCatalogFingerprint: artifact.currentCatalogFingerprint
      })
    ).toMatchObject({
      state: "review",
      detail: expect.stringContaining("plugin/MCP aggregate proof"),
      nextAction: expect.stringContaining("plugin and MCP catalog rows")
    });
  });

  it("reviews no-blocker artifacts missing plugin and MCP scoped execution proof", () => {
    const artifact = withReadyLocalRecords(
      reviewArtifact({
        refreshSmoke: liveCatalogRefreshSmoke()
      })
    );
    const withoutPluginScopedExecutionProof: Phase4ProviderReviewArtifact = {
      ...artifact,
      catalogDepth: {
        ...artifact.catalogDepth,
        records: artifact.catalogDepth.records.map((record) =>
          record.kind === "plugin" ? { ...record, scopedExecutionProof: "" } : record
        )
      }
    };
    const withoutMcpScopedExecutionProof: Phase4ProviderReviewArtifact = {
      ...artifact,
      catalogDepth: {
        ...artifact.catalogDepth,
        records: artifact.catalogDepth.records.map((record) =>
          record.kind === "mcp" ? { ...record, scopedExecutionProof: "" } : record
        )
      }
    };

    expect(
      verifyPhase4ProviderReviewArtifact(withoutPluginScopedExecutionProof, {
        verifiedAt: "2026-06-18T10:05:00.000Z",
        expectedCatalogFingerprint: artifact.currentCatalogFingerprint
      })
    ).toMatchObject({
      state: "review",
      detail: expect.stringContaining("plugin scoped execution proof"),
      nextAction: expect.stringContaining("plugin, and MCP catalog rows")
    });
    expect(
      verifyPhase4ProviderReviewArtifact(withoutMcpScopedExecutionProof, {
        verifiedAt: "2026-06-18T10:05:00.000Z",
        expectedCatalogFingerprint: artifact.currentCatalogFingerprint
      })
    ).toMatchObject({
      state: "review",
      detail: expect.stringContaining("mcp scoped execution proof"),
      nextAction: expect.stringContaining("plugin, and MCP catalog rows")
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
        matchesCurrentCatalog: false,
        refreshSafetyReady: true,
        refreshSafetyProof: "refreshSafety=ready ready=8 preview=0 blocked=0"
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
