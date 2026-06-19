import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const artifactPath = resolve("local_private", "phase4-provider-review-artifact.json");
const expectedSource = "steerboard.phase4.provider-review.v1";
const requiredSurfaceCount = 6;
const requiredSurfaceItemCount = 9;
const requiredTraceabilityCount = 6;
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

  const refreshRecords = assertArray(refreshSafety.records, "refreshSafety.records");
  if (refreshRecords.length < requiredSurfaceCount + 1) {
    throw new Error(`expected at least ${requiredSurfaceCount + 1} refresh records, found ${refreshRecords.length}`);
  }
  assertReadyRows(refreshRecords, "refreshSafety");

  const surfaceItems = assertArray(surfaceDepth.items, "surfaceDepth.items");
  if (surfaceItems.length < requiredSurfaceItemCount) {
    throw new Error(`expected at least ${requiredSurfaceItemCount} surface items, found ${surfaceItems.length}`);
  }
  assertReadyRows(surfaceItems, "surfaceDepth");
  if (surfaceDepth.canEnableExecution !== false) {
    throw new Error("surfaceDepth canEnableExecution is not false");
  }

  const traceabilityItems = assertArray(traceability.items, "traceability.items");
  if (traceabilityItems.length < requiredTraceabilityCount) {
    throw new Error(`expected at least ${requiredTraceabilityCount} traceability items, found ${traceabilityItems.length}`);
  }
  assertReadyRows(traceabilityItems, "traceability");
  if (traceability.canTrustProviderReview !== true) {
    throw new Error("traceability canTrustProviderReview is not true");
  }
  if (traceability.executionLockCount < requiredSurfaceCount) {
    throw new Error(`expected ${requiredSurfaceCount} execution locks, found ${traceability.executionLockCount}`);
  }

  if (blockerPriority.openBlockerCount !== 0) {
    throw new Error(`blockerPriority openBlockerCount is ${blockerPriority.openBlockerCount}`);
  }

  return {
    source: artifact.source,
    currentCatalogFingerprint: artifact.currentCatalogFingerprint,
    catalogRecords: catalogRecords.length,
    refreshRecords: refreshRecords.length,
    surfaceItems: surfaceItems.length,
    traceabilityItems: traceabilityItems.length,
    openBlockers: blockerPriority.openBlockerCount,
    executionLocked: surfaceDepth.canEnableExecution === false
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
