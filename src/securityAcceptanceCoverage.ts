import type { ReleasePrivacyReadinessSnapshot } from "./releasePrivacyReadiness";

export type SecurityAcceptanceCoverageState = "ready" | "review" | "blocked" | "waiting";

export interface SecurityAcceptanceCoverageEvidence {
  hasSelectedRun?: boolean;
  selectedRunStatus?: string;
  releasePrivacyState?: ReleasePrivacyReadinessSnapshot["state"];
  releasePrivacyReadiness?: number;
  realProjectDataReady?: boolean | "ready" | "review" | "blocked";
  runtimeAdapterEdgesReady?: boolean | "ready" | "review" | "blocked";
  auditReviewReady?: boolean | "ready" | "review" | "blocked";
}

export interface SecurityAcceptanceCoverageItem {
  id: string;
  label: string;
  status: SecurityAcceptanceCoverageState;
  detail: string;
}

export interface SecurityAcceptanceCoverageSnapshot {
  id: string;
  label: string;
  state: SecurityAcceptanceCoverageState;
  statusLabel: string;
  readiness: number;
  detail: string;
  safety: string;
  canAdvanceSecurity: boolean;
  items: SecurityAcceptanceCoverageItem[];
  ariaLabel: string;
}

const SNAPSHOT_ID = "security-acceptance-coverage";
const SNAPSHOT_LABEL = "Security acceptance coverage";

const READY_READINESS_POINT = 20;
const REVIEW_READINESS_POINT = 10;

const STATUS_LABELS: Record<SecurityAcceptanceCoverageState, string> = {
  ready: "Ready",
  review: "Needs review",
  blocked: "Blocked",
  waiting: "Waiting"
};

const LIVE_RUN_READY_STATUSES = new Set<string>([
  "complete",
  "completed",
  "running",
  "validating",
  "implementing",
  "queued"
]);

const LIVE_RUN_BLOCKED_STATUSES = new Set<string>([
  "failed",
  "blocked",
  "cancelled"
]);

const COVERAGE_SAFETY =
  "No filesystem action, process action, network action, or release action is performed by this helper.";

function normalizeReadinessState(
  value?: boolean | SecurityAcceptanceCoverageState
): SecurityAcceptanceCoverageState {
  if (value === undefined) {
    return "waiting";
  }

  if (typeof value === "boolean") {
    return value ? "ready" : "blocked";
  }

  return value;
}

function evaluateLiveRun(
  hasSelectedRun?: boolean,
  selectedRunStatus?: string
): SecurityAcceptanceCoverageState {
  if (!hasSelectedRun) {
    return "waiting";
  }

  if (!selectedRunStatus) {
    return "review";
  }

  const normalizedStatus = selectedRunStatus.toLowerCase();

  if (LIVE_RUN_BLOCKED_STATUSES.has(normalizedStatus)) {
    return "blocked";
  }

  if (LIVE_RUN_READY_STATUSES.has(normalizedStatus)) {
    return "ready";
  }

  return "review";
}

function readinessPoints(state: SecurityAcceptanceCoverageState): number {
  if (state === "ready") {
    return READY_READINESS_POINT;
  }

  if (state === "review") {
    return REVIEW_READINESS_POINT;
  }

  return 0;
}

function hasAnyEvidence(evidence?: SecurityAcceptanceCoverageEvidence): boolean {
  if (!evidence) {
    return false;
  }

  return Object.values(evidence).some((value) => value !== undefined);
}

function resolveReleasePrivacyState(
  releasePrivacyState?: ReleasePrivacyReadinessSnapshot["state"]
): SecurityAcceptanceCoverageState {
  if (releasePrivacyState === undefined) {
    return "waiting";
  }

  return releasePrivacyState;
}

function allItemsAreWaiting(items: SecurityAcceptanceCoverageItem[]): boolean {
  return items.every((item) => item.status === "waiting");
}

function allItemsAreReady(items: SecurityAcceptanceCoverageItem[]): boolean {
  return items.every((item) => item.status === "ready");
}

function summarizeState(items: SecurityAcceptanceCoverageItem[]): SecurityAcceptanceCoverageState {
  if (allItemsAreWaiting(items)) {
    return "waiting";
  }

  if (items.some((item) => item.status === "blocked")) {
    return "blocked";
  }

  if (allItemsAreReady(items)) {
    return "ready";
  }

  return "review";
}

function buildStateDetail(state: SecurityAcceptanceCoverageState): string {
  if (state === "ready") {
    return "Security acceptance coverage is ready and can advance.";
  }

  if (state === "review") {
    return "Security acceptance coverage needs review before advancement.";
  }

  if (state === "blocked") {
    return "Security acceptance coverage is blocked and cannot advance.";
  }

  return "Security acceptance coverage is waiting for run and security evidence.";
}

function itemToAriaLabelItem(item: SecurityAcceptanceCoverageItem): string {
  return `${item.label} ${item.status}`;
}

export function createSecurityAcceptanceCoverage(
  evidence?: SecurityAcceptanceCoverageEvidence
): SecurityAcceptanceCoverageSnapshot {
  const workingEvidence: SecurityAcceptanceCoverageEvidence = { ...(evidence ?? {}) };
  const hasEvidence = hasAnyEvidence(workingEvidence);

  const items: SecurityAcceptanceCoverageItem[] = [
    {
      id: `${SNAPSHOT_ID}:live-cockpit-run-selected`,
      label: "Live Arena run selected",
      status: evaluateLiveRun(
        workingEvidence.hasSelectedRun,
        workingEvidence.selectedRunStatus
      ),
      detail: workingEvidence.hasSelectedRun
        ? `Selected run status is ${(workingEvidence.selectedRunStatus ?? "unknown").toString()}.`
        : "No live Arena run is currently selected."
    },
    {
      id: `${SNAPSHOT_ID}:release-privacy-readiness`,
      label: "Release privacy readiness",
      status: resolveReleasePrivacyState(workingEvidence.releasePrivacyState),
      detail:
        `Release privacy readiness is ${workingEvidence.releasePrivacyState ?? "waiting"}; ` +
        `readiness score is ${workingEvidence.releasePrivacyReadiness ?? "not available"}.`
    },
    {
      id: `${SNAPSHOT_ID}:real-project-data-boundary`,
      label: "Real project data boundary",
      status: normalizeReadinessState(workingEvidence.realProjectDataReady),
      detail: `Real project data boundary evidence is ${normalizeReadinessState(
        workingEvidence.realProjectDataReady
      )}.`
    },
    {
      id: `${SNAPSHOT_ID}:runtime-adapter-edge-evidence`,
      label: "Runtime adapter edge evidence",
      status: normalizeReadinessState(workingEvidence.runtimeAdapterEdgesReady),
      detail: `Runtime adapter edge evidence is ${normalizeReadinessState(
        workingEvidence.runtimeAdapterEdgesReady
      )}.`
    },
    {
      id: `${SNAPSHOT_ID}:audit-review-trail`,
      label: "Audit review trail",
      status: normalizeReadinessState(workingEvidence.auditReviewReady),
      detail: `Audit review trail readiness is ${normalizeReadinessState(
        workingEvidence.auditReviewReady
      )}.`
    }
  ];

  const readiness = items.reduce(
    (acc, item) => acc + readinessPoints(item.status),
    0
  );
  const state = hasEvidence ? summarizeState(items) : "waiting";
  const canAdvanceSecurity = state === "ready";
  const statusLabel = STATUS_LABELS[state];
  const detail = buildStateDetail(state);

  return {
    id: SNAPSHOT_ID,
    label: SNAPSHOT_LABEL,
    state,
    statusLabel,
    readiness,
    detail,
    safety: COVERAGE_SAFETY,
    canAdvanceSecurity,
    items,
    ariaLabel:
      `${SNAPSHOT_LABEL} ${state}; ` + items.map(itemToAriaLabelItem).join("; ")
  };
}
