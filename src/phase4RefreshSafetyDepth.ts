import type {
  CatalogRefreshProviderSmokeResult,
  CatalogRefreshProviderSmokeSurfaceResult
} from "./catalogRefreshProviderSmoke";

export type Phase4RefreshSafetyDepthState = "ready" | "blocked" | "preview";

export type Phase4RefreshSafetyDepthKind =
  | "run-state"
  | "surface-order"
  | "validation-result"
  | "metadata-only-contract"
  | "execution-lock";

export interface Phase4RefreshSafetyDepthRecord {
  readonly id: string;
  readonly label: string;
  readonly kind: Phase4RefreshSafetyDepthKind;
  readonly status: Phase4RefreshSafetyDepthState;
  readonly statusLabel: string;
  readonly evidence: string;
  readonly nextAction: string;
}

export interface Phase4RefreshSafetyDepthSummary {
  readonly id: string;
  readonly label: string;
  readonly records: readonly Phase4RefreshSafetyDepthRecord[];
  readonly readyCount: number;
  readonly previewCount: number;
  readonly blockedCount: number;
  readonly nextAction: string;
  readonly ariaLabel: string;
}

const SUMMARY_ID = "phase-4-refresh-safety-depth";
const SUMMARY_LABEL = "Phase 4 refresh safety depth";

const STATUS_LABELS: Record<Phase4RefreshSafetyDepthState, string> = {
  ready: "Ready",
  blocked: "Blocked",
  preview: "Preview"
};

function statusLabel(status: Phase4RefreshSafetyDepthState): string {
  return STATUS_LABELS[status];
}

function surfaceNameList(surfaces: readonly CatalogRefreshProviderSmokeSurfaceResult[]): string {
  return surfaces.map((surface) => surface.surface).join(", ");
}

function runStateRecord(
  smoke: CatalogRefreshProviderSmokeResult
): Phase4RefreshSafetyDepthRecord {
  const status: Phase4RefreshSafetyDepthState = smoke.executed
    ? smoke.ok
      ? "ready"
      : "blocked"
    : "preview";

  return {
    id: `${SUMMARY_ID}:run-state`,
    label: "Refresh run state",
    kind: "run-state",
    status,
    statusLabel: statusLabel(status),
    evidence: smoke.executed
      ? `${smoke.surfaces.filter((surface) => surface.executed).length}/${smoke.surfaces.length} catalog surfaces refreshed as metadata/status proof.`
      : "Catalog refresh smoke has not run in this preview context.",
    nextAction: smoke.executed
      ? "Keep the completed metadata refresh proof attached to the owner-visible catalog smoke record."
      : "Run catalog smoke only from the explicit owner action when desktop/provider context is available."
  };
}

function surfaceOrderRecord(
  smoke: CatalogRefreshProviderSmokeResult
): Phase4RefreshSafetyDepthRecord {
  const expectedCount = 6;
  const hasAllSurfaces = smoke.surfaces.length === expectedCount;
  const status: Phase4RefreshSafetyDepthState = hasAllSurfaces ? "ready" : "blocked";

  return {
    id: `${SUMMARY_ID}:surface-order`,
    label: "Six-surface order",
    kind: "surface-order",
    status,
    statusLabel: statusLabel(status),
    evidence: `${smoke.surfaces.length}/${expectedCount} catalog surfaces are present: ${surfaceNameList(smoke.surfaces)}.`,
    nextAction: hasAllSurfaces
      ? "Keep command, skill, plugin, MCP, automation, and personalization rows visible together."
      : "Restore all six catalog surfaces before treating refresh proof as complete."
  };
}

function validationRecord(
  smoke: CatalogRefreshProviderSmokeResult
): Phase4RefreshSafetyDepthRecord {
  const status: Phase4RefreshSafetyDepthState = smoke.state;

  return {
    id: `${SUMMARY_ID}:validation-result`,
    label: "Validation result",
    kind: "validation-result",
    status,
    statusLabel: statusLabel(status),
    evidence: smoke.detail,
    nextAction:
      status === "ready"
        ? "Keep validation consistency passing before provider execution is considered."
        : status === "blocked"
          ? "Resolve catalog validation inconsistencies before refreshing again or enabling provider execution."
          : "Collect a real metadata/status refresh proof before treating provider rows as validated."
  };
}

function metadataOnlyRecord(
  smoke: CatalogRefreshProviderSmokeResult
): Phase4RefreshSafetyDepthRecord {
  const hasNoExecutionContract =
    smoke.safety.includes("must not execute") &&
    smoke.safety.includes("commands") &&
    smoke.safety.includes("MCP") &&
    smoke.safety.includes("Git");
  const status: Phase4RefreshSafetyDepthState = hasNoExecutionContract ? "ready" : "blocked";

  return {
    id: `${SUMMARY_ID}:metadata-contract`,
    label: "Metadata-only contract",
    kind: "metadata-only-contract",
    status,
    statusLabel: statusLabel(status),
    evidence: smoke.safety,
    nextAction: hasNoExecutionContract
      ? "Keep refresh limited to catalog metadata/status snapshots."
      : "Restore the no-execution safety contract before any refresh proof can count."
  };
}

function executionLockRecord(): Phase4RefreshSafetyDepthRecord {
  return {
    id: `${SUMMARY_ID}:execution-lock`,
    label: "Provider execution lock",
    kind: "execution-lock",
    status: "ready",
    statusLabel: STATUS_LABELS.ready,
    evidence:
      "Catalog refresh proof does not unlock commands, skills, plugins, MCP tools, automations, personalization/profile mutations, terminal actions, Git operations, or external actions.",
    nextAction:
      "Keep provider execution locked until explicit permission, approval, audit, rollback, and provider-specific execution gates exist."
  };
}

function firstNextAction(records: readonly Phase4RefreshSafetyDepthRecord[]): string {
  return (
    records.find((record) => record.status === "blocked")?.nextAction ??
    records.find((record) => record.status === "preview")?.nextAction ??
    "Keep refresh safety proof attached while provider execution remains locked."
  );
}

function buildAriaLabel(
  summary: Omit<Phase4RefreshSafetyDepthSummary, "ariaLabel">
): string {
  return (
    `${summary.label}: ${summary.readyCount} ready, ${summary.previewCount} preview, ` +
    `${summary.blockedCount} blocked; next action: ${summary.nextAction}`
  );
}

export function buildPhase4RefreshSafetyDepth(
  smoke: CatalogRefreshProviderSmokeResult
): Phase4RefreshSafetyDepthSummary {
  const records = [
    runStateRecord(smoke),
    surfaceOrderRecord(smoke),
    validationRecord(smoke),
    metadataOnlyRecord(smoke),
    executionLockRecord()
  ];
  const draft = {
    id: SUMMARY_ID,
    label: SUMMARY_LABEL,
    records,
    readyCount: records.filter((record) => record.status === "ready").length,
    previewCount: records.filter((record) => record.status === "preview").length,
    blockedCount: records.filter((record) => record.status === "blocked").length,
    nextAction: firstNextAction(records)
  };

  return {
    ...draft,
    ariaLabel: buildAriaLabel(draft)
  };
}
