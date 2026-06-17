import type {
  Phase3ClearancePackage,
  Phase3ClearancePackageState
} from "./phase3ClearancePackage";
import type { Phase3HandoffRecordValidation } from "./phase3HandoffRecord";

export type Phase3HandoffGateState = Phase3ClearancePackageState;

export type Phase3HandoffGateItemKind =
  | "desktop-proof"
  | "blocker-visibility"
  | "handoff-record"
  | "provider-boundary";

export interface Phase3HandoffGateItem {
  readonly id: string;
  readonly label: string;
  readonly kind: Phase3HandoffGateItemKind;
  readonly status: Phase3HandoffGateState;
  readonly detail: string;
  readonly nextAction: string;
}

export interface Phase3HandoffGate {
  readonly id: string;
  readonly label: string;
  readonly state: Phase3HandoffGateState;
  readonly statusLabel: string;
  readonly readiness: number;
  readonly canAdvanceProviderIntegration: boolean;
  readonly readyCount: number;
  readonly reviewCount: number;
  readonly blockedCount: number;
  readonly waitingCount: number;
  readonly exactBlockerCount: number;
  readonly nextAction: string;
  readonly safety: string;
  readonly ariaLabel: string;
  readonly items: readonly Phase3HandoffGateItem[];
}

export interface Phase3HandoffGateInput {
  readonly clearancePackage: Phase3ClearancePackage;
  readonly handoffRecordState?: Phase3HandoffGateState;
  readonly handoffRecordValidation?: Phase3HandoffRecordValidation;
}

const GATE_ID = "phase-3-handoff-gate";
const GATE_LABEL = "Phase 3 handoff gate";
const SAFETY =
  "Phase 3 handoff gate is evidence-only. It does not run smoke actions, mutate runtime state, launch providers, push branches, or advance provider integration automatically.";

const STATUS_LABELS: Record<Phase3HandoffGateState, string> = {
  ready: "Ready",
  review: "Review",
  blocked: "Blocked",
  waiting: "Waiting"
};

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

function stateWeight(state: Phase3HandoffGateState): number {
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

function resolveState(items: readonly Phase3HandoffGateItem[]): Phase3HandoffGateState {
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

function scoreItems(items: readonly Phase3HandoffGateItem[]): number {
  if (items.length === 0) {
    return 0;
  }

  return Math.round(
    items.reduce((sum, item) => sum + stateWeight(item.status), 0) / items.length
  );
}

function firstNextAction(items: readonly Phase3HandoffGateItem[]): string {
  return (
    items.find((item) => item.status === "blocked")?.nextAction ??
    items.find((item) => item.status === "review")?.nextAction ??
    items.find((item) => item.status === "waiting")?.nextAction ??
    "Record Phase 3 handoff completion and keep provider integration behind owner review."
  );
}

function desktopProofItem(
  clearancePackage: Phase3ClearancePackage
): Phase3HandoffGateItem {
  const status = clearancePackage.canExit ? "ready" : clearancePackage.state;

  return {
    id: `${GATE_ID}:desktop-proof`,
    label: "Desktop proof clearance",
    kind: "desktop-proof",
    status,
    detail: `${clearancePackage.readyCount} ready and ${clearancePackage.openCount} open Phase 3 evidence row${clearancePackage.openCount === 1 ? "" : "s"}.`,
    nextAction: publicText(
      clearancePackage.nextAction,
      "Clear Phase 3 desktop proof evidence before handoff."
    )
  };
}

function blockerVisibilityItem(
  clearancePackage: Phase3ClearancePackage
): Phase3HandoffGateItem {
  if (clearancePackage.openCount > 0) {
    return {
      id: `${GATE_ID}:blocker-visibility`,
      label: "Exact blocker visibility",
      kind: "blocker-visibility",
      status: clearancePackage.state,
      detail: `${clearancePackage.openCount} exact Phase 3 blocker${clearancePackage.openCount === 1 ? "" : "s"} are visible in the clearance package.`,
      nextAction: publicText(
        clearancePackage.blockers[0]?.nextAction,
        "Resolve the first exact Phase 3 blocker before handoff."
      )
    };
  }

  return {
    id: `${GATE_ID}:blocker-visibility`,
    label: "Exact blocker visibility",
    kind: "blocker-visibility",
    status: "ready",
    detail: "The clearance package has no open Phase 3 blockers.",
    nextAction: "Keep exact blocker visibility attached to the Phase 3 handoff record."
  };
}

function handoffRecordItem(
  clearancePackage: Phase3ClearancePackage,
  handoffRecordState: Phase3HandoffGateState | undefined,
  handoffRecordValidation: Phase3HandoffRecordValidation | undefined
): Phase3HandoffGateItem {
  const status = handoffRecordValidation?.state ?? handoffRecordState ?? "waiting";

  return {
    id: `${GATE_ID}:handoff-record`,
    label: "Owner handoff record",
    kind: "handoff-record",
    status,
    detail:
      handoffRecordValidation?.detail ??
      (status === "ready"
        ? "Owner-reviewed Phase 3 handoff record is attached."
        : "Owner-reviewed Phase 3 handoff record is not attached yet."),
    nextAction:
      handoffRecordValidation?.nextAction ??
      (status === "ready"
        ? "Keep the owner-reviewed handoff record attached before Phase 4 work advances."
        : clearancePackage.canExit
          ? "Record the owner-reviewed Phase 3 handoff before advancing provider integration."
          : "Wait for the clearance package to reach exit-ready before recording handoff.")
  };
}

function providerBoundaryItem(
  clearancePackage: Phase3ClearancePackage,
  handoffRecordState: Phase3HandoffGateState | undefined,
  handoffRecordValidation: Phase3HandoffRecordValidation | undefined
): Phase3HandoffGateItem {
  const validatedRecordState = handoffRecordValidation?.state ?? handoffRecordState;

  if (clearancePackage.state === "blocked") {
    return {
      id: `${GATE_ID}:provider-boundary`,
      label: "Provider boundary",
      kind: "provider-boundary",
      status: "blocked",
      detail: "Provider integration remains blocked because Phase 3 evidence is blocked.",
      nextAction: publicText(
        clearancePackage.nextAction,
        "Clear the blocked Phase 3 evidence before advancing provider integration."
      )
    };
  }

  if (!clearancePackage.canExit) {
    return {
      id: `${GATE_ID}:provider-boundary`,
      label: "Provider boundary",
      kind: "provider-boundary",
      status: clearancePackage.state,
      detail: "Provider integration remains held until Phase 3 clearance reaches exit-ready.",
      nextAction: publicText(
        clearancePackage.nextAction,
        "Complete Phase 3 clearance before advancing provider integration."
      )
    };
  }

  if (validatedRecordState !== "ready") {
    return {
      id: `${GATE_ID}:provider-boundary`,
      label: "Provider boundary",
      kind: "provider-boundary",
      status: validatedRecordState === "review" ? "review" : "waiting",
      detail:
        handoffRecordValidation?.state === "review"
          ? "Provider integration remains held because the owner handoff record does not match current evidence."
          : "Provider integration remains held until the owner handoff record is attached.",
      nextAction:
        handoffRecordValidation?.state === "review"
          ? handoffRecordValidation.nextAction
          : "Attach the owner-reviewed Phase 3 handoff before advancing provider integration."
    };
  }

  return {
    id: `${GATE_ID}:provider-boundary`,
    label: "Provider boundary",
    kind: "provider-boundary",
    status: "ready",
    detail: "Provider integration can be advanced after owner review.",
    nextAction: "Advance Phase 4 provider integration from the reviewed handoff."
  };
}

function buildAriaLabel(snapshot: Omit<Phase3HandoffGate, "ariaLabel">): string {
  return (
    `${snapshot.label}: ${snapshot.statusLabel}; ${snapshot.readiness}% ready; ` +
    `${snapshot.readyCount} ready, ${snapshot.reviewCount} review, ` +
    `${snapshot.blockedCount} blocked, ${snapshot.waitingCount} waiting; ` +
    `${snapshot.exactBlockerCount} exact blockers; next action: ${snapshot.nextAction}`
  );
}

export function buildPhase3HandoffGate(
  input: Phase3HandoffGateInput
): Phase3HandoffGate {
  const items = [
    desktopProofItem(input.clearancePackage),
    blockerVisibilityItem(input.clearancePackage),
    handoffRecordItem(
      input.clearancePackage,
      input.handoffRecordState,
      input.handoffRecordValidation
    ),
    providerBoundaryItem(
      input.clearancePackage,
      input.handoffRecordState,
      input.handoffRecordValidation
    )
  ];
  const state = resolveState(items);
  const readyCount = items.filter((item) => item.status === "ready").length;
  const reviewCount = items.filter((item) => item.status === "review").length;
  const blockedCount = items.filter((item) => item.status === "blocked").length;
  const waitingCount = items.filter((item) => item.status === "waiting").length;
  const draft = {
    id: GATE_ID,
    label: GATE_LABEL,
    state,
    statusLabel: STATUS_LABELS[state],
    readiness: scoreItems(items),
    canAdvanceProviderIntegration:
      state === "ready" &&
      input.clearancePackage.canExit &&
      (input.handoffRecordValidation?.state ?? input.handoffRecordState) === "ready",
    readyCount,
    reviewCount,
    blockedCount,
    waitingCount,
    exactBlockerCount: input.clearancePackage.openCount,
    nextAction: firstNextAction(items),
    safety: SAFETY,
    items
  };

  return {
    ...draft,
    ariaLabel: buildAriaLabel(draft)
  };
}
