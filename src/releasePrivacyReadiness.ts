import type {
  SecurityPrivacyThreatModel,
  SecurityPrivacyThreatModelCheck
} from "./securityPrivacyThreatModel";

export type ReleasePrivacyReadinessState = "ready" | "review" | "blocked" | "waiting";
export type ReleasePrivacyReadinessItemStatus = ReleasePrivacyReadinessState;

export interface ReleasePrivacyReadinessItem {
  id: string;
  label: string;
  status: ReleasePrivacyReadinessItemStatus;
  detail: string;
}

export interface ReleasePrivacyReadinessSnapshot {
  id: string;
  label: string;
  state: ReleasePrivacyReadinessState;
  statusLabel: string;
  readiness: number;
  canRecommendRelease: boolean;
  detail: string;
  safety: string;
  items: ReleasePrivacyReadinessItem[];
  ariaLabel: string;
}

export type ReleasePrivacyEvidenceState =
  | boolean
  | "ready"
  | "review"
  | "blocked";

export interface ReleasePrivacyEvidence {
  localFirstDefaultsReady?: ReleasePrivacyEvidenceState;
  dependencyReviewReady?: ReleasePrivacyEvidenceState;
  publicFixtureReady?: ReleasePrivacyEvidenceState;
  realProjectDataReady?: ReleasePrivacyEvidenceState;
  runtimeAdapterEdgeCasesReady?: ReleasePrivacyEvidenceState;
  auditExportReviewReady?: ReleasePrivacyEvidenceState;
}

const SNAPSHOT_ID = "release-privacy-readiness";
const SNAPSHOT_LABEL = "Release privacy readiness";
const READY_READINESS_POINT = 20;
const REVIEW_READINESS_POINT = 10;

const STATUS_LABELS: Record<ReleasePrivacyReadinessState, string> = {
  ready: "Ready",
  review: "Needs review",
  blocked: "Blocked",
  waiting: "Waiting"
};

function readinessForStatus(
  status: ReleasePrivacyReadinessItemStatus
): number {
  if (status === "ready") {
    return READY_READINESS_POINT;
  }

  if (status === "review") {
    return REVIEW_READINESS_POINT;
  }

  return 0;
}

function buildSnapshotDetail(state: ReleasePrivacyReadinessState): string {
  if (state === "ready") {
    return "All release privacy checks are ready for release recommendation.";
  }

  if (state === "review") {
    return "Release privacy readiness needs review before release recommendation.";
  }

  if (state === "blocked") {
    return "Resolve blocked release privacy checks before recommending release.";
  }

  return "Release privacy readiness is waiting on threat-model and evidence inputs.";
}

function normalizeGateState(
  value?: ReleasePrivacyEvidenceState
): ReleasePrivacyReadinessItemStatus | "missing" {
  if (value === undefined) {
    return "missing";
  }

  if (typeof value === "boolean") {
    return value ? "ready" : "blocked";
  }

  return value;
}

function resolveLocalFirstDefaults(
  evidence?: ReleasePrivacyEvidence
): ReleasePrivacyReadinessItemStatus {
  const status = normalizeGateState(evidence?.localFirstDefaultsReady);
  return status === "missing" ? "waiting" : status;
}

function resolveThreatModelCheck(
  threatModel: SecurityPrivacyThreatModel | undefined,
  label: string
): ReleasePrivacyReadinessItemStatus {
  const check = threatModel?.checks.find((item: SecurityPrivacyThreatModelCheck) => item.label === label);

  if (check === undefined || check.tone === "neutral") {
    return "waiting";
  }

  if (check.tone === "blocked") {
    return "blocked";
  }

  return check.tone === "ok" ? "ready" : "review";
}

function resolveDependencyAndFixtureSafety(
  evidence?: ReleasePrivacyEvidence
): ReleasePrivacyReadinessItemStatus {
  const dependencyStatus = normalizeGateState(evidence?.dependencyReviewReady);
  const fixtureStatus = normalizeGateState(evidence?.publicFixtureReady);

  if (
    dependencyStatus === "missing" &&
    fixtureStatus === "missing"
  ) {
    return "waiting";
  }

  if (dependencyStatus === "blocked" || fixtureStatus === "blocked") {
    return "blocked";
  }

  if (dependencyStatus === "ready" && fixtureStatus === "ready") {
    return "ready";
  }

  if (dependencyStatus === "review" || fixtureStatus === "review") {
    return "review";
  }

  return "waiting";
}

function resolveEdgeAwareStatus(
  coreStatus: ReleasePrivacyReadinessItemStatus,
  edgeStatus: ReleasePrivacyEvidenceState | undefined,
  hasThreatModel: boolean
): ReleasePrivacyReadinessItemStatus {
  const edge = normalizeGateState(edgeStatus);

  if (coreStatus === "blocked" || edge === "blocked") {
    return "blocked";
  }

  if (coreStatus === "ready" && edge === "ready") {
    return "ready";
  }

  if (edge === "ready") {
    return coreStatus;
  }

  if (coreStatus === "ready") {
    return hasThreatModel ? "review" : "waiting";
  }

  return hasThreatModel ? "review" : "waiting";
}

function resolveAuditAndExportTrail(
  threatModel?: SecurityPrivacyThreatModel,
  evidence?: ReleasePrivacyEvidence
): ReleasePrivacyReadinessItemStatus {
  const coreStatus = resolveThreatModelCheck(threatModel, "Audit trail");

  return resolveEdgeAwareStatus(
    coreStatus,
    evidence?.auditExportReviewReady,
    threatModel !== undefined
  );
}

function resolveSensitiveDataBoundary(
  threatModel?: SecurityPrivacyThreatModel,
  evidence?: ReleasePrivacyEvidence
): ReleasePrivacyReadinessItemStatus {
  const coreStatus = resolveThreatModelCheck(threatModel, "Data boundary");

  return resolveEdgeAwareStatus(
    coreStatus,
    evidence?.realProjectDataReady,
    threatModel !== undefined
  );
}

function resolvePermissionAndExecutionWithEdgeCases(
  threatModel?: SecurityPrivacyThreatModel,
  evidence?: ReleasePrivacyEvidence
): ReleasePrivacyReadinessItemStatus {
  const permission = resolveThreatModelCheck(threatModel, "Permission gates");
  const execution = resolveThreatModelCheck(threatModel, "Execution lock");

  const coreStatus =
    permission === "blocked" || execution === "blocked"
      ? "blocked"
      : permission === "ready" && execution === "ready"
        ? "ready"
        : permission === "waiting" || execution === "waiting"
          ? "waiting"
          : "review";

  return resolveEdgeAwareStatus(
    coreStatus,
    evidence?.runtimeAdapterEdgeCasesReady,
    threatModel !== undefined
  );
}

function summarizeReadiness(items: ReleasePrivacyReadinessItem[]): number {
  return items.reduce((acc, item) => acc + readinessForStatus(item.status), 0);
}

function hasBlocked(items: ReleasePrivacyReadinessItem[]): boolean {
  return items.some((item) => item.status === "blocked");
}

function allReady(items: ReleasePrivacyReadinessItem[]): boolean {
  return items.every((item) => item.status === "ready");
}

function resolveSnapshotState(
  hasInputs: boolean,
  items: ReleasePrivacyReadinessItem[]
): ReleasePrivacyReadinessState {
  if (!hasInputs) {
    return "waiting";
  }

  if (hasBlocked(items)) {
    return "blocked";
  }

  if (allReady(items)) {
    return "ready";
  }

  return "review";
}

export function createReleasePrivacyReadiness(
  threatModel?: SecurityPrivacyThreatModel,
  evidence?: ReleasePrivacyEvidence
): ReleasePrivacyReadinessSnapshot {
  const hasInputs = threatModel !== undefined || evidence !== undefined;

  const localFirstDefaultsStatus = resolveLocalFirstDefaults(evidence);
  const sensitiveDataBoundaryStatus = resolveSensitiveDataBoundary(
    threatModel,
    evidence
  );
  const permissionAndExecutionStatus = resolvePermissionAndExecutionWithEdgeCases(
    threatModel,
    evidence
  );
  const dependencyFixtureStatus = resolveDependencyAndFixtureSafety(evidence);
  const auditAndExportStatus = resolveAuditAndExportTrail(
    threatModel,
    evidence
  );

  const items: ReleasePrivacyReadinessItem[] = [
    {
      id: `${SNAPSHOT_ID}:local-first-defaults`,
      label: "Local-first defaults",
      status: localFirstDefaultsStatus,
      detail: `Local-first defaults are ${localFirstDefaultsStatus}.`
    },
    {
      id: `${SNAPSHOT_ID}:sensitive-data-boundary`,
      label: "Sensitive data boundary",
      status: sensitiveDataBoundaryStatus,
      detail:
        `Sensitive data boundary check and real project data readiness are ${sensitiveDataBoundaryStatus}.`
    },
    {
      id: `${SNAPSHOT_ID}:permission-and-execution-lock`,
      label: "Permission and execution lock",
      status: permissionAndExecutionStatus,
      detail:
        `Permission and execution lock checks plus runtime adapter edge cases are ${permissionAndExecutionStatus}.`
    },
    {
      id: `${SNAPSHOT_ID}:dependency-and-fixture-safety`,
      label: "Dependency and fixture safety",
      status: dependencyFixtureStatus,
      detail: `Dependency and fixture safety are ${dependencyFixtureStatus}.`
    },
    {
      id: `${SNAPSHOT_ID}:audit-and-export-trail`,
      label: "Audit and export trail",
      status: auditAndExportStatus,
      detail:
        `Audit and export trail check plus audit/export review are ${auditAndExportStatus}.`
    }
  ];

  const state = resolveSnapshotState(hasInputs, items);
  const readiness = summarizeReadiness(items);

  return {
    id: SNAPSHOT_ID,
    label: SNAPSHOT_LABEL,
    state,
    statusLabel: STATUS_LABELS[state],
    readiness,
    canRecommendRelease: state === "ready",
    detail: buildSnapshotDetail(state),
    safety:
      "No filesystem action, process action, release action, or network call is performed.",
    items,
    ariaLabel:
      `${SNAPSHOT_LABEL} ${state}; ` +
      `Local-first defaults ${localFirstDefaultsStatus}; ` +
      `Sensitive data boundary ${sensitiveDataBoundaryStatus}; ` +
      `Permission and execution lock ${permissionAndExecutionStatus}; ` +
      `Dependency and fixture safety ${dependencyFixtureStatus}; ` +
      `Audit and export trail ${auditAndExportStatus}`
  };
}
