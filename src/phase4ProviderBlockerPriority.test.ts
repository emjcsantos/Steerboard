import { describe, expect, it } from "vitest";
import {
  buildCatalogRefreshOwnerValidation,
  type CatalogRefreshOwnerValidationResult,
  type CatalogRefreshOwnerValidationSurfaceResult,
  type CatalogSurface
} from "./catalogRefreshOwnerValidation";
import {
  buildCatalogRefreshProviderSmoke,
  CATALOG_REFRESH_PROVIDER_SMOKE_NOT_RUN_PREVIEW
} from "./catalogRefreshProviderSmoke";
import {
  createPhase4ProviderApprovalRecord,
  derivePhase4ProviderApprovalRecordValidation,
  type Phase4ProviderApprovalRecordValidation
} from "./phase4ProviderApprovalRecord";
import {
  createPhase4ProviderAuditRecord,
  derivePhase4ProviderAuditRecordValidation,
  type Phase4ProviderAuditRecordValidation
} from "./phase4ProviderAuditRecord";
import {
  createPhase4ProviderRollbackRecord,
  derivePhase4ProviderRollbackRecordValidation,
  type Phase4ProviderRollbackRecordValidation
} from "./phase4ProviderRollbackRecord";
import {
  createPhase4ProviderPermissionRecord,
  derivePhase4ProviderPermissionRecordValidation,
  EXPECTED_PHASE4_PROVIDER_PERMISSION_SURFACES,
  type Phase4ProviderPermissionRecordValidation
} from "./phase4ProviderPermissionRecord";
import { buildPhase4ProviderBlockerPriority } from "./phase4ProviderBlockerPriority";
import { buildPhase4ProviderCatalogDepth } from "./phase4ProviderCatalogDepth";
import { buildPhase4ProviderSurfaceDepth } from "./phase4ProviderSurfaceDepth";
import { buildPhase4ProviderTraceabilitySummary } from "./phase4ProviderTraceability";
import {
  buildPhase4RefreshSafetyDepth,
  type Phase4RefreshSafetyDepthSummary
} from "./phase4RefreshSafetyDepth";
import { buildProviderIntegrationReadiness } from "./providerIntegrationReadiness";
import { remainingGoalPlan } from "./remainingGoalPlan";

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

function priority({
  validation = buildCatalogRefreshOwnerValidation(),
  smoke = CATALOG_REFRESH_PROVIDER_SMOKE_NOT_RUN_PREVIEW,
  approvalValidation,
  auditValidation,
  permissionValidation,
  rollbackValidation,
  goals
}: {
  approvalValidation?: Phase4ProviderApprovalRecordValidation;
  auditValidation?: Phase4ProviderAuditRecordValidation;
  permissionValidation?: Phase4ProviderPermissionRecordValidation;
  rollbackValidation?: Phase4ProviderRollbackRecordValidation;
  validation?: CatalogRefreshOwnerValidationResult;
  smoke?: ReturnType<typeof buildCatalogRefreshProviderSmoke>;
  goals?: typeof remainingGoalPlan;
} = {}) {
  const readiness = buildProviderIntegrationReadiness(validation);
  const catalogDepth = buildPhase4ProviderCatalogDepth(readiness);
  const refreshSafety = buildPhase4RefreshSafetyDepth(smoke);
  const surfaceDepth = buildPhase4ProviderSurfaceDepth(
    readiness,
    approvalValidation,
    auditValidation,
    rollbackValidation,
    permissionValidation
  );
  const traceability = buildPhase4ProviderTraceabilitySummary({
    catalogDepth,
    refreshSafety,
    surfaceDepth,
    goals
  });

  return buildPhase4ProviderBlockerPriority({
    catalogDepth,
    refreshSafety,
    surfaceDepth,
    traceability
  });
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

const readyApprovalRecord = createPhase4ProviderApprovalRecord({
  catalogFingerprint: "phase4-catalog-current",
  createdAt: "2026-06-18T10:00:00.000Z"
});

function readyApprovalValidation(): Phase4ProviderApprovalRecordValidation {
  return derivePhase4ProviderApprovalRecordValidation({
    record: readyApprovalRecord,
    expectedCatalogFingerprint: "phase4-catalog-current",
    refreshSafety: readyRefreshSafety,
    options: { evaluatedAt: "2026-06-18T10:05:00.000Z" }
  });
}

function readyAuditValidation(
  approvalValidation = readyApprovalValidation()
): Phase4ProviderAuditRecordValidation {
  const record = readyAuditRecord();

  return derivePhase4ProviderAuditRecordValidation({
    record,
    approvalRecord: readyApprovalRecord,
    approvalValidation,
    expectedAuditEvidenceFingerprint: "phase4-provider-audit-current",
    expectedCatalogFingerprint: "phase4-catalog-current",
    options: { evaluatedAt: "2026-06-18T10:15:00.000Z" }
  });
}

function readyAuditRecord() {
  return createPhase4ProviderAuditRecord({
    approvalRecord: readyApprovalRecord,
    auditEvidenceFingerprint: "phase4-provider-audit-current",
    catalogFingerprint: "phase4-catalog-current",
    createdAt: "2026-06-18T10:10:00.000Z"
  });
}

function readyRollbackValidation(
  auditValidation = readyAuditValidation()
): Phase4ProviderRollbackRecordValidation {
  const auditRecord = readyAuditRecord();
  const record = createPhase4ProviderRollbackRecord({
    approvalRecord: readyApprovalRecord,
    auditRecord,
    catalogFingerprint: "phase4-catalog-current",
    createdAt: "2026-06-18T10:20:00.000Z",
    surfaceDepthEvidenceFingerprint: "phase4-provider-rollback-current"
  });

  return derivePhase4ProviderRollbackRecordValidation({
    record,
    auditRecord,
    approvalRecord: readyApprovalRecord,
    auditValidation,
    expectedCatalogFingerprint: "phase4-catalog-current",
    expectedSurfaceDepthEvidenceFingerprint: "phase4-provider-rollback-current",
    options: { evaluatedAt: "2026-06-18T10:25:00.000Z" }
  });
}

function readyRollbackRecord() {
  return createPhase4ProviderRollbackRecord({
    approvalRecord: readyApprovalRecord,
    auditRecord: readyAuditRecord(),
    catalogFingerprint: "phase4-catalog-current",
    createdAt: "2026-06-18T10:20:00.000Z",
    surfaceDepthEvidenceFingerprint: "phase4-provider-rollback-current"
  });
}

function readyPermissionValidation(
  rollbackValidation = readyRollbackValidation()
): Phase4ProviderPermissionRecordValidation {
  const auditRecord = readyAuditRecord();
  const rollbackRecord = readyRollbackRecord();
  const record = createPhase4ProviderPermissionRecord({
    approvalRecord: readyApprovalRecord,
    auditRecord,
    rollbackRecord,
    catalogFingerprint: "phase4-catalog-current",
    createdAt: "2026-06-18T10:30:00.000Z",
    surfaceDepthEvidenceFingerprint: "phase4-provider-rollback-current",
    permissionEvidenceFingerprint: "phase4-provider-permission-current",
    providerSurfaceScopes: EXPECTED_PHASE4_PROVIDER_PERMISSION_SURFACES
  });

  return derivePhase4ProviderPermissionRecordValidation({
    record,
    auditRecord,
    approvalRecord: readyApprovalRecord,
    rollbackRecord,
    rollbackValidation,
    expectedCatalogFingerprint: "phase4-catalog-current",
    expectedSurfaceDepthEvidenceFingerprint: "phase4-provider-rollback-current",
    expectedPermissionEvidenceFingerprint: "phase4-provider-permission-current",
    options: { evaluatedAt: "2026-06-18T10:35:00.000Z" }
  });
}

function withCurrentActivePhase4Goal() {
  return remainingGoalPlan.map((goal) =>
    goal.id === "goal-phase-4-provider-surfaces"
      ? { ...goal, current: true, status: "active" as const }
      : goal.current
        ? { ...goal, current: false, status: "next" as const }
        : goal
  );
}

describe("phase 4 provider blocker priority", () => {
  it("ranks setup-required catalog and surface blockers ahead of preview refresh proof", () => {
    const snapshot = priority();

    expect(snapshot.state).toBe("setup-required");
    expect(snapshot.openBlockerCount).toBeGreaterThan(0);
    expect(snapshot.topPriorityLabel).toBe("Skills");
    expect(snapshot.catalogSmokeCanAddressTopBlocker).toBe(false);
    expect(snapshot.items[0]).toMatchObject({
      kind: "provider-catalog",
      status: "setup-required",
      severity: "critical",
      priority: 1
    });
    expect(snapshot.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "refresh-safety", status: "preview", canUseCatalogSmoke: true }),
        expect.objectContaining({ kind: "surface-depth", status: "setup-required" }),
        expect.objectContaining({ kind: "traceability", status: "setup-required" })
      ])
    );
  });

  it("marks a preview-only provider blocker as catalog-smoke addressable", () => {
    const snapshot = priority({
      validation: validationFixture({
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
      }),
      smoke: buildCatalogRefreshProviderSmoke(snapshotPayloads)
    });

    expect(snapshot.state).toBe("preview");
    expect(snapshot.topPriorityLabel).toBe("MCP");
    expect(snapshot.catalogSmokeCanAddressTopBlocker).toBe(true);
    expect(snapshot.nextAction).toContain("catalog smoke");
  });

  it("keeps provider review held while execution is still locked", () => {
    const snapshot = priority({
      validation: validationFixture(),
      smoke: buildCatalogRefreshProviderSmoke(snapshotPayloads)
    });

    expect(snapshot.state).toBe("preview");
    expect(snapshot.openBlockerCount).toBeGreaterThan(0);
    expect(snapshot.readiness).toBe(70);
    expect(snapshot.topPriorityLabel).toBe("Approval gate");
    expect(snapshot.topPriorityAction).toContain("owner approval gate");
    expect(snapshot.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Approval gate",
          kind: "surface-depth",
          status: "preview",
          evidenceKey: "phase-04-surface-depth:approval-gate",
          severity: "medium"
        })
      ])
    );
  });

  it("moves blocker priority to audit after current approval evidence is attached", () => {
    const approvalValidation = readyApprovalValidation();
    const snapshot = priority({
      approvalValidation,
      validation: validationFixture(),
      smoke: buildCatalogRefreshProviderSmoke(snapshotPayloads)
    });

    expect(snapshot.state).toBe("preview");
    expect(snapshot.topPriorityLabel).toBe("Audit gate");
    expect(snapshot.catalogSmokeCanAddressTopBlocker).toBe(false);
    expect(snapshot.topPriorityAction).toContain("audit persistence");
    expect(snapshot.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Audit gate",
          kind: "surface-depth",
          status: "preview",
          evidenceKey: "phase-04-surface-depth:audit-gate"
        })
      ])
    );
    expect(snapshot.items).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Approval gate",
          status: "preview"
        })
      ])
    );
  });

  it("moves blocker priority to rollback after current audit evidence is attached", () => {
    const approvalValidation = readyApprovalValidation();
    const snapshot = priority({
      approvalValidation,
      auditValidation: readyAuditValidation(approvalValidation),
      validation: validationFixture(),
      smoke: buildCatalogRefreshProviderSmoke(snapshotPayloads)
    });

    expect(snapshot.state).toBe("preview");
    expect(snapshot.topPriorityLabel).toBe("Rollback gate");
    expect(snapshot.catalogSmokeCanAddressTopBlocker).toBe(false);
    expect(snapshot.topPriorityAction).toContain("rollback owner");
    expect(snapshot.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Rollback gate",
          kind: "surface-depth",
          status: "preview",
          evidenceKey: "phase-04-surface-depth:rollback-gate"
        })
      ])
    );
    expect(snapshot.items).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Audit gate",
          status: "preview"
        })
      ])
    );
  });

  it("moves blocker priority to permission after current rollback evidence is attached", () => {
    const approvalValidation = readyApprovalValidation();
    const auditValidation = readyAuditValidation(approvalValidation);
    const snapshot = priority({
      approvalValidation,
      auditValidation,
      rollbackValidation: readyRollbackValidation(auditValidation),
      validation: validationFixture(),
      smoke: buildCatalogRefreshProviderSmoke(snapshotPayloads)
    });

    expect(snapshot.state).toBe("preview");
    expect(snapshot.topPriorityLabel).toBe("Permission gate");
    expect(snapshot.catalogSmokeCanAddressTopBlocker).toBe(false);
    expect(snapshot.topPriorityAction).toContain("permission checks");
    expect(snapshot.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Permission gate",
          kind: "surface-depth",
          status: "preview",
          evidenceKey: "phase-04-surface-depth:permission-gate"
        })
      ])
    );
    expect(snapshot.items).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Rollback gate",
          status: "preview"
        })
      ])
    );
  });

  it("keeps remaining-goal traceability blockers out of catalog-smoke actions", () => {
    const approvalValidation = readyApprovalValidation();
    const auditValidation = readyAuditValidation(approvalValidation);
    const rollbackValidation = readyRollbackValidation(auditValidation);
    const snapshot = priority({
      approvalValidation,
      auditValidation,
      rollbackValidation,
      permissionValidation: readyPermissionValidation(rollbackValidation),
      validation: validationFixture(),
      smoke: buildCatalogRefreshProviderSmoke(snapshotPayloads),
      goals: remainingGoalPlan.map((goal) =>
        goal.id === "goal-phase-3-proof-clearance"
          ? { ...goal, status: "active" as const, current: true, completionPercent: 99 }
          : goal.id === "goal-phase-4-provider-surfaces"
            ? { ...goal, status: "active" as const, current: false }
            : goal
      )
    });

    expect(snapshot.state).toBe("preview");
    expect(snapshot.topPriorityLabel).toBe("Remaining goal link");
    expect(snapshot.catalogSmokeCanAddressTopBlocker).toBe(false);
    expect(snapshot.topPriorityAction).not.toContain("catalog smoke");
    expect(snapshot.topPriorityAction).toContain("owner-visible provider readiness check");
    expect(snapshot.items[0]).toMatchObject({
      kind: "traceability",
      status: "preview",
      evidenceKey: "phase-04-traceability:active-goal",
      canUseCatalogSmoke: false
    });
  });

  it("clears open provider blockers after current permission evidence is attached and Phase 4 is active", () => {
    const approvalValidation = readyApprovalValidation();
    const auditValidation = readyAuditValidation(approvalValidation);
    const rollbackValidation = readyRollbackValidation(auditValidation);
    const snapshot = priority({
      approvalValidation,
      auditValidation,
      rollbackValidation,
      permissionValidation: readyPermissionValidation(rollbackValidation),
      validation: validationFixture(),
      smoke: buildCatalogRefreshProviderSmoke(snapshotPayloads),
      goals: withCurrentActivePhase4Goal()
    });

    expect(snapshot.state).toBe("ready");
    expect(snapshot.openBlockerCount).toBe(0);
    expect(snapshot.topPriorityLabel).toBe("No open Phase 4 provider blocker");
    expect(snapshot.catalogSmokeCanAddressTopBlocker).toBe(false);
    expect(snapshot.items).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Permission gate",
          status: "preview"
        })
      ])
    );
  });

  it("keeps blocker-priority text public-safe", () => {
    const snapshot = priority();
    const combinedText = [
      snapshot.label,
      snapshot.ariaLabel,
      snapshot.nextAction,
      snapshot.safety,
      ...snapshot.items.flatMap((item) => [
        item.label,
        item.kind,
        item.status,
        item.severity,
        item.detail,
        item.nextAction
      ])
    ].join(" ");

    expect(combinedText).not.toMatch(/[A-Za-z]:[\\/]/);
    expect(combinedText).not.toMatch(/[\\/](Users|Projects|Documents|Desktop)[\\/]/i);
    expect(combinedText).not.toContain("<");
    expect(combinedText).not.toContain(">");
  });
});
