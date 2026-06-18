import type { ReleasePrivacyReadinessSnapshot } from "./releasePrivacyReadiness";
import type {
  SecurityAcceptanceCoverageSnapshot,
  SecurityAcceptanceCoverageState
} from "./securityAcceptanceCoverage";
import type { SecurityAcceptanceRepeatedRunsSnapshot } from "./securityAcceptanceRepeatedRuns";

export interface SecurityFinalReviewEvidence {
  releasePrivacy?: ReleasePrivacyReadinessSnapshot;
  currentAcceptance?: SecurityAcceptanceCoverageSnapshot;
  repeatedRuns?: SecurityAcceptanceRepeatedRunsSnapshot;
  packagingPaused?: boolean;
  packagingLocked?: boolean;
}

export interface SecurityFinalReviewItem {
  id: string;
  label: string;
  status: SecurityAcceptanceCoverageState;
  detail: string;
}

export interface SecurityFinalReviewSnapshot {
  id: string;
  label: string;
  state: SecurityAcceptanceCoverageState;
  statusLabel: string;
  readiness: number;
  canCloseSecurity: boolean;
  canResumePackaging: boolean;
  detail: string;
  items: SecurityFinalReviewItem[];
  safety: string;
  ariaLabel: string;
}

const SNAPSHOT_ID = "security-final-review";
const SNAPSHOT_LABEL = "Security final review";

const STATUS_LABELS: Record<SecurityAcceptanceCoverageState, string> = {
  ready: "Ready",
  review: "Needs review",
  blocked: "Blocked",
  waiting: "Waiting"
};

const SAFETY_TEXT =
  "No filesystem action, process action, network action, release action, or packaging action is performed by this helper.";

const READY_ITEM_SCORE = 20;
const REVIEW_ITEM_SCORE = 10;

function itemStateFromReleasePrivacy(
  snapshot?: ReleasePrivacyReadinessSnapshot
): SecurityAcceptanceCoverageState {
  if (!snapshot) {
    return "waiting";
  }

  if (snapshot.state === "ready" && !snapshot.canRecommendRelease) {
    return "review";
  }

  return snapshot.state;
}

function itemStateFromCurrentAcceptance(
  snapshot?: SecurityAcceptanceCoverageSnapshot
): SecurityAcceptanceCoverageState {
  if (!snapshot) {
    return "waiting";
  }

  if (snapshot.state === "ready" && !snapshot.canAdvanceSecurity) {
    return "review";
  }

  return snapshot.state;
}

function itemStateFromRepeatedRuns(
  snapshot?: SecurityAcceptanceRepeatedRunsSnapshot
): SecurityAcceptanceCoverageState {
  if (!snapshot) {
    return "waiting";
  }

  if (snapshot.state === "ready" && !snapshot.canCloseEvidence) {
    return "review";
  }

  return snapshot.state;
}

function itemStateFromPackaging(
  packagingPaused?: boolean,
  packagingLocked?: boolean
): SecurityAcceptanceCoverageState {
  if (packagingPaused === undefined && packagingLocked === undefined) {
    return "waiting";
  }

  if (packagingPaused === true && packagingLocked === true) {
    return "ready";
  }

  if (packagingPaused === false || packagingLocked === false) {
    return "blocked";
  }

  return "review";
}

function stateFromFinalItems(
  items: SecurityFinalReviewItem[]
): SecurityAcceptanceCoverageState {
  if (items.every((item) => item.status === "waiting")) {
    return "waiting";
  }

  if (items.some((item) => item.status === "blocked")) {
    return "blocked";
  }

  if (items.every((item) => item.status === "ready")) {
    return "ready";
  }

  return "review";
}

function scoreForState(state: SecurityAcceptanceCoverageState): number {
  if (state === "ready") {
    return READY_ITEM_SCORE;
  }

  if (state === "review") {
    return REVIEW_ITEM_SCORE;
  }

  return 0;
}

function readinessFromStates(
  items: SecurityFinalReviewItem[],
  overallState: SecurityAcceptanceCoverageState
): number {
  if (overallState === "ready") {
    return 100;
  }

  if (overallState === "blocked") {
    return 20;
  }

  if (overallState === "waiting") {
    return 0;
  }

  if (items.length === 0) {
    return 0;
  }

  return Math.round(
    items.reduce((sum, item) => sum + scoreForState(item.status), 0) / items.length
  );
}

function itemToAriaLabelItem(item: SecurityFinalReviewItem): string {
  return `${item.label} ${item.status}`;
}

function buildReleaseItem(snapshot?: ReleasePrivacyReadinessSnapshot): SecurityFinalReviewItem {
  return {
    id: `${SNAPSHOT_ID}:release-privacy-review`,
    label: "Release privacy review",
    status: itemStateFromReleasePrivacy(snapshot),
    detail: snapshot
      ? `Release privacy readiness is ${snapshot.state}; release recommendation is ${snapshot.canRecommendRelease ? "available" : "held"}.`
      : "Release privacy evidence has not been provided."
  };
}

function buildCurrentAcceptanceItem(
  snapshot?: SecurityAcceptanceCoverageSnapshot
): SecurityFinalReviewItem {
  return {
    id: `${SNAPSHOT_ID}:current-security-acceptance`,
    label: "Current run security acceptance",
    status: itemStateFromCurrentAcceptance(snapshot),
    detail: snapshot
      ? `Current security acceptance state is ${snapshot.state}; security advancement is ${snapshot.canAdvanceSecurity ? "available" : "held"}.`
      : "Current security acceptance evidence has not been provided."
  };
}

function buildRepeatedRunsItem(
  snapshot?: SecurityAcceptanceRepeatedRunsSnapshot
): SecurityFinalReviewItem {
  return {
    id: `${SNAPSHOT_ID}:repeated-evidence-closure`,
    label: "Repeated evidence closure",
    status: itemStateFromRepeatedRuns(snapshot),
    detail: snapshot
      ? `Repeated evidence closure state is ${snapshot.state}; evidence closure is ${snapshot.canCloseEvidence ? "available" : "held"}.`
      : "Repeated evidence closure evidence has not been provided."
  };
}

function buildPackagingPauseLockItem(
  packagingPaused?: boolean,
  packagingLocked?: boolean
): SecurityFinalReviewItem {
  const state = itemStateFromPackaging(packagingPaused, packagingLocked);
  let detail = "";

  if (state === "ready") {
    detail =
      "Packaging pause is active and lock is active, so safety checks can proceed.";
  } else if (state === "waiting") {
    detail = "Packaging pause and lock evidence has not been provided.";
  } else if (state === "blocked") {
    detail =
      "Packaging pause/lock cannot close security review because one of the states is false.";
  } else {
    detail =
      "Packaging pause/lock is in review; one field is true while the other is missing.";
  }

  return {
    id: `${SNAPSHOT_ID}:packaging-pause-lock`,
    label: "Packaging pause lock",
    status: state,
    detail
  };
}

function buildFinalClosureItem(
  finalItems: SecurityFinalReviewItem[]
): SecurityFinalReviewItem {
  const state = stateFromFinalItems(finalItems);

  let detail = "";
  if (state === "ready") {
    detail = "All security and packaging pre-close checks are ready.";
  } else if (state === "waiting") {
    detail = "Security review is waiting for all required evidence items.";
  } else if (state === "blocked") {
    detail = "Security review cannot close while required checks are blocked.";
  } else {
    detail = "Security review requires additional review before it can close.";
  }

  return {
    id: `${SNAPSHOT_ID}:final-security-closure`,
    label: "Final security closure",
    status: state,
    detail
  };
}

export function createSecurityFinalReview(
  evidence?: SecurityFinalReviewEvidence
): SecurityFinalReviewSnapshot {
  const safeEvidence = evidence ? { ...evidence } : {};
  const releaseItem = buildReleaseItem(safeEvidence.releasePrivacy);
  const currentAcceptanceItem = buildCurrentAcceptanceItem(safeEvidence.currentAcceptance);
  const repeatedRunsItem = buildRepeatedRunsItem(safeEvidence.repeatedRuns);
  const packagingItem = buildPackagingPauseLockItem(
    safeEvidence.packagingPaused,
    safeEvidence.packagingLocked
  );

  const items: SecurityFinalReviewItem[] = [
    releaseItem,
    currentAcceptanceItem,
    repeatedRunsItem,
    packagingItem
  ];

  const finalItem = buildFinalClosureItem(items);
  items.push(finalItem);

  const state = finalItem.status;
  const readiness = readinessFromStates(items, state);
  const statusLabel = STATUS_LABELS[state];

  return {
    id: SNAPSHOT_ID,
    label: SNAPSHOT_LABEL,
    state,
    statusLabel,
    readiness,
    canCloseSecurity: state === "ready",
    canResumePackaging: false,
    detail: finalItem.detail,
    safety: SAFETY_TEXT,
    items,
    ariaLabel:
      `${SNAPSHOT_LABEL} ${statusLabel}; ` + items.map(itemToAriaLabelItem).join("; ")
  };
}
