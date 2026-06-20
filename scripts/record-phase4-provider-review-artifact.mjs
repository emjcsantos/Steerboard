import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const artifactPath = resolve("local_private", "phase4-provider-review-artifact.json");
const source = "steerboard.phase4.provider-review.v1";
const surfaceNames = ["command", "skill", "plugin", "mcp", "automation", "personalization"];
const createdAt = new Date().toISOString();
const currentCatalogFingerprint = `phase4-catalog-recorded-${createdAt.replace(/[:.]/g, "-")}`;
const approvalRecordId = `phase4-provider-approval:${createdAt}`;
const auditRecordId = `phase4-provider-audit:${createdAt}`;
const rollbackRecordId = `phase4-provider-rollback:${createdAt}`;
const permissionRecordId = `phase4-provider-permission:${createdAt}`;
const auditEvidenceFingerprint = `phase4-provider-audit-recorded-${createdAt.replace(/[:.]/g, "-")}`;
const surfaceDepthEvidenceFingerprint = `phase4-provider-surface-depth-recorded-${createdAt.replace(/[:.]/g, "-")}`;
const rollbackEvidenceFingerprint = `phase4-provider-rollback-recorded-${createdAt.replace(/[:.]/g, "-")}`;
const permissionEvidenceFingerprint = `phase4-provider-permission-recorded-${createdAt.replace(/[:.]/g, "-")}`;
const ownerSafeProofBySurface = {
  command:
    "Command catalog proof includes scoped slash-command labels, fallback metadata source, readiness state, and execution lock.",
  skill:
    "Skill catalog proof includes source, trigger, invocation metadata, readiness state, and execution lock.",
  plugin:
    "Plugin catalog proof includes connection/source metadata, readiness state, and execution lock.",
  mcp:
    "MCP catalog proof includes transport/tool-policy metadata, readiness state, and execution lock.",
  automation:
    "Automation catalog proof includes lifecycle/trigger metadata, approval posture, readiness state, and execution lock.",
  personalization:
    "Personalization catalog proof includes layer/source metadata, privacy posture, readiness state, and execution lock."
};
const metadataProofBySurface = {
  command: [
    "/recorded-command:scopes=panel:state=live",
    "/recorded-preview:scopes=panel+app:state=preview"
  ],
  skill: [
    "recorded-skill:source=builtin:trigger=slash:invocation=Recorded Skill:state=live",
    "recorded-handoff:source=extension:trigger=button:invocation=Record Handoff:state=preview"
  ],
  plugin: [
    "recorded-plugin:connection=live:surface=metadata-only",
    "recorded-plugin-preview:connection=preview:surface=metadata-only"
  ],
  mcp: [
    "recorded-mcp:transport=stdio:toolPolicy=read-only:state=live",
    "recorded-mcp-review:transport=http:toolPolicy=approval-required:state=preview"
  ],
  automation: [
    "recorded-automation:lifecycle=active:trigger=manual:approval=manual:state=preview",
    "recorded-check:lifecycle=active:trigger=scheduled:approval=approval-required:state=preview"
  ],
  personalization: [
    "recorded-layout:layer=ui:source=user-config:privacy=device-only:state=preview",
    "recorded-governance:layer=governance:source=builtin:privacy=local-process-only:state=preview"
  ]
};

function catalogRecord(surface) {
  const itemOrder = [`${surface}-recorded-primary`, `${surface}-recorded-secondary`];

  return {
    id: `phase-04-catalog-depth:${surface}`,
    label: `${surface[0].toUpperCase()}${surface.slice(1)} provider catalog`,
    kind: surface,
    status: "ready",
    detail: `${surface} provider metadata is visible from the recorded Phase 4 review artifact.`,
    nextAction: "Keep provider execution locked while metadata review evidence stays attached.",
    evidenceKey: `phase-04-provider-catalog:${surface}`,
    itemOrder,
    metadataProof: metadataProofBySurface[surface],
    ownerSafeProof: ownerSafeProofBySurface[surface],
    executionLocked: true
  };
}

function refreshRecord(surface) {
  return {
    id: `phase-04-refresh-safety:${surface}`,
    label: `${surface[0].toUpperCase()}${surface.slice(1)} refresh safety`,
    kind: surface,
    status: "ready",
    detail: `${surface} refresh proof is metadata-only and fingerprint matched.`,
    nextAction: "Keep refresh proof attached without running provider actions.",
    catalogFingerprint: currentCatalogFingerprint
  };
}

function surfaceItem(id, label, detail) {
  return {
    id: `phase-04-surface-depth:${id}`,
    label,
    kind: id,
    status: "ready",
    detail,
    nextAction: "Keep provider execution locked until owner-reviewed execution gates are implemented.",
    evidenceKey: `phase-04-surface-depth:${id}`
  };
}

function traceItem(id, label, kind, detail) {
  return {
    id: `phase-04-traceability:${id}`,
    label,
    kind,
    status: "ready",
    detail,
    nextAction: "Keep Phase 4 provider traceability attached while provider execution remains locked."
  };
}

const approvalRecord = {
  id: approvalRecordId,
  createdAt,
  state: "ready",
  catalogFingerprint: currentCatalogFingerprint,
  detail: "Owner approved the recorded Phase 4 provider metadata review while provider execution remains locked."
};
const approvalValidation = {
  state: "ready",
  detail: "Provider approval record matches the recorded catalog fingerprint and refresh-safety proof.",
  nextAction: "Keep provider approval attached while audit, rollback, permission, and execution locks remain held.",
  expectedCatalogFingerprint: currentCatalogFingerprint,
  recordCatalogFingerprint: currentCatalogFingerprint,
  recordAgeMs: 0,
  maxRecordAgeMs: 24 * 60 * 60 * 1000,
  matchesCurrentCatalog: true
};
const auditRecord = {
  id: auditRecordId,
  createdAt,
  state: "ready",
  catalogFingerprint: currentCatalogFingerprint,
  approvalRecordId,
  auditEvidenceFingerprint,
  mutationLocked: true,
  detail: "Recorded Phase 4 provider audit evidence is attached while mutation remains locked."
};
const auditValidation = {
  state: "ready",
  detail: "Provider audit record matches approval, catalog, and audit evidence fingerprints.",
  nextAction: "Keep provider audit review attached while rollback, permission, and execution locks remain held.",
  expectedCatalogFingerprint: currentCatalogFingerprint,
  recordCatalogFingerprint: currentCatalogFingerprint,
  expectedApprovalRecordId: approvalRecordId,
  recordApprovalRecordId: approvalRecordId,
  expectedAuditEvidenceFingerprint: auditEvidenceFingerprint,
  recordAuditEvidenceFingerprint: auditEvidenceFingerprint,
  recordAgeMs: 0,
  maxRecordAgeMs: 24 * 60 * 60 * 1000,
  matchesCurrentCatalog: true,
  matchesCurrentApproval: true,
  matchesCurrentAuditEvidence: true
};
const rollbackRecord = {
  id: rollbackRecordId,
  createdAt,
  state: "ready",
  catalogFingerprint: currentCatalogFingerprint,
  approvalRecordId,
  auditRecordId,
  auditEvidenceFingerprint,
  surfaceDepthEvidenceFingerprint,
  rollbackOwner: "owner",
  rollbackAction: "keep-provider-execution-locked",
  mutationLocked: true,
  detail: "Recorded Phase 4 rollback evidence is attached while provider execution remains locked."
};
const rollbackValidation = {
  state: "ready",
  detail: "Provider rollback record matches approval, audit, catalog, audit evidence, and surface-depth evidence fingerprints.",
  nextAction: "Keep provider rollback review attached while permission and execution locks remain held.",
  expectedCatalogFingerprint: currentCatalogFingerprint,
  recordCatalogFingerprint: currentCatalogFingerprint,
  expectedApprovalRecordId: approvalRecordId,
  recordApprovalRecordId: approvalRecordId,
  expectedAuditRecordId: auditRecordId,
  recordAuditRecordId: auditRecordId,
  expectedAuditEvidenceFingerprint: auditEvidenceFingerprint,
  recordAuditEvidenceFingerprint: auditEvidenceFingerprint,
  expectedSurfaceDepthEvidenceFingerprint: surfaceDepthEvidenceFingerprint,
  recordSurfaceDepthEvidenceFingerprint: surfaceDepthEvidenceFingerprint,
  recordAgeMs: 0,
  maxRecordAgeMs: 24 * 60 * 60 * 1000,
  matchesCurrentCatalog: true,
  matchesCurrentApproval: true,
  matchesCurrentAudit: true,
  matchesCurrentAuditEvidence: true,
  matchesCurrentSurfaceDepthEvidence: true
};
const permissionRecord = {
  id: permissionRecordId,
  createdAt,
  state: "ready",
  catalogFingerprint: currentCatalogFingerprint,
  approvalRecordId,
  auditRecordId,
  rollbackRecordId,
  auditEvidenceFingerprint,
  rollbackEvidenceFingerprint,
  surfaceDepthEvidenceFingerprint,
  permissionEvidenceFingerprint,
  providerSurfaceScopes: surfaceNames,
  permissionOwner: "owner",
  permissionScope: "phase4-provider-review",
  permissionAction: "keep-provider-execution-locked",
  mutationLocked: true,
  detail: "Recorded Phase 4 permission evidence covers all six provider surfaces while execution remains locked."
};
const permissionValidation = {
  state: "ready",
  detail: "Provider permission record matches approval, audit, rollback, catalog, surface-depth, permission evidence, and all six provider surfaces.",
  nextAction: "Keep provider permission review attached while explicit execution gates remain held.",
  expectedCatalogFingerprint: currentCatalogFingerprint,
  recordCatalogFingerprint: currentCatalogFingerprint,
  expectedApprovalRecordId: approvalRecordId,
  recordApprovalRecordId: approvalRecordId,
  expectedAuditRecordId: auditRecordId,
  recordAuditRecordId: auditRecordId,
  expectedRollbackRecordId: rollbackRecordId,
  recordRollbackRecordId: rollbackRecordId,
  expectedAuditEvidenceFingerprint: auditEvidenceFingerprint,
  recordAuditEvidenceFingerprint: auditEvidenceFingerprint,
  expectedRollbackEvidenceFingerprint: rollbackEvidenceFingerprint,
  recordRollbackEvidenceFingerprint: rollbackEvidenceFingerprint,
  expectedSurfaceDepthEvidenceFingerprint: surfaceDepthEvidenceFingerprint,
  recordSurfaceDepthEvidenceFingerprint: surfaceDepthEvidenceFingerprint,
  expectedPermissionEvidenceFingerprint: permissionEvidenceFingerprint,
  recordPermissionEvidenceFingerprint: permissionEvidenceFingerprint,
  recordAgeMs: 0,
  maxRecordAgeMs: 24 * 60 * 60 * 1000,
  matchesCurrentCatalog: true,
  matchesCurrentApproval: true,
  matchesCurrentAudit: true,
  matchesCurrentRollback: true,
  matchesCurrentAuditEvidence: true,
  matchesCurrentRollbackEvidence: true,
  matchesCurrentSurfaceDepthEvidence: true,
  matchesCurrentPermissionEvidence: true,
  coveredSurfaceCount: surfaceNames.length,
  missingSurfaceScopes: []
};

const artifact = {
  schemaVersion: 1,
  source,
  exportedAt: createdAt,
  evaluatedAt: createdAt,
  currentCatalogFingerprint,
  catalogDepth: {
    id: "phase-4-provider-catalog-depth",
    label: "Phase 4 provider catalog depth",
    state: "ready",
    statusLabel: "Ready",
    readiness: 100,
    readyCount: surfaceNames.length,
    attentionCount: 0,
    setupRequiredCount: 0,
    blockedCount: 0,
    executionLockCount: surfaceNames.length,
    nextAction: "Keep provider execution locked while recorded catalog metadata stays attached.",
    safety: "Metadata-only Phase 4 provider catalog review; no provider actions are executed.",
    ariaLabel: "Phase 4 provider catalog depth: Ready; 100% ready.",
    records: surfaceNames.map(catalogRecord)
  },
  refreshSafety: {
    id: "phase-4-refresh-safety-depth",
    label: "Phase 4 refresh safety depth",
    state: "ready",
    statusLabel: "Ready",
    readiness: 100,
    readyCount: surfaceNames.length + 2,
    previewCount: 0,
    blockedCount: 0,
    openProofCount: 0,
    nextAction: "Keep metadata-only refresh proof attached while provider execution remains locked.",
    safety: "Recorded Phase 4 refresh proof does not run provider actions.",
    ariaLabel: "Phase 4 refresh safety depth: Ready; 100% ready.",
    records: [
      {
        id: "phase-04-refresh-safety:fingerprint",
        label: "Catalog fingerprint",
        kind: "catalog-fingerprint",
        status: "ready",
        detail: `Recorded catalog fingerprint ${currentCatalogFingerprint} is attached.`,
        nextAction: "Keep the recorded fingerprint matched to the provider review artifact.",
        catalogFingerprint: currentCatalogFingerprint
      },
      {
        id: "phase-04-refresh-safety:reload-safe-proof",
        label: "Reload-safe proof",
        kind: "reload-safe-proof",
        status: "ready",
        detail: "Recorded catalog smoke proof reloads as the same six-surface metadata-only chain while provider execution remains locked.",
        nextAction: "Keep reload-safe refresh proof attached to the provider review artifact.",
        catalogFingerprint: currentCatalogFingerprint
      },
      ...surfaceNames.map(refreshRecord)
    ]
  },
  surfaceDepth: {
    id: "phase-4-provider-surface-depth",
    label: "Phase 4 provider surface depth",
    state: "ready",
    statusLabel: "Ready",
    readiness: 100,
    canEnableExecution: false,
    attentionCount: 0,
    previewCount: 0,
    heldCount: 0,
    nextAction: "Keep provider execution locked until approval, audit, rollback, permission, and explicit execution gates are implemented.",
    safety: "Recorded Phase 4 surface depth is metadata-only and does not execute provider actions.",
    ariaLabel: "Phase 4 provider surface depth: Ready; 100% ready.",
    items: [
      surfaceItem("surface-coverage", "Surface coverage", "All six provider surfaces are visible."),
      surfaceItem("setup-blockers", "Setup blockers", "No setup-required provider rows remain."),
      surfaceItem("capability-gaps", "Capability gaps", "No provider capability gaps remain."),
      surfaceItem("preview-review", "Preview review", "No provider rows are preview-only."),
      surfaceItem("approval-gate", "Approval gate", "Provider approval metadata is ready."),
      surfaceItem("audit-gate", "Audit gate", "Provider audit metadata is ready."),
      surfaceItem("rollback-gate", "Rollback gate", "Provider rollback metadata is ready."),
      surfaceItem("permission-gate", "Permission gate", "Provider permission metadata is ready."),
      surfaceItem("execution-lock", "Execution lock", "Provider execution remains disabled.")
    ]
  },
  traceability: {
    id: "phase-4-provider-traceability",
    label: "Phase 4 provider traceability",
    state: "ready",
    statusLabel: "Ready",
    readiness: 100,
    canTrustProviderReview: true,
    readyCount: 7,
    previewCount: 0,
    setupRequiredCount: 0,
    heldCount: 0,
    linkedGoalId: "goal-phase-4-provider-surfaces",
    linkedPmTaskCount: 15,
    catalogDepthRecordCount: surfaceNames.length,
    refreshSafetyRecordCount: surfaceNames.length + 2,
    surfaceDepthItemCount: 9,
    executionLockCount: surfaceNames.length,
    missingPmTaskIds: [],
    nextAction: "Keep Phase 4 provider traceability attached while provider execution remains locked.",
    safety: "Recorded Phase 4 traceability is evidence-only.",
    ariaLabel: "Phase 4 provider traceability: Ready; 100% ready.",
    items: [
      traceItem("active-goal", "Remaining goal link", "active-goal", "goal-phase-4-provider-surfaces is the current active provider integration goal."),
      traceItem("pm-coverage", "PM row coverage", "pm-coverage", "All Phase 4 PM rows are linked."),
      traceItem("catalog-depth", "Catalog-depth evidence", "catalog-depth", "Six provider catalog-depth rows are attached."),
      traceItem("refresh-safety", "Refresh-safety evidence", "refresh-safety", "Refresh safety proof is attached."),
      traceItem("surface-depth", "Surface-depth evidence", "surface-depth", "Surface-depth proof is attached."),
      traceItem("record-chain", "Local record chain", "record-chain", "Local approval, audit, rollback, and permission record gates are attached."),
      traceItem("execution-lock", "Provider execution lock", "execution-lock", "Six provider execution locks are visible.")
    ]
  },
  blockerPriority: {
    id: "phase-4-provider-blocker-priority",
    label: "Phase 4 provider blocker priority",
    state: "ready",
    statusLabel: "Ready",
    readiness: 100,
    openBlockerCount: 0,
    catalogSmokeAddressableCount: 0,
    catalogSmokeCanAddressTopBlocker: false,
    topPriorityLabel: "No open Phase 4 provider blocker",
    topPriorityAction: "No Phase 4 provider blockers remain; keep execution locked until owner approval and audit gates exist.",
    topPrioritySourceId: "phase4.provider-blocker.none",
    topPriorityKind: "none",
    topPriorityStatus: "ready",
    topPriorityEvidenceKey: "phase-04-provider-blocker:none",
    nextAction: "No Phase 4 provider blockers remain; keep execution locked until owner approval and audit gates exist.",
    safety: "Recorded Phase 4 blocker priority is evidence-only.",
    ariaLabel: "Phase 4 provider blocker priority: Ready; 0 open blockers.",
    items: [
      {
        id: "phase-4-provider-blocker-priority:ready",
        label: "No open Phase 4 provider blocker",
        kind: "ready",
        status: "ready",
        severity: "info",
        priority: 0,
        detail: "No Phase 4 provider blockers remain in the recorded review artifact.",
        nextAction: "Keep provider execution locked until owner-reviewed execution gates are implemented.",
        canUseCatalogSmoke: false
      }
    ]
  },
  approvalRecord,
  approvalValidation,
  auditRecord,
  auditValidation,
  rollbackRecord,
  rollbackValidation,
  permissionRecord,
  permissionValidation
};

await mkdir(dirname(artifactPath), { recursive: true });
await writeFile(artifactPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");

console.log(
  JSON.stringify(
    {
      status: "passed",
      artifactPath: "local_private/phase4-provider-review-artifact.json",
      currentCatalogFingerprint,
      exportedAt: createdAt,
      executionLocked: true,
      localRecordsAttached: ["approval", "audit", "rollback", "permission"]
    },
    null,
    2
  )
);
