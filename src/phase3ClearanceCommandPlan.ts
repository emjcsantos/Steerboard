import type {
  Phase3ClearancePackage,
  Phase3ClearancePackageState
} from "./phase3ClearancePackage";
import type { Phase3OwnerTestingAction } from "./phase3OwnerTestingActions";

export type Phase3ClearanceCommandPlanState = Phase3ClearancePackageState;

export type Phase3ClearanceCommandPlanItemKind =
  | "slash-evidence"
  | "session-control"
  | "live-control-smoke"
  | "active-turn-interrupt-smoke"
  | "active-turn-steer-smoke";

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

const SMOKE_PROOF_ROWS = [
  {
    actionId: "phase3-owner-testing:live-control-smoke",
    blockerId: "phase3-exit-gate:live-control-smoke",
    kind: "live-control-smoke",
    label: "Live-control smoke proof"
  },
  {
    actionId: "phase3-owner-testing:active-turn-interrupt-smoke",
    blockerId: "phase3-exit-gate:active-turn-interrupt-smoke",
    kind: "active-turn-interrupt-smoke",
    label: "Active-turn interrupt smoke proof"
  },
  {
    actionId: "phase3-owner-testing:active-turn-steer-smoke",
    blockerId: "phase3-exit-gate:active-turn-steer-smoke",
    kind: "active-turn-steer-smoke",
    label: "Active-turn steer smoke proof"
  }
] as const;

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
  canRunCommand: boolean,
  blockerNextAction: string | undefined
): string {
  if (canRunCommand) {
    return `Run ${PHASE3_SMOKE_COMMAND} locally to refresh live-control, active-turn interrupt, and active-turn steer proofs.`;
  }

  return (
    blockerNextAction ??
    items.find((item) => item.state === "blocked")?.nextAction ??
    items.find((item) => item.state === "review")?.nextAction ??
    items.find((item) => item.state === "waiting")?.nextAction ??
    "Desktop smoke command is no longer needed; record Phase 3 handoff after owner review."
  );
}

function isSmokeBlocker(blockerId: string | undefined): boolean {
  return SMOKE_PROOF_ROWS.some((proofRow) => proofRow.blockerId === blockerId);
}

function buildItems(
  clearancePackage: Phase3ClearancePackage
): readonly Phase3ClearanceCommandPlanItem[] {
  const blockerById = new Map(clearancePackage.blockers.map((blocker) => [blocker.id, blocker]));
  const slashBlocker = blockerById.get("phase3-exit-gate:slash-execution");
  const sessionBlocker = blockerById.get("phase3-exit-gate:session-controls");

  const slashItem: Phase3ClearanceCommandPlanItem = {
    id: `${PLAN_ID}:slash-evidence`,
    label: "Slash execution evidence",
    kind: "slash-evidence",
    state: slashBlocker?.state ?? "ready",
    detail: slashBlocker
      ? "Slash execution proof is still open before Phase 3 can clear."
      : "Slash execution proof is ready or not the active blocker.",
    nextAction: slashBlocker?.nextAction ?? "Keep provider-routed slash proof attached."
  };
  const sessionItem: Phase3ClearanceCommandPlanItem = {
    id: `${PLAN_ID}:session-control`,
    label: "Session-control evidence",
    kind: "session-control",
    state: sessionBlocker?.state ?? "ready",
    detail: sessionBlocker
      ? "Session-control proof is still open before Phase 3 can clear."
      : "Session-control proof is ready or not the active blocker.",
    nextAction: sessionBlocker?.nextAction ?? "Keep session-control proof attached."
  };
  const smokeItems = SMOKE_PROOF_ROWS.map((row): Phase3ClearanceCommandPlanItem => {
      const blocker = blockerById.get(row.blockerId);
      const state = blocker?.state ??
        "ready";

      return {
        id: `${PLAN_ID}:${row.kind}`,
        label: row.label,
        kind: row.kind,
        state,
        detail: `${PHASE3_SMOKE_COMMAND} covers this ${row.label.toLowerCase()} row.`,
        nextAction:
          state === "ready"
            ? `Keep ${row.label.toLowerCase()} attached and move to owner handoff review.`
            : blocker?.nextAction ??
              `Run ${PHASE3_SMOKE_COMMAND} from the Steerboard workspace when desktop session start is available.`
      };
    });

  return [slashItem, sessionItem, ...smokeItems];
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
  const items = buildItems(input.clearancePackage);
  const smokeItems = items.filter((item) => item.kind.endsWith("-smoke"));
  const readySmokeCount = smokeItems.filter((item) => item.state === "ready").length;
  const openSmokeCount = Math.max(0, 3 - readySmokeCount);
  const state = resolveState(items);
  const canRunCommand =
    !input.clearancePackage.canExit &&
    isSmokeBlocker(input.clearancePackage.blockers[0]?.id);
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
    nextAction: firstNextAction(items, canRunCommand, input.clearancePackage.blockers[0]?.nextAction),
    safety: SAFETY,
    items
  };

  return {
    ...draft,
    ariaLabel: buildAriaLabel(draft)
  };
}
