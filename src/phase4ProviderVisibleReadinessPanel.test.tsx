import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  Phase4ProviderBlockerPriorityPanel,
  Phase4ProviderCompletionStatusPanel,
  Phase4ProviderSurfaceDepthPanel,
  Phase4ProviderTraceabilityPanel,
  ProviderIntegrationReadinessPanel
} from "./App";
import {
  buildCatalogRefreshOwnerValidation,
  type CatalogRefreshOwnerValidationResult,
  type CatalogRefreshOwnerValidationSurfaceResult,
  type CatalogSurface
} from "./catalogRefreshOwnerValidation";
import {
  createPhase4ProviderApprovalRecord,
  derivePhase4ProviderApprovalRecordValidation
} from "./phase4ProviderApprovalRecord";
import {
  createPhase4ProviderAuditRecord,
  derivePhase4ProviderAuditRecordValidation
} from "./phase4ProviderAuditRecord";
import {
  createPhase4ProviderRollbackRecord,
  derivePhase4ProviderRollbackRecordValidation
} from "./phase4ProviderRollbackRecord";
import {
  buildCatalogRefreshProviderFingerprint,
  buildCatalogRefreshProviderSmoke
} from "./catalogRefreshProviderSmoke";
import {
  createPhase4ProviderPermissionRecord,
  derivePhase4ProviderPermissionRecordValidation,
  EXPECTED_PHASE4_PROVIDER_PERMISSION_SURFACES
} from "./phase4ProviderPermissionRecord";
import { buildPhase4ProviderCatalogDepth } from "./phase4ProviderCatalogDepth";
import {
  buildPhase4ProviderBlockerPriority,
  type Phase4ProviderBlockerPrioritySummary
} from "./phase4ProviderBlockerPriority";
import {
  buildPhase4ProviderCompletionStatus
} from "./phase4ProviderCompletionStatus";
import {
  buildPhase4ProviderReviewArtifact,
  serializePhase4ProviderReviewArtifact,
  verifyRecordedPhase4ProviderReviewArtifact,
  verifyPhase4ProviderReviewArtifact
} from "./phase4ProviderReviewArtifact";
import { buildPhase4ProviderSurfaceDepth } from "./phase4ProviderSurfaceDepth";
import { buildPhase4ProviderTraceabilitySummary } from "./phase4ProviderTraceability";
import { buildPhase4RefreshSafetyDepth } from "./phase4RefreshSafetyDepth";
import { buildProviderExecutionGate } from "./providerExecutionGate";
import { buildProviderIntegrationReadiness } from "./providerIntegrationReadiness";

const surfaces: readonly CatalogSurface[] = [
  "command",
  "skill",
  "plugin",
  "mcp",
  "automation",
  "personalization"
];

const snapshotPayloads = {
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
const phase4CatalogFingerprint = buildCatalogRefreshProviderFingerprint(snapshotPayloads);

function surfaceFixture(
  surface: CatalogSurface,
  overrides: Partial<CatalogRefreshOwnerValidationSurfaceResult> = {}
): CatalogRefreshOwnerValidationSurfaceResult {
  const metadataProofBySurface: Partial<Record<CatalogSurface, string[]>> = {
    command: [
      "/alpha:scopes=panel:state=live",
      "/beta:scopes=panel+app:state=live"
    ],
    skill: [
      "alpha-skill:source=builtin:trigger=slash:invocation=Alpha:state=live",
      "beta-skill:source=extension:trigger=button:invocation=Beta:state=live"
    ]
  };

  return {
    surface,
    source: "provider-live",
    total: 2,
    readiness: 100,
    state: "ready",
    pass: true,
    itemOrder: [`${surface}-one`, `${surface}-two`],
    metadataProof: metadataProofBySurface[surface] ?? [`${surface}:metadata-proof-one`, `${surface}:metadata-proof-two`],
    safety: "metadata/status-only",
    summary: {
      total: 2,
      live: 2,
      preview: 0,
      disconnected: 0,
      setupRequired: 0,
      unsupported: 0,
      unavailable: 0,
      actionable: 2,
      availability: 1
    },
    ...overrides
  };
}

function validationFixture(): CatalogRefreshOwnerValidationResult {
  return {
    safety: "Catalog refresh validation is metadata/status-only.",
    pass: true,
    readiness: 100,
    state: "ready",
    surfaces: surfaces.map((surface) => surfaceFixture(surface))
  };
}

const readyRefreshSafety = buildPhase4RefreshSafetyDepth(
  buildCatalogRefreshProviderSmoke(snapshotPayloads, {
    checkedAt: "2026-06-18T10:35:00.000Z"
  }),
  {
    evaluatedAt: "2026-06-18T10:35:00.000Z",
    expectedCatalogFingerprint: phase4CatalogFingerprint
  }
);

describe("phase 4 provider visible readiness panel", () => {
  it("renders catalog evidence, execution locks, totals, and next actions for owner review", () => {
    const readiness = buildProviderIntegrationReadiness(validationFixture());
    const catalogDepth = buildPhase4ProviderCatalogDepth(readiness);
    const executionGate = buildProviderExecutionGate(readiness);
    const html = renderToStaticMarkup(
      <ProviderIntegrationReadinessPanel
        catalogDepth={catalogDepth}
        executionGate={executionGate}
        readiness={readiness}
      />
    );

    expect(html).toContain("Phase 4 Provider Readiness");
    expect(html).toContain("Provider live");
    expect(html).toContain("2");
    expect(html).toContain("scope labels");
    expect(html).toContain("records=6/6");
    expect(html).toContain("metadataProof=6/6 scopedExecution=6/6 ownerSafe=6/6");
    expect(html).toContain("commandScopeProof=present");
    expect(html).toContain("skillInvocationProof=present");
    expect(html).toContain("commandItemOrder=present");
    expect(html).toContain("skillItemOrder=present");
    expect(html).toContain("commandMetadata=present");
    expect(html).toContain("skillSource=present");
    expect(html).toContain("pluginSurfaceProof=present");
    expect(html).toContain("mcpToolPolicyProof=present");
    expect(html).toContain("pluginItemOrder=present");
    expect(html).toContain("mcpItemOrder=present");
    expect(html).toContain("pluginMetadata=present");
    expect(html).toContain("mcpSource=present");
    expect(html).toContain("metadataOnlySurface=present");
    expect(html).toContain("commandScopeProof=");
    expect(html).toContain("skillInvocationProof=");
    expect(html).toContain("tool policy");
    expect(html).toContain("non-mutating readiness evidence");
    expect(html).toContain("metadata/status-only");
    expect(html).toContain("profile-mutation lock");
    expect(html).toContain("Keep provider execution locked");
    expect(html).toContain("approval, audit, rollback, and permission gates");
    expect(html).toContain("Provider execution gate");
    expect(html).toContain("providerExecutionGate");
    expect(html).toContain("support=4/4");
    expect(html).toContain("approval=0/4");
    expect(html).toContain("canRequest=no");
    expect(html).toContain("Record explicit owner approval");
    expect(html).toContain("Source: Provider live");
  });

  it("renders setup-required fallback action text without live provider execution", () => {
    const readiness = buildProviderIntegrationReadiness(buildCatalogRefreshOwnerValidation());
    const catalogDepth = buildPhase4ProviderCatalogDepth(readiness);
    const executionGate = buildProviderExecutionGate(readiness);
    const html = renderToStaticMarkup(
      <ProviderIntegrationReadinessPanel
        catalogDepth={catalogDepth}
        executionGate={executionGate}
        readiness={readiness}
      />
    );

    expect(html).toContain("Setup required");
    expect(html).toContain("Fallback metadata");
    expect(html).toContain("Resolve setup-required or disconnected rows");
    expect(html).toContain("must not execute commands");
    expect(html).toContain("Provider execution gate");
    expect(html).toContain("support=0/4");
  });

  it("renders approval record actions and evidence keys without provider execution", () => {
    const readiness = buildProviderIntegrationReadiness(validationFixture());
    const record = createPhase4ProviderApprovalRecord({
      catalogFingerprint: phase4CatalogFingerprint,
      createdAt: "2026-06-18T10:00:00.000Z"
    });
    const approvalValidation = derivePhase4ProviderApprovalRecordValidation({
      record,
      expectedCatalogFingerprint: phase4CatalogFingerprint,
      refreshSafety: readyRefreshSafety,
      options: { evaluatedAt: "2026-06-18T10:05:00.000Z" }
    });
    const auditRecord = createPhase4ProviderAuditRecord({
      approvalRecord: record,
      auditEvidenceFingerprint: "phase4-provider-audit-current",
      catalogFingerprint: phase4CatalogFingerprint,
      createdAt: "2026-06-18T10:10:00.000Z"
    });
    const auditValidation = derivePhase4ProviderAuditRecordValidation({
      record: auditRecord,
      approvalRecord: record,
      approvalValidation,
      expectedAuditEvidenceFingerprint: "phase4-provider-audit-current",
      expectedCatalogFingerprint: phase4CatalogFingerprint,
      options: { evaluatedAt: "2026-06-18T10:15:00.000Z" }
    });
    const rollbackRecord = createPhase4ProviderRollbackRecord({
      approvalRecord: record,
      auditRecord,
      catalogFingerprint: phase4CatalogFingerprint,
      createdAt: "2026-06-18T10:20:00.000Z",
      surfaceDepthEvidenceFingerprint: "phase4-provider-rollback-current"
    });
    const rollbackValidation = derivePhase4ProviderRollbackRecordValidation({
      record: rollbackRecord,
      approvalRecord: record,
      auditRecord,
      auditValidation,
      expectedCatalogFingerprint: phase4CatalogFingerprint,
      expectedSurfaceDepthEvidenceFingerprint: "phase4-provider-rollback-current",
      options: { evaluatedAt: "2026-06-18T10:25:00.000Z" }
    });
    const permissionRecord = createPhase4ProviderPermissionRecord({
      approvalRecord: record,
      auditRecord,
      rollbackRecord,
      catalogFingerprint: phase4CatalogFingerprint,
      createdAt: "2026-06-18T10:30:00.000Z",
      surfaceDepthEvidenceFingerprint: "phase4-provider-rollback-current",
      permissionEvidenceFingerprint: "phase4-provider-permission-current",
      providerSurfaceScopes: EXPECTED_PHASE4_PROVIDER_PERMISSION_SURFACES
    });
    const permissionValidation = derivePhase4ProviderPermissionRecordValidation({
      record: permissionRecord,
      approvalRecord: record,
      auditRecord,
      rollbackRecord,
      rollbackValidation,
      expectedCatalogFingerprint: phase4CatalogFingerprint,
      expectedSurfaceDepthEvidenceFingerprint: "phase4-provider-rollback-current",
      expectedPermissionEvidenceFingerprint: "phase4-provider-permission-current",
      options: { evaluatedAt: "2026-06-18T10:35:00.000Z" }
    });
    const surfaceDepth = buildPhase4ProviderSurfaceDepth(
      readiness,
      approvalValidation,
      auditValidation,
      rollbackValidation,
      permissionValidation
    );
    const catalogDepth = buildPhase4ProviderCatalogDepth(readiness);
    const executionGate = buildProviderExecutionGate(readiness);
    const traceability = buildPhase4ProviderTraceabilitySummary({
      catalogDepth,
      refreshSafety: readyRefreshSafety,
      surfaceDepth
    });
    const blockerPriority = buildPhase4ProviderBlockerPriority({
      catalogDepth,
      refreshSafety: readyRefreshSafety,
      surfaceDepth,
      traceability
    });
    const completionStatus = buildPhase4ProviderCompletionStatus({
      catalogDepth,
      refreshSafety: readyRefreshSafety,
      surfaceDepth,
      traceability,
      blockerPriority,
      executionGate
    });
    const reviewArtifactVerification = verifyPhase4ProviderReviewArtifact(
      buildPhase4ProviderReviewArtifact({
        exportedAt: "2026-06-18T10:35:00.000Z",
        evaluatedAt: "2026-06-18T10:35:00.000Z",
        currentCatalogFingerprint: phase4CatalogFingerprint,
        catalogDepth,
        refreshSafety: readyRefreshSafety,
        surfaceDepth,
        traceability,
        blockerPriority,
        providerExecutionGate: executionGate,
        approvalRecord: record,
        approvalValidation,
        auditRecord,
        auditValidation,
        rollbackRecord,
        rollbackValidation,
        permissionRecord,
        permissionValidation
      }),
      {
        verifiedAt: "2026-06-18T10:35:00.000Z",
        expectedCatalogFingerprint: phase4CatalogFingerprint
      }
    );
    const html = renderToStaticMarkup(
      <>
        <ProviderIntegrationReadinessPanel catalogDepth={catalogDepth} readiness={readiness} />
        <Phase4ProviderSurfaceDepthPanel
          approvalValidation={approvalValidation}
          auditRecord={auditRecord}
          auditValidation={auditValidation}
          importedReviewArtifactVerification={{
            ...reviewArtifactVerification,
            detail: "Imported Phase 4 provider review artifact is held for owner review."
          }}
          onClearApproval={() => undefined}
          onClearAudit={() => undefined}
          onClearPermission={() => undefined}
          onClearRollback={() => undefined}
          onExportReviewArtifact={() => undefined}
          onLoadRecordedReviewArtifact={() => undefined}
          onRecordApproval={() => undefined}
          onRecordAudit={() => undefined}
          onRecordPermission={() => undefined}
          onRecordRollback={() => undefined}
          recordApprovalEnabled={true}
          recordAuditEnabled={true}
          recordPermissionEnabled={true}
          recordRollbackEnabled={true}
          onVerifyImportedReviewArtifact={() => undefined}
          permissionRecord={permissionRecord}
          permissionValidation={permissionValidation}
          record={record}
          recordedArtifactLoadAvailable={true}
          reviewArtifactVerification={reviewArtifactVerification}
          rollbackRecord={rollbackRecord}
          rollbackValidation={rollbackValidation}
          snapshot={surfaceDepth}
        />
        <Phase4ProviderTraceabilityPanel summary={traceability} />
        <Phase4ProviderBlockerPriorityPanel summary={blockerPriority} />
        <Phase4ProviderCompletionStatusPanel status={completionStatus} />
      </>
    );

    expect(html).toContain("Phase 4 Surface Depth");
    expect(html).toContain("Phase 4 Traceability");
    expect(html).toContain("Phase 4 Blocker Priority");
    expect(html).toContain("Phase 4 Completion");
    expect(html).toContain("Approval record");
    expect(html).toContain("Audit record");
    expect(html).toContain("Rollback record");
    expect(html).toContain("Permission record");
    expect(html).toContain("Provider review artifact");
    expect(html).toContain("Imported provider review");
    expect(html).toContain("Catalog fingerprint");
    expect(html).toContain(phase4CatalogFingerprint);
    expect(html).toContain("matched");
    expect(html).toContain("kindOrder=command|skill|plugin|mcp|automation|personalization");
    expect(html).toContain("pairOrder=command|skill");
    expect(html).toContain("pairOrder=plugin|mcp");
    expect(html).toContain("Keep Phase 4 provider review held");
    expect(html).toContain("current active goal is goal-phase-9-runner");
    expect(html).toContain("Phase 4 provider completion status proof attached");
    expect(html).toContain("Export review");
    expect(html).toContain("Import review");
    expect(html).toContain("Load recorded");
    expect(html).toContain("Record approval");
    expect(html).toContain("Clear approval");
    expect(html).toContain("Record audit");
    expect(html).toContain("Clear audit");
    expect(html).toContain("Record rollback");
    expect(html).toContain("Clear rollback");
    expect(html).toContain("Record permission");
    expect(html).toContain("Clear permission");
    expect(html).toContain("phase-04-surface-depth:approval-gate");
    expect(html).toContain("phase-04-surface-depth:audit-gate");
    expect(html).toContain("phase-04-surface-depth:rollback-gate");
    expect(html).toContain("phase-04-surface-depth:permission-gate");
    expect(html).toContain("items=9/9 ready=9 preview=0 setupRequired=0 held=0");
    expect(html).toContain(
      "itemKinds=surface-coverage|setup-blockers|capability-gaps|preview-review|approval-gate|audit-gate|rollback-gate|permission-gate|execution-lock"
    );
    expect(html).toContain("ownerBoundary=present approvalChain=present auditChain=present rollbackChain=present permissionChain=present");
    expect(html).toContain("canEnableExecution=locked metadataOnly=locked execution=locked");
    expect(html).toContain("approvalValidation=ready auditValidation=ready rollbackValidation=ready permissionValidation=ready");
    expect(html).toContain("approvalChain=present auditChain=present rollbackChain=present permissionChain=present");
    expect(html).toContain("permissionSurfaces=6/6 missingPermissionScopes=none metadataOnly=locked execution=locked");
    expect(html).toContain("Expected rollback phase4-provider-rollback:2026-06-18T10:20:00.000Z");
    expect(html).toContain("Covered surfaces 6/6; missing scopes none.");
    expect(html).toContain("refreshSafety=ready ready=8 preview=0 blocked=0");
    expect(html).toContain("records=8/8 ready=8 preview=0 blocked=0");
    expect(html).toContain(
      "surfaceStates=command:ready|skill:ready|plugin:ready|mcp:ready|automation:ready|personalization:ready"
    );
    expect(html).toContain(
      "recordKinds=run-state|surface-order|validation-result|proof-freshness|catalog-fingerprint|metadata-only-contract|reload-safe-proof|execution-lock"
    );
    expect(html).toContain("refreshSmoke=present reloadSafe=ready");
    expect(html).toContain("checkedAt=present fingerprint=present");
    expect(html).toContain("catalogMatch=matched recordFreshness=fresh refreshSafety=ready");
    expect(html).toContain("owner=present mutation=locked execution=locked");
    expect(html).toContain("catalogMatch=matched execution=locked");
    expect(html).toContain("approvalValidation=ready approvalChain=present");
    expect(html).toContain("auditMatch=matched recordFreshness=fresh mutation=locked execution=locked");
    expect(html).toContain("auditValidation=ready auditChain=present");
    expect(html).toContain(
      "surfaceMatch=matched recordFreshness=fresh owner=present action=present mutation=locked execution=locked"
    );
    expect(html).toContain("permissionMatch=matched recordFreshness=fresh");
    expect(html).toContain("rollbackValidation=ready rollbackChain=present");
    expect(html).toContain(
      "recordFreshness=fresh owner=present scope=present action=present mutation=locked execution=locked"
    );
    expect(html).toContain("active-goal");
    expect(html).toContain("items=7/7 ready=6 preview=1 setupRequired=0 held=0");
    expect(html).toContain(
      "itemKinds=active-goal|pm-coverage|catalog-depth|refresh-safety|surface-depth|record-chain|execution-lock"
    );
    expect(html).toContain("pmLinks=16/16 missingPm=0");
    expect(html).toContain("recordChain=ready executionLocks=6/6 trust=review");
    expect(html).toContain("open=1 catalogSmokeAddressable=0");
    expect(html).toContain("topSource=phase-04-provider-traceability:active-goal topKind=traceability");
    expect(html).toContain("topStatus=preview topEvidence=phase-04-traceability:active-goal");
    expect(html).toContain("catalogSmokeTop=no recordChain=ready traceability=review");
    expect(html).toContain("phase4ProviderCompletionStatusProof=state=review");
    expect(html).toContain("phase5=held");
    expect(html).toContain("providerGate=held");
    expect(html).toContain("topHold=traceability");
    expect(html).toContain("Phase 4 provider blocker priority");
    expect(html).toContain("Remaining goal link");
    expect(html).toContain("phase4-provider-permission-current");
    expect(html).toContain("PM Links");
    expect(html).toContain("Smoke");
    expect(html).toContain("Permission gate");
    expect(html).toContain("Execution lock");
    expect(html).toContain("does not execute commands");
    expect(html).toContain("without running provider actions");
    expect(html).toContain("metadata-only");
    expect(traceability.canTrustProviderReview).toBe(false);
    expect(traceability.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "active-goal", status: "preview" })
      ])
    );
    expect(blockerPriority.state).toBe("preview");
    expect(reviewArtifactVerification).toMatchObject({
      state: "review",
      executionLocked: true
    });
  });

  it("keeps Phase 4 record buttons visibly disabled until prerequisites are ready", () => {
    const readiness = buildProviderIntegrationReadiness(buildCatalogRefreshOwnerValidation());
    const surfaceDepth = buildPhase4ProviderSurfaceDepth(readiness);
    const html = renderToStaticMarkup(
      <Phase4ProviderSurfaceDepthPanel
        onRecordApproval={() => undefined}
        onRecordAudit={() => undefined}
        onRecordPermission={() => undefined}
        onRecordRollback={() => undefined}
        snapshot={surfaceDepth}
      />
    );

    expect(html).toContain("Record approval");
    expect(html).toContain("Record audit");
    expect(html).toContain("Record rollback");
    expect(html).toContain("Record permission");
    expect(html).toContain("Refresh safety proof must be ready before approval can be recorded.");
    expect(html).toContain("Approval evidence must be ready before audit can be recorded.");
    expect(html).toContain("Audit evidence must be ready before rollback can be recorded.");
    expect(html).toContain("Rollback evidence must be ready before permission can be recorded.");
    expect(html.match(/disabled=""/g)?.length).toBeGreaterThanOrEqual(4);
  });

  it("shows recorded provider review artifacts missing local record evidence as review", () => {
    const readiness = buildProviderIntegrationReadiness(validationFixture());
    const readyRefreshSafety = buildPhase4RefreshSafetyDepth(
      buildCatalogRefreshProviderSmoke(snapshotPayloads, {
        checkedAt: "2026-06-18T10:00:00.000Z"
      }),
      {
        evaluatedAt: "2026-06-18T10:35:00.000Z",
        expectedCatalogFingerprint: phase4CatalogFingerprint
      }
    );
    const surfaceDepth = buildPhase4ProviderSurfaceDepth(readiness);
    const catalogDepth = buildPhase4ProviderCatalogDepth(readiness);
    const traceability = buildPhase4ProviderTraceabilitySummary({
      catalogDepth,
      refreshSafety: readyRefreshSafety,
      surfaceDepth
    });
    const noOpenBlockerPriority: Phase4ProviderBlockerPrioritySummary = {
      ...buildPhase4ProviderBlockerPriority({
        catalogDepth,
        refreshSafety: readyRefreshSafety,
        surfaceDepth,
        traceability
      }),
      openBlockerCount: 0,
      topPriorityAction: "No Phase 4 provider blockers remain.",
      topPriorityLabel: "No open Phase 4 provider blocker",
      topPrioritySourceId: "phase4.provider-blocker.none",
      topPriorityKind: "none",
      topPriorityStatus: "ready",
      topPriorityEvidenceKey: "phase-04-provider-blocker:none",
      blockerPriorityProof:
        "open=0 catalogSmokeAddressable=0 topSource=phase4.provider-blocker.none " +
        "topKind=none topStatus=ready topEvidence=phase-04-provider-blocker:none " +
        "catalogSmokeTop=no recordChain=ready traceability=ready metadataOnly=locked execution=locked"
    };
    const recordedMissingLocalEvidence =
      verifyRecordedPhase4ProviderReviewArtifact(
        serializePhase4ProviderReviewArtifact(
          buildPhase4ProviderReviewArtifact({
            exportedAt: "2026-06-18T10:35:00.000Z",
            evaluatedAt: "2026-06-18T10:35:00.000Z",
            currentCatalogFingerprint: phase4CatalogFingerprint,
            catalogDepth,
            refreshSafety: readyRefreshSafety,
            surfaceDepth,
            traceability: {
              ...traceability,
              canTrustProviderReview: true,
              traceabilityProof: traceability.traceabilityProof.replace("trust=review", "trust=ready")
            },
            blockerPriority: noOpenBlockerPriority,
            providerExecutionGate: buildProviderExecutionGate(readiness)
          })
        ),
        { verifiedAt: "2026-06-18T10:35:00.000Z" }
      );

    const html = renderToStaticMarkup(
      <Phase4ProviderSurfaceDepthPanel
        importedReviewArtifactVerification={recordedMissingLocalEvidence}
        recordedArtifactLoadAvailable={true}
        reviewArtifactVerification={recordedMissingLocalEvidence}
        snapshot={surfaceDepth}
      />
    );

    expect(recordedMissingLocalEvidence).toMatchObject({
      state: "review",
      hasApprovalRecord: false,
      hasAuditRecord: false,
      hasRollbackRecord: false,
      hasPermissionRecord: false
    });
    expect(html).toContain("Imported provider review");
    expect(html).toContain("missing approval local record evidence");
    expect(html).toContain("Approval missing");
    expect(html).toContain("Audit missing");
    expect(html).toContain("Rollback missing");
    expect(html).toContain("Permission missing");
    expect(html).toContain("matched");
  });
});
