import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const artifactPath = resolve("local_private", "phase4-provider-review-artifact.json");
const expectedSource = "steerboard.phase4.provider-review.v1";
const requiredSurfaceCount = 6;
const requiredSurfaceItemCount = 9;
const requiredTraceabilityCount = 7;
const requiredTraceabilityKinds = [
  "active-goal",
  "pm-coverage",
  "catalog-depth",
  "refresh-safety",
  "surface-depth",
  "record-chain",
  "execution-lock"
];
const requiredSurfaceOwnerBoundaryProofTerms = [
  {
    kind: "approval-gate",
    terms: ["catalog=", "recordCatalog=", "refreshSafety=ready", "catalogMatch=", "execution=locked"]
  },
  {
    kind: "audit-gate",
    terms: ["approval=", "catalog=", "auditEvidence=", "mutation=locked", "execution=locked"]
  },
  {
    kind: "rollback-gate",
    terms: ["approval=", "audit=", "auditEvidence=", "surfaceDepth=", "mutation=locked", "execution=locked"]
  },
  {
    kind: "permission-gate",
    terms: ["approval=", "audit=", "rollback=", "surfaceDepth=", "permissionEvidence=", "surfaces=", "mutation=locked", "execution=locked"]
  }
];
const requiredRefreshSmokeProofTerms = [
  "surfaces=6/6",
  "executed=6/6",
  "checkedAt=",
  "catalog=",
  "expectedCatalog=",
  "metadataOnly=locked",
  "execution=locked"
];
const requiredAuditChainProofTerms = [
  "approval=",
  "expectedApproval=",
  "catalog=",
  "expectedCatalog=",
  "auditEvidence=",
  "expectedAuditEvidence=",
  "approvalMatch=",
  "catalogMatch=",
  "auditMatch=",
  "mutation=locked",
  "execution=locked"
];
const requiredRollbackChainProofTerms = [
  "approval=",
  "expectedApproval=",
  "audit=",
  "expectedAudit=",
  "catalog=",
  "expectedCatalog=",
  "auditEvidence=",
  "expectedAuditEvidence=",
  "surfaceDepth=",
  "expectedSurfaceDepth=",
  "approvalMatch=",
  "auditMatch=",
  "auditEvidenceMatch=",
  "surfaceMatch=",
  "owner=present",
  "action=present",
  "mutation=locked",
  "execution=locked"
];
const requiredPermissionChainProofTerms = [
  "approval=",
  "expectedApproval=",
  "audit=",
  "expectedAudit=",
  "rollback=",
  "expectedRollback=",
  "catalog=",
  "expectedCatalog=",
  "auditEvidence=",
  "expectedAuditEvidence=",
  "rollbackEvidence=",
  "expectedRollbackEvidence=",
  "surfaceDepth=",
  "expectedSurfaceDepth=",
  "permissionEvidence=",
  "expectedPermissionEvidence=",
  "surfaces=6/6",
  "missingScopes=none",
  "approvalMatch=",
  "auditMatch=",
  "rollbackMatch=",
  "catalogMatch=",
  "auditEvidenceMatch=",
  "rollbackEvidenceMatch=",
  "surfaceMatch=",
  "permissionMatch=",
  "owner=present",
  "scope=present",
  "action=present",
  "mutation=locked",
  "execution=locked"
];
const requiredSurfaceDepthProofTerms = [
  "items=9/9",
  "surfaceCoverage=ready",
  "setupBlockers=ready",
  "capabilityGaps=ready",
  "previewReview=ready",
  "approval=ready",
  "audit=ready",
  "rollback=ready",
  "permission=ready",
  "executionLock=ready",
  "ownerBoundary=present",
  "canEnableExecution=locked",
  "metadataOnly=locked",
  "execution=locked"
];
const maxArtifactAgeMs = 24 * 60 * 60 * 1000;

function fail(message) {
  console.error(`Phase 4 provider review artifact check failed: ${message}`);
  process.exitCode = 1;
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertRecord(value, label) {
  if (!isRecord(value)) {
    throw new Error(`${label} is not an object`);
  }
  return value;
}

function assertNonEmptyString(value, label) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} is missing`);
  }
}

function assertArray(value, label) {
  if (!Array.isArray(value)) {
    throw new Error(`${label} is not an array`);
  }
  return value;
}

function timestampMs(value, label) {
  assertNonEmptyString(value, label);
  const ms = Date.parse(value);
  if (!Number.isFinite(ms)) {
    throw new Error(`${label} is not a valid timestamp`);
  }
  return ms;
}

function assertFresh(value, label) {
  const artifactMs = timestampMs(value, label);
  const ageMs = Date.now() - artifactMs;
  if (ageMs < 0) {
    throw new Error(`${label} is future-dated`);
  }
  if (ageMs > maxArtifactAgeMs) {
    throw new Error(`${label} is stale`);
  }
}

function assertReadyState(value, label) {
  const status = value.state ?? value.status;
  if (status !== "ready") {
    throw new Error(`${label} state is ${status}`);
  }
}

function assertReadyRows(rows, label) {
  for (const row of rows) {
    const record = assertRecord(row, `${label} row`);
    assertNonEmptyString(record.id, `${label} row id`);
    assertReadyState(record, `${label} row ${record.id}`);
  }
}

function assertReadyValidationPair(artifact, recordKey, validationKey, label) {
  const record = assertRecord(artifact[recordKey], `${label} record`);
  const validation = assertRecord(artifact[validationKey], `${label} validation`);

  assertNonEmptyString(record.id, `${label} record id`);
  assertReadyState(record, `${label} record`);
  assertReadyState(validation, `${label} validation`);
  assertNonEmptyString(validation.detail, `${label} validation detail`);
  assertNonEmptyString(validation.nextAction, `${label} validation nextAction`);

  return { record, validation };
}

function verifyArtifact(artifact) {
  assertRecord(artifact, "provider review artifact");

  if (artifact.schemaVersion !== 1) {
    throw new Error(`schemaVersion is ${artifact.schemaVersion}`);
  }
  if (artifact.source !== expectedSource) {
    throw new Error(`source is ${artifact.source}`);
  }

  assertFresh(artifact.evaluatedAt, "evaluatedAt");
  assertFresh(artifact.exportedAt, "exportedAt");
  assertNonEmptyString(artifact.currentCatalogFingerprint, "currentCatalogFingerprint");

  const catalogDepth = assertRecord(artifact.catalogDepth, "catalogDepth");
  const refreshSafety = assertRecord(artifact.refreshSafety, "refreshSafety");
  const surfaceDepth = assertRecord(artifact.surfaceDepth, "surfaceDepth");
  const traceability = assertRecord(artifact.traceability, "traceability");
  const blockerPriority = assertRecord(artifact.blockerPriority, "blockerPriority");

  assertReadyState(catalogDepth, "catalogDepth");
  assertReadyState(refreshSafety, "refreshSafety");
  assertReadyState(surfaceDepth, "surfaceDepth");
  assertReadyState(traceability, "traceability");
  assertReadyState(blockerPriority, "blockerPriority");

  const catalogRecords = assertArray(catalogDepth.records, "catalogDepth.records");
  if (catalogRecords.length < requiredSurfaceCount) {
    throw new Error(`expected at least ${requiredSurfaceCount} catalog records, found ${catalogRecords.length}`);
  }
  assertReadyRows(catalogRecords, "catalogDepth");
  for (const surface of ["command", "skill", "plugin", "mcp", "automation", "personalization"]) {
    const record = catalogRecords.find((item) => item.kind === surface);
    if (!record) {
      throw new Error(`catalogDepth is missing ${surface}`);
    }
    if (record.evidenceKey !== `phase-04-provider-catalog:${surface}`) {
      throw new Error(`catalogDepth ${surface} evidenceKey is not current`);
    }
    const itemOrder = assertArray(record.itemOrder, `catalogDepth.${surface}.itemOrder`);
    if (itemOrder.length === 0) {
      throw new Error(`catalogDepth ${surface} itemOrder is empty`);
    }
    const metadataProof = assertArray(record.metadataProof, `catalogDepth.${surface}.metadataProof`);
    if (metadataProof.length === 0) {
      throw new Error(`catalogDepth ${surface} metadataProof is empty`);
    }
    if (
      surface === "plugin" &&
      !metadataProof.some((item) => String(item).includes("surface=metadata-only"))
    ) {
      throw new Error("catalogDepth plugin metadataProof is missing metadata-only surface proof");
    }
    if (
      surface === "mcp" &&
      !metadataProof.some((item) => String(item).includes("transport=") && String(item).includes("toolPolicy="))
    ) {
      throw new Error("catalogDepth mcp metadataProof is missing transport/toolPolicy proof");
    }
    assertNonEmptyString(record.ownerSafeProof, `catalogDepth.${surface}.ownerSafeProof`);
    assertNonEmptyString(record.scopedExecutionProof, `catalogDepth.${surface}.scopedExecutionProof`);
    if (
      surface === "command" &&
      (!record.scopedExecutionProof.includes("commandScopeProof=") ||
        !record.scopedExecutionProof.includes("scopes=") ||
        !record.scopedExecutionProof.includes("execution=locked"))
    ) {
      throw new Error("catalogDepth command scopedExecutionProof is missing scope or execution lock proof");
    }
    if (
      surface === "skill" &&
      (!record.scopedExecutionProof.includes("skillInvocationProof=") ||
        !record.scopedExecutionProof.includes("source=") ||
        !record.scopedExecutionProof.includes("trigger=") ||
        !record.scopedExecutionProof.includes("invocation=") ||
        !record.scopedExecutionProof.includes("execution=locked"))
    ) {
      throw new Error("catalogDepth skill scopedExecutionProof is missing source/trigger/invocation or execution lock proof");
    }
    if (
      surface === "plugin" &&
      (!record.scopedExecutionProof.includes("pluginSurfaceProof=") ||
        !record.scopedExecutionProof.includes("surface=metadata-only") ||
        !record.scopedExecutionProof.includes("execution=locked"))
    ) {
      throw new Error("catalogDepth plugin scopedExecutionProof is missing metadata-only surface or execution lock proof");
    }
    if (
      surface === "mcp" &&
      (!record.scopedExecutionProof.includes("mcpToolPolicyProof=") ||
        !record.scopedExecutionProof.includes("transport=") ||
        !record.scopedExecutionProof.includes("toolPolicy=") ||
        !record.scopedExecutionProof.includes("execution=locked"))
    ) {
      throw new Error("catalogDepth mcp scopedExecutionProof is missing transport/toolPolicy or execution lock proof");
    }
    if (record.executionLocked !== true) {
      throw new Error(`catalogDepth ${surface} execution lock is missing`);
    }
  }

  const refreshRecords = assertArray(refreshSafety.records, "refreshSafety.records");
  if (refreshRecords.length < requiredSurfaceCount + 2) {
    throw new Error(`expected at least ${requiredSurfaceCount + 2} refresh records, found ${refreshRecords.length}`);
  }
  assertReadyRows(refreshRecords, "refreshSafety");
  if (!refreshRecords.some((record) => record.kind === "reload-safe-proof")) {
    throw new Error("refreshSafety is missing reload-safe-proof");
  }
  assertNonEmptyString(refreshSafety.refreshSmokeProof, "refreshSafety.refreshSmokeProof");
  {
    const missingTerms = requiredRefreshSmokeProofTerms.filter(
      (term) => !refreshSafety.refreshSmokeProof.includes(term)
    );
    if (missingTerms.length > 0) {
      throw new Error(`refreshSafety refreshSmokeProof is missing ${missingTerms.join(", ")}`);
    }
  }

  const surfaceItems = assertArray(surfaceDepth.items, "surfaceDepth.items");
  if (surfaceItems.length < requiredSurfaceItemCount) {
    throw new Error(`expected at least ${requiredSurfaceItemCount} surface items, found ${surfaceItems.length}`);
  }
  assertReadyRows(surfaceItems, "surfaceDepth");
  if (surfaceDepth.canEnableExecution !== false) {
    throw new Error("surfaceDepth canEnableExecution is not false");
  }
  assertNonEmptyString(surfaceDepth.surfaceDepthProof, "surfaceDepth.surfaceDepthProof");
  {
    const missingTerms = requiredSurfaceDepthProofTerms.filter(
      (term) => !surfaceDepth.surfaceDepthProof.includes(term)
    );
    if (missingTerms.length > 0) {
      throw new Error(`surfaceDepth surfaceDepthProof is missing ${missingTerms.join(", ")}`);
    }
  }
  for (const requirement of requiredSurfaceOwnerBoundaryProofTerms) {
    const item = surfaceItems.find((row) => row.kind === requirement.kind);
    if (!item) {
      throw new Error(`surfaceDepth is missing ${requirement.kind}`);
    }
    assertNonEmptyString(item.ownerBoundaryProof, `surfaceDepth.${requirement.kind}.ownerBoundaryProof`);
    const missingTerms = requirement.terms.filter((term) => !item.ownerBoundaryProof.includes(term));
    if (missingTerms.length > 0) {
      throw new Error(`surfaceDepth ${requirement.kind} ownerBoundaryProof is missing ${missingTerms.join(", ")}`);
    }
  }

  const traceabilityItems = assertArray(traceability.items, "traceability.items");
  if (traceabilityItems.length < requiredTraceabilityCount) {
    throw new Error(`expected at least ${requiredTraceabilityCount} traceability items, found ${traceabilityItems.length}`);
  }
  assertReadyRows(traceabilityItems, "traceability");
  for (const kind of requiredTraceabilityKinds) {
    if (!traceabilityItems.some((item) => item.kind === kind)) {
      throw new Error(`traceability is missing ${kind}`);
    }
  }
  if (traceability.canTrustProviderReview !== true) {
    throw new Error("traceability canTrustProviderReview is not true");
  }
  if (traceability.executionLockCount < requiredSurfaceCount) {
    throw new Error(`expected ${requiredSurfaceCount} execution locks, found ${traceability.executionLockCount}`);
  }

  if (blockerPriority.openBlockerCount !== 0) {
    throw new Error(`blockerPriority openBlockerCount is ${blockerPriority.openBlockerCount}`);
  }

  const approval = assertReadyValidationPair(
    artifact,
    "approvalRecord",
    "approvalValidation",
    "approval"
  );
  const audit = assertReadyValidationPair(
    artifact,
    "auditRecord",
    "auditValidation",
    "audit"
  );
  const rollback = assertReadyValidationPair(
    artifact,
    "rollbackRecord",
    "rollbackValidation",
    "rollback"
  );
  const permission = assertReadyValidationPair(
    artifact,
    "permissionRecord",
    "permissionValidation",
    "permission"
  );

  if (audit.record.approvalRecordId !== approval.record.id) {
    throw new Error("audit record does not reference the approval record");
  }
  assertNonEmptyString(audit.validation.auditChainProof, "audit validation auditChainProof");
  {
    const missingTerms = requiredAuditChainProofTerms.filter(
      (term) => !audit.validation.auditChainProof.includes(term)
    );
    if (missingTerms.length > 0) {
      throw new Error(`audit validation auditChainProof is missing ${missingTerms.join(", ")}`);
    }
  }
  if (rollback.record.approvalRecordId !== approval.record.id) {
    throw new Error("rollback record does not reference the approval record");
  }
  if (rollback.record.auditRecordId !== audit.record.id) {
    throw new Error("rollback record does not reference the audit record");
  }
  assertNonEmptyString(rollback.validation.rollbackChainProof, "rollback validation rollbackChainProof");
  {
    const missingTerms = requiredRollbackChainProofTerms.filter(
      (term) => !rollback.validation.rollbackChainProof.includes(term)
    );
    if (missingTerms.length > 0) {
      throw new Error(`rollback validation rollbackChainProof is missing ${missingTerms.join(", ")}`);
    }
  }
  if (permission.record.approvalRecordId !== approval.record.id) {
    throw new Error("permission record does not reference the approval record");
  }
  if (permission.record.auditRecordId !== audit.record.id) {
    throw new Error("permission record does not reference the audit record");
  }
  if (permission.record.rollbackRecordId !== rollback.record.id) {
    throw new Error("permission record does not reference the rollback record");
  }
  if (!Array.isArray(permission.record.providerSurfaceScopes) || permission.record.providerSurfaceScopes.length !== requiredSurfaceCount) {
    throw new Error("permission record does not cover all six provider surfaces");
  }
  assertNonEmptyString(permission.validation.permissionChainProof, "permission validation permissionChainProof");
  {
    const missingTerms = requiredPermissionChainProofTerms.filter(
      (term) => !permission.validation.permissionChainProof.includes(term)
    );
    if (missingTerms.length > 0) {
      throw new Error(`permission validation permissionChainProof is missing ${missingTerms.join(", ")}`);
    }
  }

  return {
    source: artifact.source,
    currentCatalogFingerprint: artifact.currentCatalogFingerprint,
    catalogRecords: catalogRecords.length,
    refreshRecords: refreshRecords.length,
    surfaceItems: surfaceItems.length,
    traceabilityItems: traceabilityItems.length,
    openBlockers: blockerPriority.openBlockerCount,
    executionLocked: surfaceDepth.canEnableExecution === false,
    localRecordsAttached: ["approval", "audit", "rollback", "permission"]
  };
}

try {
  const artifact = JSON.parse(await readFile(artifactPath, "utf8"));
  const summary = verifyArtifact(artifact);

  console.log("Phase 4 provider review artifact is ready for Owner Testing load/import.");
  console.log(JSON.stringify({ artifactPath: "local_private/phase4-provider-review-artifact.json", ...summary }, null, 2));
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}
