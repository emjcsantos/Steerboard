import type {
  Phase4ProviderApprovalRecord,
  Phase4ProviderApprovalRecordValidation
} from "./phase4ProviderApprovalRecord";
import type {
  Phase4ProviderAuditRecord,
  Phase4ProviderAuditRecordValidation
} from "./phase4ProviderAuditRecord";
import type { Phase4ProviderBlockerPrioritySummary } from "./phase4ProviderBlockerPriority";
import type { Phase4ProviderCatalogDepthSummary } from "./phase4ProviderCatalogDepth";
import type {
  Phase4ProviderPermissionRecord,
  Phase4ProviderPermissionRecordValidation
} from "./phase4ProviderPermissionRecord";
import type {
  Phase4ProviderRollbackRecord,
  Phase4ProviderRollbackRecordValidation
} from "./phase4ProviderRollbackRecord";
import type { Phase4ProviderSurfaceDepthSnapshot } from "./phase4ProviderSurfaceDepth";
import type { Phase4ProviderTraceabilitySummary } from "./phase4ProviderTraceability";
import type { Phase4RefreshSafetyDepthSummary } from "./phase4RefreshSafetyDepth";

export type Phase4ProviderReviewArtifactState = "ready" | "review" | "blocked" | "waiting";

export interface Phase4ProviderReviewArtifact {
  readonly schemaVersion: 1;
  readonly source: "steerboard.phase4.provider-review.v1";
  readonly exportedAt: string;
  readonly evaluatedAt: string;
  readonly currentCatalogFingerprint: string;
  readonly catalogDepth: Phase4ProviderCatalogDepthSummary;
  readonly refreshSafety: Phase4RefreshSafetyDepthSummary;
  readonly surfaceDepth: Phase4ProviderSurfaceDepthSnapshot;
  readonly traceability: Phase4ProviderTraceabilitySummary;
  readonly blockerPriority: Phase4ProviderBlockerPrioritySummary;
  readonly approvalRecord?: Phase4ProviderApprovalRecord;
  readonly approvalValidation?: Phase4ProviderApprovalRecordValidation;
  readonly auditRecord?: Phase4ProviderAuditRecord;
  readonly auditValidation?: Phase4ProviderAuditRecordValidation;
  readonly rollbackRecord?: Phase4ProviderRollbackRecord;
  readonly rollbackValidation?: Phase4ProviderRollbackRecordValidation;
  readonly permissionRecord?: Phase4ProviderPermissionRecord;
  readonly permissionValidation?: Phase4ProviderPermissionRecordValidation;
}

export interface Phase4ProviderReviewArtifactVerification {
  readonly state: Phase4ProviderReviewArtifactState;
  readonly statusLabel: string;
  readonly readiness: number;
  readonly canVerifyOffline: boolean;
  readonly detail: string;
  readonly nextAction: string;
  readonly catalogDepthRecordCount: number;
  readonly refreshSafetyRecordCount: number;
  readonly surfaceDepthItemCount: number;
  readonly traceabilityItemCount: number;
  readonly openBlockerCount: number;
  readonly executionLocked: boolean;
  readonly currentCatalogFingerprint?: string;
  readonly expectedCatalogFingerprint?: string;
  readonly matchesExpectedCatalog?: boolean;
  readonly hasApprovalRecord: boolean;
  readonly hasAuditRecord: boolean;
  readonly hasRollbackRecord: boolean;
  readonly hasPermissionRecord: boolean;
}

export interface Phase4ProviderReviewArtifactBuildInput {
  readonly exportedAt?: string;
  readonly evaluatedAt?: string;
  readonly currentCatalogFingerprint: string;
  readonly catalogDepth: Phase4ProviderCatalogDepthSummary;
  readonly refreshSafety: Phase4RefreshSafetyDepthSummary;
  readonly surfaceDepth: Phase4ProviderSurfaceDepthSnapshot;
  readonly traceability: Phase4ProviderTraceabilitySummary;
  readonly blockerPriority: Phase4ProviderBlockerPrioritySummary;
  readonly approvalRecord?: Phase4ProviderApprovalRecord;
  readonly approvalValidation?: Phase4ProviderApprovalRecordValidation;
  readonly auditRecord?: Phase4ProviderAuditRecord;
  readonly auditValidation?: Phase4ProviderAuditRecordValidation;
  readonly rollbackRecord?: Phase4ProviderRollbackRecord;
  readonly rollbackValidation?: Phase4ProviderRollbackRecordValidation;
  readonly permissionRecord?: Phase4ProviderPermissionRecord;
  readonly permissionValidation?: Phase4ProviderPermissionRecordValidation;
}

export interface Phase4ProviderReviewArtifactVerifyOptions {
  readonly verifiedAt?: string | Date;
  readonly maxArtifactAgeMs?: number;
  readonly expectedCatalogFingerprint?: string;
  readonly requireLocalRecords?: boolean;
}

const STATUS_LABELS: Record<Phase4ProviderReviewArtifactState, string> = {
  ready: "Ready",
  review: "Review",
  blocked: "Blocked",
  waiting: "Waiting"
};

const DEFAULT_MAX_ARTIFACT_AGE_MS = 24 * 60 * 60 * 1000;
const REQUIRED_PROVIDER_SURFACE_COUNT = 6;
const REQUIRED_CATALOG_SCOPED_EXECUTION_PROOF_TERMS: ReadonlyArray<{
  readonly kind: string;
  readonly terms: readonly string[];
}> = [
  {
    kind: "command",
    terms: ["commandScopeProof=", "scopes=", "execution=locked"]
  },
  {
    kind: "skill",
    terms: ["skillInvocationProof=", "source=", "trigger=", "invocation=", "execution=locked"]
  },
  {
    kind: "plugin",
    terms: ["pluginSurfaceProof=", "surface=metadata-only", "execution=locked"]
  },
  {
    kind: "mcp",
    terms: ["mcpToolPolicyProof=", "transport=", "toolPolicy=", "execution=locked"]
  }
];
const REQUIRED_REFRESH_SMOKE_PROOF_TERMS = [
  "surfaces=6/6",
  "executed=6/6",
  "checkedAt=",
  "catalog=",
  "expectedCatalog=",
  "metadataOnly=locked",
  "execution=locked"
] as const;
const REQUIRED_SURFACE_OWNER_BOUNDARY_PROOF_TERMS: ReadonlyArray<{
  readonly kind: string;
  readonly terms: readonly string[];
}> = [
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
const REQUIRED_AUDIT_CHAIN_PROOF_TERMS = [
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
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toTimestamp(value: string | Date | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const timestamp = value instanceof Date ? value.getTime() : Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : undefined;
}

function isFresh(
  createdAt: string | undefined,
  verifiedAt: string | Date | undefined,
  maxAgeMs: number
): boolean {
  const createdAtMs = toTimestamp(createdAt);
  const verifiedAtMs = verifiedAt ? toTimestamp(verifiedAt) : Date.now();

  if (createdAtMs === undefined || verifiedAtMs === undefined) {
    return false;
  }

  const ageMs = verifiedAtMs - createdAtMs;
  return ageMs >= 0 && ageMs <= maxAgeMs;
}

function counts(
  artifact: Phase4ProviderReviewArtifact | undefined,
  expectedCatalogFingerprint?: string
): Pick<
  Phase4ProviderReviewArtifactVerification,
  | "catalogDepthRecordCount"
  | "refreshSafetyRecordCount"
  | "surfaceDepthItemCount"
  | "traceabilityItemCount"
  | "openBlockerCount"
  | "executionLocked"
  | "currentCatalogFingerprint"
  | "expectedCatalogFingerprint"
  | "matchesExpectedCatalog"
  | "hasApprovalRecord"
  | "hasAuditRecord"
  | "hasRollbackRecord"
  | "hasPermissionRecord"
> {
  const currentCatalogFingerprint = artifact?.currentCatalogFingerprint.trim();
  const expectedFingerprint = expectedCatalogFingerprint?.trim();

  return {
    catalogDepthRecordCount: artifact?.catalogDepth.records.length ?? 0,
    refreshSafetyRecordCount: artifact?.refreshSafety.records.length ?? 0,
    surfaceDepthItemCount: artifact?.surfaceDepth.items.length ?? 0,
    traceabilityItemCount: artifact?.traceability.items.length ?? 0,
    openBlockerCount: artifact?.blockerPriority.openBlockerCount ?? 0,
    executionLocked: artifact ? !artifact.surfaceDepth.canEnableExecution : false,
    currentCatalogFingerprint: currentCatalogFingerprint || undefined,
    expectedCatalogFingerprint: expectedFingerprint || undefined,
    matchesExpectedCatalog:
      artifact && expectedFingerprint
        ? currentCatalogFingerprint === expectedFingerprint
        : undefined,
    hasApprovalRecord: Boolean(artifact?.approvalRecord),
    hasAuditRecord: Boolean(artifact?.auditRecord),
    hasRollbackRecord: Boolean(artifact?.rollbackRecord),
    hasPermissionRecord: Boolean(artifact?.permissionRecord)
  };
}

function result(
  state: Phase4ProviderReviewArtifactState,
  artifact: Phase4ProviderReviewArtifact | undefined,
  detail: string,
  nextAction: string,
  expectedCatalogFingerprint?: string
): Phase4ProviderReviewArtifactVerification {
  const readiness =
    state === "ready" ? 100 : state === "review" ? 70 : state === "blocked" ? 20 : 35;

  return {
    state,
    statusLabel: STATUS_LABELS[state],
    readiness,
    canVerifyOffline: state === "ready" || state === "review",
    detail,
    nextAction,
    ...counts(artifact, expectedCatalogFingerprint)
  };
}

interface ProviderReviewRecordValidationEvidence {
  readonly label: string;
  readonly record: unknown;
  readonly validation:
    | {
        readonly state: string;
        readonly detail: string;
        readonly nextAction: string;
      }
    | undefined;
}

function findRecordValidationReview(
  artifact: Phase4ProviderReviewArtifact,
  options: { readonly requireLocalRecords?: boolean } = {}
): { detail: string; nextAction: string } | undefined {
  const evidence: ProviderReviewRecordValidationEvidence[] = [
    {
      label: "approval",
      record: artifact.approvalRecord,
      validation: artifact.approvalValidation
    },
    {
      label: "audit",
      record: artifact.auditRecord,
      validation: artifact.auditValidation
    },
    {
      label: "rollback",
      record: artifact.rollbackRecord,
      validation: artifact.rollbackValidation
    },
    {
      label: "permission",
      record: artifact.permissionRecord,
      validation: artifact.permissionValidation
    }
  ];

  for (const item of evidence) {
    if (options.requireLocalRecords && !item.record && !item.validation) {
      return {
        detail: `Phase 4 recorded provider review artifact is missing ${item.label} local record evidence.`,
        nextAction: `Record and export Phase 4 provider review evidence after the ${item.label} local record and validation are attached.`
      };
    }

    if (item.record && !item.validation) {
      return {
        detail: `Phase 4 provider review artifact includes a ${item.label} record without matching validation evidence.`,
        nextAction: `Re-export Phase 4 provider review evidence after the ${item.label} record validation is visible.`
      };
    }

    if (item.validation && !item.record) {
      return {
        detail: `Phase 4 provider review artifact includes ${item.label} validation without the matching local record.`,
        nextAction: `Re-export Phase 4 provider review evidence after the ${item.label} record is attached.`
      };
    }

    if (item.record && item.validation && item.validation.state !== "ready") {
      return {
        detail: `Phase 4 provider review artifact includes a ${item.label} record that is not ready: ${item.validation.detail}`,
        nextAction: item.validation.nextAction
      };
    }
  }

  return undefined;
}

function findSurfaceOwnerBoundaryProofReview(
  artifact: Phase4ProviderReviewArtifact
): { detail: string; nextAction: string } | undefined {
  for (const requirement of REQUIRED_SURFACE_OWNER_BOUNDARY_PROOF_TERMS) {
    const item = artifact.surfaceDepth.items.find((surfaceItem) => surfaceItem.kind === requirement.kind);
    const ownerBoundaryProof = item?.ownerBoundaryProof?.trim();

    if (!item || !ownerBoundaryProof) {
      return {
        detail: `Phase 4 provider review artifact is missing ${requirement.kind} owner-boundary proof.`,
        nextAction:
          "Re-export Phase 4 provider review evidence after surface-depth rows show owner-boundary proof for approval, audit, rollback, and permission gates."
      };
    }

    const missingTerms = requirement.terms.filter((term) => !ownerBoundaryProof.includes(term));
    if (missingTerms.length > 0) {
      return {
        detail: `Phase 4 provider review artifact has incomplete ${requirement.kind} owner-boundary proof: missing ${missingTerms.join(", ")}.`,
        nextAction:
          "Re-export Phase 4 provider review evidence after the local record chain proof includes the required owner-boundary terms."
      };
    }
  }

  return undefined;
}

function findCatalogScopedExecutionProofReview(
  artifact: Phase4ProviderReviewArtifact
): { detail: string; nextAction: string } | undefined {
  for (const requirement of REQUIRED_CATALOG_SCOPED_EXECUTION_PROOF_TERMS) {
    const record = artifact.catalogDepth.records.find((catalogRecord) => catalogRecord.kind === requirement.kind);
    const scopedExecutionProof = record?.scopedExecutionProof?.trim();

    if (!record || !scopedExecutionProof) {
      return {
        detail: `Phase 4 provider review artifact is missing ${requirement.kind} scoped execution proof.`,
        nextAction:
          "Re-export Phase 4 provider review evidence after command, skill, plugin, and MCP catalog rows show scoped execution-lock proof."
      };
    }

    const missingTerms = requirement.terms.filter((term) => !scopedExecutionProof.includes(term));
    if (missingTerms.length > 0) {
      return {
      detail: `Phase 4 provider review artifact has incomplete ${requirement.kind} scoped execution proof: missing ${missingTerms.join(", ")}.`,
      nextAction:
        "Re-export Phase 4 provider review evidence after command, skill, plugin, and MCP catalog rows include the required execution-lock proof terms."
      };
    }
  }

  return undefined;
}

function findAuditValidationChainProofReview(
  artifact: Phase4ProviderReviewArtifact
): { detail: string; nextAction: string } | undefined {
  const auditChainProof = artifact.auditValidation?.auditChainProof?.trim();

  if (!artifact.auditValidation || !auditChainProof) {
    return {
      detail: "Phase 4 provider review artifact is missing audit validation chain proof.",
      nextAction:
        "Re-export Phase 4 provider review evidence after audit validation chain proof shows approval, catalog, audit evidence, mutation-lock, and execution-lock proof."
    };
  }

  const missingTerms = REQUIRED_AUDIT_CHAIN_PROOF_TERMS.filter(
    (term) => !auditChainProof.includes(term)
  );
  if (missingTerms.length > 0) {
    return {
      detail: `Phase 4 provider review artifact has incomplete audit validation chain proof: missing ${missingTerms.join(", ")}.`,
      nextAction:
        "Re-export Phase 4 provider review evidence after audit validation chain proof includes the required record-chain proof terms."
    };
  }

  return undefined;
}

function findRefreshSmokeProofReview(
  artifact: Phase4ProviderReviewArtifact
): { detail: string; nextAction: string } | undefined {
  const refreshSmokeProof = artifact.refreshSafety.refreshSmokeProof?.trim();

  if (!refreshSmokeProof) {
    return {
      detail: "Phase 4 provider review artifact is missing all-catalog refresh smoke proof.",
      nextAction:
        "Re-export Phase 4 provider review evidence after the refresh-safety summary includes all-catalog smoke proof."
    };
  }

  const missingTerms = REQUIRED_REFRESH_SMOKE_PROOF_TERMS.filter(
    (term) => !refreshSmokeProof.includes(term)
  );
  if (missingTerms.length > 0) {
    return {
      detail: `Phase 4 provider review artifact has incomplete all-catalog refresh smoke proof: missing ${missingTerms.join(", ")}.`,
      nextAction:
        "Rerun catalog smoke and re-export Phase 4 provider review evidence after the refresh proof includes surface, timestamp, fingerprint, metadata-only, and execution-lock terms."
    };
  }

  return undefined;
}

export function buildPhase4ProviderReviewArtifact(
  input: Phase4ProviderReviewArtifactBuildInput
): Phase4ProviderReviewArtifact {
  const now = new Date().toISOString();

  return {
    schemaVersion: 1,
    source: "steerboard.phase4.provider-review.v1",
    exportedAt: input.exportedAt ?? now,
    evaluatedAt: input.evaluatedAt ?? now,
    currentCatalogFingerprint: input.currentCatalogFingerprint,
    catalogDepth: input.catalogDepth,
    refreshSafety: input.refreshSafety,
    surfaceDepth: input.surfaceDepth,
    traceability: input.traceability,
    blockerPriority: input.blockerPriority,
    ...(input.approvalRecord ? { approvalRecord: input.approvalRecord } : {}),
    ...(input.approvalValidation ? { approvalValidation: input.approvalValidation } : {}),
    ...(input.auditRecord ? { auditRecord: input.auditRecord } : {}),
    ...(input.auditValidation ? { auditValidation: input.auditValidation } : {}),
    ...(input.rollbackRecord ? { rollbackRecord: input.rollbackRecord } : {}),
    ...(input.rollbackValidation ? { rollbackValidation: input.rollbackValidation } : {}),
    ...(input.permissionRecord ? { permissionRecord: input.permissionRecord } : {}),
    ...(input.permissionValidation ? { permissionValidation: input.permissionValidation } : {})
  };
}

export function serializePhase4ProviderReviewArtifact(
  artifact: Phase4ProviderReviewArtifact
): string {
  return JSON.stringify(artifact, null, 2);
}

export function parsePhase4ProviderReviewArtifact(
  serializedArtifact: string
): Phase4ProviderReviewArtifact | undefined {
  try {
    const parsed = JSON.parse(serializedArtifact);

    if (
      !isRecord(parsed) ||
      parsed.schemaVersion !== 1 ||
      parsed.source !== "steerboard.phase4.provider-review.v1" ||
      typeof parsed.exportedAt !== "string" ||
      typeof parsed.evaluatedAt !== "string" ||
      typeof parsed.currentCatalogFingerprint !== "string" ||
      !isRecord(parsed.catalogDepth) ||
      !isRecord(parsed.refreshSafety) ||
      !isRecord(parsed.surfaceDepth) ||
      !isRecord(parsed.traceability) ||
      !isRecord(parsed.blockerPriority)
    ) {
      return undefined;
    }

    return parsed as unknown as Phase4ProviderReviewArtifact;
  } catch {
    return undefined;
  }
}

export function verifyPhase4ProviderReviewArtifact(
  artifact: Phase4ProviderReviewArtifact | undefined,
  options: Phase4ProviderReviewArtifactVerifyOptions = {}
): Phase4ProviderReviewArtifactVerification {
  const expectedCatalogFingerprint = options.expectedCatalogFingerprint?.trim();

  if (!artifact) {
    return result(
      "waiting",
      undefined,
      "Phase 4 provider review artifact is missing or malformed.",
      "Export or import a Phase 4 provider review artifact before offline verification.",
      expectedCatalogFingerprint
    );
  }

  if (
    artifact.schemaVersion !== 1 ||
    artifact.source !== "steerboard.phase4.provider-review.v1"
  ) {
    return result(
      "waiting",
      artifact,
      "Phase 4 provider review artifact has an unsupported schema.",
      "Re-export the Phase 4 provider review artifact from the current Steerboard build.",
      expectedCatalogFingerprint
    );
  }

  if (
    !isFresh(
      artifact.evaluatedAt,
      options.verifiedAt,
      options.maxArtifactAgeMs ?? DEFAULT_MAX_ARTIFACT_AGE_MS
    )
  ) {
    return result(
      "review",
      artifact,
      "Phase 4 provider review artifact is stale or future-dated.",
      "Re-export Phase 4 provider review evidence from the current provider readiness state.",
      expectedCatalogFingerprint
    );
  }

  if (!artifact.currentCatalogFingerprint.trim()) {
    return result(
      "review",
      artifact,
      "Phase 4 provider review artifact is missing the current six-surface catalog fingerprint.",
      "Run the metadata-only provider catalog review, then export again with the current fingerprint attached.",
      expectedCatalogFingerprint
    );
  }

  if (
    expectedCatalogFingerprint &&
    artifact.currentCatalogFingerprint.trim() !== expectedCatalogFingerprint
  ) {
    return result(
      "review",
      artifact,
      "Phase 4 provider review artifact catalog fingerprint does not match the current six-surface catalog.",
      "Re-export Phase 4 provider review evidence after the current metadata-only provider catalog refresh.",
      expectedCatalogFingerprint
    );
  }

  if (artifact.catalogDepth.records.length < REQUIRED_PROVIDER_SURFACE_COUNT) {
    return result(
      "review",
      artifact,
      "Phase 4 provider review artifact does not include all six catalog-depth records.",
      "Export again after command, skill, plugin, MCP, automation, and personalization catalog-depth rows are visible.",
      expectedCatalogFingerprint
    );
  }

  if (artifact.refreshSafety.records.length === 0) {
    return result(
      "review",
      artifact,
      "Phase 4 provider review artifact is missing refresh-safety records.",
      "Attach metadata-only refresh-safety proof before exporting the provider review artifact.",
      expectedCatalogFingerprint
    );
  }

  if (artifact.surfaceDepth.items.length === 0 || artifact.traceability.items.length === 0) {
    return result(
      "review",
      artifact,
      "Phase 4 provider review artifact is missing surface-depth or traceability rows.",
      "Export again after Phase 4 surface-depth and traceability rows render in Owner review.",
      expectedCatalogFingerprint
    );
  }

  if (artifact.surfaceDepth.canEnableExecution) {
    return result(
      "blocked",
      artifact,
      "Phase 4 provider review artifact cannot be trusted because provider execution is enabled.",
      "Restore the provider execution lock and export metadata-only review evidence again.",
      expectedCatalogFingerprint
    );
  }

  if (artifact.traceability.executionLockCount < REQUIRED_PROVIDER_SURFACE_COUNT) {
    return result(
      "review",
      artifact,
      "Phase 4 provider review artifact is missing six provider execution locks.",
      "Keep command, skill, plugin, MCP, automation, and personalization execution locks visible before exporting.",
      expectedCatalogFingerprint
    );
  }

  if (artifact.blockerPriority.openBlockerCount > 0) {
    return result(
      "review",
      artifact,
      `Phase 4 provider review artifact is valid but still has ${artifact.blockerPriority.openBlockerCount} open blocker${artifact.blockerPriority.openBlockerCount === 1 ? "" : "s"}.`,
      artifact.blockerPriority.topPriorityAction,
      expectedCatalogFingerprint
    );
  }

  const refreshSmokeProofReview = findRefreshSmokeProofReview(artifact);
  if (refreshSmokeProofReview) {
    return result(
      "review",
      artifact,
      refreshSmokeProofReview.detail,
      refreshSmokeProofReview.nextAction,
      expectedCatalogFingerprint
    );
  }

  const catalogScopedExecutionProofReview = findCatalogScopedExecutionProofReview(artifact);
  if (catalogScopedExecutionProofReview) {
    return result(
      "review",
      artifact,
      catalogScopedExecutionProofReview.detail,
      catalogScopedExecutionProofReview.nextAction,
      expectedCatalogFingerprint
    );
  }

  const recordValidationReview = findRecordValidationReview(artifact, {
    requireLocalRecords: options.requireLocalRecords
  });
  if (recordValidationReview) {
    return result(
      "review",
      artifact,
      recordValidationReview.detail,
      recordValidationReview.nextAction,
      expectedCatalogFingerprint
    );
  }

  const auditValidationChainProofReview = findAuditValidationChainProofReview(artifact);
  if (auditValidationChainProofReview) {
    return result(
      "review",
      artifact,
      auditValidationChainProofReview.detail,
      auditValidationChainProofReview.nextAction,
      expectedCatalogFingerprint
    );
  }

  const surfaceOwnerBoundaryProofReview = findSurfaceOwnerBoundaryProofReview(artifact);
  if (surfaceOwnerBoundaryProofReview) {
    return result(
      "review",
      artifact,
      surfaceOwnerBoundaryProofReview.detail,
      surfaceOwnerBoundaryProofReview.nextAction,
      expectedCatalogFingerprint
    );
  }

  if (!artifact.traceability.canTrustProviderReview) {
    return result(
      "review",
      artifact,
      "Phase 4 provider review artifact has no open blockers, but traceability is not trusted yet.",
      artifact.traceability.nextAction,
      expectedCatalogFingerprint
    );
  }

  return result(
    "ready",
    artifact,
    "Phase 4 provider review artifact contains current catalog depth, refresh safety, surface depth, traceability, blocker priority, and execution-lock evidence.",
    "Keep the Phase 4 provider review artifact attached while provider execution remains locked.",
    expectedCatalogFingerprint
  );
}

export function verifySerializedPhase4ProviderReviewArtifact(
  serializedArtifact: string,
  options: Phase4ProviderReviewArtifactVerifyOptions = {}
): Phase4ProviderReviewArtifactVerification {
  return verifyPhase4ProviderReviewArtifact(
    parsePhase4ProviderReviewArtifact(serializedArtifact),
    options
  );
}

export function verifyRecordedPhase4ProviderReviewArtifact(
  serializedArtifact: string,
  options: Omit<Phase4ProviderReviewArtifactVerifyOptions, "expectedCatalogFingerprint"> = {}
): Phase4ProviderReviewArtifactVerification {
  const artifact = parsePhase4ProviderReviewArtifact(serializedArtifact);

  return verifyPhase4ProviderReviewArtifact(artifact, {
    ...options,
    expectedCatalogFingerprint: artifact?.currentCatalogFingerprint,
    requireLocalRecords: true
  });
}
