import type {
  LiveActionAuditRecord
} from "./liveActionAudit";
import type {
  LiveActionPermissionRequestSummary
} from "./liveActionPermission";
import type {
  RuntimeExecutionAuditSnapshot
} from "./runtimeExecutionAudit";
import type {
  RuntimeExecutionAuditRecord
} from "./runtimeExecutionAuditHistory";
import type {
  RuntimeProfilePermissionApprovalSnapshot
} from "./runtimeProfilePermissionApproval";
import type {
  RuntimeProfilePermissionAuditSnapshot
} from "./runtimeProfilePermissionAudit";
import type {
  RuntimeProfilePermissionRequestRecord
} from "./runtimeProfilePermissionRequestHistory";

export type Phase8PermissionAuditDepthState =
  | "ready"
  | "review"
  | "blocked"
  | "waiting";

export type Phase8PermissionAuditRequirementKind =
  | "permission"
  | "approval"
  | "evidence"
  | "rollback";

export interface Phase8PermissionAuditDepthItem {
  id: string;
  label: string;
  kind: Phase8PermissionAuditRequirementKind;
  status: Phase8PermissionAuditDepthState;
  detail: string;
  nextAction: string;
}

export interface Phase8PermissionAuditDepthSnapshot {
  id: string;
  label: string;
  state: Phase8PermissionAuditDepthState;
  statusLabel: string;
  readiness: number;
  riskyActionCount: number;
  auditRecordCount: number;
  readyCount: number;
  reviewCount: number;
  blockedCount: number;
  waitingCount: number;
  nextAction: string;
  safety: string;
  ariaLabel: string;
  items: Phase8PermissionAuditDepthItem[];
}

export interface Phase8PermissionAuditDepthInput {
  liveActionSummaries: readonly LiveActionPermissionRequestSummary[];
  liveActionAuditRecords: readonly LiveActionAuditRecord[];
  runtimeExecutionAudit: RuntimeExecutionAuditSnapshot;
  runtimeExecutionAuditHistory: readonly RuntimeExecutionAuditRecord[];
  runtimeProfilePermissionApproval: RuntimeProfilePermissionApprovalSnapshot;
  runtimeProfilePermissionAudit: RuntimeProfilePermissionAuditSnapshot;
  runtimeProfilePermissionRequestHistory: readonly RuntimeProfilePermissionRequestRecord[];
}

const SNAPSHOT_ID = "phase-08-permission-audit-depth";
const SNAPSHOT_LABEL = "Phase 8 permission and audit depth";
const PHASE8_AUDIT_SAFETY =
  "Phase 8 review only. Missing permission, approval, evidence, and rollback requirements are explained without granting access or running actions.";

const STATUS_LABELS: Record<Phase8PermissionAuditDepthState, string> = {
  ready: "Ready",
  review: "Review",
  blocked: "Blocked",
  waiting: "Waiting"
};

function statusWeight(status: Phase8PermissionAuditDepthState): number {
  switch (status) {
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

function resolveSnapshotState(
  items: readonly Phase8PermissionAuditDepthItem[]
): Phase8PermissionAuditDepthState {
  if (items.length === 0) {
    return "waiting";
  }

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

function calculateReadiness(
  items: readonly Phase8PermissionAuditDepthItem[]
): number {
  if (items.length === 0) {
    return 0;
  }

  const total = items.reduce((sum, item) => sum + statusWeight(item.status), 0);
  return Math.round(total / items.length);
}

function findNextAction(
  items: readonly Phase8PermissionAuditDepthItem[]
): string {
  return (
    items.find((item) => item.status === "blocked")?.nextAction ??
    items.find((item) => item.status === "review")?.nextAction ??
    items.find((item) => item.status === "waiting")?.nextAction ??
    "Keep permission, approval, evidence, and rollback explanations visible while mutation paths stay locked."
  );
}

function liveActionItem(
  summary: LiveActionPermissionRequestSummary
): Phase8PermissionAuditDepthItem {
  if (summary.state === "denied" || summary.state === "timed-out") {
    return {
      id: `phase8-live-action-${summary.id}`,
      label: summary.actionLabel,
      kind: "approval",
      status: "blocked",
      detail:
        `${summary.provider} is ${summary.state}; the risky action remains locked and has an explicit blocked branch.`,
      nextAction:
        `Reset or re-request approval for ${summary.actionLabel} before any execution evidence can be accepted.`
    };
  }

  if (summary.state === "requested") {
    return {
      id: `phase8-live-action-${summary.id}`,
      label: summary.actionLabel,
      kind: "approval",
      status: "review",
      detail:
        `${summary.provider} is waiting on an approval decision for ${summary.risk} risk work.`,
      nextAction:
        `Approve, deny, time out, or cancel ${summary.actionLabel}; do not execute while approval is pending.`
    };
  }

  if (summary.state === "approved") {
    return {
      id: `phase8-live-action-${summary.id}`,
      label: summary.actionLabel,
      kind: "evidence",
      status: "ready",
      detail:
        `${summary.provider} approval is visible; execution still requires action-scoped evidence and audit capture.`,
      nextAction:
        `Collect dry-run or runner evidence for ${summary.actionLabel} and keep rollback expectations visible.`
    };
  }

  return {
    id: `phase8-live-action-${summary.id}`,
    label: summary.actionLabel,
    kind: "permission",
    status: "waiting",
    detail:
      `${summary.provider} has no active permission request; state, risk, requester, and detail are visible.`,
    nextAction:
      `Request permission for ${summary.actionLabel} or leave the action locked with this explanation.`
  };
}

function runtimeLaunchApprovalItem(
  audit: RuntimeExecutionAuditSnapshot
): Phase8PermissionAuditDepthItem {
  if (audit.state === "blocked") {
    return {
      id: `${audit.id}:phase8-launch-approval`,
      label: "Runtime launch approval",
      kind: "approval",
      status: "blocked",
      detail: audit.detail,
      nextAction:
        "Resolve launch request blockers before runtime approval can be requested."
    };
  }

  if (audit.state === "pending") {
    return {
      id: `${audit.id}:phase8-launch-approval`,
      label: "Runtime launch approval",
      kind: "approval",
      status: "review",
      detail: audit.detail,
      nextAction:
        "Review or cancel the local approval request while runtime execution remains locked."
    };
  }

  if (audit.state === "ready") {
    return {
      id: `${audit.id}:phase8-launch-approval`,
      label: "Runtime launch approval",
      kind: "approval",
      status: "ready",
      detail: audit.detail,
      nextAction:
        "Request approval only after confirming launch, evidence, and rollback context."
    };
  }

  return {
    id: `${audit.id}:phase8-launch-approval`,
    label: "Runtime launch approval",
    kind: "approval",
    status: "waiting",
    detail: audit.detail,
    nextAction:
      "Attach runtime handoff prerequisites before requesting approval."
  };
}

function runtimeExecutionAuditItem(
  audit: RuntimeExecutionAuditSnapshot
): Phase8PermissionAuditDepthItem {
  if (audit.state === "blocked") {
    return {
      id: `${audit.id}:phase8-execution-evidence`,
      label: "Runtime execution evidence",
      kind: "evidence",
      status: "blocked",
      detail: audit.detail,
      nextAction:
        "Clear launch readiness blockers before execution audit evidence can be reviewed."
    };
  }

  if (audit.state === "pending") {
    return {
      id: `${audit.id}:phase8-execution-evidence`,
      label: "Runtime execution evidence",
      kind: "evidence",
      status: "review",
      detail: audit.detail,
      nextAction:
        "Keep execution locked and record approval history before accepting evidence."
    };
  }

  if (audit.state === "ready") {
    return {
      id: `${audit.id}:phase8-execution-evidence`,
      label: "Runtime execution evidence",
      kind: "evidence",
      status: "ready",
      detail: audit.detail,
      nextAction:
        "Use the audit preview and history before any runtime execution path is unlocked."
    };
  }

  return {
    id: `${audit.id}:phase8-execution-evidence`,
    label: "Runtime execution evidence",
    kind: "evidence",
    status: "waiting",
    detail: audit.detail,
    nextAction:
      "Create or request runtime handoff context before evidence can be accepted."
  };
}

function profilePermissionApprovalItem(
  approval: RuntimeProfilePermissionApprovalSnapshot
): Phase8PermissionAuditDepthItem {
  if (approval.state === "blocked") {
    return {
      id: `${approval.id}:phase8-profile-approval`,
      label: "Profile permission approval",
      kind: "permission",
      status: "blocked",
      detail: approval.detail,
      nextAction:
        "Resolve profile handoff blockers before desktop permission review can continue."
    };
  }

  if (approval.state === "requested") {
    return {
      id: `${approval.id}:phase8-profile-approval`,
      label: "Profile permission approval",
      kind: "approval",
      status: "review",
      detail: approval.detail,
      nextAction:
        "Review or cancel the local profile permission request while execution remains locked."
    };
  }

  if (approval.state === "requestable") {
    return {
      id: `${approval.id}:phase8-profile-approval`,
      label: "Profile permission approval",
      kind: "permission",
      status: "ready",
      detail: approval.detail,
      nextAction:
        "Request profile permission only after audit and rollback expectations are visible."
    };
  }

  return {
    id: `${approval.id}:phase8-profile-approval`,
    label: "Profile permission approval",
    kind: "permission",
    status: "waiting",
    detail: approval.detail,
    nextAction:
      "Review profile permission requirements before handoff approval."
  };
}

function profilePermissionAuditItem(
  audit: RuntimeProfilePermissionAuditSnapshot
): Phase8PermissionAuditDepthItem {
  if (audit.state === "blocked") {
    return {
      id: `${audit.id}:phase8-profile-audit`,
      label: "Profile permission audit",
      kind: "evidence",
      status: "blocked",
      detail: audit.detail,
      nextAction:
        "Clear permission-audit blockers before profile handoff can advance."
    };
  }

  if (audit.state === "pending") {
    return {
      id: `${audit.id}:phase8-profile-audit`,
      label: "Profile permission audit",
      kind: "evidence",
      status: "review",
      detail: audit.detail,
      nextAction:
        "Review the queued profile permission request and export preview."
    };
  }

  if (audit.state === "ready") {
    return {
      id: `${audit.id}:phase8-profile-audit`,
      label: "Profile permission audit",
      kind: "evidence",
      status: "ready",
      detail: audit.detail,
      nextAction:
        "Keep the export preview available while profile execution stays locked."
    };
  }

  return {
    id: `${audit.id}:phase8-profile-audit`,
    label: "Profile permission audit",
    kind: "evidence",
    status: "waiting",
    detail: audit.detail,
    nextAction:
      "Create a permission request record or export preview before profile handoff."
  };
}

function auditPersistenceItem(input: Phase8PermissionAuditDepthInput): Phase8PermissionAuditDepthItem {
  const auditRecordCount =
    input.liveActionAuditRecords.length +
    input.runtimeExecutionAuditHistory.length +
    input.runtimeProfilePermissionRequestHistory.length +
    input.runtimeProfilePermissionAudit.recordCount;

  if (auditRecordCount > 0 || input.runtimeProfilePermissionAudit.canExport) {
    return {
      id: `${SNAPSHOT_ID}:audit-persistence`,
      label: "Audit persistence",
      kind: "evidence",
      status: "ready",
      detail:
        `${auditRecordCount} local audit records or export-ready permission previews are available.`,
      nextAction:
        "Keep appending request, cancellation, approval, denial, and dry-run records before mutations grow."
    };
  }

  return {
    id: `${SNAPSHOT_ID}:audit-persistence`,
    label: "Audit persistence",
    kind: "evidence",
    status: "waiting",
    detail:
      "No local audit record has been created yet for live actions, runtime approval, or profile permission requests.",
    nextAction:
      "Create at least one request, cancellation, approval, denial, or export preview record before treating audit depth as ready."
  };
}

function rollbackRequirementItem(input: Phase8PermissionAuditDepthInput): Phase8PermissionAuditDepthItem {
  if (
    !input.runtimeExecutionAudit.executionLocked ||
    !input.runtimeProfilePermissionAudit.executionLocked
  ) {
    return {
      id: `${SNAPSHOT_ID}:rollback-requirement`,
      label: "Rollback requirement",
      kind: "rollback",
      status: "blocked",
      detail:
        "A mutation-capable path appears unlocked before rollback expectations are visible.",
      nextAction:
        "Restore execution locks and require rollback evidence before any mutation-capable path advances."
    };
  }

  const executedRecords = input.liveActionAuditRecords.filter(
    (record) => record.action === "executed" || record.action === "failed"
  );

  if (executedRecords.length > 0) {
    return {
      id: `${SNAPSHOT_ID}:rollback-requirement`,
      label: "Rollback requirement",
      kind: "rollback",
      status: "review",
      detail:
        `${executedRecords.length} executed or failed live-action records need rollback review before broader mutation paths grow.`,
      nextAction:
        "Attach rollback notes to executed or failed live-action records before continuing."
    };
  }

  return {
    id: `${SNAPSHOT_ID}:rollback-requirement`,
    label: "Rollback requirement",
    kind: "rollback",
    status: "ready",
    detail:
      "Runtime and profile execution remain locked; rollback evidence is required before future mutation-capable execution.",
    nextAction:
      "Keep rollback requirements visible for every future executed or failed mutation record."
  };
}

function buildAriaLabel(snapshot: Omit<Phase8PermissionAuditDepthSnapshot, "ariaLabel">): string {
  return (
    `${snapshot.label}: ${snapshot.statusLabel}; ${snapshot.readiness}% ready; ` +
    `${snapshot.readyCount} ready, ${snapshot.reviewCount} review, ` +
    `${snapshot.blockedCount} blocked, ${snapshot.waitingCount} waiting; ` +
    `next action: ${snapshot.nextAction}`
  );
}

export function buildPhase8PermissionAuditDepth(
  input: Phase8PermissionAuditDepthInput
): Phase8PermissionAuditDepthSnapshot {
  const riskyLiveActionItems = input.liveActionSummaries
    .filter((summary) => summary.isRiskGated)
    .map(liveActionItem);
  const items = [
    ...riskyLiveActionItems,
    runtimeLaunchApprovalItem(input.runtimeExecutionAudit),
    runtimeExecutionAuditItem(input.runtimeExecutionAudit),
    profilePermissionApprovalItem(input.runtimeProfilePermissionApproval),
    profilePermissionAuditItem(input.runtimeProfilePermissionAudit),
    auditPersistenceItem(input),
    rollbackRequirementItem(input)
  ];

  const state = resolveSnapshotState(items);
  const readiness = calculateReadiness(items);
  const readyCount = items.filter((item) => item.status === "ready").length;
  const reviewCount = items.filter((item) => item.status === "review").length;
  const blockedCount = items.filter((item) => item.status === "blocked").length;
  const waitingCount = items.filter((item) => item.status === "waiting").length;
  const auditRecordCount =
    input.liveActionAuditRecords.length +
    input.runtimeExecutionAuditHistory.length +
    input.runtimeProfilePermissionRequestHistory.length +
    input.runtimeProfilePermissionAudit.recordCount;
  const nextAction = findNextAction(items);
  const draft = {
    id: SNAPSHOT_ID,
    label: SNAPSHOT_LABEL,
    state,
    statusLabel: STATUS_LABELS[state],
    readiness,
    riskyActionCount: riskyLiveActionItems.length,
    auditRecordCount,
    readyCount,
    reviewCount,
    blockedCount,
    waitingCount,
    nextAction,
    safety: PHASE8_AUDIT_SAFETY,
    items
  };

  return {
    ...draft,
    ariaLabel: buildAriaLabel(draft)
  };
}
