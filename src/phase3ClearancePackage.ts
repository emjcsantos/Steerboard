import type {
  Phase3ExitGateDiagnostic,
  Phase3ExitGateEvidence,
  Phase3ExitGateState
} from "./phase3ExitGateEvidence";
import type {
  Phase3OwnerTestingAction
} from "./phase3OwnerTestingActions";

export type Phase3ClearancePackageState = Phase3ExitGateState;

export interface Phase3ClearanceBlocker {
  readonly id: string;
  readonly label: string;
  readonly state: Phase3ClearancePackageState;
  readonly detail?: string;
  readonly nextAction: string;
  readonly pmTaskId: string;
  readonly evidenceKey: string;
}

export interface Phase3ClearancePackage {
  readonly state: Phase3ClearancePackageState;
  readonly statusLabel: string;
  readonly readiness: number;
  readonly canExit: boolean;
  readonly detail: string;
  readonly nextAction: string;
  readonly primaryActionId?: string;
  readonly primaryActionLabel?: string;
  readonly readyCount: number;
  readonly openCount: number;
  readonly blockerCount: number;
  readonly reviewCount: number;
  readonly waitingCount: number;
  readonly blockers: readonly Phase3ClearanceBlocker[];
  readonly safety: string;
}

export interface Phase3ClearancePackageInput {
  readonly exitGate?: Phase3ExitGateEvidence;
  readonly actions?: readonly Phase3OwnerTestingAction[];
}

const STATUS_LABELS: Record<Phase3ClearancePackageState, string> = {
  ready: "Ready",
  review: "Needs review",
  blocked: "Blocked",
  waiting: "Waiting"
};

const CLEARANCE_SAFETY =
  "This clearance package is evidence-only; it does not run commands, mutate runtime state, or launch providers.";

function isActionRunnable(action: Phase3OwnerTestingAction): boolean {
  return action.kind === "smoke" && !action.disabled && action.state === "recommended";
}

function isRunningAction(action: Phase3OwnerTestingAction): boolean {
  return action.kind === "smoke" && action.state === "running";
}

function isOpenState(state: Phase3ExitGateState): boolean {
  return state !== "ready";
}

function actionMatchesBlocker(
  action: Phase3OwnerTestingAction,
  blocker: Phase3ClearanceBlocker | undefined
): boolean {
  if (!blocker) {
    return false;
  }

  if (blocker.id === "phase3-exit-gate:live-control-smoke") {
    return action.id === "phase3-owner-testing:live-control-smoke";
  }
  if (blocker.id === "phase3-exit-gate:active-turn-interrupt-smoke") {
    return action.id === "phase3-owner-testing:active-turn-interrupt-smoke";
  }
  if (blocker.id === "phase3-exit-gate:active-turn-steer-smoke") {
    return action.id === "phase3-owner-testing:active-turn-steer-smoke";
  }

  return false;
}

function toBlocker(item: Phase3ExitGateDiagnostic): Phase3ClearanceBlocker {
  return {
    id: item.id,
    label: item.label,
    state: item.state,
    detail: item.detail,
    nextAction: item.nextAction,
    pmTaskId: item.pmTaskId,
    evidenceKey: item.evidenceKey
  };
}

function detailForState(
  state: Phase3ClearancePackageState,
  blockers: readonly Phase3ClearanceBlocker[]
): string {
  if (state === "ready") {
    return "Phase 3 has complete slash, session-control, live-control, interrupt, and steer evidence.";
  }

  if (state === "blocked") {
    return "Phase 3 cannot clear while blocked evidence remains.";
  }

  if (state === "review") {
    return "Phase 3 has evidence, but at least one proof still needs review before handoff.";
  }

  if (blockers.length > 0) {
    return "Phase 3 is waiting on missing or malformed evidence.";
  }

  return "Phase 3 does not have enough evidence to produce a clearance decision.";
}

function nextActionForState(
  state: Phase3ClearancePackageState,
  blockers: readonly Phase3ClearanceBlocker[],
  action: Phase3OwnerTestingAction | undefined
): string {
  if (state === "ready") {
    return "Record the Phase 3 handoff before Phase 4 review resumes and proof-export offline verification is trusted.";
  }

  if (action) {
    return `Run ${action.label} from Owner Testing.`;
  }

  if (blockers.length > 0) {
    return blockers[0].nextAction;
  }

  return "Collect Phase 3 slash, session-control, and desktop smoke evidence.";
}

export function buildPhase3ClearancePackage(
  input: Phase3ClearancePackageInput = {}
): Phase3ClearancePackage {
  const exitGate = input.exitGate;
  const actions = input.actions ?? [];

  if (!exitGate) {
    return {
      state: "waiting",
      statusLabel: STATUS_LABELS.waiting,
      readiness: 35,
      canExit: false,
      detail: "Phase 3 cannot be evaluated until exit-gate evidence is available.",
      nextAction: "Collect Phase 3 slash, session-control, and desktop smoke evidence.",
      readyCount: 0,
      openCount: 1,
      blockerCount: 0,
      reviewCount: 0,
      waitingCount: 1,
      blockers: [
        {
          id: "phase3-clearance:exit-gate",
          label: "Exit gate evidence",
          state: "waiting",
          nextAction: "Collect Phase 3 slash, session-control, and desktop smoke evidence.",
          pmTaskId: "phase-03-child-exit-gate",
          evidenceKey: "phase3.exit-gate.missing"
        }
      ],
      safety: CLEARANCE_SAFETY
    };
  }

  const blockers = exitGate.items.filter((item) => isOpenState(item.state)).map(toBlocker);
  const runningAction = actions.find(isRunningAction);
  const firstBlocker = blockers[0];
  const blockerAction =
    actions.find((action) => isRunningAction(action) && actionMatchesBlocker(action, firstBlocker)) ??
    actions.find((action) => isActionRunnable(action) && actionMatchesBlocker(action, firstBlocker));
  const fallbackAction = firstBlocker ? undefined : runningAction ?? actions.find(isActionRunnable);
  const primaryAction = blockerAction ?? fallbackAction;
  const state = exitGate.state;
  const counts = exitGate.counts;

  return {
    state,
    statusLabel: STATUS_LABELS[state],
    readiness: exitGate.readiness,
    canExit: exitGate.pass === true && state === "ready",
    detail: detailForState(state, blockers),
    nextAction: nextActionForState(state, blockers, primaryAction),
    primaryActionId: primaryAction?.id,
    primaryActionLabel: primaryAction?.label,
    readyCount: counts.ready,
    openCount: blockers.length,
    blockerCount: counts.blocked,
    reviewCount: counts.review,
    waitingCount: counts.waiting,
    blockers,
    safety: CLEARANCE_SAFETY
  };
}
