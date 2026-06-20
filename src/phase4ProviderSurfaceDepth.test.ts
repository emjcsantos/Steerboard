import { describe, expect, it } from "vitest";
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
  createPhase4ProviderPermissionRecord,
  derivePhase4ProviderPermissionRecordValidation,
  EXPECTED_PHASE4_PROVIDER_PERMISSION_SURFACES
} from "./phase4ProviderPermissionRecord";
import { buildPhase4ProviderSurfaceDepth } from "./phase4ProviderSurfaceDepth";
import type { Phase4RefreshSafetyDepthSummary } from "./phase4RefreshSafetyDepth";
import { buildProviderIntegrationReadiness } from "./providerIntegrationReadiness";

const surfaces: readonly CatalogSurface[] = [
  "command",
  "skill",
  "plugin",
  "mcp",
  "automation",
  "personalization"
];

function surfaceFixture(
  surface: CatalogSurface,
  overrides: Partial<CatalogRefreshOwnerValidationSurfaceResult> = {}
): CatalogRefreshOwnerValidationSurfaceResult {
  return {
    surface,
    source: "provider-live",
    total: 2,
    readiness: 100,
    state: "ready",
    pass: true,
    itemOrder: [`${surface}-one`, `${surface}-two`],
    metadataProof: [`${surface}:metadata-proof-one`, `${surface}:metadata-proof-two`],
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

function validationFixture(
  surfaceOverrides: Partial<Record<CatalogSurface, Partial<CatalogRefreshOwnerValidationSurfaceResult>>> = {}
): CatalogRefreshOwnerValidationResult {
  const surfaceResults = surfaces.map((surface) => surfaceFixture(surface, surfaceOverrides[surface]));
  const pass = surfaceResults.every((surface) => surface.pass);

  return {
    safety: "Catalog refresh validation is metadata/status-only.",
    pass,
    readiness: pass ? 100 : 0,
    state: pass ? "ready" : "blocked",
    surfaces: surfaceResults
  };
}

function depthFromValidation(validation: CatalogRefreshOwnerValidationResult) {
  return buildPhase4ProviderSurfaceDepth(buildProviderIntegrationReadiness(validation));
}

const readyRefreshSafety: Phase4RefreshSafetyDepthSummary = {
  id: "phase-4-refresh-safety-depth",
  label: "Phase 4 refresh safety depth",
  records: [],
  readyCount: 7,
  previewCount: 0,
  blockedCount: 0,
  nextAction: "Keep refresh safety attached.",
  ariaLabel: "Refresh safety ready."
};

describe("phase 4 provider surface depth", () => {
  it("keeps default fallback catalogs in setup-required review with execution locked", () => {
    const depth = depthFromValidation(buildCatalogRefreshOwnerValidation());

    expect(depth.state).toBe("setup-required");
    expect(depth.canEnableExecution).toBe(false);
    expect(depth.attentionCount).toBeGreaterThan(0);
    expect(depth.nextAction).toContain("setup-required");
    expect(depth.safety).toContain("metadata-only");
    expect(depth.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Setup blockers", status: "setup-required" }),
        expect.objectContaining({ label: "Approval gate", status: "preview" }),
        expect.objectContaining({ label: "Audit gate", status: "preview" }),
        expect.objectContaining({ label: "Rollback gate", status: "preview" }),
        expect.objectContaining({ label: "Permission gate", status: "preview" }),
        expect.objectContaining({ label: "Execution lock", status: "ready" })
      ])
    );
  });

  it("reports metadata-ready depth as execution-held while provider execution is locked", () => {
    const depth = depthFromValidation(validationFixture());

    expect(depth.state).toBe("preview");
    expect(depth.readiness).toBe(87);
    expect(depth.canEnableExecution).toBe(false);
    expect(depth.attentionCount).toBe(4);
    expect(depth.previewCount).toBe(4);
    expect(depth.nextSurfaceLabel).toBe("Approval gate");
    expect(depth.nextAction).toContain("owner approval gate");
    expect(depth.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Approval gate", status: "preview" }),
        expect.objectContaining({ label: "Audit gate", status: "preview" }),
        expect.objectContaining({ label: "Rollback gate", status: "preview" }),
        expect.objectContaining({ label: "Permission gate", status: "preview" }),
        expect.objectContaining({ label: "Execution lock", status: "ready" })
      ])
    );
  });

  it("marks only the approval gate ready when current approval evidence is attached", () => {
    const readiness = buildProviderIntegrationReadiness(validationFixture());
    const approvalValidation = derivePhase4ProviderApprovalRecordValidation({
      record: createPhase4ProviderApprovalRecord({
        catalogFingerprint: "phase4-catalog-current",
        createdAt: "2026-06-18T10:00:00.000Z"
      }),
      expectedCatalogFingerprint: "phase4-catalog-current",
      refreshSafety: readyRefreshSafety,
      options: { evaluatedAt: "2026-06-18T10:05:00.000Z" }
    });
    const depth = buildPhase4ProviderSurfaceDepth(readiness, approvalValidation);

    expect(depth.state).toBe("preview");
    expect(depth.readiness).toBe(90);
    expect(depth.canEnableExecution).toBe(false);
    expect(depth.previewCount).toBe(3);
    expect(depth.nextSurfaceLabel).toBe("Audit gate");
    expect(depth.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Approval gate",
          status: "ready",
          evidenceKey: "phase-04-surface-depth:approval-gate",
          detail: expect.stringContaining("matches the current catalog fingerprint"),
          ownerBoundaryProof: expect.stringContaining("catalogMatch=matched execution=locked")
        }),
        expect.objectContaining({ label: "Audit gate", status: "preview" }),
        expect.objectContaining({ label: "Rollback gate", status: "preview" }),
        expect.objectContaining({ label: "Permission gate", status: "preview" }),
        expect.objectContaining({ label: "Execution lock", status: "ready" })
      ])
    );
  });

  it("marks only approval and audit ready when current audit evidence is attached", () => {
    const readiness = buildProviderIntegrationReadiness(validationFixture());
    const approvalRecord = createPhase4ProviderApprovalRecord({
      catalogFingerprint: "phase4-catalog-current",
      createdAt: "2026-06-18T10:00:00.000Z"
    });
    const approvalValidation = derivePhase4ProviderApprovalRecordValidation({
      record: approvalRecord,
      expectedCatalogFingerprint: "phase4-catalog-current",
      refreshSafety: readyRefreshSafety,
      options: { evaluatedAt: "2026-06-18T10:05:00.000Z" }
    });
    const auditRecord = createPhase4ProviderAuditRecord({
      approvalRecord,
      auditEvidenceFingerprint: "phase4-provider-audit-current",
      catalogFingerprint: "phase4-catalog-current",
      createdAt: "2026-06-18T10:10:00.000Z"
    });
    const auditValidation = derivePhase4ProviderAuditRecordValidation({
      record: auditRecord,
      approvalRecord,
      approvalValidation,
      expectedAuditEvidenceFingerprint: "phase4-provider-audit-current",
      expectedCatalogFingerprint: "phase4-catalog-current",
      options: { evaluatedAt: "2026-06-18T10:15:00.000Z" }
    });
    const depth = buildPhase4ProviderSurfaceDepth(readiness, approvalValidation, auditValidation);

    expect(depth.state).toBe("preview");
    expect(depth.readiness).toBe(93);
    expect(depth.canEnableExecution).toBe(false);
    expect(depth.previewCount).toBe(2);
    expect(depth.nextSurfaceLabel).toBe("Rollback gate");
    expect(depth.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Approval gate", status: "ready" }),
        expect.objectContaining({
          label: "Audit gate",
          status: "ready",
          evidenceKey: "phase-04-surface-depth:audit-gate",
          detail: expect.stringContaining("matches the current approval record"),
          ownerBoundaryProof: expect.stringContaining("auditMatch=matched mutation=locked execution=locked")
        }),
        expect.objectContaining({ label: "Rollback gate", status: "preview" }),
        expect.objectContaining({ label: "Permission gate", status: "preview" }),
        expect.objectContaining({ label: "Execution lock", status: "ready" })
      ])
    );
  });

  it("marks approval, audit, and rollback ready while permission and execution stay held", () => {
    const readiness = buildProviderIntegrationReadiness(validationFixture());
    const approvalRecord = createPhase4ProviderApprovalRecord({
      catalogFingerprint: "phase4-catalog-current",
      createdAt: "2026-06-18T10:00:00.000Z"
    });
    const approvalValidation = derivePhase4ProviderApprovalRecordValidation({
      record: approvalRecord,
      expectedCatalogFingerprint: "phase4-catalog-current",
      refreshSafety: readyRefreshSafety,
      options: { evaluatedAt: "2026-06-18T10:05:00.000Z" }
    });
    const auditRecord = createPhase4ProviderAuditRecord({
      approvalRecord,
      auditEvidenceFingerprint: "phase4-provider-audit-current",
      catalogFingerprint: "phase4-catalog-current",
      createdAt: "2026-06-18T10:10:00.000Z"
    });
    const auditValidation = derivePhase4ProviderAuditRecordValidation({
      record: auditRecord,
      approvalRecord,
      approvalValidation,
      expectedAuditEvidenceFingerprint: "phase4-provider-audit-current",
      expectedCatalogFingerprint: "phase4-catalog-current",
      options: { evaluatedAt: "2026-06-18T10:15:00.000Z" }
    });
    const rollbackRecord = createPhase4ProviderRollbackRecord({
      approvalRecord,
      auditRecord,
      catalogFingerprint: "phase4-catalog-current",
      createdAt: "2026-06-18T10:20:00.000Z",
      surfaceDepthEvidenceFingerprint: "phase4-provider-rollback-current"
    });
    const rollbackValidation = derivePhase4ProviderRollbackRecordValidation({
      record: rollbackRecord,
      approvalRecord,
      auditRecord,
      auditValidation,
      expectedCatalogFingerprint: "phase4-catalog-current",
      expectedSurfaceDepthEvidenceFingerprint: "phase4-provider-rollback-current",
      options: { evaluatedAt: "2026-06-18T10:25:00.000Z" }
    });
    const depth = buildPhase4ProviderSurfaceDepth(
      readiness,
      approvalValidation,
      auditValidation,
      rollbackValidation
    );

    expect(depth.state).toBe("preview");
    expect(depth.readiness).toBe(97);
    expect(depth.canEnableExecution).toBe(false);
    expect(depth.previewCount).toBe(1);
    expect(depth.nextSurfaceLabel).toBe("Permission gate");
    expect(depth.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Approval gate", status: "ready" }),
        expect.objectContaining({ label: "Audit gate", status: "ready" }),
        expect.objectContaining({
          label: "Rollback gate",
          status: "ready",
          evidenceKey: "phase-04-surface-depth:rollback-gate",
          detail: expect.stringContaining("matches the current approval record"),
          ownerBoundaryProof: expect.stringContaining("surfaceMatch=matched mutation=locked execution=locked")
        }),
        expect.objectContaining({ label: "Permission gate", status: "preview" }),
        expect.objectContaining({ label: "Execution lock", status: "ready" })
      ])
    );
    const rollbackGate = depth.items.find((item) => item.kind === "rollback-gate");
    expect(rollbackGate?.detail).toContain(
      "Expected approval phase4-provider-approval:2026-06-18T10:00:00.000Z"
    );
    expect(rollbackGate?.detail).toContain(
      "Expected audit phase4-provider-audit:2026-06-18T10:10:00.000Z"
    );
    expect(rollbackGate?.detail).toContain(
      "Expected audit evidence phase4-provider-audit-current"
    );
  });

  it("marks permission ready while provider execution remains explicitly locked", () => {
    const readiness = buildProviderIntegrationReadiness(validationFixture());
    const approvalRecord = createPhase4ProviderApprovalRecord({
      catalogFingerprint: "phase4-catalog-current",
      createdAt: "2026-06-18T10:00:00.000Z"
    });
    const approvalValidation = derivePhase4ProviderApprovalRecordValidation({
      record: approvalRecord,
      expectedCatalogFingerprint: "phase4-catalog-current",
      refreshSafety: readyRefreshSafety,
      options: { evaluatedAt: "2026-06-18T10:05:00.000Z" }
    });
    const auditRecord = createPhase4ProviderAuditRecord({
      approvalRecord,
      auditEvidenceFingerprint: "phase4-provider-audit-current",
      catalogFingerprint: "phase4-catalog-current",
      createdAt: "2026-06-18T10:10:00.000Z"
    });
    const auditValidation = derivePhase4ProviderAuditRecordValidation({
      record: auditRecord,
      approvalRecord,
      approvalValidation,
      expectedAuditEvidenceFingerprint: "phase4-provider-audit-current",
      expectedCatalogFingerprint: "phase4-catalog-current",
      options: { evaluatedAt: "2026-06-18T10:15:00.000Z" }
    });
    const rollbackRecord = createPhase4ProviderRollbackRecord({
      approvalRecord,
      auditRecord,
      catalogFingerprint: "phase4-catalog-current",
      createdAt: "2026-06-18T10:20:00.000Z",
      surfaceDepthEvidenceFingerprint: "phase4-provider-rollback-current"
    });
    const rollbackValidation = derivePhase4ProviderRollbackRecordValidation({
      record: rollbackRecord,
      approvalRecord,
      auditRecord,
      auditValidation,
      expectedCatalogFingerprint: "phase4-catalog-current",
      expectedSurfaceDepthEvidenceFingerprint: "phase4-provider-rollback-current",
      options: { evaluatedAt: "2026-06-18T10:25:00.000Z" }
    });
    const permissionRecord = createPhase4ProviderPermissionRecord({
      approvalRecord,
      auditRecord,
      rollbackRecord,
      catalogFingerprint: "phase4-catalog-current",
      createdAt: "2026-06-18T10:30:00.000Z",
      surfaceDepthEvidenceFingerprint: "phase4-provider-rollback-current",
      permissionEvidenceFingerprint: "phase4-provider-permission-current",
      providerSurfaceScopes: EXPECTED_PHASE4_PROVIDER_PERMISSION_SURFACES
    });
    const permissionValidation = derivePhase4ProviderPermissionRecordValidation({
      record: permissionRecord,
      approvalRecord,
      auditRecord,
      rollbackRecord,
      rollbackValidation,
      expectedCatalogFingerprint: "phase4-catalog-current",
      expectedSurfaceDepthEvidenceFingerprint: "phase4-provider-rollback-current",
      expectedPermissionEvidenceFingerprint: "phase4-provider-permission-current",
      options: { evaluatedAt: "2026-06-18T10:35:00.000Z" }
    });
    const depth = buildPhase4ProviderSurfaceDepth(
      readiness,
      approvalValidation,
      auditValidation,
      rollbackValidation,
      permissionValidation
    );

    expect(depth.state).toBe("ready");
    expect(depth.readiness).toBe(100);
    expect(depth.canEnableExecution).toBe(false);
    expect(depth.previewCount).toBe(0);
    expect(depth.attentionCount).toBe(0);
    expect(depth.nextSurfaceLabel).toBe("Execution lock");
    expect(depth.nextAction).toContain("provider execution locked");
    expect(depth.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Permission gate", status: "ready" }),
        expect.objectContaining({ label: "Execution lock", status: "ready" })
      ])
    );
    const permissionGate = depth.items.find((item) => item.kind === "permission-gate");
    expect(permissionGate?.detail).toContain(
      "Expected approval phase4-provider-approval:2026-06-18T10:00:00.000Z"
    );
    expect(permissionGate?.detail).toContain(
      "Expected audit phase4-provider-audit:2026-06-18T10:10:00.000Z"
    );
    expect(permissionGate?.detail).toContain(
      "Expected rollback phase4-provider-rollback:2026-06-18T10:20:00.000Z"
    );
    expect(permissionGate?.detail).toContain("Covered surfaces 6/6; missing scopes none.");
    expect(permissionGate?.ownerBoundaryProof).toContain(
      "surfaces=6/6 missingScopes=none permissionMatch=matched mutation=locked execution=locked"
    );
  });

  it("surfaces preview rows as a separate owner-review hold", () => {
    const depth = depthFromValidation(
      validationFixture({
        mcp: {
          source: "provider-preview",
          summary: {
            total: 2,
            live: 0,
            preview: 2,
            disconnected: 0,
            setupRequired: 0,
            unsupported: 0,
            unavailable: 0,
            actionable: 2,
            availability: 1
          }
        }
      })
    );

    expect(depth.state).toBe("preview");
    expect(depth.previewCount).toBe(5);
    expect(depth.nextSurfaceLabel).toBe("MCP");
    expect(depth.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Preview review", status: "preview" })
      ])
    );
  });

  it("blocks depth when provider validation has inconsistencies", () => {
    const depth = depthFromValidation(
      validationFixture({
        command: {
          pass: false,
          readiness: 0,
          state: "blocked",
          summary: {
            total: 2,
            live: 1,
            preview: 1,
            disconnected: 0,
            setupRequired: 0,
            unsupported: 0,
            unavailable: 0,
            actionable: 2,
            availability: 1
          }
        }
      })
    );

    expect(depth.state).toBe("blocked");
    expect(depth.heldCount).toBe(1);
    expect(depth.canEnableExecution).toBe(false);
    expect(depth.nextAction).toContain("validation inconsistencies");
  });
});
