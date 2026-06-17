import type { DispatchReviewRecord } from "./dispatchReviewRecord";

export type Phase7DispatchReviewDepthState =
  | "ready"
  | "review"
  | "blocked"
  | "waiting";

export type Phase7DispatchReviewDepthKind =
  | "role-coverage"
  | "attempt-limit"
  | "handoff-task"
  | "validation-gate"
  | "execution-lock";

export interface Phase7DispatchReviewDepthItem {
  id: string;
  label: string;
  kind: Phase7DispatchReviewDepthKind;
  status: Phase7DispatchReviewDepthState;
  detail: string;
  nextAction: string;
}

export interface Phase7DispatchReviewDepthSnapshot {
  id: string;
  label: string;
  state: Phase7DispatchReviewDepthState;
  statusLabel: string;
  readiness: number;
  reviewRecordCount: number;
  openDepthCount: number;
  roleCoverageCount: number;
  maxAttemptLimit: number;
  handoffTaskCount: number;
  validationGateCount: number;
  latestRecordId?: string;
  nextAction: string;
  safety: string;
  ariaLabel: string;
  items: Phase7DispatchReviewDepthItem[];
}

export interface Phase7DispatchReviewDepthInput {
  records: readonly DispatchReviewRecord[];
  selectedRecord?: DispatchReviewRecord;
}

const SNAPSHOT_ID = "phase-07-dispatch-review-depth";
const SNAPSHOT_LABEL = "Phase 7 dispatch review depth";
const SAFETY =
  "Phase 7 dispatch review depth is local metadata only. It does not spawn workers, launch runtime sessions, run tools, execute commands, write files, call networks, or push branches.";

const STATUS_LABELS: Record<Phase7DispatchReviewDepthState, string> = {
  ready: "Ready",
  review: "Review",
  blocked: "Blocked",
  waiting: "Waiting"
};

function stateWeight(state: Phase7DispatchReviewDepthState): number {
  switch (state) {
    case "ready":
      return 100;
    case "review":
      return 65;
    case "waiting":
      return 30;
    case "blocked":
    default:
      return 0;
  }
}

function resolveState(
  items: readonly Phase7DispatchReviewDepthItem[]
): Phase7DispatchReviewDepthState {
  if (items.length === 0 || items.some((item) => item.status === "waiting")) {
    return "waiting";
  }

  if (items.some((item) => item.status === "blocked")) {
    return "blocked";
  }

  if (items.some((item) => item.status === "review")) {
    return "review";
  }

  return "ready";
}

function calculateReadiness(
  items: readonly Phase7DispatchReviewDepthItem[]
): number {
  if (items.length === 0) {
    return 0;
  }

  return Math.round(
    items.reduce((total, item) => total + stateWeight(item.status), 0) / items.length
  );
}

function findNextAction(items: readonly Phase7DispatchReviewDepthItem[]): string {
  return (
    items.find((item) => item.status === "blocked")?.nextAction ??
    items.find((item) => item.status === "review")?.nextAction ??
    items.find((item) => item.status === "waiting")?.nextAction ??
    "Keep role counts, attempt limits, handoff tasks, validation gates, and the execution lock visible before live worker spawning."
  );
}

function roleCoverageCount(record: DispatchReviewRecord): number {
  return [
    record.roleCounts.orchestrator,
    record.roleCounts.implementer,
    record.roleCounts.validator,
    record.roleCounts.integration
  ].filter((count) => count > 0).length;
}

function runtimeLockReady(record: DispatchReviewRecord): boolean {
  const note = record.noRuntimeExecutionNote.toLowerCase();
  return (
    note.includes("local metadata") &&
    note.includes("do not launch") &&
    note.includes("execute runtime")
  );
}

function waitingItem(
  id: string,
  label: string,
  kind: Phase7DispatchReviewDepthKind,
  detail: string,
  nextAction: string
): Phase7DispatchReviewDepthItem {
  return {
    id,
    label,
    kind,
    status: "waiting",
    detail,
    nextAction
  };
}

function buildItems(record?: DispatchReviewRecord): Phase7DispatchReviewDepthItem[] {
  if (!record) {
    return [
      waitingItem(
        `${SNAPSHOT_ID}:role-coverage`,
        "Role coverage",
        "role-coverage",
        "No dispatch review record is selected yet.",
        "Stage a PM row or pipeline item to create role coverage evidence."
      ),
      waitingItem(
        `${SNAPSHOT_ID}:attempt-limit`,
        "Attempt limits",
        "attempt-limit",
        "No attempt-limit evidence is available yet.",
        "Create a dispatch review record with visible retry limits before live worker spawning."
      ),
      waitingItem(
        `${SNAPSHOT_ID}:handoff-task`,
        "Handoff tasks",
        "handoff-task",
        "No handoff task evidence is available yet.",
        "Create a dispatch review record with scoped worker handoff tasks."
      ),
      waitingItem(
        `${SNAPSHOT_ID}:validation-gate`,
        "Validation gates",
        "validation-gate",
        "No validation gate evidence is available yet.",
        "Create a dispatch review record with explicit validation gates."
      ),
      waitingItem(
        `${SNAPSHOT_ID}:execution-lock`,
        "Live worker lock",
        "execution-lock",
        "No local no-runtime-execution note is available yet.",
        "Keep live worker spawning locked until a local dispatch review record proves the boundary."
      )
    ];
  }

  const coveredRoles = roleCoverageCount(record);
  const roleStatus: Phase7DispatchReviewDepthState =
    coveredRoles === 4 && record.panelCount >= 4
      ? "ready"
      : coveredRoles === 0
        ? "blocked"
        : "review";
  const attemptStatus: Phase7DispatchReviewDepthState =
    record.maxAttemptLimit <= 0
      ? "waiting"
      : record.maxAttemptLimit <= 3
        ? "ready"
        : "review";
  const handoffStatus: Phase7DispatchReviewDepthState =
    record.handoffTaskCount > 0 ? "ready" : "waiting";
  const validationStatus: Phase7DispatchReviewDepthState =
    record.validationGateCount > 0 ? "ready" : "waiting";
  const lockStatus: Phase7DispatchReviewDepthState =
    runtimeLockReady(record) ? "ready" : "blocked";

  return [
    {
      id: `${record.id}:role-coverage`,
      label: "Role coverage",
      kind: "role-coverage",
      status: roleStatus,
      detail: `${coveredRoles}/4 role lanes are represented across ${record.panelCount} panels.`,
      nextAction:
        roleStatus === "ready"
          ? "Keep orchestrator, implementer, validator, and integration lanes visible."
          : "Add missing orchestrator, implementer, validator, or integration lane evidence before dispatch."
    },
    {
      id: `${record.id}:attempt-limit`,
      label: "Attempt limits",
      kind: "attempt-limit",
      status: attemptStatus,
      detail: `Maximum visible attempt limit is ${record.maxAttemptLimit}.`,
      nextAction:
        attemptStatus === "ready"
          ? "Keep retry limits visible for every staged worker role."
          : "Review retry limits before live worker spawning is considered."
    },
    {
      id: `${record.id}:handoff-task`,
      label: "Handoff tasks",
      kind: "handoff-task",
      status: handoffStatus,
      detail: `${record.handoffTaskCount} handoff tasks are attached to this dispatch review.`,
      nextAction:
        handoffStatus === "ready"
          ? "Keep handoff ownership visible through final integration."
          : "Attach worker handoff tasks before dispatch can advance."
    },
    {
      id: `${record.id}:validation-gate`,
      label: "Validation gates",
      kind: "validation-gate",
      status: validationStatus,
      detail: `${record.validationGateCount} validation gates are attached to this dispatch review.`,
      nextAction:
        validationStatus === "ready"
          ? "Keep validation gates linked to the staged review record."
          : "Attach validation gates before worker launch review."
    },
    {
      id: `${record.id}:execution-lock`,
      label: "Live worker lock",
      kind: "execution-lock",
      status: lockStatus,
      detail: record.noRuntimeExecutionNote,
      nextAction:
        lockStatus === "ready"
          ? "Keep live worker spawning locked until explicit runtime approval exists."
          : "Restore the local metadata-only no-runtime-execution note before dispatch review can continue."
    }
  ];
}

function buildAriaLabel(snapshot: Omit<Phase7DispatchReviewDepthSnapshot, "ariaLabel">): string {
  return (
    `${snapshot.label}: ${snapshot.statusLabel}; ${snapshot.readiness}% ready; ` +
    `${snapshot.openDepthCount} open checks; ` +
    `${snapshot.roleCoverageCount}/4 roles; ` +
    `${snapshot.handoffTaskCount} handoff tasks; ` +
    `${snapshot.validationGateCount} validation gates; ` +
    `next action: ${snapshot.nextAction}`
  );
}

export function buildPhase7DispatchReviewDepth(
  input: Phase7DispatchReviewDepthInput
): Phase7DispatchReviewDepthSnapshot {
  const record = input.selectedRecord ?? input.records[0];
  const items = buildItems(record);
  const state = resolveState(items);
  const readiness = calculateReadiness(items);
  const roleCount = record ? roleCoverageCount(record) : 0;
  const nextAction = findNextAction(items);
  const draft = {
    id: SNAPSHOT_ID,
    label: SNAPSHOT_LABEL,
    state,
    statusLabel: STATUS_LABELS[state],
    readiness,
    reviewRecordCount: input.records.length,
    openDepthCount: items.filter((item) => item.status !== "ready").length,
    roleCoverageCount: roleCount,
    maxAttemptLimit: record?.maxAttemptLimit ?? 0,
    handoffTaskCount: record?.handoffTaskCount ?? 0,
    validationGateCount: record?.validationGateCount ?? 0,
    latestRecordId: record?.id,
    nextAction,
    safety: SAFETY,
    items
  };

  return {
    ...draft,
    ariaLabel: buildAriaLabel(draft)
  };
}
