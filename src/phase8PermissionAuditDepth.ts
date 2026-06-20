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
import {
  buildPhase8AuditEvidenceFingerprint,
  type Phase8AuditReviewRecord
} from "./phase8AuditReviewRecord";

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

export type Phase8PermissionAuditExceptionSeverity =
  | "critical"
  | "high"
  | "medium";

export interface Phase8PermissionAuditDepthItem {
  id: string;
  label: string;
  kind: Phase8PermissionAuditRequirementKind;
  status: Phase8PermissionAuditDepthState;
  detail: string;
  nextAction: string;
  pmTaskId: string;
  evidenceKey: string;
}

export interface Phase8PermissionAuditException {
  id: string;
  label: string;
  severity: Phase8PermissionAuditExceptionSeverity;
  status: Phase8PermissionAuditDepthState;
  disabledPath: string;
  evidenceRequired: string;
  rollbackExpectation: string;
  auditSource: string;
  pmTaskId: string;
  evidenceKey: string;
  riskExceptionProof?: string;
}

type Phase8PermissionAuditDepthItemDraft = Omit<
  Phase8PermissionAuditDepthItem,
  "pmTaskId" | "evidenceKey"
>;

export interface Phase8PermissionAuditDepthSnapshot {
  id: string;
  label: string;
  state: Phase8PermissionAuditDepthState;
  statusLabel: string;
  readiness: number;
  riskyActionCount: number;
  auditRecordCount: number;
  disabledPathCount: number;
  openExceptionCount: number;
  readyCount: number;
  reviewCount: number;
  blockedCount: number;
  waitingCount: number;
  permissionLabelSummaryProof?: string;
  riskExceptionSummaryProof?: string;
  nextAction: string;
  safety: string;
  ariaLabel: string;
  items: Phase8PermissionAuditDepthItem[];
  exceptions: Phase8PermissionAuditException[];
}

export interface Phase8PermissionAuditDepthInput {
  liveActionSummaries: readonly LiveActionPermissionRequestSummary[];
  liveActionAuditRecords: readonly LiveActionAuditRecord[];
  runtimeExecutionAudit: RuntimeExecutionAuditSnapshot;
  runtimeExecutionAuditHistory: readonly RuntimeExecutionAuditRecord[];
  runtimeProfilePermissionApproval: RuntimeProfilePermissionApprovalSnapshot;
  runtimeProfilePermissionAudit: RuntimeProfilePermissionAuditSnapshot;
  runtimeProfilePermissionRequestHistory: readonly RuntimeProfilePermissionRequestRecord[];
  ownerAuditReviewRecord?: Phase8AuditReviewRecord;
}

const SNAPSHOT_ID = "phase-08-permission-audit-depth";
const SNAPSHOT_LABEL = "Phase 8 permission and audit depth";
const PHASE8_AUDIT_SAFETY =
  "Phase 8 review only. Missing permission, approval, evidence, and rollback requirements are explained without granting access or running actions.";
const PHASE8_TRACE_BY_KIND: Record<
  Phase8PermissionAuditRequirementKind,
  { pmTaskId: string; evidencePrefix: string }
> = {
  permission: {
    pmTaskId: "phase-08-child-permission-labels",
    evidencePrefix: "phase8.permission-scope"
  },
  approval: {
    pmTaskId: "phase-08-child-risk-blockers",
    evidencePrefix: "phase8.approval-gate"
  },
  evidence: {
    pmTaskId: "phase-08-child-audit-persistence",
    evidencePrefix: "phase8.audit-evidence"
  },
  rollback: {
    pmTaskId: "phase-08-child-risk-exceptions",
    evidencePrefix: "phase8.rollback-expectation"
  }
};

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

function exceptionSeverity(
  item: Phase8PermissionAuditDepthItem
): Phase8PermissionAuditExceptionSeverity {
  if (item.status === "blocked") {
    return "critical";
  }

  if (item.kind === "approval" || item.kind === "rollback") {
    return "high";
  }

  return "medium";
}

function disabledPathForItem(item: Phase8PermissionAuditDepthItem): string {
  switch (item.kind) {
    case "approval":
      return "Execution stays disabled until the approval state is explicit, current, and auditable.";
    case "evidence":
      return "Execution stays disabled until matching evidence and audit records can be reviewed.";
    case "rollback":
      return "Mutation paths stay disabled until rollback expectations are visible before execution.";
    case "permission":
    default:
      return "Access stays disabled until the permission scope is requested, reviewed, and recorded.";
  }
}

function evidenceRequiredForItem(item: Phase8PermissionAuditDepthItem): string {
  switch (item.kind) {
    case "approval":
      return "Approval decision, requester, risk level, timestamp, and audit record.";
    case "evidence":
      return "Dry-run or preview evidence, execution-lock state, and durable audit trail.";
    case "rollback":
      return "Rollback owner, expected reversal path, affected surface, and audit note.";
    case "permission":
    default:
      return "Permission scope, provider, requested action, reviewer, and blocked-path reason.";
  }
}

function rollbackExpectationForItem(item: Phase8PermissionAuditDepthItem): string {
  if (item.kind === "rollback") {
    return "Attach rollback notes before any executed or failed mutation record can advance.";
  }

  if (item.kind === "approval") {
    return "Approval does not imply execution; rollback notes are still required before mutation.";
  }

  return "Keep rollback evidence required before this gate can unlock mutation-capable work.";
}

function auditSourceForItem(item: Phase8PermissionAuditDepthItem): string {
  switch (item.kind) {
    case "approval":
      return "permission request history";
    case "evidence":
      return "execution audit history";
    case "rollback":
      return "rollback review notes";
    case "permission":
    default:
      return "permission review record";
  }
}

function evidenceSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 52) || "record";
}

function permissionLabelProof(
  summary: LiveActionPermissionRequestSummary,
  label: "approval-required" | "blocked" | "preview-only" | "ready"
): string {
  return (
    `permissionLabelProof=provider=${summary.provider} label=${label} ` +
    `state=${summary.state} risk=${summary.risk} requestedBy=${summary.requestedBy || "unknown"}`
  );
}

function permissionLabelForSummary(
  summary: LiveActionPermissionRequestSummary
): "approval-required" | "blocked" | "preview-only" | "ready" {
  if (summary.state === "denied" || summary.state === "timed-out") {
    return "blocked";
  }
  if (summary.state === "requested") {
    return "approval-required";
  }
  if (summary.state === "approved") {
    return "ready";
  }
  return "preview-only";
}

function buildPermissionLabelSummaryProof(
  summaries: readonly LiveActionPermissionRequestSummary[]
): string {
  const counts = {
    "approval-required": 0,
    blocked: 0,
    "preview-only": 0,
    ready: 0
  };

  for (const summary of summaries) {
    counts[permissionLabelForSummary(summary)] += 1;
  }

  return (
    `permissionLabelSummaryProof=total=${summaries.length} previewOnly=${counts["preview-only"]} ` +
    `approvalRequired=${counts["approval-required"]} blocked=${counts.blocked} ready=${counts.ready}`
  );
}

function withTraceability(
  item: Omit<Phase8PermissionAuditDepthItem, "pmTaskId" | "evidenceKey">
): Phase8PermissionAuditDepthItem {
  const trace = PHASE8_TRACE_BY_KIND[item.kind];

  return {
    ...item,
    pmTaskId: trace.pmTaskId,
    evidenceKey: `${trace.evidencePrefix}.${evidenceSlug(item.id)}`
  };
}

function buildExceptionRecords(
  items: readonly Phase8PermissionAuditDepthItem[]
): Phase8PermissionAuditException[] {
  return items.map((item) => ({
    id: `${item.id}:risk-exception`,
    label: item.label,
    severity: exceptionSeverity(item),
    status: item.status,
    disabledPath: disabledPathForItem(item),
    evidenceRequired: evidenceRequiredForItem(item),
    rollbackExpectation: rollbackExpectationForItem(item),
    auditSource: auditSourceForItem(item),
    pmTaskId: item.pmTaskId,
    evidenceKey: `${item.evidenceKey}.exception`,
    riskExceptionProof:
      `riskExceptionProof=source=${item.id} status=${item.status} severity=${exceptionSeverity(item)} ` +
      `pm=${item.pmTaskId} evidence=${item.evidenceKey}.exception auditSource=${evidenceSlug(auditSourceForItem(item))}`
  }));
}

function buildRiskExceptionSummaryProof(
  exceptions: readonly Phase8PermissionAuditException[]
): string {
  const counts = {
    blocked: 0,
    critical: 0,
    high: 0,
    medium: 0,
    ready: 0,
    review: 0,
    waiting: 0
  };

  for (const exception of exceptions) {
    counts[exception.status] += 1;
    counts[exception.severity] += 1;
  }

  return (
    `riskExceptionSummaryProof=total=${exceptions.length} ready=${counts.ready} ` +
    `review=${counts.review} blocked=${counts.blocked} waiting=${counts.waiting} ` +
    `critical=${counts.critical} high=${counts.high} medium=${counts.medium}`
  );
}

function liveActionItem(
  summary: LiveActionPermissionRequestSummary
): Phase8PermissionAuditDepthItemDraft {
  if (summary.state === "denied" || summary.state === "timed-out") {
    return {
      id: `phase8-live-action-${summary.id}`,
      label: summary.actionLabel,
      kind: "approval",
      status: "blocked",
      detail:
        `${summary.provider} is ${summary.state}; the risky action remains locked and has an explicit blocked branch. ` +
        permissionLabelProof(summary, "blocked"),
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
        `${summary.provider} is waiting on an approval decision for ${summary.risk} risk work. ` +
        permissionLabelProof(summary, "approval-required"),
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
        `${summary.provider} approval is visible; execution still requires action-scoped evidence and audit capture. ` +
        permissionLabelProof(summary, "ready"),
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
      `${summary.provider} has no active permission request; state, risk, requester, and detail are visible. ` +
      permissionLabelProof(summary, "preview-only"),
    nextAction:
      `Request permission for ${summary.actionLabel} or leave the action locked with this explanation.`
  };
}

function runtimeLaunchApprovalItem(
  audit: RuntimeExecutionAuditSnapshot
): Phase8PermissionAuditDepthItemDraft {
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
): Phase8PermissionAuditDepthItemDraft {
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
): Phase8PermissionAuditDepthItemDraft {
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
): Phase8PermissionAuditDepthItemDraft {
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

function auditPersistenceItem(input: Phase8PermissionAuditDepthInput): Phase8PermissionAuditDepthItemDraft {
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

function hasRecordSpecificRollbackReview(record: LiveActionAuditRecord): boolean {
  const combinedEvidence = [
    record.resultSummary,
    ...(record.rawTranscript ?? [])
  ].join(" ").toLowerCase();

  return (
    combinedEvidence.includes("rollback") &&
    (combinedEvidence.includes("owner") ||
      combinedEvidence.includes("path") ||
      combinedEvidence.includes("review") ||
      combinedEvidence.includes("note"))
  );
}

function rollbackRequirementItem(input: Phase8PermissionAuditDepthInput): Phase8PermissionAuditDepthItemDraft {
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
    const recordsMissingRollbackReview = executedRecords.filter(
      (record) => !hasRecordSpecificRollbackReview(record)
    );

    if (recordsMissingRollbackReview.length === 0) {
      return {
        id: `${SNAPSHOT_ID}:rollback-requirement`,
        label: "Rollback requirement",
        kind: "rollback",
        status: "ready",
        detail:
          `${executedRecords.length} executed or failed live-action record${executedRecords.length === 1 ? "" : "s"} include record-specific rollback review evidence.`,
        nextAction:
          "Keep rollback owner, path, and review notes attached to each executed or failed audit record before mutation paths grow."
      };
    }

    return {
      id: `${SNAPSHOT_ID}:rollback-requirement`,
      label: "Rollback requirement",
      kind: "rollback",
      status: "review",
      detail:
        `${recordsMissingRollbackReview.length}/${executedRecords.length} executed or failed live-action record${executedRecords.length === 1 ? "" : "s"} need record-specific rollback owner, path, or review notes before broader mutation paths grow.`,
      nextAction:
        "Attach rollback owner, rollback path, and rollback review notes to each executed or failed live-action record before continuing."
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

function ownerAuditReviewItem(
  record: Phase8AuditReviewRecord | undefined,
  currentAuditEvidenceFingerprint: string
): Phase8PermissionAuditDepthItemDraft {
  if (!record) {
    return {
      id: `${SNAPSHOT_ID}:owner-audit-review`,
      label: "Owner audit review",
      kind: "rollback",
      status: "waiting",
      detail:
        "No local owner audit review record is attached for Phase 8 permission, audit, disabled-path, and rollback evidence.",
      nextAction:
        "Record owner audit review after checking permission, approval, evidence, rollback, exception, and disabled-path rows."
    };
  }

  const auditPersistenceProof =
    record.auditPersistenceProof ??
    `auditPersistenceProof=state=${record.state} readiness=${record.readiness} records=${record.auditRecordCount} openExceptions=${record.openExceptionCount} disabledPaths=${record.disabledPathCount} mutationLocked=${record.mutationLocked ? "yes" : "no"} fingerprint=${record.auditEvidenceFingerprint || "missing"} topBlocker=${record.topBlockerSourceId || "none"} topStatus=${record.topBlockerStatus || "ready"}`;

  if (!record.mutationLocked) {
    return {
      id: `${SNAPSHOT_ID}:owner-audit-review`,
      label: "Owner audit review",
      kind: "rollback",
      status: "blocked",
      detail:
        "The local owner audit review record does not preserve the mutation lock.",
      nextAction:
        "Clear and recreate the Phase 8 owner audit review record while mutation paths remain locked."
    };
  }

  if (!record.auditEvidenceFingerprint) {
    return {
      id: `${SNAPSHOT_ID}:owner-audit-review`,
      label: "Owner audit review",
      kind: "rollback",
      status: "review",
      detail:
        "The local owner audit review record predates Phase 8 audit evidence fingerprinting.",
      nextAction:
        "Record owner audit review again so it can be matched to current permission, approval, evidence, rollback, exception, and disabled-path rows."
    };
  }

  if (record.auditEvidenceFingerprint !== currentAuditEvidenceFingerprint) {
    return {
      id: `${SNAPSHOT_ID}:owner-audit-review`,
      label: "Owner audit review",
      kind: "rollback",
      status: "review",
      detail:
        `Owner audit review fingerprint ${record.auditEvidenceFingerprint} does not match current audit evidence ${currentAuditEvidenceFingerprint}. ${auditPersistenceProof} ${record.rollbackEvidence}`,
      nextAction:
        "Re-record owner audit review after checking the current Phase 8 permission, audit, rollback, exception, and disabled-path evidence."
    };
  }

  if (record.openExceptionCount > 0 || record.state === "review" || record.state === "waiting") {
    return {
      id: `${SNAPSHOT_ID}:owner-audit-review`,
      label: "Owner audit review",
      kind: "rollback",
      status: "review",
      detail:
        `${record.openExceptionCount} open exception${record.openExceptionCount === 1 ? "" : "s"} were present when owner audit review was recorded. ${auditPersistenceProof} ${record.rollbackEvidence}`,
      nextAction:
        "Resolve or explicitly re-review open exceptions before treating Phase 8 audit depth as trusted."
    };
  }

  if (record.state === "blocked") {
    return {
      id: `${SNAPSHOT_ID}:owner-audit-review`,
      label: "Owner audit review",
      kind: "rollback",
      status: "blocked",
      detail: `Owner audit review was recorded while Phase 8 was blocked. ${auditPersistenceProof} ${record.rollbackEvidence}`,
      nextAction:
        "Clear blocked owner review evidence, resolve the blocker, and record review again."
    };
  }

  return {
    id: `${SNAPSHOT_ID}:owner-audit-review`,
    label: "Owner audit review",
    kind: "rollback",
    status: "ready",
    detail:
      `Owner audit review is recorded at ${record.readiness}% readiness with ${record.auditRecordCount} audit records and ${record.disabledPathCount} disabled paths. ${auditPersistenceProof} ${record.rollbackEvidence}`,
    nextAction:
      "Keep the local owner audit review record attached while mutation-capable paths remain locked."
  };
}

function buildAriaLabel(snapshot: Omit<Phase8PermissionAuditDepthSnapshot, "ariaLabel">): string {
  return (
    `${snapshot.label}: ${snapshot.statusLabel}; ${snapshot.readiness}% ready; ` +
    `${snapshot.readyCount} ready, ${snapshot.reviewCount} review, ` +
    `${snapshot.blockedCount} blocked, ${snapshot.waitingCount} waiting; ` +
    `${snapshot.openExceptionCount} open exceptions across ${snapshot.disabledPathCount} disabled paths; ` +
    `${snapshot.permissionLabelSummaryProof ?? "permissionLabelSummaryProof=unavailable"}; ` +
    `${snapshot.riskExceptionSummaryProof ?? "riskExceptionSummaryProof=unavailable"}; ` +
    `next action: ${snapshot.nextAction}`
  );
}

export function buildPhase8PermissionAuditDepth(
  input: Phase8PermissionAuditDepthInput
): Phase8PermissionAuditDepthSnapshot {
  const riskyLiveActionSummaries = input.liveActionSummaries.filter(
    (summary) => summary.isRiskGated
  );
  const riskyLiveActionItems = input.liveActionSummaries
    .filter((summary) => summary.isRiskGated)
    .map(liveActionItem);
  const permissionLabelSummaryProof = buildPermissionLabelSummaryProof(riskyLiveActionSummaries);
  const baseItems = [
    ...riskyLiveActionItems,
    runtimeLaunchApprovalItem(input.runtimeExecutionAudit),
    runtimeExecutionAuditItem(input.runtimeExecutionAudit),
    profilePermissionApprovalItem(input.runtimeProfilePermissionApproval),
    profilePermissionAuditItem(input.runtimeProfilePermissionAudit),
    auditPersistenceItem(input),
    rollbackRequirementItem(input)
  ].map(withTraceability);
  const baseExceptions = buildExceptionRecords(baseItems);
  const baseRiskExceptionSummaryProof = buildRiskExceptionSummaryProof(baseExceptions);
  const baseState = resolveSnapshotState(baseItems);
  const baseReadyCount = baseItems.filter((item) => item.status === "ready").length;
  const baseReviewCount = baseItems.filter((item) => item.status === "review").length;
  const baseBlockedCount = baseItems.filter((item) => item.status === "blocked").length;
  const baseWaitingCount = baseItems.filter((item) => item.status === "waiting").length;
  const auditRecordCount =
    input.liveActionAuditRecords.length +
    input.runtimeExecutionAuditHistory.length +
    input.runtimeProfilePermissionRequestHistory.length +
    input.runtimeProfilePermissionAudit.recordCount;
  const baseDraft = {
    id: SNAPSHOT_ID,
    label: SNAPSHOT_LABEL,
    state: baseState,
    statusLabel: STATUS_LABELS[baseState],
    readiness: calculateReadiness(baseItems),
    riskyActionCount: riskyLiveActionItems.length,
    auditRecordCount,
    disabledPathCount: baseExceptions.length,
    openExceptionCount: baseExceptions.filter((exception) => exception.status !== "ready").length,
    readyCount: baseReadyCount,
    reviewCount: baseReviewCount,
    blockedCount: baseBlockedCount,
    waitingCount: baseWaitingCount,
    permissionLabelSummaryProof,
    riskExceptionSummaryProof: baseRiskExceptionSummaryProof,
    nextAction: findNextAction(baseItems),
    safety: PHASE8_AUDIT_SAFETY,
    ariaLabel: "",
    items: baseItems,
    exceptions: baseExceptions
  };
  const currentAuditEvidenceFingerprint = buildPhase8AuditEvidenceFingerprint(baseDraft);
  const items = [
    ...baseItems,
    withTraceability(ownerAuditReviewItem(input.ownerAuditReviewRecord, currentAuditEvidenceFingerprint))
  ];

  const state = resolveSnapshotState(items);
  const readiness = calculateReadiness(items);
  const readyCount = items.filter((item) => item.status === "ready").length;
  const reviewCount = items.filter((item) => item.status === "review").length;
  const blockedCount = items.filter((item) => item.status === "blocked").length;
  const waitingCount = items.filter((item) => item.status === "waiting").length;
  const exceptions = buildExceptionRecords(items);
  const riskExceptionSummaryProof = buildRiskExceptionSummaryProof(exceptions);
  const openExceptionCount = exceptions.filter(
    (exception) => exception.status !== "ready"
  ).length;
  const nextAction = findNextAction(items);
  const draft = {
    id: SNAPSHOT_ID,
    label: SNAPSHOT_LABEL,
    state,
    statusLabel: STATUS_LABELS[state],
    readiness,
    riskyActionCount: riskyLiveActionItems.length,
    auditRecordCount,
    disabledPathCount: exceptions.length,
    openExceptionCount,
    readyCount,
    reviewCount,
    blockedCount,
    waitingCount,
    permissionLabelSummaryProof,
    riskExceptionSummaryProof,
    nextAction,
    safety: PHASE8_AUDIT_SAFETY,
    items,
    exceptions
  };

  return {
    ...draft,
    ariaLabel: buildAriaLabel(draft)
  };
}
