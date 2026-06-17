import type {
  Phase3ClearancePackage,
  Phase3ClearancePackageState
} from "./phase3ClearancePackage";
import type { Phase3OwnerTestingAction } from "./phase3OwnerTestingActions";

export type Phase3ClearanceCommandPlanState = Phase3ClearancePackageState;

export type Phase3ClearanceCommandPlanItemKind =
  | "slash-evidence"
  | "session-control"
  | "desktop-smoke";

export interface Phase3ClearanceCommandPlanItem {
  readonly id: string;
  readonly label: string;
  readonly kind: Phase3ClearanceCommandPlanItemKind;
  readonly state: Phase3ClearanceCommandPlanState;
  readonly detail: string;
  readonly nextAction: string;
}

export interface Phase3ClearanceCommandPlan {
  readonly id: string;
  readonly label: string;
  readonly state: Phase3ClearanceCommandPlanState;
  readonly statusLabel: string;
  readonly command: string;
  readonly canRunCommand: boolean;
  readonly coveredSmokeCount: number;
  readonly readySmokeCount: number;
  readonly openSmokeCount: number;
  readonly nextAction: string;
  readonly safety: string;
  readonly ariaLabel: string;
  readonly items: readonly Phase3ClearanceCommandPlanItem[];
}

export interface Phase3ClearanceCommandPlanInput {
  readonly clearancePackage: Phase3ClearancePackage;
  readonly actions?: readonly Phase3OwnerTestingAction[];
}

const PLAN_ID = "phase-3-clearance-command-plan";
const PLAN_LABEL = "Phase 3 desktop smoke command plan";
const PHASE3_SMOKE_COMMAND = "npm.cmd run smoke:phase3";
const SAFETY =
  "Phase 3 command plan is evidence-only. It displays the explicit local smoke command but does not run commands, launch providers, mutate runtime state, or record handoff automatically.";

const STATUS_LABELS: Record<Phase3ClearanceCommandPlanState, string> = {
  ready: "Ready",
  review: "Review",
  blocked: "Blocked",
  waiting: "Waiting"
};

const SMOKE_ACTION_IDS = new Set([
  "phase3-owner-testing:live-control-smoke",
  "phase3-owner-testing:active-turn-interrupt-smoke",
  "phase3-owner-testing:active-turn-steer-smoke"
]);

function stateWeight(state: Phase3ClearanceCommandPlanState): number {
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
  items: readonly Phase3ClearanceCommandPlanItem[]
): Phase3ClearanceCommandPlanState {
  if (items.some((item) => item.state === "blocked")) {
    return "blocked";
  }
  if (items.some((item) => item.state === "review")) {
    return "review";
  }
  if (items.some((item) => item.state === "waiting")) {
    return "waiting";
  }
  return "ready";
}

function firstNextAction(
  items: readonly Phase3ClearanceCommandPlanItem[],
  canRunCommand: boolean
): string {
  if (canRunCommand) {
    return `Run ${PHASE3_SMOKE_COMMAND} locally to refresh live-control, active-turn interrupt, and active-turn steer proofs.`;
  }

  return (
    items.find((item) => item.state === "blocked")?.nextAction ??
    items.find((item) => item.state === "review")?.nextAction ??
    items.find((item) => item.state === "waiting")?.nextAction ??
    "Desktop smoke command is no longer needed; record Phase 3 handoff after owner review."
  );
}

function smokeActions(
  actions: readonly Phase3OwnerTestingAction[]
): readonly Phase3OwnerTestingAction[] {
  return actions.filter((action) => SMOKE_ACTION_IDS.has(action.id));
}

function smokeBundleState(
  actions: readonly Phase3OwnerTestingAction[],
  clearancePackage: Phase3ClearancePackage
): Phase3ClearanceCommandPlanState {
  const smokes = smokeActions(actions);

  if (smokes.some((action) => action.state === "blocked")) {
    return "blocked";
  }
  if (smokes.some((action) => action.state === "running")) {
    return "review";
  }
  if (smokes.some((action) => action.state === "recommended")) {
    return "waiting";
  }
  if (smokes.length === 3 && smokes.every((action) => action.state === "ready")) {
    return "ready";
  }
  if (clearancePackage.canExit) {
    return "ready";
  }

  return "waiting";
}

function buildItems(
  clearancePackage: Phase3ClearancePackage,
  actions: readonly Phase3OwnerTestingAction[]
): readonly Phase3ClearanceCommandPlanItem[] {
  const blockerById = new Map(clearancePackage.blockers.map((blocker) => [blocker.id, blocker]));
  const slashBlocker = blockerById.get("phase3-exit-gate:slash-execution");
  const sessionBlocker = blockerById.get("phase3-exit-gate:session-controls");
  const smokeState = smokeBundleState(actions, clearancePackage);

  return [
    {
      id: `${PLAN_ID}:slash-evidence`,
      label: "Slash execution evidence",
      kind: "slash-evidence",
      state: slashBlocker?.state ?? "ready",
      detail: slashBlocker
        ? "Slash execution proof is still open before Phase 3 can clear."
        : "Slash execution proof is ready or not the active blocker.",
      nextAction: slashBlocker?.nextAction ?? "Keep provider-routed slash proof attached."
    },
    {
      id: `${PLAN_ID}:session-control`,
      label: "Session-control evidence",
      kind: "session-control",
      state: sessionBlocker?.state ?? "ready",
      detail: sessionBlocker
        ? "Session-control proof is still open before Phase 3 can clear."
        : "Session-control proof is ready or not the active blocker.",
      nextAction: sessionBlocker?.nextAction ?? "Keep session-control proof attached."
    },
    {
      id: `${PLAN_ID}:desktop-smoke`,
      label: "Desktop smoke bundle",
      kind: "desktop-smoke",
      state: smokeState,
      detail: `${PHASE3_SMOKE_COMMAND} covers live-control, active-turn interrupt, and active-turn steer proof rows.`,
      nextAction:
        smokeState === "ready"
          ? "Keep desktop smoke proofs attached and move to owner handoff review."
          : `Run ${PHASE3_SMOKE_COMMAND} from the Steerboard workspace when desktop session start is available.`
    }
  ];
}

function buildAriaLabel(
  plan: Omit<Phase3ClearanceCommandPlan, "ariaLabel">
): string {
  return (
    `${plan.label}: ${plan.statusLabel}; command ${plan.canRunCommand ? "available" : "held"}; ` +
    `${plan.readySmokeCount}/${plan.coveredSmokeCount} smoke proofs ready; next action: ${plan.nextAction}`
  );
}

export function buildPhase3ClearanceCommandPlan(
  input: Phase3ClearanceCommandPlanInput
): Phase3ClearanceCommandPlan {
  const actions = input.actions ?? [];
  const smokes = smokeActions(actions);
  const readySmokeCount = smokes.filter((action) => action.state === "ready").length;
  const openSmokeCount = Math.max(0, 3 - readySmokeCount);
  const items = buildItems(input.clearancePackage, actions);
  const state = resolveState(items);
  const canRunCommand =
    state !== "blocked" &&
    !input.clearancePackage.canExit &&
    smokes.some((action) => action.state === "recommended" && !action.disabled);
  const draft = {
    id: PLAN_ID,
    label: PLAN_LABEL,
    state,
    statusLabel: STATUS_LABELS[state],
    command: PHASE3_SMOKE_COMMAND,
    canRunCommand,
    coveredSmokeCount: 3,
    readySmokeCount,
    openSmokeCount,
    nextAction: firstNextAction(items, canRunCommand),
    safety: SAFETY,
    items
  };

  return {
    ...draft,
    ariaLabel: buildAriaLabel(draft)
  };
}
