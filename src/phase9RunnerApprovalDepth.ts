import type {
  Phase9RunnerApprovalItem,
  Phase9RunnerApprovalItemKind,
  Phase9RunnerApprovalSnapshot,
  Phase9RunnerApprovalState
} from "./phase9RunnerApproval";

export type Phase9RunnerApprovalDepthKind =
  | "fixed-probe-selection"
  | "owner-approval"
  | "request-preview"
  | "validation-output"
  | "audit-record"
  | "rollback-evidence"
  | "desktop-execution-lock";

export interface Phase9RunnerApprovalDepthRecord {
  id: string;
  label: string;
  kind: Phase9RunnerApprovalDepthKind;
  pmTaskId: string;
  evidenceKey: string;
  status: Phase9RunnerApprovalState;
  statusLabel: string;
  evidence: string;
  nextAction: string;
  locksMutation: boolean;
}

export interface Phase9RunnerApprovalDepthSummary {
  id: string;
  label: string;
  records: Phase9RunnerApprovalDepthRecord[];
  readyCount: number;
  reviewCount: number;
  blockedCount: number;
  waitingCount: number;
  mutationLockCount: number;
  ariaLabel: string;
}

const STATUS_LABELS: Record<Phase9RunnerApprovalState, string> = {
  ready: "Ready",
  review: "Review",
  blocked: "Blocked",
  waiting: "Waiting"
};

const TRACE_BY_KIND: Record<
  Phase9RunnerApprovalDepthKind,
  { pmTaskId: string; evidenceKey: string }
> = {
  "fixed-probe-selection": {
    pmTaskId: "phase-09-child-reversible-action",
    evidenceKey: "phase9.fixed-probe-selection"
  },
  "owner-approval": {
    pmTaskId: "phase-09-parent-approval-flow",
    evidenceKey: "phase9.owner-approval-window"
  },
  "request-preview": {
    pmTaskId: "phase-09-parent-runner-probe",
    evidenceKey: "phase9.runner-request-preview"
  },
  "validation-output": {
    pmTaskId: "phase-09-child-runner-observability",
    evidenceKey: "phase9.validation-output"
  },
  "audit-record": {
    pmTaskId: "phase-09-child-approval-record",
    evidenceKey: "phase9.approval-result-audit"
  },
  "rollback-evidence": {
    pmTaskId: "phase-09-child-approval-depth",
    evidenceKey: "phase9.rollback-evidence"
  },
  "desktop-execution-lock": {
    pmTaskId: "phase-09-child-traceability",
    evidenceKey: "phase9.desktop-execution-lock"
  }
};

function itemByKind(
  snapshot: Phase9RunnerApprovalSnapshot,
  kind: Phase9RunnerApprovalItemKind
): Phase9RunnerApprovalItem | undefined {
  return snapshot.items.find((item) => item.kind === kind);
}

function statusRank(status: Phase9RunnerApprovalState): number {
  switch (status) {
    case "blocked":
      return 4;
    case "review":
      return 3;
    case "waiting":
      return 2;
    case "ready":
    default:
      return 1;
  }
}

function highestPriorityStatus(
  statuses: readonly Phase9RunnerApprovalState[]
): Phase9RunnerApprovalState {
  return statuses.reduce<Phase9RunnerApprovalState>(
    (current, status) => (statusRank(status) > statusRank(current) ? status : current),
    "ready"
  );
}

function recordFromItem(
  id: string,
  kind: Phase9RunnerApprovalDepthKind,
  item: Phase9RunnerApprovalItem,
  locksMutation = false
): Phase9RunnerApprovalDepthRecord {
  return {
    id,
    label: item.label,
    kind,
    pmTaskId: TRACE_BY_KIND[kind].pmTaskId,
    evidenceKey: TRACE_BY_KIND[kind].evidenceKey,
    status: item.status,
    statusLabel: STATUS_LABELS[item.status],
    evidence: item.detail,
    nextAction: item.nextAction,
    locksMutation
  };
}

function missingRecord(
  id: string,
  label: string,
  kind: Phase9RunnerApprovalDepthKind,
  nextAction: string
): Phase9RunnerApprovalDepthRecord {
  return {
    id,
    label,
    kind,
    pmTaskId: TRACE_BY_KIND[kind].pmTaskId,
    evidenceKey: TRACE_BY_KIND[kind].evidenceKey,
    status: "blocked",
    statusLabel: STATUS_LABELS.blocked,
    evidence: "Phase 9 approval depth is missing the source approval target.",
    nextAction,
    locksMutation: true
  };
}

function ownerApprovalRecord(
  snapshot: Phase9RunnerApprovalSnapshot
): Phase9RunnerApprovalDepthRecord {
  const permission = itemByKind(snapshot, "permission");
  const approval = itemByKind(snapshot, "approval");

  if (!permission || !approval) {
    return missingRecord(
      `${snapshot.id}:depth-owner-approval`,
      "Owner approval and window",
      "owner-approval",
      "Restore owner permission and approval-window targets before the desktop runner can proceed."
    );
  }

  const status = highestPriorityStatus([permission.status, approval.status]);

  return {
    id: `${snapshot.id}:depth-owner-approval`,
    label: "Owner approval and window",
    kind: "owner-approval",
    pmTaskId: TRACE_BY_KIND["owner-approval"].pmTaskId,
    evidenceKey: TRACE_BY_KIND["owner-approval"].evidenceKey,
    status,
    statusLabel: STATUS_LABELS[status],
    evidence: `${permission.detail} ${approval.detail}`,
    nextAction:
      status === "ready"
        ? "Keep the owner approval window attached to the selected probe audit trail."
        : `${permission.nextAction} ${approval.nextAction}`,
    locksMutation: true
  };
}

function desktopExecutionLockRecord(
  snapshot: Phase9RunnerApprovalSnapshot
): Phase9RunnerApprovalDepthRecord {
  const selectedActionReady = snapshot.selectedAction === "terminal-readonly-probe";
  const status: Phase9RunnerApprovalState = selectedActionReady ? "ready" : "blocked";

  return {
    id: `${snapshot.id}:depth-desktop-lock`,
    label: "Desktop execution lock",
    kind: "desktop-execution-lock",
    pmTaskId: TRACE_BY_KIND["desktop-execution-lock"].pmTaskId,
    evidenceKey: TRACE_BY_KIND["desktop-execution-lock"].evidenceKey,
    status,
    statusLabel: STATUS_LABELS[status],
    evidence:
      "Only the fixed terminal-readonly-probe can advance after approval; broad terminal, Git, MCP, plugin, automation, runtime, profile, and external-service mutation paths stay locked.",
    nextAction:
      "Keep mutation-capable runner actions disabled until action-specific approval, validation, audit, and rollback evidence are owner-visible.",
    locksMutation: true
  };
}

function buildRecords(
  snapshot: Phase9RunnerApprovalSnapshot
): Phase9RunnerApprovalDepthRecord[] {
  const selectedAction = itemByKind(snapshot, "selected-action");
  const preview = itemByKind(snapshot, "preview");
  const validation = itemByKind(snapshot, "validation");
  const audit = itemByKind(snapshot, "audit");
  const rollback = itemByKind(snapshot, "rollback");

  return [
    selectedAction
      ? recordFromItem(
          `${snapshot.id}:depth-fixed-probe`,
          "fixed-probe-selection",
          selectedAction,
          true
        )
      : missingRecord(
          `${snapshot.id}:depth-fixed-probe`,
          "Fixed probe selection",
          "fixed-probe-selection",
          "Restore the fixed terminal-readonly-probe target before approval review continues."
        ),
    ownerApprovalRecord(snapshot),
    preview
      ? recordFromItem(`${snapshot.id}:depth-preview`, "request-preview", preview, true)
      : missingRecord(
          `${snapshot.id}:depth-preview`,
          "Runner request preview",
          "request-preview",
          "Restore the request preview target before the desktop runner can receive a request."
        ),
    validation
      ? recordFromItem(`${snapshot.id}:depth-validation`, "validation-output", validation)
      : missingRecord(
          `${snapshot.id}:depth-validation`,
          "Validation output",
          "validation-output",
          "Restore validation output before the desktop runner path can be approved."
        ),
    audit
      ? recordFromItem(`${snapshot.id}:depth-audit`, "audit-record", audit)
      : missingRecord(
          `${snapshot.id}:depth-audit`,
          "Approval and result audit",
          "audit-record",
          "Restore audit record tracking before the desktop runner path can be approved."
        ),
    rollback
      ? recordFromItem(`${snapshot.id}:depth-rollback`, "rollback-evidence", rollback, true)
      : missingRecord(
          `${snapshot.id}:depth-rollback`,
          "Rollback evidence",
          "rollback-evidence",
          "Restore rollback evidence before any desktop-backed action expands."
        ),
    desktopExecutionLockRecord(snapshot)
  ];
}

function buildAriaLabel(summary: Omit<Phase9RunnerApprovalDepthSummary, "ariaLabel">): string {
  return (
    `${summary.label}: ${summary.readyCount} ready, ${summary.reviewCount} review, ` +
    `${summary.blockedCount} blocked, ${summary.waitingCount} waiting; ` +
    `${summary.mutationLockCount} mutation locks; records: ` +
    summary.records
      .map((record) => `${record.label} ${record.statusLabel}`)
      .join(", ")
  );
}

export function buildPhase9RunnerApprovalDepthSummary(
  snapshot: Phase9RunnerApprovalSnapshot
): Phase9RunnerApprovalDepthSummary {
  const records = buildRecords(snapshot);
  const draft = {
    id: `${snapshot.id}:depth`,
    label: "Phase 9 runner approval depth",
    records,
    readyCount: records.filter((record) => record.status === "ready").length,
    reviewCount: records.filter((record) => record.status === "review").length,
    blockedCount: records.filter((record) => record.status === "blocked").length,
    waitingCount: records.filter((record) => record.status === "waiting").length,
    mutationLockCount: records.filter((record) => record.locksMutation).length
  };

  return {
    ...draft,
    ariaLabel: buildAriaLabel(draft)
  };
}
