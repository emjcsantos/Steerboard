import type {
  ProviderIntegrationReadiness,
  ProviderIntegrationReadinessState
} from "./providerIntegrationReadiness";
import type { Phase4ProviderApprovalRecordValidation } from "./phase4ProviderApprovalRecord";
import type { Phase4ProviderAuditRecordValidation } from "./phase4ProviderAuditRecord";
import type { Phase4ProviderRollbackRecordValidation } from "./phase4ProviderRollbackRecord";
import type { Phase4ProviderPermissionRecordValidation } from "./phase4ProviderPermissionRecord";

export type Phase4ProviderSurfaceDepthState = ProviderIntegrationReadinessState;

export type Phase4ProviderSurfaceDepthItemKind =
  | "surface-coverage"
  | "setup-blockers"
  | "capability-gaps"
  | "preview-review"
  | "approval-gate"
  | "audit-gate"
  | "rollback-gate"
  | "permission-gate"
  | "execution-lock";

export interface Phase4ProviderSurfaceDepthItem {
  readonly id: string;
  readonly label: string;
  readonly kind: Phase4ProviderSurfaceDepthItemKind;
  readonly status: Phase4ProviderSurfaceDepthState;
  readonly evidenceKey: string;
  readonly detail: string;
  readonly ownerBoundaryProof?: string;
  readonly nextAction: string;
}

export interface Phase4ProviderSurfaceDepthSnapshot {
  readonly id: string;
  readonly label: string;
  readonly state: Phase4ProviderSurfaceDepthState;
  readonly statusLabel: string;
  readonly readiness: number;
  readonly canEnableExecution: boolean;
  readonly attentionCount: number;
  readonly readyCount: number;
  readonly previewCount: number;
  readonly setupRequiredCount: number;
  readonly heldCount: number;
  readonly nextSurfaceLabel: string;
  readonly nextAction: string;
  readonly safety: string;
  readonly ariaLabel: string;
  readonly items: readonly Phase4ProviderSurfaceDepthItem[];
}

const SNAPSHOT_ID = "phase-4-provider-surface-depth";
const SNAPSHOT_LABEL = "Phase 4 provider surface depth";
const SAFETY =
  "Phase 4 provider surface depth is metadata-only. It does not execute commands, skills, plugins, MCP tools, automations, personalization changes, network calls, profile mutations, terminal commands, or Git actions.";

const STATUS_LABELS: Record<Phase4ProviderSurfaceDepthState, string> = {
  ready: "Ready",
  preview: "Preview",
  "setup-required": "Setup required",
  blocked: "Blocked",
  unsupported: "Unsupported",
  unavailable: "Unavailable"
};

function surfaceEvidenceKey(kind: Phase4ProviderSurfaceDepthItemKind): string {
  return `phase-04-surface-depth:${kind}`;
}

function valueOrMissing(value: string | undefined): string {
  return value ?? "missing";
}

function phase4StateFromRecordValidation(
  state:
    | Phase4ProviderApprovalRecordValidation["state"]
    | Phase4ProviderAuditRecordValidation["state"]
    | Phase4ProviderRollbackRecordValidation["state"]
    | Phase4ProviderPermissionRecordValidation["state"]
): Phase4ProviderSurfaceDepthState {
  return state === "ready" ? "ready" : state === "blocked" ? "blocked" : "preview";
}

function stateWeight(state: Phase4ProviderSurfaceDepthState): number {
  switch (state) {
    case "ready":
      return 100;
    case "preview":
      return 70;
    case "setup-required":
      return 40;
    case "unsupported":
    case "unavailable":
      return 25;
    case "blocked":
    default:
      return 0;
  }
}

function resolveState(
  items: readonly Phase4ProviderSurfaceDepthItem[]
): Phase4ProviderSurfaceDepthState {
  if (items.some((item) => item.status === "blocked")) {
    return "blocked";
  }
  if (items.some((item) => item.status === "setup-required")) {
    return "setup-required";
  }
  if (items.some((item) => item.status === "unavailable")) {
    return "unavailable";
  }
  if (items.some((item) => item.status === "unsupported")) {
    return "unsupported";
  }
  if (items.some((item) => item.status === "preview")) {
    return "preview";
  }
  return "ready";
}

function scoreItems(items: readonly Phase4ProviderSurfaceDepthItem[]): number {
  if (items.length === 0) {
    return 0;
  }

  return Math.round(
    items.reduce((sum, item) => sum + stateWeight(item.status), 0) / items.length
  );
}

function firstNextAction(items: readonly Phase4ProviderSurfaceDepthItem[]): string {
  return (
    items.find((item) => item.status === "blocked")?.nextAction ??
    items.find((item) => item.status === "setup-required")?.nextAction ??
    items.find((item) => item.status === "unavailable")?.nextAction ??
    items.find((item) => item.status === "unsupported")?.nextAction ??
    items.find((item) => item.status === "preview")?.nextAction ??
    "Keep provider execution locked until approval, audit, rollback, permission, and explicit execution gates are implemented."
  );
}

function surfaceCoverageItem(
  readiness: ProviderIntegrationReadiness
): Phase4ProviderSurfaceDepthItem {
  const missingSurfaceCount = Math.max(0, 6 - readiness.surfaces.length);
  const emptySurfaceCount = readiness.surfaces.filter((surface) => surface.total === 0).length;

  if (missingSurfaceCount > 0 || emptySurfaceCount > 0) {
    return {
      id: `${SNAPSHOT_ID}:surface-coverage`,
      label: "Surface coverage",
      kind: "surface-coverage",
      status: "unavailable",
      evidenceKey: surfaceEvidenceKey("surface-coverage"),
      detail: `${readiness.surfaces.length}/6 provider surfaces are present; ${emptySurfaceCount} present surface${emptySurfaceCount === 1 ? "" : "s"} have no entries.`,
      nextAction: "Refresh or connect provider metadata until all six provider surfaces have visible rows."
    };
  }

  return {
    id: `${SNAPSHOT_ID}:surface-coverage`,
    label: "Surface coverage",
    kind: "surface-coverage",
    status: "ready",
    evidenceKey: surfaceEvidenceKey("surface-coverage"),
    detail: "Command, skill, plugin, MCP, automation, and personalization surfaces are all visible.",
    nextAction: "Keep all six surfaces visible while execution remains locked."
  };
}

function setupBlockersItem(
  readiness: ProviderIntegrationReadiness
): Phase4ProviderSurfaceDepthItem {
  if (readiness.counts.setupRequired > 0) {
    return {
      id: `${SNAPSHOT_ID}:setup-blockers`,
      label: "Setup blockers",
      kind: "setup-blockers",
      status: "setup-required",
      evidenceKey: surfaceEvidenceKey("setup-blockers"),
      detail: `${readiness.counts.setupRequired} setup-required or disconnected provider row${readiness.counts.setupRequired === 1 ? "" : "s"} remain.`,
      nextAction: "Resolve setup-required or disconnected provider rows before execution can be considered."
    };
  }

  return {
    id: `${SNAPSHOT_ID}:setup-blockers`,
    label: "Setup blockers",
    kind: "setup-blockers",
    status: "ready",
    evidenceKey: surfaceEvidenceKey("setup-blockers"),
    detail: "No setup-required or disconnected provider rows remain.",
    nextAction: "Keep setup blockers clear across refreshes."
  };
}

function capabilityGapsItem(
  readiness: ProviderIntegrationReadiness
): Phase4ProviderSurfaceDepthItem {
  if (readiness.counts.blocked > 0) {
    return {
      id: `${SNAPSHOT_ID}:capability-gaps`,
      label: "Capability gaps",
      kind: "capability-gaps",
      status: "blocked",
      evidenceKey: surfaceEvidenceKey("capability-gaps"),
      detail: `${readiness.counts.blocked} provider validation blocker${readiness.counts.blocked === 1 ? "" : "s"} remain.`,
      nextAction: "Fix provider validation inconsistencies before refreshing again or enabling execution."
    };
  }

  if (readiness.counts.unavailable > 0) {
    return {
      id: `${SNAPSHOT_ID}:capability-gaps`,
      label: "Capability gaps",
      kind: "capability-gaps",
      status: "unavailable",
      evidenceKey: surfaceEvidenceKey("capability-gaps"),
      detail: `${readiness.counts.unavailable} unavailable provider row${readiness.counts.unavailable === 1 ? "" : "s"} remain.`,
      nextAction: "Connect provider metadata or keep unavailable rows visibly held."
    };
  }

  if (readiness.counts.unsupported > 0) {
    return {
      id: `${SNAPSHOT_ID}:capability-gaps`,
      label: "Capability gaps",
      kind: "capability-gaps",
      status: "unsupported",
      evidenceKey: surfaceEvidenceKey("capability-gaps"),
      detail: `${readiness.counts.unsupported} unsupported provider row${readiness.counts.unsupported === 1 ? "" : "s"} remain.`,
      nextAction: "Document unsupported rows and replacement paths before enabling execution."
    };
  }

  return {
    id: `${SNAPSHOT_ID}:capability-gaps`,
    label: "Capability gaps",
    kind: "capability-gaps",
    status: "ready",
    evidenceKey: surfaceEvidenceKey("capability-gaps"),
    detail: "No blocked, unavailable, or unsupported provider rows remain.",
    nextAction: "Keep capability gaps clear across catalog refreshes."
  };
}

function previewReviewItem(
  readiness: ProviderIntegrationReadiness
): Phase4ProviderSurfaceDepthItem {
  if (readiness.counts.preview > 0) {
    return {
      id: `${SNAPSHOT_ID}:preview-review`,
      label: "Preview review",
      kind: "preview-review",
      status: "preview",
      evidenceKey: surfaceEvidenceKey("preview-review"),
      detail: `${readiness.counts.preview} preview provider row${readiness.counts.preview === 1 ? "" : "s"} need owner review before execution.`,
      nextAction: "Review preview rows against live provider metadata before treating them as execution-ready."
    };
  }

  return {
    id: `${SNAPSHOT_ID}:preview-review`,
    label: "Preview review",
    kind: "preview-review",
    status: "ready",
    evidenceKey: surfaceEvidenceKey("preview-review"),
    detail: "No provider rows are preview-only.",
    nextAction: "Keep preview rows at zero before execution gates are considered."
  };
}

function executionLockItem(): Phase4ProviderSurfaceDepthItem {
  return {
    id: `${SNAPSHOT_ID}:execution-lock`,
    label: "Execution lock",
    kind: "execution-lock",
    status: "ready",
    evidenceKey: surfaceEvidenceKey("execution-lock"),
    detail: "Provider execution is disabled while approval, audit, rollback, and permission gates are still separate preview holds.",
    nextAction:
      "Keep provider metadata review separate from execution readiness until approval, audit, rollback, and permission gates exist."
  };
}

function approvalGateItem(
  approvalValidation: Phase4ProviderApprovalRecordValidation | undefined
): Phase4ProviderSurfaceDepthItem {
  if (approvalValidation) {
    const status = phase4StateFromRecordValidation(approvalValidation.state);

    return {
      id: `${SNAPSHOT_ID}:approval-gate`,
      label: "Approval gate",
      kind: "approval-gate",
      status,
      evidenceKey: surfaceEvidenceKey("approval-gate"),
      detail:
        `${approvalValidation.detail} Expected catalog ${approvalValidation.expectedCatalogFingerprint ?? "missing"}, ` +
        `record catalog ${approvalValidation.recordCatalogFingerprint ?? "missing"}.`,
      ownerBoundaryProof:
        `catalog=${valueOrMissing(approvalValidation.expectedCatalogFingerprint)} ` +
        `recordCatalog=${valueOrMissing(approvalValidation.recordCatalogFingerprint)} ` +
        `${approvalValidation.refreshSafetyProof} ` +
        `catalogMatch=${approvalValidation.matchesCurrentCatalog ? "matched" : "review"} execution=locked`,
      nextAction: approvalValidation.nextAction
    };
  }

  return {
    id: `${SNAPSHOT_ID}:approval-gate`,
    label: "Approval gate",
    kind: "approval-gate",
    status: "preview",
    evidenceKey: surfaceEvidenceKey("approval-gate"),
    detail: "No explicit owner approval gate exists yet for promoting provider metadata review into provider execution.",
    nextAction: "Add an explicit owner approval gate before provider execution can leave preview."
  };
}

function auditGateItem(
  auditValidation: Phase4ProviderAuditRecordValidation | undefined
): Phase4ProviderSurfaceDepthItem {
  if (auditValidation) {
    const status = phase4StateFromRecordValidation(auditValidation.state);

    return {
      id: `${SNAPSHOT_ID}:audit-gate`,
      label: "Audit gate",
      kind: "audit-gate",
      status,
      evidenceKey: surfaceEvidenceKey("audit-gate"),
      detail:
        `${auditValidation.detail} Expected audit ${auditValidation.expectedAuditEvidenceFingerprint ?? "missing"}, ` +
        `record audit ${auditValidation.recordAuditEvidenceFingerprint ?? "missing"}.`,
      ownerBoundaryProof: auditValidation.auditChainProof,
      nextAction: auditValidation.nextAction
    };
  }

  return {
    id: `${SNAPSHOT_ID}:audit-gate`,
    label: "Audit gate",
    kind: "audit-gate",
    status: "preview",
    evidenceKey: surfaceEvidenceKey("audit-gate"),
    detail: "Provider execution has no persisted audit-review evidence for command, skill, plugin, MCP, automation, or personalization actions.",
    nextAction: "Add provider execution audit persistence before any provider action can run."
  };
}

function rollbackGateItem(
  rollbackValidation: Phase4ProviderRollbackRecordValidation | undefined
): Phase4ProviderSurfaceDepthItem {
  if (rollbackValidation) {
    const status = phase4StateFromRecordValidation(rollbackValidation.state);

    return {
      id: `${SNAPSHOT_ID}:rollback-gate`,
      label: "Rollback gate",
      kind: "rollback-gate",
      status,
      evidenceKey: surfaceEvidenceKey("rollback-gate"),
      detail:
        `${rollbackValidation.detail} Expected surface ${rollbackValidation.expectedSurfaceDepthEvidenceFingerprint ?? "missing"}, ` +
        `record surface ${rollbackValidation.recordSurfaceDepthEvidenceFingerprint ?? "missing"}. ` +
        `Expected approval ${rollbackValidation.expectedApprovalRecordId ?? "missing"}, record approval ${rollbackValidation.recordApprovalRecordId ?? "missing"}. ` +
        `Expected audit ${rollbackValidation.expectedAuditRecordId ?? "missing"}, record audit ${rollbackValidation.recordAuditRecordId ?? "missing"}. ` +
        `Expected audit evidence ${rollbackValidation.expectedAuditEvidenceFingerprint ?? "missing"}, record audit evidence ${rollbackValidation.recordAuditEvidenceFingerprint ?? "missing"}.`,
      ownerBoundaryProof: rollbackValidation.rollbackChainProof,
      nextAction: rollbackValidation.nextAction
    };
  }

  return {
    id: `${SNAPSHOT_ID}:rollback-gate`,
    label: "Rollback gate",
    kind: "rollback-gate",
    status: "preview",
    evidenceKey: surfaceEvidenceKey("rollback-gate"),
    detail: "Rollback ownership and recovery evidence are not defined for provider execution failures.",
    nextAction: "Define provider rollback owner, recovery action, and evidence capture before execution is considered."
  };
}

function permissionGateItem(
  permissionValidation: Phase4ProviderPermissionRecordValidation | undefined
): Phase4ProviderSurfaceDepthItem {
  if (permissionValidation) {
    const status = phase4StateFromRecordValidation(permissionValidation.state);
    const missingScopes = permissionValidation.missingSurfaceScopes.join(", ") || "none";

    return {
      id: `${SNAPSHOT_ID}:permission-gate`,
      label: "Permission gate",
      kind: "permission-gate",
      status,
      evidenceKey: surfaceEvidenceKey("permission-gate"),
      detail:
        `${permissionValidation.detail} Expected permission ${permissionValidation.expectedPermissionEvidenceFingerprint ?? "missing"}, ` +
        `record permission ${permissionValidation.recordPermissionEvidenceFingerprint ?? "missing"}. ` +
        `Expected approval ${permissionValidation.expectedApprovalRecordId ?? "missing"}, record approval ${permissionValidation.recordApprovalRecordId ?? "missing"}. ` +
        `Expected audit ${permissionValidation.expectedAuditRecordId ?? "missing"}, record audit ${permissionValidation.recordAuditRecordId ?? "missing"}. ` +
        `Expected rollback ${permissionValidation.expectedRollbackRecordId ?? "missing"}, record rollback ${permissionValidation.recordRollbackRecordId ?? "missing"}. ` +
        `Covered surfaces ${permissionValidation.coveredSurfaceCount}/6; missing scopes ${missingScopes}.`,
      ownerBoundaryProof: permissionValidation.permissionChainProof,
      nextAction: permissionValidation.nextAction
    };
  }

  return {
    id: `${SNAPSHOT_ID}:permission-gate`,
    label: "Permission gate",
    kind: "permission-gate",
    status: "preview",
    evidenceKey: surfaceEvidenceKey("permission-gate"),
    detail: "Provider execution permissions remain unavailable for command, skill, plugin, MCP, automation, and personalization surfaces.",
    nextAction: "Add provider permission checks that keep each surface locked until explicit approval is recorded."
  };
}

function nextSurfaceLabel(
  readiness: ProviderIntegrationReadiness,
  items: readonly Phase4ProviderSurfaceDepthItem[]
): string {
  return (
    readiness.surfaces.find((surface) => surface.state !== "ready")?.label ??
    items.find((item) => item.status !== "ready")?.label ??
    "Execution lock"
  );
}

function buildAriaLabel(
  snapshot: Omit<Phase4ProviderSurfaceDepthSnapshot, "ariaLabel">
): string {
  return (
    `${snapshot.label}: ${snapshot.statusLabel}; ${snapshot.readiness}% ready; ` +
    `${snapshot.attentionCount} attention items; next surface: ${snapshot.nextSurfaceLabel}; ` +
    `execution ${snapshot.canEnableExecution ? "enabled" : "locked"}; next action: ${snapshot.nextAction}`
  );
}

export function buildPhase4ProviderSurfaceDepth(
  readiness: ProviderIntegrationReadiness,
  approvalValidation?: Phase4ProviderApprovalRecordValidation,
  auditValidation?: Phase4ProviderAuditRecordValidation,
  rollbackValidation?: Phase4ProviderRollbackRecordValidation,
  permissionValidation?: Phase4ProviderPermissionRecordValidation
): Phase4ProviderSurfaceDepthSnapshot {
  const items = [
    surfaceCoverageItem(readiness),
    setupBlockersItem(readiness),
    capabilityGapsItem(readiness),
    previewReviewItem(readiness),
    approvalGateItem(approvalValidation),
    auditGateItem(auditValidation),
    rollbackGateItem(rollbackValidation),
    permissionGateItem(permissionValidation),
    executionLockItem()
  ];
  const state = resolveState(items);
  const readyCount = items.filter((item) => item.status === "ready").length;
  const previewCount = items.filter((item) => item.status === "preview").length;
  const setupRequiredCount = items.filter((item) => item.status === "setup-required").length;
  const heldCount = items.filter((item) =>
    item.status === "blocked" ||
    item.status === "unsupported" ||
    item.status === "unavailable"
  ).length;
  const draft = {
    id: SNAPSHOT_ID,
    label: SNAPSHOT_LABEL,
    state,
    statusLabel: STATUS_LABELS[state],
    readiness: scoreItems(items),
    canEnableExecution: false,
    attentionCount: items.length - readyCount,
    readyCount,
    previewCount,
    setupRequiredCount,
    heldCount,
    nextSurfaceLabel: nextSurfaceLabel(readiness, items),
    nextAction: firstNextAction(items),
    safety: SAFETY,
    items
  };

  return {
    ...draft,
    ariaLabel: buildAriaLabel(draft)
  };
}
