import type { Phase3ClearanceBlockerPrioritySnapshot } from "./phase3ClearanceBlockerPriority";
import type { Phase3ClearanceCommandPlan } from "./phase3ClearanceCommandPlan";
import type {
  Phase3ClearancePackage,
  Phase3ClearancePackageState
} from "./phase3ClearancePackage";
import type { Phase3CommandValidationRecordValidation } from "./phase3CommandValidationRecord";
import type { Phase3HandoffGate } from "./phase3HandoffGate";
import {
  createDefaultProjectManagementPhasePlan
} from "./projectManagementPhasePlan";
import type { ProjectManagementTask } from "./projectManagementHierarchy";
import {
  remainingGoalPlan,
  type RemainingGoalPlanItem
} from "./remainingGoalPlan";

export type Phase3ClearanceTraceabilityState = Phase3ClearancePackageState;

export type Phase3ClearanceTraceabilityItemKind =
  | "active-goal"
  | "pm-coverage"
  | "clearance-evidence"
  | "command-validation"
  | "handoff-boundary"
  | "goal-honesty";

export interface Phase3ClearanceTraceabilityItem {
  readonly id: string;
  readonly label: string;
  readonly kind: Phase3ClearanceTraceabilityItemKind;
  readonly status: Phase3ClearanceTraceabilityState;
  readonly detail: string;
  readonly nextAction: string;
}

export interface Phase3ClearanceTraceabilitySnapshot {
  readonly id: string;
  readonly label: string;
  readonly state: Phase3ClearanceTraceabilityState;
  readonly statusLabel: string;
  readonly readiness: number;
  readonly linkedGoalId: string;
  readonly linkedPhaseId: string;
  readonly requiredPmTaskCount: number;
  readonly linkedPmTaskCount: number;
  readonly missingPmTaskIds: readonly string[];
  readonly missingGoalPmTaskIds: readonly string[];
  readonly openTraceCount: number;
  readonly canTrustTrace: boolean;
  readonly nextAction: string;
  readonly safety: string;
  readonly ariaLabel: string;
  readonly items: readonly Phase3ClearanceTraceabilityItem[];
}

export interface Phase3ClearanceTraceabilityInput {
  readonly goals?: readonly RemainingGoalPlanItem[];
  readonly pmTasks?: readonly ProjectManagementTask[];
  readonly clearancePackage: Phase3ClearancePackage;
  readonly commandPlan: Phase3ClearanceCommandPlan;
  readonly commandValidation?: Phase3CommandValidationRecordValidation;
  readonly blockerPriority: Phase3ClearanceBlockerPrioritySnapshot;
  readonly handoffGate: Phase3HandoffGate;
}

export const PHASE3_CLEARANCE_GOAL_ID = "goal-phase-3-proof-clearance";
export const PHASE3_CLEARANCE_PHASE_ID = "phase-03-controls-slash";
export const REQUIRED_PHASE3_CLEARANCE_PM_TASK_IDS = [
  "phase-03-controls-slash",
  "phase-03-parent-proof-clearance",
  "phase-03-child-smoke-rows",
  "phase-03-child-exit-gate",
  "phase-03-child-command-plan",
  "phase-03-child-blocker-priority",
  "phase-03-child-traceability",
  "phase-03-child-handoff-gate",
  "phase-03-parent-slash-controls",
  "phase-03-child-slash-ready",
  "phase-03-child-control-ready"
] as const;

const SNAPSHOT_ID = "phase-3-clearance-traceability";
const SNAPSHOT_LABEL = "Phase 3 clearance traceability";
const SAFETY =
  "Phase 3 clearance traceability is evidence-only. It links existing goal, PM, clearance, command, blocker, and handoff records but does not run smoke commands, mutate runtime state, record handoff, launch providers, or push branches.";

const STATUS_LABELS: Record<Phase3ClearanceTraceabilityState, string> = {
  ready: "Ready",
  review: "Review",
  blocked: "Blocked",
  waiting: "Waiting"
};

function stateWeight(state: Phase3ClearanceTraceabilityState): number {
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

function resolveState(
  items: readonly Phase3ClearanceTraceabilityItem[]
): Phase3ClearanceTraceabilityState {
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

function scoreItems(items: readonly Phase3ClearanceTraceabilityItem[]): number {
  if (items.length === 0) {
    return 0;
  }

  return Math.round(
    items.reduce((sum, item) => sum + stateWeight(item.status), 0) / items.length
  );
}

function firstNextAction(
  items: readonly Phase3ClearanceTraceabilityItem[]
): string {
  return (
    items.find((item) => item.status === "blocked")?.nextAction ??
    items.find((item) => item.status === "review")?.nextAction ??
    items.find((item) => item.status === "waiting")?.nextAction ??
    "Keep the active Phase 3 goal, PM rows, clearance evidence, and owner handoff trace linked until Phase 3 exits."
  );
}

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

function goalItem(goal: RemainingGoalPlanItem | undefined): Phase3ClearanceTraceabilityItem {
  if (!goal) {
    return {
      id: `${SNAPSHOT_ID}:active-goal`,
      label: "Active Phase 3 goal",
      kind: "active-goal",
      status: "blocked",
      detail: "The active Phase 3 clearance goal is missing.",
      nextAction: "Restore goal-phase-3-proof-clearance before Phase 3 traceability can pass."
    };
  }

  const isLinked =
    goal.status === "active" &&
    goal.priority === "critical" &&
    goal.phaseIds.includes(PHASE3_CLEARANCE_PHASE_ID);

  return {
    id: `${SNAPSHOT_ID}:active-goal`,
    label: "Active Phase 3 goal",
    kind: "active-goal",
    status: isLinked ? "ready" : "blocked",
    detail: `${goal.id} is ${goal.status}, ${goal.priority}, and ${goal.completionPercent}% complete.`,
    nextAction: isLinked
      ? "Keep Phase 3 as the active critical clearance goal until handoff is recorded."
      : "Restore Phase 3 to an active critical goal linked to phase-03-controls-slash."
  };
}

function pmCoverageItem(
  missingPmTaskIds: readonly string[],
  missingGoalPmTaskIds: readonly string[]
): Phase3ClearanceTraceabilityItem {
  const missingCount = missingPmTaskIds.length + missingGoalPmTaskIds.length;

  if (missingPmTaskIds.length > 0) {
    return {
      id: `${SNAPSHOT_ID}:pm-coverage`,
      label: "PM child coverage",
      kind: "pm-coverage",
      status: "blocked",
      detail: `${missingPmTaskIds.length} required Phase 3 PM rows are missing from the board plan.`,
      nextAction: `Restore missing Phase 3 PM rows: ${missingPmTaskIds.join(", ")}.`
    };
  }

  return {
    id: `${SNAPSHOT_ID}:pm-coverage`,
    label: "PM child coverage",
    kind: "pm-coverage",
    status: missingGoalPmTaskIds.length > 0 ? "review" : "ready",
    detail:
      missingCount === 0
        ? "All required Phase 3 Epic, Parent, and Child rows are linked to the active goal."
        : `${missingGoalPmTaskIds.length} required Phase 3 PM rows are not linked from the active goal.`,
    nextAction:
      missingGoalPmTaskIds.length > 0
        ? `Link missing Phase 3 PM rows from the active goal: ${missingGoalPmTaskIds.join(", ")}.`
        : "Keep all required Phase 3 PM rows linked to the active goal."
  };
}

function clearanceEvidenceItem(
  clearancePackage: Phase3ClearancePackage,
  commandPlan: Phase3ClearanceCommandPlan,
  blockerPriority: Phase3ClearanceBlockerPrioritySnapshot
): Phase3ClearanceTraceabilityItem {
  if (
    clearancePackage.state === "blocked" ||
    commandPlan.state === "blocked" ||
    blockerPriority.state === "blocked"
  ) {
    return {
      id: `${SNAPSHOT_ID}:clearance-evidence`,
      label: "Clearance evidence trace",
      kind: "clearance-evidence",
      status: "blocked",
      detail: "Blocked Phase 3 clearance, command, or blocker-priority evidence is still linked.",
      nextAction: publicText(
        blockerPriority.nextAction,
        "Clear blocked Phase 3 evidence before the trace can pass."
      )
    };
  }

  if (clearancePackage.canExit && blockerPriority.openBlockerCount === 0) {
    return {
      id: `${SNAPSHOT_ID}:clearance-evidence`,
      label: "Clearance evidence trace",
      kind: "clearance-evidence",
      status: "ready",
      detail: "Clearance package, command plan, and blocker-priority queue agree that Phase 3 can exit.",
      nextAction: "Keep clearance evidence attached while recording owner handoff."
    };
  }

  return {
    id: `${SNAPSHOT_ID}:clearance-evidence`,
    label: "Clearance evidence trace",
    kind: "clearance-evidence",
    status: clearancePackage.state,
    detail: `${clearancePackage.openCount} clearance blockers remain; ${blockerPriority.commandAddressableCount} are command-addressable.`,
    nextAction: blockerPriority.nextAction
  };
}

function commandValidationItem(
  commandValidation: Phase3CommandValidationRecordValidation | undefined
): Phase3ClearanceTraceabilityItem {
  if (!commandValidation) {
    return {
      id: `${SNAPSHOT_ID}:command-validation`,
      label: "CLI validation trace",
      kind: "command-validation",
      status: "waiting",
      detail: "No Phase 3 CLI smoke validation freshness result is linked to traceability.",
      nextAction:
        "Link the freshness-reviewed Phase 3 CLI smoke validation record without using it to unlock desktop proof or handoff."
    };
  }

  return {
    id: `${SNAPSHOT_ID}:command-validation`,
    label: "CLI validation trace",
    kind: "command-validation",
    status: commandValidation.state,
    detail: publicText(
      commandValidation.detail,
      "Phase 3 CLI smoke validation freshness must be reviewed."
    ),
    nextAction: publicText(
      commandValidation.nextAction,
      "Review the Phase 3 CLI smoke validation record without using it to unlock desktop proof or handoff."
    )
  };
}

function handoffBoundaryItem(
  clearancePackage: Phase3ClearancePackage,
  handoffGate: Phase3HandoffGate
): Phase3ClearanceTraceabilityItem {
  if (handoffGate.canAdvanceProviderIntegration) {
    return {
      id: `${SNAPSHOT_ID}:handoff-boundary`,
      label: "Handoff boundary",
      kind: "handoff-boundary",
      status: "ready",
      detail: "Owner handoff is attached and provider integration can advance after review.",
      nextAction: "Keep provider integration tied to the owner-reviewed Phase 3 handoff."
    };
  }

  if (handoffGate.state === "blocked") {
    return {
      id: `${SNAPSHOT_ID}:handoff-boundary`,
      label: "Handoff boundary",
      kind: "handoff-boundary",
      status: "blocked",
      detail: "The Phase 3 handoff gate is blocked.",
      nextAction: handoffGate.nextAction
    };
  }

  return {
    id: `${SNAPSHOT_ID}:handoff-boundary`,
    label: "Handoff boundary",
    kind: "handoff-boundary",
    status:
      clearancePackage.canExit && handoffGate.state === "waiting"
        ? "waiting"
        : handoffGate.state,
    detail: clearancePackage.canExit
      ? handoffGate.state === "review"
        ? "Clearance is exit-ready, but the owner handoff record does not match current evidence."
        : "Clearance is exit-ready, but the owner handoff record is not attached yet."
      : "Provider integration remains held behind Phase 3 clearance.",
    nextAction: handoffGate.nextAction
  };
}

function goalHonestyItem(
  goal: RemainingGoalPlanItem | undefined,
  handoffGate: Phase3HandoffGate
): Phase3ClearanceTraceabilityItem {
  if (!goal) {
    return {
      id: `${SNAPSHOT_ID}:goal-honesty`,
      label: "Goal completion honesty",
      kind: "goal-honesty",
      status: "blocked",
      detail: "Goal completion cannot be evaluated because the Phase 3 goal is missing.",
      nextAction: "Restore the active Phase 3 clearance goal before reporting completion."
    };
  }

  if (!handoffGate.canAdvanceProviderIntegration && goal.completionPercent >= 100) {
    return {
      id: `${SNAPSHOT_ID}:goal-honesty`,
      label: "Goal completion honesty",
      kind: "goal-honesty",
      status: "blocked",
      detail: "Phase 3 is marked complete before the owner handoff can advance provider integration.",
      nextAction: "Lower Phase 3 completion or attach the owner-reviewed handoff before reporting completion."
    };
  }

  return {
    id: `${SNAPSHOT_ID}:goal-honesty`,
    label: "Goal completion honesty",
    kind: "goal-honesty",
    status: "ready",
    detail: `Phase 3 remains ${goal.status} at ${goal.completionPercent}% until owner handoff is ready.`,
    nextAction: "Keep Phase 3 completion below complete until the handoff boundary is ready."
  };
}

function buildAriaLabel(
  snapshot: Omit<Phase3ClearanceTraceabilitySnapshot, "ariaLabel">
): string {
  return (
    `${snapshot.label}: ${snapshot.statusLabel}; ${snapshot.readiness}% ready; ` +
    `${snapshot.linkedPmTaskCount}/${snapshot.requiredPmTaskCount} PM rows linked; ` +
    `${snapshot.openTraceCount} open trace rows; next action: ${snapshot.nextAction}`
  );
}

export function buildPhase3ClearanceTraceability(
  input: Phase3ClearanceTraceabilityInput
): Phase3ClearanceTraceabilitySnapshot {
  const goals = input.goals ?? remainingGoalPlan;
  const pmTasks = input.pmTasks ?? createDefaultProjectManagementPhasePlan();
  const goal = goals.find((item) => item.id === PHASE3_CLEARANCE_GOAL_ID);
  const pmTaskIds = new Set(pmTasks.map((task) => task.id));
  const goalPmTaskIds = new Set(goal?.pmTaskIds ?? []);
  const missingPmTaskIds = REQUIRED_PHASE3_CLEARANCE_PM_TASK_IDS.filter(
    (taskId) => !pmTaskIds.has(taskId)
  );
  const missingGoalPmTaskIds = REQUIRED_PHASE3_CLEARANCE_PM_TASK_IDS.filter(
    (taskId) => !goalPmTaskIds.has(taskId)
  );
  const linkedPmTaskCount =
    REQUIRED_PHASE3_CLEARANCE_PM_TASK_IDS.length - missingGoalPmTaskIds.length;
  const items = [
    goalItem(goal),
    pmCoverageItem(missingPmTaskIds, missingGoalPmTaskIds),
    clearanceEvidenceItem(
      input.clearancePackage,
      input.commandPlan,
      input.blockerPriority
    ),
    commandValidationItem(input.commandValidation),
    handoffBoundaryItem(input.clearancePackage, input.handoffGate),
    goalHonestyItem(goal, input.handoffGate)
  ];
  const state = resolveState(items);
  const draft = {
    id: SNAPSHOT_ID,
    label: SNAPSHOT_LABEL,
    state,
    statusLabel: STATUS_LABELS[state],
    readiness: scoreItems(items),
    linkedGoalId: goal?.id ?? PHASE3_CLEARANCE_GOAL_ID,
    linkedPhaseId: PHASE3_CLEARANCE_PHASE_ID,
    requiredPmTaskCount: REQUIRED_PHASE3_CLEARANCE_PM_TASK_IDS.length,
    linkedPmTaskCount,
    missingPmTaskIds,
    missingGoalPmTaskIds,
    openTraceCount: items.filter((item) => item.status !== "ready").length,
    canTrustTrace: state === "ready" && missingPmTaskIds.length === 0 && missingGoalPmTaskIds.length === 0,
    nextAction: firstNextAction(items),
    safety: SAFETY,
    items
  };

  return {
    ...draft,
    ariaLabel: buildAriaLabel(draft)
  };
}
