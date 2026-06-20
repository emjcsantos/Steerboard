import { afterEach, describe, expect, it, vi } from "vitest";
import type { Phase4RefreshSafetyDepthSummary } from "./phase4RefreshSafetyDepth";
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
  clearPhase4ProviderPermissionRecord,
  createPhase4ProviderPermissionRecord,
  derivePhase4ProviderPermissionRecordValidation,
  EXPECTED_PHASE4_PROVIDER_PERMISSION_SURFACES,
  loadPhase4ProviderPermissionRecord,
  parseStoredPhase4ProviderPermissionRecord,
  PHASE4_PROVIDER_PERMISSION_RECORD_STORAGE_KEY,
  savePhase4ProviderPermissionRecord
} from "./phase4ProviderPermissionRecord";

const readyRefreshSafety: Phase4RefreshSafetyDepthSummary = {
  id: "phase-4-refresh-safety-depth",
  label: "Phase 4 refresh safety depth",
  records: [],
  readyCount: 7,
  previewCount: 0,
  blockedCount: 0,
  refreshSmokeProof:
    "surfaces=6/6 executed=6/6 ready=6 preview=0 blocked=0 checkedAt=2026-06-18T00:00:00.000Z catalog=phase4-catalog-current expectedCatalog=phase4-catalog-current metadataOnly=locked execution=locked",
  refreshSafetyDepthProof:
    "records=8/8 ready=7 preview=0 blocked=0 refreshSmoke=present reloadSafe=ready checkedAt=present fingerprint=present command=ready skill=ready plugin=ready mcp=ready automation=ready personalization=ready metadataOnly=locked execution=locked",
  nextAction: "Keep refresh safety attached.",
  ariaLabel: "Refresh safety ready."
};

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

function permissionRecord() {
  return createPhase4ProviderPermissionRecord({
    approvalRecord,
    auditRecord,
    rollbackRecord,
    catalogFingerprint: "phase4-catalog-current",
    createdAt: "2026-06-18T10:30:00.000Z",
    surfaceDepthEvidenceFingerprint: "phase4-provider-rollback-current",
    permissionEvidenceFingerprint: "phase4-provider-permission-current",
    providerSurfaceScopes: EXPECTED_PHASE4_PROVIDER_PERMISSION_SURFACES
  });
}

function validate(record = permissionRecord()) {
  return derivePhase4ProviderPermissionRecordValidation({
    record,
    approvalRecord,
    auditRecord,
    rollbackRecord,
    rollbackValidation,
    expectedCatalogFingerprint: "phase4-catalog-current",
    expectedSurfaceDepthEvidenceFingerprint: "phase4-provider-rollback-current",
    expectedPermissionEvidenceFingerprint: "phase4-provider-permission-current",
    options: { evaluatedAt: "2026-06-18T10:35:00.000Z" }
  });
}

describe("phase 4 provider permission record", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("creates metadata-only permission evidence for all six provider surfaces", () => {
    expect(permissionRecord()).toEqual({
      id: "phase4-provider-permission:2026-06-18T10:30:00.000Z",
      createdAt: "2026-06-18T10:30:00.000Z",
      state: "ready",
      catalogFingerprint: "phase4-catalog-current",
      approvalRecordId: "phase4-provider-approval:2026-06-18T10:00:00.000Z",
      auditRecordId: "phase4-provider-audit:2026-06-18T10:10:00.000Z",
      rollbackRecordId: "phase4-provider-rollback:2026-06-18T10:20:00.000Z",
      auditEvidenceFingerprint: "phase4-provider-audit-current",
      rollbackEvidenceFingerprint: "phase4-provider-rollback-current",
      surfaceDepthEvidenceFingerprint: "phase4-provider-rollback-current",
      permissionEvidenceFingerprint: "phase4-provider-permission-current",
      providerSurfaceScopes: EXPECTED_PHASE4_PROVIDER_PERMISSION_SURFACES,
      permissionOwner: "Owner",
      permissionScope:
        "Command, skill, plugin, MCP, automation, and personalization metadata permission review; provider execution remains locked.",
      permissionAction:
        "Keep provider execution locked until explicit execution gates are implemented.",
      mutationLocked: true,
      detail:
        "Owner reviewed Phase 4 provider permissions while provider execution remains locked."
    });
  });

  it("validates fresh records tied to the current approval, audit, rollback, catalog, and permission evidence", () => {
    const validation = validate();

    expect(validation).toMatchObject({
      state: "ready",
      matchesCurrentCatalog: true,
      matchesCurrentApproval: true,
      matchesCurrentAudit: true,
      matchesCurrentRollback: true,
      matchesCurrentAuditEvidence: true,
      matchesCurrentRollbackEvidence: true,
      matchesCurrentSurfaceDepthEvidence: true,
      matchesCurrentPermissionEvidence: true,
      mutationLocked: true,
      coveredSurfaceCount: 6,
      missingSurfaceScopes: [],
      recordAgeMs: 300_000,
      permissionChainProof: expect.stringContaining(
        "approvalMatch=matched auditMatch=matched rollbackMatch=matched catalogMatch=matched"
      )
    });
    expect(validation.permissionChainProof).toContain("rollbackValidation=ready rollbackChain=present");
    expect(validation.permissionChainProof).toContain(
      "recordFreshness=fresh owner=present scope=present action=present mutation=locked execution=locked"
    );
  });

  it("returns preview when no permission record is attached", () => {
    const validation = derivePhase4ProviderPermissionRecordValidation({
      approvalRecord,
      auditRecord,
      rollbackRecord,
      rollbackValidation,
      expectedCatalogFingerprint: "phase4-catalog-current",
      expectedSurfaceDepthEvidenceFingerprint: "phase4-provider-rollback-current",
      expectedPermissionEvidenceFingerprint: "phase4-provider-permission-current",
      options: { evaluatedAt: "2026-06-18T10:35:00.000Z" }
    });

    expect(validation).toMatchObject({
      state: "preview",
      detail: expect.stringContaining("not attached"),
      matchesCurrentCatalog: false,
      matchesCurrentApproval: false,
      matchesCurrentAudit: false,
      matchesCurrentRollback: false,
      matchesCurrentPermissionEvidence: false,
      mutationLocked: false,
      missingSurfaceScopes: EXPECTED_PHASE4_PROVIDER_PERMISSION_SURFACES
    });
    expect(validation.permissionChainProof).toContain("rollbackValidation=ready rollbackChain=present");
    expect(validation.permissionChainProof).toContain(
      "recordFreshness=missing owner=review scope=review action=review mutation=review execution=locked"
    );
  });

  it("reviews stale, future-dated, mismatched, incomplete, and mutation-unlocked permission records", () => {
    const record = permissionRecord();

    expect(validate({ ...record, catalogFingerprint: "phase4-catalog-other" })).toMatchObject({
      state: "review",
      detail: expect.stringContaining("catalog")
    });
    expect(validate({ ...record, approvalRecordId: "old-approval" })).toMatchObject({
      state: "review",
      detail: expect.stringContaining("approval")
    });
    expect(validate({ ...record, auditRecordId: "old-audit" })).toMatchObject({
      state: "review",
      detail: expect.stringContaining("approval, audit, and rollback")
    });
    expect(validate({ ...record, rollbackRecordId: "old-rollback" })).toMatchObject({
      state: "review",
      detail: expect.stringContaining("approval, audit, and rollback")
    });
    expect(validate({ ...record, auditEvidenceFingerprint: "old-audit-evidence" })).toMatchObject({
      state: "review",
      detail: expect.stringContaining("audit and rollback evidence")
    });
    expect(validate({ ...record, rollbackEvidenceFingerprint: "old-rollback-evidence" })).toMatchObject({
      state: "review",
      detail: expect.stringContaining("audit and rollback evidence")
    });
    expect(validate({ ...record, surfaceDepthEvidenceFingerprint: "old-surface" })).toMatchObject({
      state: "review",
      detail: expect.stringContaining("surface-depth")
    });
    expect(validate({ ...record, permissionEvidenceFingerprint: "old-permission" })).toMatchObject({
      state: "review",
      detail: expect.stringContaining("surface-depth")
    });
    expect(
      validate({
        ...record,
        providerSurfaceScopes: EXPECTED_PHASE4_PROVIDER_PERMISSION_SURFACES.filter(
          (surface) => surface !== "mcp"
        )
      })
    ).toMatchObject({
      state: "review",
      detail: expect.stringContaining("every provider surface scope"),
      missingSurfaceScopes: ["mcp"]
    });
    expect(validate({ ...record, permissionOwner: "" })).toMatchObject({
      state: "review",
      detail: expect.stringContaining("owner, scope, or action")
    });
    expect(validate({ ...record, mutationLocked: false })).toMatchObject({
      state: "review",
      detail: expect.stringContaining("mutation lock"),
      mutationLocked: false,
      permissionChainProof: expect.stringContaining("mutation=review execution=locked")
    });
    expect(
      derivePhase4ProviderPermissionRecordValidation({
        record,
        approvalRecord,
        auditRecord,
        rollbackRecord,
        rollbackValidation,
        expectedCatalogFingerprint: "phase4-catalog-current",
        expectedSurfaceDepthEvidenceFingerprint: "phase4-provider-rollback-current",
        expectedPermissionEvidenceFingerprint: "phase4-provider-permission-current",
        options: {
          evaluatedAt: "2026-06-19T10:30:01.000Z",
          maxRecordAgeMs: 24 * 60 * 60 * 1000
        }
      })
    ).toMatchObject({
      state: "review",
      detail: expect.stringContaining("stale"),
      permissionChainProof: expect.stringContaining("recordFreshness=review")
    });
    expect(
      derivePhase4ProviderPermissionRecordValidation({
        record,
        approvalRecord,
        auditRecord,
        rollbackRecord,
        rollbackValidation,
        expectedCatalogFingerprint: "phase4-catalog-current",
        expectedSurfaceDepthEvidenceFingerprint: "phase4-provider-rollback-current",
        expectedPermissionEvidenceFingerprint: "phase4-provider-permission-current",
        options: { evaluatedAt: "2026-06-18T10:29:00.000Z" }
      })
    ).toMatchObject({ state: "review", detail: expect.stringContaining("future-dated") });
  });

  it("holds permission review until rollback evidence is ready", () => {
    expect(
      derivePhase4ProviderPermissionRecordValidation({
        record: permissionRecord(),
        approvalRecord,
        auditRecord,
        rollbackRecord,
        rollbackValidation: { ...rollbackValidation, state: "preview" },
        expectedCatalogFingerprint: "phase4-catalog-current",
        expectedSurfaceDepthEvidenceFingerprint: "phase4-provider-rollback-current",
        expectedPermissionEvidenceFingerprint: "phase4-provider-permission-current",
        options: { evaluatedAt: "2026-06-18T10:35:00.000Z" }
      })
    ).toMatchObject({
      state: "review",
      detail: expect.stringContaining("rollback evidence is ready")
    });
  });

  it("parses public-safe records and rejects malformed storage", () => {
    const parsed = parseStoredPhase4ProviderPermissionRecord(
      JSON.stringify({
        ...permissionRecord(),
        id: " phase4-permission ",
        state: "READY",
        catalogFingerprint: "phase4-C:\\Users\\MJ\\Projects\\ProjectAtlas\\secret",
        permissionOwner: "Owner <unsafe>",
        permissionAction: "Open C:\\Users\\MJ\\Desktop\\secret.md with token sk-ABCDEF1234567890"
      })
    );

    expect(parsed).toMatchObject({
      id: "phase4-permission",
      state: "ready",
      catalogFingerprint: "phase4-local path",
      permissionOwner: "Owner unsafe",
      providerSurfaceScopes: EXPECTED_PHASE4_PROVIDER_PERMISSION_SURFACES
    });
    expect(parsed?.permissionAction).not.toContain("sk-ABCDEF1234567890");
    expect(parsed?.permissionOwner).not.toContain("<");
    expect(parseStoredPhase4ProviderPermissionRecord("{")).toBeUndefined();
    expect(parseStoredPhase4ProviderPermissionRecord(JSON.stringify([]))).toBeUndefined();
    expect(
      parseStoredPhase4ProviderPermissionRecord(
        JSON.stringify({ ...permissionRecord(), providerSurfaceScopes: [] })
      )
    ).toBeUndefined();
  });

  it("saves, loads, and clears through localStorage", () => {
    const store = new Map<string, string>();
    const localStorage = {
      getItem: vi.fn((key: string) => store.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => {
        store.set(key, value);
      }),
      removeItem: vi.fn((key: string) => {
        store.delete(key);
      })
    };
    vi.stubGlobal("window", { localStorage });
    const record = permissionRecord();

    savePhase4ProviderPermissionRecord(record);
    expect(localStorage.setItem).toHaveBeenCalledWith(
      PHASE4_PROVIDER_PERMISSION_RECORD_STORAGE_KEY,
      JSON.stringify(record)
    );
    expect(loadPhase4ProviderPermissionRecord()).toEqual(record);

    clearPhase4ProviderPermissionRecord();
    expect(localStorage.removeItem).toHaveBeenCalledWith(
      PHASE4_PROVIDER_PERMISSION_RECORD_STORAGE_KEY
    );
    expect(loadPhase4ProviderPermissionRecord()).toBeUndefined();
  });
});
