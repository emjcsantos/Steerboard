import type {
  SecurityAcceptanceCoverageSnapshot,
  SecurityAcceptanceCoverageState
} from "./securityAcceptanceCoverage";

export interface SecurityAcceptanceRepeatedRunsOptions {
  requiredRunCount?: number;
}

export interface SecurityAcceptanceRepeatedRunsSnapshot {
  id: string;
  label: string;
  state: SecurityAcceptanceCoverageState;
  statusLabel: string;
  readiness: number;
  reviewedRunCount: number;
  requiredRunCount: number;
  readyRunCount: number;
  reviewRunCount: number;
  blockedRunCount: number;
  waitingRunCount: number;
  canCloseEvidence: boolean;
  detail: string;
  safety: string;
  items: SecurityAcceptanceRepeatedRunsItem[];
  ariaLabel: string;
}

export interface SecurityAcceptanceRepeatedRunsItem {
  id: string;
  label: string;
  status: SecurityAcceptanceCoverageState;
  detail: string;
}

const SNAPSHOT_ID = "security-acceptance-repeated-runs";
const SNAPSHOT_LABEL = "Security acceptance repeated runs";

const STATUS_LABELS: Record<SecurityAcceptanceCoverageState, string> = {
  ready: "Ready",
  review: "Needs review",
  blocked: "Blocked",
  waiting: "Waiting"
};

const REPEATED_RUNS_SAFETY =
  "No filesystem action, process action, network action, or release action is performed by this helper.";

function normalizeRequiredRunCount(value?: number): number {
  const parsed = Math.floor(value ?? 3);
  if (Number.isNaN(parsed)) {
    return 3;
  }

  return Math.max(1, parsed);
}

function buildReadinessScore(
  state: SecurityAcceptanceCoverageState,
  reviewedRunCount: number,
  readyRunCount: number,
  requiredRunCount: number
): number {
  if (state === "ready") {
    return 100;
  }

  if (state === "waiting") {
    return 0;
  }

  if (state === "blocked") {
    return 20;
  }

  const baseReviewReadiness = Math.round((reviewedRunCount / requiredRunCount) * 70);
  const bonusReadiness = readyRunCount * 5;
  return Math.min(90, baseReviewReadiness + bonusReadiness);
}

function buildItem(
  id: string,
  label: string,
  status: SecurityAcceptanceCoverageState,
  detail: string
): SecurityAcceptanceRepeatedRunsItem {
  return {
    id,
    label,
    status,
    detail
  };
}

function summarizeState(
  readyRunCount: number,
  reviewRunCount: number,
  blockedRunCount: number,
  requiredRunCount: number
): SecurityAcceptanceCoverageState {
  const reviewedRunCount = readyRunCount + reviewRunCount + blockedRunCount;

  if (reviewedRunCount === 0) {
    return "waiting";
  }

  if (blockedRunCount > 0) {
    return "blocked";
  }

  if (reviewedRunCount >= requiredRunCount && reviewRunCount === 0) {
    return "ready";
  }

  return "review";
}

function countsToDetail(
  label: string,
  value: number,
  total = 0
): string {
  if (total > 0) {
    return `${label}: ${value} of ${total} run(s).`;
  }

  return `${label}: none.`;
}

export function createSecurityAcceptanceRepeatedRuns(
  snapshots: readonly SecurityAcceptanceCoverageSnapshot[] = [],
  options?: SecurityAcceptanceRepeatedRunsOptions
): SecurityAcceptanceRepeatedRunsSnapshot {
  const requiredRunCount = normalizeRequiredRunCount(options?.requiredRunCount);
  const stableSnapshots: readonly SecurityAcceptanceCoverageSnapshot[] = [...snapshots];

  const readyRunCount = stableSnapshots.filter((snapshot) => snapshot.state === "ready").length;
  const reviewRunCount = stableSnapshots.filter((snapshot) => snapshot.state === "review").length;
  const blockedRunCount = stableSnapshots.filter((snapshot) => snapshot.state === "blocked").length;
  const waitingRunCount = stableSnapshots.filter((snapshot) => snapshot.state === "waiting").length;
  const reviewedRunCount = readyRunCount + reviewRunCount + blockedRunCount;

  const state = summarizeState(
    readyRunCount,
    reviewRunCount,
    blockedRunCount,
    requiredRunCount
  );

  const readiness = buildReadinessScore(
    state,
    reviewedRunCount,
    readyRunCount,
    requiredRunCount
  );

  const totalRunCount = stableSnapshots.length;

  const items: SecurityAcceptanceRepeatedRunsItem[] = [
    buildItem(
      `${SNAPSHOT_ID}:run-sample-coverage`,
      "Run sample coverage",
      state,
      countsToDetail("Run sample coverage", reviewedRunCount, totalRunCount)
    ),
    buildItem(
      `${SNAPSHOT_ID}:ready-run-coverage`,
      "Ready run coverage",
      readyRunCount > 0 ? "ready" : "waiting",
      countsToDetail("Ready run coverage", readyRunCount, totalRunCount)
    ),
    buildItem(
      `${SNAPSHOT_ID}:review-run-coverage`,
      "Review run coverage",
      reviewRunCount > 0 ? "review" : "waiting",
      countsToDetail("Review run coverage", reviewRunCount, totalRunCount)
    ),
    buildItem(
      `${SNAPSHOT_ID}:blocked-run-coverage`,
      "Blocked run coverage",
      blockedRunCount > 0 ? "blocked" : "waiting",
      countsToDetail("Blocked run coverage", blockedRunCount, totalRunCount)
    ),
    buildItem(
      `${SNAPSHOT_ID}:waiting-run-coverage`,
      "Waiting run coverage",
      waitingRunCount > 0 ? "waiting" : (state === "ready" ? "ready" : "review"),
      countsToDetail("Waiting run coverage", waitingRunCount, totalRunCount)
    )
  ];

  const statusLabel = STATUS_LABELS[state];
  const canCloseEvidence = state === "ready";
  const detail = `Security acceptance repeated runs are ${statusLabel.toLowerCase()}.`;

  return {
    id: SNAPSHOT_ID,
    label: SNAPSHOT_LABEL,
    state,
    statusLabel,
    readiness,
    reviewedRunCount,
    requiredRunCount,
    readyRunCount,
    reviewRunCount,
    blockedRunCount,
    waitingRunCount,
    canCloseEvidence,
    detail,
    safety: REPEATED_RUNS_SAFETY,
    items,
    ariaLabel:
      `${SNAPSHOT_LABEL} ${state}; ${items
        .map((item) => `${item.label} ${item.status}`)
        .join("; ")}`
  };
}
