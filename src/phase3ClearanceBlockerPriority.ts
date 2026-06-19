import type {
  Phase3ClearanceBlocker,
  Phase3ClearancePackage,
  Phase3ClearancePackageState
} from "./phase3ClearancePackage";
import type { Phase3ClearanceCommandPlan } from "./phase3ClearanceCommandPlan";

export type Phase3ClearanceBlockerPriorityState = Phase3ClearancePackageState;

export type Phase3ClearanceBlockerPriorityKind =
  | "slash-evidence"
  | "session-control"
  | "desktop-smoke"
  | "unknown";

export type Phase3ClearanceBlockerPrioritySeverity =
  | "critical"
  | "high"
  | "medium";

export interface Phase3ClearanceBlockerPriorityItem {
  readonly id: string;
  readonly blockerId: string;
  readonly label: string;
  readonly kind: Phase3ClearanceBlockerPriorityKind;
  readonly status: Phase3ClearanceBlockerPriorityState;
  readonly severity: Phase3ClearanceBlockerPrioritySeverity;
  readonly priority: number;
  readonly canUseSmokeCommand: boolean;
  readonly detail: string;
  readonly nextAction: string;
  readonly pmTaskId: string;
  readonly evidenceKey: string;
}

export interface Phase3ClearanceBlockerPrioritySnapshot {
  readonly id: string;
  readonly label: string;
  readonly state: Phase3ClearanceBlockerPriorityState;
  readonly statusLabel: string;
  readonly readiness: number;
  readonly openBlockerCount: number;
  readonly commandAddressableCount: number;
  readonly topPriorityLabel: string;
  readonly topPriorityEvidenceKey: string;
  readonly topPriorityPmTaskId: string;
  readonly topPriorityAction: string;
  readonly commandCanAddressTopBlocker: boolean;
  readonly nextAction: string;
  readonly safety: string;
  readonly ariaLabel: string;
  readonly items: readonly Phase3ClearanceBlockerPriorityItem[];
}

export interface Phase3ClearanceBlockerPriorityInput {
  readonly clearancePackage: Phase3ClearancePackage;
  readonly commandPlan: Phase3ClearanceCommandPlan;
}

const SNAPSHOT_ID = "phase-3-clearance-blocker-priority";
const SNAPSHOT_LABEL = "Phase 3 blocker priority";
const SAFETY =
  "Phase 3 blocker priority is evidence-only. It ranks existing blockers but does not run smoke commands, mutate runtime state, record handoff, launch providers, or push branches.";

const STATUS_LABELS: Record<Phase3ClearanceBlockerPriorityState, string> = {
  ready: "Ready",
  review: "Review",
  blocked: "Blocked",
  waiting: "Waiting"
};

const SMOKE_COMMAND = "npm.cmd run smoke:phase3";

function kindForBlocker(blockerId: string): Phase3ClearanceBlockerPriorityKind {
  if (blockerId.includes("slash-execution")) {
    return "slash-evidence";
  }
  if (blockerId.includes("session-controls")) {
    return "session-control";
  }
  if (blockerId.includes("-smoke")) {
    return "desktop-smoke";
  }
  return "unknown";
}

function severityForBlocker(
  blocker: Phase3ClearanceBlocker,
  kind: Phase3ClearanceBlockerPriorityKind
): Phase3ClearanceBlockerPrioritySeverity {
  if (blocker.state === "blocked") {
    return "critical";
  }
  if (kind === "slash-evidence" || kind === "session-control") {
    return "high";
  }
  return "medium";
}

function stateRank(state: Phase3ClearancePackageState): number {
  switch (state) {
    case "blocked":
      return 0;
    case "review":
      return 1;
    case "waiting":
      return 2;
    case "ready":
    default:
      return 3;
  }
}

function kindRank(kind: Phase3ClearanceBlockerPriorityKind): number {
  switch (kind) {
    case "slash-evidence":
      return 0;
    case "session-control":
      return 1;
    case "desktop-smoke":
      return 2;
    case "unknown":
    default:
      return 3;
  }
}

function priorityLaneRank(kind: Phase3ClearanceBlockerPriorityKind): number {
  if (kind === "slash-evidence" || kind === "session-control") {
    return 0;
  }
  if (kind === "desktop-smoke") {
    return 1;
  }
  return 2;
}

function smokeOrder(blockerId: string): number {
  if (blockerId.includes("live-control-smoke")) {
    return 0;
  }
  if (blockerId.includes("active-turn-interrupt-smoke")) {
    return 1;
  }
  if (blockerId.includes("active-turn-steer-smoke")) {
    return 2;
  }
  return 3;
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

function canUseSmokeCommand(
  kind: Phase3ClearanceBlockerPriorityKind,
  commandPlan: Phase3ClearanceCommandPlan
): boolean {
  return kind === "desktop-smoke" && commandPlan.canRunCommand;
}

function buildDetail(
  blocker: Phase3ClearanceBlocker,
  kind: Phase3ClearanceBlockerPriorityKind,
  commandAddressable: boolean
): string {
  const category =
    kind === "slash-evidence"
      ? "slash proof"
      : kind === "session-control"
        ? "session-control proof"
        : kind === "desktop-smoke"
          ? "desktop smoke proof"
          : "clearance proof";
  const commandText = commandAddressable
    ? ` ${SMOKE_COMMAND} can refresh this blocker.`
    : "";
  const blockerDetail = publicText(blocker.detail, "");
  const blockerDetailText = blockerDetail ? ` Detail: ${blockerDetail}` : "";

  return `${blocker.label} is the next ${category} blocker in ${blocker.state} state.${blockerDetailText}${commandText}`;
}

function resolveState(
  clearancePackage: Phase3ClearancePackage
): Phase3ClearanceBlockerPriorityState {
  if (clearancePackage.openCount === 0 || clearancePackage.canExit) {
    return "ready";
  }
  return clearancePackage.state;
}

function buildAriaLabel(
  snapshot: Omit<Phase3ClearanceBlockerPrioritySnapshot, "ariaLabel">
): string {
  return (
    `${snapshot.label}: ${snapshot.statusLabel}; ${snapshot.openBlockerCount} open blockers; ` +
    `top priority ${snapshot.topPriorityLabel}; evidence ${snapshot.topPriorityEvidenceKey}; ` +
    `command addressable ${snapshot.commandCanAddressTopBlocker ? "yes" : "no"}; next action: ${snapshot.nextAction}`
  );
}

export function buildPhase3ClearanceBlockerPriority(
  input: Phase3ClearanceBlockerPriorityInput
): Phase3ClearanceBlockerPrioritySnapshot {
  const items = input.clearancePackage.blockers
    .map((blocker) => {
      const kind = kindForBlocker(blocker.id);
      const commandAddressable = canUseSmokeCommand(kind, input.commandPlan);
      const item: Phase3ClearanceBlockerPriorityItem = {
        id: `${SNAPSHOT_ID}:${blocker.id}`,
        blockerId: blocker.id,
        label: blocker.label,
        kind,
        status: blocker.state,
        severity: severityForBlocker(blocker, kind),
        priority: 0,
        canUseSmokeCommand: commandAddressable,
        detail: buildDetail(blocker, kind, commandAddressable),
        nextAction: commandAddressable
          ? `Run ${SMOKE_COMMAND} locally when desktop session start is available.`
          : publicText(blocker.nextAction, "Resolve this Phase 3 blocker before handoff."),
        pmTaskId: blocker.pmTaskId,
        evidenceKey: blocker.evidenceKey
      };

      return item;
    })
    .sort(
      (left, right) =>
        priorityLaneRank(left.kind) - priorityLaneRank(right.kind) ||
        stateRank(left.status) - stateRank(right.status) ||
        kindRank(left.kind) - kindRank(right.kind) ||
        smokeOrder(left.blockerId) - smokeOrder(right.blockerId) ||
        left.label.localeCompare(right.label)
    )
    .map((item, index) => ({ ...item, priority: index + 1 }));
  const state = resolveState(input.clearancePackage);
  const topItem = items[0];
  const commandAddressableCount = items.filter((item) => item.canUseSmokeCommand).length;
  const draft = {
    id: SNAPSHOT_ID,
    label: SNAPSHOT_LABEL,
    state,
    statusLabel: STATUS_LABELS[state],
    readiness: input.clearancePackage.canExit ? 100 : input.clearancePackage.readiness,
    openBlockerCount: items.length,
    commandAddressableCount,
    topPriorityLabel: topItem?.label ?? "No open Phase 3 blocker",
    topPriorityEvidenceKey: topItem?.evidenceKey ?? "phase3.clearance.none",
    topPriorityPmTaskId: topItem?.pmTaskId ?? "phase-03-child-handoff-gate",
    topPriorityAction:
      topItem?.nextAction ??
      "Record the Phase 3 handoff after owner review and keep proof-export offline verification trusted.",
    commandCanAddressTopBlocker: topItem?.canUseSmokeCommand === true,
    nextAction:
      topItem?.nextAction ??
      "No Phase 3 blockers remain; record the owner-reviewed handoff before Phase 4 review resumes and proof-export offline verification is trusted.",
    safety: SAFETY,
    items
  };

  return {
    ...draft,
    ariaLabel: buildAriaLabel(draft)
  };
}
