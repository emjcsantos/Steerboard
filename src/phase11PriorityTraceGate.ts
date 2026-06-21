import type {
  Phase11OwnerCommandCenterGoalTrace,
  Phase11OwnerCommandCenterSnapshot
} from "./phase11OwnerCommandCenter";
import type {
  Phase11OwnerReleaseTraceabilityState,
  Phase11OwnerReleaseTraceabilitySummary
} from "./phase11OwnerReleaseTraceability";

export type Phase11PriorityTraceGateState =
  | "ready"
  | "review"
  | "blocked"
  | "waiting";

export interface Phase11PriorityTraceGate {
  readonly id: string;
  readonly label: string;
  readonly state: Phase11PriorityTraceGateState;
  readonly statusLabel: string;
  readonly readiness: number;
  readonly canTrustPriorityTrace: boolean;
  readonly traceabilityState: Phase11OwnerReleaseTraceabilityState;
  readonly priorityGoalTraceCount: number;
  readonly currentActiveTraceCount: number;
  readonly linkedPmTaskCount: number;
  readonly missingPmTaskCount: number;
  readonly packagingPaused: boolean;
  readonly releaseHeld: boolean;
  readonly topGoalId: string;
  readonly topPriority: Phase11OwnerCommandCenterGoalTrace["priority"] | "none";
  readonly topStatus: Phase11OwnerCommandCenterGoalTrace["status"] | "none";
  readonly topCompletionPercent: number;
  readonly detail: string;
  readonly nextAction: string;
  readonly priorityTraceGateProof: string;
  readonly ariaLabel: string;
}

const STATUS_LABELS: Record<Phase11PriorityTraceGateState, string> = {
  ready: "Ready",
  review: "Review held",
  blocked: "Blocked",
  waiting: "Waiting"
};

const PRIORITY_ORDER: Record<Phase11OwnerCommandCenterGoalTrace["priority"], number> = {
  critical: 0,
  high: 1,
  medium: 2
};

function currentActiveTraceCount(snapshot: Phase11OwnerCommandCenterSnapshot): number {
  return snapshot.priorityGoalTraces.filter(
    (trace) => trace.current && trace.status === "active"
  ).length;
}

function topTrace(
  snapshot: Phase11OwnerCommandCenterSnapshot
): Phase11OwnerCommandCenterGoalTrace | undefined {
  return [...snapshot.priorityGoalTraces].sort(
    (left, right) =>
      PRIORITY_ORDER[left.priority] - PRIORITY_ORDER[right.priority] ||
      left.completionPercent - right.completionPercent ||
      left.goalId.localeCompare(right.goalId)
  )[0];
}

function proof(
  gate: Omit<Phase11PriorityTraceGate, "priorityTraceGateProof" | "ariaLabel">
): string {
  return [
    "phase11PriorityTraceGate",
    `state=${gate.state}`,
    `canTrust=${gate.canTrustPriorityTrace ? "yes" : "no"}`,
    `traceability=${gate.traceabilityState}`,
    `traces=${gate.priorityGoalTraceCount}`,
    `currentActive=${gate.currentActiveTraceCount}`,
    `pmLinks=${gate.linkedPmTaskCount}`,
    `missingPm=${gate.missingPmTaskCount}`,
    `packaging=${gate.packagingPaused ? "paused" : "review"}`,
    `release=${gate.releaseHeld ? "held" : "ready"}`,
    `topGoal=${gate.topGoalId || "none"}`,
    `topPriority=${gate.topPriority}`,
    `topStatus=${gate.topStatus}`,
    `topCompletion=${gate.topCompletionPercent}`
  ].join(" ");
}

function ariaLabel(gate: Omit<Phase11PriorityTraceGate, "ariaLabel">): string {
  return (
    `${gate.label}: ${gate.statusLabel}; ${gate.readiness}% ready; ` +
    `${gate.priorityGoalTraceCount} priority traces; ` +
    `${gate.currentActiveTraceCount} current active trace; ` +
    `${gate.missingPmTaskCount} missing PM rows; ` +
    `can trust ${gate.canTrustPriorityTrace ? "yes" : "no"}; ` +
    `next action: ${gate.nextAction}`
  );
}

function result(
  state: Phase11PriorityTraceGateState,
  snapshot: Phase11OwnerCommandCenterSnapshot,
  traceability: Phase11OwnerReleaseTraceabilitySummary,
  detail: string,
  nextAction: string
): Phase11PriorityTraceGate {
  const top = topTrace(snapshot);
  const activeTraceCount = currentActiveTraceCount(snapshot);
  const topPriority: Phase11PriorityTraceGate["topPriority"] = top?.priority ?? "none";
  const topStatus: Phase11PriorityTraceGate["topStatus"] = top?.status ?? "none";
  const canTrustPriorityTrace =
    state === "ready" &&
    snapshot.priorityGoalTraceCount > 0 &&
    activeTraceCount === 1 &&
    traceability.canTrustOwnerReleaseGate &&
    traceability.missingPmTaskIds.length === 0;
  const draft = {
    id: "phase-11-priority-trace-gate",
    label: "Phase 11 priority trace gate",
    state,
    statusLabel: STATUS_LABELS[state],
    readiness: state === "ready" ? 100 : state === "review" ? 80 : state === "waiting" ? 55 : 0,
    canTrustPriorityTrace,
    traceabilityState: traceability.state,
    priorityGoalTraceCount: snapshot.priorityGoalTraceCount,
    currentActiveTraceCount: activeTraceCount,
    linkedPmTaskCount: traceability.linkedPmTaskCount,
    missingPmTaskCount: traceability.missingPmTaskIds.length,
    packagingPaused: true,
    releaseHeld: !snapshot.canRelease,
    topGoalId: top?.goalId ?? "",
    topPriority,
    topStatus,
    topCompletionPercent: top?.completionPercent ?? 0,
    detail,
    nextAction
  };
  const gate = {
    ...draft,
    priorityTraceGateProof: proof(draft)
  };

  return {
    ...gate,
    ariaLabel: ariaLabel(gate)
  };
}

export function buildPhase11PriorityTraceGate(
  snapshot: Phase11OwnerCommandCenterSnapshot,
  traceability: Phase11OwnerReleaseTraceabilitySummary
): Phase11PriorityTraceGate {
  if (snapshot.priorityGoalTraceCount === 0) {
    return result(
      "blocked",
      snapshot,
      traceability,
      "Phase 11 priority trace is blocked because no prioritized remaining-goal trace is attached.",
      "Restore prioritized remaining-goal traces before Owner Testing can be trusted as the release gate."
    );
  }

  if (traceability.state === "blocked") {
    return result(
      "blocked",
      snapshot,
      traceability,
      "Phase 11 priority trace is blocked by owner release traceability.",
      traceability.nextAction
    );
  }

  const activeTraceCount = currentActiveTraceCount(snapshot);
  if (activeTraceCount !== 1) {
    return result(
      "review",
      snapshot,
      traceability,
      "Phase 11 priority trace needs exactly one current active remaining-goal trace.",
      "Keep exactly one current active prioritized remaining-goal trace before Owner Testing can be trusted."
    );
  }

  if (traceability.missingPmTaskIds.length > 0) {
    return result(
      "review",
      snapshot,
      traceability,
      "Phase 11 priority trace has missing Project Management rows.",
      traceability.nextAction
    );
  }

  if (!traceability.canTrustOwnerReleaseGate) {
    return result(
      traceability.state === "waiting" ? "waiting" : "review",
      snapshot,
      traceability,
      "Phase 11 priority trace remains held until owner release traceability is trusted.",
      traceability.nextAction
    );
  }

  return result(
    "ready",
    snapshot,
    traceability,
    "Phase 11 priority trace is ready because prioritized goal traces, current active trace, PM coverage, and owner release traceability are trusted.",
    "Keep the trusted priority trace attached while release and packaging actions remain owner-held."
  );
}
