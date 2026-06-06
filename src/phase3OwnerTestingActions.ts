export type Phase3OwnerTestingActionKind = "guidance" | "smoke";
export type Phase3OwnerTestingActionState = "ready" | "recommended" | "blocked" | "running";
export type Phase3ExitGateEvidenceState = "ready" | "review" | "blocked" | "waiting";

export interface Phase3OwnerTestingAction {
  readonly id: string;
  readonly label: string;
  readonly kind: Phase3OwnerTestingActionKind;
  readonly state: Phase3OwnerTestingActionState;
  readonly detail: string;
  readonly buttonLabel: string;
  readonly disabled: boolean;
}

export interface Phase3OwnerTestingGateItemInput {
  readonly state?: unknown;
}

export interface Phase3OwnerTestingLoading {
  readonly liveControlSmoke?: boolean;
  readonly activeTurnInterruptSmoke?: boolean;
  readonly activeTurnSteerSmoke?: boolean;
}

export interface Phase3OwnerTestingActionsInput {
  readonly canStartSession: boolean;
  readonly liveControlSmokeGate?: Phase3OwnerTestingGateItemInput;
  readonly activeTurnInterruptSmokeGate?: Phase3OwnerTestingGateItemInput;
  readonly activeTurnSteerSmokeGate?: Phase3OwnerTestingGateItemInput;
  readonly loading?: Phase3OwnerTestingLoading;
}

const PHASE3_ACTION_IDS = {
  slashGuidance: "phase3-owner-testing:slash-guidance",
  sessionGuidance: "phase3-owner-testing:session-guidance",
  liveControlSmoke: "phase3-owner-testing:live-control-smoke",
  activeTurnInterruptSmoke: "phase3-owner-testing:active-turn-interrupt-smoke",
  activeTurnSteerSmoke: "phase3-owner-testing:active-turn-steer-smoke"
} as const;

function normalizeGateState(value: unknown): Phase3ExitGateEvidenceState {
  const state = typeof value === "string" ? value.toLowerCase() : "";
  if (state === "ready" || state === "review" || state === "blocked" || state === "waiting") {
    return state;
  }
  return "waiting";
}

function detailForSmokeAction(
  label: string,
  state: Phase3OwnerTestingActionState
): string {
  if (state === "blocked") {
    return `${label} is not available while phase start conditions are not met. Use Arena session controls to unlock session-based checks.`;
  }
  if (state === "running") {
    return `${label} is running in desktop probe mode.`;
  }
  if (state === "ready") {
    return `${label} completed successfully.`;
  }
  return `${label} still needs a fresh proof to complete this phase-3 readiness gate.`;
}

function buttonForSmokeAction(state: Phase3OwnerTestingActionState): string {
  if (state === "running") {
    return "Running smoke...";
  }
  if (state === "blocked") {
    return "Open session controls";
  }
  if (state === "ready") {
    return "Smoke verified";
  }
  return "Run smoke";
}

function resolveSmokeActionState(
  canStartSession: boolean,
  isLoading: boolean,
  gateState: Phase3ExitGateEvidenceState
): Phase3OwnerTestingActionState {
  if (!canStartSession) {
    return "blocked";
  }
  if (isLoading) {
    return "running";
  }
  return gateState === "ready" ? "ready" : "recommended";
}

function smokeAction(
  id: string,
  label: string,
  canStartSession: boolean,
  isLoading: boolean,
  gateItem: Phase3OwnerTestingGateItemInput | undefined
): Phase3OwnerTestingAction {
  const gateState = normalizeGateState(gateItem?.state);
  const state = resolveSmokeActionState(canStartSession, isLoading, gateState);

  return {
    id,
    label,
    kind: "smoke",
    state,
    detail: detailForSmokeAction(label, state),
    buttonLabel: buttonForSmokeAction(state),
    disabled: !canStartSession || isLoading
  };
}

export function buildPhase3OwnerTestingActions(
  input: Phase3OwnerTestingActionsInput
): readonly Phase3OwnerTestingAction[] {
  const canStartSession = input.canStartSession === true;
  const loading = input.loading ?? {};

  return [
    {
      id: PHASE3_ACTION_IDS.slashGuidance,
      label: "Slash guidance",
      kind: "guidance",
      state: "blocked",
      detail:
        "Use the Arena composer to run slash-command readiness checks and gather phase-3 evidence; this action is guidance only.",
      buttonLabel: "Use Arena composer",
      disabled: true
    },
    {
      id: PHASE3_ACTION_IDS.sessionGuidance,
      label: "Session guidance",
      kind: "guidance",
      state: "blocked",
      detail:
        "Use the Arena session controls to trigger live, interrupt, and steer phase-3 checks; actions here are informational only.",
      buttonLabel: "Use session controls",
      disabled: true
    },
    smokeAction(
      PHASE3_ACTION_IDS.liveControlSmoke,
      "Live-control smoke",
      canStartSession,
      loading.liveControlSmoke === true,
      input.liveControlSmokeGate
    ),
    smokeAction(
      PHASE3_ACTION_IDS.activeTurnInterruptSmoke,
      "Active-turn interrupt smoke",
      canStartSession,
      loading.activeTurnInterruptSmoke === true,
      input.activeTurnInterruptSmokeGate
    ),
    smokeAction(
      PHASE3_ACTION_IDS.activeTurnSteerSmoke,
      "Active-turn steer smoke",
      canStartSession,
      loading.activeTurnSteerSmoke === true,
      input.activeTurnSteerSmokeGate
    )
  ];
}
