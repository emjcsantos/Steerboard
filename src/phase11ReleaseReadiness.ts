import type { DesktopPackagingReadinessSnapshot } from "./desktopPackagingReadiness";
import { REQUIRED_PHASE3_CLEARANCE_CHILD_PM_TASK_IDS } from "./phase3ClearanceTraceability";
import type { Phase11EvidenceRecordSnapshot } from "./phase11EvidenceRecords";
import type { Phase11OwnerCommandCenterSnapshot } from "./phase11OwnerCommandCenter";
import type { Phase11ProofFreshnessDepthSnapshot } from "./phase11ProofFreshnessDepth";
import type { ProjectManagementTask } from "./projectManagementHierarchy";
import type { RemainingGoalPlanSummary } from "./remainingGoalPlan";
import type { SecurityFinalReviewSnapshot } from "./securityFinalReview";

export type Phase11ReleaseReadinessState = "ready" | "review" | "blocked" | "waiting";

export type Phase11ReleaseReadinessItemKind =
  | "clean-checkout"
  | "build-test"
  | "smoke-proof"
  | "phase3-trace"
  | "packaging-lock"
  | "docs-known-limits"
  | "security-closure"
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
  proofFreshnessDepth: Phase11ProofFreshnessDepthSnapshot;
  desktopPackaging: DesktopPackagingReadinessSnapshot;
  securityFinalReview: SecurityFinalReviewSnapshot;
  remainingGoalSummary: RemainingGoalPlanSummary;
  projectManagementTasks?: readonly ProjectManagementTask[];
  cleanCheckoutEvidence?: Phase11EvidenceRecordSnapshot;
  buildTestEvidence?: Phase11EvidenceRecordSnapshot;
  docsKnownLimitsEvidence?: Phase11EvidenceRecordSnapshot;
  releaseDecisionEvidence?: Phase11EvidenceRecordSnapshot;
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
const REQUIRED_PHASE3_RELEASE_TRACE_PM_TASK_IDS = REQUIRED_PHASE3_CLEARANCE_CHILD_PM_TASK_IDS;
const MIN_PHASE3_RELEASE_TRACE_PM_COMPLETION = 85;
const REQUIRED_PHASE3_RELEASE_TRACE_PM_ROWS =
  REQUIRED_PHASE3_RELEASE_TRACE_PM_TASK_IDS.join(", ");

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

function phase3ReleaseTrace(
  ownerCommandCenter: Phase11OwnerCommandCenterSnapshot
): Phase11OwnerCommandCenterSnapshot["priorityGoalTraces"][number] | undefined {
  return ownerCommandCenter.priorityGoalTraces.find((trace) => trace.goalId === PHASE3_CLEARANCE_GOAL_ID);
}

function phase3HandoffProofReady(
  proofFreshnessDepth: Phase11ProofFreshnessDepthSnapshot
): boolean {
  return proofFreshnessDepth.items.some(
    (item) => item.kind === "handoff-proof" && item.status === "ready"
  );
}

function phase3HandoffProofDetail(
  proofFreshnessDepth: Phase11ProofFreshnessDepthSnapshot
): string {
  return (
    proofFreshnessDepth.items.find((item) => item.kind === "handoff-proof")?.detail ??
    "Owner handoff proof detail is missing from proof freshness depth."
  );
}

function incompletePhase3PmTaskIds(
  projectManagementTasks: readonly ProjectManagementTask[] | undefined,
  requiredTaskIds: readonly string[]
): string[] {
  if (!projectManagementTasks) {
    return [];
  }

  const completionById = new Map(
    projectManagementTasks.map((task) => [task.id, task.completionPercent])
  );

  return requiredTaskIds.filter((taskId) => {
    const completion = completionById.get(taskId);
    return (
      typeof completion === "number" &&
      completion < MIN_PHASE3_RELEASE_TRACE_PM_COMPLETION
    );
  });
}

function desktopSmokeProofDetail(
  proofFreshnessDepth: Phase11ProofFreshnessDepthSnapshot
): string {
  return (
    proofFreshnessDepth.items.find((item) => item.kind === "desktop-smoke")?.detail ??
    "Desktop smoke proof detail is missing from proof freshness depth."
  );
}

function smokeProofItem(
  ownerCommandCenter: Phase11OwnerCommandCenterSnapshot,
  proofFreshnessDepth: Phase11ProofFreshnessDepthSnapshot
): Phase11ReleaseReadinessItem {
  const status =
    ownerCommandCenter.canRelease && proofFreshnessDepth.canTrustOwnerProof
      ? "ready"
      : ownerCommandCenter.state === "ready" && !proofFreshnessDepth.canTrustOwnerProof
        ? proofFreshnessDepth.state
        : ownerCommandCenter.state;

  return {
    id: `${SNAPSHOT_ID}:smoke-proof`,
    label: "Owner smoke proof",
    kind: "smoke-proof",
    status,
    detail:
      `Owner command center is ${ownerCommandCenter.statusLabel.toLowerCase()} at ${ownerCommandCenter.readiness}% with ${ownerCommandCenter.blockerCount} blocker${ownerCommandCenter.blockerCount === 1 ? "" : "s"}; ` +
      `proof freshness is ${proofFreshnessDepth.statusLabel.toLowerCase()} at ${proofFreshnessDepth.readiness}% with ${proofFreshnessDepth.openProofCount} open proof row${proofFreshnessDepth.openProofCount === 1 ? "" : "s"}; ` +
      `desktop smoke proof: ${desktopSmokeProofDetail(proofFreshnessDepth)}`,
    nextAction:
      status === "ready"
        ? "Keep owner smoke proof fresh across reload and while the app remains open before release packaging resumes."
        : ownerCommandCenter.canRelease && !proofFreshnessDepth.canTrustOwnerProof
          ? publicText(
              proofFreshnessDepth.nextAction,
              "Resolve Phase 11 proof freshness depth before release readiness."
            )
        : publicText(
            ownerCommandCenter.nextAction,
            "Resolve Owner Testing command-center holds before release readiness."
          )
  };
}

function phase3TraceItem(
  ownerCommandCenter: Phase11OwnerCommandCenterSnapshot,
  proofFreshnessDepth: Phase11ProofFreshnessDepthSnapshot,
  projectManagementTasks?: readonly ProjectManagementTask[]
): Phase11ReleaseReadinessItem {
  const phase3Trace = phase3ReleaseTrace(ownerCommandCenter);
  const missingPmTaskIds = REQUIRED_PHASE3_RELEASE_TRACE_PM_TASK_IDS.filter(
    (taskId) => !phase3Trace?.pmTaskIds.includes(taskId)
  );
  const incompletePmTaskIds = incompletePhase3PmTaskIds(
    projectManagementTasks,
    REQUIRED_PHASE3_RELEASE_TRACE_PM_TASK_IDS
  );
  const handoffProofReady = phase3HandoffProofReady(proofFreshnessDepth);
  const handoffProofDetail = phase3HandoffProofDetail(proofFreshnessDepth);
  const traceIsCurrent = phase3Trace?.current === true;
  const traceIsActive = phase3Trace?.status === "active";
  const traceIsTrusted =
    Boolean(phase3Trace) &&
    traceIsCurrent &&
    traceIsActive &&
    missingPmTaskIds.length === 0 &&
    incompletePmTaskIds.length === 0 &&
    handoffProofReady &&
    proofFreshnessDepth.canTrustOwnerProof;
  const incompletePmDetail =
    incompletePmTaskIds.length > 0
      ? `; incomplete PM rows below ${MIN_PHASE3_RELEASE_TRACE_PM_COMPLETION}%: ${incompletePmTaskIds.join(", ")}`
      : "";
  const traceRestoreTarget =
    missingPmTaskIds.join(", ") ||
    incompletePmTaskIds.join(", ") ||
    (!traceIsCurrent || !traceIsActive
      ? PHASE3_CLEARANCE_GOAL_ID
      : !proofFreshnessDepth.canTrustOwnerProof
        ? "phase-11-proof-freshness-depth"
        : "phase-11-proof-freshness-depth:handoff-proof");

  return {
    id: `${SNAPSHOT_ID}:phase3-trace`,
    label: "Current Phase 3 trace",
    kind: "phase3-trace",
    status: traceIsTrusted ? "ready" : "review",
    detail: phase3Trace
      ? `${phase3Trace.goalId} is ${phase3Trace.status}, current ${phase3Trace.current ? "yes" : "no"}, with ${phase3Trace.pmTaskIds.length} PM task links including ${REQUIRED_PHASE3_RELEASE_TRACE_PM_ROWS}${incompletePmDetail}; proof freshness ${proofFreshnessDepth.canTrustOwnerProof ? "trusted" : "not trusted"}; handoff proof ${handoffProofReady ? "ready" : "not ready"}; ${handoffProofDetail}`
      : "Current Phase 3 goal/PM traceability is not visible in Owner Testing priority traces.",
    nextAction: traceIsTrusted
      ? "Keep current active Phase 3 clearance PM traceability and ready handoff proof attached before release packaging resumes."
      : `Restore current active Phase 3 clearance PM traceability, required PM row completion, and trusted handoff proof before release readiness can recommend release: ${traceRestoreTarget}.`
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
    detail:
      "Packaging, resume, local storage repair, and safety-disabled live-action release paths remain locked while readiness evidence is reviewed.",
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

function securityClosureItem(
  securityFinalReview: SecurityFinalReviewSnapshot
): Phase11ReleaseReadinessItem {
  const status =
    securityFinalReview.state === "blocked"
      ? "blocked"
      : securityFinalReview.state === "waiting"
        ? "waiting"
        : securityFinalReview.state === "ready" && securityFinalReview.canCloseSecurity
          ? "ready"
          : "review";

  return {
    id: `${SNAPSHOT_ID}:security-closure`,
    label: "Security closure",
    kind: "security-closure",
    status,
    detail:
      status === "ready"
        ? "Final security review is ready and exposes closure capability."
        : `Security final review is ${securityFinalReview.statusLabel.toLowerCase()}; closure capability is ${securityFinalReview.canCloseSecurity ? "available" : "held"}.`,
    nextAction:
      status === "ready"
        ? "Keep final security closure capability attached before release packaging resumes."
        : "Attach final security capability evidence before making the release decision."
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

  if (!input.securityFinalReview.canCloseSecurity) {
    return {
      id: `${SNAPSHOT_ID}:release-decision`,
      label: "Release decision",
      kind: "release-decision",
      status: "review",
      detail: "Security final review is ready, but final security closure capability is still held.",
      nextAction: "Attach final security capability evidence before making the release decision."
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

  if (!input.releaseDecisionEvidence) {
    return {
      id: `${SNAPSHOT_ID}:release-decision`,
      label: "Release decision",
      kind: "release-decision",
      status: "waiting",
      detail:
        "Release decision evidence has not been recorded as a structured Phase 11 evidence record.",
      nextAction:
        "Record owner release-decision evidence after every release readiness prerequisite is ready and packaging remains locked."
    };
  }

  if (input.releaseDecisionEvidence.state !== "ready") {
    return {
      id: `${SNAPSHOT_ID}:release-decision`,
      label: "Release decision",
      kind: "release-decision",
      status: input.releaseDecisionEvidence.state,
      detail:
        `${input.releaseDecisionEvidence.detail} Source: ${input.releaseDecisionEvidence.source}; ` +
        `recorded: ${input.releaseDecisionEvidence.recordedAt}; freshness: ${input.releaseDecisionEvidence.freshness}.`,
      nextAction: input.releaseDecisionEvidence.nextAction
    };
  }

  return {
    id: `${SNAPSHOT_ID}:release-decision`,
    label: "Release decision",
    kind: "release-decision",
    status: "ready",
    detail:
      `${input.releaseDecisionEvidence.detail} Source: ${input.releaseDecisionEvidence.source}; ` +
      `recorded: ${input.releaseDecisionEvidence.recordedAt}; freshness: ${input.releaseDecisionEvidence.freshness}; ` +
      "packaging remains locked for explicit owner resume.",
    nextAction: input.releaseDecisionEvidence.nextAction
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
    smokeProofItem(input.ownerCommandCenter, input.proofFreshnessDepth),
    phase3TraceItem(
      input.ownerCommandCenter,
      input.proofFreshnessDepth,
      input.projectManagementTasks
    ),
    packagingLockItem(input.desktopPackaging, input.securityFinalReview),
    docsKnownLimitsItem(input.docsKnownLimitsEvidence, input.docsKnownLimitsState)
  ];
  const items = [
    ...prerequisiteItems,
    securityClosureItem(input.securityFinalReview),
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
    input.proofFreshnessDepth.canTrustOwnerProof &&
    input.securityFinalReview.canCloseSecurity &&
    input.desktopPackaging.packagingLocked &&
    !input.desktopPackaging.canPackage &&
    !input.securityFinalReview.canResumePackaging &&
    input.releaseDecisionEvidence?.state === "ready" &&
    input.releaseDecisionEvidence.freshness === "fresh" &&
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
