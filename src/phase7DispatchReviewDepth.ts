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
  | "handoff-packet"
  | "validation-gate"
  | "evidence-freshness"
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
  recordEvidenceFingerprint?: string;
  currentEvidenceFingerprint?: string;
  nextAction: string;
  safety: string;
  ariaLabel: string;
  items: Phase7DispatchReviewDepthItem[];
}

export interface Phase7DispatchReviewDepthInput {
  records: readonly DispatchReviewRecord[];
  selectedRecord?: DispatchReviewRecord;
  currentEvidenceFingerprint?: string;
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

function handoffPacketRuntimeLocked(note: string): boolean {
  const normalized = note.toLowerCase();

  return normalized.includes("no runtime execution") || normalized.includes("local preview");
}

function handoffPackets(record: DispatchReviewRecord): DispatchReviewRecord["handoffPackets"] {
  return Array.isArray(record.handoffPackets) ? record.handoffPackets : [];
}

function packetByRole(record: DispatchReviewRecord, role: DispatchReviewRecord["handoffPackets"][number]["role"]) {
  return handoffPackets(record).find((packet) => packet.role === role);
}

function hasMeaningfulList(items: readonly string[]): boolean {
  return items.some((item) => {
    const normalized = item.toLowerCase();
    return (
      item.trim().length > 0 &&
      !normalized.includes("no files listed") &&
      !normalized.includes("no files declared") &&
      !normalized.includes("no owned areas listed")
    );
  });
}

function hasNamedDependency(packet: DispatchReviewRecord["handoffPackets"][number] | undefined, term: string): boolean {
  return Boolean(packet?.dependencies.some((dependency) => dependency.toLowerCase().includes(term)));
}

function handoffPacketStatus(record: DispatchReviewRecord): Phase7DispatchReviewDepthItem {
  const packetsForRecord = handoffPackets(record);

  if (packetsForRecord.length === 0) {
    return {
      id: `${record.id}:handoff-packet`,
      label: "Handoff packet integrity",
      kind: "handoff-packet",
      status: "review",
      detail: "This dispatch review record predates persisted per-role handoff packet summaries.",
      nextAction: "Restage the dispatch review so orchestrator, implementer, validator, and integration packets can be verified."
    };
  }

  const roles = ["orchestrator", "implementer", "validator", "integration"] as const;
  const missingRoles = roles.filter((role) => !packetByRole(record, role));
  const packets = roles.map((role) => packetByRole(record, role)).filter(Boolean);
  const missingOwnership = packets.filter(
    (packet) => !packet || !hasMeaningfulList(packet.ownedAreas) || packet.owner.trim().length === 0
  );
  const missingRuntimeLocks = packets.filter(
    (packet) => packet && !handoffPacketRuntimeLocked(packet.noRuntimeExecutionNote)
  );
  const validator = packetByRole(record, "validator");
  const integration = packetByRole(record, "integration");
  const validatorDependsOnImplementation = hasNamedDependency(validator, "implementer");
  const integrationDependsOnUpstream =
    hasNamedDependency(integration, "planning") &&
    hasNamedDependency(integration, "implementer") &&
    hasNamedDependency(integration, "validation");

  if (missingRuntimeLocks.length > 0) {
    return {
      id: `${record.id}:handoff-packet`,
      label: "Handoff packet integrity",
      kind: "handoff-packet",
      status: "blocked",
      detail: `${missingRuntimeLocks.length} handoff packet${missingRuntimeLocks.length === 1 ? "" : "s"} lost the no-runtime execution boundary.`,
      nextAction: "Restore local preview no-runtime notes on every handoff packet before dispatch review can advance."
    };
  }

  if (missingRoles.length > 0 || missingOwnership.length > 0) {
    return {
      id: `${record.id}:handoff-packet`,
      label: "Handoff packet integrity",
      kind: "handoff-packet",
      status: "blocked",
      detail: `${packetsForRecord.length}/4 role packets are present; ${missingOwnership.length} packet${missingOwnership.length === 1 ? "" : "s"} need owner/file-area evidence.`,
      nextAction: "Restore complete orchestrator, implementer, validator, and integration packet ownership before worker dispatch can be trusted."
    };
  }

  if (!validatorDependsOnImplementation || !integrationDependsOnUpstream) {
    return {
      id: `${record.id}:handoff-packet`,
      label: "Handoff packet integrity",
      kind: "handoff-packet",
      status: "review",
      detail: "Handoff packets are present, but validator or integration dependency order needs owner review.",
      nextAction: "Review validation dependency on implementation and integration dependency on upstream role packets."
    };
  }

  return {
    id: `${record.id}:handoff-packet`,
    label: "Handoff packet integrity",
    kind: "handoff-packet",
    status: "ready",
    detail: "All four role packets carry owners, file areas, dependencies, validation labels, and local no-runtime boundaries.",
    nextAction: "Keep per-role handoff packets attached through final integration review."
  };
}

function evidenceFreshnessStatus(
  record: DispatchReviewRecord,
  currentEvidenceFingerprint?: string
): Phase7DispatchReviewDepthItem {
  if (!record.reviewEvidenceFingerprint) {
    return {
      id: `${record.id}:evidence-freshness`,
      label: "Review evidence freshness",
      kind: "evidence-freshness",
      status: "review",
      detail: "This dispatch review record has no saved evidence fingerprint.",
      nextAction: "Restage the dispatch review so saved evidence can be matched to the current run."
    };
  }

  if (!currentEvidenceFingerprint) {
    return {
      id: `${record.id}:evidence-freshness`,
      label: "Review evidence freshness",
      kind: "evidence-freshness",
      status: "review",
      detail: `Saved evidence fingerprint ${record.reviewEvidenceFingerprint} has no current run comparison.`,
      nextAction: "Select the linked run so Phase 7 can compare the saved review record to current role-panel evidence."
    };
  }

  if (record.reviewEvidenceFingerprint !== currentEvidenceFingerprint) {
    return {
      id: `${record.id}:evidence-freshness`,
      label: "Review evidence freshness",
      kind: "evidence-freshness",
      status: "review",
      detail: `Saved evidence fingerprint ${record.reviewEvidenceFingerprint} does not match current run fingerprint ${currentEvidenceFingerprint}.`,
      nextAction: "Refresh or restage the dispatch review record before trusting handoff closure."
    };
  }

  return {
    id: `${record.id}:evidence-freshness`,
    label: "Review evidence freshness",
    kind: "evidence-freshness",
    status: "ready",
    detail: `Saved dispatch evidence matches current run fingerprint ${record.reviewEvidenceFingerprint}.`,
    nextAction: "Keep current evidence fingerprint matched before final integration review."
  };
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

function buildItems(
  record?: DispatchReviewRecord,
  currentEvidenceFingerprint?: string
): Phase7DispatchReviewDepthItem[] {
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
        `${SNAPSHOT_ID}:handoff-packet`,
        "Handoff packet integrity",
        "handoff-packet",
        "No per-role handoff packet evidence is available yet.",
        "Create a dispatch review record with orchestrator, implementer, validator, and integration packet summaries."
      ),
      waitingItem(
        `${SNAPSHOT_ID}:validation-gate`,
        "Validation gates",
        "validation-gate",
        "No validation gate evidence is available yet.",
        "Create a dispatch review record with explicit validation gates."
      ),
      waitingItem(
        `${SNAPSHOT_ID}:evidence-freshness`,
        "Review evidence freshness",
        "evidence-freshness",
        "No saved dispatch review fingerprint is available yet.",
        "Create a dispatch review record before matching saved evidence to current run state."
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
  const packetItem = handoffPacketStatus(record);
  const freshnessItem = evidenceFreshnessStatus(record, currentEvidenceFingerprint);

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
    packetItem,
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
    freshnessItem,
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

function recordTimestamp(record: DispatchReviewRecord): number {
  const timestamp = Date.parse(record.createdAt);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function newestRecord(records: readonly DispatchReviewRecord[]): DispatchReviewRecord | undefined {
  return [...records].sort((left, right) => recordTimestamp(right) - recordTimestamp(left))[0];
}

export function buildPhase7DispatchReviewDepth(
  input: Phase7DispatchReviewDepthInput
): Phase7DispatchReviewDepthSnapshot {
  const record = input.selectedRecord ?? newestRecord(input.records);
  const items = buildItems(record, input.currentEvidenceFingerprint);
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
    recordEvidenceFingerprint: record?.reviewEvidenceFingerprint,
    currentEvidenceFingerprint: input.currentEvidenceFingerprint,
    nextAction,
    safety: SAFETY,
    items
  };

  return {
    ...draft,
    ariaLabel: buildAriaLabel(draft)
  };
}
