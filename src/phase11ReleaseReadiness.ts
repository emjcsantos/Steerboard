import type { DesktopPackagingReadinessSnapshot } from "./desktopPackagingReadiness";
import type { Phase11EvidenceRecordSnapshot } from "./phase11EvidenceRecords";
import type { Phase11OwnerCommandCenterSnapshot } from "./phase11OwnerCommandCenter";
import type { RemainingGoalPlanSummary } from "./remainingGoalPlan";
import type { SecurityFinalReviewSnapshot } from "./securityFinalReview";

export type Phase11ReleaseReadinessState = "ready" | "review" | "blocked" | "waiting";

export type Phase11ReleaseReadinessItemKind =
  | "clean-checkout"
  | "build-test"
  | "smoke-proof"
  | "packaging-lock"
  | "docs-known-limits"
  | "release-decision";

export interface Phase11ReleaseReadinessItem {
  id: string;
  label: string;
  kind: Phase11ReleaseReadinessItemKind;
  status: Phase11ReleaseReadinessState;
  detail: string;
  nextAction: string;
}

export interface Phase11ReleaseReadinessSnapshot {
  id: string;
  label: string;
  state: Phase11ReleaseReadinessState;
  statusLabel: string;
  readiness: number;
  canRecommendRelease: boolean;
  releaseHoldCount: number;
  readyCount: number;
  reviewCount: number;
  blockedCount: number;
  waitingCount: number;
  ownerReadiness: number;
  securityReadiness: number;
  packagingReadiness: number;
  nextAction: string;
  safety: string;
  ariaLabel: string;
  items: Phase11ReleaseReadinessItem[];
}

export interface Phase11ReleaseReadinessInput {
  ownerCommandCenter: Phase11OwnerCommandCenterSnapshot;
  desktopPackaging: DesktopPackagingReadinessSnapshot;
  securityFinalReview: SecurityFinalReviewSnapshot;
  remainingGoalSummary: RemainingGoalPlanSummary;
  cleanCheckoutEvidence?: Phase11EvidenceRecordSnapshot;
  buildTestEvidence?: Phase11EvidenceRecordSnapshot;
  docsKnownLimitsEvidence?: Phase11EvidenceRecordSnapshot;
  cleanCheckoutState?: Phase11ReleaseReadinessState;
  buildTestState?: Phase11ReleaseReadinessState;
  docsKnownLimitsState?: Phase11ReleaseReadinessState;
}

const SNAPSHOT_ID = "phase-11-release-readiness";
const SNAPSHOT_LABEL = "Phase 11 Release readiness gate";
const SAFETY =
  "Phase 11 release readiness is evidence-only. It does not install dependencies, run tests, build packages, execute smoke flows, sign artifacts, push branches, call networks, or resume packaging.";

const STATUS_LABELS: Record<Phase11ReleaseReadinessState, string> = {
  ready: "Ready",
  review: "Review",
  blocked: "Blocked",
  waiting: "Waiting"
};

const PHASE3_CLEARANCE_GOAL_ID = "goal-phase-3-proof-clearance";
const REQUIRED_PHASE3_RELEASE_TRACE_PM_TASK_IDS = [
  "phase-03-child-traceability",
  "phase-03-child-handoff-gate"
] as const;

function publicText(value: string | undefined, fallback: string): string {
  if (!value || value.trim().length === 0) {
    return fallback;
  }

  const sanitized = value
    .replace(/[A-Za-z]:[\\/][^\s]+/g, "local path")
    .replace(/[\\/](Users|Projects|Documents|Desktop)[\\/][^\s]+/gi, "local path")
    .replace(/sk-[A-Za-z0-9_-]+/g, "redacted token")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return sanitized.length > 0 ? sanitized : fallback;
}

function stateWeight(state: Phase11ReleaseReadinessState): number {
  switch (state) {
    case "ready":
      return 100;
    case "review":
      return 65;
    case "waiting":
      return 35;
    case "blocked":
    default:
      return 0;
  }
}

function scoreItems(items: readonly Phase11ReleaseReadinessItem[]): number {
  if (items.length === 0) {
    return 0;
  }

  return Math.round(
    items.reduce((sum, item) => sum + stateWeight(item.status), 0) / items.length
  );
}

function resolveState(
  items: readonly Phase11ReleaseReadinessItem[]
): Phase11ReleaseReadinessState {
  if (items.some((item) => item.status === "blocked")) {
    return "blocked";
  }
  if (items.some((item) => item.status === "review")) {
    return "review";
  }
  if (items.some((item) => item.status === "waiting")) {
    return "waiting";
  }
  return "ready";
}

function firstNextAction(items: readonly Phase11ReleaseReadinessItem[]): string {
  return (
    items.find((item) => item.status === "blocked")?.nextAction ??
    items.find((item) => item.status === "review")?.nextAction ??
    items.find((item) => item.status === "waiting")?.nextAction ??
    "Attach release proof and keep packaging held until the owner explicitly resumes release actions."
  );
}

function cleanCheckoutItem(
  evidence: Phase11EvidenceRecordSnapshot | undefined,
  state: Phase11ReleaseReadinessState | undefined
): Phase11ReleaseReadinessItem {
  const status = evidence?.state ?? (state === "ready" ? "review" : state) ?? "waiting";

  return {
    id: `${SNAPSHOT_ID}:clean-checkout`,
    label: "Clean checkout",
    kind: "clean-checkout",
    status,
    detail: evidence
      ? `${evidence.detail} Source: ${evidence.source}; recorded: ${evidence.recordedAt}; freshness: ${evidence.freshness}.`
      : state === "ready"
        ? "Clean checkout install, dependency verification, and startup proof need a structured evidence record."
        : "Clean checkout install, dependency verification, and startup proof still need owner evidence.",
    nextAction: evidence?.nextAction ?? (
      state === "ready"
        ? "Attach clean-checkout evidence metadata before release readiness can proceed."
        : "Run the clean-checkout checklist after the active owner holds are cleared."
    )
  };
}

function buildTestItem(
  evidence: Phase11EvidenceRecordSnapshot | undefined,
  state: Phase11ReleaseReadinessState | undefined
): Phase11ReleaseReadinessItem {
  const status = evidence?.state ?? (state === "ready" ? "review" : state) ?? "waiting";

  return {
    id: `${SNAPSHOT_ID}:build-test`,
    label: "Build and test",
    kind: "build-test",
    status,
    detail: evidence
      ? `${evidence.detail} Source: ${evidence.source}; recorded: ${evidence.recordedAt}; freshness: ${evidence.freshness}.`
      : state === "ready"
        ? "Release-targeted test and build commands need a structured evidence record."
        : "Release-targeted test and build commands still need a final clean run.",
    nextAction: evidence?.nextAction ?? (
      state === "ready"
        ? "Attach final test and build evidence metadata before release readiness can proceed."
        : "Record the final test and build pass before release packaging is reconsidered."
    )
  };
}

function hasCurrentPhase3ReleaseTrace(
  ownerCommandCenter: Phase11OwnerCommandCenterSnapshot
): boolean {
  return ownerCommandCenter.priorityGoalTraces.some(
    (trace) =>
      trace.goalId === PHASE3_CLEARANCE_GOAL_ID &&
      trace.current === true &&
      REQUIRED_PHASE3_RELEASE_TRACE_PM_TASK_IDS.every((taskId) =>
        trace.pmTaskIds.includes(taskId)
      )
  );
}

function smokeProofItem(
  ownerCommandCenter: Phase11OwnerCommandCenterSnapshot
): Phase11ReleaseReadinessItem {
  const hasPhase3Trace = hasCurrentPhase3ReleaseTrace(ownerCommandCenter);
  const status = ownerCommandCenter.canRelease
    ? hasPhase3Trace
      ? "ready"
      : "review"
    : ownerCommandCenter.state;

  return {
    id: `${SNAPSHOT_ID}:smoke-proof`,
    label: "Owner smoke proof",
    kind: "smoke-proof",
    status,
    detail:
      `Owner command center is ${ownerCommandCenter.statusLabel.toLowerCase()} at ${ownerCommandCenter.readiness}% with ${ownerCommandCenter.blockerCount} blocker${ownerCommandCenter.blockerCount === 1 ? "" : "s"}.` +
      (hasPhase3Trace
        ? " Current Phase 3 goal/PM traceability is visible."
        : " Current Phase 3 goal/PM traceability is not visible."),
    nextAction:
      ownerCommandCenter.canRelease && !hasPhase3Trace
        ? "Restore current Phase 3 goal/PM traceability in Owner Testing before release packaging resumes."
        : ownerCommandCenter.canRelease
          ? "Keep owner smoke proof fresh with current active goal/PM traceability across reload and while the app remains open before release packaging resumes."
          : publicText(
              ownerCommandCenter.nextAction,
              "Resolve Owner Testing command-center holds before release readiness."
            )
  };
}

function packagingLockItem(
  desktopPackaging: DesktopPackagingReadinessSnapshot,
  securityFinalReview: SecurityFinalReviewSnapshot
): Phase11ReleaseReadinessItem {
  const lockActive =
    desktopPackaging.packagingLocked &&
    !desktopPackaging.canPackage &&
    !securityFinalReview.canResumePackaging;

  if (!lockActive) {
    return {
      id: `${SNAPSHOT_ID}:packaging-lock`,
      label: "Packaging lock",
      kind: "packaging-lock",
      status: "blocked",
      detail: "Packaging is not fully locked, so release readiness cannot proceed.",
      nextAction: "Restore the packaging lock before reviewing release readiness."
    };
  }

  return {
    id: `${SNAPSHOT_ID}:packaging-lock`,
    label: "Packaging lock",
    kind: "packaging-lock",
    status: "ready",
    detail: "Packaging and resume actions remain locked while readiness evidence is reviewed.",
    nextAction: "Keep packaging locked until the owner explicitly resumes release actions."
  };
}

function docsKnownLimitsItem(
  evidence: Phase11EvidenceRecordSnapshot | undefined,
  state: Phase11ReleaseReadinessState | undefined
): Phase11ReleaseReadinessItem {
  const status = evidence?.state ?? (state === "ready" ? "review" : state) ?? "review";

  return {
    id: `${SNAPSHOT_ID}:docs-known-limits`,
    label: "Docs and known limits",
    kind: "docs-known-limits",
    status,
    detail: evidence
      ? `${evidence.detail} Source: ${evidence.source}; recorded: ${evidence.recordedAt}; freshness: ${evidence.freshness}.`
      : state === "ready"
        ? "Release notes, owner checklist, packaging limits, and known limits need a structured evidence record."
        : "Release notes, owner checklist, packaging limits, and known limits need a final owner review.",
    nextAction: evidence?.nextAction ?? (
      state === "ready"
        ? "Attach release docs and known-limits evidence metadata before release readiness can proceed."
        : "Review release docs, known limits, and deferred packaging notes before release."
    )
  };
}

function nonReadyState(
  items: readonly Phase11ReleaseReadinessItem[]
): Phase11ReleaseReadinessState | undefined {
  if (items.some((item) => item.status === "blocked")) {
    return "blocked";
  }
  if (items.some((item) => item.status === "review")) {
    return "review";
  }
  if (items.some((item) => item.status === "waiting")) {
    return "waiting";
  }
  return undefined;
}

function releaseDecisionItem(
  input: Phase11ReleaseReadinessInput,
  prerequisiteItems: readonly Phase11ReleaseReadinessItem[]
): Phase11ReleaseReadinessItem {
  const prerequisiteState = nonReadyState(prerequisiteItems);
  const unsafePackaging =
    !input.desktopPackaging.packagingLocked ||
    input.desktopPackaging.canPackage ||
    input.securityFinalReview.canResumePackaging;

  if (unsafePackaging) {
    return {
      id: `${SNAPSHOT_ID}:release-decision`,
      label: "Release decision",
      kind: "release-decision",
      status: "blocked",
      detail: "Release decision is blocked because packaging or resume controls are not locked.",
      nextAction: "Re-lock package and resume controls before continuing release readiness."
    };
  }

  if (input.remainingGoalSummary.blocked > 0) {
    return {
      id: `${SNAPSHOT_ID}:release-decision`,
      label: "Release decision",
      kind: "release-decision",
      status: "blocked",
      detail: `${input.remainingGoalSummary.blocked} remaining goal${input.remainingGoalSummary.blocked === 1 ? "" : "s"} are blocked.`,
      nextAction: publicText(
        input.remainingGoalSummary.ownerHoldNextAction,
        "Clear blocked remaining goals before release readiness can proceed."
      )
    };
  }

  if (input.securityFinalReview.state === "blocked") {
    return {
      id: `${SNAPSHOT_ID}:release-decision`,
      label: "Release decision",
      kind: "release-decision",
      status: "blocked",
      detail: "Security final review is blocked.",
      nextAction: publicText(
        input.securityFinalReview.detail,
        "Clear the security final review blocker before release readiness."
      )
    };
  }

  if (input.ownerCommandCenter.state === "blocked") {
    return {
      id: `${SNAPSHOT_ID}:release-decision`,
      label: "Release decision",
      kind: "release-decision",
      status: "blocked",
      detail: "Owner command center is blocked.",
      nextAction: publicText(
        input.ownerCommandCenter.nextAction,
        "Clear Owner Testing blockers before release readiness."
      )
    };
  }

  if (prerequisiteState) {
    return {
      id: `${SNAPSHOT_ID}:release-decision`,
      label: "Release decision",
      kind: "release-decision",
      status: prerequisiteState,
      detail: "Release decision is held until all prerequisite evidence rows are ready.",
      nextAction:
        prerequisiteState === "waiting"
          ? "Record missing release readiness evidence before making the release decision."
          : "Review release readiness evidence before making the release decision."
    };
  }

  if (input.securityFinalReview.state !== "ready") {
    const status = input.securityFinalReview.state === "waiting" ? "waiting" : "review";

    return {
      id: `${SNAPSHOT_ID}:release-decision`,
      label: "Release decision",
      kind: "release-decision",
      status,
      detail: `Security final review is ${input.securityFinalReview.statusLabel.toLowerCase()}.`,
      nextAction: "Close security final review before making the release decision."
    };
  }

  if (!input.ownerCommandCenter.canRelease) {
    const status = input.ownerCommandCenter.state === "waiting" ? "waiting" : "review";

    return {
      id: `${SNAPSHOT_ID}:release-decision`,
      label: "Release decision",
      kind: "release-decision",
      status,
      detail: "Owner command center has not marked the release gate ready.",
      nextAction: publicText(
        input.ownerCommandCenter.nextAction,
        "Finish Owner Testing before making the release decision."
      )
    };
  }

  if (
    input.remainingGoalSummary.active > 0 ||
    input.remainingGoalSummary.next > 0 ||
    input.remainingGoalSummary.planned > 0 ||
    input.remainingGoalSummary.paused > 0
  ) {
    const reviewGoalCount =
      input.remainingGoalSummary.active +
      input.remainingGoalSummary.next +
      input.remainingGoalSummary.planned +
      input.remainingGoalSummary.paused;

    return {
      id: `${SNAPSHOT_ID}:release-decision`,
      label: "Release decision",
      kind: "release-decision",
      status: "review",
      detail: `${reviewGoalCount} remaining goal${reviewGoalCount === 1 ? "" : "s"} still need review before release.`,
      nextAction: "Close or explicitly defer remaining goals before making the release decision."
    };
  }

  return {
    id: `${SNAPSHOT_ID}:release-decision`,
    label: "Release decision",
    kind: "release-decision",
    status: "ready",
    detail: "Release readiness evidence is complete and packaging remains locked for explicit owner resume.",
    nextAction:
      "Owner can decide whether to resume release packaging from this recorded gate while current active goal/PM traceability stays attached."
  };
}

function buildAriaLabel(snapshot: Omit<Phase11ReleaseReadinessSnapshot, "ariaLabel">): string {
  return (
    `${snapshot.label}: ${snapshot.statusLabel}; ${snapshot.readiness}% ready; ` +
    `${snapshot.readyCount} ready, ${snapshot.reviewCount} review, ` +
    `${snapshot.blockedCount} blocked, ${snapshot.waitingCount} waiting; ` +
    `${snapshot.releaseHoldCount} holds; next action: ${snapshot.nextAction}`
  );
}

export function buildPhase11ReleaseReadinessSnapshot(
  input: Phase11ReleaseReadinessInput
): Phase11ReleaseReadinessSnapshot {
  const prerequisiteItems = [
    cleanCheckoutItem(input.cleanCheckoutEvidence, input.cleanCheckoutState),
    buildTestItem(input.buildTestEvidence, input.buildTestState),
    smokeProofItem(input.ownerCommandCenter),
    packagingLockItem(input.desktopPackaging, input.securityFinalReview),
    docsKnownLimitsItem(input.docsKnownLimitsEvidence, input.docsKnownLimitsState)
  ];
  const items = [
    ...prerequisiteItems,
    releaseDecisionItem(input, prerequisiteItems)
  ];
  const state = resolveState(items);
  const readiness = scoreItems(items);
  const readyCount = items.filter((item) => item.status === "ready").length;
  const reviewCount = items.filter((item) => item.status === "review").length;
  const blockedCount = items.filter((item) => item.status === "blocked").length;
  const waitingCount = items.filter((item) => item.status === "waiting").length;
  const releaseHoldCount = items.length - readyCount;
  const canRecommendRelease =
    state === "ready" &&
    input.ownerCommandCenter.canRelease &&
    input.securityFinalReview.canCloseSecurity &&
    input.desktopPackaging.packagingLocked &&
    !input.desktopPackaging.canPackage &&
    !input.securityFinalReview.canResumePackaging &&
    input.remainingGoalSummary.blocked === 0 &&
    input.remainingGoalSummary.active === 0 &&
    input.remainingGoalSummary.next === 0 &&
    input.remainingGoalSummary.planned === 0 &&
    input.remainingGoalSummary.paused === 0;
  const draft = {
    id: SNAPSHOT_ID,
    label: SNAPSHOT_LABEL,
    state,
    statusLabel: STATUS_LABELS[state],
    readiness,
    canRecommendRelease,
    releaseHoldCount,
    readyCount,
    reviewCount,
    blockedCount,
    waitingCount,
    ownerReadiness: input.ownerCommandCenter.readiness,
    securityReadiness: input.securityFinalReview.readiness,
    packagingReadiness: input.desktopPackaging.readiness,
    nextAction: firstNextAction(items),
    safety: SAFETY,
    items
  };

  return {
    ...draft,
    ariaLabel: buildAriaLabel(draft)
  };
}
